# Local preview server (PowerShell fallback)
# Auto-invoked by startup bat when Node.js is not installed
param(
    [int]$Port = 8091
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$gameRoot = Join-Path $projectRoot 'game'

Write-Host ''
Write-Host '  ======================================='
Write-Host '  Local Preview Server (PowerShell)'
Write-Host '  ======================================='
Write-Host ('  Home:    http://127.0.0.1:' + $Port + '/')
Write-Host ('  Nav:     http://127.0.0.1:' + $Port + '/nav')
Write-Host ('  Static:  ' + $gameRoot)
Write-Host ('  Root:    ' + $projectRoot)
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

# 精确路由别名：URL → 物理文件绝对路径
$routeAliases = @{
    '/'       = (Join-Path $gameRoot 'index.html')
    '/game'   = (Join-Path $gameRoot 'index.html')
    '/game/'  = (Join-Path $gameRoot 'index.html')
    '/nav'    = (Join-Path $projectRoot 'zeen-tools\nav.html')
}

# 挂载前缀：URL → 物理目录（供游戏内 ../素材 引用解析）
$mountPrefixes = @(
    @{ url = '/zeen-tools/';                       dir = (Join-Path $projectRoot 'zeen-tools') },
    @{ url = '/首页及过场页面等素材/';              dir = (Join-Path $projectRoot '首页及过场页面等素材') },
    @{ url = '/场景图/';                            dir = (Join-Path $projectRoot '场景图') },
    @{ url = '/人格卡牌图/';                        dir = (Join-Path $projectRoot '人格卡牌图') }
)

function Resolve-FilePath {
    param([string]$RequestPath)
    $decoded = $RequestPath
    try { $decoded = [System.Web.HttpUtility]::UrlDecode($RequestPath) } catch {}

    # 精确别名（直接返回绝对路径）
    if ($routeAliases.ContainsKey($decoded)) {
        return $routeAliases[$decoded]
    }
    # 挂载前缀
    foreach ($m in $mountPrefixes) {
        if ($decoded.StartsWith($m.url)) {
            $rest = $decoded.Substring($m.url.Length)
            return (Join-Path $m.dir $rest)
        }
    }
    # 默认相对 game 根
    return (Join-Path $gameRoot $decoded.TrimStart('/'))
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        try {
            $filePath = Resolve-FilePath $request.Url.LocalPath

            # 目录请求回退到 index.html
            if ($filePath -and (Test-Path $filePath -PathType Container)) {
                $filePath = Join-Path $filePath 'index.html'
            }

            if ($filePath -and (Test-Path $filePath -PathType Leaf)) {
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
