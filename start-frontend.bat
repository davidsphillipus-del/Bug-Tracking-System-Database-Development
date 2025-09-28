@echo off
echo ========================================
echo   Bug Tracking System - Frontend  
echo ========================================
echo.

cd frontend

echo 📦 Installing dependencies...
call npm install

echo.
echo 🚀 Starting frontend application...
echo.
echo Frontend will be available at: http://localhost:3000
echo.

call npm start

pause
