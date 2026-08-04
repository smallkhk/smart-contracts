const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        username      VARCHAR(64)  NOT NULL UNIQUE,
        password_hash VARCHAR(64)  NOT NULL,
        tier          VARCHAR(32)  NOT NULL DEFAULT 'standard',
        is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
        expires_at    TIMESTAMPTZ,
        last_login    TIMESTAMPTZ,
        created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `;
    res.status(200).json({ ok: true, message: 'Users table ready. Delete api/setup-users.js now.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
