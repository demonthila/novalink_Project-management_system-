
<?php
// api/dashboard.php
// Enhanced dashboard endpoint: returns financial, project and payment analytics
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    http_response_code(405);
    <?php
    // api/dashboard.php
    // Returns optimized analytics for Stratis dashboard
    require_once __DIR__ . '/config.php';

    $method = $_SERVER['REQUEST_METHOD'];
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        exit();
    }

    try {
        // Use sub-selects for optimized aggregation; only include Active and Completed projects for revenue/expenses
        $sql = "SELECT
            (SELECT IFNULL(SUM(total_revenue),0) FROM projects WHERE status IN ('Active','Completed')) AS total_revenue,
            (SELECT IFNULL(SUM(pd.cost),0) FROM project_developers pd JOIN projects p ON p.id = pd.project_id WHERE p.status IN ('Active','Completed')) AS total_dev_cost,
            (SELECT IFNULL(SUM(ac.amount),0) FROM additional_costs ac JOIN projects p2 ON p2.id = ac.project_id WHERE p2.status IN ('Active','Completed')) AS total_add_cost,
            (SELECT COUNT(*) FROM projects) AS total_projects,
            (SELECT SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) FROM projects) AS active_projects,
            (SELECT SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) FROM projects) AS completed_projects,
            (SELECT SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) FROM projects) AS pending_projects,
            (SELECT COUNT(*) FROM clients) AS total_clients
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $r = $stmt->fetch(PDO::FETCH_ASSOC);

        $total_revenue = isset($r['total_revenue']) ? (float)$r['total_revenue'] : 0.0;
        $total_dev_cost = isset($r['total_dev_cost']) ? (float)$r['total_dev_cost'] : 0.0;
        $total_add_cost = isset($r['total_add_cost']) ? (float)$r['total_add_cost'] : 0.0;
        $total_expenses = $total_dev_cost + $total_add_cost;
        $total_profit = $total_revenue - $total_expenses;

        $output = [
            'total_revenue' => $total_revenue,
            'total_expenses' => $total_expenses,
            'total_profit' => $total_profit,
            'total_projects' => isset($r['total_projects']) ? (int)$r['total_projects'] : 0,
            'active_projects' => isset($r['active_projects']) ? (int)$r['active_projects'] : 0,
            'completed_projects' => isset($r['completed_projects']) ? (int)$r['completed_projects'] : 0,
            'pending_projects' => isset($r['pending_projects']) ? (int)$r['pending_projects'] : 0,
            'total_clients' => isset($r['total_clients']) ? (int)$r['total_clients'] : 0,
        ];

        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($output);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

    ?>

