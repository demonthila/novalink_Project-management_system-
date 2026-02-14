<?php
// api/export_developers_csv.php
require_once 'config.php';

// Optional key protection
$key = $_GET['key'] ?? '';
if (defined('CRON_SECRET') && CRON_SECRET !== '' && $key !== '' && $key !== CRON_SECRET) {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized"]); exit;
}

try {
    // Fetch developers and their assigned projects (comma-separated)
    $devStmt = $pdo->query("SELECT id, name, specialization, email, phone, status, created_at FROM developers ORDER BY id ASC");
    $devs = $devStmt->fetchAll(PDO::FETCH_ASSOC);

    $assignStmt = $pdo->prepare("SELECT p.name FROM project_developers pd JOIN projects p ON pd.project_id = p.id WHERE pd.developer_id = ?");

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=developers_export_' . date('Y-m-d') . '.csv');

    $out = fopen('php://output', 'w');
    fputcsv($out, ['developer_id','name','specialization','email','phone','status','created_at','assigned_projects']);

    foreach ($devs as $d) {
        $assignStmt->execute([$d['id']]);
        $rows = $assignStmt->fetchAll(PDO::FETCH_COLUMN);
        $assigned = implode(' ; ', $rows);

        fputcsv($out, [
            $d['id'],
            $d['name'],
            $d['specialization'],
            $d['email'],
            $d['phone'],
            $d['status'],
            $d['created_at'],
            $assigned
        ]);
    }

    fclose($out);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

?>
