<?php
// api/notifications.php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

// GET Notifications (Unread first)
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM notifications ORDER BY is_read ASC, sent_at DESC LIMIT 50");
    echo json_encode($stmt->fetchAll());
}

// PUT Mark as Read
elseif ($method === 'PUT') {
    $data = getJsonInput();
    if (isset($data['id'])) {
        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(["success" => true]);
    } elseif (isset($data['mark_all_read'])) {
        $pdo->exec("UPDATE notifications SET is_read = 1");
        echo json_encode(["success" => true]);
    }
}
?>
