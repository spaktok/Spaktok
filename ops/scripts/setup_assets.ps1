# ===================================================================
# سكريبت تنزيل وإعداد الأصول - Spaktok
# ===================================================================

Write-Host "🎨 بدء إعداد أصول Spaktok..." -ForegroundColor Cyan
Write-Host ""

# ===================================================================
# 1. إنشاء المجلدات
# ===================================================================
Write-Host "📁 إنشاء المجلدات..." -ForegroundColor Yellow

$folders = @(
    "assets\sounds",
    "assets\images",
    "assets\backgrounds",
    "assets\filters\ar_masks",
    "assets\animations"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "  ✓ تم إنشاء: $folder" -ForegroundColor Green
    } else {
        Write-Host "  → موجود: $folder" -ForegroundColor Gray
    }
}

Write-Host ""

# ===================================================================
# 2. تنزيل أصوات مجانية (من Freesound.org)
# ===================================================================
Write-Host "🔊 إعداد ملفات الأصوات..." -ForegroundColor Yellow

$soundFiles = @(
    "send_message.mp3",
    "receive_message.mp3",
    "notification.mp3",
    "gift_sent.mp3",
    "like.mp3",
    "camera_shutter.mp3",
    "error.mp3",
    "success.mp3",
    "warning.mp3",
    "tap.mp3",
    "swipe.mp3",
    "lock.mp3",
    "unlock.mp3"
)

Write-Host "  ℹ️  يمكنك تنزيل الأصوات من:" -ForegroundColor Cyan
Write-Host "     https://freesound.org/" -ForegroundColor Cyan
Write-Host "     https://mixkit.co/free-sound-effects/" -ForegroundColor Cyan
Write-Host "     https://www.zapsplat.com/" -ForegroundColor Cyan
Write-Host ""

foreach ($sound in $soundFiles) {
    $path = "assets\sounds\$sound"
    if (-not (Test-Path $path)) {
        # إنشاء ملف placeholder نصي
        @"
# ملف صوت placeholder
# اسم الملف: $sound
# يجب استبداله بملف MP3 حقيقي

التنزيل من:
- https://freesound.org/
- https://mixkit.co/
- https://www.zapsplat.com/

البحث عن:
$($sound -replace '.mp3','')
"@ | Out-File -FilePath "$path.txt" -Encoding UTF8
        
        Write-Host "  ⚠️  مطلوب: $sound" -ForegroundColor Yellow
    } else {
        Write-Host "  ✓ موجود: $sound" -ForegroundColor Green
    }
}

Write-Host ""

# ===================================================================
# 3. إنشاء صور placeholder للوغو
# ===================================================================
Write-Host "🖼️  إعداد الصور..." -ForegroundColor Yellow

$imageFiles = @(
    @{name="logo.png"; desc="لوغو التطبيق الأساسي"},
    @{name="logo_dark.png"; desc="لوغو الثيم الداكن"},
    @{name="logo_anime.png"; desc="لوغو ثيم الأنمي"},
    @{name="splash_bg.png"; desc="خلفية شاشة البداية"}
)

foreach ($img in $imageFiles) {
    $path = "assets\images\$($img.name)"
    if (-not (Test-Path $path)) {
        @"
# صورة placeholder
# الملف: $($img.name)
# الوصف: $($img.desc)

يمكنك إنشاء اللوغو من:
- https://www.canva.com/
- https://www.figma.com/
- https://logomaker.com/

المواصفات المطلوبة:
- الحجم: 1024x1024 بكسل
- الصيغة: PNG مع خلفية شفافة
- الألوان: متوافقة مع الثيمات الثلاثة
"@ | Out-File -FilePath "$path.txt" -Encoding UTF8
        
        Write-Host "  ⚠️  مطلوب: $($img.name) - $($img.desc)" -ForegroundColor Yellow
    } else {
        Write-Host "  ✓ موجود: $($img.name)" -ForegroundColor Green
    }
}

Write-Host ""

# ===================================================================
# 4. إنشاء خلفيات gradient placeholder
# ===================================================================
Write-Host "🎨 إعداد الخلفيات..." -ForegroundColor Yellow

$backgrounds = @(
    "gradient_1.png",
    "gradient_2.png",
    "pattern_1.png",
    "pattern_2.png",
    "anime_1.png",
    "anime_2.png"
)

foreach ($bg in $backgrounds) {
    $path = "assets\backgrounds\$bg"
    if (-not (Test-Path $path)) {
        @"
# خلفية placeholder
# الملف: $bg

يمكنك إنشاء خلفيات من:
- https://coolbackgrounds.io/
- https://www.magicpattern.design/
- https://www.vecteezy.com/

المواصفات:
- الحجم: 1080x1920 بكسل (شاشة هاتف)
- الصيغة: PNG أو JPG
- الجودة: عالية
"@ | Out-File -FilePath "$path.txt" -Encoding UTF8
        
        Write-Host "  ⚠️  مطلوب: $bg" -ForegroundColor Yellow
    } else {
        Write-Host "  ✓ موجود: $bg" -ForegroundColor Green
    }
}

Write-Host ""

# ===================================================================
# 5. عرض الملخص
# ===================================================================
Write-Host "📊 ملخص الإعداد:" -ForegroundColor Cyan
Write-Host ""

$totalSounds = $soundFiles.Count
$existingSounds = ($soundFiles | Where-Object { Test-Path "assets\sounds\$_" }).Count
$totalImages = $imageFiles.Count
$existingImages = ($imageFiles | Where-Object { Test-Path "assets\images\$($_.name)" }).Count
$totalBgs = $backgrounds.Count
$existingBgs = ($backgrounds | Where-Object { Test-Path "assets\backgrounds\$_" }).Count

Write-Host "  🔊 الأصوات: $existingSounds/$totalSounds" -ForegroundColor $(if($existingSounds -eq $totalSounds){"Green"}else{"Yellow"})
Write-Host "  🖼️  الصور: $existingImages/$totalImages" -ForegroundColor $(if($existingImages -eq $totalImages){"Green"}else{"Yellow"})
Write-Host "  🎨 الخلفيات: $existingBgs/$totalBgs" -ForegroundColor $(if($existingBgs -eq $totalBgs){"Green"}else{"Yellow"})

Write-Host ""

# ===================================================================
# 6. إنشاء ملف README للأصول
# ===================================================================
$readmeContent = @"
# 📦 دليل الأصول - Spaktok

## 🔊 الأصوات (assets/sounds/)

يجب إضافة 13 ملف MP3:

| الملف | الاستخدام | المدة المقترحة |
|-------|----------|----------------|
| send_message.mp3 | إرسال رسالة | 0.3-0.5 ثانية |
| receive_message.mp3 | استقبال رسالة | 0.3-0.5 ثانية |
| notification.mp3 | إشعار | 0.5-1 ثانية |
| gift_sent.mp3 | إرسال هدية | 1-2 ثانية |
| like.mp3 | إعجاب | 0.2-0.3 ثانية |
| camera_shutter.mp3 | التقاط صورة | 0.1-0.2 ثانية |
| error.mp3 | خطأ | 0.5-1 ثانية |
| success.mp3 | نجاح | 0.5-1 ثانية |
| warning.mp3 | تحذير | 0.5-1 ثانية |
| tap.mp3 | نقرة | 0.05-0.1 ثانية |
| swipe.mp3 | سحب | 0.2-0.3 ثانية |
| lock.mp3 | قفل | 0.3-0.5 ثانية |
| unlock.mp3 | فتح القفل | 0.3-0.5 ثانية |

### مصادر مجانية:
- 🔗 [Freesound.org](https://freesound.org/)
- 🔗 [Mixkit](https://mixkit.co/free-sound-effects/)
- 🔗 [Zapsplat](https://www.zapsplat.com/)
- 🔗 [Pixabay Sounds](https://pixabay.com/sound-effects/)

---

## 🖼️ الصور (assets/images/)

| الملف | الوصف | المواصفات |
|-------|-------|-----------|
| logo.png | اللوغو الأساسي | 1024x1024 PNG شفاف |
| logo_dark.png | لوغو الثيم الداكن | 1024x1024 PNG شفاف |
| logo_anime.png | لوغو ثيم الأنمي | 1024x1024 PNG شفاف |
| splash_bg.png | خلفية البداية | 1080x1920 PNG |

### أدوات التصميم:
- 🔗 [Canva](https://www.canva.com/)
- 🔗 [Figma](https://www.figma.com/)
- 🔗 [Logo Maker](https://www.logomaker.com/)

---

## 🎨 الخلفيات (assets/backgrounds/)

| الملف | النوع | المواصفات |
|-------|-------|-----------|
| gradient_1.png | تدرج بنفسجي | 1080x1920 |
| gradient_2.png | تدرج وردي | 1080x1920 |
| pattern_1.png | نمط هندسي | 500x500 تكراري |
| pattern_2.png | نمط نقاط | 500x500 تكراري |
| anime_1.png | خلفية أنمي - سماء | 1080x1920 |
| anime_2.png | خلفية أنمي - مدينة | 1080x1920 |

### مصادر الخلفيات:
- 🔗 [Cool Backgrounds](https://coolbackgrounds.io/)
- 🔗 [Magic Pattern](https://www.magicpattern.design/)
- 🔗 [Vecteezy](https://www.vecteezy.com/)
- 🔗 [Unsplash](https://unsplash.com/)

---

## 📝 ملاحظات

1. **جودة الملفات:**
   - استخدم ملفات عالية الجودة
   - اضغط الصور لتقليل حجم التطبيق
   - استخدم صيغة MP3 للأصوات (128-192 kbps)

2. **الترخيص:**
   - تأكد من أن جميع الأصول مجانية الاستخدام
   - اقرأ شروط الترخيص قبل الاستخدام
   - احتفظ بنسخة من التراخيص

3. **الاختبار:**
   - اختبر جميع الأصوات على أجهزة مختلفة
   - تأكد من وضوح الصور على شاشات مختلفة
   - اختبر الخلفيات مع الثيمات الثلاثة

---

## 🚀 التطبيق بعد الإضافة

بعد إضافة جميع الأصول، قم بتشغيل:

``````bash
# تحديث التطبيق
flutter clean
flutter pub get

# تشغيل على Android
flutter run

# تشغيل على iOS
flutter run -d ios
``````

---

**تم الإنشاء بواسطة:** سكريبت setup_assets.ps1  
**التاريخ:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$readmeContent | Out-File -FilePath "assets\README.md" -Encoding UTF8
Write-Host "✓ تم إنشاء assets\README.md" -ForegroundColor Green

Write-Host ""
Write-Host "✅ اكتمل الإعداد!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 الخطوات التالية:" -ForegroundColor Cyan
Write-Host "  1. راجع ملف assets\README.md للتفاصيل" -ForegroundColor White
Write-Host "  2. قم بتنزيل الأصول من المصادر المذكورة" -ForegroundColor White
Write-Host "  3. ضع الملفات في المجلدات المناسبة" -ForegroundColor White
Write-Host "  4. قم بتشغيل: flutter pub get" -ForegroundColor White
Write-Host "  5. اختبر التطبيق: flutter run" -ForegroundColor White
Write-Host ""
