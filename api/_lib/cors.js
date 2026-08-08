function isDevOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin || '');
}

function isGitHubPagesOrigin(origin) {
  return /^https:\/\/([a-z0-9-]+\.)?github\.io$/i.test(origin || '');
}

function setCors(res, req) {
  const origin = req.headers.origin || '';
  const allowed = (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  let allow = '*';
  if (origin) {
    if (
      allowed.includes('*') ||
      allowed.includes(origin) ||
      isDevOrigin(origin) ||
      isGitHubPagesOrigin(origin)
    ) {
      allow = origin;
    } else {
      allow = allowed[0] || '*';
    }
  }

  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (allow !== '*') {
    res.setHeader('Vary', 'Origin');
  }
}

function handleOptions(req, res) {
  setCors(res, req);
  res.status(204).end();
  return true;
}

module.exports = { setCors, handleOptions };
