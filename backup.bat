@echo off
:: ═══════════════════════════════════════════════════
:: Pizzeria San Carino — Tägliches Datenbank-Backup
:: ═══════════════════════════════════════════════════

set PROJEKTPFAD=C:\Users\shama\Claude\Pizzaria\.claude\.claude\worktrees\Pizzaria-vs-3
set BACKUPPFAD=%PROJEKTPFAD%\backups
set DATUM=%date:~6,4%-%date:~3,2%-%date:~0,2%

:: Backup-Ordner erstellen falls nicht vorhanden
if not exist "%BACKUPPFAD%" mkdir "%BACKUPPFAD%"

:: Backup erstellen
copy "%PROJEKTPFAD%\pizzeria.db" "%BACKUPPFAD%\pizzeria_%DATUM%.db" >nul

if %errorlevel%==0 (
    echo [OK] Backup erstellt: pizzeria_%DATUM%.db
) else (
    echo [FEHLER] Backup fehlgeschlagen!
    exit /b 1
)

:: Alte Backups löschen (älter als 30 Tage)
forfiles /p "%BACKUPPFAD%" /s /m *.db /d -30 /c "cmd /c del @path" 2>nul

echo [OK] Alte Backups bereinigt (nur letzte 30 Tage behalten)
echo Backup-Ordner: %BACKUPPFAD%
