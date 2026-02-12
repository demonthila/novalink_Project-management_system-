<?php
// api/gemini.php
// Secure Proxy for Google Gemini API
// This prevents exposing your API key in the frontend code.

require_once 'config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(["error" => "Method Not Allowed"]));
}

$input = getJsonInput();
$prompt = $input['prompt'] ?? '';

if (empty($prompt)) {
    http_response_code(400);
    exit(json_encode(["error" => "Prompt is required"]));
}

// Prepare request to Google Gemini API
$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" . GEMINI_API_KEY;

$headers = [
    'Content-Type: application/json'
];

$payload = [
    "contents" => [
        [
            "parts" => [
                ["text" => $prompt] 
            ]
        ]
    ]
];

// Initialize cURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(["error" => "Curl Error: " . curl_error($ch)]);
} else {
    // Return the raw response from Gemini to the frontend
    // The frontend will parse it just like it parsed the direct API call
    http_response_code($httpCode);
    echo $response;
}

curl_close($ch);
?>
