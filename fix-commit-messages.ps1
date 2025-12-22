# PowerShell script to fix commit messages
# This will use git filter-branch to rewrite commit messages

$commits = @{
    "082374b" = "Fix: Remove duplicate code and improve validation in AdminMenuItems"
    "2f59cb3" = "Fix: Add stock validation and dietary tags validation"  
    "797ef0b" = "Refactor: Major app renovation and code improvements"
    "68abdb7" = "Feat: Initial shop app implementation"
    "086b204" = "Feat: Add Star Cafe menu and theme"
}

Write-Host "To fix commit messages, you need to use interactive rebase:"
Write-Host "git rebase -i HEAD~10"
Write-Host ""
Write-Host "Then change 'pick' to 'reword' for commits you want to fix"
Write-Host "Or use: git commit --amend for the most recent commit"

