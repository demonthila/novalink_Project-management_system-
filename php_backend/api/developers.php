<?php
// api/developers.php
session_start();
require_once __DIR__ . '/config.php';

// Authentication temporarily disabled for testing
/*
$method = $_SERVER['REQUEST_METHOD'];
if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Authentication required"]);
        exit;
    }
}
*/

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

if ($method === 'GET') {
    try {
        // Simple check for name vs full_name
        $stmtCol = $pdo->query("SHOW COLUMNS FROM developers LIKE 'name'");
        $hasName = $stmtCol->rowCount() > 0;
        $nameCol = $hasName ? 'name' : 'full_name';

        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM developers WHERE id = ?");
            $stmt->execute([$id]);
            $dev = $stmt->fetch();
            if ($dev && !$hasName && isset($dev['full_name'])) {
                $dev['name'] = $dev['full_name'];
            }
            echo json_encode($dev);
        } else {
            $stmt = $pdo->query("SELECT * FROM developers ORDER BY $nameCol ASC");
            $list = $stmt->fetchAll();
            if (!$hasName) {
                foreach($list as &$d) {
                    if (isset($d['full_name'])) $d['name'] = $d['full_name'];
                }
            }
            echo json_encode($list);
        }
    } catch (Throwable $e) {
        echo json_encode([]); // Return empty list instead of crashing if table missing
    }
}
elseif ($method === 'POST') {
    try {
        $data = getJsonInput();
        
        if (empty($data['name']) || empty($data['role'])) {
            http_response_code(400); 
            exit(json_encode(["error" => "Name and Role are required"]));
        }
        
        $stmt = $pdo->prepare("INSERT INTO developers (name, role, email, status) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data['name'], 
            $data['role'], 
            $data['email'] ?? '', 
            $data['status'] ?? 'Active'
        ]);
        
        echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}

elseif ($method === 'PUT') {
    try {
        $data = getJsonInput();
        if (!$id) exit(json_encode(["error" => "ID required"]));

        $fields = [];
        $params = [];
        
        foreach(['name', 'role', 'email', 'status'] as $f) {
            if (isset($data[$f])) {
                $fields[] = "$f = ?";
                $params[] = $data[$f];
            }
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $sql = "UPDATE developers SET " . implode(", ", $fields) . " WHERE id = ?";
            $pdo->prepare($sql)->execute($params);
        }
        
        echo json_encode(["success" => true]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}

elseif ($method === 'DELETE') {
    try {
        if (!$id) {
            $body = json_decode(file_get_contents('php://input'), true);
            if (!empty($body['id'])) $id = (int) $body['id'];
        }
        if (!$id) {
            http_response_code(400);
            exit(json_encode(["success" => false, "error" => "ID required"]));
        }
        $pdo->prepare("DELETE FROM project_developers WHERE developer_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM developers WHERE id = ?")->execute([$id]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
