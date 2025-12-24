$env:GIT_PAGER = ''
cd buildfast-shop
git fetch origin 2>&1 | Out-Null
git reset --hard origin/main 2>&1 | Out-Null
git push origin main --force 2>&1
Write-Host "Done!"

