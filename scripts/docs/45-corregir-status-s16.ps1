# ============================================================================
# 45-corregir-status-s16.ps1
# ----------------------------------------------------------------------------
# Corrige los 3 contadores de STATUS.md que quedaron desincronizados
# al cerrar S16 (el script 44 no pudo matchear las anclas viejas).
#
# Ajustes:
#   - Tabla F2: 14 | 4 | 0 | 10 | 29%  ->  14 | 5 | 1 | 8 | 36%
#   - Total:    47 | 26 | 0 | 21 | 55%  ->  47 | 28 | 1 | 18 | 60%
#   - Hallazgos cerrados: 32 / 46  ->  31 / 47
#   - Claves en Bitwarden: 3 / 12  ->  4 / 12
#
# NO commitea. Fecha: 2026-10-15
# ----------------------------------------------------------------------------
# Uso:
#   Dry run:  .\45-corregir-status-s16.ps1
#   Aplicar:  .\45-corregir-status-s16.ps1 -Commit
# ============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BackupDir = Join-Path $PSScriptRoot '.backup-s16'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-Step([string]$m) { Write-Host ''; Write-Host ('== ' + $m) -ForegroundColor Cyan }
function Write-Ok([string]$m)   { Write-Host ('   [OK]   ' + $m) -ForegroundColor Green }
function Write-Skip([string]$m) { Write-Host ('   [SKIP] ' + $m) -ForegroundColor Yellow }
function Write-Err([string]$m)  { Write-Host ('   [ERR]  ' + $m) -ForegroundColor Red }

function Read-FileRaw([string]$path) {
    return [System.IO.File]::ReadAllText($path, $Utf8NoBom)
}
function Write-FileRaw([string]$path, [string]$content) {
    [System.IO.File]::WriteAllText($path, $content, $Utf8NoBom)
}
function Backup-File([string]$path, [string]$stamp) {
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
    $rel = $path.Substring($RepoRoot.Length).TrimStart('\')
    $safe = $rel.Replace('\', '__')
    $dest = Join-Path $BackupDir ($stamp + '__' + $safe)
    Copy-Item -LiteralPath $path -Destination $dest -Force
}

Write-Step 'Precondiciones'
Push-Location $RepoRoot

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') { Write-Err ('Rama: ' + $branch); Pop-Location; exit 1 }
Write-Ok ('Rama: ' + $branch)
Write-Ok ('HEAD: ' + (git rev-parse HEAD).Trim())

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

# ============================================================================
# Corregir STATUS.md
# ============================================================================

Write-Step 'Corregir STATUS.md'

$statusPath = Join-Path $RepoRoot 'docs\STATUS.md'
if (-not (Test-Path -LiteralPath $statusPath)) {
    Write-Err 'STATUS.md no existe'
    Pop-Location
    exit 1
}
$status = Read-FileRaw $statusPath

$cambios = 0

# 1. Tabla F2
$old1 = '| F2 - Rotacion claves | 14 | 4 | 0 | 10 | 29% |'
$new1 = '| F2 - Rotacion claves | 14 | 5 | 1 | 8 | 36% |'
if ($status.Contains($old1)) {
    $status = $status.Replace($old1, $new1)
    $cambios++
    Write-Ok 'Tabla F2 corregida'
} else {
    Write-Skip 'Tabla F2 no matcheo (puede ya estar OK)'
}

# 2. Total
$old2 = '| **Total** | **47** | **26** | **0** | **21** | **55%** |'
$new2 = '| **Total** | **47** | **28** | **1** | **18** | **60%** |'
if ($status.Contains($old2)) {
    $status = $status.Replace($old2, $new2)
    $cambios++
    Write-Ok 'Tabla Total corregida'
} else {
    Write-Skip 'Total no matcheo (puede ya estar OK)'
}

# 3. Hallazgos cerrados
$old3 = '| Hallazgos cerrados | 32 / 46 | 46 / 46 |'
$new3 = '| Hallazgos cerrados | 31 / 47 | 47 / 47 |'
if ($status.Contains($old3)) {
    $status = $status.Replace($old3, $new3)
    $cambios++
    Write-Ok 'Hallazgos cerrados corregido'
} else {
    Write-Skip 'Hallazgos cerrados no matcheo (puede ya estar OK)'
}

# 4. Claves en Bitwarden
$old4 = '| Claves en Bitwarden | 3 / 12 | 12 / 12 |'
$new4 = '| Claves en Bitwarden | 4 / 12 | 12 / 12 |'
if ($status.Contains($old4)) {
    $status = $status.Replace($old4, $new4)
    $cambios++
    Write-Ok 'Claves en Bitwarden corregido'
} else {
    Write-Skip 'Claves en Bitwarden no matcheo (puede ya estar OK)'
}

# 5. Claves productivas rotadas (si no esta)
$old5 = '| Claves productivas rotadas | 0 / 12 | 12 / 12 |'
$new5 = '| Claves productivas rotadas | 4 / 12 | 12 / 12 |'
if ($status.Contains($old5)) {
    $status = $status.Replace($old5, $new5)
    $cambios++
    Write-Ok 'Claves productivas rotadas corregido'
} else {
    Write-Skip 'Claves productivas rotadas no matcheo'
}

if ($Commit) {
    Backup-File $statusPath $stamp
    Write-FileRaw $statusPath $status
    Write-Ok ("STATUS.md actualizado (" + $cambios + " cambios)")
} else {
    Write-Host ("   (dry run: " + $cambios + " cambios)") -ForegroundColor DarkYellow
}

# ============================================================================
# Verificar links + commit
# ============================================================================

Write-Step 'Commit'

if (-not $Commit) {
    Write-Host '   Dry run. Nada escrito.' -ForegroundColor DarkYellow
    Write-Host '   Para aplicar: .\45-corregir-status-s16.ps1 -Commit' -ForegroundColor DarkYellow
    Pop-Location
    exit 0
}

$verPath = Join-Path $RepoRoot 'scripts\docs\00-verificar-links.ps1'
if (Test-Path -LiteralPath $verPath) {
    & powershell -ExecutionPolicy Bypass -File $verPath
}

git add -- docs/STATUS.md

$staged = @(git diff --cached --name-only)
if ($staged.Count -eq 0) {
    Write-Skip 'Nada staged.'
    Pop-Location
    exit 0
}

$msg = 'docs(session): corregir contadores de STATUS tras cierre S16'
git commit -m $msg
if ($LASTEXITCODE -ne 0) { Write-Err 'git commit fallo'; Pop-Location; exit 1 }

git push origin main
if ($LASTEXITCODE -ne 0) { Write-Err 'git push fallo'; Pop-Location; exit 1 }

Write-Ok ('Commit pusheado: ' + $msg)

Pop-Location