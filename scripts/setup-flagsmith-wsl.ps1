# setup-flagsmith-wsl.ps1
# Run this from Windows PowerShell (as normal user — it will ask for WSL sudo password once)
# Usage:
#   cd d:\orqesta
#   .\scripts\setup-flagsmith-wsl.ps1

Write-Host ""
Write-Host "=== orqesta — Flagsmith Self-Hosted Setup ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will:"
Write-Host "  1. Install Docker Engine in WSL2 Ubuntu"
Write-Host "  2. Start Flagsmith at http://localhost:8000"
Write-Host ""
Write-Host "You will be asked for your WSL sudo password." -ForegroundColor Yellow
Write-Host ""

# Convert Windows path to WSL path
$scriptPath = "/mnt/d/orqesta/scripts/install-docker-wsl.sh"

# Run the shell script inside WSL (interactive so sudo password prompt works)
wsl -d Ubuntu -- bash "$scriptPath"

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Flagsmith is running at: http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open http://localhost:8000 in your browser"
Write-Host "  2. Create your admin account and organisation"
Write-Host "  3. Create a project called 'orqesta Demo'"
Write-Host "  4. Create Staging and Production environments"
Write-Host "  5. Create feature flags with different states in each environment"
Write-Host "  6. Get your API token from Organisation Settings → API Keys"
Write-Host ""
Write-Host "Then run orqesta:" -ForegroundColor Yellow
Write-Host '  $env:FLAGSMITH_API_KEY = "your_token"'
Write-Host '  $env:FLAGSMITH_API_URL = "http://localhost:8000/api/v1"'
Write-Host '  node d:\orqesta\dist\cli\index.js doctor'
Write-Host ""
