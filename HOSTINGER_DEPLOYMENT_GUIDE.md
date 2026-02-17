# Hostinger Deployment Guide - Stratis IT Management Suite

## 📋 Pre-Deployment Checklist

### Requirements
- ✅ Hostinger hosting account with PHP support
- ✅ PHP 8.1+ (8.2 or 8.3 recommended)
- ✅ MySQL/MariaDB database
- ✅ SSH access (optional but recommended)
- ✅ FTP/SFTP client (FileZilla, Cyberduck, or Hostinger File Manager)

---

## 🚀 Step-by-Step Deployment

### Step 1: Build the Frontend

On your local machine, run:

```bash
npm run build
```

This creates a `dist` folder with optimized production files.

---

### Step 2: Prepare Your Database

1. **Login to Hostinger hPanel**
2. **Navigate to**: Databases → MySQL Databases
3. **Create a new database**:
   - Database name: `u123456789_stratis` (or your preferred name)
   - Create a database user with a strong password
   - Assign the user to the database with ALL PRIVILEGES

4. **Note down**:
   - Database name
   - Database username
   - Database password
   - Database host (usually `localhost`)

---

### Step 3: Create secrets.php File

**IMPORTANT**: For security, place this file **OUTSIDE** your public_html directory.

1. Create a file at `/home/u123456789/secrets.php` (one level above public_html)
2. Add the following content:

```php
<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456789_stratis');  // Your database name
define('DB_USER', 'u123456789_user');     // Your database user
define('DB_PASS', 'your_strong_password'); // Your database password

// API Keys (Optional - for AI features)
define('GEMINI_API_KEY', 'your_gemini_api_key_here');

// Cron Secret (for scheduled tasks)
define('CRON_SECRET', 'generate_a_random_secure_string_here');

// SMTP Configuration (Optional - for email notifications)
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_USER', 'noreply@yourdomain.com');
define('SMTP_PASS', 'your_smtp_password');
define('SMTP_PORT', 587);
define('SMTP_SECURE', 'tls');
define('MAIL_FROM', 'noreply@yourdomain.com');
define('MAIL_FROM_NAME', 'Stratis IT Management');
?>
```

---

### Step 4: Upload Files to Hostinger

#### Option A: Using File Manager (Easier)

1. **Login to Hostinger hPanel**
2. **Navigate to**: Files → File Manager
3. **Go to**: `public_html` directory
4. **Upload the following**:

```
public_html/
├── index.html (from dist folder)
├── assets/ (entire folder from dist)
├── api/ (copy entire php_backend/api folder here)
├── .htaccess (create this - see below)
└── uploads/ (create this folder, set permissions to 755)
```

#### Option B: Using FTP/SFTP (Recommended)

1. **Connect via FTP**:
   - Host: ftp.yourdomain.com
   - Username: Your Hostinger username
   - Password: Your Hostinger password
   - Port: 21 (FTP) or 22 (SFTP)

2. **Upload structure**:
   - Upload `dist/index.html` → `public_html/index.html`
   - Upload `dist/assets/` → `public_html/assets/`
   - Upload `php_backend/api/` → `public_html/api/`

---

### Step 5: Create .htaccess File

Create a file named `.htaccess` in your `public_html` directory:

```apache
# Enable Rewrite Engine
RewriteEngine On

# Force HTTPS (Recommended for production)
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# API requests go to /api folder
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ /api/$1 [L]

# All other requests go to index.html (SPA routing)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule ^.*$ /index.html [L]

# Security Headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Prevent directory browsing
Options -Indexes

# Protect sensitive files
<FilesMatch "^(secrets\.php|\.env|\.git)">
    Order allow,deny
    Deny from all
</FilesMatch>
```

---

### Step 6: Set Up Database Tables

The application will **automatically create** all necessary tables on first run. However, you can also manually run the SQL:

1. **Navigate to**: hPanel → Databases → phpMyAdmin
2. **Select your database**
3. **Run the SQL** from `database_setup_stratis.sql` (optional, as auto-creation is enabled)

---

### Step 7: Create Uploads Directory

```bash
# Via SSH (if you have access)
cd /home/u123456789/public_html
mkdir uploads
chmod 755 uploads
```

Or via File Manager:
1. Create folder named `uploads` in `public_html`
2. Set permissions to `755`

---

### Step 8: Configure PHP Settings (Optional)

In hPanel → Advanced → PHP Configuration, ensure:

```ini
upload_max_filesize = 10M
post_max_size = 10M
max_execution_time = 300
memory_limit = 256M
session.cookie_httponly = On
session.cookie_secure = On
```

---

### Step 9: Test Your Deployment

1. **Visit your domain**: `https://yourdomain.com`
2. **You should see the login page**
3. **Login with default credentials**:
   - Username: `sanjulathilan12321@gmail.com`
   - Password: `thilan12321`
   
   OR
   
   - Username: `admin`
   - Password: `admin123`

4. **Test the health endpoint**: `https://yourdomain.com/api/health.php`
   - Should return JSON with `{"ok": true, ...}`

---

## 🔒 Post-Deployment Security

### 1. Change Default Passwords
Immediately change the default admin passwords:
1. Login as Superadmin
2. Go to Settings → User Access Management
3. Edit each user and set a strong password

### 2. Enable HTTPS
- Hostinger provides free SSL certificates
- Go to hPanel → Security → SSL
- Enable SSL for your domain

### 3. Regular Backups
- Enable automatic backups in hPanel
- Or set up a cron job to backup the database weekly

---

## 📁 Final Directory Structure on Hostinger

```
/home/u123456789/
├── secrets.php (OUTSIDE public_html - SECURE)
└── public_html/
    ├── index.html
    ├── .htaccess
    ├── assets/
    │   ├── index-[hash].js
    │   ├── index-[hash].css
    │   └── ...
    ├── api/
    │   ├── config.php
    │   ├── auth.php
    │   ├── projects.php
    │   ├── clients.php
    │   ├── developers.php
    │   ├── users.php
    │   ├── dashboard.php
    │   ├── payments.php
    │   ├── health.php
    │   └── ... (all other PHP files)
    └── uploads/
        └── (project logos will be stored here)
```

---

## 🐛 Troubleshooting

### Issue: "Cannot reach API" error
**Solution**: 
- Check that `/api/` folder exists in `public_html`
- Verify `.htaccess` is properly configured
- Check PHP error logs in hPanel

### Issue: Database connection failed
**Solution**:
- Verify `secrets.php` has correct database credentials
- Ensure `secrets.php` is at `/home/u123456789/secrets.php`
- Check database user has proper permissions

### Issue: Login not working
**Solution**:
- Check browser console for errors
- Verify `api/auth.php` is accessible
- Clear browser cookies and try again
- Check that sessions are enabled in PHP

### Issue: 404 errors on page refresh
**Solution**:
- Ensure `.htaccess` file exists and is properly configured
- Check that `mod_rewrite` is enabled (it should be by default on Hostinger)

---

## 📞 Support

For issues specific to:
- **Hostinger hosting**: Contact Hostinger support
- **Application bugs**: Check the application logs in `api/` folder

---

## ✅ Deployment Checklist

- [ ] Built frontend with `npm run build`
- [ ] Created database in Hostinger
- [ ] Created `secrets.php` file outside public_html
- [ ] Uploaded all files to `public_html`
- [ ] Created `.htaccess` file
- [ ] Created `uploads` folder with proper permissions
- [ ] Tested login functionality
- [ ] Changed default passwords
- [ ] Enabled HTTPS/SSL
- [ ] Verified health endpoint works
- [ ] Set up backups

---

**🎉 Congratulations! Your Stratis IT Management Suite is now live!**
