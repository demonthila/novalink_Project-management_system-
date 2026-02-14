<?php
// api/export_clients_csv.php
require_once 'config.php';

// Optional key protection
$key = $_GET['key'] ?? '';
if (defined('CRON_SECRET') && CRON_SECRET !== '' && $key !== '' && $key !== CRON_SECRET) {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized"]); exit;
}

try {
    $stmt = $pdo->query("SELECT id, name, company_name, email, phone, address, country, notes, created_date FROM clients ORDER BY id ASC");
    $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=clients_export_' . date('Y-m-d') . '.csv');

    $out = fopen('php://output', 'w');
    fputcsv($out, ['client_id','name','company_name','email','phone','address','country','notes','created_date']);

    foreach ($clients as $c) {
        fputcsv($out, [
            $c['id'],
            $c['name'],
            $c['company_name'],
            $c['email'],
            $c['phone'],
            $c['address'],
            $c['country'],
            $c['notes'],
            $c['created_date'] ?? ''
        ]);
    }

    fclose($out);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

?>
