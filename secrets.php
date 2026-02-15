<?php
// Local Development Secrets
// MODIFY THESE TO MATCH YOUR LOCAL DATABASE CREDENTIALS

define('DB_HOST', 'localhost');
define('DB_NAME', 'novalink'); // Please create a database with this name
define('DB_USER', 'root');     // Default XAMPP/MAMP user
define('DB_PASS', 'root');     // Default XAMPP password (empty) or 'root' for MAMP

// Email Configuration
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_USER', 'novalinkhelp@gmail.com');
define('SMTP_PASS', 'replace_with_app_password');
define('SMTP_PORT', 587);

// Security
define('CRON_SECRET', 'stratis_secure_cron_token_123');
