function setCors(res, req) {
  const origin = req.headers.origin || '*';
  const allowed = (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim());
  const allow =
    allowed.includes('*') || allowed.includes(origin) ? origin : allowed[0] || '*';

  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function handleOptions(req, res) {
  setCors(res, req);
  res.status(204).end();
  return true;
}

module.exports = { setCors, handleOptions };
