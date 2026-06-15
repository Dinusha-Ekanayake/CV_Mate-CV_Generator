@echo off
title CV Mate Development Server
echo ==========================================
echo Starting CV Mate Native Development Server
echo ==========================================
echo.
echo Please wait while Vite and Electron boot up...
echo.
call npm run electron:dev
pause
