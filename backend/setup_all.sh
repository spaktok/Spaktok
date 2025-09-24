#!/bin/bash
set -e

echo "🚀 بدء عملية الإصلاح والتشغيل لمشروع Spaktok ..."

# 1. تنظيف الكونتينرات القديمة
echo "🧹 تنظيف الكونتينرات القديمة..."
docker compose down || true
docker stop $(docker ps -aq) || true
docker rm -f $(docker ps -aq) || true

# 2. تنظيف الشبكات والصور المؤقتة
echo "🧹 تنظيف الشبكات والصور المؤقتة..."
docker network prune -f || true
docker image prune -af || true

# 3. تثبيت مكتبات backend
echo "📦 تثبيت مكتبات backend ..."
cd backend
rm -rf node_modules package-lock.json

cat > package.json <<'EOF'
{
  "name": "spaktok-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "mongoose": "^7.6.0",
    "redis": "^4.6.7",
    "socket.io": "^4.7.5",
    "multer": "^1.4.5",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "body-parser": "^1.20.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
EOF

npm install
cd ..

# 4. بناء المشروع
echo "🐳 بناء الكونتينرات ..."
docker compose build

# 5. تشغيل المشروع
echo "▶ تشغيل النظام كامل ..."
docker compose up -d

# 6. تقرير شامل
echo "📋 تقرير الحالة:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

echo "✅ تم التشغيل بنجاح!"
