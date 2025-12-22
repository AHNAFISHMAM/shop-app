# sync-docs.ps1
# Syncs documentation files from docs/ to docs/all-docs/
# Part of EvolveDoc System

$SourceDir = "docs"
$TargetDir = "docs/all-docs"

Write-Host "🔄 Syncing documentation files..." -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    Write-Host "✅ Created directory: $TargetDir" -ForegroundColor Green
}

$SyncedCount = 0

Write-Host "📋 Syncing core system files..." -ForegroundColor Yellow
$CoreFiles = @("DOCUMENTATION_EVOLUTION_SYSTEM.md", "AI_AGENT_DOCUMENTATION_RULES.md", "CONCEPTS_COMPARISON.md")

foreach ($file in $CoreFiles) {
    $source = Join-Path $SourceDir $file
    $target = Join-Path $TargetDir $file
    if (Test-Path $source) {
        Copy-Item $source $target -Force
        $SyncedCount++
        Write-Host "  ✓ $file" -ForegroundColor Green
    }
}

Write-Host "`n📘 Syncing master prompts..." -ForegroundColor Yellow
$MasterPrompts = Get-ChildItem -Path $SourceDir -Filter "MASTER_*.md" | Where-Object { $_.Name -notmatch "(ANALYSIS|SUMMARY|SYNC|CONSISTENCY|USAGE|CURSOR)" }

foreach ($file in $MasterPrompts) {
    $target = Join-Path $TargetDir $file.Name
    Copy-Item $file.FullName $target -Force
    $SyncedCount++
    Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
}

Write-Host "`n📖 Syncing guides..." -ForegroundColor Yellow
$Guides = @("MIGRATION_GUIDE_OTHER_PROJECTS.md", "MASTER_PROMPTS_USAGE_GUIDE.md", "README.md")

foreach ($file in $Guides) {
    $source = Join-Path $SourceDir $file
    $target = Join-Path $TargetDir $file
    if (Test-Path $source) {
        Copy-Item $source $target -Force
        $SyncedCount++
        Write-Host "  ✓ $file" -ForegroundColor Green
    }
}

Write-Host "`n✅ Sync complete! Synced $SyncedCount files." -ForegroundColor Green
Write-Host "📁 Source: $SourceDir" -ForegroundColor Cyan
Write-Host "📁 Target: $TargetDir" -ForegroundColor Cyan
Write-Host "🎯 System: EvolveDoc v1.1.0" -ForegroundColor Magenta
