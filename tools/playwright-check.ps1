param(
  [string]$Url = "http://127.0.0.1:8002/",
  [string]$Output = "$env:TEMP\cursoia-playwright-check.png"
)

$ErrorActionPreference = "Stop"

playwright screenshot --browser=chromium $Url $Output
Write-Host "Playwright screenshot saved to $Output"
