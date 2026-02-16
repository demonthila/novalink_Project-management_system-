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
    // Use sub-selects for optimized aggregation.
    // Provide both payments-based revenue (actual received) and project-recorded revenue for clarity.
    $sql = "SELECT
        (SELECT IFNULL(SUM(amount),0) FROM payments WHERE status = 'Paid') AS total_revenue_payments,
        (SELECT IFNULL(SUM(total_revenue),0) FROM projects WHERE status IN ('Active','Completed','Finished')) AS total_revenue_projects,
        (SELECT IFNULL(SUM(pd.cost),0) FROM project_developers pd JOIN projects p ON p.id = pd.project_id WHERE p.status IN ('Active','Completed','Finished')) AS total_dev_cost,
        (SELECT IFNULL(SUM(ac.amount),0) FROM additional_costs ac JOIN projects p2 ON p2.id = ac.project_id WHERE p2.status IN ('Active','Completed','Finished')) AS total_add_cost,
        (SELECT COUNT(*) FROM projects) AS total_projects,
        (SELECT SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) FROM projects) AS active_projects,
        (SELECT SUM(CASE WHEN status IN ('Completed','Finished') THEN 1 ELSE 0 END) FROM projects) AS completed_projects,
        (SELECT SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) FROM projects) AS pending_projects,
        (SELECT COUNT(*) FROM clients) AS total_clients
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $r = $stmt->fetch(PDO::FETCH_ASSOC);

    // prefer payments-based actual received revenue as `total_revenue`,
    // but fall back to project-recorded revenue when no payments exist yet.
    $total_revenue_payments = isset($r['total_revenue_payments']) ? (float)$r['total_revenue_payments'] : 0.0;
    $total_revenue_projects = isset($r['total_revenue_projects']) ? (float)$r['total_revenue_projects'] : 0.0;
    $total_revenue = $total_revenue_payments > 0.0 ? $total_revenue_payments : $total_revenue_projects;
    $total_dev_cost = isset($r['total_dev_cost']) ? (float)$r['total_dev_cost'] : 0.0;
    $total_add_cost = isset($r['total_add_cost']) ? (float)$r['total_add_cost'] : 0.0;
    $total_expenses = $total_dev_cost + $total_add_cost;
    $total_profit = $total_revenue - $total_expenses;

    // Get currency from settings
    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'currency' LIMIT 1");
    $stmt->execute();
    $currency = $stmt->fetchColumn();
    $currency = $currency ? $currency : 'USD';

    // Get status distribution
    $stmt = $pdo->prepare("SELECT status, COUNT(*) as cnt FROM projects GROUP BY status");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $statusDist = [];
    foreach ($rows as $row) {
        $statusDist[$row['status']] = (int)$row['cnt'];
    }

    // Get overdue projects count
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM projects WHERE end_date IS NOT NULL AND end_date < CURRENT_DATE AND status NOT IN ('Completed', 'Finished')");
    $stmt->execute();
    $overdueProjects = (int)$stmt->fetchColumn();

    // Get payments analytics
    $stmt = $pdo->prepare("SELECT IFNULL(SUM(amount),0) FROM payments WHERE status = 'Paid'");
    $stmt->execute();
    $totalPaymentsReceived = (float)$stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT IFNULL(SUM(amount),0) FROM payments WHERE status != 'Paid'");
    $stmt->execute();
    $totalPendingPayments = (float)$stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT IFNULL(SUM(amount),0) FROM payments WHERE (status != 'Paid' OR status IS NULL) AND due_date < CURRENT_DATE");
    $stmt->execute();
    $overdueUnpaidTotal = (float)$stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM payments WHERE (status != 'Paid' OR status IS NULL) AND due_date < CURRENT_DATE");
    $stmt->execute();
    $overdueUnpaidCount = (int)$stmt->fetchColumn();

    // Get revenue vs expenses per recent projects (top 10)
    $stmt = $pdo->prepare(
        "SELECT pr.id, pr.name, IFNULL(pr.total_revenue, 0) AS revenue,
            (SELECT IFNULL(SUM(pd.cost),0) FROM project_developers pd WHERE pd.project_id = pr.id)
            + (SELECT IFNULL(SUM(amount),0) FROM additional_costs ac WHERE ac.project_id = pr.id) AS expenses
         FROM projects pr
         ORDER BY pr.created_at DESC
         LIMIT 10"
    );
    $stmt->execute();
    $revenueVsExpenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // normalize numeric types
    foreach ($revenueVsExpenses as &$rve) {
        $rve['revenue'] = isset($rve['revenue']) ? (float)$rve['revenue'] : 0.0;
        $rve['expenses'] = isset($rve['expenses']) ? (float)$rve['expenses'] : 0.0;
    }
    unset($rve);

    // Get monthly profit growth (last 12 months)
    $monthly = [];
    $now = new DateTime();
    for ($i = 11; $i >= 0; $i--) {
        $dt = (clone $now)->modify("-{$i} months");
        $y = $dt->format('Y');
        $m = $dt->format('m');
        $label = $dt->format('M Y');

        // Revenue: payments marked Paid in that month
        $stmt = $pdo->prepare("SELECT IFNULL(SUM(amount),0) FROM payments WHERE status = 'Paid' AND YEAR(paid_date) = ? AND MONTH(paid_date) = ?");
        $stmt->execute([$y, $m]);
        $rev = (float)$stmt->fetchColumn();

        // Expenses: project developer/additional costs for projects that started in that month
        $stmt = $pdo->prepare("SELECT IFNULL(SUM(pd.cost),0) FROM project_developers pd JOIN projects pr ON pd.project_id = pr.id WHERE YEAR(pr.start_date)=? AND MONTH(pr.start_date)=?");
        $stmt->execute([$y, $m]);
        $devs = (float)$stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT IFNULL(SUM(ac.amount),0) FROM additional_costs ac JOIN projects pr ON ac.project_id = pr.id WHERE YEAR(pr.start_date)=? AND MONTH(pr.start_date)=?");
        $stmt->execute([$y, $m]);
        $adds = (float)$stmt->fetchColumn();

        $expenses = $devs + $adds;
        $profit = $rev - $expenses;

        $monthly[] = ['label' => $label, 'year' => (int)$y, 'month' => (int)$m, 'revenue' => $rev, 'expenses' => $expenses, 'profit' => $profit];
    }

    // Get recent projects (simple list)
    $stmt = $pdo->prepare("SELECT id, name, status, IFNULL(total_revenue,0) as total_revenue, start_date, end_date FROM projects ORDER BY created_at DESC LIMIT 5");
    $stmt->execute();
    $recentProjects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get upcoming unpaid payments (next 5)
    $stmt = $pdo->prepare("SELECT p.id, p.project_id, p.amount, p.due_date, pr.name as project_name FROM payments p JOIN projects pr ON pr.id = p.project_id WHERE (p.status != 'Paid' OR p.status IS NULL) AND p.due_date >= CURRENT_DATE ORDER BY p.due_date ASC LIMIT 5");
    $stmt->execute();
    $upcomingPayments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get overdue unpaid payments list (limit 10)
    $stmt = $pdo->prepare("SELECT p.id, p.project_id, p.amount, p.due_date, pr.name as project_name FROM payments p JOIN projects pr ON pr.id = p.project_id WHERE (p.status != 'Paid' OR p.status IS NULL) AND p.due_date < CURRENT_DATE ORDER BY p.due_date ASC LIMIT 10");
    $stmt->execute();
    $overduePayments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $output = [
        'currency' => $currency,
        // primary revenue reflects actual payments received; keep project-recorded revenue for auditing
        'total_revenue' => $total_revenue,
        'total_revenue_payments' => $total_revenue_payments,
        'total_revenue_projects' => $total_revenue_projects,
        'total_expenses' => $total_expenses,
        'total_profit' => $total_profit,
        'total_dev_cost' => $total_dev_cost,
        'total_add_cost' => $total_add_cost,
        'total_projects' => isset($r['total_projects']) ? (int)$r['total_projects'] : 0,
        'active_projects' => isset($r['active_projects']) ? (int)$r['active_projects'] : 0,
        'completed_projects' => isset($r['completed_projects']) ? (int)$r['completed_projects'] : 0,
        'pending_projects' => isset($r['pending_projects']) ? (int)$r['pending_projects'] : 0,
        'overdue_projects' => $overdueProjects,
        'status_distribution' => $statusDist,
        'total_clients' => isset($r['total_clients']) ? (int)$r['total_clients'] : 0,
        'total_payments_received' => $totalPaymentsReceived,
        'total_pending_payments' => $totalPendingPayments,
        'overdue_unpaid_total' => $overdueUnpaidTotal,
        'overdue_unpaid_count' => $overdueUnpaidCount,
        'revenue_vs_expenses' => $revenueVsExpenses,
        'monthly' => $monthly,
        'recent_projects' => $recentProjects,
        'upcoming_payments' => $upcomingPayments,
        'overdue_payments' => $overduePayments,
    ];

    // Provide camelCase aliases for frontend compatibility
    $output['totalRevenue'] = $output['total_revenue'];
    $output['totalRevenuePayments'] = $output['total_revenue_payments'];
    $output['totalRevenueProjects'] = $output['total_revenue_projects'];
    $output['totalExpenses'] = $output['total_expenses'];
    $output['totalProfit'] = $output['total_profit'];
    $output['totalDevCost'] = $output['total_dev_cost'];
    $output['totalAddCost'] = $output['total_add_cost'];
    $output['totalProjects'] = $output['total_projects'];
    $output['activeProjects'] = $output['active_projects'];
    $output['completedProjects'] = $output['completed_projects'];
    $output['pendingProjects'] = $output['pending_projects'];
    $output['statusDistribution'] = $output['status_distribution'];
    $output['totalPaymentsReceived'] = $output['total_payments_received'];
    $output['totalPendingPayments'] = $output['total_pending_payments'];
    $output['overdueUnpaidTotal'] = $output['overdue_unpaid_total'];
    $output['overdueUnpaidCount'] = $output['overdue_unpaid_count'];
    $output['revenueVsExpenses'] = $output['revenue_vs_expenses'];
    $output['recentProjects'] = $output['recent_projects'];
    $output['upcomingPayments'] = $output['upcoming_payments'];
    $output['overduePayments'] = $output['overdue_payments'];

	header('Content-Type: application/json; charset=utf-8');
	echo json_encode($output);

} catch (PDOException $e) {
	http_response_code(500);
	echo json_encode(['error' => $e->getMessage()]);
}

