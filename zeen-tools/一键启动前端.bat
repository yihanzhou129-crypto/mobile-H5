@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "PROJECT_ROOT=%%~fI"
set "LOCAL_PREVIEW_PORT=8091"
set "SERVER_SCRIPT=%PROJECT_ROOT%\local-preview-server.js"
set "PS_SERVER_SCRIPT=%PROJECT_ROOT%\local-preview-server.ps1"
set "NAV_URL=http://127.0.0.1:%LOCAL_PREVIEW_PORT%/nav"
set "HOME_URL=http://127.0.0.1:%LOCAL_PREVIEW_PORT%/"

cd /d "%PROJECT_ROOT%"

echo.
echo  ============================================
echo   《如何成为一个优雅的中世纪人》本地预览
echo  ============================================
echo.

:: 检测端口是否已占用
powershell -NoProfile -Command "try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('127.0.0.1', %LOCAL_PREVIEW_PORT%); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 (
    echo  [提示] 端口 %LOCAL_PREVIEW_PORT% 已有服务运行。
    echo  正在直接打开浏览器...
    start "" "%NAV_URL%"
    echo  导航页面已打开: %NAV_URL%
    echo.
    pause
    exit /b 0
)

:: 优先使用 Node.js 启动
where node >nul 2>nul
if not errorlevel 1 (
    echo  [启动] 检测到 Node.js，使用 local-preview-server.js
    start "h5-game-preview" cmd /k "cd /d %PROJECT_ROOT% && set LOCAL_PREVIEW_PORT=%LOCAL_PREVIEW_PORT% && node "%SERVER_SCRIPT%""
    goto :health_check
)

:: 回退到 PowerShell 服务器
echo  [启动] 未检测到 Node.js，使用 PowerShell 备选服务器
start "h5-game-preview" cmd /k "cd /d %PROJECT_ROOT% && powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SERVER_SCRIPT%" -Port %LOCAL_PREVIEW_PORT%"

:health_check
echo  [等待] Checking server readiness...
set "READY=0"
for /L %%i in (1,1,20) do (
    if !READY! equ 0 (
        timeout /t 1 /nobreak >nul
        powershell -NoProfile -Command "try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('127.0.0.1', %LOCAL_PREVIEW_PORT%); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>nul
        if not errorlevel 1 (
            set "READY=1"
        )
    )
)

if %READY% equ 1 (
    echo  [成功] Server is ready!
    echo.
    echo  -------------------------------------------
    echo   导航页面: %NAV_URL%
    echo   游戏首页: %HOME_URL%
    echo  -------------------------------------------
    echo.
    echo  正在打开导航页面...
    start "" "%NAV_URL%"
) else (
    echo  [警告] Server may not be ready yet.
    echo  尝试打开浏览器...
    start "" "%HOME_URL%"
)

echo.
echo  提示: 关闭预览请双击 zeen-tools\一键关闭前端.bat
echo.
pause
