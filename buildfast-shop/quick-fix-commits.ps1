# Quick force fix commits
Set-Location "buildfast-shop"

Write-Host "Fetching latest from origin..."
git fetch origin --quiet

Write-Host "Resetting to origin/main..."
git reset --hard origin/main

Write-Host "Current HEAD:"
git rev-parse --short HEAD

Write-Host "`nStatus:"
git status --short

Write-Host "`nReady to force push. Run: git push origin main --force"

