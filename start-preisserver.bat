@echo off
title Pizzeria Preisserver
echo Pizzeria Preisserver startet...
echo.

:: Port 3001 freimachen falls noch belegt
echo Prüfe Port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 "') do (
  echo Beende alten Prozess auf Port 3001 (PID: %%a)
  taskkill /PID %%a /F >nul 2>&1
)
echo Port bereit.
echo.

cd /d "C:\Users\shama\Claude\Pizzaria\server"

if not exist node_modules (
  echo Installiere Pakete...
  npm install
  echo.
)

echo Server laeuft auf http://localhost:3001
echo Dieses Fenster offen lassen!
echo.
node server.js
echo.
echo Server gestoppt.
pause
