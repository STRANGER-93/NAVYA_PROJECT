@echo off
setlocal

if not exist "%~dp0.venv\Scripts\uvicorn.exe" (
  echo Virtual environment not found. Run the setup commands in README.md first.
  exit /b 1
)

if /I "%~1"=="network" (
  echo Starting NAVYA backend for your local network.
  echo Open on this PC: http://localhost:8000/health
  echo Open on your phone: http://YOUR-PC-LAN-IP:8000/health
  "%~dp0.venv\Scripts\uvicorn.exe" app.main:app --reload --host 0.0.0.0 --port 8000
) else (
  echo Starting NAVYA backend at http://localhost:8000
  "%~dp0.venv\Scripts\uvicorn.exe" app.main:app --reload --host localhost --port 8000
)
