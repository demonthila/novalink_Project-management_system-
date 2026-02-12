<?php
// api/updateMilestoneDueDate.php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(["error" => "Method Not Allowed"]));
}

$data = getJsonInput();
$milestoneId = $data['milestoneId'] ?? null;
$dueDate = $data['dueDate'] ?? null;

if (!$milestoneId || !$dueDate) {
    http_response_code(400);
    exit(json_encode(["error" => "Milestone ID and due date required"]));
}

try {
    $sql = "UPDATE milestones SET due_date = ? WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$dueDate, $milestoneId]);
    
    echo json_encode([
        "success" => true, 
        "message" => "Payment reminder date updated successfully"
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
