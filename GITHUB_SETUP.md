# 🚀 GitHub Setup Guide

## ✅ Git Repository Initialized!

I've already:
- ✅ Initialized git repository
- ✅ Created `.gitignore` file
- ✅ Created initial commit with all your changes

---

## 🔐 Set Up GitHub Authentication

You have **2 options** for authentication:

### Option 1: SSH Keys (Recommended)

**Step 1: Check if you have SSH keys**
```bash
ls -la ~/.ssh
```

**Step 2: If no keys exist, generate new SSH key**
```bash
ssh-keygen -t ed25519 -C "theophilusaidoo821@gmail.com"
```
Press Enter to accept default location, then set a passphrase (optional).

**Step 3: Add SSH key to ssh-agent**
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

**Step 4: Copy your public key**
```bash
cat ~/.ssh/id_ed25519.pub
```
Copy the entire output.

**Step 5: Add to GitHub**
1. Go to: https://github.com/settings/keys
2. Click "New SSH key"
3. Paste your public key
4. Click "Add SSH key"

---

### Option 2: Personal Access Token (PAT)

**Step 1: Create Personal Access Token**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it: "StockMart Project"
4. Select scopes: `repo` (full control)
5. Click "Generate token"
6. **COPY THE TOKEN** (you won't see it again!)

**Step 2: Use token when pushing**
When you push, use the token as password:
```bash
git push
# Username: TheophilusAidoo
# Password: [paste your token here]
```

---

## 📦 Add GitHub Remote

**Step 1: Create Repository on GitHub**
1. Go to: https://github.com/new
2. Repository name: `stockmart` (or your preferred name)
3. Choose: Private or Public
4. **DO NOT** initialize with README
5. Click "Create repository"

**Step 2: Add Remote**

**If using SSH:**
```bash
cd "/Users/alphamac/Downloads/Angelone 2"
git remote add origin git@github.com:TheophilusAidoo/stockmart.git
```

**If using HTTPS:**
```bash
cd "/Users/alphamac/Downloads/Angelone 2"
git remote add origin https://github.com/TheophilusAidoo/stockmart.git
```

**Step 3: Verify remote**
```bash
git remote -v
```

---

## 🚀 Push to GitHub

**Push your code:**
```bash
git push -u origin main
```

**If branch is named `master` instead:**
```bash
git branch -M main
git push -u origin main
```

---

## ✅ After Setup, I Can Help With:

Once authentication is set up, I can:
- ✅ Commit changes
- ✅ Push to GitHub
- ✅ Create branches
- ✅ Manage git history

**Just tell me what changes you want to commit!**

---

## 🔧 Quick Commands Reference

```bash
# Check status
git status

# Add files
git add .

# Commit
git commit -m "Your message"

# Push
git push

# Pull latest
git pull

# Check remote
git remote -v
```

---

**Follow the steps above to set up authentication, then I can help you commit and push!** 🎯
