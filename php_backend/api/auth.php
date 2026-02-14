<?php
// api/auth.php
ob_start(); // Discard any stray output so we only send JSON
session_start();
require_once 'config.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';
$method = $_SERVER['REQUEST_METHOD'];

// Helper to send JSON response
function jsonResponse($success, $message, $data = []) {
    ob_clean();
    echo json_encode(array_merge(["success" => $success, "message" => $message], $data));
    exit();
}

// 1. LOGIN
if ($action === 'login' && $method === 'POST') {
    $data = getJsonInput();
    $username = isset($data['username']) ? trim((string) $data['username']) : '';
    $password = isset($data['password']) ? trim((string) $data['password']) : '';

    if ($username === '' || $password === '') {
        jsonResponse(false, "Missing credentials");
    }

    // Regular login - check database (try username first, then email)
    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['user_name'] = $user['name'];
            jsonResponse(true, "Login successful", ["user" => [
                "id" => $user['id'], 
                "name" => $user['name'],
                "username" => $user['username'],
                "role" => $user['role']
            ]]);
        } else {
            http_response_code(401);
            jsonResponse(false, "Invalid credentials");
        }
    } catch (PDOException $e) {
        http_response_code(500);
        jsonResponse(false, "Database error: " . $e->getMessage());
    }
}


// 2. REGISTER (Admin/Superadmin only - add new users from Settings)
elseif ($action === 'register' && $method === 'POST') {
    if (empty($_SESSION['user_id']) || empty($_SESSION['user_role']) || !in_array($_SESSION['user_role'], ['Superadmin', 'Admin'])) {
        http_response_code(403);
        jsonResponse(false, "Authentication required to add users");
    }
    $data = getJsonInput();
    if (empty($data['username']) || empty($data['password']) || empty($data['name'])) {
        jsonResponse(false, "Missing required fields");
    }
    
    // Check if username or email already exists
    $check = $pdo->prepare("SELECT id FROM users WHERE username = ? OR (email != '' AND email = ?)");
    $check->execute([trim($data['username']), trim($data['email'] ?? '')]);
    if ($check->rowCount() > 0) {
        jsonResponse(false, "User already exists");
    }
    
    $hashed_password = password_hash($data['password'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (username, name, email, password, role) VALUES (?, ?, ?, ?, ?)");
    
    $role = 'Admin'; // Default role is Admin as per "all are admins"
    if (isset($data['role']) && in_array($data['role'], ['Superadmin', 'Admin', 'User'])) {
        // Only Superadmin can create other Superadmins
        if ($data['role'] === 'Superadmin' && $_SESSION['user_role'] !== 'Superadmin') {
            $role = 'Admin';
        } else {
            $role = $data['role'];
        }
    }
    
    $email = isset($data['email']) ? trim($data['email']) : '';
    
    if ($stmt->execute([trim($data['username']), trim($data['name']), $email, $hashed_password, $role])) {
        jsonResponse(true, "User registered successfully");
    } else {
        http_response_code(500);
        jsonResponse(false, "Registration failed");
    }
}


// 3. LOGOUT
elseif ($action === 'logout') {
    session_destroy();
    jsonResponse(true, "Logged out");
}

// 4. CHECK SESSION (For Frontend AuthGuard)
elseif ($action === 'check') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            "authenticated" => true, 
            "user" => [
                "id" => $_SESSION['user_id'],
                "name" => $_SESSION['user_name'],
                "role" => $_SESSION['user_role']
            ]
        ]);
    } else {
        echo json_encode(["authenticated" => false]);
    }
}

else {
    jsonResponse(false, "Invalid action");
}
?>
