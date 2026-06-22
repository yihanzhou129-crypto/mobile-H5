@echo off
setlocal
chcp 65001 >nul

set "LOCAL_PREVIEW_PORT=8091"

echo.
echo  ============================================
echo   关闭本地预览服务
echo  ============================================
echo.

:: 方法1: 停止 node 进程 (local-preview-server.js)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$found = 0; $procs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*local-preview-server.js*' }; if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; Write-Host ('  已停止 Node.js 服务, PID: ' + $_.ProcessId); $found++ } }; if ($found -eq 0) { Write-Host '  未找到 Node.js 预览服务。' } else { Write-Host ('  共停止 ' + $found + ' 个进程。') }"

:: 方法2: 停止 PowerShell 进程 (local-preview-server.ps1)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$found = 0; $procs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq 'powershell.exe' -and $_.CommandLine -like '*local-preview-server.ps1*' }; if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; Write-Host ('  已停止 PowerShell 服务, PID: ' + $_.ProcessId); $found++ } }; if ($found -eq 0) { Write-Host '  未找到 PowerShell 预览服务。' } else { Write-Host ('  共停止 ' + $found + ' 个进程。') }"

:: 方法3: 停止 cmd 窗口 (h5-game-preview 标题)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$found = 0; $procs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq 'cmd.exe' -and $_.CommandLine -like '*h5-game-preview*' }; if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; $found++ } }; if ($found -gt 0) { Write-Host ('  已关闭 ' + $found + ' 个预览窗口。') }"

:: 验证端口释放
timeout /t 2 /nobreak >nul
powershell -NoProfile -Command "try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('127.0.0.1', %LOCAL_PREVIEW_PORT%); $c.Close(); Write-Host '  [警告] 端口 %LOCAL_PREVIEW_PORT% 仍在使用中。' -ForegroundColor Yellow } catch { Write-Host '  [成功] 端口 %LOCAL_PREVIEW_PORT% 已释放。' -ForegroundColor Green }"

echo.
echo  关闭完成。
echo.
pause
