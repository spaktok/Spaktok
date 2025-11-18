# 🚀 سكريبت سريع لإعداد GitHub Secrets

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   إعداد GitHub Secrets - Spaktok" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "هذا السكريبت سيساعدك في إعداد جميع الأسرار المطلوبة" -ForegroundColor Yellow
Write-Host ""

# Check if GitHub CLI is installed
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI غير مثبت!" -ForegroundColor Red
    Write-Host ""
    Write-Host "الرجاء تثبيت GitHub CLI أولاً:" -ForegroundColor Yellow
    Write-Host "  winget install --id GitHub.cli" -ForegroundColor White
    Write-Host ""
    Write-Host "أو قم بإضافة الأسرار يدوياً من:" -ForegroundColor Yellow
    Write-Host "  GitHub → Settings → Secrets and variables → Actions" -ForegroundColor White
    Write-Host ""
    Write-Host "راجع الدليل: .github/SECRETS_SETUP_GUIDE.md" -ForegroundColor Cyan
    exit 1
}

# Check if logged in
$ghStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ غير مسجل دخول إلى GitHub CLI" -ForegroundColor Red
    Write-Host ""
    Write-Host "الرجاء تسجيل الدخول أولاً:" -ForegroundColor Yellow
    Write-Host "  gh auth login" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ GitHub CLI جاهز" -ForegroundColor Green
Write-Host ""

# Function to add secret
function Add-GitHubSecret {
    param(
        [string]$Name,
        [string]$Description,
        [bool]$Required = $true
    )
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "📌 $Name" -ForegroundColor Cyan
    Write-Host "   $Description" -ForegroundColor Gray
    
    if (-not $Required) {
        Write-Host "   (اختياري)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    
    $skip = Read-Host "هل تريد إضافة هذا السر الآن؟ (y/n/skip)"
    
    if ($skip -eq "skip" -or $skip -eq "s") {
        Write-Host "⏭️  تم التخطي" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    if ($skip -eq "n") {
        Write-Host "⏭️  تم التخطي" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    $value = Read-Host "أدخل القيمة"
    
    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Host "⏭️  تم التخطي (قيمة فارغة)" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    # Add secret using GitHub CLI
    try {
        $value | gh secret set $Name
        Write-Host "✅ تمت إضافة $Name بنجاح" -ForegroundColor Green
    } catch {
        Write-Host "❌ فشل في إضافة $Name" -ForegroundColor Red
        Write-Host "   الخطأ: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "سيتم إضافة الأسرار إلى المستودع الحالي" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "هل تريد المتابعة؟ (y/n)"

if ($confirm -ne "y") {
    Write-Host "تم الإلغاء" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   1️⃣ أسرار Agora" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Add-GitHubSecret -Name "AGORA_APP_ID" -Description "معرف تطبيق Agora (من console.agora.io)" -Required $true
Add-GitHubSecret -Name "AGORA_APP_CERT" -Description "شهادة Agora للتشفير" -Required $true
Add-GitHubSecret -Name "AGORA_CHAT_APP_KEY" -Description "مفتاح Agora Chat" -Required $true
Add-GitHubSecret -Name "AGORA_APP_NAME" -Description "اسم التطبيق في Agora" -Required $false
Add-GitHubSecret -Name "AGORA_ORG_NAME" -Description "اسم المنظمة في Agora" -Required $false

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   2️⃣ أسرار Firebase" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Add-GitHubSecret -Name "FIREBASE_TOKEN" -Description "توكن Firebase CI (من firebase login:ci)" -Required $true
Add-GitHubSecret -Name "FIREBASE_PROJECT_ID" -Description "معرف مشروع Firebase (spaktok-e7866)" -Required $true

Write-Host "📝 ملاحظة: FIREBASE_SERVICE_ACCOUNT يجب أن يكون JSON كامل" -ForegroundColor Yellow
Write-Host "   انسخ محتوى ملف serviceAccountKey.json بالكامل" -ForegroundColor Gray
Write-Host ""
Add-GitHubSecret -Name "FIREBASE_SERVICE_ACCOUNT_SPAKTOK_F7866" -Description "JSON كامل لحساب خدمة Firebase" -Required $true

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   3️⃣ أسرار Docker" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Add-GitHubSecret -Name "DOCKER_USER" -Description "اسم المستخدم في Docker Hub" -Required $true
Add-GitHubSecret -Name "DOCKER_PAT" -Description "Personal Access Token من Docker Hub" -Required $true

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   4️⃣ أسرار Stripe" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Add-GitHubSecret -Name "STRIPE_PUBLISHABLE_KEY" -Description "مفتاح Stripe العام (pk_...)" -Required $true
Add-GitHubSecret -Name "STRIPE_SECRET_KEY" -Description "مفتاح Stripe السري (sk_...)" -Required $true
Add-GitHubSecret -Name "STRIPE_WEBHOOK_SECRET" -Description "سر Webhook من Stripe" -Required $false

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   5️⃣ أسرار Cloudflare" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Add-GitHubSecret -Name "CLOUDFLARE_API_TOKEN" -Description "توكن API من Cloudflare" -Required $false
Add-GitHubSecret -Name "CLOUDFLARE_ACCOUNT_ID" -Description "معرف حساب Cloudflare" -Required $false
Add-GitHubSecret -Name "CLOUDFLARE_R2_ACCESS_KEY_ID" -Description "R2 Access Key ID" -Required $false
Add-GitHubSecret -Name "CLOUDFLARE_R2_SECRET_ACCESS_KEY" -Description "R2 Secret Access Key" -Required $false
Add-GitHubSecret -Name "CLOUDFLARE_STREAM_API_TOKEN" -Description "توكن Cloudflare Stream" -Required $false

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   6️⃣ أسرار اختيارية" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Add-GitHubSecret -Name "CODECOV_TOKEN" -Description "توكن Codecov لتقارير Coverage" -Required $false

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ اكتمل الإعداد!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "للتحقق من الأسرار المضافة:" -ForegroundColor Yellow
Write-Host "  gh secret list" -ForegroundColor White
Write-Host ""

Write-Host "أو تحقق من:" -ForegroundColor Yellow
Write-Host "  GitHub → Settings → Secrets and variables → Actions" -ForegroundColor White
Write-Host ""

Write-Host "لمزيد من التفاصيل، راجع:" -ForegroundColor Yellow
Write-Host "  .github/SECRETS_SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""

Read-Host "اضغط Enter للخروج"
