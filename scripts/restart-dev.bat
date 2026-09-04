@echo off
chcp 65001 >nul 2>&1
echo.
echo ════════════════════════════════════════════
echo   🚀 Next.js 开发服务器 - 一键重启工具
echo ════════════════════════════════════════════
echo.

:: 检查是否在正确的目录
if not exist "package.json" (
    echo ❌ 错误：请在项目根目录运行此脚本
    pause
    exit /b 1
)

echo [1/4] 🔍 查找并结束占用端口5000的进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo    📌 发现进程 PID: %%a
    taskkill /PID %%a /F >nul 2>&1 && echo    ✅ 已终止进程 %%a
)

echo.
echo [2/4] 🗑️  删除锁文件...
if exist ".next\dev\lock" (
    del /f /q ".next\dev\lock" >nul 2>&1
    echo    ✅ 锁文件已删除
) else (
    echo    ℹ️  锁文件不存在（无需删除）
)

echo.
echo [3/4] 🧹 清理缓存（可选）...
if exist ".next\cache" (
    rd /s /q ".next\cache" >nul 2>&1
    echo    ✅ 缓存已清理
)

echo.
echo [4/4] ✨ 准备启动开发服务器...
echo.
echo ════════════════════════════════════════════
echo   💡 提示：
echo   • 服务器将在 http://localhost:5000 启动
echo   • 按 Ctrl+C 可停止服务器
echo   • 登录时请查看此窗口显示的验证码
echo ════════════════════════════════════════════
echo.

:: 启动开发服务器
pnpm dev

pause