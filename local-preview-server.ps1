# Local preview server (PowerShell fallback)
# Auto-invoked by startup bat when Node.js is not installed
param(
    [int]$Port = 8091
)

$ErrorActionPreference = 'Stop'
$serverRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ''
Write-Host '  ======================================='
Write-Host '  Local Preview Server (PowerShell)'
Write-Host '  ======================================='
Write-Host ('  Home:    http://127.0.0.1:' + $Port + '/')
Write-Host ('  Nav:     http://127.0.0.1:' + $Port + '/nav')
Write-Host ('  Root:    ' + $serverRoot)
Write-Host ('  Port:    ' + $Port)
Write-Host '  ======================================='
Write-Host '  Press Ctrl+C to stop'
Write-Host ''

Add-Type -AssemblyName System.Web

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://127.0.0.1:' + $Port + '/')

try {
    $listener.Start()
} catch {
    Write-Host ''
    Write-Host ('  [ERROR] Port ' + $Port + ' is already in use.') -ForegroundColor Red
    Write-Host '  Please run zeen-tools\stop.bat first.' -ForegroundColor Red
    Write-Host ''
    exit 1
}

# Route aliases
$routeAliases = @{
    '/'     = '\game\index.html'
    '/nav'  = '\zeen-tools\nav.html'
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        try {
            $urlPath = [System.Web.HttpUtility]::UrlDecode($request.Url.LocalPath)

            # Route alias matching
            if ($routeAliases.ContainsKey($urlPath)) {
                $urlPath = $routeAliases[$urlPath].Replace('/', '\')
            } else {
                $urlPath = $urlPath.TrimStart('/').Replace('/', '\')
            }

            $filePath = Join-Path $serverRoot $urlPath

            # Directory request fallback to index.html
            if ((Test-Path $filePath -PathType Container)) {
                $filePath = Join-Path $filePath 'index.html'
            }

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = switch ($ext) {
                    '.html' { 'text/html; charset=utf-8' }
                    '.htm'  { 'text/html; charset=utf-8' }
                    '.css'  { 'text/css; charset=utf-8' }
                    '.js'   { 'application/javascript; charset=utf-8' }
                    '.json' { 'application/json; charset=utf-8' }
                    '.jpg'  { 'image/jpeg' }
                    '.jpeg' { 'image/jpeg' }
                    '.png'  { 'image/png' }
                    '.gif'  { 'image/gif' }
                    '.svg'  { 'image/svg+xml' }
                    '.ico'  { 'image/x-icon' }
                    '.webp' { 'image/webp' }
                    '.woff' { 'font/woff' }
                    '.woff2'{ 'font/woff2' }
                    '.ttf'  { 'font/ttf' }
                    '.mp3'  { 'audio/mpeg' }
                    '.wav'  { 'audio/wav' }
                    '.mp4'  { 'video/mp4' }
                    '.md'   { 'text/plain; charset=utf-8' }
                    default { 'application/octet-stream' }
                }
                $response.ContentType = $contentType
                $response.Headers.Add('Cache-Control', 'no-cache, no-store, must-revalidate')
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $response.ContentType = 'text/plain; charset=utf-8'
                $notFoundStr = '404 Not Found: ' + $request.Url.LocalPath
                $msg = [System.Text.Encoding]::UTF8.GetBytes($notFoundStr)
                $response.OutputStream.Write($msg, 0, $msg.Length)
            }
        } catch {
            $response.StatusCode = 500
            $response.ContentType = 'text/plain; charset=utf-8'
            $errStr = '500 Error: ' + $_.Exception.Message
            $errMsg = [System.Text.Encoding]::UTF8.GetBytes($errStr)
            $response.OutputStream.Write($errMsg, 0, $errMsg.Length)
        } finally {
            $response.OutputStream.Close()
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
