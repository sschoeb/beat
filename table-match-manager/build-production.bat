@echo off
echo ========================================
echo Building TFCZ Tisch 1 Battle for Production
echo ========================================
echo.

echo [1/4] Installing backend dependencies...
cd backend
call npm ci --production
if %errorlevel% neq 0 (
    echo Error: Backend dependencies installation failed
    exit /b %errorlevel%
)

echo.
echo [2/4] Building backend...
call npm run build
if %errorlevel% neq 0 (
    echo Error: Backend build failed
    exit /b %errorlevel%
)

echo.
echo [3/4] Installing frontend dependencies...
cd ..\frontend\table-match-frontend
call npm ci
if %errorlevel% neq 0 (
    echo Error: Frontend dependencies installation failed
    exit /b %errorlevel%
)

echo.
echo [4/4] Building frontend for production...
call npx ng build --configuration=production --output-path=../../dist/frontend
if %errorlevel% neq 0 (
    echo Error: Frontend build failed
    exit /b %errorlevel%
)

cd ..\..

echo.
echo ========================================
echo Production build completed successfully!
echo ========================================
echo.
echo Build artifacts:
echo - Backend: backend\dist\
echo - Frontend: dist\frontend\
echo.
echo Next steps:
echo 1. Configure environment variables in .env.production
echo 2. Set up MySQL database
echo 3. Deploy using deploy-production.bat
echo ========================================