# 🔍 Diagnose "Failed to fetch" Error

## Step 1: Check if Backend is Running

**Open Terminal and run:**
```bash
curl http://localhost:4001/health
```

**✅ If you see JSON response:**
```json
{"status":"ok","timestamp":"...","message":"Backend API is running"}
```
→ Backend IS running! The issue is likely CORS or browser blocking.

**❌ If you see "Connection refused":**
→ Backend is NOT running. Start it (see Step 2).

---

## Step 2: Start Backend (If Not Running)

```bash
cd "/Users/alphamac/Downloads/Angelone 2/backend"
PORT=4001 HOST=localhost npm run start:dev
```

**Wait for:**
```
🚀 Backend server is running on http://localhost:4001
```

---

## Step 3: Test from Browser Console

**Open browser DevTools (F12) → Console tab, then run:**

```javascript
fetch('http://localhost:4001/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**✅ If you see the health check response:**
→ Backend is accessible from browser. Login should work.

**❌ If you see CORS error:**
→ CORS is blocking. Check backend CORS settings.

**❌ If you see "Failed to fetch":**
→ Backend might not be running or network issue.

---

## Step 4: Check Browser Network Tab

1. Open DevTools (F12)
2. Go to "Network" tab
3. Try to login
4. Look for the `/auth/login` request

**Check:**
- **Status**: Should be 200 (success) or 401 (wrong password)
- **If Status is "failed" or "CORS error"**: Backend CORS issue
- **If Request doesn't appear**: Request not being sent

---

## Step 5: Check Backend Logs

When you try to login, check the backend terminal. You should see:
```
POST /auth/login
```

**If you DON'T see this:**
→ Request never reached backend (CORS or network issue)

**If you DO see this:**
→ Backend received request, check for error messages

---

## Common Fixes:

### Fix 1: Restart Backend
```bash
# Stop backend (Ctrl+C)
# Then start again:
cd "/Users/alphamac/Downloads/Angelone 2/backend"
PORT=4001 HOST=localhost npm run start:dev
```

### Fix 2: Clear Browser Cache
- Press `Cmd + Shift + R` (hard reload)
- Or clear browser cache completely

### Fix 3: Check Firewall
- Make sure firewall isn't blocking port 4001
- Try disabling firewall temporarily to test

### Fix 4: Try Different Port
If port 4001 is blocked, try:
```bash
PORT=4002 HOST=localhost npm run start:dev
```
Then update `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4002
```

---

## Quick Test Commands:

```bash
# Test backend health
curl http://localhost:4001/health

# Test backend root
curl http://localhost:4001/

# Test login endpoint (should return error without credentials)
curl -X POST http://localhost:4001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'
```

---

**Run these diagnostics to find the exact issue!** 🔍
