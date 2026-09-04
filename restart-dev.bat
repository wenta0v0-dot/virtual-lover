@echo off
chcp 65001 >nul
title 一键重启开发服务器

echo ========================================
echo   🚀 Next.js 开发服务器 - 快速重启工具
echo ========================================
echo.

echo [1/3] 正在停止占用5000端口的旧进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo     终止进程 PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul
echo     ✓ 端口已释放
echo.

echo [2/3] 清理 Next.js 锁文件...
if exist .next\dev\lock (
    del /f .next\dev\lock >nul 2>&1
    echo     ✓ 锁文件已删除
) else (
    echo     ℹ 无需清理（锁文件不存在）
)
echo.

echo [3/3] 启动新的开发服务器...
echo ----------------------------------------
echo.
pnpm dev

pause