<?php
// api/config.php

// SECURITY BEST PRACTICE:
// On Hostinger, place a file named 'secrets.php' one level ABOVE public_html.
// public_html/api/config.php (this file) will include it.
// This prevents your passwords/API keys from ever being accessed via the browser.

// 1. CORS Headers
header("Access-Control-Allow-Origin: *"); // UPDATE THIS to your domain in production
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
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
    if (!defined('DB_NAME')) define('DB_NAME', 'u123456789_novalink');
    if (!defined('DB_USER')) define('DB_USER', 'root');
    if (!defined('DB_PASS')) define('DB_PASS', '');
    if (!defined('GEMINI_API_KEY')) define('GEMINI_API_KEY', 'your_dev_key_here');
    if (!defined('CRON_SECRET')) define('CRON_SECRET', 'stratis_secure_cron_token_123'); // NEW
}

// 3. Database Connection
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed."]);
    exit();
}

// 4. Helper Function: Get JSON Input
function getJsonInput() {
    $input = json_decode(file_get_contents("php://input"), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return [];
    }
    return $input;
}
?>
