param(
  [Parameter(Mandatory = $true)]
  [string]$LibraryPath,

  [Parameter(Mandatory = $true)]
  [string]$DatabaseId,

  [string]$DatabaseName = "levois-evidence",
  [string]$StudioUrl = "https://levois-studio.mouaad-0f0.workers.dev",
  [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"

function Step([string]$Message) {
  Write-Host ""
  Write-Host "=== $Message ===" -ForegroundColor Cyan
}

if (-not (Test-Path $LibraryPath)) {
  throw "Dossier V2.1 introuvable : $LibraryPath"
}

Step "Configuration du binding D1 Studio"
$wranglerPath = Join-Path (Get-Location) "wrangler.jsonc"
if (-not (Test-Path $wranglerPath)) {
  throw "wrangler.jsonc introuvable. Lancez ce script depuis la racine du dépôt."
}

$config = Get-Content $wranglerPath -Raw | ConvertFrom-Json
if (-not $config.env.studio) {
  throw "env.studio absent de wrangler.jsonc"
}

$binding = [PSCustomObject]@{
  binding = "LEVOIS_EVIDENCE_DB"
  database_name = $DatabaseName
  database_id = $DatabaseId
}

$config.env.studio | Add-Member -NotePropertyName d1_databases -NotePropertyValue @($binding) -Force
$config | ConvertTo-Json -Depth 30 | Set-Content $wranglerPath -Encoding UTF8
Write-Host "Binding LEVOIS_EVIDENCE_DB configuré pour env.studio." -ForegroundColor Green

Step "Import V2.1"
& powershell -ExecutionPolicy Bypass -File scripts/import-evidence-v21.ps1 -LibraryPath $LibraryPath -DatabaseName $DatabaseName

if (-not $SkipDeploy) {
  Step "Build"
  npm run check

  Step "Déploiement Studio"
  npx wrangler deploy --env studio
}

Step "Validation live du retrieval"
if (-not $env:STUDIO_ACCESS_TOKEN) {
  $secure = Read-Host "Clé Studio privée (masquée)" -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $env:STUDIO_ACCESS_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

$env:STUDIO_BASE_URL = $StudioUrl
node scripts/validate-live-retrieval.mjs

Step "Terminé"
Write-Host "V2.1 importée, Studio déployé et retrieval live contrôlé." -ForegroundColor Green
Write-Host "Aucun secret n a été écrit dans wrangler.jsonc."
