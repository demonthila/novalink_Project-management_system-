<?php
// api/config.php
ob_start(); // Prevent any stray output (BOM, whitespace) from breaking JSON

// SECURITY BEST PRACTICE:
// On Hostinger, place a file named 'secrets.php' one level ABOVE public_html.
// public_html/api/config.php (this file) will include it.
// This prevents your passwords/API keys from ever being accessed via the browser.

// Production Error Handling (Logs but doesn't display to user)
ini_set('display_errors', 0);
error_reporting(E_ALL);

// 1. CORS Headers
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Access-Control-Allow-Credentials: true");
}
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");


if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}


// 2. Load Secrets
// Try to load from parent directory (secure), otherwise fall back to strict values (dev)
// Note: secrets.php is in the project root, not in php_backend
$secretFile = dirname(__DIR__, 2) . '/secrets.php';

if (file_exists($secretFile)) {
    require_once $secretFile;
} else {
    // FALLBACK / LOCAL DEVELOPMENT VARIABLES
    if (!defined('DB_HOST')) define('DB_HOST', 'localhost');
    if (!defined('DB_NAME')) define('DB_NAME', 'novalink');
    if (!defined('DB_USER')) define('DB_USER', 'root');
    if (!defined('DB_PASS')) define('DB_PASS', 'root');
    if (!defined('GEMINI_API_KEY')) define('GEMINI_API_KEY', 'your_dev_key_here');
    if (!defined('CRON_SECRET')) define('CRON_SECRET', 'stratis_secure_cron_token_123');
}

// 3. Database Connection - Make it optional for rescue login
$GLOBALS['db_connected'] = false;
try {
    // First, try to connect WITHOUT a database to create it if needed
    $pdoNoDB = new PDO("mysql:host=" . DB_HOST . ";charset=utf8", DB_USER, DB_PASS);
    $pdoNoDB->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create database if it doesn't exist
    $pdoNoDB->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdoNoDB = null;
    
    // Now connect to the database
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $GLOBALS['db_connected'] = true;
    
    // Auto-create essential tables if they don't exist
    autoCreateTables($pdo);
    
} catch(PDOException $e) {
    // Don't exit - continue without database for rescue login
    $GLOBALS['db_error'] = $e->getMessage();
}

// Auto-create tables function
function autoCreateTables($pdo) {
    $tables = [
        'users' => "CREATE TABLE IF NOT EXISTS `users` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `username` varchar(100) NOT NULL UNIQUE,
            `email` varchar(100) NOT NULL UNIQUE,
            `password` varchar(255) NOT NULL,
            `name` varchar(100) NOT NULL,
            `role` enum('Superadmin','Admin','User') DEFAULT 'Admin',
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
        'clients' => "CREATE TABLE IF NOT EXISTS `clients` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `company_name` varchar(255) DEFAULT NULL,
            `email` varchar(255) NOT NULL,
            `phone` varchar(100) DEFAULT NULL,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
        'developers' => "CREATE TABLE IF NOT EXISTS `developers` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `role` varchar(100) DEFAULT 'Developer',
            `status` varchar(50) DEFAULT 'Active',
            `email` varchar(255) DEFAULT NULL,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
        'projects' => "CREATE TABLE IF NOT EXISTS `projects` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `client_id` int(11) NOT NULL,
            `status` varchar(50) DEFAULT 'Pending',
            `total_revenue` decimal(15,2) DEFAULT '0.00',
            `total_profit` decimal(15,2) DEFAULT '0.00',
            `currency` varchar(10) DEFAULT 'USD',
            `notes` text DEFAULT NULL,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
        'project_developers' => "CREATE TABLE IF NOT EXISTS `project_developers` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `project_id` int(11) NOT NULL,
            `developer_id` int(11) NOT NULL,
            `cost` decimal(15,2) DEFAULT '0.00',
            `is_advance_paid` tinyint(1) DEFAULT '0',
            `is_final_paid` tinyint(1) DEFAULT '0',
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
        'payments' => "CREATE TABLE IF NOT EXISTS `payments` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `project_id` int(11) NOT NULL,
            `payment_number` int(11) NOT NULL,
            `amount` decimal(15,2) NOT NULL,
            `due_date` date DEFAULT NULL,
            `paid_date` date DEFAULT NULL,
            `status` varchar(50) DEFAULT 'Unpaid',
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
        'notifications' => "CREATE TABLE IF NOT EXISTS `notifications` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `message` text NOT NULL,
            `is_read` tinyint(1) DEFAULT '0',
            `sent_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
    ];
    
    foreach ($tables as $name => $sql) {
        $pdo->exec($sql);
    }
    
    // Ensure default users exist
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
        } else {
            $pdo->prepare("UPDATE users SET password = ?, role = ? WHERE LOWER(username) = LOWER(?)")
                ->execute([$hashed, $u['role'], $u['username']]);
        }
    }
}

// 4. Helper Function: Get JSON Input
function getJsonInput() {
    $rawInput = file_get_contents("php://input");
    $input = json_decode($rawInput, true);
    
    if (empty($input) && !empty($_POST)) {
        $input = $_POST;
    }
    
    return $input ?? [];
}

// Helper to check if database is connected
function isDbConnected() {
    return isset($GLOBALS['db_connected']) && $GLOBALS['db_connected'] === true;
}

