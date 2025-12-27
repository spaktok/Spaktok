# Spaktok Complete Setup Script
# Automates the entire development environment setup

Write-Host "🎉 Starting Spaktok Setup..." -ForegroundColor Green
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

try {
    $flutterVersion = flutter --version | Select-Object -First 1
    Write-Host "✅ Flutter found: $flutterVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Flutter not found. Install from https://flutter.dev" -ForegroundColor Red
    exit 1
}

try {
    $firebaseVersion = firebase --version
    Write-Host "✅ Firebase CLI found: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI not found. Run: npm install -g firebase-tools" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location -Path "functions"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location -Path ".."
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
flutter pub get
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Setup environment
if (-Not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" -Destination ".env"
    Write-Host "✅ .env file created - Please configure your credentials" -ForegroundColor Green
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}
Write-Host ""

# Create test directory if missing
if (-Not (Test-Path "functions\test")) {
    New-Item -ItemType Directory -Path "functions\test" -Force | Out-Null
}

# Run tests
Write-Host "Running tests..." -ForegroundColor Yellow
Set-Location -Path "functions"
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Some tests failed (expected on first run)" -ForegroundColor Yellow
}
Set-Location -Path ".."

flutter test
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Some Flutter tests failed" -ForegroundColor Yellow
}
Write-Host ""

# Ask to start emulators
$response = Read-Host "Start Firebase emulators now? (y/N)"
if ($response -eq "y" -or $response -eq "Y") {
    Write-Host "Starting Firebase emulators..." -ForegroundColor Yellow
    Start-Process -FilePath "firebase" -ArgumentList "emulators:start --only functions,firestore" -NoNewWindow
    Write-Host "✅ Emulators started" -ForegroundColor Green
    Write-Host ""
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                           ║" -ForegroundColor Green
Write-Host "║   🎉 Spaktok Setup Complete! 🎉           ║" -ForegroundColor Green
Write-Host "║                                           ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Configure .env with your credentials"
Write-Host "  2. Start emulators: firebase emulators:start"
Write-Host "  3. Run Flutter app: flutter run -d chrome"
Write-Host ""
Write-Host "Documentation:"
Write-Host "  - Quick Start: QUICK_START.md"
Write-Host "  - Deployment: DEPLOYMENT_GUIDE.md"
Write-Host "  - Full Docs: FINAL_SUMMARY.md"
Write-Host ""
