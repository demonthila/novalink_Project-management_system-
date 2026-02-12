<?php
// api/sendPaymentReminder.php
require_once 'config.php';

// Secure with Cron Secret
$inputKey = $_GET['key'] ?? '';
$secretKey = defined('CRON_SECRET') ? CRON_SECRET : 'default_secret_change_me';

if ($inputKey !== $secretKey) {
    http_response_code(403);
    exit(json_encode(["error" => "Unauthorized"]));
}

// Get Currency for formatting
$currencyStmt = $pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'currency'");
$currency = $currencyStmt->fetchColumn() ?: 'AUD';

// Query Unpaid Milestones Due within 3 days OR Past Due
// AND where project status is NOT Completed/Cancelled
$sql = "
    SELECT 
        m.id, m.label, m.amount, m.due_date, 
        p.name as project_name, 
        c.email as client_email, c.name as client_name
    FROM milestones m
    JOIN projects p ON m.project_id = p.id
    LEFT JOIN clients c ON p.client_id = c.id
    WHERE 
        m.is_paid = 0 
        AND m.due_date IS NOT NULL
        AND (
            DATEDIFF(m.due_date, CURDATE()) = 3  -- 3 Days Before
            OR m.due_date <= CURDATE()           -- Overdue or Due Today
        )
        AND p.status IN ('Approved', 'Ongoing')
";

$stmt = $pdo->query($sql);
$overduePayments = $stmt->fetchAll();
$emailsSent = 0;

foreach ($overduePayments as $payment) {
    // We send reminders to the ADMIN (novalinkhelp@gmail.com) as per request, 
    // NOT the client directly (unless specified otherwise).
    // Prompt said: "Email address: novalinkhelp@gmail.com"
    
    $to = 'novalinkhelp@gmail.com';
    $subject = "Payment Reminder: " . $payment['project_name'] . " - " . $payment['label'];
    
    $dueDateFormatted = date('d M Y', strtotime($payment['due_date']));
    $amountFormatted = number_format($payment['amount'], 2);
    
    $message = "
    <html>
    <head>
        <title>Payment Reminder</title>
    </head>
    <body>
        <h2>Payment Reminder</h2>
        <p>The following payment is due or overdue:</p>
        <ul>
            <li><strong>Project:</strong> {$payment['project_name']}</li>
            <li><strong>Milestone:</strong> {$payment['label']}</li>
            <li><strong>Amount:</strong> {$currency} {$amountFormatted}</li>
            <li><strong>Due Date:</strong> {$dueDateFormatted}</li>
            <li><strong>Client:</strong> {$payment['client_name']} ({$payment['client_email']})</li>
        </ul>
        <p>Please ensure this invoice is followed up.</p>
        <br>
        <p>Stratis System</p>
    </body>
    </html>
    ";

    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= 'From: Stratis Accounts <noreply@stratis.com>' . "\r\n";

    if (mail($to, $subject, $message, $headers)) {
        $emailsSent++;
    }
}

echo json_encode([
    "success" => true, 
    "processed" => count($overduePayments), 
    "emails_sent" => $emailsSent
]);
?>
