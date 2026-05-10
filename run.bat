@echo off
echo 🚀 Preparing DisNotes Pro...
echo.

if not exist node_modules (
    echo 📦 Dependencies missing. Installing...
    call npm.cmd install
)

echo ⚡ Starting Development Server...
npm.cmd run dev
pause
