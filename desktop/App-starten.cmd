@echo off
rem MaseSites Admin lokal starten (zum Ausprobieren, ohne Installer).
rem Beim ersten Mal werden die Bausteine geladen, das dauert einige Minuten.

cd /d "%~dp0"

if not exist "node_modules\electron" (
  echo.
  echo   Erster Start: Bausteine werden geladen ...
  echo.
  call npm install --no-audit --no-fund
  if errorlevel 1 goto fehler
)

echo.
echo   MaseSites Admin wird gestartet ...
echo.
call npm start
if errorlevel 1 goto fehler
exit /b 0

:fehler
echo.
echo   Da ist etwas schiefgelaufen. Bitte die Meldungen oben mitschicken.
echo.
pause
exit /b 1
