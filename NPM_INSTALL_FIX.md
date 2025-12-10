# Fix npm ERESOLVE Error - Use --legacy-peer-deps

## The Problem

You're getting this error because:
- React 19 RC is a release candidate
- Some packages (like `lucide-react`) haven't updated their peer dependencies yet
- npm is being strict about version matching

## The Solution

You **MUST** use the `--legacy-peer-deps` flag when installing.

## Step-by-Step Fix

### 1. Access Terminal in cPanel
- Go to **cPanel → Terminal**
- Or use SSH

### 2. Navigate to Frontend Directory
```bash
cd ~/public_html/frontend
```

### 3. Clean Previous Installation
```bash
rm -rf node_modules package-lock.json
```

### 4. Install with Legacy Peer Deps Flag ⭐
```bash
npm install --legacy-peer-deps
```

**This is the key step!** The `--legacy-peer-deps` flag tells npm to ignore peer dependency conflicts.

### 5. Build the Application
```bash
npm run build
```

### 6. Go Back to cPanel Node.js Selector
- Click **"RESTART"** button
- Check logs

---

## Why --legacy-peer-deps is Safe

- React 19 RC is compatible with React 18 packages
- The conflict is just npm being overly strict
- This flag is commonly used with React 19 RC
- Your app will work fine

---

## Alternative: Create .npmrc File (Permanent Fix)

If you want to avoid typing the flag every time, create a `.npmrc` file:

### Via Terminal:
```bash
cd ~/public_html/frontend
echo "legacy-peer-deps=true" > .npmrc
npm install
npm run build
```

This way, `npm install` will always use `--legacy-peer-deps` automatically.

---

## Complete Command Sequence (Copy & Paste)

```bash
cd ~/public_html/frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

Then restart the app in cPanel.

---

## If Terminal Not Available

If you can't access Terminal, you'll need to:
1. Contact your hosting provider
2. Ask them to run:
   ```bash
   cd /home2/stockmar/public_html/frontend
   npm install --legacy-peer-deps
   npm run build
   ```

---

## Verification

After installation, check:
```bash
ls node_modules/.bin/next
```

Should show the Next.js binary file.

Then check logs in cPanel - should see:
```
> Ready on http://0.0.0.0:3000
```


