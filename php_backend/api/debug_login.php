<?php
// Debug login test - bypasses most checks
header('Content-Type: application/json');

echo json_encode([
    'status' => 'test_endpoint_working',
    'method' => $_SERVER['REQUEST_METHOD'],
    'get_params' => $_GET,
    'post_data' => $_POST,
    'raw_input' => file_get_contents("php://input")
]);

