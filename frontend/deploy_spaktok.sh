#!/bin/bash
set -e

echo "🚀 بدء سكربت نشر Spaktok ..."

# 1. تنظيف البروكسيات (مهم لأن مشكلتك الأساسية كانت proxy)
echo "🧹 إزالة إعدادات البروكسي..."
git config --global --unset http.proxy || true
git config --global --unset https.proxy || true
unset http_proxy || true
unset https_proxy || true

# 2. تأكيد مجلد المشروع
cd ~/spaktok/frontend || { echo "❌ مجلد frontend غير موجود"; exit 1; }

# 3. إعداد Flutter
echo "⚙ إعداد Flutter..."
flutter --version || true
flutter clean
flutter pub get

# 4. بناء Flutter Web
echo "🏗 بناء Flutter Web..."
flutter build web --release

# 5. نقل الملفات إلى public/ (Firebase Hosting)
echo "📂 تجهيز ملفات Firebase..."
mkdir -p public
rm -rf public/*
cp -r build/web/* public/

# 6. تهيئة Firebase (مرة وحدة فقط عادةً)
if [ ! -f "./firebase.json" ]; then
  echo "⚡ تهيئة Firebase..."
  firebase init hosting
fi

# 7. نشر على Firebase Hosting
echo "🌍 نشر إلى Firebase Hosting..."
firebase deploy --only hosting

echo "✅ تم النشر بنجاح!"
