$filePath = Join-Path $PSScriptRoot 'local-preview-server.ps1'
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
$utf8Bom = New-Object System.Text.UTF8Encoding $true
[System.IO.File]::WriteAllText($filePath, $content, $utf8Bom)
Write-Host "BOM added to $filePath"
