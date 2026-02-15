<?php
// Simple test endpoint
header('Content-Type: application/json');
echo json_encode([
    'status' => 'ok',
    'message' => 'PHP API is running',
    'time' => date('Y-m-d H:i:s')
]);

