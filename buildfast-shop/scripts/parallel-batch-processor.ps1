# Manual Parallel Batch Processor for TypeScript Errors
# Usage: .\scripts\parallel-batch-processor.ps1

Write-Host "=== Manual Parallel Batch Processor ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get error breakdown
Write-Host "Step 1: Analyzing errors..." -ForegroundColor Yellow
node scripts/group-errors.js

Write-Host ""
Write-Host "Step 2: Grouping by file..." -ForegroundColor Yellow
node scripts/errors-by-file.js

Write-Host ""
Write-Host "Step 3: Generating batches..." -ForegroundColor Yellow

# Get files with errors using node script
Write-Host "Extracting files with errors..." -ForegroundColor Gray
$tempScript = @"
const { execSync } = require('child_process');
try {
  let output;
  try {
    output = execSync('tsc --noEmit 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  } catch (error) {
    output = error.stdout?.toString() || error.stderr?.toString() || error.message || '';
  }
  const lines = output.split('\n');
  const files = new Set();
  lines.forEach(line => {
    // Match: src/path/to/file.tsx(123,45): error TS...
    const match = line.match(/^(src[^(]+\.(ts|tsx))\(/);
    if (match) {
      const file = match[1].replace(/\\/g, '/');
      // Exclude .d.ts files and config files
      if (!file.endsWith('.d.ts') && 
          !file.includes('tsconfig') && 
          !file.includes('.config.')) {
        files.add(file);
      }
    }
  });
  const fileArray = Array.from(files).sort();
  if (fileArray.length > 0) {
    console.log(fileArray.join('\n'));
  }
} catch (error) {
  console.error('Error extracting files:', error.message);
}
"@
$tempFile = [System.IO.Path]::GetTempFileName() + ".js"
$tempScript | Out-File -FilePath $tempFile -Encoding UTF8
try {
    $fileList = node $tempFile 2>&1
    $files = $fileList | Where-Object { 
        $_ -ne '' -and 
        $_ -match '^src/' -and 
        $_ -notmatch '\.d\.ts$' -and
        $_ -notmatch 'tsconfig' -and
        $_ -notmatch '\.config\.'
    } | Sort-Object -Unique
} catch {
    Write-Host "Warning: Could not extract files, using empty list" -ForegroundColor Yellow
    $files = @()
} finally {
    Remove-Item $tempFile -ErrorAction SilentlyContinue
}

if ($files.Count -eq 0) {
    Write-Host "No files with errors found!" -ForegroundColor Green
    exit 0
}

# Create batches (4 files per batch)
$batchSize = 4
$batches = @()
for ($i = 0; $i -lt $files.Count; $i += $batchSize) {
    $batch = $files[$i..([Math]::Min($i + $batchSize - 1, $files.Count - 1))]
    $batches += ,@($batch)
}

Write-Host ""
Write-Host "Created $($batches.Count) batches:" -ForegroundColor Green
Write-Host ""

# Generate batch files
$batchDir = "parallel-batches"
if (Test-Path $batchDir) {
    Remove-Item $batchDir -Recurse -Force
}
New-Item -ItemType Directory -Path $batchDir | Out-Null

for ($i = 0; $i -lt $batches.Count; $i++) {
    $batchNum = $i + 1
    $batchFile = "$batchDir\batch-$batchNum.txt"
    $batches[$i] | Out-File -FilePath $batchFile -Encoding UTF8
    
    $fileCount = $batches[$i].Count
    Write-Host "Batch $batchNum ($fileCount files):" -ForegroundColor Cyan
    $batches[$i] | ForEach-Object { Write-Host "  - $_" }
    Write-Host ""
}

# Generate processing script for each batch
Write-Host "Generating processing scripts..." -ForegroundColor Yellow
Write-Host ""

for ($i = 0; $i -lt $batches.Count; $i++) {
    $batchNum = $i + 1
    $scriptFile = "$batchDir\process-batch-$batchNum.ps1"
    $fileCount = $batches[$i].Count
    $filesArray = $batches[$i] | ForEach-Object { "    '$_'" }
    $filesList = $filesArray -join "`n"
    
    $scriptContent = @"
# Process Batch $batchNum
# Files: $fileCount

Write-Host "=== Processing Batch $batchNum ===" -ForegroundColor Cyan
Write-Host ""

`$files = @(
$filesList
)

Write-Host "Files in this batch:" -ForegroundColor Yellow
`$files | ForEach-Object { Write-Host "  - `$_" }

Write-Host ""
Write-Host "Starting watch mode..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run typecheck:watch:preserve" -WindowStyle Minimized

Write-Host ""
Write-Host "Fixing errors in batch files..." -ForegroundColor Yellow
npm run lint:fix -- `$files

Write-Host ""
Write-Host "Running auto-fix..." -ForegroundColor Yellow
npm run fix:auto

Write-Host ""
Write-Host "Checking remaining errors..." -ForegroundColor Yellow
npm run typecheck:count

Write-Host ""
Write-Host "Batch $batchNum processing complete!" -ForegroundColor Green
Write-Host "Check the watch mode window for real-time feedback"
Write-Host ""
"@
    
    $scriptContent | Out-File -FilePath $scriptFile -Encoding UTF8
    Write-Host "  Created: $scriptFile" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Process batches sequentially (recommended)"
Write-Host "  .\parallel-batches\process-batch-1.ps1"
Write-Host "  .\parallel-batches\process-batch-2.ps1"
Write-Host "  (etc.)"
Write-Host ""
Write-Host "Option 2: Process batches in parallel (multiple terminals)"
Write-Host "  Terminal 1: .\parallel-batches\process-batch-1.ps1"
Write-Host "  Terminal 2: .\parallel-batches\process-batch-2.ps1"
Write-Host "  Terminal 3: .\parallel-batches\process-batch-3.ps1"
Write-Host "  Terminal 4: .\parallel-batches\process-batch-4.ps1"
Write-Host ""
Write-Host "Option 3: Use multiple Cursor windows"
Write-Host "  Window 1: Open batch-1.txt files, fix errors"
Write-Host "  Window 2: Open batch-2.txt files, fix errors"
Write-Host "  (etc.)"
Write-Host ""
Write-Host "Tip: Keep watch mode running in background for instant feedback"
Write-Host ""
