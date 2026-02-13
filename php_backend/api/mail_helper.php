<?php
// api/mail_helper.php
// Wrapper to send HTML emails using PHPMailer if available, otherwise fallback to mail().
require_once __DIR__ . '/config.php';

function send_email($to, $subject, $htmlBody, $fromEmail = null, $fromName = null, $replyTo = null) {
    $fromEmail = $fromEmail ?: (defined('MAIL_FROM') ? MAIL_FROM : 'noreply@yourdomain.com');
    $fromName = $fromName ?: (defined('MAIL_FROM_NAME') ? MAIL_FROM_NAME : 'Stratis System');

    // Try to load Composer autoload for PHPMailer
    $autoloadPaths = [
        __DIR__ . '/../vendor/autoload.php',
        __DIR__ . '/vendor/autoload.php',
        __DIR__ . '/../../vendor/autoload.php'
    ];

    $autoload = null;
    foreach ($autoloadPaths as $p) {
        if (file_exists($p)) { $autoload = $p; break; }
    }

    if ($autoload) {
        require_once $autoload;
        // Use PHPMailer
        try {
            $mail = new PHPMailer\PHPMailer\PHPMailer(true);
            // SMTP configuration from config.php if provided
            if (defined('SMTP_HOST') && SMTP_HOST) {
                $mail->isSMTP();
                $mail->Host = SMTP_HOST;
                $mail->SMTPAuth = true;
                $mail->Username = SMTP_USER;
                $mail->Password = SMTP_PASS;
                $mail->Port = defined('SMTP_PORT') && SMTP_PORT ? SMTP_PORT : 587;
                $mail->SMTPSecure = defined('SMTP_SECURE') ? SMTP_SECURE : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            }

            $mail->setFrom($fromEmail, $fromName);
            // Support multiple recipients comma separated
            $recipients = array_map('trim', explode(',', $to));
            foreach ($recipients as $r) { if ($r) $mail->addAddress($r); }
            if ($replyTo) $mail->addReplyTo($replyTo);

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $htmlBody;

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log('PHPMailer send failed: ' . $e->getMessage());
            // fall through to mail() fallback below
        }
    }

    // Fallback to mail()
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= 'From: ' . $fromName . ' <' . $fromEmail . '>' . "\r\n";
    if ($replyTo) $headers .= 'Reply-To: ' . $replyTo . "\r\n";

    return mail($to, $subject, $htmlBody, $headers);
}

?>
