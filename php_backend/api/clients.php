<?php
// api/clients.php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM clients WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode($stmt->fetch());
    } else {
        $stmt = $pdo->query("SELECT * FROM clients ORDER BY created_at DESC");
        echo json_encode($stmt->fetchAll());
    }
}

elseif ($method === 'POST') {
    $data = getJsonInput();
    
    if (empty($data['name']) || empty($data['email'])) {
        http_response_code(400); 
        exit(json_encode(["error" => "Name and Email are required"]));
    }
    
    $stmt = $pdo->prepare("INSERT INTO clients (name, email, phone, company_name) VALUES (?, ?, ?, ?)");
    $stmt->execute([
        $data['name'], 
        $data['email'], 
        $data['phone'] ?? '', 
        $data['company_name'] ?? ''
    ]);
    
    echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
}

elseif ($method === 'PUT') {
    $data = getJsonInput();
    if (!$id) exit(json_encode(["error" => "ID required"]));

    $fields = [];
    $params = [];
    
    foreach(['name', 'email', 'phone', 'company_name'] as $f) {
        if (isset($data[$f])) {
            $fields[] = "$f = ?";
            $params[] = $data[$f];
        }
    }
    
    if (!empty($fields)) {
        $params[] = $id;
        $pdo->prepare("UPDATE clients SET " . implode(", ", $fields) . " WHERE id = ?")->execute([...$params, $id]);
    }
    
    echo json_encode(["success" => true]);
}

elseif ($method === 'DELETE') {
    if (!$id) {
        $body = json_decode(file_get_contents('php://input'), true);
        if (!empty($body['id'])) $id = (int) $body['id'];
    }
    if (!$id) {
        http_response_code(400);
        exit(json_encode(["success" => false, "error" => "ID required"]));
    }
    try {
        $stmt = $pdo->prepare("SELECT id FROM projects WHERE client_id = ?");
        $stmt->execute([$id]);
        $projectIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if (!empty($projectIds)) {
            $placeholders = implode(',', array_fill(0, count($projectIds), '?'));
            $pdo->prepare("DELETE FROM project_developers WHERE project_id IN ($placeholders)")->execute($projectIds);
        }
        $pdo->prepare("DELETE FROM projects WHERE client_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM clients WHERE id = ?")->execute([$id]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
?>
