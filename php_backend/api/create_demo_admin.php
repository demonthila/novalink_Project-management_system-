<?php
// api/create_demo_admin.php
// This endpoint creates a demo admin user for initial setup
// NOTE: In production, you should protect this endpoint or remove it after setup

session_start();
require_once 'config.php';

// REMOVED authentication requirement for initial setup purposes
// Only allow when a user is logged in (UI only accessible post-login)
// In production, protect this endpoint or remove after setup
// if (!isset($_SESSION['user_id'])) {
//     http_response_code(403);
//     echo json_encode(["error" => "Authentication required"]);
//     exit;
// }

header('Content-Type: application/json; charset=utf-8');

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT id, email, name, role FROM users WHERE email = ? LIMIT 1");
        $stmt->execute(['admin']);
        $exists = (bool)$stmt->fetch();
        echo json_encode(["exists" => $exists]);
        exit;
    }

    if ($method === 'POST') {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $action = $body['action'] ?? 'create';

        if ($action === 'create') {
            // First, create users table if it doesn't exist
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
            
            // Check if exists
            $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $check->execute(['admin']);
            if ($check->rowCount() > 0) {
                echo json_encode(["success" => false, "message" => "Demo admin already exists"]);
                exit;
            }

            $hash = password_hash('admin123', PASSWORD_DEFAULT);
            $insert = $pdo->prepare("INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())");
            $insert->execute(['Administrator', 'admin', $hash, 'Admin']);
            echo json_encode(["success" => true, "message" => "Demo admin created", "credentials" => ["email" => "admin", "password" => "admin123"]]);
            exit;
        }

        if ($action === 'delete') {
            $del = $pdo->prepare("DELETE FROM users WHERE email = ?");
            $del->execute(['admin']);
            echo json_encode(["success" => true, "message" => "Demo admin removed"]);
            exit;
        }

        echo json_encode(["success" => false, "message" => "Unknown action"]);
        exit;
    }

    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
    exit;
}

?>
