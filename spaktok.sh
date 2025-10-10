#!/usr/bin/env bash
set -euo pipefail

echo "🚀 SUPER SPAKTOK SETUP STARTED"

# ---------- 1. Install missing dependencies ----------
install_if_missing() {
  local cmd=$1
  local pkg=$2
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "📦 Installing $cmd..."
    sudo apt-get update -y && sudo apt-get install -y $pkg
  else
    echo "✅ $cmd already installed"
  fi
}

install_if_missing docker docker.io
install_if_missing docker-compose docker-compose
install_if_missing git git
install_if_missing unzip unzip
install_if_missing curl curl
install_if_missing java openjdk-17-jdk
install_if_missing node nodejs
install_if_missing npm npm

# Flutter
if ! command -v flutter >/dev/null 2>&1; then
  echo "📦 Installing Flutter..."
  git clone https://github.com/flutter/flutter.git -b stable ~/flutter
  echo 'export PATH=$PATH:$HOME/flutter/bin' >> ~/.bashrc
  export PATH=$PATH:$HOME/flutter/bin
else
  echo "✅ Flutter already installed"
fi

# Firebase CLI
if ! command -v firebase >/dev/null 2>&1; then
  echo "📦 Installing Firebase CLI..."
  curl -sL https://firebase.tools | bash
else
  echo "✅ Firebase CLI already installed"
fi

# ---------- 2. Project structure ----------
mkdir -p ~/spaktok/{backend,frontend,flutter-docker,firebase}
cd ~/spaktok

# ---------- 3. Dockerfiles ----------
# Backend
cat > backend/Dockerfile <<'DOCKER'
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
DOCKER

# Frontend
cat > frontend/Dockerfile <<'DOCKER'
FROM node:20 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 8080
DOCKER

# Flutter
cat > flutter-docker/Dockerfile <<'DOCKER'
FROM cirrusci/flutter:latest
WORKDIR /app
COPY . .
RUN flutter pub get
RUN flutter config --enable-web
RUN flutter config --enable-android
RUN flutter config --enable-ios
EXPOSE 8081
CMD ["flutter", "run", "-d", "web-server", "--web-port=8081", "--web-hostname=0.0.0.0"]
DOCKER

# Firebase Emulator
cat > firebase/Dockerfile <<'DOCKER'
FROM node:20
WORKDIR /firebase
RUN npm install -g firebase-tools
EXPOSE 4000 8085 9000 9099
CMD ["firebase", "emulators:start", "--project=spaktok"]
DOCKER

# ---------- 4. docker-compose ----------
cat > docker-compose.yml <<'YAML'
services:
  backend:
    build: ./backend
    container_name: spaktok-backend
    ports:
      - "5000:5000"
    restart: always

  frontend:
    build: ./frontend
    container_name: spaktok-frontend
    ports:
      - "8080:8080"
    depends_on:
      - backend
    restart: always

  flutter:
    build: ./flutter-docker
    container_name: spaktok-flutter
    ports:
      - "8081:8081"
    restart: always

  firebase:
    build: ./firebase
    container_name: spaktok-firebase
    ports:
      - "4000:4000"
      - "8085:8085"
      - "9000:9000"
      - "9099:9099"
    restart: always

  postgres:
    image: postgres:15
    container_name: spaktok-postgres
    environment:
      POSTGRES_USER: spaktok
      POSTGRES_PASSWORD: 123dano
      POSTGRES_DB: spaktokdb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: always

  redis:
    image: redis:7
    container_name: spaktok-redis
    ports:
      - "6379:6379"
    restart: always

  mongo:
    image: mongo:6
    container_name: spaktok-mongo
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"
    restart: always

volumes:
  postgres_data:
  mongo_data:
YAML

# ---------- 5. Cleanup old & rebuild ----------
echo "🧹 Cleaning old containers & images..."
docker-compose down -v --remove-orphans || true
docker system prune -af || true

echo "⚡ Building and starting containers..."
docker-compose up -d --build

# ---------- 6. Health Check ----------
check_service() {
  local name=$1
  local port=$2
  if nc -z localhost "$port"; then
    echo "✅ $name running on port $port"
  else
    echo "❌ $name failed on port $port - check logs"
  fi
}

check_service "Backend API" 5000
check_service "Frontend" 8080
check_service "Flutter Web" 8081
check_service "Firebase Emulator" 4000
check_service "Postgres" 5432
check_service "Redis" 6379
check_service "MongoDB" 27017

echo "🎉 SUPER SPAKTOK is fully ready with Flutter + Backend + Frontend + Firebase + Databases!"
