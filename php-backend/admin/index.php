<?php
session_start();
require_once __DIR__ . '/../config.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($_POST['password'] === ADMIN_PASSWORD) {
        $_SESSION['admin'] = true;
        header('Location: panel.php');
        exit;
    }
    $error = 'Wrong password.';
}

if (!empty($_SESSION['admin'])) {
    header('Location: panel.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= SITE_NAME ?> — Admin</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0a0a0a;color:#e0e0e0;font-family:'Segoe UI',sans-serif;
       display:flex;align-items:center;justify-content:center;min-height:100vh}
  .card{background:#111;border:1px solid #222;border-radius:16px;padding:40px;width:340px}
  h1{font-size:22px;margin-bottom:8px;color:#fff}
  p{font-size:13px;color:#555;margin-bottom:28px}
  input{width:100%;padding:12px 16px;background:#1a1a1a;border:1px solid #2a2a2a;
        border-radius:10px;color:#fff;font-size:15px;outline:none;margin-bottom:14px}
  input:focus{border-color:#444}
  button{width:100%;padding:13px;background:#fff;color:#000;border:none;
         border-radius:10px;font-size:15px;font-weight:700;cursor:pointer}
  button:hover{background:#ddd}
  .err{color:#f55;font-size:13px;margin-bottom:12px}
</style>
</head>
<body>
<div class="card">
  <h1>🔑 <?= SITE_NAME ?></h1>
  <p>Admin panel — enter password to continue</p>
  <?php if ($error): ?><div class="err"><?= htmlspecialchars($error) ?></div><?php endif ?>
  <form method="POST">
    <input type="password" name="password" placeholder="Password" autofocus>
    <button type="submit">Sign in</button>
  </form>
</div>
</body>
</html>
