# ⚡ Quick Start: Auto-Deploy Setup

## 🎯 Easiest Method: VS Code SFTP Extension

### Step 1: Install Extension (2 minutes)

1. Open **VS Code**
2. Press `Ctrl+Shift+X` (Extensions)
3. Search: **"SFTP"** by Natizyskunk
4. Click **Install**

### Step 2: Add Your FTP Password (1 minute)

1. Open file: `.vscode/sftp.json` (I already created it!)
2. Find line: `"password": "YOUR_FTP_PASSWORD_HERE"`
3. Replace with your actual FTP password
4. Save the file

**Get your FTP password:**
- Login to Hostinger hPanel
- Go to: Files → FTP Accounts
- Click "Show" next to password

### Step 3: Test It! (30 seconds)

1. Open any PHP file in `php_backend/api/`
2. Make a small change
3. Press `Ctrl+S` (Save)
4. Watch the bottom of VS Code - it will show "Uploading..."
5. Done! Your file is now on Hostinger!

---

## 🚀 Alternative: Quick Deploy Script

If you prefer command line:

```bash
./quick-deploy.sh
```

This will upload all API files at once.

---

## ✅ What's Already Set Up

I've created these files for you:

1. **`.vscode/sftp.json`** - Auto-upload configuration
   - ✅ Configured for your Hostinger account
   - ✅ Only uploads PHP files
   - ✅ Ignores frontend files
   - ⚠️ Just add your FTP password!

2. **`quick-deploy.sh`** - Manual deploy script
   - ✅ Uploads all API files at once
   - ✅ Shows progress
   - ✅ Ready to use

3. **`.gitignore`** - Protects your credentials
   - ✅ Prevents committing passwords
   - ✅ Keeps secrets safe

---

## 🎬 How It Works

### With SFTP Extension:

```
You edit: projects.php
↓
Press Save (Ctrl+S)
↓
VS Code automatically uploads to Hostinger
↓
File is live on your server!
```

**No manual upload needed!** 🎉

---

## 📋 Configuration Details

### What Gets Auto-Uploaded:
- ✅ All files in `php_backend/api/`
- ✅ Only when you save them

### What Gets Ignored:
- ❌ Frontend files (React components)
- ❌ node_modules
- ❌ Documentation (.md files)
- ❌ Configuration files

---

## 🔧 VS Code SFTP Commands

Press `Ctrl+Shift+P` and type:

- **"SFTP: Upload File"** - Upload current file
- **"SFTP: Upload Folder"** - Upload entire folder
- **"SFTP: Download File"** - Download from server
- **"SFTP: Sync Local -> Remote"** - Sync everything
- **"SFTP: Diff with Remote"** - Compare local vs server

---

## 🆘 Troubleshooting

### "Upload failed" error
**Solution:** Check your FTP password in `.vscode/sftp.json`

### "Connection refused"
**Solution:** 
1. Verify FTP host: `ftp.novalinkinnovations.com`
2. Check port is `21`
3. Ensure username is `u350252325`

### "Permission denied"
**Solution:** Check that the remote path `/public_html` exists

### Files not uploading automatically
**Solution:**
1. Check "uploadOnSave" is `true` in sftp.json
2. Make sure you're editing files in `php_backend/api/`
3. Restart VS Code

---

## 🎯 Recommended Workflow

### For Quick Fixes:
1. Edit file in VS Code
2. Save (Ctrl+S)
3. Auto-uploads!
4. Test on live site

### For Major Updates:
1. Make all your changes
2. Test locally first
3. Run: `./quick-deploy.sh`
4. Uploads everything at once

---

## 🔒 Security Reminder

**Never commit `.vscode/sftp.json` with your password!**

It's already in `.gitignore`, so you're safe. ✅

---

## ✨ You're All Set!

**Just add your FTP password to `.vscode/sftp.json` and you're ready to go!**

Every time you save a PHP file, it will automatically upload to Hostinger. 🚀

---

## 📖 Full Documentation

See `AUTO_DEPLOY_SETUP.md` for:
- Git deployment option
- Watch script for continuous deployment
- Advanced configuration options
