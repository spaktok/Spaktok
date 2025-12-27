# ⚠️ Docker Desktop Startup Guide

## The Issue
Links won't work because Docker Desktop is not running.

## Quick Solution

### Step 1: Open Docker Desktop
- Search for "Docker Desktop" in your programs
- Double-click to open the application

### Step 2: Wait Until Ready
- Docker icon will appear in system tray
- Wait until it turns green
- May take 30-60 seconds

### Step 3: Verify It's Running
Open PowerShell and type:
```powershell
docker ps
```
You should see a table without errors.

### Step 4: Run the Setup Script Again
```powershell
.\ops\scripts\setup_local.ps1
```

---

## Available Services

After Docker is running and build is complete, these links will work:

✅ http://localhost:8080      ← Main Application  
✅ http://localhost:4400      ← Firebase Admin UI  
✅ http://localhost:8081      ← Firestore Database UI  
✅ http://localhost:9099      ← Auth Emulator  
✅ http://localhost:5001      ← Cloud Functions  

---

## Why Are Links Not Working Now?

• Containers are not running
• Containers need Docker Desktop to work
• Once Docker is running and project is built, links will work automatically

---

## Need Additional Help?

Refer to these files:
- `documentation/guides/quick-start.md` - Quick start guide
- `documentation/guides/LOCAL_DEVELOPMENT_GUIDE.md` - Comprehensive guide

---

**Note:** This is a guide file. The original `DOCKER_START_REQUIRED.txt` has been moved to `documentation/legacy/` for reference.
