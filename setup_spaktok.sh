#!/bin/bash

echo "🚀 Spaktok Full Setup Script (Flutter + Firebase + Hosting + GitHub)"

# انتقل إلى مجلد الواجهة الأمامية
cd ~/spaktok/frontend || exit

# تشغيل pub get
echo "📦 Running flutter pub get..."
flutter pub get

# بناء المشروع للويب
echo "🛠 Building Flutter web..."
flutter build web

# نشر على Firebase Hosting
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "✅ Setup complete!"
