# 🚀 Quick Deployment Reference

## Files Ready for Upload

All deployment files are in the `hostinger_deploy/` folder.

---

## Upload Instructions

### 1️⃣ Upload to Hostinger

**Via File Manager or FTP, upload these files:**

```
hostinger_deploy/  →  public_html/
├── index.html     →  public_html/index.html
├── assets/        →  public_html/assets/
├── api/           →  public_html/api/
├── .htaccess      →  public_html/.htaccess
└── uploads/       →  public_html/uploads/
```

### 2️⃣ Configure Database

1. **Create database** in Hostinger hPanel
2. **Edit** `secrets.php.template` with your credentials:
   ```php
   define('DB_NAME', 'u123456789_stratis');
   define('DB_USER', 'u123456789_user');
   define('DB_PASS', 'your_password');
   ```
3. **Rename** to `secrets.php`
4. **Upload** to `/home/u123456789/secrets.php` (NOT in public_html!)

### 3️⃣ Set Permissions

```
uploads/ → 755
```

### 4️⃣ Test

Visit: `https://yourdomain.com`

Login:
- Username: `sanjulathilan12321@gmail.com`
- Password: `thilan12321`

---

## Important URLs

- **Application**: `https://yourdomain.com`
- **Health Check**: `https://yourdomain.com/api/health.php`
- **phpMyAdmin**: Via Hostinger hPanel

---

## Default Credentials (CHANGE IMMEDIATELY!)

**Superadmin:**
- Username: `sanjulathilan12321@gmail.com`
- Password: `thilan12321`

**Admin:**
- Username: `admin`
- Password: `admin123`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't login | Check `secrets.php` location and credentials |
| 404 errors | Verify `.htaccess` is uploaded |
| API errors | Check `api/` folder exists in public_html |
| Database error | Verify database credentials in `secrets.php` |

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable HTTPS/SSL
- [ ] Verify `secrets.php` is OUTSIDE public_html
- [ ] Test login and basic functionality
- [ ] Set up regular backups

---

**📖 Full Guide**: See `HOSTINGER_DEPLOYMENT_GUIDE.md`
