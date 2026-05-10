$cwd = Get-Location
$serverProcess = Start-Process npm.cmd -ArgumentList "run dev -- -p 3500" -WorkingDirectory $cwd -PassThru -WindowStyle Hidden

Write-Host "Starting Discord Notes Pro server..."
Start-Sleep -Seconds 8 # Give it time to start

Write-Host "Opening app window..."
# Try to find Edge or Chrome for app mode
$browserPath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $browserPath)) {
    $browserPath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
}

if (Test-Path $browserPath) {
    $browserProcess = Start-Process $browserPath -ArgumentList "--app=http://localhost:3500" -PassThru
    Write-Host "App is running. Close the window to exit."
    Wait-Process -Id $browserProcess.Id
} else {
    Write-Host "Browser not found. Opening in default browser..."
    Start-Process "http://localhost:3500"
    Write-Host "Press any key to stop the server..."
    $x = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

Write-Host "Shutting down server..."
Stop-Process -Id $serverProcess.Id -Force
# Clean up any lingering node processes in this directory
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*$cwd*" } | Stop-Process -Force
Write-Host "Done."
