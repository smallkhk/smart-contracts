// Run ONCE at /api/setup to create the database table, then remove this file.
const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS license_keys (
        id           SERIAL PRIMARY KEY,
        key_value    VARCHAR(64)  NOT NULL UNIQUE,
        label        VARCHAR(128),
        device_id    VARCHAR(255),
        is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
        activated_at TIMESTAMPTZ,
        expires_at   TIMESTAMPTZ,
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `;
    res.status(200).json({ ok: true, message: 'Table created. Delete api/setup.js now.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
