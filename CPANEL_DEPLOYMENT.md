# cPanel Deployment Guide

## Prerequisites

1. cPanel hosting with Node.js support (Node.js Selector)
2. PHP 7.4+ (for .htaccess support)
3. Access to Terminal/SSH (recommended) or File Manager

## Step 1: Upload Files

1. Upload the `angelone-deployment.zip` file to your cPanel
2. Extract it in your desired directory (e.g., `public_html` or a subdomain)

## Step 2: Set Up Environment Variables

### Frontend Environment Variables

1. Navigate to `frontend` directory
2. Create a `.env.local` file (or `.env` for production)
3. Add the following:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NODE_ENV=production
```

### Backend Environment Variables

1. Navigate to `backend` directory
2. Create a `.env` file
3. Add the following:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
PORT=4000
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

## Step 3: Install Dependencies

### Option A: Using Terminal/SSH (Recommended)

```bash
# Navigate to frontend directory
cd frontend
npm install

# Navigate to backend directory
cd ../backend
npm install
```

### Option B: Using cPanel Node.js Selector

1. Go to cPanel → Node.js Selector
2. Create a new application
3. Set Node.js version (18.x or higher recommended)
4. Set Application root to your `frontend` directory
5. Set Application URL
6. Set Application startup file to `server.js`
7. Click "Create"

Repeat for backend if running separately.

## Step 4: Build the Application

### Frontend

```bash
cd frontend
npm run build
```

This will create a `.next` folder with the production build.

### Backend

```bash
cd backend
npm run build
```

This will create a `dist` folder with the compiled backend.

## Step 5: Configure cPanel Node.js Application

1. Go to cPanel → Node.js Selector
2. Find your application
3. Set the following:
   - **Application root**: `/home/username/public_html/frontend` (adjust path)
   - **Application URL**: Your domain or subdomain
   - **Application startup file**: `server.js`
   - **Node.js version**: 18.x or higher
4. Click "Save"
5. Click "Run NPM Install" (if available)
6. Click "Restart App"

## Step 6: Start the Applications

### If using Node.js Selector:

The app should start automatically. Check the logs if there are issues.

### If using SSH/Terminal:

```bash
# Frontend (in one terminal)
cd frontend
npm start

# Backend (in another terminal or use PM2)
cd backend
npm run start:prod
```

### Using PM2 (Recommended for Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start frontend
cd frontend
pm2 start server.js --name "frontend"

# Start backend
cd ../backend
pm2 start dist/main.js --name "backend"

# Save PM2 configuration
pm2 save
pm2 startup
```

## Step 7: Configure Apache/.htaccess (If Needed)

If you're using Apache and want to serve the frontend directly:

1. Ensure `.htaccess` file exists in `frontend` directory
2. If using Node.js as reverse proxy, uncomment the proxy rules in `.htaccess`
3. Adjust the port number if your Node.js app runs on a different port

## Step 8: Database Setup

1. Run your SQL migration files in Supabase SQL Editor:
   - `supabase-migration.sql`
   - `add-currency-columns.sql`
   - `add-support-messages-table.sql`
   - `add-timed-trades-columns.sql`
   - `update-notification-messages.sql`

## Troubleshooting

### Application won't start

1. Check Node.js version: `node --version` (should be 18+)
2. Check logs in cPanel → Node.js Selector → View Logs
3. Verify environment variables are set correctly
4. Ensure all dependencies are installed: `npm install`

### 500 Internal Server Error

1. Check `.env` files are created and have correct values
2. Verify Supabase credentials are correct
3. Check file permissions (should be 644 for files, 755 for directories)
4. Review error logs in cPanel

### Port Already in Use

1. Change the PORT in `.env` file
2. Update Node.js Selector configuration
3. Restart the application

### Build Errors

1. Ensure Node.js version is compatible (18.x recommended)
2. Clear `.next` and `node_modules`, then reinstall:
   ```bash
   rm -rf .next node_modules package-lock.json
   npm install
   npm run build
   ```

## File Structure After Deployment

```
your-domain.com/
├── frontend/
│   ├── .next/          (build output)
│   ├── .env.local      (environment variables)
│   ├── .htaccess       (Apache config)
│   ├── server.js       (custom server)
│   ├── package.json
│   └── src/
├── backend/
│   ├── dist/           (compiled backend)
│   ├── .env            (environment variables)
│   ├── package.json
│   └── src/
└── deployment/
```

## Security Notes

1. Never commit `.env` files to version control
2. Keep your `SUPABASE_SERVICE_ROLE_KEY` secret
3. Use HTTPS in production
4. Set proper file permissions (644 for files, 755 for directories)
5. Keep dependencies updated: `npm audit fix`

## Support

If you encounter issues:
1. Check cPanel error logs
2. Check Node.js application logs
3. Verify all environment variables
4. Ensure database migrations are run
5. Check Supabase project is active and accessible


