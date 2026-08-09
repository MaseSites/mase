@echo off
rem Erzeugt den Windows-Installer (.exe) im Ordner "dist".
rem Doppelklick genuegt - es muss nichts getippt werden.

cd /d "%~dp0"

if not exist "node_modules\electron" (
  echo.
  echo   Bausteine werden geladen ...
  echo.
  call npm install --no-audit --no-fund
  if errorlevel 1 goto fehler
)

echo.
echo   Installer wird gebaut. Das dauert ein paar Minuten ...
echo.
call npm run dist
if errorlevel 1 goto fehler

echo.
echo   Fertig. Die Setup-Datei liegt im Ordner "dist".
echo.
start "" "%~dp0dist"
pause
exit /b 0

:fehler
echo.
echo   Der Bau ist fehlgeschlagen. Bitte die Meldungen oben mitschicken.
echo.
pause
exit /b 1
