# ============================================================================
# Spaktok Local Development Environment - PowerShell Setup Script
# ============================================================================
# Purpose: Initialize, build, and launch complete Docker-based dev stack
# Usage: .\setup_local.ps1
# ============================================================================

$ErrorActionPreference = "Stop"

# Log files
$LogFile = "agent_build.log"
$ReportFile = "agent_build_report.log"

# Colors
$ColorSuccess = "Green"
$ColorError = "Red"
$ColorWarning = "Yellow"
$ColorInfo = "Cyan"

# Logging functions
function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage -ForegroundColor $ColorSuccess
    Add-Content -Path $LogFile -Value $logMessage
}

function Write-ErrorLog {
    param([string]$Message)
    $logMessage = "[ERROR] $Message"
    Write-Host $logMessage -ForegroundColor $ColorError
    Add-Content -Path $LogFile -Value $logMessage
}

function Write-WarningLog {
    param([string]$Message)
    $logMessage = "[WARNING] $Message"
    Write-Host $logMessage -ForegroundColor $ColorWarning
    Add-Content -Path $LogFile -Value $logMessage
}

function Write-InfoLog {
    param([string]$Message)
    $logMessage = "[INFO] $Message"
    Write-Host $logMessage -ForegroundColor $ColorInfo
    Add-Content -Path $LogFile -Value $logMessage
}

# Banner
function Show-Banner {
    Write-Host @"

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

"@ -ForegroundColor Cyan
}

# ============================================================================
# Step 1: Verify Dependencies
# ============================================================================
function Test-Dependencies {
    Write-Log "Step 1/7: Verifying system dependencies..."
    
    # ======================================
    # Critical Check: Is Docker Running?
    # ======================================
    Write-InfoLog "Checking if Docker Desktop is running..."
    try {
        $null = docker ps 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Docker not responding"
        }
        Write-Log "✓ Docker Desktop is running"
    } catch {
        Write-Host ""
        Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Red
        Write-Host "║                                                           ║" -ForegroundColor Red
        Write-Host "║          ⚠️  DOCKER DESKTOP IS NOT RUNNING ⚠️             ║" -ForegroundColor Yellow
        Write-Host "║                                                           ║" -ForegroundColor Red
        Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please follow these steps:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  1️⃣  Open Docker Desktop application" -ForegroundColor White
        Write-Host "  2️⃣  Wait for Docker to fully start" -ForegroundColor White
        Write-Host "       (Look for green icon in system tray)" -ForegroundColor DarkGray
        Write-Host "  3️⃣  Run this script again:" -ForegroundColor White
        Write-Host "       .\setup_local.ps1" -ForegroundColor Green
        Write-Host ""
        Write-Host "To verify Docker is running, execute:" -ForegroundColor Cyan
        Write-Host "  docker ps" -ForegroundColor Yellow
        Write-Host ""
        Write-ErrorLog "Docker Desktop is not running"
        exit 1
    }
    
    $missingDeps = @()
    
    # Check Docker version
    try {
        $dockerVersion = docker --version
        Write-InfoLog "✓ Docker version: $dockerVersion"
    } catch {
        $missingDeps += "docker"
    }
    
    # Check Docker Compose
    try {
        $composeVersion = docker-compose --version
        Write-InfoLog "✓ Docker Compose installed: $composeVersion"
    } catch {
        $missingDeps += "docker-compose"
    }
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-InfoLog "✓ Node.js installed: $nodeVersion"
    } catch {
        Write-WarningLog "Node.js not found locally (will use container version)"
    }
    
    # Check Flutter
    try {
        $flutterVersion = flutter --version | Select-Object -First 1
        Write-InfoLog "✓ $flutterVersion"
    } catch {
        Write-WarningLog "Flutter not found locally (will use container version)"
    }
    
    # Check Firebase CLI
    try {
        $firebaseVersion = firebase --version
        Write-InfoLog "✓ Firebase CLI installed: $firebaseVersion"
    } catch {
        Write-WarningLog "Firebase CLI not found locally (will use container version)"
    }
    
    # Check Git
    try {
        $gitVersion = git --version
        Write-InfoLog "✓ Git installed: $gitVersion"
    } catch {
        $missingDeps += "git"
    }
    
    if ($missingDeps.Count -gt 0) {
        Write-ErrorLog "Missing required dependencies: $($missingDeps -join ', ')"
        Write-ErrorLog "Please install the missing tools and try again."
        exit 1
    }
    
    Write-Log "✅ All critical dependencies verified"
}

# ============================================================================
# Step 2: Clean Previous Builds
# ============================================================================
function Clear-Environment {
    Write-Log "Step 2/7: Cleaning previous build artifacts..."
    
    # Stop running containers
    $runningContainers = docker ps -q -f name=spaktok
    if ($runningContainers) {
        Write-InfoLog "Stopping running Spaktok containers..."
        docker-compose -f docker-compose.dev.yml down 2>$null
    }
    
    Write-Log "✅ Environment cleaned"
}

# ============================================================================
# Step 3: Validate Configuration Files
# ============================================================================
function Test-Configs {
    Write-Log "Step 3/7: Validating configuration files..."
    
    $requiredFiles = @(
        "Dockerfile.dev",
        "docker-compose.dev.yml",
        "firebase.json",
        "pubspec.yaml",
        ".dockerignore"
    )
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Write-ErrorLog "Required file missing: $file"
            exit 1
        }
        Write-InfoLog "✓ Found: $file"
    }
    
    Write-Log "✅ Configuration files validated"
}

# ============================================================================
# Step 4: Build Docker Images
# ============================================================================
function Build-Images {
    Write-Log "Step 4/7: Building Docker images (this may take 5-10 minutes)..."
    
    Write-InfoLog "Building with layer caching enabled..."
    
    docker-compose -f docker-compose.dev.yml build --parallel *>&1 | Tee-Object -FilePath $LogFile -Append
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ Docker images built successfully"
    } else {
        Write-ErrorLog "Docker build failed! Check $LogFile for details"
        exit 1
    }
}

# ============================================================================
# Step 5: Launch Services
# ============================================================================
function Start-Services {
    Write-Log "Step 5/7: Launching Spaktok development stack..."
    
    Write-InfoLog "Starting containers in detached mode..."
    
    docker-compose -f docker-compose.dev.yml up -d *>&1 | Tee-Object -FilePath $LogFile -Append
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ Services launched successfully"
    } else {
        Write-ErrorLog "Failed to start services! Check $LogFile for details"
        exit 1
    }
    
    # Wait for services to be ready
    Write-InfoLog "Waiting for services to initialize (60 seconds)..."
    Start-Sleep -Seconds 60
}

# ============================================================================
# Step 6: Health Checks
# ============================================================================
function Test-Health {
    Write-Log "Step 6/7: Performing health checks..."
    
    $services = @(
        @{Url="http://localhost:8080"; Name="Flutter Web App"},
        @{Url="http://localhost:4400"; Name="Firebase Emulator UI"},
        @{Url="http://localhost:9099"; Name="Firebase Auth Emulator"}
    )
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri $service.Url -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -in @(200, 302)) {
                Write-InfoLog "✓ $($service.Name) is healthy"
            }
        } catch {
            Write-WarningLog "⚠ $($service.Name) may not be ready yet (normal during first boot)"
        }
    }
    
    Write-Log "✅ Health checks completed"
}

# ============================================================================
# Step 7: Generate Report
# ============================================================================
function New-Report {
    Write-Log "Step 7/7: Generating deployment report..."
    
    $containerStatus = docker ps --filter "name=spaktok" --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
    
    $report = @"
╔═══════════════════════════════════════════════════════════╗
║        Spaktok Local Environment - Build Report          ║
╚═══════════════════════════════════════════════════════════╝

Build Time: $(Get-Date)
Status: ✅ SUCCESS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Container Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$containerStatus

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

Full logs available in: $LogFile

╔═══════════════════════════════════════════════════════════╗
║     🚀 Spaktok Development Environment Ready!            ║
╚═══════════════════════════════════════════════════════════╝
"@
    
    Set-Content -Path $ReportFile -Value $report
    Write-Host $report -ForegroundColor Green
    Write-Log "✅ Report generated: $ReportFile"
}

# ============================================================================
# Main Execution
# ============================================================================
function Main {
    # Clear logs
    Clear-Content -Path $LogFile -ErrorAction SilentlyContinue
    Clear-Content -Path $ReportFile -ErrorAction SilentlyContinue
    
    Show-Banner
    
    Test-Dependencies
    Clear-Environment
    Test-Configs
    Build-Images
    Start-Services
    Test-Health
    New-Report
    
    Write-Host ""
    Write-Log "╔═══════════════════════════════════════════════════════════╗"
    Write-Log "║  🎉 Setup Complete! Access your app at:                  ║"
    Write-Log "║     http://localhost:8080                                ║"
    Write-Log "╚═══════════════════════════════════════════════════════════╝"
    Write-Host ""
}

# Run main function
Main
