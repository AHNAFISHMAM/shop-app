# Automated rebase to fix problematic commits
Write-Host "Preparing rebase..."

# Find the parent of 2d5baa0
$parentCommit = git rev-parse 2d5baa0^
Write-Host "Rebasing from: $parentCommit"

# Create rebase todo file
$rebaseTodo = @"
pick 2d5baa0 fix(types): add missing type declarations and fix critical type errors
reword b3e9d28 update
drop de3cc16 Chore: Remove temporary commit message fix documentation files
pick f9ca4e1 fix(types): add missing exports to type declarations
pick eeb4ef2 fix(types): fix App.tsx, AboutGalleryUploader, and BackgroundManager type errors
pick d98953f fix(types): fix all TypeScript errors in admin pages, error boundaries, and utilities
pick e9b4af1 fix(types): final fixes for import.meta.env type safety
pick 8a60f9f fix(types): fix all TypeScript errors in AdminReservations and AdminSettings
pick 9225989 fix(types): fix all remaining TypeScript errors in admin pages
"@

# Set up environment for automated rebase
$env:GIT_SEQUENCE_EDITOR = "powershell -Command `"Set-Content `$args[0] @'`n$rebaseTodo`n'@`""
$env:GIT_EDITOR = "powershell -Command `"Set-Content `$args[0] 'chore: update project configuration and dependencies'`""

Write-Host "Starting rebase..."
git rebase -i $parentCommit

if ($LASTEXITCODE -eq 0) {
    Write-Host "Rebase completed successfully!"
} else {
    Write-Host "Rebase had issues. You may need to resolve conflicts manually."
}

