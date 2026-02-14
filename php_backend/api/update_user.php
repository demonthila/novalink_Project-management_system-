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

if (isset($data['name'])) { $fields[] = 'name = ?'; $params[] = trim($data['name']); }
if (isset($data['email'])) { $fields[] = 'email = ?'; $params[] = trim($data['email']); }
if (isset($data['role']) && in_array($data['role'], ['Admin', 'User'], true)) { $fields[] = 'role = ?'; $params[] = $data['role']; }
if (!empty($data['password'])) { $fields[] = 'password = ?'; $params[] = password_hash($data['password'], PASSWORD_DEFAULT); }

if (empty($fields)) {
    echo json_encode(["success" => false, "message" => "No fields to update"]);
    exit;
}

// Target user: Admin can pass id to update another user; otherwise update self
$targetId = (int) $_SESSION['user_id'];
if (!empty($_SESSION['user_role']) && $_SESSION['user_role'] === 'Admin' && isset($data['id']) && (int) $data['id'] > 0) {
    $targetId = (int) $data['id'];
}

try {
    $params[] = $targetId;
    $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode(["success" => true, "message" => "User updated"]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

?>
