<?php
// api/health.php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

$ok = true;
$messages = [];

// PHP version
$messages['php_version'] = phpversion();

// DB connectivity
try {
    $pdo->query('SELECT 1');
    $messages['database'] = 'ok';
} catch (Exception $e) {
    $ok = false;
    $messages['database'] = 'error: ' . $e->getMessage();
}

// Writable test (tmp file)
$tmp = sys_get_temp_dir() . '/stratis_health_test.txt';
try {
    file_put_contents($tmp, date('c'));
    if (file_exists($tmp)) {
        $messages['tmp_write'] = 'ok';
        @unlink($tmp);
    } else {
        $ok = false;
        $messages['tmp_write'] = 'failed';
    }
} catch (Exception $e) {
    $ok = false;
    $messages['tmp_write'] = 'error: ' . $e->getMessage();
}

echo json_encode(['ok' => $ok, 'details' => $messages]);
