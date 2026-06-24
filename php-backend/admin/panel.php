<?php
session_start();
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';

if (empty($_SESSION['admin'])) { header('Location: index.php'); exit; }

$db  = get_db();
$msg = '';

// ── Generate keys ─────────────────────────────────────────────────────────────
function gen_key(): string {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $seg   = fn() => implode('', array_map(fn() => $chars[random_int(0, strlen($chars)-1)], range(0,4)));
    return KEY_PREFIX . '-' . $seg() . '-' . $seg() . '-' . $seg();
}

// ── Handle actions ────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'generate') {
        $count   = max(1, min(100, (int)($_POST['count'] ?? 1)));
        $label   = trim($_POST['label'] ?? '');
        $expires = $_POST['expires'] ?: null;
        $added   = 0;
        for ($i = 0; $i < $count; $i++) {
            $key = gen_key();
            try {
                $db->prepare('INSERT INTO license_keys (key_value, label, expires_at) VALUES (?,?,?)')
                   ->execute([$key, $label ?: null, $expires]);
                $added++;
            } catch (Exception $e) { /* duplicate — skip */ }
        }
        $msg = "Generated $added key(s).";
    }

    if ($action === 'add_manual') {
        $key   = strtoupper(trim($_POST['key_value'] ?? ''));
        $label = trim($_POST['label'] ?? '');
        $expires = $_POST['expires'] ?: null;
        if ($key) {
            try {
                $db->prepare('INSERT INTO license_keys (key_value, label, expires_at) VALUES (?,?,?)')
                   ->execute([$key, $label ?: null, $expires]);
                $msg = "Key added.";
            } catch (Exception $e) { $msg = "Key already exists."; }
        }
    }

    if ($action === 'toggle') {
        $id = (int)$_POST['id'];
        $db->prepare('UPDATE license_keys SET is_active = 1 - is_active WHERE id = ?')->execute([$id]);
        $msg = "Key toggled.";
    }

    if ($action === 'delete') {
        $id = (int)$_POST['id'];
        $db->prepare('DELETE FROM license_keys WHERE id = ?')->execute([$id]);
        $msg = "Key deleted.";
    }

    if ($action === 'export') {
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="keys.csv"');
        $rows = $db->query('SELECT key_value, label, is_active, activated_at, expires_at, created_at FROM license_keys ORDER BY id DESC')->fetchAll();
        echo "Key,Label,Active,Activated,Expires,Created\n";
        foreach ($rows as $r) {
            echo implode(',', array_map(fn($v) => '"' . str_replace('"','""',$v??'') . '"', $r)) . "\n";
        }
        exit;
    }
}

$keys  = $db->query('SELECT * FROM license_keys ORDER BY id DESC')->fetchAll();
$total = count($keys);
$active = count(array_filter($keys, fn($r) => $r['is_active']));
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= SITE_NAME ?> Admin</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#ccc;font-family:'Segoe UI',sans-serif;min-height:100vh}
.top{background:#111;border-bottom:1px solid #1e1e1e;padding:16px 32px;
     display:flex;align-items:center;justify-content:space-between}
.top h1{color:#fff;font-size:18px}
.top a{color:#555;font-size:13px;text-decoration:none}
.wrap{max-width:1100px;margin:0 auto;padding:28px 24px}
.stats{display:flex;gap:16px;margin-bottom:28px}
.stat{background:#111;border:1px solid #1e1e1e;border-radius:12px;padding:20px 28px;flex:1}
.stat h3{font-size:28px;color:#fff}
.stat p{font-size:12px;color:#555;margin-top:4px}
.panels{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px}
.panel{background:#111;border:1px solid #1e1e1e;border-radius:12px;padding:24px}
.panel h2{font-size:14px;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-bottom:18px}
input,select{width:100%;padding:10px 14px;background:#171717;border:1px solid #252525;
             border-radius:8px;color:#fff;font-size:14px;outline:none;margin-bottom:10px}
input:focus{border-color:#444}
.row{display:flex;gap:10px}
.row input,.row select{margin-bottom:0}
button{padding:10px 18px;border:none;border-radius:8px;font-size:14px;
       font-weight:600;cursor:pointer;background:#fff;color:#000}
button:hover{background:#ddd}
button.danger{background:#c0392b;color:#fff}
button.danger:hover{background:#e74c3c}
button.sec{background:#1e1e1e;color:#ccc;border:1px solid #2a2a2a}
button.sec:hover{background:#2a2a2a}
.msg{background:#1a2a1a;border:1px solid #2a4a2a;border-radius:8px;
     padding:10px 16px;color:#5d5;font-size:14px;margin-bottom:20px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:10px 12px;border-bottom:1px solid #1e1e1e;
   color:#555;font-weight:600;font-size:11px;text-transform:uppercase}
td{padding:10px 12px;border-bottom:1px solid #151515;color:#bbb}
tr:hover td{background:#111}
.badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600}
.on{background:#1a3a1a;color:#5d5}.off{background:#2a1a1a;color:#c55}
.key-val{font-family:monospace;color:#fff;font-size:13px}
.acts form{display:inline}
.acts button{padding:5px 12px;font-size:12px;margin-left:4px}
</style>
</head>
<body>
<div class="top">
  <h1>🔑 <?= SITE_NAME ?> Admin</h1>
  <div>
    <a href="?action=export" onclick="this.closest('a').href='panel.php'; document.querySelector('form[data-export]').submit(); return false">— </a>
    <form method="POST" style="display:inline" data-export>
      <input type="hidden" name="action" value="export">
      <button type="submit" class="sec" style="font-size:12px;padding:6px 14px">Export CSV</button>
    </form>
    &nbsp;
    <a href="logout.php" style="font-size:13px;color:#555">Logout</a>
  </div>
</div>

<div class="wrap">
  <?php if ($msg): ?><div class="msg"><?= htmlspecialchars($msg) ?></div><?php endif ?>

  <div class="stats">
    <div class="stat"><h3><?= $total ?></h3><p>Total keys</p></div>
    <div class="stat"><h3><?= $active ?></h3><p>Active</p></div>
    <div class="stat"><h3><?= $total - $active ?></h3><p>Disabled</p></div>
  </div>

  <div class="panels">
    <!-- Generate keys -->
    <div class="panel">
      <h2>Generate Keys</h2>
      <form method="POST">
        <input type="hidden" name="action" value="generate">
        <input type="number" name="count" value="1" min="1" max="100" placeholder="How many?">
        <input type="text" name="label" placeholder="Label (e.g. buyer name) — optional">
        <input type="datetime-local" name="expires" title="Expiry (blank = never)">
        <button type="submit">Generate</button>
      </form>
    </div>

    <!-- Add manual key -->
    <div class="panel">
      <h2>Add Key Manually</h2>
      <form method="POST">
        <input type="hidden" name="action" value="add_manual">
        <input type="text" name="key_value" placeholder="NEXUS-XXXXX-XXXXX-XXXXX" style="font-family:monospace">
        <input type="text" name="label" placeholder="Label — optional">
        <input type="datetime-local" name="expires" title="Expiry (blank = never)">
        <button type="submit">Add Key</button>
      </form>
    </div>
  </div>

  <!-- Key table -->
  <div class="panel">
    <h2>All Keys (<?= $total ?>)</h2>
    <table>
      <thead>
        <tr>
          <th>Key</th><th>Label</th><th>Status</th>
          <th>Activated</th><th>Expires</th><th>Created</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
      <?php foreach ($keys as $k): ?>
      <tr>
        <td class="key-val"><?= htmlspecialchars($k['key_value']) ?></td>
        <td><?= htmlspecialchars($k['label'] ?? '—') ?></td>
        <td><span class="badge <?= $k['is_active'] ? 'on' : 'off' ?>"><?= $k['is_active'] ? 'Active' : 'Off' ?></span></td>
        <td><?= $k['activated_at'] ?? '—' ?></td>
        <td><?= $k['expires_at'] ?? 'Never' ?></td>
        <td><?= substr($k['created_at'], 0, 10) ?></td>
        <td class="acts">
          <form method="POST"><input type="hidden" name="action" value="toggle">
            <input type="hidden" name="id" value="<?= $k['id'] ?>">
            <button type="submit" class="sec"><?= $k['is_active'] ? 'Disable' : 'Enable' ?></button>
          </form>
          <form method="POST" onsubmit="return confirm('Delete this key?')">
            <input type="hidden" name="action" value="delete">
            <input type="hidden" name="id" value="<?= $k['id'] ?>">
            <button type="submit" class="danger">Delete</button>
          </form>
        </td>
      </tr>
      <?php endforeach ?>
      </tbody>
    </table>
  </div>
</div>
</body>
</html>
