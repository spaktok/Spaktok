#!/usr/bin/env pwsh
# Spaktok Environment Diagnostic Script
# This script checks all required tools and configurations for Spaktok development

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SPAKTOK ENVIRONMENT DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$script:issuesFound = 0
$script:warningsFound = 0

function Test-Command {
    param([string]$Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Failure {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    $script:issuesFound++
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
    $script:warningsFound++
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

# ============================================
# 1. PowerShell Check
# ============================================
Write-Host "1. PowerShell Configuration" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

$psVersion = $PSVersionTable.PSVersion
Write-Info "PowerShell Version: $($psVersion.Major).$($psVersion.Minor).$($psVersion.Patch)"

if ($psVersion.Major -ge 5) {
    Write-Success "PowerShell version is adequate (>= 5.0)"
} else {
    Write-Failure "PowerShell version is too old. Please upgrade to PowerShell 5.0 or later"
}

Write-Host ""

# ============================================
# 2. PATH Environment Variable
# ============================================
Write-Host "2. PATH Environment Variable" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

$pathEntries = $env:PATH -split ';'
Write-Info "Total PATH entries: $($pathEntries.Count)"

# Check for common development paths
$commonPaths = @(
    "flutter\bin",
    "dart-sdk\bin",
    "nodejs",
    "Python",
    "Git\cmd"
)

foreach ($path in $commonPaths) {
    $found = $pathEntries | Where-Object { $_ -like "*$path*" }
    if ($found) {
        Write-Success "Found $path in PATH"
    }
}

Write-Host ""

# ============================================
# 3. Flutter SDK
# ============================================
Write-Host "3. Flutter SDK" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

if (Test-Command "flutter") {
    Write-Success "Flutter is installed"
    
    try {
        $flutterVersion = flutter --version 2>&1 | Select-String "Flutter" | Select-Object -First 1
        Write-Info "$flutterVersion"
        
        # Check Flutter doctor
        Write-Info "Running Flutter doctor..."
        flutter doctor --version
        
    } catch {
        Write-Warning "Could not get Flutter version details"
    }
} else {
    Write-Failure "Flutter is NOT installed or not in PATH"
    Write-Info "Download from: https://flutter.dev/docs/get-started/install"
}

Write-Host ""

# ============================================
# 4. Dart SDK
# ============================================
Write-Host "4. Dart SDK" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

if (Test-Command "dart") {
    Write-Success "Dart is installed"
    
