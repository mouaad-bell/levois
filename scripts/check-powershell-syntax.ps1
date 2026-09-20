$ErrorActionPreference = "Stop"

$files = @(
  "scripts/import-evidence-v21.ps1",
  "scripts/setup-studio-v21.ps1"
)

$failed = $false

foreach ($file in $files) {
  $tokens = $null
  $errors = $null
  [System.Management.Automation.Language.Parser]::ParseFile(
    (Resolve-Path $file),
    [ref]$tokens,
    [ref]$errors
  ) | Out-Null

  if ($errors.Count -gt 0) {
    $failed = $true
    Write-Host "FAIL — $file" -ForegroundColor Red
    foreach ($error in $errors) {
      Write-Host ("  " + $error.Message + " @ " + $error.Extent.StartLineNumber + ":" + $error.Extent.StartColumnNumber)
    }
  } else {
    Write-Host "OK   — $file" -ForegroundColor Green
  }
}

if ($failed) {
  exit 1
}

Write-Host "PowerShell syntax OK." -ForegroundColor Green
