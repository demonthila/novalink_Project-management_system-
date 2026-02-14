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
    $email = isset($data['email']) ? trim((string) $data['email']) : '';
    $password = isset($data['password']) ? trim((string) $data['password']) : '';

    if ($email === '' || $password === '') {
        jsonResponse(false, "Missing credentials");
    }

    // Create users table if it doesn't exist (for initial setup)
    try {
        $createTableSql = "CREATE TABLE IF NOT EXISTS `users` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `email` varchar(100) NOT NULL UNIQUE,
          `password` varchar(255) NOT NULL,
          `name` varchar(100) NOT NULL,
          `role` enum('Admin','User') DEFAULT 'User',
          `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`)
        )";
        $pdo->exec($createTableSql);
    } catch (PDOException $e) {
        // Table might already exist, continue but log error
        error_log("Users table creation: " . $e->getMessage());
    }

    // Check for demo admin login (accept "admin" case-insensitive, trimmed)
    $isDemoAdmin = (strtolower($email) === 'admin' && $password === 'admin123');
    if ($isDemoAdmin) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = ?");
            $stmt->execute(['admin']);
            $user = $stmt->fetch();

            if (!$user) {
                $hash = password_hash('admin123', PASSWORD_DEFAULT);
                $insert = $pdo->prepare("INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())");
                $insert->execute(['Administrator', 'admin', $hash, 'Admin']);
                $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = ?");
                $stmt->execute(['admin']);
                $user = $stmt->fetch();
            }

            // If admin exists but password hash is wrong (e.g. from old SQL), fix it
            if ($user && !password_verify('admin123', $user['password'])) {
                $hash = password_hash('admin123', PASSWORD_DEFAULT);
                $update = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
                $update->execute([$hash, $user['id']]);
                $user['password'] = $hash;
            }

            if ($user && password_verify('admin123', $user['password'])) {
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
                jsonResponse(false, "Demo admin authentication failed");
            }
        } catch (PDOException $e) {
            http_response_code(500);
            jsonResponse(false, "Database error: " . $e->getMessage());
        }
    }

    // Regular login - check database
    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
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
    } catch (PDOException $e) {
        http_response_code(500);
        jsonResponse(false, "Database error: " . $e->getMessage());
    }
}

// 2. REGISTER (Admin only - add new users from Settings)
elseif ($action === 'register' && $method === 'POST') {
    if (empty($_SESSION['user_id']) || empty($_SESSION['user_role']) || $_SESSION['user_role'] !== 'Admin') {
        http_response_code(403);
        jsonResponse(false, "Admin access required to add users");
    }
    $data = getJsonInput();
    if (empty($data['email']) || empty($data['password']) || empty($data['name'])) {
        jsonResponse(false, "Missing required fields");
    }
    $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $check->execute([trim($data['email'])]);
    if ($check->rowCount() > 0) {
        jsonResponse(false, "User already exists");
    }
    $hashed_password = password_hash($data['password'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    $role = isset($data['role']) && $data['role'] === 'Admin' ? 'Admin' : 'User';
    if ($stmt->execute([trim($data['name']), trim($data['email']), $hashed_password, $role])) {
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
