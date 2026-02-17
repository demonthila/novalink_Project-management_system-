# 🚀 Hostinger Git Setup - Step by Step

## What You're Seeing in Hostinger

You're in: **Hostinger hPanel → Advanced → GIT**

You see two options:
1. **SSH Key** (for private repos)
2. **Create a New Repository** form

---

## 📋 Complete Setup Guide

### Step 1: Push Your Code to GitHub (Do This First)

```bash
cd /Users/sanjulathilan/Documents/GitHub/novalink_Project-management_system-

# Check if you have a GitHub repo already
git remote -v

# If you see a GitHub URL, skip to Step 2
# If not, create a new repo on GitHub first, then:

git init
git add .
git commit -m "Initial commit for auto-deploy"
git remote add origin https://github.com/YOUR_USERNAME/novalink-project.git
git branch -M main
git push -u origin main
```

---

### Step 2: Make Your Repo Public (Easier) OR Add SSH Key (Private)

#### Option A: Public Repository (Recommended - Simpler)

1. Go to your GitHub repo
2. Click **Settings**
3. Scroll to **Danger Zone**
4. Click **Change visibility** → **Make public**

**Then use the public URL in Hostinger:**
```
https://github.com/YOUR_USERNAME/novalink-project.git
```

#### Option B: Private Repository (More Secure)

1. **Copy the SSH key** from Hostinger (the one starting with `ssh-rsa AAAAB3...`)
2. Go to **GitHub** → **Settings** → **SSH and GPG keys**
3. Click **New SSH key**
4. Paste the Hostinger SSH key
5. Save

**Then use the SSH URL in Hostinger:**
```
git@github.com:YOUR_USERNAME/novalink-project.git
```

---

### Step 3: Fill in the Hostinger Form

In the **"Create a New Repository"** section:

#### Repository:
```
For Public Repo:
https://github.com/YOUR_USERNAME/novalink-project.git

For Private Repo (after adding SSH key):
git@github.com:YOUR_USERNAME/novalink-project.git
```

#### Branch:
```
main
```
(Not "master" - GitHub uses "main" now)

#### Directory (optional):
```
Leave this BLANK
```
(This will deploy to `/public_html` directly)

---

### Step 4: Click "Create"

Hostinger will:
1. Connect to your GitHub repo
2. Clone the repository
3. Deploy files to `/public_html`
4. Set up auto-deploy

**Wait 2-5 minutes** for initial deployment.

---

### Step 5: Verify Deployment

1. Stay in **Hostinger hPanel → Advanced → GIT**
2. You'll see your repository listed
3. Check deployment status
4. Look for "Deployment successful" ✅

---

## ⚠️ Important: Prepare Your Repository First

Before deploying, make sure your repo has:

### 1. Build Your Frontend
```bash
npm run build
```

### 2. Commit the Build
```bash
git add dist/
git commit -m "Added production build"
git push
```

### 3. Check Your Structure

Your repo should have:
```
your-repo/
├── dist/              ← Built frontend
│   ├── index.html
│   └── assets/
├── php_backend/
│   └── api/          ← PHP files
├── .htaccess         ← URL rewriting
└── secrets.php       ← DON'T commit this!
```

### 4. Add .gitignore

Make sure these are NOT in your repo:
```
node_modules/
.vscode/sftp.json
secrets.php
*.log
```

---

## 🔄 After Setup: Your Workflow

### Daily Development:

```bash
# 1. Make changes
# Edit your code...

# 2. Build frontend
npm run build

# 3. Commit and push
git add .
git commit -m "Fixed project creation"
git push

# 4. Wait 2-5 minutes
# Hostinger auto-deploys! ✨
```

---

## 🔧 Important: secrets.php Setup

**DON'T commit secrets.php to Git!**

Instead:

1. **Add to .gitignore:**
```
secrets.php
secrets.php.production
```

2. **Upload manually via FTP** (one time):
   - Upload `secrets.php.production` to `/home/u350252325/`
   - Rename it to `secrets.php`

3. **Or create directly in Hostinger File Manager**

---

## 📊 Deployment Status

After creating the repository, you'll see:

```
Repository: https://github.com/YOUR_USERNAME/novalink-project.git
Branch: main
Path: /public_html
Status: ✅ Deployed
Last deployment: 2 minutes ago
```

You can:
- **Pull latest** - Manually trigger deployment
- **View logs** - See deployment history
- **Remove** - Delete the integration

---

## 🆘 Troubleshooting

### Error: "Directory not empty"
**Solution:** 
- Clear `/public_html` first, OR
- Use a subdirectory like `/public_html/app`

### Error: "Failed to clone"
**Solution:**
- Check repository URL is correct
- For private repos, verify SSH key is added to GitHub
- Make sure branch name is `main` (not `master`)

### Files not updating after push
**Solution:**
1. Check Git panel in Hostinger
2. Click "Pull latest" manually
3. Check deployment logs for errors

### secrets.php missing
**Solution:**
- Upload manually via FTP to `/home/u350252325/secrets.php`
- It should be OUTSIDE public_html

---

## ✅ Quick Setup Checklist

- [ ] Code is on GitHub
- [ ] Repo is public OR SSH key added
- [ ] Frontend is built (`npm run build`)
- [ ] Build files committed to Git
- [ ] `.gitignore` excludes secrets.php
- [ ] Fill Hostinger form:
  - [ ] Repository URL
  - [ ] Branch: `main`
  - [ ] Directory: blank
- [ ] Click "Create"
- [ ] Wait for deployment
- [ ] Upload secrets.php manually
- [ ] Test the site!

---

## 🎯 Exact Form Values

Copy these into the Hostinger form:

**Repository:**
```
https://github.com/YOUR_USERNAME/novalink-project.git
```
(Replace YOUR_USERNAME with your actual GitHub username)

**Branch:**
```
main
```

**Directory:**
```
(leave blank)
```

Then click **"Create"**

---

## 🎉 You're Done!

After setup, every time you:
```bash
git push
```

Hostinger automatically deploys in 2-5 minutes! 🚀

No more manual uploads!
