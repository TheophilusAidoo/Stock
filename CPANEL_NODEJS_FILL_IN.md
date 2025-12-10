# cPanel Node.js Application - Fill In Guide

## ⚠️ IMPORTANT: Current Settings Issues

1. **Node.js version 12.22.9 is TOO OLD** - Next.js 15 requires Node.js 18+
2. **Application mode should be "Production"** not "Development"
3. **Application startup file is empty** - needs to be filled

## Step-by-Step Fill In Instructions

### 1. Node.js Version
- **Current:** 12.22.9 ❌
- **Change to:** Click dropdown and select **18.x** or **20.x** (latest available)
- **Why:** Next.js 15 requires Node.js 18 or higher

### 2. Application Mode
- **Current:** Development ❌
- **Change to:** Click dropdown and select **"Production"**
- **Why:** For live website, use production mode

### 3. Application Root
- **Fill in:** `/home/YOUR_USERNAME/public_html/frontend`
- **How to find your username:**
  - Look at the top of cPanel - it shows your username
  - Or check the path when you're in File Manager
  - Common format: `/home/username/public_html/frontend`
- **Example:** `/home/stockmart/public_html/frontend`

### 4. Application URL
- **Current:** `stockmartlic.com` ✅ (This looks correct)
- **Keep as is** unless you want a subdomain

### 5. Application Startup File
- **Fill in:** `server.js`
- **This is critical!** Without this, the app won't start

### 6. Environment Variables (Click "+ ADD VARIABLE" for each)

Add these variables one by one:

**Variable 1:**
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://your-project.supabase.co` (replace with your actual Supabase URL)

**Variable 2:**
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `your_anon_key_here` (replace with your actual Supabase anon key)

**Variable 3:**
- **Name:** `NEXT_PUBLIC_API_URL`
- **Value:** `https://stockmartlic.com/api`

**Variable 4:**
- **Name:** `NODE_ENV`
- **Value:** `production`

**Variable 5:**
- **Name:** `PORT`
- **Value:** `3000` (or the port number cPanel assigns)

## Complete Form Should Look Like:

```
Node.js version: 18.x (or 20.x)
Application mode: Production
Application root: /home/YOUR_USERNAME/public_html/frontend
Application URL: stockmartlic.com
Application startup file: server.js

Environment Variables:
- NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key_here
- NEXT_PUBLIC_API_URL = https://stockmartlic.com/api
- NODE_ENV = production
- PORT = 3000
```

## After Filling In:

1. Click **"CREATE"** button (blue button top right)
2. Wait for application to be created
3. Click **"Run NPM Install"** button (if available)
4. Click **"Restart App"** button
5. Check **"View Logs"** to see if it's running

## If Node.js 18+ Not Available:

If you don't see Node.js 18 or 20 in the dropdown:
1. Contact your hosting provider to enable newer Node.js versions
2. Or ask them to upgrade Node.js Selector in cPanel
3. Node.js 12 is too old and won't work with Next.js 15

## Troubleshooting:

- **"Application root not found"** → Check the path is correct, ensure `frontend` folder exists
- **"Startup file not found"** → Make sure `server.js` exists in the `frontend` folder
- **App won't start** → Check logs, ensure dependencies are installed (`npm install`)


