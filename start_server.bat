@echo off
title Scoreboard Backend Server
echo.
echo  Starting Scoreboard backend server...
echo  Keep this window open while using the app.
echo.

:: Try python first, then python3
where python >nul 2>&1
if %ERRORLEVEL% == 0 (
    python "%~dp0server.py"
) else (
    where python3 >nul 2>&1
    if %ERRORLEVEL% == 0 (
        python3 "%~dp0server.py"
    ) else (
        echo ERROR: Python not found. Please install Python from https://python.org
        pause
        exit /b 1
    )
)

echo.
echo  Server stopped.
pause
