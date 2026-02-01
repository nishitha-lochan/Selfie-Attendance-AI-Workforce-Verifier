@echo off
setlocal
title Selfie Attendance - Starter

echo.
echo ==================================================
echo   Starting Selfie Attendance with Liveness Check
echo ==================================================
echo.

:: 1. Cleanup existing processes
echo [1/4] Terminating existing Python and Node processes...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul

:: 2. Start Backend
echo [2/4] Starting Backend Server (FastAPI on port 8000)...
start "Attendance Backend" cmd /k "cd /d %~dp0backend && uvicorn app.main:app --reload --port 8000"

:: 3. Start Frontend
echo [3/4] Starting Frontend Server (Vite on port 5173)...
start "Attendance Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: 4. Launch Browser
echo [4/4] Launching the application in your browser...
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo ==================================================
echo   Servers are running! 
echo   - Frontend: http://localhost:5173
echo   - Backend Docs: http://127.0.0.1:8000/docs
echo ==================================================
echo.
echo Close the separate command windows to stop the servers.
pause
