<?php
// php_backend/api/reset_admin.php
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $newPassword = 'admin123';
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    // Attempt to update the 'admin' user
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE LOWER(username) = 'admin' OR LOWER(email) = 'admin'");
    $stmt->execute([$hashedPassword]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(["status" => "success", "message" => "Password for 'admin' has been reset to: $newPassword"]);
    } else {
        // If 'admin' doesn't exist, create it
        $insert = $pdo->prepare("INSERT INTO users (username, name, email, password, role) VALUES (?, ?, ?, ?, ?)");
        $insert->execute(['admin', 'Administrator', 'admin', $hashedPassword, 'Admin']);
        echo json_encode(["status" => "success", "message" => "User 'admin' created fresh with password: $newPassword"]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
