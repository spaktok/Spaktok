# Spaktok Quick Deploy Script
# PowerShell version for better user experience

function Show-Menu {
    Clear-Host
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   Spaktok Deployment Helper" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Choose an action:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. " -NoNewline -ForegroundColor White
    Write-Host "Deploy Cloudflare Worker" -ForegroundColor Green
    Write-Host "2. " -NoNewline -ForegroundColor White
    Write-Host "Test Worker endpoints (smoke test)" -ForegroundColor Green
    Write-Host "3. " -NoNewline -ForegroundColor White
    Write-Host "Start Backend server" -ForegroundColor Green
    Write-Host "4. " -NoNewline -ForegroundColor White
    Write-Host "Deploy Firebase Functions" -ForegroundColor Green
    Write-Host "5. " -NoNewline -ForegroundColor White
    Write-Host "Build Flutter APK (Android)" -ForegroundColor Green
    Write-Host "6. " -NoNewline -ForegroundColor White
    Write-Host "Build Flutter Web" -ForegroundColor Green
    Write-Host "7. " -NoNewline -ForegroundColor White
    Write-Host "Run Flutter (Windows)" -ForegroundColor Green
    Write-Host "8. " -NoNewline -ForegroundColor White
    Write-Host "Create Cloudflare KV namespace" -ForegroundColor Green
    Write-Host "9. " -NoNewline -ForegroundColor White
    Write-Host "Create Cloudflare R2 bucket" -ForegroundColor Green
    Write-Host "10. " -NoNewline -ForegroundColor White
    Write-Host "View deployment status" -ForegroundColor Green
    Write-Host "0. " -NoNewline -ForegroundColor White
    Write-Host "Exit" -ForegroundColor Red
    Write-Host ""
}

function Deploy-Worker {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Deploying Cloudflare Worker..." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Push-Location cloudflare\workers
    & .\scripts\verify-and-deploy.ps1
    Pop-Location
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Test-Worker {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Testing Worker Endpoints..." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    $workerUrl = Read-Host "Enter your Worker URL"
    Push-Location cloudflare\workers
    & .\scripts\smoke-test.ps1 -BaseUrl $workerUrl
    Pop-Location
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Start-BackendServer {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Starting Backend Server..." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
    if (-not (Test-Path "backend\.env")) {
        Write-Host "WARNING: backend/.env not found!" -ForegroundColor Yellow
        Write-Host "Copy backend/.env.example to backend/.env and configure it first." -ForegroundColor Yellow
        Read-Host "Press Enter to continue"
        return
    }
    
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    Push-Location backend
    npm run dev
    Pop-Location
    Read-Host "Press Enter to continue"
}

function Deploy-Functions {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Deploying Firebase Functions..." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    firebase deploy --only functions
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Build-APK {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Building Flutter APK..." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    flutter build apk --release
    Write-Host ""
    Write-Host "✅ APK location: build\app\outputs\flutter-apk\app-release.apk" -ForegroundColor Green
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Build-Web {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Building Flutter Web..." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    flutter build web
    Write-Host ""
    Write-Host "✅ Output location: build\web\" -ForegroundColor Green
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Run-Windows {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Running Flutter (Windows)..." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    flutter run -d windows
    Read-Host "Press Enter to continue"
}

function Create-KVNamespace {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Creating Cloudflare KV Namespace..." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Push-Location cloudflare\workers
    npx wrangler kv:namespace create "KV_CACHE"
    Write-Host ""
    Write-Host "⚠️ Remember to update wrangler.toml with the ID from above!" -ForegroundColor Yellow
    Pop-Location
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Create-R2Bucket {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Creating Cloudflare R2 Bucket..." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Push-Location cloudflare\workers
    npx wrangler r2 bucket create spaktok-media
    Write-Host ""
    Write-Host "✅ Bucket created: spaktok-media" -ForegroundColor Green
    Write-Host "⚠️ Remember to uncomment R2 binding in wrangler.toml!" -ForegroundColor Yellow
    Pop-Location
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function View-Status {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Project Deployment Status" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    if (Test-Path "DEPLOYMENT_READY.md") {
        Get-Content "DEPLOYMENT_READY.md" | Select-Object -First 50
        Write-Host ""
        Write-Host "... (see DEPLOYMENT_READY.md for full details)" -ForegroundColor Gray
    } else {
        Write-Host "DEPLOYMENT_READY.md not found" -ForegroundColor Red
    }
    
    Write-Host ""
    Read-Host "Press Enter to continue"
}

# Main loop
do {
    Show-Menu
    $choice = Read-Host "Enter your choice (0-10)"
    
    switch ($choice) {
        "1" { Deploy-Worker }
        "2" { Test-Worker }
        "3" { Start-BackendServer }
        "4" { Deploy-Functions }
        "5" { Build-APK }
        "6" { Build-Web }
        "7" { Run-Windows }
        "8" { Create-KVNamespace }
        "9" { Create-R2Bucket }
        "10" { View-Status }
        "0" { 
            Write-Host ""
            Write-Host "Thank you for using Spaktok Deployment Helper!" -ForegroundColor Green
            Write-Host ""
            break
        }
        default {
            Write-Host ""
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
} while ($choice -ne "0")
