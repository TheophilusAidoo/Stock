# 🔍 Check Why API is Failing

## Quick Diagnostic:

### Step 1: Check if Backend is Running

Open Terminal and run:
```bash
curl -v http://localhost:4001/
```

**Expected Output if Running:**
```
* Connected to localhost (127.0.0.1) port 4001
< HTTP/1.1 200 OK
```

**If NOT Running:**
```
* Connection refused
```

---

### Step 2: Check Production API

```bash
curl -v https://stockmartlic.com/api/
```

**If it works:** You'll see a response  
**If it fails:** You'll see connection error

---

## 🚀 START BACKEND NOW:

```bash
cd "/Users/alphamac/Downloads/Angelone 2/backend"
PORT=4001 HOST=localhost npm run start:dev
```

**Wait for this message:**
```
🚀 Backend server is running on http://localhost:4001
```

---

## 🐛 Common Issues:

### Issue 1: "Connection refused"
**Cause**: Backend not running  
**Fix**: Start backend (command above)

### Issue 2: "CORS error" 
**Cause**: Browser blocking request  
**Fix**: Already fixed! Backend allows all origins

### Issue 3: "Network error"
**Cause**: Firewall or network issue  
**Fix**: Check your internet connection

### Issue 4: "Timeout"
**Cause**: Backend is slow or not responding  
**Fix**: Check backend terminal for errors

---

## ✅ After Starting Backend:

1. **Wait 5 seconds** for backend to fully start
2. **Refresh browser** (Cmd + Shift + R)
3. **Try login again**

---

## 📝 Check Backend Logs:

When you try to login, check the backend terminal. You should see:
```
POST /auth/login
```

If you DON'T see this → Frontend can't reach backend  
If you DO see this → Backend is receiving requests

---

**Run the curl commands above to diagnose the exact issue!** 🔍
