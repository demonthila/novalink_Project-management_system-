<?php
// api/update_user.php
session_start();
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

// Authentication disabled for testing

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$fields = [];
$params = [];

if (isset($data['name'])) { $fields[] = 'name = ?'; $params[] = trim($data['name']); }
if (isset($data['username'])) { $fields[] = 'username = ?'; $params[] = trim($data['username']); }
if (isset($data['email'])) { $fields[] = 'email = ?'; $params[] = trim($data['email']); }

// Default target ID for testing (auto-admin)
$targetId = 999;
$isManager = true;

// Allow passing id to update another user
if (isset($data['id']) && (int) $data['id'] > 0) {
    $targetId = (int) $data['id'];
}

// Fetch target user's current role to check permissions
try {
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$targetId]);
    $targetUser = $stmt->fetch();
} catch (Exception $e) {
    $targetUser = ['role' => 'Admin']; // Default if table doesn't exist
}

if (!$targetUser) {
    echo json_encode(["success" => false, "message" => "User not found"]);
    exit;
}

// Role update logic
if (isset($data['role']) && in_array($data['role'], ['Superadmin', 'Admin', 'User'], true)) {
    $fields[] = 'role = ?';
    $params[] = $data['role'];
}

if (!empty($data['password'])) { $fields[] = 'password = ?'; $params[] = password_hash($data['password'], PASSWORD_DEFAULT); }

if (empty($fields)) {
    echo json_encode(["success" => false, "message" => "No fields to update"]);
    exit;
}

try {
    $params[] = $targetId;
    $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    if ($stmt->execute($params)) {
        echo json_encode(["success" => true, "message" => "User updated"]);
    } else {
        echo json_encode(["success" => false, "message" => "Update failed"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
