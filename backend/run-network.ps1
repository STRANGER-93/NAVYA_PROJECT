param(
    [switch]$Network
)

# Default: a browser-addressable local server at http://localhost:8000.
# Use -Network only for a physical phone on the same Wi-Fi network.
$bindAddress = if ($Network) { "0.0.0.0" } else { "localhost" }
& "$PSScriptRoot\.venv\Scripts\uvicorn.exe" app.main:app --reload --host $bindAddress --port 8000
