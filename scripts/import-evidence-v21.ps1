param(
  [Parameter(Mandatory = $true)]
  [string]$LibraryPath,
  [string]$DatabaseName = "levois-evidence",
  [switch]$Local
)

$ErrorActionPreference = "Stop"

function Step([string]$Message) {
  Write-Host ""
  Write-Host "=== $Message ===" -ForegroundColor Cyan
}

if (-not (Test-Path $LibraryPath)) {
  throw "Dossier V2.1 introuvable : $LibraryPath"
}

$master = Join-Path $LibraryPath "02_EVIDENCE_LIBRARY_V21.jsonl"
if (-not (Test-Path $master)) {
  throw "02_EVIDENCE_LIBRARY_V21.jsonl absent. Utilisez le dossier LEVOIS_EVIDENCE_LIBRARY_V2_1 extrait."
}

$remoteFlag = if ($Local) { "--local" } else { "--remote" }

Step "Vérification Wrangler"
npx wrangler --version

Step "Application du schéma D1"
npx wrangler d1 execute $DatabaseName $remoteFlag --file="db/evidence-library-schema.sql"

Step "Application de la migration V2.1"
npx wrangler d1 execute $DatabaseName $remoteFlag --file="db/evidence-library-v21-migration.sql"

Step "Application du schéma de traçabilité contenus"
npx wrangler d1 execute $DatabaseName $remoteFlag --file="db/content-traceability-schema.sql"

Step "Construction des lots d'import"
node scripts/build-evidence-d1.mjs --input $LibraryPath --version V21 --database $DatabaseName

$sqlDir = Resolve-Path ".levois-evidence-sql"
$sqlFiles = Get-ChildItem $sqlDir -Filter "*.sql" | Sort-Object Name

if (-not $sqlFiles.Count) {
  throw "Aucun lot SQL généré."
}

Step "Import de $($sqlFiles.Count) lots SQL"
$index = 0
foreach ($file in $sqlFiles) {
  $index += 1
  Write-Host "[$index/$($sqlFiles.Count)] $($file.Name)"
  npx wrangler d1 execute $DatabaseName $remoteFlag --file="$($file.FullName)"
}

Step "Contrôles post-import"
$checks = @(
  "SELECT value AS library_version FROM evidence_library_meta WHERE key='library_version';",
  "SELECT COUNT(*) AS evidence_count FROM evidence;",
  "SELECT engine_use_class, COUNT(*) AS n FROM evidence GROUP BY engine_use_class ORDER BY n DESC;",
  "SELECT COUNT(*) AS do_not_use_count FROM evidence WHERE engine_use_class='DO_NOT_USE';",
  "SELECT COUNT(*) AS refresh_rows FROM evidence_refresh_v21;",
  "SELECT COUNT(*) AS alias_rows FROM evidence_aliases;",
  "SELECT COUNT(*) AS fts_rows FROM evidence_search;"
)

foreach ($query in $checks) {
  Write-Host ""
  Write-Host $query -ForegroundColor DarkGray
  npx wrangler d1 execute $DatabaseName $remoteFlag --command="$query"
}

Step "Contrôle attendu"
Write-Host "Bibliothèque canonique attendue : V21"
Write-Host "Preuves actives attendues : 39 721"
Write-Host "Lignes FTS attendues : 38 931 (39 721 - 790 DO_NOT_USE)"
Write-Host "Important : les DO_NOT_USE peuvent être stockés pour audit mais sont exclus du retrieval publiable."
Write-Host ""
Write-Host "Ensuite : ajouter le binding LEVOIS_EVIDENCE_DB dans env.studio, puis déployer levois-studio." -ForegroundColor Green
