# Fix Application Root Error

## 🚨 CRITICAL FIX

### Problem
The "Application root" field contains: `public_html/frontend/server.js` ❌

This is WRONG because:
- Application root should be a **directory**, not a file
- `server.js` is a file, not a directory
- cPanel is trying to move the directory into itself, causing the error

### Solution

**Change "Application root" from:**
```
public_html/frontend/server.js
```

**To:**
```
public_html/frontend
```

**Keep "Application startup file" as:**
```
server.js
```

---

## Step-by-Step Fix

1. **In cPanel Node.js Selector:**
   - Find "Application root" field
   - Delete everything after `frontend`
   - It should be: `public_html/frontend` (no `/server.js`)

2. **Verify "Application startup file" field:**
   - Should be: `server.js` ✅ (this is correct)

3. **Click "SAVE" button** (top right)

---

## After Fixing Application Root

You still need to install dependencies because you're getting `sh: next: command not found`.

### Option 1: Via Terminal (Recommended)

1. **Access Terminal in cPanel:**
   - Go to cPanel → Terminal

2. **Run these commands:**
   ```bash
   cd ~/public_html/frontend
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   npm run build
   ```

3. **Go back to Node.js Selector:**
   - Click "Run NPM Install" (optional, but won't hurt)
   - Click "RESTART" button

### Option 2: Via cPanel (If Terminal Not Available)

The "Run NPM Install" button in cPanel might not work with `--legacy-peer-deps` flag.

**Best solution:** Use Terminal (Option 1) or contact your host.

---

## Current Status Check

✅ Node.js version: 22.18.0 (correct!)
✅ Application mode: Production (correct!)
✅ Application startup file: server.js (correct!)
❌ Application root: `public_html/frontend/server.js` (WRONG - fix this!)
❌ Dependencies: Not installed (need to run npm install)

---

## Complete Fix Checklist

- [ ] Fix Application root: `public_html/frontend/server.js` → `public_html/frontend`
- [ ] Click "SAVE"
- [ ] Access Terminal
- [ ] Run: `cd ~/public_html/frontend`
- [ ] Run: `rm -rf node_modules package-lock.json`
- [ ] Run: `npm install --legacy-peer-deps`
- [ ] Run: `npm run build`
- [ ] Go back to Node.js Selector
- [ ] Click "RESTART"
- [ ] Check logs - should see: `> Ready on http://0.0.0.0:3000`

---

## Why This Error Happened

The error message shows:
```
Cannot move a directory '/home2/stockmar/nodevenv/public_html/frontend/' 
into itself '/home2/stockmar/nodevenv/public_html/frontend/server.js/'
```

This happened because cPanel thought `server.js` was a directory name (part of the path), so it tried to move the virtual environment directory into a subdirectory that doesn't exist.

By removing `/server.js` from the Application root, cPanel will correctly use `public_html/frontend` as the directory and `server.js` as the startup file.


