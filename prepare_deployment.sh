#!/bin/bash

# Stratis IT Management Suite - Deployment Preparation Script
# This script helps prepare files for Hostinger deployment

echo "🚀 Stratis IT Management Suite - Deployment Preparation"
echo "========================================================"
echo ""

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist folder not found!"
    echo "   Please run 'npm run build' first"
    exit 1
fi

echo "✅ dist folder found"

# Create deployment folder
DEPLOY_DIR="hostinger_deploy"
echo "📁 Creating deployment folder: $DEPLOY_DIR"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy frontend files
echo "📦 Copying frontend files..."
cp -r dist/* $DEPLOY_DIR/

# Copy backend API files
echo "📦 Copying backend API files..."
mkdir -p $DEPLOY_DIR/api
cp -r php_backend/api/* $DEPLOY_DIR/api/

# Copy .htaccess
echo "📦 Copying .htaccess..."
cp .htaccess $DEPLOY_DIR/

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p $DEPLOY_DIR/uploads

# Create secrets.php template
echo "📝 Creating secrets.php template..."
cat > secrets.php.template << 'EOF'
<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456789_stratis');  // CHANGE THIS
define('DB_USER', 'u123456789_user');     // CHANGE THIS
define('DB_PASS', 'your_strong_password'); // CHANGE THIS

// API Keys (Optional)
define('GEMINI_API_KEY', 'your_gemini_api_key_here');

// Cron Secret
define('CRON_SECRET', 'generate_a_random_secure_string_here');

// SMTP Configuration (Optional)
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_USER', 'noreply@yourdomain.com');
define('SMTP_PASS', 'your_smtp_password');
define('SMTP_PORT', 587);
define('SMTP_SECURE', 'tls');
define('MAIL_FROM', 'noreply@yourdomain.com');
define('MAIL_FROM_NAME', 'Stratis IT Management');
?>
EOF

echo ""
echo "✅ Deployment files prepared successfully!"
echo ""
echo "📂 Files are ready in: $DEPLOY_DIR/"
echo ""
echo "📋 Next Steps:"
echo "   1. Edit secrets.php.template with your database credentials"
echo "   2. Upload secrets.php to /home/u123456789/ (OUTSIDE public_html)"
echo "   3. Upload contents of $DEPLOY_DIR/ to your public_html folder"
echo "   4. Set uploads/ folder permissions to 755"
echo "   5. Visit your domain and login!"
echo ""
echo "📖 For detailed instructions, see: HOSTINGER_DEPLOYMENT_GUIDE.md"
echo ""
