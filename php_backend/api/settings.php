<?php
// api/settings.php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET Settings
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings");
    $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    echo json_encode($settings);
}

// PUT Update Settings
elseif ($method === 'PUT') {
    $data = getJsonInput();
    
    foreach ($data as $key => $value) {
        $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        $stmt->execute([$key, $value, $value]);
    }
    
    echo json_encode(["success" => true, "message" => "Settings updated"]);
}
?>
