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
    
    $sql = "UPDATE payments SET status = ?, paid_date = ? WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$isPaid ? 'Paid' : 'Unpaid', $paidDate, $milestoneId]);
    
    // Automatic Status Change Logic
    // 1. Get project_id for this milestone
    $pStmt = $pdo->prepare("SELECT project_id FROM payments WHERE id = ?");
    $pStmt->execute([$milestoneId]);
    $projectId = $pStmt->fetchColumn();
    
    if ($projectId) {
        // 2. Count total milestones and paid milestones for this project
        $countStmt = $pdo->prepare("SELECT 
            COUNT(*) as total_milestones,
            SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as paid_milestones,
            SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as total_paid
            FROM payments WHERE project_id = ?");
        $countStmt->execute([$projectId]);
        $counts = $countStmt->fetch(PDO::FETCH_ASSOC);
        
        // 3. Get project contractual value
        $revStmt = $pdo->prepare("SELECT total_revenue FROM projects WHERE id = ?");
        $revStmt->execute([$projectId]);
        $totalRevenue = $revStmt->fetchColumn();
        
        // 4. If total == 3 AND paid == 3 AND paid_amount >= total_revenue, update project status to 'Finished'
        if ($counts['total_milestones'] == 3 && $counts['paid_milestones'] == 3 && $counts['total_paid'] >= $totalRevenue) {
            $updProject = $pdo->prepare("UPDATE projects SET status = 'Finished' WHERE id = ?");
            $updProject->execute([$projectId]);
            echo json_encode(["success" => true, "message" => "Payment updated. Project successfully completed and archived.", "status_changed" => "Finished"]);
            exit();
        }
    }
    
    echo json_encode(["success" => true, "message" => "Payment status updated"]);

} catch (PDOException $e) {
    // If 'paid_date' column error, we might need to handle it.
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
