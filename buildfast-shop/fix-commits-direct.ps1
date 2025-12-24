# Direct approach to fix commits
# Fix commit b3e9d28 "update" - amend it with a better message
# Remove commit de3cc16 if it's problematic

Write-Host "Fixing problematic commits..."

# First, let's check what commit b3e9d28 contains
Write-Host "`nChecking commit b3e9d28..."
git show b3e9d28 --stat --oneline --no-pager

# Start interactive rebase from before problematic commits
# We'll rebase from 2d5baa0^ (the commit before 2d5baa0)
Write-Host "`nStarting rebase to fix commits..."
$env:GIT_SEQUENCE_EDITOR = "powershell -Command `"`$content = Get-Content `$args[0]; `$content = `$content -replace '^pick b3e9d28', 'reword b3e9d28'; `$content = `$content -replace '^pick de3cc16', 'drop de3cc16'; Set-Content `$args[0] `$content`""
$env:GIT_EDITOR = "powershell -Command `"Set-Content `$args[0] 'chore: update project configuration and dependencies'`""

git rebase -i 2d5baa0^

