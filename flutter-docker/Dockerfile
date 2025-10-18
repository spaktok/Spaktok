FROM cirrusci/flutter:latest
WORKDIR /app
COPY . .
RUN flutter pub get
CMD ["flutter", "run", "-d", "web-server", "--web-port=8081"]
