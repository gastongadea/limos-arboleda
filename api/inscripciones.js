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
      const { iniciales, from, to, fecha } = req.query || {};

      if (iniciales && from && to) {
        const rows = await db`
          SELECT fecha::text AS fecha, comida, iniciales, opcion, updated_at, synced_at
          FROM inscripciones
          WHERE iniciales = ${iniciales}
            AND fecha >= ${from}::date
            AND fecha <= ${to}::date
          ORDER BY fecha, comida
        `;
        const byDay = {};
        for (const row of rows) {
          if (!byDay[row.fecha]) byDay[row.fecha] = { Almuerzo: '', Cena: '' };
          byDay[row.fecha][row.comida] = row.opcion || '';
        }
        return res.status(200).json({ success: true, data: byDay, rows });
      }

      if (from && to) {
        const rows = await db`
          SELECT fecha::text AS fecha, comida, iniciales, opcion, updated_at, synced_at
          FROM inscripciones
          WHERE fecha >= ${from}::date
            AND fecha <= ${to}::date
          ORDER BY fecha, comida, iniciales
        `;
        return res.status(200).json({ success: true, rows });
      }

      if (fecha) {
        const rows = await db`
          SELECT fecha::text AS fecha, comida, iniciales, opcion, updated_at, synced_at
          FROM inscripciones
          WHERE fecha = ${fecha}::date
          ORDER BY comida, iniciales
        `;
        return res.status(200).json({ success: true, rows });
      }

      return res.status(400).json({
        success: false,
        error: 'Parámetros requeridos: iniciales+from+to, o from+to, o fecha',
      });
    }

    if (req.method === 'POST') {
      const body = parseBody(req);
      const items = Array.isArray(body.inscripciones)
        ? body.inscripciones
        : Array.isArray(body.changes)
          ? body.changes
          : null;

      if (!items || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Falta inscripciones[]' });
      }

      let saved = 0;
      const errors = [];

      for (const item of items) {
        const fecha = item.fecha;
        const comida = item.comida;
        const iniciales = item.iniciales;
        const opcion = item.opcion == null ? '' : String(item.opcion);

        if (!fecha || !comida || !iniciales) {
          errors.push(`Fila inválida: ${JSON.stringify(item)}`);
          continue;
        }
        if (comida !== 'Almuerzo' && comida !== 'Cena') {
          errors.push(`${fecha} ${comida}: comida inválida`);
          continue;
        }

        try {
          await db`
            INSERT INTO inscripciones (fecha, comida, iniciales, opcion, updated_at, synced_at)
            VALUES (${fecha}::date, ${comida}, ${iniciales}, ${opcion}, NOW(), NULL)
            ON CONFLICT (fecha, comida, iniciales)
            DO UPDATE SET
              opcion = EXCLUDED.opcion,
              updated_at = NOW(),
              synced_at = NULL
          `;
          saved += 1;
        } catch (e) {
          errors.push(`${fecha} ${comida} ${iniciales}: ${e.message}`);
        }
      }

      // Disparo soft de sync (no bloquea la respuesta si falla)
      const syncUrl = process.env.SYNC_SELF_URL || process.env.VERCEL_URL;
      if (syncUrl && saved > 0) {
        const base = syncUrl.startsWith('http') ? syncUrl : `https://${syncUrl}`;
        fetch(`${base}/api/sync-sheets`, { method: 'POST' }).catch(() => {});
      }

      return res.status(200).json({
        success: errors.length === 0,
        count: saved,
        errors,
      });
    }

    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  } catch (error) {
    console.error('inscripciones error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
