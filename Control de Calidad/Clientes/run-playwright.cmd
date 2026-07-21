@echo off
setlocal
cd /d "%~dp0"

where powershell.exe >nul 2>nul
if errorlevel 1 (
  echo No se encontro PowerShell en este equipo. 1>&2
  exit /b 2
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-playwright.ps1" %*
exit /b %ERRORLEVEL%
