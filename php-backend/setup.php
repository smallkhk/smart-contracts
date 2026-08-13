<?php
// Run this file ONCE in your browser to create the database table, then DELETE it.
require_once __DIR__ . '/db.php';

$db = get_db();
$db->exec("
    CREATE TABLE IF NOT EXISTS license_keys (
        id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        key_value    VARCHAR(64)  NOT NULL UNIQUE,
        label        VARCHAR(128) DEFAULT NULL,
        device_id    VARCHAR(255) DEFAULT NULL,
        is_active    TINYINT(1)   NOT NULL DEFAULT 1,
        activated_at DATETIME     DEFAULT NULL,
        expires_at   DATETIME     DEFAULT NULL,
        created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");

echo '<h2 style="font-family:monospace;color:green">✓ Table created. DELETE this file now.</h2>';
