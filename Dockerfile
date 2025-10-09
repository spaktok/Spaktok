FROM debian:bookworm-slim AS build-flutter

WORKDIR /app

# Install Flutter dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    unzip \
    openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*

# Download and install Flutter SDK
RUN git clone https://github.com/flutter/flutter.git /usr/local/flutter
ENV PATH="/usr/local/flutter/bin:/usr/local/flutter/bin/cache/dart-sdk/bin:${PATH}"
RUN flutter precache --web

# Copy Flutter project files
COPY frontend /app/frontend

# Build Flutter web app
WORKDIR /app/frontend
RUN flutter pub get
RUN flutter build web --release

FROM node:20-slim AS build-backend

WORKDIR /app

# Copy backend files
COPY backend /app/backend

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

FROM debian:bookworm-slim

WORKDIR /app

# Install Nginx and Node.js runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy Flutter build output
COPY --from=build-flutter /app/frontend/build/web /app/public

# Copy backend files and node_modules
COPY --from=build-backend /app/backend /app/backend

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 for Nginx
EXPOSE 80

# Start Nginx and Node.js backend
CMD service nginx start && node backend/server.js
