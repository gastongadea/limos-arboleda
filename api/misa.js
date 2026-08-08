const { setCors, handleOptions } = require('./_lib/cors');
const { getSql, ensureSchema } = require('./_lib/db');

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

module.exports = async function handler(req, res) {
  setCors(res, req);
  if (req.method === 'OPTIONS') return handleOptions(req, res);

  try {
    await ensureSchema();
    const db = getSql();

    if (req.method === 'GET') {
      const { from, to } = req.query || {};
      if (!from || !to) {
        return res.status(400).json({ success: false, error: 'Requiere from y to (YYYY-MM-DD)' });
      }
      const rows = await db`
        SELECT fecha::text AS fecha, valor
        FROM misa
        WHERE fecha >= ${from}::date AND fecha <= ${to}::date
        ORDER BY fecha
      `;
      const data = {};
      for (const row of rows) data[row.fecha] = row.valor || '';
      return res.status(200).json({ success: true, data, rows });
    }

    if (req.method === 'POST') {
      const body = parseBody(req);
      const items = Array.isArray(body.items)
        ? body.items
        : body.fecha
          ? [{ fecha: body.fecha, valor: body.valor }]
          : null;

      if (!items || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Falta items[] o fecha/valor' });
      }

      let saved = 0;
      for (const item of items) {
        const fecha = item.fecha;
        const valor = item.valor == null ? '' : String(item.valor);
        if (!fecha) continue;
        await db`
          INSERT INTO misa (fecha, valor, updated_at, synced_at)
          VALUES (${fecha}::date, ${valor}, NOW(), NULL)
          ON CONFLICT (fecha)
          DO UPDATE SET
            valor = EXCLUDED.valor,
            updated_at = NOW(),
            synced_at = NULL
        `;
        saved += 1;
      }

      return res.status(200).json({ success: true, count: saved });
    }

    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  } catch (error) {
    console.error('misa error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
