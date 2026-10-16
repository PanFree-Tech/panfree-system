# ============================================================================
# 73-headers-seguridad.ps1
# ----------------------------------------------------------------------------
# F3-09 / CONF-002: agregar headers de seguridad en next.config.js.
#
# Headers agregados:
#   - X-Frame-Options: SAMEORIGIN
#   - X-Content-Type-Options: nosniff
#   - Referrer-Policy: strict-origin-when-cross-origin
#   - Permissions-Policy: camera=(), microphone=(), geolocation=()
#
# NO se toca:
#   - HSTS (Vercel ya lo sirve)
#   - CSP (requiere auditoria, se hace en S23)
#   - X-XSS-Protection (obsoleto)
#
# Idempotente. Dry run por defecto. -Aplicar escribe.
# Verificacion post-write obligatoria.
# ============================================================================

param(
    [switch]$Aplicar
)

$ErrorActionPreference = 'Stop'

$repoRoot   = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$configFile = Join-Path $repoRoot 'next.config.js'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 73 - Headers de seguridad (F3-09 / CONF-002)' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

$modo = if ($Aplicar) { 'APLICAR' } else { 'DRY RUN' }
Write-Host "Modo: $modo" -ForegroundColor Yellow
Write-Host ''

if (-not (Test-Path -LiteralPath $configFile)) {
    Write-Host "[ERROR] No existe: $configFile" -ForegroundColor Red
    exit 1
}

$contenido = [System.IO.File]::ReadAllText($configFile)

# --- Auditoria previa -------------------------------------------------------

$yaAplicado = $contenido.Contains('X-Frame-Options')

Write-Host '--- Auditoria previa ---' -ForegroundColor Cyan
Write-Host "  Ya tiene 'X-Frame-Options'?  $yaAplicado"
Write-Host "  Tiene 'async headers()'?      $($contenido.Contains('async headers'))"
Write-Host "  Termina con 'module.exports'? $($contenido.Contains('module.exports = withPWA'))"
Write-Host ''

if ($yaAplicado) {
    Write-Host '[INFO] Headers ya aplicados. Nada que hacer.' -ForegroundColor Yellow
    exit 0
}

# --- Ancla para insertar ---------------------------------------------------

$ancla = @'
  images: {
'@

$anclaPresente = $contenido.Contains($ancla)

if (-not $anclaPresente) {
    Write-Host "[ERROR] No se encontro el ancla 'images:' en next.config.js." -ForegroundColor Red
    Write-Host '        Revisar manualmente.' -ForegroundColor Red
    exit 1
}

$bloqueHeaders = @'
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
'@

# --- Dry run ----------------------------------------------------------------

if (-not $Aplicar) {
    Write-Host '[DRY RUN] No se escribe nada. Agregar -Aplicar para aplicar.' -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'Acciones que se realizarian:' -ForegroundColor Yellow
    Write-Host '  - Insertar bloque async headers() antes de "images:"' -ForegroundColor Yellow
    Write-Host '  - 4 headers: X-Frame-Options, X-Content-Type-Options,' -ForegroundColor Yellow
    Write-Host '    Referrer-Policy, Permissions-Policy' -ForegroundColor Yellow
    Write-Host ''
    exit 0
}

# --- Backup + Aplicar ------------------------------------------------------

$backupDir = Join-Path $repoRoot '.backup-s22'
if (-not (Test-Path -LiteralPath $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}
$backupFile = Join-Path $backupDir 'next.config.js.bak-73'
Copy-Item -LiteralPath $configFile -Destination $backupFile -Force
Write-Host "[OK] Backup: $backupFile" -ForegroundColor Green

# Insertar el bloque ANTES de "  images: {"
$contenidoNuevo = $contenido.Replace($ancla, $bloqueHeaders + "`r`n" + $ancla)

if ($contenidoNuevo -eq $contenido) {
    Write-Host '[WARN] Sin cambios netos.' -ForegroundColor Yellow
    exit 0
}

[System.IO.File]::WriteAllText($configFile, $contenidoNuevo, (New-Object System.Text.UTF8Encoding $false))
Write-Host '[OK] next.config.js actualizado' -ForegroundColor Green
Write-Host ''

# --- Verificacion post-write ------------------------------------------------

Write-Host '--- Verificacion post-write ---' -ForegroundColor Cyan

$post = [System.IO.File]::ReadAllText($configFile)

$checks = @(
    @{ Nombre = 'Contiene async headers()';         Match = $post.Contains('async headers()') },
    @{ Nombre = 'Contiene X-Frame-Options';          Match = $post.Contains('X-Frame-Options') },
    @{ Nombre = 'Contiene X-Content-Type-Options';   Match = $post.Contains('X-Content-Type-Options') },
    @{ Nombre = 'Contiene Referrer-Policy';          Match = $post.Contains('Referrer-Policy') },
    @{ Nombre = 'Contiene Permissions-Policy';       Match = $post.Contains('Permissions-Policy') },
    @{ Nombre = 'SAMEORIGIN presente';               Match = $post.Contains('SAMEORIGIN') },
    @{ Nombre = 'Sigue conteniendo images:';         Match = $post.Contains('images:') },
    @{ Nombre = 'Sigue conteniendo module.exports'; Match = $post.Contains('module.exports = withPWA') },
    @{ Nombre = 'Sigue conteniendo ignoreDuringBuilds: false (de F3-08)'; Match = $post.Contains('ignoreDuringBuilds: false') }
)

$todoOk = $true
foreach ($c in $checks) {
    $symbol = if ($c.Match) { 'OK  ' } else { 'FAIL' }
    $color = if ($c.Match) { 'Green' } else { 'Red' }
    Write-Host "  [$symbol] $($c.Nombre)" -ForegroundColor $color
    if (-not $c.Match) { $todoOk = $false }
}

Write-Host ''
if (-not $todoOk) {
    Write-Host '[ERROR] Verificacion post-write FALLO.' -ForegroundColor Red
    exit 1
}

Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 73 COMPLETADO' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'PROXIMO PASO:' -ForegroundColor Yellow
Write-Host '  1. git diff next.config.js' -ForegroundColor Yellow
Write-Host '  2. Commit + push' -ForegroundColor Yellow
Write-Host '  3. Verificar headers en produccion (post-deploy)' -ForegroundColor Yellow
Write-Host ''