<?php
// reset_users.php - UPDATED for standard shared hosting structure
ini_set('display_errors', 1);
error_reporting(E_ALL);

// The file was found, let's just use it
$secretsPath = dirname(__DIR__) . '/secrets.php';
echo "<h1>🔑 Loading Secrets...</h1>";
echo "Trying path: $secretsPath <br>";

if (file_exists($secretsPath)) {
    require_once $secretsPath;
    echo "✅ Loaded secrets.php successfully.<br>";
} else {
    // Try one level deeper just in case (some weird document roots)
    $secretsPath = __DIR__ . '/secrets.php';
    if (file_exists($secretsPath)) {
        require_once $secretsPath;
        echo "✅ Loaded secrets.php from current dir.<br>";
    } else {
        die("❌ Failed to find secrets.php. It is not in " . dirname(__DIR__) . " or " . __DIR__);
    }
}

try {
    // Connect to Database
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<br>✅ Database Connected Successfully<br>";

    // Reset Users
    $pdo->exec("DELETE FROM users WHERE username IN ('admin', 'sanjulathilan12321@gmail.com')");
    echo "🗑️ Cleared existing users<br>";

    $users = [
        ['sanjulathilan12321@gmail.com', 'Sanjula Thilan', 'sanjulathilan12321@gmail.com', 'thilan12321', 'Superadmin'],
        ['admin', 'Administrator', 'admin@novalink.com', 'admin123', 'Admin']
    ];

    foreach ($users as $u) {
        $hashed = password_hash($u[3], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, name, email, password, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$u[0], $u[1], $u[2], $hashed, $u[4]]);
        echo "👤 Created user: <b>{$u[0]}</b> (Pass: {$u[3]})<br>";
    }

    echo "<br><h2>🎉 SUCCESS! You can now login.</h2>";
    echo "<b>Login with: admin / admin123</b><br>";
    echo "<i>Please delete this file (reset_users.php) after logging in!</i>";

} catch (PDOException $e) {
    echo "<br>❌ Database Error: " . $e->getMessage();
    echo "<br>Check your DB credentials in secrets.php";
}
?>
