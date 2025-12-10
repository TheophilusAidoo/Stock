# Build Static Export - Simple Upload Solution

## What This Does

This creates a **static version** of your Next.js app that you can just upload to cPanel - **NO Node.js needed!**

## ⚠️ Important Notes

- This creates a **static export** - all pages are pre-built HTML files
- No server-side rendering - everything runs in the browser
- Works perfectly with cPanel/LiteSpeed/Apache
- Just upload and extract - that's it!

## Step 1: Build the Static Export (On Your Computer)

### Prerequisites:
- Node.js 18+ installed on your computer
- All your Supabase credentials ready

### Build Steps:

1. **Open Terminal on your computer** (not cPanel)

2. **Navigate to frontend directory:**
   ```bash
   cd "/Users/alphamac/Downloads/Angelone 2/frontend"
   ```

3. **Create .env.local file** (if not exists):
   ```bash
   nano .env.local
   ```
   
   Add:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   NEXT_PUBLIC_API_URL=https://stockmartlic.com/api
   ```

4. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

5. **Build static export:**
   ```bash
   npm run build
   ```

6. **This creates an `out` folder** with all static files

## Step 2: Create Upload Package

After building, you'll have an `out` folder. Create a zip of its contents:

```bash
cd out
zip -r ../static-frontend.zip .
cd ..
```

## Step 3: Upload to cPanel

1. **Upload `static-frontend.zip`** to cPanel File Manager
2. **Extract it** in `public_html` (or wherever your domain points)
3. **Upload `.htaccess`** file to the same directory
4. **Done!** Your site should work immediately

## Alternative: Automated Build Script

I can create a script that does all this automatically. Would you like me to create it?

## File Structure After Upload

```
public_html/
├── .htaccess          (upload this)
├── index.html         (from out folder)
├── _next/            (from out folder)
├── static/           (from out folder)
└── ... (all other files from out folder)
```

## That's It!

No Node.js setup needed. Just upload and extract!


