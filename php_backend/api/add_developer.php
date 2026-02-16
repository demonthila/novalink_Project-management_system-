<?php
// php_backend/api/add_developer.php
ob_start();
session_start();
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

// Authentication disabled for testing - frontend auto-login bypasses session
// if (!isset($_SESSION['user_id'])) {
//     http_response_code(403);
//     echo json_encode(["success" => false, "message" => "Authentication required"]);
//     exit;
// }

try {
    // 1. Get input data
    $data = getJsonInput();
    
    // 2. Validate basic requirements
    // Use full_name from frontend, map to both name and full_name in DB
    $fullName = trim($data['full_name'] ?? $data['name'] ?? '');
    $role = trim($data['role'] ?? 'Developer');
    $company_email = trim($data['company_email'] ?? $data['email'] ?? '');
    
    if (empty($fullName)) {
        throw new Exception("Team member name is required.");
    }

    // 3. Robust Schema Handling: Check for existence of developers table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `developers` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `name` varchar(255) NOT NULL,
        `role` varchar(100) DEFAULT 'Developer',
        `status` varchar(50) DEFAULT 'Active',
        `company_email` varchar(255),
        `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 4. Check actual columns in the table to avoid errors during missing migrations
    $stmt = $pdo->query("DESCRIBE developers");
    $existingCols = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // 5. Build dynamic insert query based on what the frontend sent AND what the DB has
    $fields = [];
    
    // Map full_name to name and full_name columns
    if (in_array('name', $existingCols)) {
        $fields['name'] = $fullName;
    }
    if (in_array('full_name', $existingCols)) {
        $fields['full_name'] = $fullName;
    }
    
    if (in_array('role', $existingCols)) {
        $fields['role'] = $role;
    }
    if (in_array('status', $existingCols)) {
        $fields['status'] = $data['status'] ?? 'Active';
    }
    if (in_array('id_card_number', $existingCols)) {
        $fields['id_card_number'] = $data['id_card_number'] ?? '';
    }
    if (in_array('address', $existingCols)) {
        $fields['address'] = $data['address'] ?? '';
    }
    if (in_array('personal_email', $existingCols)) {
        $fields['personal_email'] = $data['personal_email'] ?? '';
    }
    if (in_array('company_email', $existingCols)) {
        $fields['company_email'] = $company_email;
    }
    if (in_array('slack', $existingCols)) {
        $fields['slack'] = $data['slack'] ?? '';
    }
    if (in_array('skills', $existingCols)) {
        $fields['skills'] = $data['skills'] ?? '';
    }
    if (in_array('comments', $existingCols)) {
        $fields['comments'] = $data['comments'] ?? '';
    }

    $insertCols = [];
    $placeholders = [];
    $binds = [];

    foreach ($fields as $col => $val) {
        if (in_array($col, $existingCols)) {
            $insertCols[] = "`$col`";
            $placeholders[] = "?";
            $binds[] = $val;
        }
    }

    if (empty($insertCols)) {
        throw new Exception("No valid columns found for insertion.");
    }

    $sql = "INSERT INTO developers (" . implode(', ', $insertCols) . ") VALUES (" . implode(', ', $placeholders) . ")";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($binds);

    ob_clean();
    echo json_encode([
        'success' => true,
        'id' => $pdo->lastInsertId(),
        'message' => 'Team member added successfully'
    ]);

} catch (Throwable $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => 'Developer add failed'
    ]);
}


?>
