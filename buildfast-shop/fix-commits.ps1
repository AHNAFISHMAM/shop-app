# Disable pager
$env:GIT_PAGER = ''

# Get commit list and identify problematic ones
Write-Host "Getting commit history..."
$commits = git log --oneline -50 2>&1 | Out-String
Write-Host $commits

# Based on earlier output, we know these commits have issues:
# b3e9d28 update - poor commit message
# de3cc16 Chore: Remove temporary commit message fix documentation files

# Find the commit before the problematic ones to rebase from
Write-Host "`nFinding base commit for rebase..."
$baseCommit = git log --format="%H" -1 HEAD~20 2>&1 | Out-String
Write-Host "Base commit: $baseCommit"

