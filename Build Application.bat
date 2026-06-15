@echo off
title CV Mate Auto-Builder
echo ==========================================
echo Building CV Mate Electron Application...
echo ==========================================
echo.
call npm run electron:build
echo.
echo ==========================================
echo Build Complete! 
echo Your .exe installer is located in the "dist-electron" folder.
echo ==========================================
pause
