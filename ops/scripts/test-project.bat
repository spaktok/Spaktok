@echo off
echo ========================================
echo   Spaktok Project - Quick Test Suite
echo ========================================
echo.

echo [1/5] Checking Flutter setup...
flutter --version
echo.

echo [2/5] Checking available devices...
flutter devices
echo.

echo [3/5] Analyzing code...
flutter analyze --no-pub
echo.

echo [4/5] Checking Firebase service account...
if exist "functions\serviceAccountKey.json" (
    echo [OK] Firebase service account key found!
) else (
    echo [ERROR] Firebase service account key NOT found!
)
echo.

echo [5/5] Checking environment...
echo ANDROID_HOME: %ANDROID_HOME%
echo.

echo ========================================
echo   Test Complete!
echo ========================================
echo.
echo Ready to run! Choose your platform:
echo.
echo   1. Windows Desktop:  flutter run -d windows
echo   2. Web Server:       flutter run -d web-server --web-port=8080
echo   3. Android Emulator: flutter run -d android
echo.
pause
