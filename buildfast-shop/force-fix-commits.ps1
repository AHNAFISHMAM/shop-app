# Force fix incorrect commits
cd "buildfast-shop"

# Get commit list without pager
git --no-pager log --oneline -30 > commits-temp.txt
$commits = Get-Content commits-temp.txt

Write-Host "Recent commits:"
$commits | Select-Object -First 10

# Find the last good commit (before duplicates)
# Look for the commit before the duplicate 66361d2
$lastGoodCommit = git --no-pager log --oneline --all | Select-String -Pattern "^[a-f0-9]{7}" | Select-Object -First 1 -Skip 1

Write-Host "`nChecking for duplicate commits..."
$duplicates = $commits | Group-Object | Where-Object { $_.Count -gt 1 }

if ($duplicates) {
    Write-Host "Found duplicates, cleaning up..."
    
    # Get the first unique commit hash
    $firstCommit = ($commits[0] -split ' ')[0]
    
    # Reset to origin/main to get clean state
    git fetch origin
    git reset --hard origin/main
    
    Write-Host "Reset to origin/main"
} else {
    Write-Host "No obvious duplicates found in recent commits"
}

# Clean up temp file
Remove-Item commits-temp.txt -ErrorAction SilentlyContinue

Write-Host "`nCurrent status:"
git status --short

