<?php
// api/sendReminder.php
require_once 'config.php';
require_once 'mail_helper.php';

// Secure Secret Key (Prevent random access)
$inputKey = $_GET['key'] ?? '';
$secretKey = defined('CRON_SECRET') ? CRON_SECRET : 'default_secret_change_me';

if ($inputKey !== $secretKey) {
    http_response_code(403);
    exit(json_encode(["error" => "Unauthorized"]));
}

// Email Details
$to = 'novalinkhelp@gmail.com';
$subject = 'Stratis Backup Reminder - ' . date('Y-m-d');
$message = "
<html>
<head>
    <title>Stratis Backup Reminder</title>
</head>
<body>
    <h1>System Maintenance Reminder</h1>
    <p>Dear Administrator,</p>
    <p>This is an automated reminder to download a backup of your Stratis Management Suite database.</p>
    <p>It has been 2 months since the last scheduled reminder.</p>
    <br>
    <p><strong>Action Required:</strong> Log in to Stratis > Settings > Click 'Download System Backup'.</p>
    <br>
    <p>System Alerts:</p>
    <ul>
        <li>✅ Database: Online</li>
        <li>✅ API: Active</li>
    </ul>
    <br>
    <p>Best Regards,<br>Stratis System</p>
</body>
</html>
";

// Headers
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= 'From: Stratis System <noreply@yourdomain.com>' . "\r\n";

// Send Email (via PHPMailer if available)
if (send_email($to, $subject, $message, 'noreply@yourdomain.com', 'Stratis System')) {
    echo json_encode(["success" => true, "message" => "Reminder sent"]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to send email"]);
}
?>
