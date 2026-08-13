const { sql } = require('@vercel/postgres');
const crypto  = require('crypto');

function checkAuth(req) {
  return req.headers['x-admin-key'] === process.env.ADMIN_KEY;
}

function genKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg   = () => Array.from({ length: 5 }, () => chars[crypto.randomInt(chars.length)]).join('');
  return `NEXUS-${seg()}-${seg()}-${seg()}`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // GET — list all keys
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM license_keys ORDER BY id DESC`;
      return res.json({ keys: rows });
    }

    // POST — generate or manage keys
    if (req.method === 'POST') {
      const { action, count = 1, label, expires, key_value, tier, id } = req.body || {};

      if (action === 'generate') {
        const n    = Math.min(100, Math.max(1, parseInt(count) || 1));
        const t    = (tier || 'premium').toLowerCase();
        const added = [];
        for (let i = 0; i < n; i++) {
          const k = genKey();
          try {
            await sql`
              INSERT INTO license_keys (key_value, label, tier, expires_at)
              VALUES (${k}, ${label || null}, ${t}, ${expires || null})
            `;
            added.push(k);
          } catch { /* duplicate, skip */ }
        }
        return res.json({ added });
      }

      if (action === 'add') {
        const k = (key_value || '').toUpperCase().trim();
        const t = (tier || 'premium').toLowerCase();
        if (!k) return res.status(400).json({ error: 'No key provided' });
        await sql`
          INSERT INTO license_keys (key_value, label, tier, expires_at)
          VALUES (${k}, ${label || null}, ${t}, ${expires || null})
        `;
        return res.json({ ok: true, key: k });
      }

      if (action === 'toggle') {
        await sql`UPDATE license_keys SET is_active = NOT is_active WHERE id = ${id}`;
        return res.json({ ok: true });
      }

      if (action === 'set_tier') {
        const t = (tier || 'premium').toLowerCase();
        await sql`UPDATE license_keys SET tier = ${t} WHERE id = ${id}`;
        return res.json({ ok: true });
      }

      if (action === 'reset_device') {
        await sql`UPDATE license_keys SET device_id = NULL, activated_at = NULL WHERE id = ${id}`;
        return res.json({ ok: true });
      }
    }

    // DELETE — remove key
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      await sql`DELETE FROM license_keys WHERE id = ${id}`;
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
