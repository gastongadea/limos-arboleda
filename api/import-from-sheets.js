const { setCors, handleOptions } = require('./_lib/cors');
const { getSql, ensureSchema } = require('./_lib/db');

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

module.exports = async function handler(req, res) {
  setCors(res, req);
  if (req.method === 'OPTIONS') return handleOptions(req, res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ success: false, error: 'Usar POST' });
  }

  try {
    await ensureSchema();
    const db = getSql();
    const apiKey = process.env.GOOGLE_API_KEY || process.env.REACT_APP_GOOGLE_API_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID || process.env.REACT_APP_GOOGLE_SHEET_ID;
    if (!apiKey || !sheetId) {
      return res.status(400).json({ success: false, error: 'Faltan GOOGLE_API_KEY / GOOGLE_SHEET_ID' });
    }

    let response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data!A1:Z1000?key=${apiKey}`
    );
    if (!response.ok) {
      response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:Z1000?key=${apiKey}`
      );
    }
    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ success: false, error: `Sheets: ${response.status} ${err}` });
    }

    const json = await response.json();
    const sheetData = json.values || [];
    if (sheetData.length < 2) {
      return res.status(200).json({ success: true, imported: 0, message: 'Sin filas' });
    }

    const headers = sheetData[0];
    let imported = 0;

    for (let r = 1; r < sheetData.length; r++) {
      const row = sheetData[r];
      if (!row) continue;
      const fecha = parseSheetDate(row[1]);
      const tipo = String(row[2] || '').trim().toUpperCase();
      if (!fecha || (tipo !== 'A' && tipo !== 'C')) continue;
      const comida = tipo === 'A' ? 'Almuerzo' : 'Cena';

      for (let c = 3; c < headers.length; c++) {
        const iniciales = String(headers[c] || '').trim();
        if (!iniciales || iniciales.toLowerCase() === 'misa') continue;
        const opcion = row[c] == null ? '' : String(row[c]).trim();
        if (opcion === '') continue;

        await db`
          INSERT INTO inscripciones (fecha, comida, iniciales, opcion, updated_at, synced_at)
          VALUES (${fecha}::date, ${comida}, ${iniciales}, ${opcion}, NOW(), NOW())
          ON CONFLICT (fecha, comida, iniciales)
          DO UPDATE SET
            opcion = EXCLUDED.opcion,
            updated_at = NOW(),
            synced_at = NOW()
        `;
        imported += 1;
      }
    }

    return res.status(200).json({ success: true, imported });
  } catch (error) {
    console.error('import-from-sheets error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
