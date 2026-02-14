<?php
// api/export_projects_csv.php
require_once 'config.php';

// Basic auth/secret optional protection
$key = $_GET['key'] ?? '';
if (defined('CRON_SECRET') && CRON_SECRET !== '' && $key !== '' && $key !== CRON_SECRET) {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized"]); exit;
}

try {
    // Fetch projects
    $projects = $pdo->query("SELECT p.*, c.name as client_name, c.email as client_email FROM projects p LEFT JOIN clients c ON p.client_id = c.id ORDER BY p.id ASC")->fetchAll(PDO::FETCH_ASSOC);

    // Prepare statements for related data
    $devStmt = $pdo->prepare("SELECT d.name, d.role, pd.cost, IFNULL(pd.is_advance_paid,0) AS is_advance_paid, IFNULL(pd.is_final_paid,0) AS is_final_paid FROM project_developers pd JOIN developers d ON d.id = pd.developer_id WHERE pd.project_id = ?");
    $addStmt = $pdo->prepare("SELECT description, amount FROM additional_costs WHERE project_id = ?");
    $payStmt = $pdo->prepare("SELECT payment_number, amount, due_date, status FROM payments WHERE project_id = ? ORDER BY payment_number ASC");

    // CSV headers
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=projects_export_' . date('Y-m-d') . '.csv');

    $out = fopen('php://output', 'w');
    // Columns (match the data columns written below)
    fputcsv($out, [
        'project_id',
        'name',
        'client_name',
        'client_email',
        'status',
        'start_date',
        'end_date',
        'total_revenue',
        'total_profit',
        'developer_list',
        'developer_total_cost',
        'additional_costs_list',
        'additional_costs_total',
        'total_expenses',
        'payments_list',
        'notes'
    ]);

    foreach ($projects as $p) {
        $pid = $p['id'];
        // developers
        $devStmt->execute([$pid]);
        $devRows = $devStmt->fetchAll(PDO::FETCH_ASSOC);
        $devList = [];
            $devCostSum = 0;
        foreach ($devRows as $d) {
            $flags = [];
            if ($d['is_advance_paid']) $flags[] = 'advance';
            if ($d['is_final_paid']) $flags[] = 'final';
                $devList[] = $d['name'] . ' (' . $d['role'] . ') cost:' . $d['cost'] . ' paid:' . implode('|', $flags);
                $devCostSum += (float)$d['cost'];
        }

        // additional costs
        $addStmt->execute([$pid]);
        $adds = $addStmt->fetchAll(PDO::FETCH_ASSOC);
        $addList = array_map(function($a){ return $a['description'] . ':' . $a['amount'];}, $adds);
        $addCostSum = 0;
        foreach ($adds as $a) { $addCostSum += (float)$a['amount']; }

        // payments
        $payStmt->execute([$pid]);
        $pays = $payStmt->fetchAll(PDO::FETCH_ASSOC);
        $payList = [];
        foreach ($pays as $pp) {
            $payList[] = '#'.$pp['payment_number'] . '|' . $pp['amount'] . '|' . $pp['due_date'] . '|' . $pp['status'];
        }

        // Total expenses (allocated dev cost + additional costs)
        $totalExpenses = $devCostSum + $addCostSum;

        fputcsv($out, [
            $pid,
            $p['name'],
            $p['client_name'] ?? '',
            $p['client_email'] ?? '',
            $p['status'],
            $p['start_date'],
            $p['end_date'],
            $p['total_revenue'],
            $p['total_profit'],
            // structural columns: developer list, developer_total_cost, additional_costs_list, additional_costs_total, total_expenses, payments_list, notes
            implode(' ; ', $devList),
            number_format($devCostSum,2,'.',''),
            implode(' ; ', $addList),
            number_format($addCostSum,2,'.',''),
            number_format($totalExpenses,2,'.',''),
            implode(' ; ', $payList),
            $p['notes'] ?? ''
        ]);
    }

    fclose($out);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

?>
