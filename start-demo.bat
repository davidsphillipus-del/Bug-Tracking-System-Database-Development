@echo off
echo ========================================
echo   Bug Tracking System - Demo Mode
echo ========================================
echo.
echo Starting backend server with dummy data...
cd backend
start "Backend Server" cmd /k "npm run dev"
echo.
echo Starting frontend application...
cd ../frontend
start "Frontend App" cmd /k "npm start"
echo.
echo ========================================
echo   Demo is starting up...
echo ========================================
echo.
echo Backend will be available at: http://localhost:5000
echo Frontend will be available at: http://localhost:3000
echo.
echo Demo Credentials:
echo - admin / password (Admin)
echo - john.dev / password (Developer)
echo - jane.tester / password (Tester)
echo - mike.reporter / password (Reporter)
echo.
echo Press any key to exit...
pause > nul
