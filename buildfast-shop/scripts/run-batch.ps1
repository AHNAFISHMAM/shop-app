# Helper script to run batches from any directory
# Usage: .\scripts\run-batch.ps1 [batch-number]
# Or: npm run batch:run -- 1

param(
    [Parameter(Mandatory=$false)]
    [int]$BatchNumber = 1
)

# Support npm script arguments
if ($args.Count -gt 0) {
    $BatchNumber = [int]$args[0]
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$batchScript = Join-Path $projectRoot "parallel-batches\process-batch-$BatchNumber.ps1"

if (-not (Test-Path $batchScript)) {
    Write-Host "Error: Batch script not found: $batchScript" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run 'npm run batch:generate' first to create batches" -ForegroundColor Yellow
    exit 1
}

Write-Host "Running batch $BatchNumber..." -ForegroundColor Cyan
Write-Host "Script: $batchScript" -ForegroundColor Gray
Write-Host ""

Set-Location $projectRoot
& $batchScript

