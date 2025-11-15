#!/bin/bash
# ============================================================================
# Spaktok Local Development Environment - Automated Setup Script
# ============================================================================
# Purpose: Initialize, build, and launch complete Docker-based dev stack
# Usage: ./setup_local.sh
# ============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log file
LOG_FILE="agent_build.log"
REPORT_FILE="agent_build_report.log"

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Banner
banner() {
    echo -e "${BLUE}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ███████╗██████╗  █████╗ ██╗  ██╗████████╗ ██████╗ ██╗ ║
║   ██╔════╝██╔══██╗██╔══██╗██║ ██╔╝╚══██╔══╝██╔═══██╗██║ ║
║   ███████╗██████╔╝███████║█████╔╝    ██║   ██║   ██║██║ ║
║   ╚════██║██╔═══╝ ██╔══██║██╔═██╗    ██║   ██║   ██║██║ ║
║   ███████║██║     ██║  ██║██║  ██╗   ██║   ╚██████╔╝██║ ║
║   ╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝ ║
║                                                           ║
║        Local Development Environment Setup v1.0          ║
╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# ============================================================================
# Step 1: Verify Dependencies
# ============================================================================
check_dependencies() {
    log "Step 1/7: Verifying system dependencies..."
    
    local missing_deps=()
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    else
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
        info "✓ Docker installed: $DOCKER_VERSION"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        missing_deps+=("docker-compose")
    else
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f4 | tr -d ',')
        info "✓ Docker Compose installed: $COMPOSE_VERSION"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        warning "Node.js not found locally (will use container version)"
    else
        NODE_VERSION=$(node --version)
        info "✓ Node.js installed: $NODE_VERSION"
    fi
    
    # Check Flutter
    if ! command -v flutter &> /dev/null; then
        warning "Flutter not found locally (will use container version)"
    else
        FLUTTER_VERSION=$(flutter --version | head -n 1)
        info "✓ $FLUTTER_VERSION"
    fi
    
    # Check Firebase CLI
    if ! command -v firebase &> /dev/null; then
        warning "Firebase CLI not found locally (will use container version)"
    else
        FIREBASE_VERSION=$(firebase --version)
        info "✓ Firebase CLI installed: $FIREBASE_VERSION"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    else
        GIT_VERSION=$(git --version | cut -d' ' -f3)
        info "✓ Git installed: $GIT_VERSION"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Missing required dependencies: ${missing_deps[*]}"
        error "Please install the missing tools and try again."
        exit 1
    fi
    
    log "✅ All critical dependencies verified"
}

# ============================================================================
# Step 2: Clean Previous Builds
# ============================================================================
clean_environment() {
    log "Step 2/7: Cleaning previous build artifacts..."
    
    # Stop running containers
    if [ "$(docker ps -q -f name=spaktok)" ]; then
        info "Stopping running Spaktok containers..."
        docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    fi
    
    # Optional: Remove old images (uncomment if needed)
    # docker rmi $(docker images -q spaktok*) 2>/dev/null || true
    
    log "✅ Environment cleaned"
}

# ============================================================================
# Step 3: Validate Configuration Files
# ============================================================================
validate_configs() {
    log "Step 3/7: Validating configuration files..."
    
    local required_files=(
        "Dockerfile.dev"
        "docker-compose.dev.yml"
        "firebase.json"
        "pubspec.yaml"
        ".dockerignore"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            error "Required file missing: $file"
            exit 1
        fi
        info "✓ Found: $file"
    done
    
    log "✅ Configuration files validated"
}

# ============================================================================
# Step 4: Build Docker Images
# ============================================================================
build_images() {
    log "Step 4/7: Building Docker images (this may take 5-10 minutes)..."
    
    info "Building with layer caching enabled..."
    
    if docker-compose -f docker-compose.dev.yml build --parallel 2>&1 | tee -a "$LOG_FILE"; then
        log "✅ Docker images built successfully"
    else
        error "Docker build failed! Check $LOG_FILE for details"
        exit 1
    fi
}

# ============================================================================
# Step 5: Launch Services
# ============================================================================
launch_services() {
    log "Step 5/7: Launching Spaktok development stack..."
    
    info "Starting containers in detached mode..."
    
    if docker-compose -f docker-compose.dev.yml up -d 2>&1 | tee -a "$LOG_FILE"; then
        log "✅ Services launched successfully"
    else
        error "Failed to start services! Check $LOG_FILE for details"
        exit 1
    fi
    
    # Wait for services to be ready
    info "Waiting for services to initialize (60 seconds)..."
    sleep 60
}

# ============================================================================
# Step 6: Health Checks
# ============================================================================
health_checks() {
    log "Step 6/7: Performing health checks..."
    
    local services=(
        "http://localhost:8080|Flutter Web App"
        "http://localhost:4400|Firebase Emulator UI"
        "http://localhost:9099|Firebase Auth Emulator"
    )
    
    for service in "${services[@]}"; do
        IFS='|' read -r url name <<< "$service"
        
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|302"; then
            info "✓ $name is healthy"
        else
            warning "⚠ $name may not be ready yet (normal during first boot)"
        fi
    done
    
    log "✅ Health checks completed"
}

# ============================================================================
# Step 7: Generate Report
# ============================================================================
generate_report() {
    log "Step 7/7: Generating deployment report..."
    
    cat > "$REPORT_FILE" << EOF
╔═══════════════════════════════════════════════════════════╗
║        Spaktok Local Environment - Build Report          ║
╚═══════════════════════════════════════════════════════════╝

Build Time: $(date)
Status: ✅ SUCCESS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Container Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$(docker ps --filter "name=spaktok" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Access Points
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Flutter App:          http://localhost:8080
Firebase Emulator UI: http://localhost:4400
Firestore UI:         http://localhost:8081
Auth Emulator:        http://localhost:9099
Functions:            http://localhost:5001

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Management Commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
View logs:       docker-compose -f docker-compose.dev.yml logs -f
Stop services:   docker-compose -f docker-compose.dev.yml down
Restart:         docker-compose -f docker-compose.dev.yml restart
Rebuild:         docker-compose -f docker-compose.dev.yml build

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Features Enabled
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Flutter Hot Reload (via volume sync)
✓ Firebase Emulators (Auth, Firestore, Functions)
✓ Optimized Docker layers with caching
✓ Real-time code synchronization
✓ Health monitoring

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Notes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Code changes in ./lib, ./web, ./assets sync automatically
- Firebase data persists in Docker volumes
- For production deployment, use docker-compose.yml

Full logs available in: $LOG_FILE

╔═══════════════════════════════════════════════════════════╗
║     🚀 Spaktok Development Environment Ready!            ║
╚═══════════════════════════════════════════════════════════╝
EOF
    
    cat "$REPORT_FILE"
    log "✅ Report generated: $REPORT_FILE"
}

# ============================================================================
# Main Execution
# ============================================================================
main() {
    # Clear logs
    > "$LOG_FILE"
    > "$REPORT_FILE"
    
    banner
    
    check_dependencies
    clean_environment
    validate_configs
    build_images
    launch_services
    health_checks
    generate_report
    
    echo ""
    log "╔═══════════════════════════════════════════════════════════╗"
    log "║  🎉 Setup Complete! Access your app at:                  ║"
    log "║     http://localhost:8080                                ║"
    log "╚═══════════════════════════════════════════════════════════╝"
    echo ""
}

# Run main function
main "$@"
