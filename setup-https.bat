@echo off
REM Batch script to set up local HTTPS certificates for development
echo Setting up HTTPS for local development...
echo.

REM Check if mkcert is installed
where mkcert >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] mkcert is not installed
    echo.
    echo Please install Chocolatey first:
    echo 1. Open PowerShell as Administrator
    echo 2. Run: Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    echo.
    echo Then install mkcert:
    echo 3. Run: choco install mkcert -y
    echo.
    echo After installation, run this script again.
    pause
    exit /b 1
)

echo mkcert is installed!
echo.

REM Install local CA
echo Installing local Certificate Authority...
mkcert -install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install CA
    echo You may need to run this script as Administrator
    pause
    exit /b 1
)

REM Generate certificates for localhost
echo.
echo Generating SSL certificates for localhost...
mkcert -key-file localhost-key.pem -cert-file localhost-cert.pem localhost 127.0.0.1 ::1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to generate certificates
    pause
    exit /b 1
)

echo.
echo ======================================
echo   HTTPS SETUP COMPLETE!
echo ======================================
echo.
echo Certificates created:
echo   - localhost-key.pem
echo   - localhost-cert.pem
echo.
echo You can now run the dev server with HTTPS:
echo   pnpm dev:https
echo.
echo The server will be available at:
echo   https://localhost:3000
echo.
pause
