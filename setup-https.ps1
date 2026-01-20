# PowerShell script to set up local HTTPS certificates for development
Write-Host "Setting up HTTPS for local development..." -ForegroundColor Green

# Check if mkcert is installed
$mkcertInstalled = Get-Command mkcert -ErrorAction SilentlyContinue

if (-not $mkcertInstalled) {
    Write-Host "`nmkcert is not installed. Installing via chocolatey..." -ForegroundColor Yellow

    # Check if chocolatey is installed
    $chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue

    if (-not $chocoInstalled) {
        Write-Host "`nChocolatey is not installed. Please install it first:" -ForegroundColor Red
        Write-Host "Run PowerShell as Administrator and execute:" -ForegroundColor Yellow
        Write-Host 'Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString("https://community.chocolatey.org/install.ps1"))' -ForegroundColor Cyan
        Write-Host "`nAfter installing Chocolatey, run this script again." -ForegroundColor Yellow
        exit 1
    }

    # Install mkcert
    Write-Host "Installing mkcert..." -ForegroundColor Yellow
    choco install mkcert -y

    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nFailed to install mkcert. Please install it manually:" -ForegroundColor Red
        Write-Host "choco install mkcert" -ForegroundColor Yellow
        exit 1
    }

    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

Write-Host "`nmkcert is installed!" -ForegroundColor Green

# Install local CA
Write-Host "`nInstalling local Certificate Authority..." -ForegroundColor Yellow
mkcert -install

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nFailed to install CA. You may need to run this script as Administrator." -ForegroundColor Red
    exit 1
}

# Generate certificates for localhost
Write-Host "`nGenerating SSL certificates for localhost..." -ForegroundColor Yellow
mkcert -key-file localhost-key.pem -cert-file localhost-cert.pem localhost 127.0.0.1 ::1

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nFailed to generate certificates." -ForegroundColor Red
    exit 1
}

Write-Host "`n✓ HTTPS setup complete!" -ForegroundColor Green
Write-Host "`nCertificates created:" -ForegroundColor Cyan
Write-Host "  - localhost-key.pem" -ForegroundColor White
Write-Host "  - localhost-cert.pem" -ForegroundColor White
Write-Host "`nYou can now run the dev server with HTTPS:" -ForegroundColor Cyan
Write-Host "  pnpm dev:https" -ForegroundColor White
Write-Host "`nThe server will be available at:" -ForegroundColor Cyan
Write-Host "  https://localhost:3000" -ForegroundColor White
Write-Host ""
