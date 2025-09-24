#!/bin/bash
set -e

echo "🚀 بدء الإعداد الكامل لمشروع Spaktok ..."

PROJECT_ROOT="$HOME/spaktok"
FIREBASE_DIR="$PROJECT_ROOT/firebase"

# ============= 1. التحقق من الأدوات الأساسية =============
check_install() {
  if ! command -v $1 &> /dev/null; then
    echo "❌ $1 غير مثبت → جاري التثبيت ..."
    sudo apt update
    sudo apt install -y $2
  else
    echo "✅ $1 موجود"
  fi
}

check_install docker docker.io
check_install docker-compose docker-compose
check_install node nodejs
check_install npm npm
check_install git git
check_install unzip unzip
check_install openjdk-17-jdk openjdk-17-jdk
check_install curl curl
check_install wget wget

if ! command -v firebase &> /dev/null; then
  echo "❌ Firebase CLI غير مثبت → تثبيت ..."
  sudo npm install -g firebase-tools
fi

# Flutter SDK
if ! command -v flutter &> /dev/null; then
  echo "❌ Flutter غير مثبت → تثبيت ..."
  FLUTTER_URL="https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.27.1-stable.tar.xz"
  wget -q $FLUTTER_URL -O /tmp/flutter.tar.xz
  sudo tar xf /tmp/flutter.tar.xz -C /opt/
  echo 'export PATH="/opt/flutter/bin:$PATH"' >> ~/.bashrc
  source ~/.bashrc
fi

# Android SDK
ANDROID_SDK="$HOME/Android/Sdk"
if [ ! -d "$ANDROID_SDK" ]; then
  echo "📥 تنزيل Android SDK ..."
  mkdir -p "$ANDROID_SDK"
  cd "$ANDROID_SDK"
  wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O sdk-tools.zip
  unzip sdk-tools.zip -d cmdline-tools
  rm sdk-tools.zip
  yes | cmdline-tools/bin/sdkmanager --licenses
  cmdline-tools/bin/sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
fi

# ============= 2. تنظيف قديم =============
echo "🧹 تنظيف Docker قديم ..."
docker-compose -f "$PROJECT_ROOT/docker-compose.yml" down --volumes --remove-orphans || true
docker system prune -af || true

# ============= 3. إعداد مجلدات المشروع =============
mkdir -p "$FIREBASE_DIR"

# ============= 4. Dockerfiles =============
echo "⚙ كتابة Dockerfiles ..."

# --- Frontend (Flutter Web) ---
cat > "$PROJECT_ROOT/frontend/Dockerfile" <<'EOF'
FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y curl unzip git xz-utils
RUN curl -o flutter.tar.xz https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.27.1-stable.tar.xz \
 && tar xf flutter.tar.xz -C /opt && rm flutter.tar.xz
ENV PATH="/opt/flutter/bin:/root/.pub-cache/bin:$PATH"
WORKDIR /app
COPY . .
RUN flutter pub get
RUN flutter build web
CMD ["flutter", "run", "-d", "web-server", "--web-port=8080", "--web-hostname=0.0.0.0"]
EOF

# --- Backend (Node.js) ---
cat > "$PROJECT_ROOT/backend/Dockerfile" <<'EOF'
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
EOF

# --- Firebase Emulator ---
cat > "$FIREBASE_DIR/Dockerfile" <<'EOF'
FROM node:18
WORKDIR /firebase
RUN npm install -g firebase-tools
COPY firebase.json ./
COPY .firebaserc ./
COPY firestore.rules ./
COPY storage.rules ./
COPY firestore.indexes.json ./
COPY functions ./functions
CMD ["firebase", "emulators:start", "--project=spaktok", "--only", "auth,firestore,functions,hosting,storage"]
EOF

# ============= 5. docker-compose.yml =============
echo "🛠 كتابة docker-compose.yml ..."

cat > "$PROJECT_ROOT/docker-compose.yml" <<'EOF'
version: '3.9'

services:
  frontend:
    build: ./frontend
    ports:
      - "8080:8080"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
    restart: unless-stopped

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app
    restart: unless-stopped

  firebase:
    build: ./firebase
    ports:
      - "4000:4000"
      - "5001:5001"
      - "5000:5000"
      - "8080:8080"
      - "9099:9099"
      - "9199:9199"
    volumes:
      - ./firebase:/firebase
    restart: unless-stopped
EOF

# ============= 6. ملفات Firebase الافتراضية =============
echo "📄 التأكد من ملفات Firebase ..."
cd "$FIREBASE_DIR"
[ ! -f firebase.json ] && echo '{"emulators":{}}' > firebase.json
[ ! -f .firebaserc ] && echo '{"projects":{"default":"spaktok"}}' > .firebaserc
[ ! -f firestore.rules ] && echo 'rules_version="2"; service cloud.firestore { match /{doc=} { allow read, write: if true; } }' > firestore.rules
[ ! -f storage.rules ] && echo 'rules_version="2"; service firebase.storage { match /{allPaths=} { allow read, write: if true; } }' > storage.rules
[ ! -f firestore.indexes.json ] && echo '{"indexes":[],"fieldOverrides":[]}' > firestore.indexes.json

# ============= 7. Build & Run =============
echo "🐳 بناء وتشغيل الحاويات ..."
cd "$PROJECT_ROOT"
docker-compose build
docker-compose up -d

# ============= 8. فحص الحاويات =============
echo "🔍 حالة الحاويات:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# ============= 9. Flutter Doctor =============
echo "🩺 فحص Flutter Doctor ..."
flutter doctor -v || echo "⚠ Flutter doctor أظهر مشاكل، تأكد من Android SDK و Xcode."

# ============= 10. Build APK و IPA =============
echo "📦 بناء تطبيق Android و iOS ..."

cd "$PROJECT_ROOT/frontend"

echo "📲 بناء APK ..."
flutter build apk --release || echo "⚠ فشل بناء APK، تأكد من Android SDK."

echo "🍏 بناء IPA ..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  flutter build ios --release || echo "⚠ فشل بناء IPA، تأكد من Xcode."
else
  echo "⚠ لا يمكن بناء IPA إلا من macOS مع Xcode."
fi

# ============= 11. روابط النتيجة =============
echo "✅ النظام شغّال!"
echo "🌍 Frontend:   http://localhost:8080"
echo "⚙ Backend:    http://localhost:5000"
echo "🔥 Firebase UI: http://localhost:4000"
echo "📲 Android APK: $PROJECT_ROOT/frontend/build/app/outputs/flutter-apk/app-release.apk"
echo "🍏 iOS IPA:    $PROJECT_ROOT/frontend/build/ios/ipa (على macOS فقط)"
