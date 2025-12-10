# cPanel LiteSpeed Setup - Step by Step

## 🚨 Current Issue: Directory Listing Showing

You're seeing a directory listing because the Next.js app isn't running. Follow these steps:

## Step 1: Access Terminal/SSH in cPanel

1. Go to **cPanel → Terminal** (or use SSH)
2. Navigate to your frontend directory:
   ```bash
   cd ~/public_html/frontend
   # OR if in a subdomain:
   # cd ~/public_html/subdomain/frontend
   ```

## Step 2: Create Environment File

Create `.env.local` file:
```bash
nano .env.local
```

Add these lines (replace with your actual Supabase credentials):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_API_URL=https://stockmartlic.com/api
NODE_ENV=production
PORT=3000
```

Save: Press `Ctrl+X`, then `Y`, then `Enter`

## Step 3: Install Dependencies

```bash
npm install
```

Wait for installation to complete (may take 2-5 minutes)

## Step 4: Build the Application

```bash
npm run build
```

Wait for build to complete (may take 1-3 minutes)

## Step 5: Setup Node.js Application in cPanel

1. Go to **cPanel → Node.js Selector**
2. Click **"Create Application"**
3. Fill in the form:
   - **Node.js version**: Select **18.x** or **20.x** (latest stable)
   - **Application mode**: **Production**
   - **Application root**: `/home/yourusername/public_html/frontend`
     - Replace `yourusername` with your actual cPanel username
   - **Application URL**: `stockmartlic.com` (or your domain)
   - **Application startup file**: `server.js`
   - **Application port**: `3000` (or any available port)
   - **Passenger log file**: Leave default or set custom path
4. Click **"Create"**

## Step 6: Install NPM Dependencies via cPanel

1. In Node.js Selector, find your application
2. Click **"Run NPM Install"** button
3. Wait for it to complete

## Step 7: Start/Restart the Application

1. In Node.js Selector, find your application
2. Click **"Restart App"** button
3. Wait a few seconds

## Step 8: Check Application Status

1. Click **"View Logs"** in Node.js Selector
2. Look for: `> Ready on http://0.0.0.0:3000`
3. If you see errors, check the troubleshooting section below

## Step 9: Update .htaccess (If Needed)

If the app still doesn't work, you may need to update the port in `.htaccess`:

1. Edit `frontend/.htaccess`
2. Find the line: `RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]`
3. Replace `3000` with the port number from Step 5
4. Save the file

## Step 10: Test Your Site

Visit: `https://stockmartlic.com`

You should see your Next.js application, not the directory listing.

---

## 🔧 Troubleshooting

### Still seeing directory listing?

1. **Check if Node.js app is running:**
   - Go to Node.js Selector
   - Check if status shows "Running"
   - If not, click "Restart App"

2. **Check logs:**
   - Click "View Logs" in Node.js Selector
   - Look for error messages
   - Common errors:
     - Port already in use → Change port in cPanel
     - Missing dependencies → Run `npm install` again
     - Environment variables missing → Check `.env.local` file

3. **Verify file paths:**
   ```bash
   cd ~/public_html/frontend
   ls -la
   ```
   You should see: `server.js`, `package.json`, `.next` folder

4. **Check if build completed:**
   ```bash
   ls -la .next
   ```
   Should show build files

5. **Manual start (for testing):**
   ```bash
   cd ~/public_html/frontend
   node server.js
   ```
   If this works, the issue is with cPanel Node.js Selector configuration

### Port conflicts?

1. In Node.js Selector, change the port to something else (e.g., 3001, 3002)
2. Update `.htaccess` with the new port
3. Restart the app

### Build errors?

```bash
cd ~/public_html/frontend
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Permission errors?

```bash
chmod 755 ~/public_html/frontend
chmod 644 ~/public_html/frontend/.env.local
```

---

## 📝 Quick Checklist

- [ ] Created `.env.local` file with Supabase credentials
- [ ] Ran `npm install` successfully
- [ ] Ran `npm run build` successfully
- [ ] Created Node.js application in cPanel
- [ ] Set startup file to `server.js`
- [ ] Ran "Run NPM Install" in cPanel
- [ ] Clicked "Restart App"
- [ ] Checked logs for errors
- [ ] Updated `.htaccess` port if needed

---

## 🆘 Still Not Working?

If you're still having issues, check:

1. **Node.js version**: Must be 18.x or higher
2. **File permissions**: Files should be 644, directories 755
3. **Disk space**: Ensure you have enough space
4. **cPanel logs**: Check error logs in cPanel
5. **Domain configuration**: Ensure domain points to correct directory

Contact your hosting provider if Node.js Selector isn't working properly.


