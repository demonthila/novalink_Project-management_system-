<?php
// api/migrate_add_dev_payment_flags.php
require_once __DIR__ . '/config.php';

try {
    $colCheck = $pdo->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'project_developers' AND COLUMN_NAME = :col");
    $colCheck->execute([':db' => DB_NAME, ':col' => 'is_advance_paid']);
    $hasAdvance = (int)$colCheck->fetchColumn() > 0;

    $colCheck->execute([':db' => DB_NAME, ':col' => 'is_final_paid']);
    $hasFinal = (int)$colCheck->fetchColumn() > 0;

    if (!$hasAdvance) {
        $pdo->exec("ALTER TABLE project_developers ADD COLUMN is_advance_paid TINYINT(1) DEFAULT 0");
    }
    if (!$hasFinal) {
        $pdo->exec("ALTER TABLE project_developers ADD COLUMN is_final_paid TINYINT(1) DEFAULT 0");
    }

    echo json_encode(['success' => true, 'message' => 'Migration complete', 'is_advance_added' => !$hasAdvance, 'is_final_added' => !$hasFinal]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

?>
