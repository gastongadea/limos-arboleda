const { setCors, handleOptions } = require('./_lib/cors');
const { getSql, ensureSchema } = require('./_lib/db');

/** Columna Z = índice 25 (fallback si no hay header "Misa") */
const COL_MISA_FALLBACK = 25;

function findMisaColumnIndex(headers) {
  const idx = headers.findIndex(
    (h) => String(h || '').trim().toLowerCase() === 'misa'
  );
  return idx >= 0 ? idx : COL_MISA_FALLBACK;
}

function normalizeMisaValor(raw) {
  const v = String(raw == null ? '' : raw).trim().toUpperCase();
  if (v === 'S' || v === 'N' || v === 'A') return v;
  return '';
}

function parseSheetDate(fechaCell) {
  if (!fechaCell) return null;
  const s = String(fechaCell).trim();
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length !== 3) return null;
    let [d, m, y] = parts;
    if (y.length === 2) y = `20${y}`;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  if (s.includes('-') && s.length >= 10) return s.slice(0, 10);
  return null;
}

async function bulkUpsertInscripciones(db, rows) {
  if (!rows.length) return 0;
  // Lotes para no pasar el límite de parámetros / tiempo
  const chunkSize = 200;
  let total = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const fechas = chunk.map((r) => r.fecha);
    const comidas = chunk.map((r) => r.comida);
    const iniciales = chunk.map((r) => r.iniciales);
    const opciones = chunk.map((r) => r.opcion);

    await db`
      INSERT INTO inscripciones (fecha, comida, iniciales, opcion, updated_at, synced_at)
      SELECT f::date, c, i, o, NOW(), NOW()
      FROM UNNEST(
        ${fechas}::text[],
        ${comidas}::text[],
        ${iniciales}::text[],
        ${opciones}::text[]
      ) AS t(f, c, i, o)
      ON CONFLICT (fecha, comida, iniciales)
      DO UPDATE SET
        opcion = EXCLUDED.opcion,
        updated_at = NOW(),
        synced_at = NOW()
    `;
    total += chunk.length;
  }
  return total;
}

async function bulkUpsertMisa(db, rows) {
  if (!rows.length) return 0;
  const fechas = rows.map((r) => r.fecha);
  const valores = rows.map((r) => r.valor);
  await db`
    INSERT INTO misa (fecha, valor, updated_at, synced_at)
    SELECT f::date, v, NOW(), NOW()
    FROM UNNEST(${fechas}::text[], ${valores}::text[]) AS t(f, v)
    ON CONFLICT (fecha)
    DO UPDATE SET
      valor = EXCLUDED.valor,
      updated_at = NOW(),
      synced_at = NOW()
  `;
  return rows.length;
}

module.exports = async function handler(req, res) {
  setCors(res, req);
  if (req.method === 'OPTIONS') return handleOptions(req, res);

  // GET: cron de Vercel; POST: botón / PowerShell
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ success: false, error: 'Usar GET o POST' });
  }

  try {
    await ensureSchema();
    const db = getSql();
    const apiKey = process.env.GOOGLE_API_KEY || process.env.REACT_APP_GOOGLE_API_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID || process.env.REACT_APP_GOOGLE_SHEET_ID;
    if (!apiKey || !sheetId) {
      return res.status(400).json({ success: false, error: 'Faltan GOOGLE_API_KEY / GOOGLE_SHEET_ID' });
    }

    // Rango amplio: hasta columna Z (Misa) y muchas filas
    let response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data!A1:Z5000?key=${apiKey}`
    );
    if (!response.ok) {
      response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:Z5000?key=${apiKey}`
      );
    }
    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ success: false, error: `Sheets: ${response.status} ${err}` });
    }

    const json = await response.json();
    const sheetData = json.values || [];
    if (sheetData.length < 2) {
      return res.status(200).json({ success: true, imported: 0, misa: 0, message: 'Sin filas' });
    }

    const headers = sheetData[0];
    const misaCol = findMisaColumnIndex(headers);
    const inscripciones = [];
    const misaRows = [];

    for (let r = 1; r < sheetData.length; r++) {
      const row = sheetData[r];
      if (!row) continue;
      const fecha = parseSheetDate(row[1]);
      const tipo = String(row[2] || '').trim().toUpperCase();
      if (!fecha || (tipo !== 'A' && tipo !== 'C')) continue;
      const comida = tipo === 'A' ? 'Almuerzo' : 'Cena';

      // Misa solo en fila de almuerzo
      if (tipo === 'A') {
        const misaVal = normalizeMisaValor(row[misaCol]);
        if (misaVal) {
          misaRows.push({ fecha, valor: misaVal });
        }
      }

      for (let c = 3; c < Math.max(headers.length, row.length); c++) {
        if (c === misaCol) continue;
        const iniciales = String(headers[c] || '').trim();
        if (!iniciales || iniciales.toLowerCase() === 'misa') continue;
        const opcion = row[c] == null ? '' : String(row[c]).trim();
        if (opcion === '') continue;
        inscripciones.push({ fecha, comida, iniciales, opcion });
      }
    }

    const imported = await bulkUpsertInscripciones(db, inscripciones);
    const misaImported = await bulkUpsertMisa(db, misaRows);

    return res.status(200).json({
      success: true,
      imported,
      misa: misaImported,
      sheetRows: sheetData.length - 1,
      conflictPolicy: 'sheet_wins',
      message:
        'Import OK: en conflicto gana la planilla (sobrescribe Neon).',
    });
  } catch (error) {
    console.error('import-from-sheets error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
