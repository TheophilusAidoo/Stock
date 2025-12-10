# Fix cPanel Node.js Application Issues

## 🚨 CRITICAL FIXES NEEDED

### Issue 1: Application Startup File (WRONG!)
**Current:** `stockmartlic.com` ❌  
**Should be:** `server.js` ✅

**Fix:**
1. Find the field "Application startup file"
2. Delete `stockmartlic.com`
3. Type: `server.js`

---

### Issue 2: Directory Path Error
**Error:** "Directory '/home/stockmartlic.com/public_html/frontend' not in user home ('/home2/stockmar')"

**Your correct home directory is:** `/home2/stockmar`

**Fix:**
1. Find the field "Application root"
2. Change it to: `public_html/frontend` (relative path - this is what you have, which is correct!)
3. OR use absolute path: `/home2/stockmar/public_html/frontend`

**Note:** The relative path `public_html/frontend` should work. If the error persists, try the absolute path.

---

### Issue 3: npm ERESOLVE Errors
**Problem:** Node.js version is too old (12.22.9) - Next.js 15 requires Node.js 18+

**Fix:**
1. Look for "Node.js version" dropdown (might be on a different tab or above)
2. Change from `12.22.9` to `18.x` or `20.x`
3. If 18+ is not available, contact your hosting provider

**After changing Node.js version:**
1. Click "Run NPM Install" button again
2. Wait for it to complete
3. Check if errors are gone

---

## ✅ What's Already Correct

- ✅ Environment variables are set correctly:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `PORT`
- ✅ Application URL: `stockmartlic.com`
- ✅ Application root: `public_html/frontend` (relative path is fine)

---

## Step-by-Step Fix Process

1. **Fix Application Startup File:**
   - Change `stockmartlic.com` → `server.js`

2. **Fix Application Root (if error persists):**
   - Try: `/home2/stockmar/public_html/frontend`
   - Or keep: `public_html/frontend` (relative)

3. **Upgrade Node.js Version:**
   - Change from `12.22.9` to `18.x` or `20.x`
   - This is CRITICAL - the app won't work without it

4. **After making changes:**
   - Click **"SAVE"** button (top right)
   - Click **"Run NPM Install"** button
   - Wait for installation to complete
   - Click **"Restart App"** button

5. **Check Logs:**
   - Look for "View Logs" or similar button
   - Should see: `> Ready on http://0.0.0.0:3000`

---

## If Node.js 18+ Not Available

If you can't find Node.js 18 or 20 in the dropdown:
1. Contact your hosting provider (StormerHost based on URL)
2. Ask them to enable Node.js 18.x or 20.x
3. Node.js 12 is too old and won't work with Next.js 15

---

## Quick Checklist

- [ ] Application startup file = `server.js` (not `stockmartlic.com`)
- [ ] Application root = `public_html/frontend` or `/home2/stockmar/public_html/frontend`
- [ ] Node.js version = 18.x or 20.x (not 12.22.9)
- [ ] Clicked "SAVE"
- [ ] Clicked "Run NPM Install" (after Node.js upgrade)
- [ ] Clicked "Restart App"
- [ ] Checked logs for success message


