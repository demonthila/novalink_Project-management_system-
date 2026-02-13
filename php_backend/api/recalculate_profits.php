<?php
// api/recalculate_profits.php
// Recalculate total_profit for all projects based on current developer costs and additional costs
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed, use POST']);
    exit();
}

try {
    $projects = $pdo->query("SELECT id, total_revenue FROM projects")->fetchAll(PDO::FETCH_ASSOC);
    $updated = 0;
    $details = [];

    // Calculate only the amounts actually paid to developers: 40% advance, 60% final
    $stmtDev = $pdo->prepare("SELECT IFNULL(SUM((CASE WHEN is_advance_paid=1 THEN cost*0.4 ELSE 0 END) + (CASE WHEN is_final_paid=1 THEN cost*0.6 ELSE 0 END)),0) FROM project_developers WHERE project_id = ?");
    $stmtAdd = $pdo->prepare("SELECT IFNULL(SUM(amount),0) FROM additional_costs WHERE project_id = ?");
    $stmtUpdate = $pdo->prepare("UPDATE projects SET total_profit = ? WHERE id = ?");

    foreach ($projects as $p) {
        $pid = $p['id'];
        $revenue = (float)$p['total_revenue'];

        $stmtDev->execute([$pid]);
        $devCost = (float)$stmtDev->fetchColumn();

        $stmtAdd->execute([$pid]);
        $addCost = (float)$stmtAdd->fetchColumn();

        $profit = $revenue - ($devCost + $addCost);
        $stmtUpdate->execute([$profit, $pid]);

        $updated++;
        $details[] = ['project_id' => (int)$pid, 'revenue' => $revenue, 'dev_cost' => $devCost, 'add_cost' => $addCost, 'profit' => $profit];
    }

    echo json_encode(['success' => true, 'updated_projects' => $updated, 'details' => $details]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
