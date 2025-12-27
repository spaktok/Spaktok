@echo off
REM Quick deployment script for Spaktok project
echo ========================================
echo Spaktok Deployment Helper
echo ========================================
echo.

:menu
echo Choose an action:
echo.
echo 1. Deploy Cloudflare Worker
echo 2. Test Worker endpoints (smoke test)
echo 3. Start Backend server
echo 4. Deploy Firebase Functions
echo 5. Build Flutter APK
echo 6. Build Flutter Web
echo 7. Run Flutter (Windows)
echo 8. View deployment status
echo 9. Exit
echo.
set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto deploy_worker
if "%choice%"=="2" goto test_worker
if "%choice%"=="3" goto start_backend
if "%choice%"=="4" goto deploy_functions
if "%choice%"=="5" goto build_apk
if "%choice%"=="6" goto build_web
if "%choice%"=="7" goto run_windows
if "%choice%"=="8" goto view_status
if "%choice%"=="9" goto end

echo Invalid choice. Please try again.
echo.
goto menu

:deploy_worker
echo.
echo ========================================
echo Deploying Cloudflare Worker...
echo ========================================
cd cloudflare\workers
powershell -ExecutionPolicy Bypass -File .\scripts\verify-and-deploy.ps1
cd ..\..
echo.
pause
goto menu

:test_worker
echo.
echo ========================================
echo Testing Worker Endpoints...
echo ========================================
set /p worker_url="Enter your Worker URL: "
cd cloudflare\workers
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1 -BaseUrl "%worker_url%"
cd ..\..
echo.
pause
goto menu

:start_backend
echo.
echo ========================================
echo Starting Backend Server...
echo ========================================
echo Make sure you have created backend/.env file!
echo Press Ctrl+C to stop the server
echo.
cd backend
call npm run dev
cd ..
pause
goto menu

:deploy_functions
echo.
echo ========================================
echo Deploying Firebase Functions...
echo ========================================
firebase deploy --only functions
echo.
pause
goto menu

:build_apk
echo.
echo ========================================
echo Building Flutter APK...
echo ========================================
flutter build apk --release
echo.
echo APK location: build\app\outputs\flutter-apk\app-release.apk
echo.
pause
goto menu

:build_web
echo.
echo ========================================
echo Building Flutter Web...
echo ========================================
flutter build web
echo.
echo Output location: build\web\
echo.
pause
goto menu

:run_windows
echo.
echo ========================================
echo Running Flutter (Windows)...
echo ========================================
flutter run -d windows
pause
goto menu

:view_status
echo.
echo ========================================
echo Project Deployment Status
echo ========================================
type DEPLOYMENT_READY.md | more
echo.
pause
goto menu

:end
echo.
echo Thank you for using Spaktok Deployment Helper!
exit /b 0
