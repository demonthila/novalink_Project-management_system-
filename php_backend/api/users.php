<?php
// api/users.php - List, create and delete users (Admin only)
session_start();
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

// Authentication temporarily disabled for testing
/*
if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Authentication required"]);
    exit;
}
*/

$method = $_SERVER['REQUEST_METHOD'];

// GET = list users (Admin/Superadmin only)
/*
if ($method === 'GET') {
    if (empty($_SESSION['user_role']) || !in_array($_SESSION['user_role'], ['Superadmin', 'Admin'])) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Admin access required"]);
        exit;
    }
*/
if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT id, username, name, email, role, created_at FROM users ORDER BY created_at DESC");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($users as &$u) {
            $u['createdAt'] = $u['created_at'];
            unset($u['created_at']);
        }
        echo json_encode(["success" => true, "users" => $users]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
    exit;
}

// POST = create new user (Admin/Superadmin only)
// Authentication temporarily disabled
/*
if ($method === 'POST') {
    if (empty($_SESSION['user_role']) || !in_array($_SESSION['user_role'], ['Superadmin', 'Admin'])) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Admin access required"]);
        exit;
    }
*/
if ($method === 'POST') {
    
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $name = trim($data['name'] ?? '');
    $role = $data['role'] ?? 'User';
    
    if (empty($email) || empty($password) || empty($name)) {
        echo json_encode(["success" => false, "message" => "Email, password and name are required"]);
        exit;
    }
    
    if (!in_array($role, ['Superadmin', 'Admin', 'User'])) {
        $role = 'User';
    }
    
    // Only Superadmin can create Superadmin
    if ($role === 'Superadmin' && $_SESSION['user_role'] !== 'Superadmin') {
        echo json_encode(["success" => false, "message" => "Only Superadmins can create Superadmin users"]);
        exit;
    }
    
    try {
        // Check if email already exists
        $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $check->execute([$email]);
        if ($check->rowCount() > 0) {
            echo json_encode(["success" => false, "message" => "Email already exists"]);
            exit;
        }
        
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $email, $hash, $role]);
        
        echo json_encode(["success" => true, "message" => "User created successfully", "id" => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
    exit;
}

// DELETE = remove user by id (Admin/Superadmin only; cannot delete self)
// Authentication temporarily disabled
/*
if ($method === 'DELETE') {
    if (empty($_SESSION['user_role']) || !in_array($_SESSION['user_role'], ['Superadmin', 'Admin'])) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Admin access required"]);
        exit;
    }
*/
if ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = isset($input['id']) ? (int) $input['id'] : 0;
    if ($id <= 0) {
        echo json_encode(["success" => false, "message" => "Invalid user id"]);
        exit;
    }
    if ((int) $_SESSION['user_id'] === $id) {
        echo json_encode(["success" => false, "message" => "Cannot delete your own account"]);
        exit;
    }

    try {
        // Check if target user is superadmin
        $check = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $check->execute([$id]);
        $target = $check->fetch();
        if ($target && $target['role'] === 'Superadmin' && $_SESSION['user_role'] !== 'Superadmin') {
            echo json_encode(["success" => false, "message" => "Only Superadmins can delete other Superadmins"]);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true, "message" => "User removed"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
    exit;
}


http_response_code(405);
echo json_encode(["success" => false, "message" => "Method not allowed"]);
