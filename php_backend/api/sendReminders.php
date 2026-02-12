<?php
// api/sendReminders.php
// RUN THIS VIA CRON JOB DAILY
// Example: 0 8 * * * /usr/bin/php /home/u123456789/public_html/api/sendReminders.php

// Ensure this script can only be run via CLI or with a secret key
if (php_sapi_name() !== 'cli' && (!isset($_GET['secret']) || $_GET['secret'] !== CRON_SECRET)) {
    http_response_code(403);
    exit("Access Denied");
}

require_once 'config.php';

// Helper: Send Email
function sendEmail($to, $subject, $message) {
    // Basic mail() wrapper. Replace with PHPMailer for SMTP if needed.
    $headers = "From: Stratis Notifications <no-reply@stratis.com>\r\n";
    $headers .= "Reply-To: novalinkhelp@gmail.com\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    
    return mail($to, $subject, $message, $headers);
}

// 1. Payment Reminders (1 day before due date, unpaid)
$stmt = $pdo->query("
    SELECT p.*, pr.name as project_name, c.email as client_email 
    FROM payments p
    JOIN projects pr ON p.project_id = pr.id
    JOIN clients c ON pr.client_id = c.id
    WHERE p.status = 'Unpaid' 
    AND p.due_date = DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY)
");
$payments = $stmt->fetchAll();

foreach ($payments as $p) {
    $msg = "Reminder: Payment of {$p['amount']} for project '{$p['project_name']}' is due tomorrow ({$p['due_date']}).";
    $sysMsg = "Payment reminder sent for project {$p['project_name']}.";
    
    // Notify Admin
    sendEmail('novalinkhelp@gmail.com', 'Payment Reminder: ' . $p['project_name'], $msg);
    // Add Notification
    $pdo->prepare("INSERT INTO notifications (project_id, type, message, sent_to) VALUES (?, 'Payment', ?, ?)")
        ->execute([$p['project_id'], $sysMsg, 'novalinkhelp@gmail.com']);
}

// 2. Deadline Reminders (3 days before project deadline, status not blocked/completed)
$stmt = $pdo->query("
    SELECT * FROM projects 
    WHERE status IN ('Pending', 'Active') 
    AND end_date = DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY)
");
$deadlines = $stmt->fetchAll();

foreach ($deadlines as $d) {
    $msg = "Project '{$d['name']}' deadline is in 3 days ({$d['end_date']}). Please ensure all tasks are on track.";
    sendEmail('novalinkhelp@gmail.com', 'Deadline Warning: ' . $d['name'], $msg);
    $pdo->prepare("INSERT INTO notifications (project_id, type, message, sent_to) VALUES (?, 'Deadline', ?, ?)")
        ->execute([$d['id'], $msg, 'novalinkhelp@gmail.com']);
}

// 3. Backup Reminder (Every 2 months)
// Check last backup date or just run on specific dates? Cron handles scheduling, but logic here:
// We can check if today is 1st of month and month % 2 == 0.
if (date('j') == 1 && date('n') % 2 == 0) {
    $msg = "Bi-monthly backup reminder. Please download the latest backup from Settings.";
    sendEmail('novalinkhelp@gmail.com', 'System Backup Reminder', $msg);
    $pdo->prepare("INSERT INTO notifications (type, message, sent_to) VALUES ('Backup', ?, ?)")
        ->execute([$msg, 'novalinkhelp@gmail.com']);
}

echo "Reminders processed.";
?>
