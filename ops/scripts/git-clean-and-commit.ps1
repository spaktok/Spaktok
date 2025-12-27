#!/usr/bin/env pwsh
# Script to clean Git repository and add only real project files

Write-Host "🧹 تنظيف مستودع Git..." -ForegroundColor Cyan

# Step 1: Reset any staged changes
Write-Host "`n1️⃣ إعادة تعيين الملفات المرحلية..." -ForegroundColor Yellow
git reset HEAD . 2>$null

# Step 2: Remove build artifacts from Git tracking
Write-Host "`n2️⃣ إزالة ملفات البناء من Git..." -ForegroundColor Yellow

$foldersToRemove = @(
    ".dart_tool",
    "build",
    "windows/flutter",
    "linux/flutter",
    "macos/Flutter/ephemeral",
    "ios/Flutter/ephemeral",
    "android/.gradle",
    ".venv",
    "node_modules"
)

foreach ($folder in $foldersToRemove) {
    if (Test-Path $folder) {
        Write-Host "   إزالة $folder من Git..." -ForegroundColor Gray
        git rm -r --cached "$folder" 2>$null
    }
}

# Step 3: Add all project files (respecting .gitignore)
Write-Host "`n3️⃣ إضافة ملفات المشروع الحقيقية..." -ForegroundColor Yellow
git add .

# Step 4: Show status
Write-Host "`n4️⃣ عرض الملفات التي سيتم إضافتها..." -ForegroundColor Yellow
$status = git status --short
$addedFiles = ($status | Where-Object { $_ -match "^A " }).Count
$modifiedFiles = ($status | Where-Object { $_ -match "^M " }).Count
$deletedFiles = ($status | Where-Object { $_ -match "^D " }).Count

Write-Host "`n📊 الإحصائيات:" -ForegroundColor Cyan
Write-Host "   ✅ ملفات جديدة: $addedFiles" -ForegroundColor Green
Write-Host "   📝 ملفات معدلة: $modifiedFiles" -ForegroundColor Yellow
Write-Host "   ❌ ملفات محذوفة: $deletedFiles" -ForegroundColor Red

# Step 5: Ask for confirmation
Write-Host "`n❓ هل تريد عمل commit لهذه التغييرات؟ (y/n): " -NoNewline -ForegroundColor Yellow
$confirmation = Read-Host

if ($confirmation -eq 'y' -or $confirmation -eq 'Y' -or $confirmation -eq 'yes') {
    Write-Host "`n5️⃣ إنشاء commit..." -ForegroundColor Yellow
    $commitMessage = "Clean repository - keep only real Spaktok project files

- Removed build artifacts from Git tracking
- Removed platform-specific generated files (.dart_tool, build, flutter/ephemeral)
- Removed dependencies (node_modules, .venv)
- Updated .gitignore to prevent future tracking of build artifacts
- All real project files are now tracked with proper structure"
    
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ تم إنشاء commit بنجاح!" -ForegroundColor Green
        
        Write-Host "`n❓ هل تريد دفع التغييرات إلى GitHub؟ (y/n): " -NoNewline -ForegroundColor Yellow
        $pushConfirmation = Read-Host
        
        if ($pushConfirmation -eq 'y' -or $pushConfirmation -eq 'Y' -or $pushConfirmation -eq 'yes') {
            Write-Host "`n6️⃣ دفع التغييرات..." -ForegroundColor Yellow
            git push origin main
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ تم دفع التغييرات بنجاح!" -ForegroundColor Green
            } else {
                Write-Host "   ❌ فشل دفع التغييرات. الرجاء المحاولة يدوياً." -ForegroundColor Red
            }
        }
    } else {
        Write-Host "   ❌ فشل إنشاء commit." -ForegroundColor Red
    }
} else {
    Write-Host "`n⏸️  تم الإلغاء. يمكنك مراجعة التغييرات باستخدام: git status" -ForegroundColor Yellow
}

Write-Host "`n✅ انتهى!" -ForegroundColor Green
