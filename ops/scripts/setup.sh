#!/bin/bash

# Spaktok Complete Setup Script
# Automates the entire development environment setup

set -e

echo "🎉 Starting Spaktok Setup..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check prerequisites
echo "${YELLOW}Checking prerequisites...${NC}"

command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install from https://nodejs.org"; exit 1; }
command -v flutter >/dev/null 2>&1 || { echo "❌ Flutter not found. Install from https://flutter.dev"; exit 1; }
command -v firebase >/dev/null 2>&1 || { echo "❌ Firebase CLI not found. Run: npm install -g firebase-tools"; exit 1; }

echo "${GREEN}✅ All prerequisites found${NC}"
echo ""

# Install backend dependencies
echo "${YELLOW}Installing backend dependencies...${NC}"
cd functions
npm install
cd ..
echo "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

# Install frontend dependencies
echo "${YELLOW}Installing frontend dependencies...${NC}"
flutter pub get
echo "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

# Setup environment
if [ ! -f .env ]; then
  echo "${YELLOW}Creating .env file from template...${NC}"
  cp .env.example .env
  echo "${GREEN}✅ .env file created - Please configure your credentials${NC}"
else
  echo "${GREEN}✅ .env file already exists${NC}"
fi
echo ""

# Create test directory if missing
mkdir -p functions/test

# Run tests
echo "${YELLOW}Running tests...${NC}"
cd functions
npm test || echo "${YELLOW}⚠️  Some tests failed (expected on first run)${NC}"
cd ..
flutter test || echo "${YELLOW}⚠️  Some Flutter tests failed${NC}"
echo ""

# Start emulators (optional)
read -p "Start Firebase emulators now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "${YELLOW}Starting Firebase emulators...${NC}"
  firebase emulators:start --only functions,firestore &
  EMULATOR_PID=$!
  
  echo "${GREEN}✅ Emulators started (PID: $EMULATOR_PID)${NC}"
  echo "To stop: kill $EMULATOR_PID"
  echo ""
fi

echo ""
echo "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo "${GREEN}║                                           ║${NC}"
echo "${GREEN}║   🎉 Spaktok Setup Complete! 🎉           ║${NC}"
echo "${GREEN}║                                           ║${NC}"
echo "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. Configure .env with your credentials"
echo "  2. Start emulators: firebase emulators:start"
echo "  3. Run Flutter app: flutter run -d chrome"
echo ""
echo "Documentation:"
echo "  - Quick Start: QUICK_START.md"
echo "  - Deployment: DEPLOYMENT_GUIDE.md"
echo "  - Full Docs: FINAL_SUMMARY.md"
echo ""
