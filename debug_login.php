<?php
// debug_login.php - Verbose login debugger
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>🔍 Login Debugger</h1>";

// 1. Load Secrets
$secretsPath = dirname(__DIR__) . '/secrets.php';
if (!file_exists($secretsPath)) $secretsPath = __DIR__ . '/secrets.php';

if (file_exists($secretsPath)) {
    require_once $secretsPath;
    echo "✅ Secrets loaded<br>";
} else {
    die("❌ Secrets NOT found");
}

try {
    // 2. Connect DB
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Database connected<br>";
    
    // 3. Check User
    $username = 'admin'; // Testing admin user
    $password = 'admin123'; // Testing admin pass
    
    echo "<h3>Testing User: $username / $password</h3>";
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo "✅ User found: ID {$user['id']}, Role: {$user['role']}<br>";
        echo "Stored Hash: " . substr($user['password'], 0, 10) . "...<br>";
        
        // 4. Verify Password
        if (password_verify($password, $user['password'])) {
            echo "✅ <b style='color:green'>PASSWORD MATCH!</b><br>";
            
            // 5. Test Session
            if (session_status() === PHP_SESSION_NONE) session_start();
            $_SESSION['test'] = 'working';
            echo "Session ID: " . session_id() . "<br>";
            echo "Session Status: " . session_status() . "<br>";
            echo "Session Path: " . session_save_path() . "<br>";
            echo "Session Writeable: " . (is_writable(session_save_path()) ? 'Yes' : 'No') . "<br>";
            
        } else {
            echo "❌ <b style='color:red'>PASSWORD MISMATCH</b><br>";
            echo "Hash info: " . print_r(password_get_info($user['password']), true) . "<br>";
        }
    } else {
        echo "❌ User NOT found in database<br>";
    }

} catch (PDOException $e) {
    echo "❌ DB Error: " . $e->getMessage();
}
?>
