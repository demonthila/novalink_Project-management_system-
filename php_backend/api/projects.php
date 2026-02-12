<?php
// api/projects.php
session_start();
require_once 'config.php';

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
            $dStmt = $pdo->prepare("
                SELECT d.id, d.name, d.role, pd.cost 
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
        $pdo->beginTransaction();

        // Validate Input
        if (empty($data['name']) || empty($data['client_id'])) {
            throw new Exception("Name and Client are required");
        }

        // 1. Insert Project
        $revenue = isset($data['total_revenue']) ? (float)$data['total_revenue'] : 0;
        $sql = "INSERT INTO projects (name, client_id, start_date, end_date, status, total_revenue, currency, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data['name'],
            $data['client_id'],
            $data['start_date'] ?? null,
            $data['end_date'] ?? null,
            $data['status'] ?? 'Pending',
            $revenue,
            $data['currency'] ?? 'USD',
            $data['notes'] ?? ''
        ]);
        $projectId = $pdo->lastInsertId();

        // 2. Insert Developers & Calculate Dev Costs
        $totalDevCost = 0;
        if (!empty($data['developers'])) {
            $dStmt = $pdo->prepare("INSERT INTO project_developers (project_id, developer_id, cost) VALUES (?, ?, ?)");
            foreach ($data['developers'] as $dev) {
                $cost = (float)$dev['cost'];
                $dStmt->execute([$projectId, $dev['id'], $cost]);
                $totalDevCost += $cost;
            }
        }

        // 3. Insert Additional Costs
        $totalAddCost = 0;
        if (!empty($data['additional_costs'])) {
            $cStmt = $pdo->prepare("INSERT INTO additional_costs (project_id, description, amount) VALUES (?, ?, ?)");
            foreach ($data['additional_costs'] as $cost) {
                $amount = (float)$cost['amount'];
                $cStmt->execute([$projectId, $cost['description'], $amount]);
                $totalAddCost += $amount;
            }
        }

        // 4. Update Profit
        $profit = calculateProfit($revenue, $totalDevCost, $totalAddCost);
        $pUpdate = $pdo->prepare("UPDATE projects SET total_profit = ? WHERE id = ?");
        $pUpdate->execute([$profit, $projectId]);

        // 5. Create 3 Scheduled Payments (30%, 30%, 40%)
        // If revenue is 0, payments are 0.
        $p1 = $revenue * 0.30;
        $p2 = $revenue * 0.30;
        $p3 = $revenue * 0.40;
        
        // Due dates logic: 
        // Payment 1: Start Date (or Now)
        // Payment 2: Mid-point? Or manual? Let's verify requirement.
        // User says: "Manage 3 scheduled payments per project". 
        // Logic: Set defaults, allow edit later.
        // Default: 1st on Start, 2nd mid-way, 3rd on End.
        
        $start = !empty($data['start_date']) ? new DateTime($data['start_date']) : new DateTime();
        $end = !empty($data['end_date']) ? new DateTime($data['end_date']) : (clone $start)->modify('+1 month');
        
        $mid = (clone $start)->add($start->diff($end)->div(2)); // Rough midpoint

        $payStmt = $pdo->prepare("INSERT INTO payments (project_id, payment_number, amount, due_date, status) VALUES (?, ?, ?, ?, 'Unpaid')");
        $payStmt->execute([$projectId, 1, $p1, $start->format('Y-m-d')]);
        $payStmt->execute([$projectId, 2, $p2, $mid->format('Y-m-d')]); // Approx mid
        $payStmt->execute([$projectId, 3, $p3, $end->format('Y-m-d')]);

        $pdo->commit();
        echo json_encode(["success" => true, "id" => $projectId, "message" => "Project created successfully"]);

    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}

elseif ($method === 'PUT') {
    $data = getJsonInput();
    if (!$id) exit(json_encode(["error" => "ID required"]));

    try {
        $pdo->beginTransaction();

        // Update Project Basics
        // For simplicity, we expect all fields or use COALESCE in SQL, but simpler to just update what's sent.
        // However, calculating profit requires knowing all costs.
        // Simplest strategy: Delete relations and re-insert (for developers/costs) OR update smartly.
        // Given complexity, let's assume full update of relations is sent, or we fetch current first.
        // Strategy: Update Project Fields -> Re-calc Profit.
        
        // Update Project Table
        if (isset($data['name'])) {
            $sql = "UPDATE projects SET name=?, client_id=?, start_date=?, end_date=?, status=?, total_revenue=?, currency=?, notes=? WHERE id=?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $data['name'],
                $data['client_id'],
                $data['start_date'],
                $data['end_date'],
                $data['status'],
                $data['total_revenue'],
                $data['currency'],
                $data['notes'],
                $id
            ]);
        }

        // Update Developers (Delete all, re-insert) - classic simple approach
        if (isset($data['developers'])) {
            $pdo->prepare("DELETE FROM project_developers WHERE project_id=?")->execute([$id]);
            $dStmt = $pdo->prepare("INSERT INTO project_developers (project_id, developer_id, cost) VALUES (?, ?, ?)");
            foreach ($data['developers'] as $dev) {
                $dStmt->execute([$id, $dev['id'], $dev['cost']]);
            }
        }

        // Update Additional Costs
        if (isset($data['additional_costs'])) {
            $pdo->prepare("DELETE FROM additional_costs WHERE project_id=?")->execute([$id]);
            $cStmt = $pdo->prepare("INSERT INTO additional_costs (project_id, description, amount) VALUES (?, ?, ?)");
            foreach ($data['additional_costs'] as $cost) {
                $cStmt->execute([$id, $cost['description'], $cost['amount']]);
            }
        }
        
        // Recalculate Profit
        // Fetch fresh totals
        $revStmt = $pdo->prepare("SELECT total_revenue FROM projects WHERE id=?");
        $revStmt->execute([$id]);
        $revenue = $revStmt->fetchColumn();

        $devCostStmt = $pdo->prepare("SELECT SUM(cost) FROM project_developers WHERE project_id=?");
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
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}

elseif ($method === 'DELETE') {
    if (!$id) exit(json_encode(["error" => "ID required"]));
    $stmt = $pdo->prepare("DELETE FROM projects WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(["success" => true, "message" => "Project deleted"]);
}
?>
