<?php
// api/db_setup.php - Comprehensive Database Initialization & Repair Script
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config.php';

header('Content-Type: text/plain; charset=utf-8');

echo "--- Stratis / NovaLink Database Setup & Repair Tool ---\n";
echo "Timestamp: " . date('Y-m-d H:i:s') . "\n\n";

try {
    // 1. Ensure we are connected
    echo "Checking database connection... ";
    $pdo->query("SELECT 1");
    echo "OK!\n\n";

    // 2. Define Table Schemas
    $tables = [
        'users' => "CREATE TABLE `users` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `username` varchar(100) NOT NULL UNIQUE,
            `email` varchar(100) NOT NULL UNIQUE,
            `password` varchar(255) NOT NULL,
            `name` varchar(100) NOT NULL,
            `role` enum('Superadmin','Admin','User') DEFAULT 'Admin',
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

        'clients' => "CREATE TABLE `clients` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `company_name` varchar(255) DEFAULT NULL,
            `email` varchar(255) NOT NULL,
            `phone` varchar(100) DEFAULT NULL,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

        'developers' => "CREATE TABLE `developers` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `role` varchar(100) DEFAULT 'Developer',
            `status` varchar(50) DEFAULT 'Active',
            `email` varchar(255) DEFAULT NULL,
            `id_card_number` varchar(100) DEFAULT NULL,
            `address` text DEFAULT NULL,
            `personal_email` varchar(255) DEFAULT NULL,
            `company_email` varchar(255) DEFAULT NULL,
            `slack` varchar(100) DEFAULT NULL,
            `skills` text DEFAULT NULL,
            `comments` text DEFAULT NULL,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

        'projects' => "CREATE TABLE `projects` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `client_id` int(11) NOT NULL,
            `status` varchar(50) DEFAULT 'Pending',
            `start_date` date DEFAULT NULL,
            `end_date` date DEFAULT NULL,
            `total_revenue` decimal(15,2) DEFAULT '0.00',
            `total_profit` decimal(15,2) DEFAULT '0.00',
            `currency` varchar(10) DEFAULT 'USD',
            `notes` text DEFAULT NULL,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

        'project_developers' => "CREATE TABLE `project_developers` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `project_id` int(11) NOT NULL,
            `developer_id` int(11) NOT NULL,
            `cost` decimal(15,2) DEFAULT '0.00',
            `is_advance_paid` tinyint(1) DEFAULT '0',
            `is_final_paid` tinyint(1) DEFAULT '0',
            PRIMARY KEY (`id`),
            KEY `project_id` (`project_id`),
            KEY `developer_id` (`developer_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

        'additional_costs' => "CREATE TABLE `additional_costs` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `project_id` int(11) NOT NULL,
            `cost_type` varchar(100) DEFAULT 'Third Party Cost',
            `description` varchar(255) DEFAULT NULL,
            `amount` decimal(15,2) DEFAULT '0.00',
            PRIMARY KEY (`id`),
            KEY `project_id` (`project_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

        'payments' => "CREATE TABLE `payments` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `project_id` int(11) NOT NULL,
            `payment_number` int(11) NOT NULL,
            `amount` decimal(15,2) NOT NULL,
            `due_date` date DEFAULT NULL,
            `paid_date` date DEFAULT NULL,
            `status` varchar(50) DEFAULT 'Unpaid',
            PRIMARY KEY (`id`),
            KEY `project_id` (`project_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

        'notifications' => "CREATE TABLE `notifications` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `message` text NOT NULL,
            `is_read` tinyint(1) DEFAULT '0',
            `sent_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
    ];

    // 3. Process Tables
    foreach ($tables as $name => $sql) {
        echo "Processing table '$name'... ";
        
        // Check if table exists
        $check = $pdo->query("SHOW TABLES LIKE '$name'");
        if ($check->rowCount() == 0) {
            echo "Creating... ";
            $pdo->exec($sql);
            echo "DONE.\n";
        } else {
            echo "Exists. Checking columns...\n";
            
            // Auto-heal column differences
            if ($name === 'developers') {
                // Check if 'name' exists, if not, try to rename 'full_name' or add 'name'
                $cols = $pdo->query("SHOW COLUMNS FROM developers")->fetchAll(PDO::FETCH_COLUMN);
                if (!in_array('name', $cols)) {
                    if (in_array('full_name', $cols)) {
                        echo "  Found legacy 'full_name', renaming to 'name'... ";
                        $pdo->exec("ALTER TABLE developers CHANGE full_name name VARCHAR(255) NOT NULL");
                        echo "DONE.\n";
                    } else {
                        echo "  Missing 'name', adding... ";
                        $pdo->exec("ALTER TABLE developers ADD COLUMN name VARCHAR(255) NOT NULL AFTER id");
                        echo "DONE.\n";
                    }
                }
            }

            if ($name === 'clients') {
                 $cols = $pdo->query("SHOW COLUMNS FROM clients")->fetchAll(PDO::FETCH_COLUMN);
                 if (!in_array('company_name', $cols) && in_array('companyName', $cols)) {
                     echo "  Renaming 'companyName' to 'company_name'... ";
                     $pdo->exec("ALTER TABLE clients CHANGE companyName company_name VARCHAR(255)");
                     echo "DONE.\n";
                 }
            }
            
            // Generic check for common missing columns from newer migrations or requirements
            $requiredCols = [
                'project_developers' => [
                    'is_advance_paid' => 'TINYINT(1) DEFAULT 0',
                    'is_final_paid' => 'TINYINT(1) DEFAULT 0'
                ],
                'users' => [
                    'username' => 'VARCHAR(100) UNIQUE AFTER id'
                ]
            ];

            if (isset($requiredCols[$name])) {
                $cols = $pdo->query("SHOW COLUMNS FROM `$name`")->fetchAll(PDO::FETCH_COLUMN);
                foreach ($requiredCols[$name] as $col => $def) {
                    if (!in_array($col, $cols)) {
                        echo "  Adding missing column '$col'... ";
                        $pdo->exec("ALTER TABLE `$name` ADD COLUMN `$col` $def");
                        echo "DONE.\n";
                    }
                }
            }
        }
    }

    echo "\nAll tables ensured.\n\n";

    // 4. Ensure Users exist (Resetting for recovery)
    echo "Ensuring Users and Resetting Passwords... ";
    
    $usersToEnsure = [
        ['username' => 'thilan', 'name' => 'Thilan', 'email' => 'thilan@novalink.com', 'pass' => 'Thilan12321', 'role' => 'Superadmin'],
        ['username' => 'admin', 'name' => 'Administrator', 'email' => 'admin@novalink.com', 'pass' => 'admin123', 'role' => 'Admin']
    ];

    foreach ($usersToEnsure as $u) {
        $check = $pdo->prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?)");
        $check->execute([$u['username']]);
        $hashed = password_hash($u['pass'], PASSWORD_DEFAULT);
        
        if ($check->rowCount() == 0) {
            $pdo->prepare("INSERT INTO users (username, name, email, password, role) VALUES (?, ?, ?, ?, ?)")
                ->execute([$u['username'], $u['name'], $u['email'], $hashed, $u['role']]);
            echo "[" . $u['username'] . " Created] ";
        } else {
            // Force reset password to ensure login works
            $pdo->prepare("UPDATE users SET password = ?, role = ? WHERE LOWER(username) = LOWER(?)")
                ->execute([$hashed, $u['role'], $u['username']]);
            echo "[" . $u['username'] . " Reset] ";
        }
    }
    echo "DONE.\n\n";

    // 5. List Current Users for verification
    echo "Current System Users:\n";
    $list = $pdo->query("SELECT id, username, role, email, password FROM users")->fetchAll();
    foreach ($list as $user) {
        $hashOk = password_verify($user['username'] === 'admin' ? 'admin123' : 'Thilan12321', $user['password']);
        echo "- " . $user['username'] . " (" . $user['role'] . ") | " . $user['email'] . " | Pass Verify: " . ($hashOk ? "OK" : "FAIL") . "\n";
    }

    echo "\n--- SETUP COMPLETE ---\n";
    echo "Try logging in with: admin / admin123\n";
    echo "Or: thilan / Thilan12321\n";

} catch (Throwable $e) {
    echo "\nFATAL ERROR DURING SETUP:\n";
    echo $e->getMessage() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}
