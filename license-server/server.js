const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app           = express();
const PORT          = process.env.PORT || 3000;
const ADMIN_PASS    = process.env.ADMIN_PASSWORD || 'changeme123'; // change this!
const KEYS_FILE     = path.join(__dirname, 'keys.json');

app.use(cors());
app.use(express.json());

// ── HELPERS ───────────────────────────────────────────────────────────────────
function loadKeys() {
  try { return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8')); } catch(e) { return []; }
}
function saveKeys(keys) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}
function generateKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = n => Array.from({length: n}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `ECLPS-${rand(5)}-${rand(5)}-${rand(5)}`;
}
function adminAuth(req, res) {
  const pass = req.body?.password || req.query?.password;
  if (pass !== ADMIN_PASS) { res.status(401).json({ error: 'Unauthorized' }); return false; }
  return true;
}

// ── PUBLIC: validate a key ────────────────────────────────────────────────────
app.post('/validate', (req, res) => {
  const key = (req.body.key || '').toUpperCase().trim();
  if (!key) return res.json({ valid: false, reason: 'No key provided' });
  const keys = loadKeys();
  const found = keys.find(k => k.key === key);
  if (!found)        return res.json({ valid: false, reason: 'Key not found' });
  if (!found.active) return res.json({ valid: false, reason: 'Key revoked' });
  res.json({ valid: true });
});

// ── ADMIN: list all keys ──────────────────────────────────────────────────────
app.get('/admin/keys', (req, res) => {
  if (!adminAuth(req, res)) return;
  res.json(loadKeys());
});

// ── ADMIN: create a key ───────────────────────────────────────────────────────
app.post('/admin/keys', (req, res) => {
  if (!adminAuth(req, res)) return;
  const { note, count } = req.body;
  const keys = loadKeys();
  const created = [];
  const n = Math.min(parseInt(count) || 1, 100);
  for (let i = 0; i < n; i++) {
    const key = generateKey();
    keys.push({ key, active: true, note: note || '', createdAt: new Date().toISOString() });
    created.push(key);
  }
  saveKeys(keys);
  res.json({ created });
});

// ── ADMIN: revoke a key ───────────────────────────────────────────────────────
app.delete('/admin/keys/:key', (req, res) => {
  if (!adminAuth(req, res)) return;
  const keys = loadKeys();
  const idx = keys.findIndex(k => k.key === req.params.key.toUpperCase());
  if (idx === -1) return res.status(404).json({ error: 'Key not found' });
  keys[idx].active = false;
  saveKeys(keys);
  res.json({ revoked: req.params.key.toUpperCase() });
});

// ── ADMIN: delete a key permanently ──────────────────────────────────────────
app.delete('/admin/keys/:key/permanent', (req, res) => {
  if (!adminAuth(req, res)) return;
  let keys = loadKeys();
  const before = keys.length;
  keys = keys.filter(k => k.key !== req.params.key.toUpperCase());
  if (keys.length === before) return res.status(404).json({ error: 'Key not found' });
  saveKeys(keys);
  res.json({ deleted: req.params.key.toUpperCase() });
});

app.get('/', (req, res) => res.json({ status: 'EclipseLiveCam License Server running' }));

app.listen(PORT, () => {
  console.log(`License server running on port ${PORT}`);
  console.log(`Admin password: ${ADMIN_PASS}`);
});
