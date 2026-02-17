# 🚀 Git Auto-Deploy Setup Guide

## 🏆 Recommended: Hostinger Git Integration

This is the **easiest and most reliable** method!

### ✅ Advantages:
- Built into Hostinger (no external services)
- Automatic deployment on every push
- Deploys within 1-5 minutes
- Free (included with hosting)
- Easy to set up (5 minutes)
- Deployment logs in hPanel

---

## 📋 Complete Setup Guide

### Step 1: Prepare Your GitHub Repository

```bash
cd /Users/sanjulathilan/Documents/GitHub/novalink_Project-management_system-

# Check if git is initialized
git status

# If not initialized:
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ready for auto-deploy"
```

### Step 2: Create GitHub Repository

1. Go to **https://github.com**
2. Click **"New repository"**
3. Name it: `novalink-project-management`
4. **Don't** initialize with README (you already have code)
5. Click **"Create repository"**

### Step 3: Push to GitHub

```bash
# Add GitHub as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/novalink-project-management.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Enable Git in Hostinger

1. **Login** to Hostinger hPanel: https://hpanel.hostinger.com
2. Go to **Advanced** → **Git**
3. Click **"Create Repository"**
4. Fill in the form:

   ```
   Repository URL: https://github.com/YOUR_USERNAME/novalink-project-management.git
   Branch: main
   Deployment Path: /public_html
   ```

5. **Enable "Auto-deploy"** ✅
6. Click **"Create"**

### Step 5: Initial Deployment

Hostinger will automatically:
1. Clone your repository
2. Deploy files to `/public_html`
3. Show deployment status

**Wait 2-5 minutes** for the first deployment.

---

## 🎯 Daily Workflow

From now on, your workflow is:

```bash
# 1. Make changes to your code
# Edit files in VS Code...

# 2. Commit changes
git add .
git commit -m "Fixed project creation bug"

# 3. Push to GitHub
git push

# 4. Wait 1-5 minutes
# Hostinger automatically deploys! ✨
```

**That's it!** No manual upload needed!

---

## 📊 How It Works

```
You push to GitHub
       ↓
GitHub receives push
       ↓
Hostinger detects new commit
       ↓
Hostinger pulls latest code
       ↓
Files deployed to /public_html
       ↓
Your site is updated! ✅
```

**Time: 1-5 minutes**

---

## 🔍 Check Deployment Status

1. Go to **Hostinger hPanel**
2. Click **Advanced** → **Git**
3. See deployment history and logs
4. Check if deployment succeeded

---

## ⚙️ Important: Deployment Configuration

### What Gets Deployed:
- ✅ All PHP files in `php_backend/api/`
- ✅ Built frontend files (from `dist/`)
- ✅ `.htaccess` file
- ✅ `uploads/` folder

### What to Exclude:
Add a `.gitignore` file (already created):

```
node_modules/
dist/
.vscode/
secrets.php
*.log
```

### Build Before Deploy:

**Option A: Build Locally**
```bash
npm run build
git add dist/
git commit -m "Updated build"
git push
```

**Option B: Use GitHub Actions** (see below)

---

## 🚀 Advanced: GitHub Actions (Optional)

I've created a GitHub Actions workflow that:
- Builds your frontend automatically
- Deploys to Hostinger via FTP
- Runs on every push

### Setup GitHub Actions:

**1. Add Secrets to GitHub**

1. Go to your GitHub repo
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add these secrets:

   ```
   Name: FTP_USERNAME
   Value: u350252325

   Name: FTP_PASSWORD
   Value: [Your FTP password from Hostinger]
   ```

**2. Push the Workflow**

The workflow file is already created: `.github/workflows/deploy.yml`

```bash
git add .github/workflows/deploy.yml
git commit -m "Added GitHub Actions deployment"
git push
```

**3. Done!**

Now on every push:
1. GitHub Actions builds your frontend
2. Deploys everything to Hostinger
3. You can see progress in the "Actions" tab

---

## 📋 Comparison: Which Method?

### Hostinger Git Integration
- ✅ Easiest setup (5 minutes)
- ✅ Built-in, no external services
- ✅ Free
- ⚠️ You must build frontend locally
- ⚠️ Deploys everything in repo

### GitHub Actions
- ✅ Automatic frontend build
- ✅ More control over deployment
- ✅ Can run tests before deploy
- ⚠️ Slightly more complex setup
- ⚠️ Uses GitHub Actions minutes (free tier: 2000/month)

---

## 🎯 My Recommendation for You

**Use Hostinger Git Integration** because:
1. Simpler setup
2. No external dependencies
3. Built into your hosting
4. Perfect for your use case

**Workflow:**
```bash
# Build frontend
npm run build

# Commit everything
git add .
git commit -m "Updated project creation"

# Push
git push

# Wait 2-5 minutes - done! ✨
```

---

## 🔧 Troubleshooting

### Deployment Failed
**Check:**
1. Repository URL is correct
2. Branch name is `main` (not `master`)
3. Deployment path is `/public_html`
4. Check deployment logs in hPanel

### Files Not Updating
**Solution:**
1. Check deployment logs
2. Verify files are in your Git repo
3. Make sure `.gitignore` isn't excluding them
4. Try manual pull in Hostinger Git panel

### Build Files Missing
**Solution:**
1. Run `npm run build` locally
2. Commit the `dist/` folder
3. Push to GitHub

---

## ✅ Setup Checklist

- [ ] Code pushed to GitHub
- [ ] Hostinger Git integration enabled
- [ ] Auto-deploy enabled
- [ ] Initial deployment successful
- [ ] Test: Make a change and push
- [ ] Verify deployment in hPanel
- [ ] Check live site updated

---

## 🎉 You're Done!

Your workflow is now:

```bash
git add .
git commit -m "Your changes"
git push
```

**Hostinger automatically deploys within 1-5 minutes!** 🚀

No more manual uploads! No more FTP! Just push and relax! ✨
