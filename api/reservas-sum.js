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

function isValidTime(t) {
  return /^([01]\d|2[0-2]):(00|30)$/.test(t) && t >= '09:00' && t <= '22:00';
}

function toMinutes(fecha, hora) {
  const [y, m, d] = String(fecha).split('-').map(Number);
  const [hh, mm] = String(hora).split(':').map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) / 60000;
}

function parseReservaFields(body) {
  const fechaInicio = body.fecha_inicio || body.fechaInicio;
  const fechaFin = body.fecha_fin || body.fechaFin || fechaInicio;
  const horaInicio = body.hora_inicio || body.horaInicio;
  const horaFin = body.hora_fin || body.horaFin;
  const actividad = body.actividad == null ? '' : String(body.actividad).trim();
  const responsable = body.responsable == null ? '' : String(body.responsable).trim();
  return { fechaInicio, fechaFin, horaInicio, horaFin, actividad, responsable };
}

function validateReservaFields({ fechaInicio, fechaFin, horaInicio, horaFin, actividad, responsable }) {
  if (!fechaInicio || !horaInicio || !horaFin) {
    return 'Faltan fecha_inicio, hora_inicio u hora_fin';
  }
  if (!isValidTime(horaInicio) || !isValidTime(horaFin)) {
    return 'Horas inválidas (usar HH:MM entre 09:00 y 22:00, cada 30 min)';
  }
  if (toMinutes(fechaFin, horaFin) <= toMinutes(fechaInicio, horaInicio)) {
    return 'La fecha/hora de fin debe ser posterior al inicio';
  }
  if (!actividad) return 'Completá la actividad';
  if (!responsable) return 'Completá el responsable';
  return null;
}

async function findOverlap(db, { fechaInicio, fechaFin, horaInicio, horaFin, excludeId }) {
  const rows = excludeId
    ? await db`
        SELECT
          id,
          fecha_inicio::text AS fecha_inicio,
          fecha_fin::text AS fecha_fin,
          hora_inicio,
          hora_fin,
          actividad
        FROM reservas_sum
        WHERE id <> ${excludeId}
          AND (fecha_inicio + hora_inicio::time) < (${fechaFin}::date + ${horaFin}::time)
          AND (${fechaInicio}::date + ${horaInicio}::time) < (fecha_fin + hora_fin::time)
        LIMIT 1
      `
    : await db`
        SELECT
          id,
          fecha_inicio::text AS fecha_inicio,
          fecha_fin::text AS fecha_fin,
          hora_inicio,
          hora_fin,
          actividad
        FROM reservas_sum
        WHERE (fecha_inicio + hora_inicio::time) < (${fechaFin}::date + ${horaFin}::time)
          AND (${fechaInicio}::date + ${horaInicio}::time) < (fecha_fin + hora_fin::time)
        LIMIT 1
      `;
  return rows[0] || null;
}

function overlapErrorMessage(row) {
  return `Se superpone con "${row.actividad}" (${row.fecha_inicio} ${row.hora_inicio} – ${row.fecha_fin} ${row.hora_fin})`;
}

module.exports = async function handler(req, res) {
  setCors(res, req);
  if (req.method === 'OPTIONS') return handleOptions(req, res);

  try {
    await ensureSchema();
    const db = getSql();

    if (req.method === 'GET') {
      const from = req.query?.from || new Date().toISOString().slice(0, 10);
      const to = req.query?.to || null;
      const rows = to
        ? await db`
            SELECT
              id,
              fecha_inicio::text AS fecha_inicio,
              fecha_fin::text AS fecha_fin,
              hora_inicio,
              hora_fin,
              actividad,
              responsable,
              created_at
            FROM reservas_sum
            WHERE fecha_fin >= ${from}::date
              AND fecha_inicio <= ${to}::date
            ORDER BY fecha_inicio ASC, hora_inicio ASC
            LIMIT 200
          `
        : await db`
            SELECT
              id,
              fecha_inicio::text AS fecha_inicio,
              fecha_fin::text AS fecha_fin,
              hora_inicio,
              hora_fin,
              actividad,
              responsable,
              created_at
            FROM reservas_sum
            WHERE fecha_fin >= ${from}::date
            ORDER BY fecha_inicio ASC, hora_inicio ASC
            LIMIT 100
          `;
      return res.status(200).json({ success: true, rows });
    }

    if (req.method === 'POST') {
      const fields = parseReservaFields(parseBody(req));
      const validationError = validateReservaFields(fields);
      if (validationError) {
        return res.status(400).json({ success: false, error: validationError });
      }

      const overlap = await findOverlap(db, fields);
      if (overlap) {
        return res.status(409).json({ success: false, error: overlapErrorMessage(overlap) });
      }

      const inserted = await db`
        INSERT INTO reservas_sum (
          fecha_inicio, fecha_fin, hora_inicio, hora_fin, actividad, responsable
        )
        VALUES (
          ${fields.fechaInicio}::date,
          ${fields.fechaFin}::date,
          ${fields.horaInicio},
          ${fields.horaFin},
          ${fields.actividad},
          ${fields.responsable}
        )
        RETURNING
          id,
          fecha_inicio::text AS fecha_inicio,
          fecha_fin::text AS fecha_fin,
          hora_inicio,
          hora_fin,
          actividad,
          responsable
      `;

      return res.status(200).json({ success: true, row: inserted[0] });
    }

    if (req.method === 'PUT') {
      const body = parseBody(req);
      const id = body.id || req.query?.id;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Falta id' });
      }

      const fields = parseReservaFields(body);
      const validationError = validateReservaFields(fields);
      if (validationError) {
        return res.status(400).json({ success: false, error: validationError });
      }

      const existing = await db`
        SELECT id FROM reservas_sum WHERE id = ${id} LIMIT 1
      `;
      if (!existing[0]) {
        return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
      }

      const overlap = await findOverlap(db, { ...fields, excludeId: id });
      if (overlap) {
        return res.status(409).json({ success: false, error: overlapErrorMessage(overlap) });
      }

      const updated = await db`
        UPDATE reservas_sum SET
          fecha_inicio = ${fields.fechaInicio}::date,
          fecha_fin = ${fields.fechaFin}::date,
          hora_inicio = ${fields.horaInicio},
          hora_fin = ${fields.horaFin},
          actividad = ${fields.actividad},
          responsable = ${fields.responsable}
        WHERE id = ${id}
        RETURNING
          id,
          fecha_inicio::text AS fecha_inicio,
          fecha_fin::text AS fecha_fin,
          hora_inicio,
          hora_fin,
          actividad,
          responsable
      `;

      return res.status(200).json({ success: true, row: updated[0] });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || parseBody(req).id;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Falta id' });
      }
      await db`DELETE FROM reservas_sum WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE, OPTIONS');
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  } catch (error) {
    console.error('reservas-sum error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
