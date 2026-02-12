<?php
// api/payments.php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$projectId = isset($_GET['project_id']) ? intval($_GET['project_id']) : null;
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

// GET Payments
if ($method === 'GET') {
    if ($projectId) {
        $stmt = $pdo->prepare("SELECT * FROM payments WHERE project_id = ? ORDER BY due_date ASC");
        $stmt->execute([$projectId]);
        echo json_encode($stmt->fetchAll());
    } elseif ($id) {
        $stmt = $pdo->prepare("SELECT * FROM payments WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode($stmt->fetch());
    } else {
        // List all pending payments sorted by due date
        $stmt = $pdo->query("
            SELECT p.*, pr.name as project_name 
            FROM payments p
            JOIN projects pr ON p.project_id = pr.id
            ORDER BY p.due_date ASC
        ");
        echo json_encode($stmt->fetchAll());
    }
}

// PUT Update Payment (Mark Paid, Change Date)
elseif ($method === 'PUT') {
    $data = getJsonInput();
    if (!$id && isset($data['id'])) $id = $data['id'];
    
    if (!$id) {
        http_response_code(400);
        exit(json_encode(["error" => "ID required"]));
    }
    
    $fields = [];
    $params = [];
    
    if (isset($data['status'])) {
        $fields[] = "status = ?";
        $params[] = $data['status'];
        if ($data['status'] === 'Paid' && !isset($data['paid_date'])) {
            $fields[] = "paid_date = CURRENT_DATE";
        } elseif ($data['status'] === 'Unpaid') {
            $fields[] = "paid_date = NULL";
        }
    }
    
    if (isset($data['due_date'])) {
        $fields[] = "due_date = ?";
        $params[] = $data['due_date'];
    }

    if (isset($data['amount'])) {
        $fields[] = "amount = ?";
        $params[] = $data['amount'];
    }
    
    if (!empty($fields)) {
        $params[] = $id;
        $sql = "UPDATE payments SET " . implode(", ", $fields) . " WHERE id = ?";
        $pdo->prepare($sql)->execute($params);
        echo json_encode(["success" => true, "message" => "Payment updated"]);
    } else {
        echo json_encode(["success" => false, "message" => "No changes"]);
    }
}
?>
