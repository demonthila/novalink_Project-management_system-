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
if (isset($data['username'])) { $fields[] = 'username = ?'; $params[] = trim($data['username']); }
if (isset($data['email'])) { $fields[] = 'email = ?'; $params[] = trim($data['email']); }

// Target user: Admin/Superadmin can pass id to update another user; otherwise update self
$targetId = (int) $_SESSION['user_id'];
$isManager = !empty($_SESSION['user_role']) && in_array($_SESSION['user_role'], ['Superadmin', 'Admin']);

if ($isManager && isset($data['id']) && (int) $data['id'] > 0) {
    $targetId = (int) $data['id'];
}

// Fetch target user's current role to check permissions
$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$targetId]);
$targetUser = $stmt->fetch();

if (!$targetUser) {
    echo json_encode(["success" => false, "message" => "User not found"]);
    exit;
}

// Role update logic
if (isset($data['role']) && in_array($data['role'], ['Superadmin', 'Admin', 'User'], true)) {
    // Only Superadmin can set Superadmin role
    if ($data['role'] === 'Superadmin' && $_SESSION['user_role'] !== 'Superadmin') {
        // Silently ignore or error? Let's error if they try to elevate
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Only Superadmins can assign Superadmin role"]);
        exit;
    }
    
    // Admin cannot change their own role or others if they are not superadmin? 
    // Usually Admin can manage Users but not other Admins or themselves.
    // For simplicity, let's allow Admin to manage non-Superadmins.
    if ($targetUser['role'] === 'Superadmin' && $_SESSION['user_role'] !== 'Superadmin') {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Cannot modify Superadmin account"]);
        exit;
    }

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
        // Update session if updating self
        if ($targetId === (int)$_SESSION['user_id']) {
            if (isset($data['name'])) $_SESSION['user_name'] = $data['name'];
            if (isset($data['role'])) $_SESSION['user_role'] = $data['role'];
        }
        echo json_encode(["success" => true, "message" => "User updated"]);
    } else {
        echo json_encode(["success" => false, "message" => "Update failed"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}


?>
