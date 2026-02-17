# 📝 Copy This Code to Fix Hostinger

## Step-by-Step Instructions

### 1. Login to Hostinger
Go to: **https://hpanel.hostinger.com**

### 2. Navigate to File Manager
1. Click on your hosting plan
2. Go to **Files** → **File Manager**
3. Navigate to: `public_html/api/`

### 3. Edit projects.php
1. Find the file: **projects.php**
2. Right-click → **Edit** (or click Edit icon)
3. **Select All** (Ctrl+A or Cmd+A)
4. **Delete** all existing code
5. **Copy** the code below and **Paste** it into the editor

### 4. Save
1. Click **Save** or **Save Changes**
2. Close the editor

### 5. Test
1. Go to your website
2. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
3. Try creating a project

---

## 📋 COPY THIS ENTIRE CODE BLOCK

```php
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
                if ($devId <= 0) continue; 

                $cost = (float)($dev['cost'] ?? 0);
                $isAdvance = !empty($dev['is_advance_paid']) ? 1 : 0;
                $isFinal = !empty($dev['is_final_paid']) ? 1 : 0;
                $dStmt->execute([$projectId, $devId, $cost, $isAdvance, $isFinal]);
                $totalDevCost += $cost;
                $totalDevPaid += ($isAdvance ? $cost * 0.4 : 0) + ($isFinal ? $cost * 0.6 : 0);
            }
        }

        // 3. Insert Additional Costs
        $totalAddCost = 0;
        if (!empty($data['additional_costs']) && is_array($data['additional_costs'])) {
            $cStmt = $pdo->prepare("INSERT INTO additional_costs (project_id, cost_type, description, amount) VALUES (?, ?, ?, ?)");
            foreach ($data['additional_costs'] as $cost) {
                if (empty($cost['description']) && empty($cost['amount'])) continue; 
                $amount = (float)($cost['amount'] ?? 0);
                $costType = $cost['cost_type'] ?? 'Third Party Cost';
                $cStmt->execute([$projectId, $costType, $cost['description'] ?? '', $amount]);
                $totalAddCost += $amount;
            }
        }

        // 4. Update Profit
        $profit = calculateProfit($revenue, $totalDevPaid, $totalAddCost);
        $pUpdate = $pdo->prepare("UPDATE projects SET total_profit = ? WHERE id = ?");
        $pUpdate->execute([$profit, $projectId]);

        // 5. Create 3 Scheduled Payments (30%, 30%, 40%)
        $p1 = $revenue * 0.30;
        $p2 = $revenue * 0.30;
        $p3 = $revenue * 0.40;
        
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
    if (!$id) exit(json_encode(["error" => "ID required"]));

    try {
        $pdo->beginTransaction();

        if (isset($data['status']) && ($data['status'] === 'Finished' || $data['status'] === 'Completed')) {
            $payCheck = $pdo->prepare("SELECT COUNT(*) as total, SUM(CASE WHEN LOWER(status)='paid' THEN 1 ELSE 0 END) as paid FROM payments WHERE project_id = ?");
            $payCheck->execute([$id]);
            $row = $payCheck->fetch();
            $totalPayments = isset($row['total']) ? intval($row['total']) : 0;
            $paidCount = isset($row['paid']) ? intval($row['paid']) : 0;
            
            $revStmt = $pdo->prepare("SELECT total_revenue FROM projects WHERE id = ?");
            $revStmt->execute([$id]);
            $totalRevenue = $revStmt->fetchColumn();
            
            $paidAmtStmt = $pdo->prepare("SELECT SUM(amount) FROM payments WHERE project_id = ? AND status = 'Paid'");
            $paidAmtStmt->execute([$id]);
            $paidAmt = $paidAmtStmt->fetchColumn() ?: 0;

            if ($totalPayments < 3 || $paidCount < $totalPayments || $paidAmt < $totalRevenue) {
                $pdo->rollBack();
                echo json_encode(["success" => false, "message" => "Please collect all remaining payments (minimum 3 milestones and full contractual value) before completing this project."]);
                exit;
            }
        }
        
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
                $name, $clientId, $startDate, $endDate, $status, $revenue, $currency, $notes, $id
            ]);
        }

        if (isset($data['developers'])) {
            $pdo->prepare("DELETE FROM project_developers WHERE project_id=?")->execute([$id]);
            $dStmt = $pdo->prepare("INSERT INTO project_developers (project_id, developer_id, cost, is_advance_paid, is_final_paid) VALUES (?, ?, ?, ?, ?)");
            foreach ($data['developers'] as $dev) {
                $devId = isset($dev['id']) ? intval($dev['id']) : 0;
                $cost = isset($dev['cost']) ? (float)$dev['cost'] : 0.0;
                $isAdvance = !empty($dev['is_advance_paid']) ? 1 : 0;
                $isFinal = !empty($dev['is_final_paid']) ? 1 : 0;
                $dStmt->execute([$id, $devId, $cost, $isAdvance, $isFinal]);
            }
        }

        if (isset($data['additional_costs'])) {
            $pdo->prepare("DELETE FROM additional_costs WHERE project_id=?")->execute([$id]);
            $cStmt = $pdo->prepare("INSERT INTO additional_costs (project_id, cost_type, description, amount) VALUES (?, ?, ?, ?)");
            foreach ($data['additional_costs'] as $cost) {
                $costType = $cost['cost_type'] ?? 'Third Party Cost';
                $cStmt->execute([$id, $costType, $cost['description'], $cost['amount']]);
            }
        }
        
        $revStmt = $pdo->prepare("SELECT total_revenue FROM projects WHERE id=?");
        $revStmt->execute([$id]);
        $revenue = $revStmt->fetchColumn();

        $devCostStmt = $pdo->prepare("SELECT IFNULL(SUM((CASE WHEN is_advance_paid=1 THEN cost*0.4 ELSE 0 END) + (CASE WHEN is_final_paid=1 THEN cost*0.6 ELSE 0 END)),0) as paid_sum FROM project_developers WHERE project_id=?");
        $devCostStmt->execute([$id]);
        $devCost = $devCostStmt->fetchColumn() ?: 0;

        $addCostStmt = $pdo->prepare("SELECT SUM(amount) FROM additional_costs WHERE project_id=?");
        $addCostStmt->execute([$id]);
        $addCost = $addCostStmt->fetchColumn() ?: 0;

        $profit = calculateProfit($revenue, $devCost, $addCost);
        $pdo->prepare("UPDATE projects SET total_profit=? WHERE id=?")->execute([$profit, $id]);

        $pdo->commit();
        echo json_encode(["success" => true, "message" => "Project updated"]);

    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}

elseif ($method === 'DELETE') {
    if (!$id) exit(json_encode(["error" => "ID required"]));
    
    try {
        $pdo->beginTransaction();
        $pdo->prepare("DELETE FROM payments WHERE project_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM project_developers WHERE project_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM additional_costs WHERE project_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM notifications WHERE project_id = ?")->execute([$id]);
        
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
```

---

## ✅ After Saving

1. **Close the editor**
2. **Go to your website**: https://novaprojects.novalinkinnovations.com
3. **Clear browser cache**: Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. **Try creating a project**

---

## 🎉 Done!

Project creation should now work properly with better error messages if anything goes wrong.
