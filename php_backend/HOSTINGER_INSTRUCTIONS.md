# Hostinger Deployment & Cron Instructions

## 1. Hosting Environment Requirements

Ensure your Hostinger environment meets these specifications before deployment:

### PHP Configuration
- **Version**: PHP 8.1 or higher (8.2 / 8.3 recommended)
- **Required Extensions**:
  - `pdo` & `pdo_mysql` (Core database connectivity)
  - `mysqli` (Legacy support/Adminer)
  - `mbstring` (International text handling)
  - `openssl` & `curl` (API communication & Security)
  - `json` (REST API data parsing)
  - `fileinfo` (Handling logo/invoice uploads)
  - `gd` (Required for generating PDFs with images/logos)

### Database Configuration
- **Server**: MySQL 5.7+ or MariaDB 10+
- **Steps**:
  1. Create a new MySQL/MariaDB database in hPanel.
  2. Create a database user and assign them to the database with full permissions.
  3. **Security Step**: Place your production `secrets.php` file **one level above** your `public_html` directory (e.g., `/home/u12345678/secrets.php`). The system is pre-configured to look for it there securely.

---

## SMTP / PHPMailer setup

1. Install Composer and PHPMailer in the `php_backend` folder on your Hostinger account (SSH may be required):

```bash
cd /home/your_user/path/to/php_backend
composer require phpmailer/phpmailer
```

2. Add SMTP credentials to `php_backend/api/config.php` or `php_backend/api/secrets.php` (create if missing):

```php
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_USER', 'your_smtp_user');
define('SMTP_PASS', 'your_smtp_password');
define('SMTP_PORT', 587);
define('SMTP_SECURE', 'tls');
define('MAIL_FROM', 'noreply@yourdomain.com');
define('MAIL_FROM_NAME', 'Stratis System');
define('CRON_SECRET', 'a_long_random_secret');
```

3. The application will automatically use PHPMailer if `vendor/autoload.php` exists; otherwise it falls back to PHP `mail()`.

## Cron job examples (Hostinger hPanel)

Prefer scheduling server-side tasks for reminders and maintenance. Example: run a custom PHP script (placed in `/home/your_user/public_html/api/`) via CLI cron. For example, to run a weekly profit recalculation:

```
/usr/bin/php /home/your_user/public_html/api/recalculate_profits.php
```

Also add a cron to trigger profit recalculation weekly (optional):

```
curl -X POST "https://yourdomain.com/api/recalculate_profits.php" >/dev/null 2>&1
```

## Health check

Use the endpoint:

```
https://yourdomain.com/api/health.php
```

It returns JSON with `ok` and `details` containing PHP version, DB status, and tmp write test.

## Testing email delivery

Reminder UI/button has been removed from the Settings page. To test email delivery manually, create a small PHP test script that calls the `mail_helper.php` functions or invoke your reminder script directly from the server with the appropriate secret. Example (from server):

```
curl "https://yourdomain.com/api/your_reminder_script.php?secret=your_cron_secret"
```

If PHPMailer is not yet installed, the system falls back to `mail()`; if delivery fails, install PHPMailer and set SMTP credentials as described above.
