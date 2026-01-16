@echo off
echo ========================================
echo  WeChat SOP Biotech - Deploy to GCP
echo ========================================
echo.

:: Check if gcloud is installed
where gcloud >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Google Cloud SDK not found!
    echo Please install from: https://cloud.google.com/sdk/docs/install
    exit /b 1
)

:: Get current project
for /f "tokens=*" %%i in ('gcloud config get-value project 2^>nul') do set PROJECT_ID=%%i

if "%PROJECT_ID%"=="" (
    echo ERROR: No GCP project configured!
    echo Run: gcloud config set project YOUR_PROJECT_ID
    exit /b 1
)

echo Current project: %PROJECT_ID%
echo.

:: Confirm deployment
set /p confirm="Deploy to Cloud Run? (y/n): "
if /i not "%confirm%"=="y" (
    echo Deployment cancelled.
    exit /b 0
)

echo.
echo Submitting build to Cloud Build...
gcloud builds submit --config cloudbuild.yaml

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================
    echo  Deployment successful!
    echo ========================================
    echo.
    echo Getting service URL...
    gcloud run services describe wechat-sop --region us-central1 --format "value(status.url)"
) else (
    echo.
    echo ERROR: Deployment failed!
    exit /b 1
)
