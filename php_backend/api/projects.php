<?php
// api/projects.php
session_start();
require_once __DIR__ . '/config.php';

// Authentication is handled by config.php

// Ensure project_developers has payment flag columns (idempotent)
try {
    $colStmt = $pdo->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'project_developers' AND COLUMN_NAME = :col");
    $cols = ['is_advance_paid', 'is_final_paid'];
    foreach ($cols as $col) {
        $colStmt->execute([':db' => DB_NAME, ':col' => $col]);
        $exists = (int)$colStmt->fetchColumn() > 0;
        if (!$exists) {
            // Add column safely
            $pdo->exec("ALTER TABLE project_developers ADD COLUMN `" . $col . "` TINYINT(1) DEFAULT 0");
        }
    }
} catch (Exception $e) {
    // Non-fatal: if this fails, subsequent queries may error — leave handling to callers
}

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

// Helper to calculate profit
function calculateProfit($revenue, $devCosts, $addCosts) {
    return $revenue - ($devCosts + $addCosts);
}

if ($method === 'GET') {
    if ($id) {
        // Fetch Single Project
        $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ?");
        $stmt->execute([$id]);
        $project = $stmt->fetch();

        if ($project) {
            // Fetch Payments
            $pStmt = $pdo->prepare("SELECT * FROM payments WHERE project_id = ? ORDER BY payment_number ASC");
            $pStmt->execute([$id]);
            $project['payments'] = $pStmt->fetchAll();

            // Fetch Developers
            $dStmt = $pdo->prepare(
                "SELECT d.id, d.name, d.role, pd.cost, IFNULL(pd.is_advance_paid,0) AS is_advance_paid, IFNULL(pd.is_final_paid,0) AS is_final_paid
                FROM developers d
                JOIN project_developers pd ON d.id = pd.developer_id
                WHERE pd.project_id = ?
            ");
            $dStmt->execute([$id]);
            $project['developers'] = $dStmt->fetchAll();

            // Fetch Additional Costs
            $cStmt = $pdo->prepare("SELECT * FROM additional_costs WHERE project_id = ?");
            $cStmt->execute([$id]);
            $project['additional_costs'] = $cStmt->fetchAll();

            echo json_encode($project);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Project not found"]);
        }
    } else {
        // List All Projects
        $stmt = $pdo->query("SELECT * FROM projects ORDER BY created_at DESC");
        echo json_encode($stmt->fetchAll());
    }
}

elseif ($method === 'POST') {
    $data = getJsonInput();

    try {
        // Enhanced validation with detailed error messages
        if (empty($data['name'])) {
            throw new Exception("Project name is required");
        }
        
        if (empty($data['client_id']) || !is_numeric($data['client_id'])) {
            throw new Exception("Valid client selection is required");
        }

        $pdo->beginTransaction();

        // 1. Insert Project
        $revenue = isset($data['total_revenue']) ? (float)$data['total_revenue'] : 0;
        $startDate = !empty($data['start_date']) ? $data['start_date'] : null;
        $endDate = !empty($data['end_date']) ? $data['end_date'] : null;

        $sql = "INSERT INTO projects (name, client_id, start_date, end_date, status, total_revenue, currency, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        
        $executeResult = $stmt->execute([
            trim($data['name']),
            intval($data['client_id']),
            $startDate,
            $endDate,
            $data['status'] ?? 'Pending',
            $revenue,
            $data['currency'] ?? 'USD',
            $data['notes'] ?? ''
        ]);
        
        if (!$executeResult) {
            $errorInfo = $stmt->errorInfo();
            throw new Exception("Failed to insert project: " . ($errorInfo[2] ?? 'Unknown database error'));
        }
        
        $projectId = $pdo->lastInsertId();
        
        if (!$projectId || $projectId <= 0) {
            throw new Exception("Failed to get project ID after insertion");
        }

        // 2. Insert Developers & Calculate Dev Costs
        $totalDevCost = 0;
        $totalDevPaid = 0;
        if (!empty($data['developers']) && is_array($data['developers'])) {
            $dStmt = $pdo->prepare("INSERT INTO project_developers (project_id, developer_id, cost, is_advance_paid, is_final_paid) VALUES (?, ?, ?, ?, ?)");
            foreach ($data['developers'] as $dev) {
                $devId = isset($dev['id']) ? intval($dev['id']) : 0;
                if ($devId <= 0) continue; // SKIP if no developer selected

                $cost = (float)($dev['cost'] ?? 0);
                $isAdvance = !empty($dev['is_advance_paid']) ? 1 : 0;
                $isFinal = !empty($dev['is_final_paid']) ? 1 : 0;
                $dStmt->execute([$projectId, $devId, $cost, $isAdvance, $isFinal]);
                $totalDevCost += $cost;
                // paid amount for this developer (40% advance, 60% final)
                $totalDevPaid += ($isAdvance ? $cost * 0.4 : 0) + ($isFinal ? $cost * 0.6 : 0);
            }
        }

        // 3. Insert Additional Costs
        $totalAddCost = 0;
        if (!empty($data['additional_costs']) && is_array($data['additional_costs'])) {
            $cStmt = $pdo->prepare("INSERT INTO additional_costs (project_id, cost_type, description, amount) VALUES (?, ?, ?, ?)");
            foreach ($data['additional_costs'] as $cost) {
                if (empty($cost['description']) && empty($cost['amount'])) continue; // SKIP empty rows
                $amount = (float)($cost['amount'] ?? 0);
                $costType = $cost['cost_type'] ?? 'Third Party Cost';
                $cStmt->execute([$projectId, $costType, $cost['description'] ?? '', $amount]);
                $totalAddCost += $amount;
            }
        }

        // 4. Update Profit (based on payments made to developers)
        $profit = calculateProfit($revenue, $totalDevPaid, $totalAddCost);
        $pUpdate = $pdo->prepare("UPDATE projects SET total_profit = ? WHERE id = ?");
        $pUpdate->execute([$profit, $projectId]);

        // 5. Create 3 Scheduled Payments (30%, 30%, 40%)
        $p1 = $revenue * 0.30;
        $p2 = $revenue * 0.30;
        $p3 = $revenue * 0.40;
        
        // Due dates logic
        $start = !empty($data['start_date']) ? new DateTime($data['start_date']) : new DateTime();
        $end = !empty($data['end_date']) ? new DateTime($data['end_date']) : (clone $start)->modify('+1 month');
        
        $diff = $start->diff($end);
        $totalDays = $diff->days;
        $midDays = floor($totalDays / 2);
        $mid = (clone $start)->modify("+$midDays days");

        $payStmt = $pdo->prepare("INSERT INTO payments (project_id, payment_number, amount, due_date, status) VALUES (?, ?, ?, ?, 'Unpaid')");
        $payStmt->execute([$projectId, 1, $p1, $start->format('Y-m-d')]);
        $payStmt->execute([$projectId, 2, $p2, $mid->format('Y-m-d')]);
        $payStmt->execute([$projectId, 3, $p3, $end->format('Y-m-d')]);

        $pdo->commit();
        
        http_response_code(201);
        echo json_encode([
            "success" => true, 
            "id" => $projectId, 
            "message" => "Project created successfully"
        ]);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode([
            "success" => false, 
            "error" => $e->getMessage(),
            "message" => $e->getMessage()
        ]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode([
            "success" => false, 
            "error" => "System error: " . $e->getMessage(),
            "message" => "System error: " . $e->getMessage()
        ]);
    }
}

elseif ($method === 'PUT') {
    $data = getJsonInput();
    try {
        $pdo->beginTransaction();

        // Fetch current project state
        $currStmt = $pdo->prepare("SELECT total_revenue, status, start_date, end_date FROM projects WHERE id = ?");
        $currStmt->execute([$id]);
        $currentProject = $currStmt->fetch();

        if (!$currentProject) {
            throw new Exception("Project not found");
        }

        $oldRevenue = (float)$currentProject['total_revenue'];
        $oldStart = $currentProject['start_date'];
        $oldEnd = $currentProject['end_date'];

        // If request attempts to mark project as Finished/Completed, validate all payments are received
        if (isset($data['status']) && ($data['status'] === 'Finished' || $data['status'] === 'Completed')) {
            $payCheck = $pdo->prepare("SELECT COUNT(*) as total, SUM(CASE WHEN LOWER(status)='paid' THEN 1 ELSE 0 END) as paid FROM payments WHERE project_id = ?");
            $payCheck->execute([$id]);
            $row = $payCheck->fetch();
            $totalPayments = isset($row['total']) ? intval($row['total']) : 0;
            $paidCount = isset($row['paid']) ? intval($row['paid']) : 0;
            
            // Re-fetch project to check revenue vs paid amount
            $revenue = isset($data['total_revenue']) ? floatval($data['total_revenue']) : $oldRevenue;
            
            $paidAmtStmt = $pdo->prepare("SELECT SUM(amount) FROM payments WHERE project_id = ? AND status = 'Paid'");
            $paidAmtStmt->execute([$id]);
            $paidAmt = $paidAmtStmt->fetchColumn() ?: 0;

            if ($totalPayments < 3 || $paidCount < $totalPayments || $paidAmt < ($revenue - 0.01)) { // Small epsilon for float comparison
                $pdo->rollBack();
                echo json_encode(["success" => false, "message" => "Please collect all remaining payments (minimum 3 milestones and full contractual value) before completing this project. Current Paid: $paidAmt, Target: $revenue"]);
                exit;
            }
        }
        
        // Update Project Table
        if (isset($data['name'])) {
            $name = trim($data['name']);
            $clientId = intval($data['client_id'] ?? 0);
            $startDate = !empty($data['start_date']) ? $data['start_date'] : null;
            $endDate = !empty($data['end_date']) ? $data['end_date'] : null;
            $status = $data['status'] ?? 'Pending';
            $revenue = floatval($data['total_revenue'] ?? 0);
            $currency = $data['currency'] ?? 'USD';
            $notes = $data['notes'] ?? '';

            if (empty($name) || $clientId <= 0) {
                throw new Exception("Project name and valid client are required.");
            }

            $sql = "UPDATE projects SET name=?, client_id=?, start_date=?, end_date=?, status=?, total_revenue=?, currency=?, notes=? WHERE id=?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $name,
                $clientId,
                $startDate,
                $endDate,
                $status,
                $revenue,
                $currency,
                $notes,
                $id
            ]);

            // Handling Payment Recap if Revenue or Dates Changed
            $revenueChanged = abs($revenue - $oldRevenue) > 0.01;
            $datesChanged = $startDate !== $oldStart || $endDate !== $oldEnd;

            if ($revenueChanged || $datesChanged) {
                // Check if we have standard 3 milestones and none are paid
                $pCountStmt = $pdo->prepare("SELECT COUNT(*) FROM payments WHERE project_id = ?");
                $pCountStmt->execute([$id]);
                $pCount = (int)$pCountStmt->fetchColumn();

                $paidCountStmt = $pdo->prepare("SELECT COUNT(*) FROM payments WHERE project_id = ? AND status = 'Paid'");
                $paidCountStmt->execute([$id]);
                $paidCount = (int)$paidCountStmt->fetchColumn();

                if ($pCount === 3 && $paidCount === 0) {
                    // Safe to recalculate based on standard 30-30-40 split
                    $pValues = [$revenue * 0.30, $revenue * 0.30, $revenue * 0.40];
                    
                    // Recalculate dates
                    $start = !empty($startDate) ? new DateTime($startDate) : new DateTime();
                    $end = !empty($endDate) ? new DateTime($endDate) : (clone $start)->modify('+1 month');
                    $diff = $start->diff($end);
                    $totalDays = $diff->days;
                    $midDays = floor($totalDays / 2);
                    $mid = (clone $start)->modify("+$midDays days");
                    $pDates = [$start->format('Y-m-d'), $mid->format('Y-m-d'), $end->format('Y-m-d')];

                    $updPay = $pdo->prepare("UPDATE payments SET amount = ?, due_date = ? WHERE project_id = ? AND payment_number = ?");
                    for ($i = 0; $i < 3; $i++) {
                        $updPay->execute([$pValues[$i], $pDates[$i], $id, $i + 1]);
                    }
                }
            }
        }

        // Update Developers (Delete all, re-insert)
        if (isset($data['developers']) && is_array($data['developers'])) {
            $pdo->prepare("DELETE FROM project_developers WHERE project_id=?")->execute([$id]);
            $dStmt = $pdo->prepare("INSERT INTO project_developers (project_id, developer_id, cost, is_advance_paid, is_final_paid) VALUES (?, ?, ?, ?, ?)");
            foreach ($data['developers'] as $dev) {
                $devId = isset($dev['id']) ? intval($dev['id']) : 0;
                if ($devId <= 0) continue; 
                
                $cost = (float)($dev['cost'] ?? 0);
                $isAdvance = !empty($dev['is_advance_paid']) ? 1 : 0;
                $isFinal = !empty($dev['is_final_paid']) ? 1 : 0;
                $dStmt->execute([$id, $devId, $cost, $isAdvance, $isFinal]);
            }
        }

        // Update Additional Costs
        if (isset($data['additional_costs']) && is_array($data['additional_costs'])) {
            $pdo->prepare("DELETE FROM additional_costs WHERE project_id=?")->execute([$id]);
            $cStmt = $pdo->prepare("INSERT INTO additional_costs (project_id, cost_type, description, amount) VALUES (?, ?, ?, ?)");
            foreach ($data['additional_costs'] as $cost) {
                if (empty($cost['description']) && empty($cost['amount'])) continue; 
                $costType = $cost['cost_type'] ?? 'Third Party Cost';
                $amount = (float)($cost['amount'] ?? 0);
                $cStmt->execute([$id, $costType, $cost['description'] ?? '', $amount]);
            }
        }
        
        // Recalculate Profit
        $revStmt = $pdo->prepare("SELECT total_revenue FROM projects WHERE id=?");
        $revStmt->execute([$id]);
        $finalRevenue = (float)$revStmt->fetchColumn();

        // Calculate developer PAID amounts
        $devCostStmt = $pdo->prepare("SELECT IFNULL(SUM(
            (CASE WHEN is_advance_paid=1 THEN cost*0.4 ELSE 0 END) +
            (CASE WHEN is_final_paid=1 THEN cost*0.6 ELSE 0 END)
        ),0) as paid_sum FROM project_developers WHERE project_id=?");
        $devCostStmt->execute([$id]);
        $devPaidAmt = (float)$devCostStmt->fetchColumn();

        $addCostStmt = $pdo->prepare("SELECT SUM(amount) FROM additional_costs WHERE project_id=?");
        $addCostStmt->execute([$id]);
        $addCostTotal = (float)$addCostStmt->fetchColumn();

        $profit = calculateProfit($finalRevenue, $devPaidAmt, $addCostTotal);
        $pdo->prepare("UPDATE projects SET total_profit=? WHERE id=?")->execute([$profit, $id]);

        $pdo->commit();
        echo json_encode(["success" => true, "message" => "Project updated successfully", "profit" => $profit]);

    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}

elseif ($method === 'DELETE') {
    if (!$id) exit(json_encode(["error" => "ID required"]));
    
    try {
        $pdo->beginTransaction();
        
        // Delete related data first
        $pdo->prepare("DELETE FROM payments WHERE project_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM project_developers WHERE project_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM additional_costs WHERE project_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM notifications WHERE project_id = ?")->execute([$id]);
        
        // Finally delete project
        $stmt = $pdo->prepare("DELETE FROM projects WHERE id = ?");
        $stmt->execute([$id]);
        
        $pdo->commit();
        echo json_encode(["success" => true, "message" => "Project and all related data deleted"]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to delete project: " . $e->getMessage()]);
    }
}
