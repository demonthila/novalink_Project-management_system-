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
$secretFile = __DIR__ . '/../../secrets.php'; 

if (file_exists($secretFile)) {
    require_once $secretFile;
} else {
    // FALLBACK / LOCAL DEVELOPMENT VARIABLES
    if (!defined('DB_HOST')) define('DB_HOST', 'localhost');
    if (!defined('DB_NAME')) define('DB_NAME', 'novalink');
    if (!defined('DB_USER')) define('DB_USER', 'root');
    if (!defined('DB_PASS')) define('DB_PASS', '');
    if (!defined('GEMINI_API_KEY')) define('GEMINI_API_KEY', 'your_dev_key_here');
    if (!defined('CRON_SECRET')) define('CRON_SECRET', 'stratis_secure_cron_token_123'); // NEW
}

// 3. Database Connection - Make it optional for rescue login
$GLOBALS['db_connected'] = false;
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $GLOBALS['db_connected'] = true;
} catch(PDOException $e) {
    // Don't exit - continue without database for rescue login
    $GLOBALS['db_error'] = $e->getMessage();
}

// 4. Helper Function: Get JSON Input
function getJsonInput() {
    // Attempt 1: Standard PHP input stream
    $rawInput = file_get_contents("php://input");
    $GLOBALS['debug_raw_body'] = $rawInput;
    $input = json_decode($rawInput, true);
    $GLOBALS['debug_json_error'] = json_last_error_msg();
    
    // Attempt 2: Check global GLOBALS if available
    if (empty($input) && isset($GLOBALS['HTTP_RAW_POST_DATA'])) {
        $input = json_decode($GLOBALS['HTTP_RAW_POST_DATA'], true);
    }

    // Attempt 3: Standard POST 
    if (empty($input) && !empty($_POST)) {
        $input = $_POST;
    }

    // Store raw length for debugging
    $GLOBALS['debug_raw_len'] = strlen($rawInput);
    
    return $input ?? [];
}

// Helper to check if database is connected
function isDbConnected() {
    return isset($GLOBALS['db_connected']) && $GLOBALS['db_connected'] === true;
}
