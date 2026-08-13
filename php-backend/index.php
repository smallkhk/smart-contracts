<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>NexusDrop — OneState RolePlay Mod</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#080808;--card:#0f0f0f;--border:#1e1e1e;--accent:#ffffff;--muted:#444}
  body{background:var(--bg);color:#d0d0d0;font-family:'Segoe UI',system-ui,sans-serif;
       min-height:100vh;display:flex;flex-direction:column}

  /* ── Nav ── */
  nav{display:flex;align-items:center;justify-content:space-between;
      padding:18px 40px;border-bottom:1px solid var(--border)}
  .logo{font-size:18px;font-weight:800;color:#fff;letter-spacing:-.5px}
  .logo span{color:#888}
  nav a{color:#666;text-decoration:none;font-size:14px;margin-left:24px}
  nav a:hover{color:#fff}

  /* ── Hero ── */
  .hero{flex:1;display:flex;flex-direction:column;align-items:center;
        justify-content:center;text-align:center;padding:80px 24px 60px}
  .badge{display:inline-block;background:#111;border:1px solid #222;
         border-radius:20px;padding:6px 16px;font-size:12px;color:#666;
         letter-spacing:.08em;margin-bottom:28px}
  .hero h1{font-size:clamp(36px,6vw,72px);font-weight:900;color:#fff;
           line-height:1.05;margin-bottom:20px;letter-spacing:-1.5px}
  .hero h1 span{color:#555}
  .hero p{font-size:16px;color:#555;max-width:480px;line-height:1.7;margin-bottom:40px}
  .btns{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}
  .btn{padding:14px 28px;border-radius:12px;font-size:15px;font-weight:700;
       text-decoration:none;display:inline-block}
  .btn-white{background:#fff;color:#000}.btn-white:hover{background:#e0e0e0}
  .btn-dark{background:#111;color:#ccc;border:1px solid #222}
  .btn-dark:hover{background:#1a1a1a;color:#fff}

  /* ── Features ── */
  .features{padding:60px 24px;max-width:900px;margin:0 auto;width:100%}
  .features h2{text-align:center;font-size:26px;color:#fff;margin-bottom:40px;font-weight:800}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
  .feat{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:24px}
  .feat .icon{font-size:28px;margin-bottom:14px}
  .feat h3{color:#fff;font-size:15px;margin-bottom:8px}
  .feat p{font-size:13px;color:#555;line-height:1.6}

  /* ── Key check ── */
  .checker{background:var(--card);border:1px solid var(--border);border-radius:16px;
           padding:40px;max-width:480px;margin:0 auto 80px;text-align:center}
  .checker h2{color:#fff;font-size:20px;margin-bottom:8px}
  .checker p{color:#555;font-size:14px;margin-bottom:28px}
  .checker input{width:100%;padding:14px 18px;background:#151515;border:1px solid #252525;
                 border-radius:10px;color:#fff;font-size:14px;font-family:monospace;
                 outline:none;margin-bottom:14px;text-align:center;text-transform:uppercase}
  .checker input:focus{border-color:#444}
  .checker button{width:100%;padding:14px;background:#fff;color:#000;border:none;
                  border-radius:10px;font-size:15px;font-weight:700;cursor:pointer}
  .checker button:hover{background:#ddd}
  #result{margin-top:14px;font-size:14px;min-height:20px}
  .valid{color:#5d5}.invalid{color:#f55}

  /* ── Footer ── */
  footer{border-top:1px solid var(--border);padding:24px 40px;
         display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
  footer p{font-size:13px;color:#333}
  footer a{color:#444;text-decoration:none;font-size:13px;margin-left:20px}
  footer a:hover{color:#888}
</style>
</head>
<body>

<nav>
  <div class="logo">Nexus<span>Drop</span></div>
  <div>
    <a href="https://t.me/onestaterpios" target="_blank">Telegram</a>
    <a href="https://wa.me/2348153329197" target="_blank">WhatsApp</a>
    <a href="admin/">Admin</a>
  </div>
</nav>

<section class="hero">
  <div class="badge">OneState RolePlay · iOS Mod</div>
  <h1>Dominate <span>the game.</span></h1>
  <p>NexusDrop gives you the tools to play on a completely different level — Aimbot, ESP, Teleport, and more.</p>
  <div class="btns">
    <a href="https://t.me/onestaterpios" class="btn btn-white" target="_blank">Get License Key</a>
    <a href="https://wa.me/2348153329197" class="btn btn-dark" target="_blank">Contact via WhatsApp</a>
  </div>
</section>

<section class="features">
  <h2>What's included</h2>
  <div class="grid">
    <div class="feat">
      <div class="icon">🎯</div>
      <h3>Aimbot</h3>
      <p>Smooth, configurable aimbot with adjustable FOV and bone targeting.</p>
    </div>
    <div class="feat">
      <div class="icon">👁️</div>
      <h3>ESP / Wallhack</h3>
      <p>See players through walls with box ESP, skeleton rendering, and distance labels.</p>
    </div>
    <div class="feat">
      <div class="icon">⚡</div>
      <h3>Teleport</h3>
      <p>Instantly teleport to any location on the map with one tap.</p>
    </div>
    <div class="feat">
      <div class="icon">🛡️</div>
      <h3>Streamer Mode</h3>
      <p>Hide the overlay when streaming or recording to stay undetected.</p>
    </div>
    <div class="feat">
      <div class="icon">🌍</div>
      <h3>Multi-Language</h3>
      <p>Full support for English, French, Italian, German and more.</p>
    </div>
    <div class="feat">
      <div class="icon">📱</div>
      <h3>Non-Jailbreak</h3>
      <p>Works on regular iOS devices — no jailbreak required.</p>
    </div>
  </div>
</section>

<section style="padding:0 24px 60px;max-width:900px;margin:0 auto;width:100%">
  <div class="checker">
    <h2>Check your key</h2>
    <p>Already have a license? Verify it here before installing.</p>
    <input type="text" id="keyInput" placeholder="NEXUS-XXXXX-XXXXX-XXXXX" maxlength="23">
    <button onclick="checkKey()">Verify Key</button>
    <div id="result"></div>
  </div>
</section>

<footer>
  <p>© <?= date('Y') ?> NexusDrop. All rights reserved.</p>
  <div>
    <a href="https://t.me/onestaterpios" target="_blank">Telegram</a>
    <a href="https://wa.me/2348153329197" target="_blank">WhatsApp</a>
  </div>
</footer>

<script>
async function checkKey() {
  const key = document.getElementById('keyInput').value.trim().toUpperCase();
  const res = document.getElementById('result');
  if (!key) { res.innerHTML = '<span class="invalid">Please enter a key.</span>'; return; }
  res.textContent = 'Checking…';
  try {
    const r = await fetch('/validate.php', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({key})
    });
    const d = await r.json();
    res.innerHTML = d.valid
      ? '<span class="valid">✓ Valid key — good to install!</span>'
      : '<span class="invalid">✗ ' + (d.reason || 'Invalid key') + '</span>';
  } catch(e) {
    res.innerHTML = '<span class="invalid">Could not reach server.</span>';
  }
}
document.getElementById('keyInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkKey();
});
</script>
</body>
</html>
