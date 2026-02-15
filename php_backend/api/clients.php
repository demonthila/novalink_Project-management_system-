<?php
// php_backend/api/clients.php
ob_start();
session_start();
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

// Authentication temporarily disabled for testing
/*
$method = $_SERVER['REQUEST_METHOD'];
if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Authentication required"]);
        exit;
    }
}
*/

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $id = $_GET['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM clients WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode($stmt->fetch());
        } else {
            $stmt = $pdo->query("SELECT * FROM clients ORDER BY name ASC");
            echo json_encode($stmt->fetchAll());
        }
    } 
    elseif ($method === 'POST') {
        $data = getJsonInput();
        if (empty($data['name'])) {
            throw new Exception("Partner name is required.");
        }

        // Self-Healing Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `clients` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `company_name` varchar(255) DEFAULT NULL,
            `email` varchar(255) DEFAULT '',
            `phone` varchar(100) DEFAULT '',
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $stmt = $pdo->prepare("INSERT INTO clients (name, email, phone, company_name) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data['name'],
            $data['email'] ?? '',
            $data['phone'] ?? '',
            $data['company_name'] ?? ''
        ]);

        echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
    }
    elseif ($method === 'PUT') {
        $data = getJsonInput();
        $id = $_GET['id'] ?? $data['id'] ?? null;
        if (!$id) throw new Exception("ID required for update");

        $stmt = $pdo->prepare("UPDATE clients SET name = ?, email = ?, phone = ?, company_name = ? WHERE id = ?");
        $stmt->execute([
            $data['name'],
            $data['email'] ?? '',
            $data['phone'] ?? '',
            $data['company_name'] ?? '',
            $id
        ]);

        echo json_encode(["success" => true]);
    }
    elseif ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            $data = getJsonInput();
            $id = $data['id'] ?? null;
        }
        if (!$id) throw new Exception("ID required for delete");

        $stmt = $pdo->prepare("DELETE FROM clients WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
    }

} catch (Throwable $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>
