const { sql } = require('@vercel/postgres');
const crypto  = require('crypto');

function checkAuth(req) {
  return req.headers['x-admin-key'] === process.env.ADMIN_KEY;
}
function hashPassword(p) {
  return crypto.createHash('sha256').update(p).digest('hex');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // GET — list all users
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT id, username, is_active, tier, expires_at, last_login, created_at
        FROM users ORDER BY id DESC
      `;
      return res.json({ users: rows });
    }

    // POST — create user or toggle active
    if (req.method === 'POST') {
      const { action, username, password, tier, expires } = req.body || {};

      if (action === 'create') {
        if (!username || !password)
          return res.status(400).json({ error: 'username and password required' });
        const hash = hashPassword(password);
        await sql`
          INSERT INTO users (username, password_hash, tier, expires_at)
          VALUES (
            ${username.toLowerCase().trim()},
            ${hash},
            ${tier || 'premium'},
            ${expires || null}
          )
        `;
        return res.json({ ok: true, username: username.toLowerCase().trim() });
      }

      if (action === 'toggle') {
        const { id } = req.body;
        await sql`UPDATE users SET is_active = NOT is_active WHERE id = ${id}`;
        return res.json({ ok: true });
      }

      if (action === 'reset_password') {
        const { id } = req.body;
        if (!password) return res.status(400).json({ error: 'password required' });
        const hash = hashPassword(password);
        await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${id}`;
        return res.json({ ok: true });
      }

      if (action === 'set_tier') {
        const { id } = req.body;
        const t = (tier || 'premium').toLowerCase();
        await sql`UPDATE users SET tier = ${t} WHERE id = ${id}`;
        return res.json({ ok: true });
      }
    }

    // DELETE — remove user
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      await sql`DELETE FROM users WHERE id = ${id}`;
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
