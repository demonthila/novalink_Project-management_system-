<?php
// Debug endpoint - tests rescue login specifically
header('Content-Type: application/json');

ob_start();
session_start();

// Get the raw input
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

$response = [
    'received_username' => $username,
    'received_password' => $password,
    'username_trimmed' => trim($username),
    'password_trimmed' => trim($password),
    'username_lower' => strtolower(trim($username)),
    'session_id' => session_id(),
    'session_started' => session_status() === PHP_SESSION_ACTIVE
];

// Test the exact rescue condition
$uLower = strtolower(trim($username));
$passTrimmed = trim($password);

$response['test_admin_login'] = ($uLower === 'admin' && $passTrimmed === 'admin123');
$response['test_thilan_login'] = ($uLower === 'thilan' && $passTrimmed === 'Thilan12321');

echo json_encode($response);

