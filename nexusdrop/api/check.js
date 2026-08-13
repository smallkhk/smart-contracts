// Always-ok stub for a possible separate ban/status check the binary may
// make (distinct from login.js). Nothing currently hooks/redirects that
// call to this domain — this file alone has no effect until it does.
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json({ banned: false, valid: true });
};
