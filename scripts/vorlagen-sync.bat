@echo off
chcp 65001 >nul
title Vorlagen synchronisieren
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0vorlagen-sync.ps1"
echo.
pause
