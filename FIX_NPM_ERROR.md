# Fix npm ERESOLVE Error

## Problem
The npm install is failing due to dependency conflicts. This is happening because:
1. Node.js 12.22.9 is too old
2. React 19 RC has peer dependency conflicts with some packages
3. npm version is outdated

## Solution: Use Legacy Peer Deps Flag

Since you're using React 19 RC, you need to install with the `--legacy-peer-deps` flag.

## Steps to Fix:

### Option 1: Via cPanel Terminal/SSH (Recommended)

1. **Access Terminal in cPanel:**
   - Go to cPanel → Terminal
   - Or use SSH

2. **Navigate to frontend directory:**
   ```bash
   cd ~/public_html/frontend
   ```

3. **Remove old installation:**
   ```bash
   rm -rf node_modules package-lock.json
   ```

4. **Install with legacy peer deps flag:**
   ```bash
   npm install --legacy-peer-deps
   ```

5. **Build the application:**
   ```bash
   npm run build
   ```

6. **Go back to Node.js Selector in cPanel:**
   - Click "Restart App"
   - Check logs

---

### Option 2: Update package.json Script (If Terminal Not Available)

If you can't access Terminal, we need to update the npm install command in cPanel.

**However, cPanel's "Run NPM Install" doesn't support flags directly.**

**Best solution:** Use Terminal (Option 1) or contact your host to upgrade Node.js first.

---

### Option 3: Upgrade Node.js First (Best Long-term Solution)

1. **In cPanel Node.js Selector:**
   - Find "Node.js version" dropdown
   - Change from `12.22.9` to `18.x` or `20.x`
   - Click "SAVE"

2. **Then run in Terminal:**
   ```bash
   cd ~/public_html/frontend
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   npm run build
   ```

3. **Restart app in cPanel**

---

## Why This Happens

- **React 19 RC** is a release candidate with newer APIs
- Some packages haven't updated their peer dependencies yet
- `--legacy-peer-deps` tells npm to ignore peer dependency conflicts
- This is safe for React 19 RC

## Alternative: Update package.json

If you want a permanent fix, we can update `package.json` to add the flag to the install script, but cPanel's "Run NPM Install" won't use custom scripts.

---

## Quick Fix Commands (Copy & Paste)

```bash
cd ~/public_html/frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

Then restart the app in cPanel Node.js Selector.

---

## If Still Getting Errors

1. **Check Node.js version:**
   ```bash
   node --version
   ```
   Should be 18.x or higher

2. **Check npm version:**
   ```bash
   npm --version
   ```
   Should be 9.x or higher

3. **If Node.js is still 12.x:**
   - Contact your hosting provider
   - Ask them to enable Node.js 18.x or 20.x
   - This is REQUIRED for Next.js 15


