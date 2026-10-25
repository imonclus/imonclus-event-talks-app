@echo off
title BigQuery Release Notes Tracker
cd /d "%~dp0"

echo ========================================================
echo   Iniciando BigQuery Release Notes Tracker...
echo ========================================================
echo.

if not exist "venv\Scripts\python.exe" (
    echo [ERROR] No se encontro el entorno virtual en 'venv\Scripts\python.exe'.
    echo Por favor revisa la configuracion del proyecto.
    echo.
    pause
    exit /b 1
)

echo [INFO] Servidor iniciando en http://127.0.0.1:5000 ...
echo [INFO] Tu navegador se abrira automaticamente.
echo [INFO] Presiona Ctrl + C en esta ventana para detener el servidor.
echo.

venv\Scripts\python.exe app.py

if errorlevel 1 (
    echo.
    echo [ERROR] La aplicacion se ha cerrado con errores.
    pause
)
