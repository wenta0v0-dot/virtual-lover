@echo off
echo ============================================
echo   停止所有 Next.js 开发服务器进程
echo ============================================
echo.

:: 查找并显示相关进程
echo 正在查找 Next.js 相关进程...
tasklist | findstr /i "node.exe"

echo.
echo 准备结束这些进程...
echo.

:: 结束所有 node 进程（谨慎使用）
taskkill /f /im node.exe

echo.
echo ✅ 所有 Node.js 进程已结束
echo.

:: 删除锁文件
if exist ".next\dev\lock" (
    del /f /q ".next\dev\lock"
    echo ✅ 锁文件已删除
) else (
    echo ℹ️  锁文件不存在
)

echo.
echo ============================================
echo   现在可以重新运行: pnpm dev
echo ============================================
pause