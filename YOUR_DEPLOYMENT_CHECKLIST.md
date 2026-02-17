# 🎯 Your Personalized Deployment Checklist

## ✅ Pre-Deployment Status

### Your Hostinger Configuration:
- **Domain**: novalinkinnovations.com
- **Database**: u350252325_Nova_IT
- **Database User**: u350252325_Nova_Projects
- **Email**: info@novalinkinnovations.com
- **SMTP**: smtp.hostinger.com

---

## 📋 Deployment Steps

### ✅ Step 1: Files Already Prepared
- [x] Frontend built (`dist/` folder)
- [x] Backend API files ready
- [x] `.htaccess` configured
- [x] `secrets.php.production` created with YOUR credentials

---

### 🔄 Step 2: Upload to Hostinger

#### A. Upload secrets.php
1. **Rename** `secrets.php.production` to `secrets.php`
2. **Upload** to: `/home/u350252325/secrets.php`
   - ⚠️ **IMPORTANT**: This is OUTSIDE public_html!
   - Path should be: `/home/u350252325/secrets.php`

#### B. Upload Application Files
Upload everything from `hostinger_deploy/` to `public_html/`:

```
FTP/File Manager Upload:
hostinger_deploy/index.html    → public_html/index.html
hostinger_deploy/assets/       → public_html/assets/
hostinger_deploy/api/          → public_html/api/
hostinger_deploy/.htaccess     → public_html/.htaccess
hostinger_deploy/uploads/      → public_html/uploads/
```

**Your public_html structure should be:**
```
public_html/
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
│   └── ... (all PHP files)
└── uploads/
```

---

### 🔐 Step 3: Set Permissions

Via File Manager or SSH:
```bash
chmod 755 public_html/uploads
```

---

### 🧪 Step 4: Test Your Deployment

#### A. Health Check
Visit: `https://novaprojects.novalinkinnovations.com/api/health.php`

**Expected Response:**
```json
{
  "ok": true,
  "details": {
    "php_version": "8.x.x",
    "database": "ok",
    "tmp_write": "ok"
  }
}
```

#### B. Login Test
Visit: `https://novaprojects.novalinkinnovations.com`

**Login with:**
- Username: `sanjulathilan12321@gmail.com`
- Password: `thilan12321`

OR

- Username: `admin`
- Password: `admin123`

---

### 🔒 Step 5: Post-Deployment Security

#### A. Change Default Passwords (CRITICAL!)
1. Login as Superadmin
2. Go to **Settings** → **User Access Management**
3. Edit both users and set strong passwords
4. Save changes

#### B. Verify SSL/HTTPS
1. Go to Hostinger hPanel → **Security** → **SSL**
2. Ensure SSL is enabled for your domain
3. Verify the site loads with `https://`

#### C. Test All Features
- [ ] Create a test project
- [ ] Add a test client
- [ ] Add a test developer
- [ ] Generate an invoice
- [ ] Test payment tracking
- [ ] Verify dashboard analytics

---

## 🚨 Troubleshooting Guide

### Issue: "Database connection failed"

**Check:**
1. Is `secrets.php` at `/home/u350252325/secrets.php`?
2. Are the database credentials correct?
   - DB Name: `u350252325_Nova_IT`
   - DB User: `u350252325_Nova_Projects`
   - DB Pass: `Projects@12321`

**Fix:**
```bash
# Via SSH, verify file location:
ls -la /home/u350252325/secrets.php

# Should show the file exists
```

---

### Issue: "Cannot reach API" or 404 errors

**Check:**
1. Is `.htaccess` in `public_html/`?
2. Is `api/` folder in `public_html/`?

**Fix:**
- Re-upload `.htaccess` from `hostinger_deploy/`
- Verify `api/` folder exists in `public_html/`

---

### Issue: "Session expired" immediately after login

**Check:**
1. Is HTTPS enabled?
2. Are cookies being blocked?

**Fix:**
1. Enable SSL in Hostinger hPanel
2. Clear browser cookies and cache
3. Try in incognito/private mode

---

### Issue: Email notifications not working

**Check:**
1. SMTP credentials in `secrets.php`
2. Email sending limits

**Fix:**
- Verify SMTP settings:
  - Host: `smtp.hostinger.com`
  - User: `info@novalinkinnovations.com`
  - Port: `587`
- Check Hostinger email sending limits

---

## 📊 Deployment Verification Checklist

After deployment, verify:

- [ ] Health endpoint returns `{"ok": true}`
- [ ] Login page loads correctly
- [ ] Can login with default credentials
- [ ] Dashboard displays without errors
- [ ] Can create/edit/delete projects
- [ ] Can create/edit/delete clients
- [ ] Can create/edit/delete developers
- [ ] Payment tracking works
- [ ] Invoice generation works
- [ ] Settings page accessible
- [ ] User management works (Superadmin only)
- [ ] Password hashes visible (Superadmin only)
- [ ] Changed all default passwords
- [ ] HTTPS/SSL is active
- [ ] No console errors in browser

---

## 🎯 Quick Commands

### Via SSH (if you have access):

```bash
# Navigate to your directory
cd /home/u350252325/public_html

# Check if files exist
ls -la

# Set uploads permissions
chmod 755 uploads

# View PHP errors (if any)
tail -f /home/u350252325/logs/error_log
```

---

## 📞 Support Resources

### Hostinger Support
- **hPanel**: https://hpanel.hostinger.com
- **Support**: Live chat available 24/7
- **Knowledge Base**: https://support.hostinger.com

### Application URLs
- **Main App**: https://novaprojects.novalinkinnovations.com
- **Health Check**: https://novaprojects.novalinkinnovations.com/api/health.php
- **phpMyAdmin**: Via Hostinger hPanel → Databases

---

## ✨ You're Ready to Deploy!

**Your deployment package is customized and ready for:**
- Database: `u350252325_Nova_IT`
- Domain: `novaprojects.novalinkinnovations.com`
- Email: `info@novalinkinnovations.com`

**Just follow the steps above and you'll be live! 🚀**

---

## 🔄 Quick Deployment Summary

1. **Rename** `secrets.php.production` → `secrets.php`
2. **Upload** `secrets.php` to `/home/u350252325/` (outside public_html)
3. **Upload** `hostinger_deploy/` contents to `public_html/`
4. **Set** uploads folder to 755
5. **Test** health endpoint
6. **Login** and change passwords
7. **Done!** ✅
