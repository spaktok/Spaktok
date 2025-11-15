# 🚀 Spaktok Local Development Environment

## Quick Start Guide

This guide will help you set up and run the complete Spaktok development stack using Docker.

---

## 📋 Prerequisites

Ensure you have the following installed:

- ✅ **Docker** (v20.10+) - [Download](https://www.docker.com/products/docker-desktop)
- ✅ **Docker Compose** (v2.0+)
- ✅ **Git** (v2.30+)
- ⚠️ **Node.js** (v20+) - Optional, used in containers
- ⚠️ **Flutter** (v3.24+) - Optional, used in containers
- ⚠️ **Firebase CLI** - Optional, used in containers

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Spaktok Dev Stack                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐        ┌──────────────────┐      │
│  │  Flutter App    │◄──────►│ Firebase Suite   │      │
│  │  (Port 8080)    │        │  - Auth (9099)   │      │
│  │                 │        │  - Firestore     │      │
│  │  - Hot Reload   │        │  - Functions     │      │
│  │  - Live Sync    │        │  - Hosting       │      │
│  └─────────────────┘        └──────────────────┘      │
│         ▲                            ▲                 │
│         │                            │                 │
│         └────────Volume Sync─────────┘                 │
│           (./lib, ./web, ./assets)                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Automated)

### Option 1: PowerShell (Windows)

```powershell
.\setup_local.ps1
```

### Option 2: Bash (Linux/macOS)

```bash
chmod +x setup_local.sh
./setup_local.sh
```

---

## 🔧 Manual Setup (Step-by-Step)

If automated scripts don't work, follow these steps:

### Step 1: Verify Docker Installation

```bash
docker --version
docker-compose --version
```

### Step 2: Build Docker Images

```bash
docker-compose -f docker-compose.dev.yml build
```

⏱️ **Expected time:** 5-10 minutes (first build)

### Step 3: Launch Services

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Step 4: Wait for Services (60 seconds)

The services need time to initialize. You can monitor progress:

```bash
docker-compose -f docker-compose.dev.yml logs -f
```

Press `Ctrl+C` to stop viewing logs.

### Step 5: Verify Deployment

Check that all services are running:

```bash
docker ps --filter "name=spaktok"
```

You should see containers like:
- `spaktok_flutter`
- `spaktok_firebase`

---

## 🌐 Access Points

Once running, access your application at:

| Service | URL | Description |
|---------|-----|-------------|
| **Flutter App** | http://localhost:8080 | Main application |
| **Firebase Emulator UI** | http://localhost:4400 | Manage emulators |
| **Firestore Emulator** | http://localhost:8081 | Database UI |
| **Auth Emulator** | http://localhost:9099 | Authentication |
| **Functions** | http://localhost:5001 | Cloud Functions |

---

## 🔥 Hot Reload

Code changes are **automatically synced** to containers:

- Edit files in `./lib/` (Flutter code)
- Edit files in `./web/` (Web assets)
- Edit files in `./assets/` (Images, fonts)
- Edit files in `./functions/` (Firebase Functions)

**No restart required!** 🎉

---

## 🛠️ Management Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f spaktok_app
```

### Stop Services

```bash
docker-compose -f docker-compose.dev.yml down
```

### Restart Services

```bash
docker-compose -f docker-compose.dev.yml restart
```

### Rebuild Containers

```bash
# Rebuild all
docker-compose -f docker-compose.dev.yml build

# Rebuild specific service
docker-compose -f docker-compose.dev.yml build spaktok_app
```

### Clean Everything

```bash
# Stop and remove containers, networks, volumes
docker-compose -f docker-compose.dev.yml down -v

# Remove images
docker rmi $(docker images -q spaktok*)
```

---

## 📦 Volume Management

Data persists across restarts in Docker volumes:

- `flutter-pub-cache` - Flutter dependencies
- `node-modules` - Node.js packages
- `firebase-data` - Firebase emulator data

### Clear Volumes

```bash
docker volume rm spaktok_flutter-pub-cache
docker volume rm spaktok_node-modules
docker volume rm spaktok_firebase-data
```

---

## 🐛 Troubleshooting

### Problem: Port Already in Use

**Error:** `Bind for 0.0.0.0:8080 failed: port is already allocated`

**Solution:**
```bash
# Find process using port 8080
netstat -ano | findstr :8080  # Windows
lsof -ti:8080                  # Linux/macOS

# Stop the process or change port in docker-compose.dev.yml
```

### Problem: Docker Build Fails

**Solution:**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose -f docker-compose.dev.yml build --no-cache
```

### Problem: Services Won't Start

**Solution:**
```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs

# Check Docker disk space
docker system df

# Clean up if needed
docker system prune -a --volumes
```

### Problem: Flutter App Not Loading

**Solution:**
1. Wait 60-90 seconds after `docker-compose up`
2. Check logs: `docker-compose -f docker-compose.dev.yml logs spaktok_app`
3. Restart service: `docker-compose -f docker-compose.dev.yml restart spaktok_app`

---

## 📊 Performance Tips

### Faster Rebuilds

1. **Use layer caching** - Already configured in Dockerfile.dev
2. **Don't modify `pubspec.yaml` frequently** - Triggers full rebuild
3. **Keep volumes** - Don't delete `flutter-pub-cache`

### Reduce CPU Usage

```yaml
# In docker-compose.dev.yml, add resource limits:
services:
  spaktok_app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```bash
# Copy example
cp .env.example .env

# Edit with your values
nano .env  # or use any editor
```

**Never commit `.env` to Git!**

---

## 📝 Development Workflow

1. **Start environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Code your features** in `./lib/` or `./functions/`

3. **View changes** at http://localhost:8080

4. **Test Firebase** via Emulator UI at http://localhost:4400

5. **Stop when done:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

---

## 🚢 Production Deployment

For production, use the main `docker-compose.yml` (not `.dev`):

```bash
docker-compose up -d
```

This uses optimized production builds without dev tools.

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Flutter Documentation](https://docs.flutter.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Spaktok API Docs](./API_DOCUMENTATION.md)

---

## 🆘 Need Help?

1. Check logs: `docker-compose -f docker-compose.dev.yml logs`
2. Review `agent_build.log` if using setup scripts
3. Open an issue in the repository

---

## ✅ System Health Check

Run this command to verify everything is working:

```bash
# Check containers
docker ps --filter "name=spaktok"

# Check Flutter app
curl http://localhost:8080

# Check Firebase emulators
curl http://localhost:4400
curl http://localhost:9099
```

All should return `200 OK` or HTML content.

---

## 🎉 You're All Set!

Your Spaktok development environment is ready!

Access your app: **http://localhost:8080**

Happy coding! 🚀

