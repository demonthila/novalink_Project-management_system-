<?php
// api/backup.php
require_once 'config.php';
// Generate CSV export of database tables

header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="stratis_backup_' . date('Y-m-d') . '.csv"');

$tables = ['projects', 'clients', 'developers', 'payments', 'additional_costs', 'settings'];
$fp = fopen('php://output', 'w');

foreach ($tables as $table) {
    // Add Table Header
    fputcsv($fp, ['--- TABLE: ' . strtoupper($table) . ' ---']);
    
    // Get Column Names
    $stmt = $pdo->query("SELECT * FROM $table LIMIT 1");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        fputcsv($fp, array_keys($row));
        
        // Get Data
        $stmt = $pdo->query("SELECT * FROM $table");
        while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
            fputcsv($fp, $data);
        }
    }
    fputcsv($fp, []); // Empty line
}

fclose($fp);
exit();
?>
