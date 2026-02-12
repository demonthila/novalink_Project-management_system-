<?php
// api/dashboard.php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $response = [];
    
    // 1. Total Revenue (sum of total_revenue from ALL projects)
    $stmt = $pdo->query("SELECT SUM(total_revenue) FROM projects");
    $response['totalRevenue'] = (float)$stmt->fetchColumn();
    
    // 2. Total Expenses (sum of costs of ALL projects)
    // Calc: sum(developers) + sum(additional)
    $devCost = $pdo->query("SELECT SUM(cost) FROM project_developers")->fetchColumn();
    $addCost = $pdo->query("SELECT SUM(amount) FROM additional_costs")->fetchColumn();
    $response['totalExpenses'] = (float)($devCost + $addCost);
    
    // 3. Total Profit (Calculated)
    $response['totalProfit'] = $response['totalRevenue'] - $response['totalExpenses'];
    
    // 4. Pending Payments
    $pendStmt = $pdo->query("SELECT SUM(amount) FROM payments WHERE status = 'Unpaid'");
    $response['pendingPaymentsTotal'] = (float)$pendStmt->fetchColumn();
    
    // 5. Project Counts
    $pCount = $pdo->query("SELECT status, COUNT(*) as count FROM projects GROUP BY status");
    $response['projectStats'] = $pCount->fetchAll(PDO::FETCH_KEY_PAIR); // e.g. ['Pending' => 2, 'Active' => 5]
    
    // 6. Recent Projects
    $recStmt = $pdo->query("SELECT id, name, status, total_revenue FROM projects ORDER BY created_at DESC LIMIT 5");
    $response['recentProjects'] = $recStmt->fetchAll();
    
    // 7. Upcoming Payments
    $upPay = $pdo->query("
        SELECT p.id, p.amount, p.due_date, pr.name as project_name 
        FROM payments p
        JOIN projects pr ON p.project_id = pr.id
        WHERE p.status = 'Unpaid' AND p.due_date >= CURRENT_DATE
        ORDER BY p.due_date ASC
        LIMIT 5
    ");
    $response['upcomingPayments'] = $upPay->fetchAll();

    echo json_encode($response);
}
?>
