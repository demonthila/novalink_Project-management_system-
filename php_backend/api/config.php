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

// Authentication check - Mandatory Login Enforcement
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$current_script = basename($_SERVER['SCRIPT_NAME']);
$exempt_scripts = ['auth.php', 'health.php', 'debug_login.php', 'test_rescue.php'];

if (!in_array($current_script, $exempt_scripts)) {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode([
            "success" => false, 
            "message" => "Unauthorized access. Session invalid or expired.",
            "error_code" => "UNAUTHORIZED"
        ]);
        exit;
    }
}

// 1. CORS Headers
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Access-Control-Allow-Credentials: true");
}
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

function getJsonInput() {
    $input = file_get_contents('php://input');
    if (!$input) return [];
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return [];
    }
    return $data;
}

// Global Error Handler to ensure JSON response
set_exception_handler(function($e) {
    if (ob_get_length()) ob_clean();
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "error" => $e->getMessage(),
        "trace" => "Internal Server Error"
    ]);
    exit;
});

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    if (!(error_reporting() & $errno)) return false;
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});


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
$pdo = null;
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
            `full_name` varchar(255) DEFAULT NULL,
            `role` varchar(100) DEFAULT 'Developer',
            `status` varchar(50) DEFAULT 'Active',
            `email` varchar(255) DEFAULT NULL,
            `personal_email` varchar(255) DEFAULT NULL,
            `company_email` varchar(255) DEFAULT NULL,
            `id_card_number` varchar(100) DEFAULT NULL,
            `address` text DEFAULT NULL,
            `slack` varchar(100) DEFAULT NULL,
            `skills` text DEFAULT NULL,
            `comments` text DEFAULT NULL,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
        'projects' => "CREATE TABLE IF NOT EXISTS `projects` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `client_id` int(11) NOT NULL,
            `start_date` date DEFAULT NULL,
            `end_date` date DEFAULT NULL,
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
        'additional_costs' => "CREATE TABLE IF NOT EXISTS `additional_costs` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `project_id` int(11) NOT NULL,
            `cost_type` varchar(255) DEFAULT 'Third Party Cost',
            `description` text,
            `amount` decimal(15,2) DEFAULT '0.00',
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
    
    // ENSURE COLUMNS EXIST (Migration for existing tables)
    // Cache migrations to avoid repeated slow DESCRIBE calls
    $pCols = $pdo->query("DESCRIBE projects")->fetchAll();
    $statusCol = null;
    foreach($pCols as $c) if($c['Field'] === 'status') $statusCol = $c;
    
    if ($statusCol && strpos($statusCol['Type'], 'enum') !== false) {
        $pdo->exec("ALTER TABLE projects MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending'");
    }
    
    $pColNames = array_map(function($c) { return $c['Field']; }, $pCols);
    if (!in_array('start_date', $pColNames)) $pdo->exec("ALTER TABLE projects ADD COLUMN start_date DATE DEFAULT NULL AFTER client_id");
    if (!in_array('end_date', $pColNames)) $pdo->exec("ALTER TABLE projects ADD COLUMN end_date DATE DEFAULT NULL AFTER start_date");
    
    if (!in_array('total_revenue', $pColNames)) {
        if (in_array('base_amount', $pColNames)) {
            $pdo->exec("ALTER TABLE projects CHANGE COLUMN base_amount total_revenue DECIMAL(15,2) DEFAULT 0.00");
        } else {
            $pdo->exec("ALTER TABLE projects ADD COLUMN total_revenue DECIMAL(15,2) DEFAULT 0.00");
        }
    }
    if (!in_array('total_profit', $pColNames)) {
        $pdo->exec("ALTER TABLE projects ADD COLUMN total_profit DECIMAL(15,2) DEFAULT 0.00");
    }
    
    // Developers table
    $dCols = $pdo->query("DESCRIBE developers")->fetchAll(PDO::FETCH_COLUMN);
    $devFields = [
        'full_name' => "VARCHAR(255) DEFAULT NULL",
        'email' => "VARCHAR(255) DEFAULT NULL",
        'personal_email' => "VARCHAR(255) DEFAULT NULL",
        'company_email' => "VARCHAR(255) DEFAULT NULL",
        'id_card_number' => "VARCHAR(100) DEFAULT NULL",
        'address' => "TEXT DEFAULT NULL",
        'slack' => "VARCHAR(100) DEFAULT NULL",
        'skills' => "TEXT DEFAULT NULL",
        'comments' => "TEXT DEFAULT NULL"
    ];
    foreach ($devFields as $field => $def) {
        if (!in_array($field, $dCols)) {
            $pdo->exec("ALTER TABLE developers ADD COLUMN $field $def");
        }
    }
    
    // Clients table
    $cCols = $pdo->query("DESCRIBE clients")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('company_name', $cCols)) $pdo->exec("ALTER TABLE clients ADD COLUMN company_name VARCHAR(255) DEFAULT NULL AFTER name");
    if (!in_array('phone', $cCols)) $pdo->exec("ALTER TABLE clients ADD COLUMN phone VARCHAR(100) DEFAULT NULL AFTER email");
    if (!in_array('address', $cCols)) $pdo->exec("ALTER TABLE clients ADD COLUMN address TEXT DEFAULT NULL");

    // Additional Costs table migrations
    $acCols = $pdo->query("DESCRIBE additional_costs")->fetchAll();
    $costTypeCol = null;
    $nameCol = null;
    foreach ($acCols as $col) {
        if ($col['Field'] === 'cost_type') $costTypeCol = $col;
        if ($col['Field'] === 'name') $nameCol = $col;
    }

    if (!$costTypeCol) {
        if ($nameCol) {
            $pdo->exec("ALTER TABLE additional_costs CHANGE COLUMN name cost_type VARCHAR(255) DEFAULT 'Third Party Cost'");
        } else {
            $pdo->exec("ALTER TABLE additional_costs ADD COLUMN cost_type VARCHAR(255) DEFAULT 'Third Party Cost' AFTER project_id");
        }
    } elseif (strpos($costTypeCol['Type'], 'enum') !== false) {
        // Force convert ENUM to VARCHAR to support 'Custom' and other values
        $pdo->exec("ALTER TABLE additional_costs MODIFY COLUMN cost_type VARCHAR(255) DEFAULT 'Third Party Cost'");
    }

    
    // Ensure project_developers has payment flags
    $pdCols = $pdo->query("DESCRIBE project_developers")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('is_advance_paid', $pdCols)) $pdo->exec("ALTER TABLE project_developers ADD COLUMN is_advance_paid TINYINT(1) DEFAULT 0");
    if (!in_array('is_final_paid', $pdCols)) $pdo->exec("ALTER TABLE project_developers ADD COLUMN is_final_paid TINYINT(1) DEFAULT 0");
    if (!in_array('cost', $pdCols)) $pdo->exec("ALTER TABLE project_developers ADD COLUMN cost DECIMAL(15,2) DEFAULT 0.00");
    
    // Settings table (Ensure it exists for dashboard)
    $pdo->exec("CREATE TABLE IF NOT EXISTS `settings` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `setting_key` varchar(100) NOT NULL UNIQUE,
        `setting_value` text,
        `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    
    // Ensure default settings exist
    $pdo->exec("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('currency', 'USD')");
    
    // Ensure default users exist
    $usersToEnsure = [
        ['username' => 'sanjulathilan12321@gmail.com', 'name' => 'Sanjula Thilan', 'email' => 'sanjulathilan12321@gmail.com', 'pass' => 'thilan12321', 'role' => 'Superadmin'],
        ['username' => 'admin', 'name' => 'Administrator', 'email' => 'admin@novalink.com', 'pass' => 'admin123', 'role' => 'Admin']
    ];

    foreach ($usersToEnsure as $u) {
        $check = $pdo->prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?)");
        $check->execute([$u['username']]);
        
        if ($check->rowCount() == 0) {
            $hashed = password_hash($u['pass'], PASSWORD_DEFAULT);
            $pdo->prepare("INSERT INTO users (username, name, email, password, role) VALUES (?, ?, ?, ?, ?)")
                ->execute([$u['username'], $u['name'], $u['email'], $hashed, $u['role']]);
        }
    }
}

// Helper to check if database is connected
function isDbConnected() {
    return isset($GLOBALS['db_connected']) && $GLOBALS['db_connected'] === true;
}

