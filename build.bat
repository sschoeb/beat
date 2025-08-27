@echo off
echo Building Table Match Manager...
echo.

REM Run the Node.js build script
node build.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Build failed!
    exit /b %ERRORLEVEL%
)

echo.
echo Build completed successfully!
pause