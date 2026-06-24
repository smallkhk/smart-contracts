<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['valid' => false, 'reason' => 'Method not allowed']);
    exit;
}

$body = file_get_contents('php://input');
$data = json_decode($body, true);

if (empty($data['key'])) {
    echo json_encode(['valid' => false, 'reason' => 'No key provided']);
    exit;
}

require_once __DIR__ . '/db.php';

$key = strtoupper(trim($data['key']));
$db  = get_db();

$stmt = $db->prepare(
    'SELECT id, is_active, expires_at, device_id
     FROM license_keys
     WHERE key_value = ?
     LIMIT 1'
);
$stmt->execute([$key]);
$row = $stmt->fetch();

if (!$row) {
    echo json_encode(['valid' => false, 'reason' => 'Invalid license key']);
    exit;
}

if (!$row['is_active']) {
    echo json_encode(['valid' => false, 'reason' => 'Key has been disabled']);
    exit;
}

if ($row['expires_at'] !== null && strtotime($row['expires_at']) < time()) {
    echo json_encode(['valid' => false, 'reason' => 'License key expired']);
    exit;
}

// Bind to device on first use
$device = $data['device'] ?? null;
if ($device && $row['device_id'] === null) {
    $db->prepare('UPDATE license_keys SET device_id = ?, activated_at = NOW() WHERE id = ?')
       ->execute([$device, $row['id']]);
} elseif ($device && $row['device_id'] !== null && $row['device_id'] !== $device) {
    echo json_encode(['valid' => false, 'reason' => 'Key already used on another device']);
    exit;
}

echo json_encode(['valid' => true]);
