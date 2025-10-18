FROM debian:bullseye-slim

# Install dependencies
RUN apt-get update && apt-get install -y curl unzip git xz-utils

# Install Flutter SDK
RUN curl -o flutter.tar.xz https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.35.5-stable.tar.xz \
 && tar xf flutter.tar.xz -C /opt && rm flutter.tar.xz

# Add Flutter to PATH
ENV PATH="/opt/flutter/bin:/root/.pub-cache/bin:$PATH"

# Create a non-root user for Flutter operations
RUN useradd -ms /bin/bash flutteruser
USER flutteruser
WORKDIR /home/flutteruser/app

# Copy project files and get dependencies
COPY --chown=flutteruser:flutteruser . .
RUN git config --global --add safe.directory /opt/flutter && flutter pub get

# Build web application
RUN flutter build web

# Run the application
CMD ["flutter", "run", "-d", "web-server", "--web-port=8080", "--web-hostname=0.0.0.0"]

