<?php
// api/migrate_drop_hourly_rate.php
require_once __DIR__ . '/config.php';

try {
    // Check if column exists
    $colCheck = $pdo->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'developers' AND COLUMN_NAME = 'hourly_rate'");
    $colCheck->execute([':db' => DB_NAME]);
    $exists = (int)$colCheck->fetchColumn() > 0;

    if (!$exists) {
        echo json_encode(['success' => true, 'message' => 'Column hourly_rate does not exist. Nothing to do.']);
        exit;
    }

    // Drop the column safely
    $pdo->exec("ALTER TABLE developers DROP COLUMN hourly_rate");
    echo json_encode(['success' => true, 'message' => 'Dropped column hourly_rate from developers table.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

?>