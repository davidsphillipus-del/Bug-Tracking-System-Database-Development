@echo off
echo ========================================
echo   Bug Tracking System - Backend
echo ========================================
echo.

cd backend

echo 📦 Installing dependencies...
call npm install

echo.
echo 🔧 Building TypeScript...
call npm run build

echo.
echo 🚀 Starting backend server...
echo.
echo Backend will be available at: http://localhost:5000
echo Health check: http://localhost:5000/health
echo.

call npm run dev

pause
