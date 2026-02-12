<?php
// api/upload.php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(["error" => "Method Not Allowed"]));
}

// Limit file size (e.g., 5MB)
$maxSize = 5 * 1024 * 1024;
$allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
$uploadDir = '../uploads/'; // Store outside public access or in a specific folder

// Ensure upload directory exists
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['file'];
    
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        exit(json_encode(["error" => "File too large"]));
    }
    
    // Validate MIME type (basic check)
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    
    if (!in_array($mimeType, $allowedTypes)) {
        http_response_code(400);
        exit(json_encode(["error" => "Invalid file type"]));
    }
    
    // Generate unique name
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('upload_', true) . '.' . $ext;
    $targetPath = $uploadDir . $filename;
    
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Return relative URL for frontend access
        // Assuming your web root structure, you might need a script to serve these securely
        // OR put them in public/uploads if security is less concern for these specific files
        echo json_encode([
            "success" => true, 
            "url" => "/uploads/" . $filename,
            "filename" => $filename
        ]);
    } else {
        http_response_code(500);
        exit(json_encode(["error" => "Failed to move uploaded file"]));
    }
} else {
    http_response_code(400);
    echo json_encode(["error" => "No file uploaded or upload error"]);
}
?>
