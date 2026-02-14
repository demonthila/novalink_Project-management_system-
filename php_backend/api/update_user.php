<?php
// api/update_user.php
session_start();
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(["error" => "Authentication required"]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$fields = [];
$params = [];

if (isset($data['name'])) { $fields[] = 'name = ?'; $params[] = $data['name']; }
if (isset($data['email'])) { $fields[] = 'email = ?'; $params[] = $data['email']; }
if (isset($data['role'])) { $fields[] = 'role = ?'; $params[] = $data['role']; }
if (!empty($data['password'])) { $fields[] = 'password = ?'; $params[] = password_hash($data['password'], PASSWORD_DEFAULT); }

if (empty($fields)) {
    echo json_encode(["success" => false, "message" => "No fields to update"]);
    exit;
}

try {
    $params[] = $_SESSION['user_id'];
    $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode(["success" => true, "message" => "User updated"]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

?>
