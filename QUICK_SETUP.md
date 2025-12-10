# Quick cPanel Setup Guide

## ⚡ Quick Steps

### 1. Upload & Extract
- Upload `angelone-deployment.zip` to cPanel File Manager
- Extract it in your domain directory (e.g., `public_html`)

### 2. Create Environment Files

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NODE_ENV=production
```

**Backend** (`backend/.env`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
PORT=4000
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

### 3. Install Dependencies (via SSH/Terminal)

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 4. Build Applications

```bash
cd frontend && npm run build
cd ../backend && npm run build
```

### 5. Setup Node.js App in cPanel

1. Go to **cPanel → Node.js Selector**
2. Create new application:
   - **Application root**: `/home/username/public_html/frontend`
   - **Application URL**: Your domain
   - **Startup file**: `server.js`
   - **Node.js version**: 18.x or higher
3. Click **"Run NPM Install"** then **"Restart App"**

### 6. Common Issues & Fixes

**❌ App won't start:**
- Check Node.js version (needs 18+)
- Verify `.env` files exist and have correct values
- Check logs in Node.js Selector

**❌ 500 Error:**
- Ensure Supabase credentials are correct
- Check file permissions (644 for files, 755 for directories)
- Verify all dependencies installed: `npm install`

**❌ Port in use:**
- Change PORT in `.env` file
- Update Node.js Selector configuration

---

📖 **Full guide**: See `CPANEL_DEPLOYMENT.md` for detailed instructions


