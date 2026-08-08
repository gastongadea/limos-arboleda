const { setCors, handleOptions } = require('./_lib/cors');
const { getSql, ensureSchema } = require('./_lib/db');

function numberToColumnLetter(num) {
  let result = '';
  let n = num;
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
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

function findUserColumn(headers, iniciales) {
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i] || '').trim() === iniciales) {
      return { col: i, letter: numberToColumnLetter(i + 1) };
    }
  }
  return null;
}

function findRowByDateAndType(sheetData, fechaISO, comidaType) {
  for (let r = 1; r < sheetData.length; r++) {
    const row = sheetData[r];
    if (!row) continue;
    const fecha = parseSheetDate(row[1]);
    const tipo = String(row[2] || '').trim().toUpperCase();
    if (fecha === fechaISO && tipo === comidaType) {
      return { row: r };
    }
  }
  return null;
}

async function callAppsScript(action, data) {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL || process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL;
  const sheetId = process.env.GOOGLE_SHEET_ID || process.env.REACT_APP_GOOGLE_SHEET_ID;
  if (!url || !sheetId) {
    throw new Error('GOOGLE_APPS_SCRIPT_URL / GOOGLE_SHEET_ID no configurados');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, sheetId, data }),
    redirect: 'follow',
  });

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    // Apps Script a veces redirige a HTML; intentar GET con params
    const params = new URLSearchParams({
      action,
      sheetId,
      data: JSON.stringify(data),
    });
    const getRes = await fetch(`${url}?${params.toString()}`);
    const getText = await getRes.text();
    try {
      return JSON.parse(getText);
    } catch {
      throw new Error(`Respuesta Apps Script no JSON: ${getText.slice(0, 200)}`);
    }
  }
}

async function getSheetValues() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.REACT_APP_GOOGLE_API_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID || process.env.REACT_APP_GOOGLE_SHEET_ID;
  if (!apiKey || !sheetId) {
    throw new Error('GOOGLE_API_KEY / GOOGLE_SHEET_ID no configurados');
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
    throw new Error(`Error leyendo planilla: ${response.status} ${err}`);
  }
  const json = await response.json();
  return json.values || [];
}

module.exports = async function handler(req, res) {
  setCors(res, req);
  if (req.method === 'OPTIONS') return handleOptions(req, res);

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    await ensureSchema();
    const db = getSql();

    const pending = await db`
      SELECT id, fecha::text AS fecha, comida, iniciales, opcion
      FROM inscripciones
      WHERE synced_at IS NULL OR synced_at < updated_at
      ORDER BY updated_at ASC
      LIMIT 200
    `;

    if (pending.length === 0) {
      return res.status(200).json({ success: true, synced: 0, message: 'Nada pendiente' });
    }

    const sheetData = await getSheetValues();
    if (!sheetData.length) {
      return res.status(500).json({ success: false, error: 'Planilla vacía o inaccesible' });
    }
    const headers = sheetData[0];
    const updates = [];
    const syncedIds = [];
    const errors = [];

    for (const row of pending) {
      const comidaType = row.comida === 'Almuerzo' ? 'A' : 'C';
      const userCol = findUserColumn(headers, row.iniciales);
      if (!userCol) {
        errors.push(`${row.iniciales}: columna no encontrada`);
        continue;
      }
      const rowInfo = findRowByDateAndType(sheetData, row.fecha, comidaType);
      if (!rowInfo) {
        errors.push(`${row.fecha} ${row.comida}: fila no encontrada`);
        continue;
      }
      updates.push({
        range: `${userCol.letter}${rowInfo.row + 1}`,
        value: row.opcion || '',
      });
      syncedIds.push(row.id);
    }

    if (updates.length === 0) {
      return res.status(200).json({ success: false, synced: 0, errors });
    }

    const result = await callAppsScript('updateCells', {
      updates,
      sheetName: 'Data',
    });

    if (result && result.success === false) {
      return res.status(502).json({
        success: false,
        error: result.error || 'Apps Script falló',
        errors,
      });
    }

    for (const id of syncedIds) {
      await db`UPDATE inscripciones SET synced_at = NOW() WHERE id = ${id}`;
    }

    return res.status(200).json({
      success: true,
      synced: syncedIds.length,
      errors,
      appsScript: result || null,
    });
  } catch (error) {
    console.error('sync-sheets error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
