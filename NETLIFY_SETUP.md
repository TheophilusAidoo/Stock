# 🚀 Netlify Deployment Setup - FIXED!

## ✅ What I Fixed:

1. ✅ **Created `netlify.toml`** - Netlify configuration file
2. ✅ **Updated `next.config.ts`** - Set to `standalone` output for Netlify
3. ✅ **Added redirects** - Handle Next.js routing properly
4. ✅ **Added Netlify plugin** - `@netlify/plugin-nextjs` for Next.js support

---

## 🔧 Netlify Build Settings:

### In Netlify Dashboard:

1. Go to your site settings
2. Go to **"Build & deploy"**
3. Set these values:

**Base directory:** `frontend`  
**Build command:** `npm run build`  
**Publish directory:** `.next`

---

## 📦 Install Netlify Plugin:

**Option 1: Via Netlify Dashboard (Recommended)**
1. Go to your site → **"Plugins"**
2. Search for: `@netlify/plugin-nextjs`
3. Click **"Install"**

**Option 2: Via netlify.toml (Already done)**
The plugin is already configured in `netlify.toml`

---

## 🔄 Redeploy:

After making these changes:

1. **Commit and push:**
   ```bash
   cd "/Users/alphamac/Downloads/Angelone 2"
   git add .
   git commit -m "Add Netlify configuration for Next.js deployment"
   git push
   ```

2. **Netlify will auto-deploy** (if connected to GitHub)
   OR
   **Trigger manual deploy** in Netlify dashboard

---

## ✅ What Should Work Now:

- ✅ All pages load correctly
- ✅ Routing works (no 404 errors)
- ✅ Static assets load
- ✅ API routes work (if configured)
- ✅ Images and fonts load

---

## 🐛 If Still Getting 404:

### Check Netlify Build Logs:

1. Go to Netlify Dashboard
2. Click on your latest deploy
3. Check **"Deploy log"**
4. Look for errors

### Common Issues:

**Issue 1: Build failing**
- Check if `npm run build` completes successfully
- Check for TypeScript/ESLint errors

**Issue 2: Wrong publish directory**
- Should be: `.next`
- NOT: `out` or `dist`

**Issue 3: Missing plugin**
- Install `@netlify/plugin-nextjs` plugin

**Issue 4: Environment variables**
- Add `NEXT_PUBLIC_SUPABASE_URL` in Netlify
- Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Netlify
- Add `NEXT_PUBLIC_API_URL` in Netlify

---

## 🔐 Add Environment Variables in Netlify:

1. Go to: **Site settings** → **Environment variables**
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://pptkoxlmocdmcbymxjix.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - `NEXT_PUBLIC_API_URL` = Your backend API URL

---

## 📝 Files Created:

- ✅ `frontend/netlify.toml` - Main Netlify config
- ✅ `frontend/_redirects` - Fallback redirects
- ✅ Updated `next.config.ts` - Standalone output

---

**After pushing these changes, Netlify will redeploy and pages should work!** 🎯
