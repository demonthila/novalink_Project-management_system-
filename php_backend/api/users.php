<?php
// api/users.php - List, create and delete users (Admin only)
session_start();
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

// Authentication check - handled by config.php
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Authentication required"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET = list users (Admin/Superadmin only)
if ($method === 'GET') {
    if (empty($_SESSION['user_role']) || !in_array($_SESSION['user_role'], ['Superadmin', 'Admin'])) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Admin access required"]);
        exit;
    }
    
    try {
        // Include password hash if the requester is Superadmin
        $isSuper = ($_SESSION['user_role'] === 'Superadmin');
        $query = $isSuper 
            ? "SELECT id, username, name, email, password, role, created_at FROM users ORDER BY created_at DESC"
            : "SELECT id, username, name, email, role, created_at FROM users ORDER BY created_at DESC";
            
        $stmt = $pdo->query($query);
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

// POST = create new user (Primary Superadmin only)
if ($method === 'POST') {
    if (empty($_SESSION['user_username']) || $_SESSION['user_username'] !== 'sanjulathilan12321@gmail.com') {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Only the primary Super Admin can create users"]);
        exit;
    }

    
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    
    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $name = trim($data['name'] ?? '');
    $role = $data['role'] ?? 'User';
    
    if (empty($username) || empty($email) || empty($password) || empty($name)) {
        echo json_encode(["success" => false, "message" => "Username, Email, password and name are required"]);
        exit;
    }
    
    if (!in_array($role, ['Superadmin', 'Admin', 'User'])) {
        $role = 'User';
    }
    
    try {
        // Check if username or email already exists
        $check = $pdo->prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?) OR (email != '' AND LOWER(email) = LOWER(?))");
        $check->execute([$username, $email]);
        if ($check->rowCount() > 0) {
            echo json_encode(["success" => false, "message" => "Username or Email already exists"]);
            exit;
        }
        
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$name, $username, $email, $hash, $role]);
        
        echo json_encode(["success" => true, "message" => "User created successfully", "id" => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
    exit;
}

// DELETE = remove user by id (Primary Superadmin only; cannot delete self or primary admin)
if ($method === 'DELETE') {
    if (empty($_SESSION['user_username']) || $_SESSION['user_username'] !== 'sanjulathilan12321@gmail.com') {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Only the primary Super Admin can remove users"]);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = isset($input['id']) ? (int) $input['id'] : 0;
    if ($id <= 0) {
        echo json_encode(["success" => false, "message" => "Invalid user id"]);
        exit;
    }

    try {
        // Protect the primary superadmin account from deletion
        $checkPrimary = $pdo->prepare("SELECT username FROM users WHERE id = ?");
        $checkPrimary->execute([$id]);
        $targetUser = $checkPrimary->fetch();
        
        if ($targetUser && $targetUser['username'] === 'sanjulathilan12321@gmail.com') {
            echo json_encode(["success" => false, "message" => "The primary Super Admin account cannot be deleted"]);
            exit;
        }

        if (isset($_SESSION['user_id']) && (int) $_SESSION['user_id'] === $id) {
            echo json_encode(["success" => false, "message" => "You cannot delete your own account while logged in"]);
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
