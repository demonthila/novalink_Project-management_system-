<?php
// api/updatePayment.php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(["error" => "Method Not Allowed"]));
}

$data = getJsonInput();
$milestoneId = $data['milestoneId'] ?? null;
$isPaid = $data['isPaid'] ?? false;
$paidDate = $data['paidDate'] ?? null;

if (!$milestoneId) {
    http_response_code(400);
    exit(json_encode(["error" => "Milestone ID required"]));
}

try {
    // We update the milestones table primarily.
    // Assuming 'paid_date' column exists or we interpret 'is_paid'
    // Let's ensure schema supports paid_date first. 
    // If not, we just toggle is_paid. The user requirements said: "Payment 1 status (paid/unpaid) + date"
    // So we should ALTER table if needed, but for PHP code we assume column 'paid_date' exists.
    
    // Check if column exists, if not, we can't save date easily without schema change.
    // For now, let's update is_paid.
    
    $sql = "UPDATE milestones SET is_paid = ?, paid_date = ? WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$isPaid ? 1 : 0, $paidDate, $milestoneId]);
    
    echo json_encode(["success" => true, "message" => "Payment status updated"]);

} catch (PDOException $e) {
    // If 'paid_date' column error, we might need to handle it.
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
