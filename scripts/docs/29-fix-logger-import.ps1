# ============================================================================
# 29-fix-logger-import.ps1
# ----------------------------------------------------------------------------
# Objetivo: corregir el import del logger en los 88 archivos que usan
#           "logger.log/warn/error" pero importan "{ log, warn, error }".
# Causa:    script 26a-fix-f3-06-logger.ps1 (S13) inserto el import erroneo.
# Fix:      reemplazar el named import por default import.
# Fecha:    2026-10-14
# Sesion:   14 (ENV)
# ----------------------------------------------------------------------------
# Uso:
#   Dry run (default):  .\29-fix-logger-import.ps1
#   Aplicar + commit:   .\29-fix-logger-import.ps1 -Commit
# ----------------------------------------------------------------------------
# Reglas aplicadas:
#   - ASCII puro. Sin here-strings. Sin escapes unicode. Sin regex.
#   - ReadAllText UTF8(false) -> Contains -> Replace literal -> WriteAllText
#   - Idempotente: archivos ya arreglados no se tocan.
#   - Backup automatico a scripts/docs/.backup-s14/ antes de escribir.
#   - Fail-fast en precondiciones.
# ============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BackupDir = Join-Path $PSScriptRoot '.backup-s14'
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
    $name = Split-Path -Leaf $path
    $rel = $path.Substring($RepoRoot.Length).TrimStart('\')
    $safe = $rel.Replace('\', '__')
    $dest = Join-Path $BackupDir ($stamp + '__' + $safe)
    Copy-Item -LiteralPath $path -Destination $dest -Force
}

# ----------------------------------------------------------------------------
# 1. Precondiciones
# ----------------------------------------------------------------------------

Write-Step 'Precondiciones'
Push-Location $RepoRoot

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') {
    Write-Err ('Rama actual: ' + $branch + ' (esperada: main)')
    Pop-Location; exit 1
}
Write-Ok ('Rama: ' + $branch)

$head = (git rev-parse HEAD).Trim()
Write-Ok ('HEAD: ' + $head)

# ----------------------------------------------------------------------------
# 2. Buscar archivos a arreglar
# ----------------------------------------------------------------------------

Write-Step 'Buscar archivos con import erroneo'

$badImport = "import { log, warn, error } from '@/lib/logger'"
$goodImport = "import logger from '@/lib/logger'"

$files = Get-ChildItem -Path (Join-Path $RepoRoot 'src') -Recurse -File -Include *.js,*.jsx
$toFix = @()
foreach ($f in $files) {
    $c = Read-FileRaw $f.FullName
    if ($c.Contains($badImport) -and $c.Contains('logger.')) {
        $toFix += $f
    }
}

if ($toFix.Count -eq 0) {
    Write-Skip 'No hay archivos con el import erroneo. Nada que hacer.'
    Pop-Location; exit 0
}
Write-Ok ('Archivos a arreglar: ' + $toFix.Count)

# ----------------------------------------------------------------------------
# 3. Aplicar reemplazo
# ----------------------------------------------------------------------------

Write-Step 'Reemplazar import'

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$modified = 0
foreach ($f in $toFix) {
    $c = Read-FileRaw $f.FullName
    if (-not $c.Contains($badImport)) {
        Write-Skip ('Ya arreglado (race condition?): ' + $f.FullName)
        continue
    }
    $new = $c.Replace($badImport, $goodImport)
    if ($Commit) {
        Backup-File $f.FullName $stamp
        Write-FileRaw $f.FullName $new
    }
    $modified++
    Write-Host ('   fix: ' + $f.FullName.Substring($RepoRoot.Length)) -ForegroundColor Gray
}

if (-not $Commit) {
    Write-Host ''
    Write-Host ('   Dry run: ' + $modified + ' archivos serian modificados. Nada escrito.') -ForegroundColor DarkYellow
    Write-Host '   Para aplicar: .\29-fix-logger-import.ps1 -Commit' -ForegroundColor DarkYellow
    Pop-Location; exit 0
}
Write-Ok "$modified archivos modificados"

# ----------------------------------------------------------------------------
# 4. Commit + push
# ----------------------------------------------------------------------------

Write-Step 'Commit'

git add -- src
if ($LASTEXITCODE -ne 0) { Write-Err 'git add fallo'; Pop-Location; exit 1 }

$staged = @(git diff --cached --name-only)
if ($staged.Count -eq 0) {
    Write-Skip 'Nada staged. No hay commit.'
    Pop-Location; exit 0
}
Write-Ok ('Archivos staged: ' + $staged.Count)

$msg = 'fix(logger): corregir import del logger en 88 archivos (regresion S13)'
git commit -m $msg
if ($LASTEXITCODE -ne 0) { Write-Err 'git commit fallo'; Pop-Location; exit 1 }

git push origin main
if ($LASTEXITCODE -ne 0) { Write-Err 'git push fallo'; Pop-Location; exit 1 }

Write-Ok ('Commit pusheado: ' + $msg)
Write-Host ''
Write-Host 'Vercel deberia arrancar el redeploy automaticamente.' -ForegroundColor Cyan
Write-Host 'Verificar en 2-3 min: https://panfree.fit' -ForegroundColor Cyan
Write-Host ''
Write-Host ('Backups en: ' + $BackupDir) -ForegroundColor DarkGray
Write-Host 'Rollback: git revert HEAD --no-edit ; git push origin main' -ForegroundColor DarkGray

Pop-Location