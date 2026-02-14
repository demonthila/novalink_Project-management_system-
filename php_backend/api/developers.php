<?php
// api/developers.php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM developers WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode($stmt->fetch());
    } else {
        $stmt = $pdo->query("SELECT * FROM developers ORDER BY name ASC");
        echo json_encode($stmt->fetchAll());
    }
}

elseif ($method === 'POST') {
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
}

elseif ($method === 'PUT') {
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
        $pdo->prepare("DELETE FROM project_developers WHERE developer_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM developers WHERE id = ?")->execute([$id]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
?>
