<?php
// api/add_developer.php
// Adds a new developer to the `developers` table.
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed, use POST']);
    exit();
}

$data = getJsonInput();

// sanitize and assign
$full_name = isset($data['full_name']) ? trim($data['full_name']) : '';
$id_card_number = isset($data['id_card_number']) ? trim($data['id_card_number']) : '';
$address = isset($data['address']) ? trim($data['address']) : '';
$personal_email = isset($data['personal_email']) ? trim($data['personal_email']) : '';
$company_email = isset($data['company_email']) ? trim($data['company_email']) : '';
$slack = isset($data['slack']) ? trim($data['slack']) : '';
$skills = isset($data['skills']) ? trim($data['skills']) : '';
$comments = isset($data['comments']) ? trim($data['comments']) : '';

// basic validation
$errors = [];
if (empty($full_name)) $errors[] = 'Full name is required';
if (empty($id_card_number)) $errors[] = 'ID card number is required';
if (empty($company_email)) $errors[] = 'Company email is required';
if (!empty($personal_email) && !filter_var($personal_email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Personal email is invalid';
if (!empty($company_email) && !filter_var($company_email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Company email is invalid';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit();
}

try {
    // ensure table exists (create if missing)
    $createSql = "CREATE TABLE IF NOT EXISTS developers (
        id INT AUTO_INCREMENT PRIMARY KEY
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;";
    $pdo->exec($createSql);

    // Ensure required columns exist (non-destructive alterations)
    $requiredCols = [
        'full_name' => "VARCHAR(255) NOT NULL",
        'id_card_number' => "VARCHAR(100) NOT NULL",
        'address' => "TEXT",
        'personal_email' => "VARCHAR(255)",
        'company_email' => "VARCHAR(255) NOT NULL",
        'slack' => "VARCHAR(100)",
        'skills' => "TEXT",
        'comments' => "TEXT",
        'created_at' => "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    ];

    foreach ($requiredCols as $col => $def) {
        $colCheck = $pdo->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'developers' AND COLUMN_NAME = :col");
        $colCheck->execute([':db' => DB_NAME, ':col' => $col]);
        $exists = (int)$colCheck->fetchColumn() > 0;
        if (!$exists) {
            $alter = "ALTER TABLE developers ADD COLUMN `" . $col . "` " . $def;
            $pdo->exec($alter);
        }
    }

    // Determine actual columns in the existing table and map our fields to them
    $colStmt = $pdo->prepare("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'developers'");
    $colStmt->execute([':db' => DB_NAME]);
    $tableCols = $colStmt->fetchAll(PDO::FETCH_COLUMN);

    $candidates = [
        'full_name' => ['full_name','name','developer_name'],
        'id_card_number' => ['id_card_number','id_card','id_number'],
        'address' => ['address','addr'],
        'personal_email' => ['personal_email','email_personal','personal_email'],
        'company_email' => ['company_email','email','company_email'],
        'slack' => ['slack','slack_username'],
        'skills' => ['skills','skill_set'],
        'comments' => ['comments','notes','comment']
    ];

    $insertCols = [];
    $placeholders = [];
    $binds = [];

    foreach ($candidates as $field => $aliases) {
        foreach ($aliases as $alias) {
            if (in_array($alias, $tableCols)) {
                $insertCols[] = "`$alias`";
                $placeholders[] = ':' . $field;
                $binds[':' . $field] = ${$field};
                break;
            }
        }
    }

    // Fill common legacy NOT NULL columns if present but not filled above
    if (in_array('name', $tableCols) && !in_array('`name`', $insertCols)) {
        $insertCols[] = '`name`';
        $placeholders[] = ':name_legacy';
        $binds[':name_legacy'] = $full_name;
    }
    if (in_array('email', $tableCols) && !in_array('`email`', $insertCols)) {
        $insertCols[] = '`email`';
        $placeholders[] = ':email_legacy';
        $binds[':email_legacy'] = $company_email ?: $personal_email;
    }
    if (in_array('role', $tableCols) && !in_array('`role`', $insertCols)) {
        $insertCols[] = '`role`';
        $placeholders[] = ':role_legacy';
        $binds[':role_legacy'] = 'Developer';
    }
    if (in_array('status', $tableCols) && !in_array('`status`', $insertCols)) {
        $insertCols[] = '`status`';
        $placeholders[] = ':status_legacy';
        $binds[':status_legacy'] = 'Active';
    }

    if (empty($insertCols)) {
        throw new Exception('No compatible columns found in developers table');
    }

    $sql = "INSERT INTO developers (" . implode(',', $insertCols) . ") VALUES (" . implode(',', $placeholders) . ")";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($binds);

    $id = $pdo->lastInsertId();
    echo json_encode(['success' => true, 'id' => $id]);
    exit();

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit();
}

?>
