const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ valid: false, reason: 'Method not allowed' });

  const body = req.body || {};
  const key  = (body.key || '').toString().toUpperCase().trim();

  if (!key) return res.json({ valid: false, reason: 'No key provided' });

  try {
    const { rows } = await sql`
      SELECT id, is_active, expires_at, device_id
      FROM license_keys
      WHERE key_value = ${key}
      LIMIT 1
    `;

    if (!rows.length)      return res.json({ valid: false, reason: 'Invalid license key' });
    if (!rows[0].is_active) return res.json({ valid: false, reason: 'Key has been disabled' });
    if (rows[0].expires_at && new Date(rows[0].expires_at) < new Date()) {
      return res.json({ valid: false, reason: 'License key expired' });
    }

    // Bind to device on first use
    const device = (body.device || '').toString().trim() || null;
    if (device && !rows[0].device_id) {
      await sql`
        UPDATE license_keys
        SET device_id = ${device}, activated_at = NOW()
        WHERE id = ${rows[0].id}
      `;
    } else if (device && rows[0].device_id && rows[0].device_id !== device) {
      return res.json({ valid: false, reason: 'Key already used on another device' });
    }

    return res.json({ valid: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ valid: false, reason: 'Server error' });
  }
};
