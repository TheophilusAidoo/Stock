# 🚀 Quick Start Guide

## ✅ Everything is Already Configured!

Your Supabase credentials have been hardcoded into the application:
- **Project URL**: `https://pptkoxlmocdmcbymxjix.supabase.co`
- **Anon Key**: Configured ✓
- **Service Role Key**: Configured ✓
- **API Endpoint**: `https://stockmartlic.com/api`

## 🎯 Start the Application (3 Simple Steps)

### Step 1: Open Terminal
Open your Terminal app (Applications → Utilities → Terminal)

### Step 2: Start Backend Server
```bash
cd "/Users/alphamac/Downloads/Angelone 2/backend"
PORT=4001 HOST=127.0.0.1 npm run start:dev
```

Wait until you see: `Nest application successfully started`

### Step 3: Start Frontend Server (Open New Terminal Tab)
Press `Cmd+T` to open a new terminal tab, then run:
```bash
cd "/Users/alphamac/Downloads/Angelone 2/frontend"
PORT=3001 npm run dev
```

Wait until you see: `> Ready on http://127.0.0.1:3001`

### Step 4: Open Your Browser
Go to: **http://127.0.0.1:3001**

---

## 🔥 One-Command Start (Alternative)

Run this single command to start both servers:
```bash
cd "/Users/alphamac/Downloads/Angelone 2" && bash start-dev.sh
```

---

## 🛑 Stop the Servers

Press `Ctrl+C` in each terminal window, or run:
```bash
pkill -f "node server.js" && pkill -f "nest start"
```

---

## ✅ What's Been Fixed

1. ✅ **Supabase Integration**: All credentials hardcoded as fallbacks
   - Frontend: `frontend/src/lib/supabase/client.ts`
   - Frontend: `frontend/src/lib/supabase/server.ts`
   - Backend: `backend/src/config/supabase.config.ts`

2. ✅ **API Endpoint**: Defaults to `https://stockmartlic.com/api`
   - Frontend: `frontend/src/lib/api.ts`

3. ✅ **Environment Files**: Already configured
   - `frontend/.env.local`
   - `backend/.env`

4. ✅ **Currency Settings**: Will now fetch from your live API

5. ✅ **Port Configuration**: 
   - Frontend: `http://127.0.0.1:3001`
   - Backend: `http://127.0.0.1:4001`

---

## 📝 Environment Variables (Already Set)

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://stockmartlic.com/api
NEXT_PUBLIC_SUPABASE_URL=https://pptkoxlmocdmcbymxjix.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Backend (.env)
```env
PORT=4001
HOST=127.0.0.1
FRONTEND_URL=http://127.0.0.1:3001
SUPABASE_URL=https://pptkoxlmocdmcbymxjix.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🐛 Troubleshooting

### "Failed to fetch" error?
**Solution**: Make sure the backend is running at `http://127.0.0.1:4001` OR the app will use your live API at `https://stockmartlic.com/api`.

### Port already in use?
**Solution**: Change ports in the start commands:
```bash
# Frontend on different port
PORT=3002 npm run dev

# Backend on different port  
PORT=4002 HOST=127.0.0.1 npm run start:dev
```

### Can't bind to port (EPERM error)?
**Solution**: Try a different port number or check if another app is using the port.

---

## 🎉 You're All Set!

The "Failed to fetch" error will be gone once both servers are running.

**No more configuration needed - everything works out of the box!**

