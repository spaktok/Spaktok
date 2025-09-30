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
