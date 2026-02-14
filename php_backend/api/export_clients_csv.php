<?php
// api/export_clients_csv.php
require_once 'config.php';

// Quiet deprecation/warning output to avoid corrupting CSV streams
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_WARNING);

// Optional key protection
$key = $_GET['key'] ?? '';
if (defined('CRON_SECRET') && CRON_SECRET !== '' && $key !== '' && $key !== CRON_SECRET) {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized"]); exit;
}

try {
    // Match actual `clients` table columns used by API (name, email, phone, company_name, created_at)
    $stmt = $pdo->query("SELECT id, name, company_name, email, phone, created_at FROM clients ORDER BY id ASC");
    $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=clients_export_' . date('Y-m-d') . '.csv');

    $out = fopen('php://output', 'w');
    fputcsv($out, ['client_id','name','company_name','email','phone','created_at']);

    foreach ($clients as $c) {
        fputcsv($out, [
            $c['id'],
            $c['name'],
            $c['company_name'],
            $c['email'],
            $c['phone'],
            $c['created_at'] ?? ''
        ]);
    }

    fclose($out);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

?>
