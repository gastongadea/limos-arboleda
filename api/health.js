const { setCors, handleOptions } = require('./_lib/cors');
const { getSql, ensureSchema } = require('./_lib/db');

module.exports = async function handler(req, res) {
  setCors(res, req);
  if (req.method === 'OPTIONS') return handleOptions(req, res);

  try {
    await ensureSchema();
    const db = getSql();
    const rows = await db`SELECT 1 AS ok`;
    res.status(200).json({
      ok: true,
      db: rows[0]?.ok === 1,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('health error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
};
