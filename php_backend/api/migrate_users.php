<?php
require_once __DIR__ . '/config.php';

try {
    // 0. Truncate users table to start fresh
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE `users`;");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // 1. Add username column if it doesn't exist
    $res = $pdo->query("SHOW COLUMNS FROM `users` LIKE 'username'");
    if ($res->rowCount() == 0) {
        $pdo->exec("ALTER TABLE `users` ADD COLUMN `username` varchar(100) NOT NULL UNIQUE AFTER `id`;");
    }


    
    // 2. Update role enum to include Superadmin and Admin
    $pdo->exec("ALTER TABLE `users` MODIFY COLUMN `role` ENUM('Superadmin', 'Admin', 'User') DEFAULT 'Admin';");
    
    // 3. Create superadmin thilan if not exists
    $password = 'Thilan12321';
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    $username = 'thilan';
    $email = 'thilan@novalink.com'; // Default email for thilan
    $name = 'Thilan';

    $check = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $check->execute([$username]);
    if ($check->rowCount() == 0) {
        $stmt = $pdo->prepare("INSERT INTO users (username, name, email, password, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$username, $name, $email, $hashed_password, 'Superadmin']);
        echo "Superadmin 'thilan' created successfully.\n";
    } else {
        // Update thilan's password and role just in case
        $stmt = $pdo->prepare("UPDATE users SET password = ?, role = 'Superadmin' WHERE username = ?");
        $stmt->execute([$hashed_password, $username]);
        echo "Superadmin 'thilan' updated.\n";
    }

    // 4. Update existing Admin users
    $pdo->exec("UPDATE users SET role = 'Admin' WHERE role = 'User'");

    
    echo "Migration completed successfully.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
