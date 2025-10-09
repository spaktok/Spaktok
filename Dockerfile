FROM debian:bullseye-slim AS build

# Install packages required for Flutter and app building
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    sudo \
    libgconf-2-4 \
    libnss3 \
    libxss1 \
    libappindicator1 \
    libsecret-1-0 \
    libgtk-3-0 \
    libglib2.0-0 \
    libgdk-pixbuf2.0-0 \
    libwebkit2gtk-4.0-3 \
    xz-utils \
    pkg-config \
    build-essential \
    clang \
    cmake \
    ninja-build \
    libgtk-3-dev \
    liblzma-dev \
    libstdc++-12-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Flutter SDK
RUN git clone https://github.com/flutter/flutter.git /usr/local/flutter
ENV PATH="/usr/local/flutter/bin:/usr/local/flutter/bin/cache/dart-sdk/bin:${PATH}"

# Enable Flutter web and build the app
WORKDIR /app
COPY pubspec.* ./
RUN flutter pub get
COPY . .
RUN flutter config --enable-web
RUN flutter build web --release

# Serve the app with Nginx
FROM nginx:stable-alpine
COPY --from=build /app/build/web /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
