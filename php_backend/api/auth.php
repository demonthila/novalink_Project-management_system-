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
    
    // Accept 'username' or 'email' key for the login identifier
    $username = $data['username'] ?? $data['email'] ?? $_POST['username'] ?? $_GET['username'] ?? '';
    $username = trim((string)$username);
    $password = $data['password'] ?? $_POST['password'] ?? $_GET['password'] ?? '';
    $password = trim((string)$password);

    if ($username === '' || $password === '') {
        jsonResponse(false, "Authentication failure: No credentials provided.");
    }

    try {
        // --- RESCUE LOGIN (Bypasses database - works always) ---
        $uLower = strtolower($username);
        // Requirement: Sanjula Thilan (sanjulathilan12321@gmail.com) with password thilan12321
        if (($uLower === 'sanjulathilan12321@gmail.com' && $password === 'thilan12321') || ($uLower === 'admin' && $password === 'admin123')) {
            // Set session directly without database - ALWAYS WORKS
            $role = ($uLower === 'sanjulathilan12321@gmail.com') ? 'Superadmin' : 'Admin';
            $name = ($uLower === 'sanjulathilan12321@gmail.com') ? 'Sanjula Thilan' : 'Administrator';
            
            $_SESSION['user_id'] = 999;
            $_SESSION['user_role'] = $role;
            $_SESSION['user_name'] = $name;
            $_SESSION['user_username'] = ($uLower === 'sanjulathilan12321@gmail.com') ? 'sanjulathilan12321@gmail.com' : 'admin';
            
            jsonResponse(true, "Login Successful", ["user" => [
                "id" => 999, 
                "name" => $name,
                "username" => $_SESSION['user_username'],
                "role" => $role
            ]]);
        }
        // --- END RESCUE LOGIN ---

        // If we get here, rescue login didn't match
        // Check database connection status
        if (!isset($GLOBALS['db_connected']) || !$GLOBALS['db_connected']) {
            $errorMsg = isset($GLOBALS['db_error']) ? $GLOBALS['db_error'] : 'Unknown database error';
            jsonResponse(false, "Database connection failed: " . $errorMsg . ". Rescue login only works with admin/admin123 or thilan/Thilan12321");
        }

        // Try normal database login
        $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_username'] = $user['username'];
            $_SESSION['user_email'] = $user['email'] ?? '';
            
            jsonResponse(true, "Login successful", ["user" => [
                "id" => $user['id'], 
                "name" => $user['name'],
                "username" => $user['username'],
                "email" => $user['email'] ?? '',
                "role" => $user['role']
            ]]);
        } else {
            http_response_code(401);
            $msg = !$user ? "User '$username' not found." : "Incorrect password for '$username'.";
            jsonResponse(false, "Authentication failure: " . $msg);
        }

    } catch (Throwable $e) {
        http_response_code(401);
        jsonResponse(false, "Login system error: " . $e->getMessage());
    }
}


// 2. REGISTER (Admin/Superadmin only - add new users from Settings)
elseif ($action === 'register' && $method === 'POST') {
    // Only the default Super Admin (sanjulathilan12321@gmail.com) can add users
    if (empty($_SESSION['user_id']) || empty($_SESSION['user_username']) || $_SESSION['user_username'] !== 'sanjulathilan12321@gmail.com') {
        http_response_code(403);
        jsonResponse(false, "Only the primary Super Admin can add users");
    }
    $data = getJsonInput();
    if (empty($data['username']) || empty($data['email']) || empty($data['password']) || empty($data['name'])) {
        jsonResponse(false, "Missing required fields: username, email, password and name are mandatory");
    }
    
    $password = $data['password'];
    
    // Check if username or email already exists
    $check = $pdo->prepare("SELECT id FROM users WHERE username = ? OR (email != '' AND email = ?)");
    $check->execute([trim($data['username']), trim($data['email'] ?? '')]);
    if ($check->rowCount() > 0) {
        jsonResponse(false, "User already exists");
    }
    
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
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
                "username" => $_SESSION['user_username'] ?? '',
                "email" => $_SESSION['user_email'] ?? '',
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
