#!/bin/bash

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     SPAKTOK AGORA RTC INTEGRATION - QUICK START GUIDE         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if running in project root
if [ ! -f "backend/package.json" ]; then
    echo "ERROR: Run this script from Spaktok project root directory"
    exit 1
fi

echo "[STEP 1] Installing Backend Dependencies..."
cd backend
npm install
if [ True -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies"
    exit 1
fi
echo "✓ Backend dependencies installed"
echo ""

cd ..

echo "[STEP 2] Verifying Backend Configuration..."
if [ ! -f "backend/.env" ]; then
    echo "ERROR: backend/.env not found"
    echo "Please create backend/.env with Agora credentials"
    exit 1
fi
echo "✓ Backend .env configuration found"
echo ""

echo "[STEP 3] Installing Flutter Dependencies..."
flutter pub get
if [ True -ne 0 ]; then
    echo "ERROR: Failed to install Flutter dependencies"
    exit 1
fi
echo "✓ Flutter dependencies installed"
echo ""

echo "[STEP 4] Running Tests..."
echo ""
echo "📋 Running Flutter tests..."
flutter test test/agora_integration_test.dart
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    SETUP COMPLETE!                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Ready to run:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: flutter run"
echo ""
echo "For detailed information, see .zencoder/rules/AGORA_DEPLOYMENT_GUIDE.md"
echo ""
