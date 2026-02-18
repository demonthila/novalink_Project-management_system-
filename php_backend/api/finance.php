<?php
// api/finance.php
// Handles additional costs and detailed finance logs.

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Input for Cost operations
$costId = isset($_GET['id']) ? intval($_GET['id']) : null;
$projectId = isset($_GET['projectId']) ? intval($_GET['projectId']) : null;

// GET Request - List Costs for Specific Project or All
if ($method === 'GET') {
    if ($projectId) {
        $stmt = $pdo->prepare("SELECT * FROM additional_costs WHERE project_id = ? ORDER BY id DESC");
        $stmt->execute([$projectId]);
        echo json_encode($stmt->fetchAll());
    } else {
        // List all costs globally (e.g. for Finance Tab)
        $stmt = $pdo->query("SELECT * FROM additional_costs ORDER BY id DESC");
        $costs = $stmt->fetchAll();
        
        // Include project name
        $stmt = $pdo->query("SELECT id, name FROM projects");
        $projects = $stmt->fetchAll(PDO::FETCH_KEY_PAIR); // [id => name]

        foreach ($costs as &$cost) {
            $cost['projectName'] = isset($projects[$cost['project_id']]) ? $projects[$cost['project_id']] : 'Unknown';
        }
        echo json_encode($costs);
    }
}

// POST Request - Add New Cost
elseif ($method === 'POST') {
    $data = getJsonInput();
    
    // Normalize Project ID
    $pId = $data['projectId'] ?? $data['project_id'] ?? null;
    $amount = isset($data['amount']) ? (float)$data['amount'] : 0;

    // Validate Input
    if (!$pId || $amount <= 0) {
        http_response_code(400);
        exit(json_encode(["error" => "Valid Amount and Project ID required"]));
    }

    // Verify Project Exists
    $check = $pdo->prepare("SELECT id FROM projects WHERE id = ?");
    $check->execute([$pId]);
    if (!$check->fetch()) {
        http_response_code(404);
        exit(json_encode(["error" => "Project not found"]));
    }

    $sql = "INSERT INTO additional_costs (project_id, cost_type, description, amount) VALUES (?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $pId,
        $data['cost_type'] ?? 'Third Party Cost',
        $data['description'] ?? '',
        $amount
    ]);

    $newId = (int)$pdo->lastInsertId();

    // Recalculate Project Profit
    try {
        // Fetch fresh totals for calculation
        $revStmt = $pdo->prepare("SELECT total_revenue FROM projects WHERE id = ?");
        $revStmt->execute([$pId]);
        $revenue = (float)$revStmt->fetchColumn();

        // Calculate developer PAID amounts
        $devCostStmt = $pdo->prepare("SELECT IFNULL(SUM(
            (CASE WHEN is_advance_paid=1 THEN cost*0.4 ELSE 0 END) +
            (CASE WHEN is_final_paid=1 THEN cost*0.6 ELSE 0 END)
        ),0) as paid_sum FROM project_developers WHERE project_id = ?");
        $devCostStmt->execute([$pId]);
        $devPaidAmt = (float)$devCostStmt->fetchColumn();

        $addCostStmt = $pdo->prepare("SELECT SUM(amount) FROM additional_costs WHERE project_id = ?");
        $addCostStmt->execute([$pId]);
        $addCostTotal = (float)$addCostStmt->fetchColumn();

        $profit = $revenue - ($devPaidAmt + $addCostTotal);

        $pUpdate = $pdo->prepare("UPDATE projects SET total_profit = ? WHERE id = ?");
        $pUpdate->execute([$profit, $pId]);
    } catch (Exception $e) {
        // Log but don't fail the primary insertion response
    }

    echo json_encode([
        "success" => true,
        "id" => $newId,
        "message" => "Cost recorded successfully",
        "new_profit" => $profit ?? null
    ]);
}

// DELETE Request
elseif ($method === 'DELETE') {
    if (!$costId) {
        http_response_code(400); 
        exit(json_encode(["error" => "Cost ID required"]));
    }
    
    $stmt = $pdo->prepare("DELETE FROM additional_costs WHERE id = ?");
    $stmt->execute([$costId]);
    echo json_encode(["success" => true, "message" => "Cost deleted"]);
}

// PUT Request (Optional - Update cost amount/details)
elseif ($method === 'PUT') {
    // Similar to POST but with UPDATE logic
}
?>
