# ============================================================================
# 62-corregir-autoria.ps1
# ----------------------------------------------------------------------------
# Corrige la autoria de TODO el historial de Git.
# Reemplaza los 4 autores detectados por: Pedro J. Pirovani <pirovanipedrojose@gmail.com>
#
# NO hace push force. Solo reescribe el historial local.
# El push force se hace despues, aparte, con confirmacion manual.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/docs/62-corregir-autoria.ps1
# ============================================================================

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# Identidad correcta
$nombreCorrecto = 'Pedro J. Pirovani'
$emailCorrecto  = 'pirovanipedrojose@gmail.com'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 62 - Corregir autoria del historial de Git' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host "Destino: $nombreCorrecto <$emailCorrecto>" -ForegroundColor Yellow
Write-Host ''

Set-Location $repoRoot

# ---------------------------------------------------------------------------
# 1. Verificar precondiciones
# ---------------------------------------------------------------------------

Write-Host '[1/5] Verificando precondiciones...' -ForegroundColor Green

# 1a. Backup
$backupBundle = 'C:\Users\Admin\panfree-system-backup-2026-10-16.bundle'
$backupDir    = 'C:\Users\Admin\proyectos\panfree-system-BACKUP-S19'

if (-not (Test-Path -LiteralPath $backupBundle)) {
    Write-Host "  [ERROR] No existe el bundle de backup: $backupBundle" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Bundle backup existe" -ForegroundColor Green

if (-not (Test-Path -LiteralPath $backupDir)) {
    Write-Host "  [ERROR] No existe la copia backup: $backupDir" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Copia backup existe" -ForegroundColor Green

# 1b. filter-repo disponible
$frCheck = git filter-repo --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] git filter-repo no esta disponible" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] git filter-repo: $frCheck" -ForegroundColor Green

# 1c. Working tree limpio
$status = git status --porcelain
if ($status) {
    Write-Host "  [ERROR] Working tree NO esta limpio. Hay cambios sin commitear." -ForegroundColor Red
    Write-Host "  Correr 'git status' y resolver antes de continuar." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Working tree limpio" -ForegroundColor Green

# ---------------------------------------------------------------------------
# 2. Configurar identidad LOCAL (no global)
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '[2/5] Configurando identidad local...' -ForegroundColor Green

git config --local user.name $nombreCorrecto
git config --local user.email $emailCorrecto

$checkName  = git config --local user.name
$checkEmail = git config --local user.email

Write-Host "  [OK] user.name  = $checkName" -ForegroundColor Green
Write-Host "  [OK] user.email = $checkEmail" -ForegroundColor Green

# ---------------------------------------------------------------------------
# 3. Ejecutar git filter-repo
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '[3/5] Reescribiendo historial con filter-repo...' -ForegroundColor Green
Write-Host '      (Esto puede tardar 10-60 segundos)' -ForegroundColor Yellow

# Callbacks de filter-repo: reemplazan author y committer (name + email)
# Los 4 autores detectados se unifican en uno.
$nameCb  = "return b'$nombreCorrecto'"
$emailCb = "return b'$emailCorrecto'"

Write-Host ''
Write-Host "  Comando:" -ForegroundColor Cyan
Write-Host "    git filter-repo --force --name-callback `"$nameCb`" --email-callback `"$emailCb`"" -ForegroundColor Cyan
Write-Host ''

git filter-repo --force --name-callback "$nameCb" --email-callback "$emailCb"

if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] filter-repo fallo." -ForegroundColor Red
    exit 1
}

Write-Host "  [OK] Historial reescrito" -ForegroundColor Green

# ---------------------------------------------------------------------------
# 4. Re-agregar remote origin
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '[4/5] Re-agregando remote origin...' -ForegroundColor Green

# filter-repo borra el remote. Verificar y re-agregar.
$remotes = git remote
if ($remotes -notcontains 'origin') {
    git remote add origin https://github.com/PanFree-Tech/panfree-system.git
    Write-Host "  [OK] Remote origin re-agregado" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] Remote origin ya existe" -ForegroundColor Yellow
}

# Verificar
git remote -v | ForEach-Object { Write-Host "      $_" -ForegroundColor Cyan }

# ---------------------------------------------------------------------------
# 5. Verificacion
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '[5/5] Verificando resultado...' -ForegroundColor Green
Write-Host ''

Write-Host '--- Autores unicos en el historial ---' -ForegroundColor Cyan
$autores = git log --format='%an <%ae>' --all | Sort-Object | Get-Unique
foreach ($a in $autores) {
    Write-Host "  $a" -ForegroundColor White
}

Write-Host ''
Write-Host '--- Ultimos 5 commits ---' -ForegroundColor Cyan
git log --format='%h %an <%ae> %s' -5 | ForEach-Object {
    Write-Host "  $_" -ForegroundColor White
}

Write-Host ''
Write-Host '--- Identidad local ---' -ForegroundColor Cyan
Write-Host "  user.name  = $(git config --local user.name)" -ForegroundColor White
Write-Host "  user.email = $(git config --local user.email)" -ForegroundColor White

# ---------------------------------------------------------------------------
# Resumen
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 62 COMPLETADO (historial local reescrito)' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'IMPORTANTE: el remote NO se ha actualizado todavia.' -ForegroundColor Yellow
Write-Host 'El push force se hace en un paso aparte.' -ForegroundColor Yellow
Write-Host ''
Write-Host 'Antes del push force, verificar en la salida de arriba:' -ForegroundColor Yellow
Write-Host '  1. Solo hay 1 autor unico: Pedro J. Pirovani <pirovanipedrojose@gmail.com>' -ForegroundColor White
Write-Host '  2. Los ultimos commits tienen el nombre correcto' -ForegroundColor White
Write-Host ''