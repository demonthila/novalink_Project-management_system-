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

    // Validate Input
    if (empty($data['amount']) || empty($data['projectId'])) {
        http_response_code(400);
        exit(json_encode(["error" => "Amount and Project ID required"]));
    }

    $sql = "INSERT INTO additional_costs (project_id, name, description, amount) VALUES (?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['projectId'],
        $data['name'] ?? 'Cost',
        $data['description'] ?? '',
        $data['amount']
    ]);

    echo json_encode([
        "success" => true,
        "id" => $pdo->lastInsertId(),
        "message" => "Cost recorded"
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
