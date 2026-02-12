<?php
// api/auth.php
session_start();
require_once 'config.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';
$method = $_SERVER['REQUEST_METHOD'];

// Helper to send JSON response
function jsonResponse($success, $message, $data = []) {
    echo json_encode(array_merge(["success" => $success, "message" => $message], $data));
    exit();
}

// 1. LOGIN
if ($action === 'login' && $method === 'POST') {
    $data = getJsonInput();
    
    if (!isset($data['email']) || !isset($data['password'])) {
        jsonResponse(false, "Missing credentials");
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch();

    if ($user && password_verify($data['password'], $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['user_name'] = $user['name'];
        jsonResponse(true, "Login successful", ["user" => [
            "id" => $user['id'], 
            "name" => $user['name'], 
            "role" => $user['role']
        ]]);
    } else {
        http_response_code(401);
        jsonResponse(false, "Invalid credentials");
    }
}

// 2. REGISTER (Optional - secure this in production!)
elseif ($action === 'register' && $method === 'POST') {
    $data = getJsonInput();
    
    // Basic validation
    if (empty($data['email']) || empty($data['password']) || empty($data['name'])) {
        jsonResponse(false, "Missing required fields");
    }

    // Check if user exists
    $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $check->execute([$data['email']]);
    if ($check->rowCount() > 0) {
        jsonResponse(false, "User already exists");
    }

    // Create user
    $hashed_password = password_hash($data['password'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    
    // Default role is User, unless specified (be careful with allowing Admin reg)
    $role = isset($data['role']) && $data['role'] === 'Admin' ? 'Admin' : 'User';
    
    if ($stmt->execute([$data['name'], $data['email'], $hashed_password, $role])) {
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
