param($file)
$content = Get-Content $file -Raw
$content = $content -replace '^pick b3e9d28', 'reword b3e9d28'
$content = $content -replace '^pick de3cc16', 'drop de3cc16'
Set-Content $file $content -NoNewline

