# Starts the local API at http://localhost:8000.
& "$PSScriptRoot\.venv\Scripts\uvicorn.exe" app.main:app --reload --host localhost --port 8000
