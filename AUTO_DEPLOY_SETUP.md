# 🚀 Auto-Deploy to Hostinger - Setup Guide

## Option 1: Git Deployment (Recommended - Most Professional)

### Setup Steps:

#### 1. Initialize Git Repository (if not already done)
```bash
cd /Users/sanjulathilan/Documents/GitHub/novalink_Project-management_system-
git init
git add .
git commit -m "Initial commit"
```

#### 2. Push to GitHub
```bash
# Create a new repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

#### 3. Enable Git in Hostinger
1. Login to **Hostinger hPanel**
2. Go to **Advanced** → **Git**
3. Click **"Create Repository"**
4. Enter your GitHub repository URL
5. Set branch to: `main`
6. Set deployment path: `/public_html`
7. Click **"Create"**

#### 4. Auto-Deploy on Every Commit
Now whenever you:
```bash
git add .
git commit -m "Fixed project creation"
git push
```

Hostinger will **automatically pull and deploy** your changes!

---

## Option 2: FTP Auto-Sync (Easier Setup)

### Using VS Code Extension

#### 1. Install Extension
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for: **"SFTP"** by Natizyskunk
4. Click **Install**

#### 2. Configure SFTP
Create a file: `.vscode/sftp.json`

```json
{
    "name": "Hostinger Production",
    "host": "ftp.novalinkinnovations.com",
    "protocol": "ftp",
    "port": 21,
    "username": "u350252325",
    "password": "YOUR_FTP_PASSWORD",
    "remotePath": "/public_html",
    "uploadOnSave": true,
    "ignore": [
        ".vscode",
        ".git",
        "node_modules",
        "dist",
        "*.md",
        "package.json",
        "package-lock.json",
        "tsconfig.json",
        "vite.config.ts",
        "index.tsx",
        "index.css",
        "App.tsx",
        "components",
        "services",
        "types.ts",
        "constants.tsx"
    ],
    "watcher": {
        "files": "php_backend/api/**/*.php",
        "autoUpload": true,
        "autoDelete": false
    }
}
```

#### 3. Usage
Now every time you **save a PHP file** in `php_backend/api/`, it will **automatically upload** to Hostinger!

**Commands:**
- `Ctrl+Shift+P` → "SFTP: Upload File" - Upload current file
- `Ctrl+Shift+P` → "SFTP: Upload Folder" - Upload entire folder
- `Ctrl+Shift+P` → "SFTP: Sync Local -> Remote" - Sync everything

---

## Option 3: Deployment Script (Quick & Simple)

### Create Auto-Deploy Script

I'll create a script that syncs only the changed files:

```bash
#!/bin/bash
# deploy.sh - Auto-deploy to Hostinger via FTP

echo "🚀 Deploying to Hostinger..."

# FTP credentials
FTP_HOST="ftp.novalinkinnovations.com"
FTP_USER="u350252325"
FTP_PASS="YOUR_FTP_PASSWORD"
REMOTE_DIR="/public_html"

# Upload only API files
echo "📤 Uploading API files..."
lftp -c "
open -u $FTP_USER,$FTP_PASS $FTP_HOST
mirror --reverse --verbose --delete \
  --exclude .git/ \
  --exclude node_modules/ \
  --exclude dist/ \
  php_backend/api/ $REMOTE_DIR/api/
bye
"

echo "✅ Deployment complete!"
```

**Usage:**
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Option 4: Watch & Auto-Deploy Script

### Create a file watcher that auto-deploys on changes:

```bash
#!/bin/bash
# watch-deploy.sh - Watch for changes and auto-deploy

echo "👀 Watching for changes in php_backend/api/..."
echo "Press Ctrl+C to stop"

# Install fswatch if not installed
# brew install fswatch (macOS)

fswatch -o php_backend/api/ | while read f; do
  echo "🔄 Change detected, deploying..."
  ./deploy.sh
done
```

**Usage:**
```bash
chmod +x watch-deploy.sh
./watch-deploy.sh
```

Now it will **automatically deploy** whenever you save a file!

---

## 🎯 My Recommendation

**For You:** I recommend **Option 2 (VS Code SFTP Extension)**

**Why?**
- ✅ Easy to set up (5 minutes)
- ✅ Auto-uploads on save
- ✅ Works with your current workflow
- ✅ No command line needed
- ✅ Visual feedback in VS Code
- ✅ Can exclude frontend files (only sync PHP)

**Setup in 3 Steps:**
1. Install SFTP extension in VS Code
2. Create `.vscode/sftp.json` with your FTP credentials
3. Save any PHP file → it auto-uploads!

---

## 🔒 Security Note

**Never commit FTP passwords to Git!**

Add to `.gitignore`:
```
.vscode/sftp.json
deploy.sh
secrets.php
```

---

## 📋 Quick Setup Checklist

- [ ] Choose deployment method
- [ ] Get FTP credentials from Hostinger
- [ ] Install necessary tools (SFTP extension or lftp)
- [ ] Configure auto-deploy
- [ ] Test by editing a file
- [ ] Verify it uploads automatically
- [ ] Add credentials to .gitignore

---

## 🆘 Get Your FTP Credentials

1. Login to **Hostinger hPanel**
2. Go to **Files** → **FTP Accounts**
3. You'll see:
   - **Host**: ftp.yourdomain.com
   - **Username**: u350252325
   - **Password**: (click "Show" or reset)
   - **Port**: 21

---

Would you like me to set up one of these options for you?
