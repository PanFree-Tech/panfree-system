# ============================================================================
# 72-activar-eslint-build.ps1
# ----------------------------------------------------------------------------
# F3-08 / CONF-001: activar ESLint durante el build de Next.js.
#
# Cambia next.config.js:
#   eslint: { ignoreDuringBuilds: true }  ->  false
#
# NO toca typescript.ignoreBuildErrors (es otro hallazgo, CONF-004).
#
# Idempotente. Dry run por defecto. -Aplicar escribe.
# Verificacion post-write obligatoria.
# ============================================================================

param(
    [switch]$Aplicar
)

$ErrorActionPreference = 'Stop'

$repoRoot  = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$configFile = Join-Path $repoRoot 'next.config.js'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 72 - Activar ESLint en build (F3-08 / CONF-001)' -ForegroundColor Cyan
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

$viejo = 'eslint: {' + "`r`n" + '    ignoreDuringBuilds: true,' + "`r`n" + '  },'
$nuevo = 'eslint: {' + "`r`n" + '    ignoreDuringBuilds: false,' + "`r`n" + '  },'

$tieneViejo = $contenido.Contains('ignoreDuringBuilds: true')
$tieneNuevo = $contenido.Contains('ignoreDuringBuilds: false')

Write-Host '--- Auditoria previa ---' -ForegroundColor Cyan
Write-Host "  Contiene 'ignoreDuringBuilds: true'?  $tieneViejo"
Write-Host "  Contiene 'ignoreDuringBuilds: false'? $tieneNuevo"
Write-Host "  Contiene 'ignoreBuildErrors: true'?   $($contenido.Contains('ignoreBuildErrors: true'))"
Write-Host ''

if ($tieneNuevo) {
    Write-Host '[INFO] ESLint ya esta activo en build. Nada que hacer.' -ForegroundColor Yellow
    exit 0
}

if (-not $tieneViejo) {
    Write-Host '[ERROR] No se encontro ignoreDuringBuilds: true. Abortando.' -ForegroundColor Red
    exit 1
}

if (-not $Aplicar) {
    Write-Host '[DRY RUN] No se escribe nada. Agregar -Aplicar para aplicar.' -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'Acciones que se realizarian:' -ForegroundColor Yellow
    Write-Host '  - Cambiar ignoreDuringBuilds: true -> false en next.config.js' -ForegroundColor Yellow
    Write-Host '  - NO se toca typescript.ignoreBuildErrors' -ForegroundColor Yellow
    Write-Host ''
    exit 0
}

# --- Backup + Aplicar ------------------------------------------------------

$backupDir = Join-Path $repoRoot '.backup-s22'
if (-not (Test-Path -LiteralPath $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Host "[OK] Carpeta de backup: $backupDir" -ForegroundColor Green
}

$backupFile = Join-Path $backupDir 'next.config.js.bak'
Copy-Item -LiteralPath $configFile -Destination $backupFile -Force
Write-Host "[OK] Backup: $backupFile" -ForegroundColor Green

# Reemplazo puntual: true -> false en la linea de ignoreDuringBuilds
$contenidoNuevo = $contenido.Replace('ignoreDuringBuilds: true', 'ignoreDuringBuilds: false')

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
    @{ Nombre = "Contiene 'ignoreDuringBuilds: false'";  Match = $post.Contains('ignoreDuringBuilds: false') },
    @{ Nombre = "NO contiene 'ignoreDuringBuilds: true'"; Match = -not $post.Contains('ignoreDuringBuilds: true') },
    @{ Nombre = "Sigue conteniendo 'typescript:'";         Match = $post.Contains('typescript:') },
    @{ Nombre = "Sigue conteniendo 'ignoreBuildErrors: true' (no se toco)"; Match = $post.Contains('ignoreBuildErrors: true') }
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
Write-Host ' 72 COMPLETADO' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'PROXIMO PASO:' -ForegroundColor Yellow
Write-Host '  1. git diff next.config.js' -ForegroundColor Yellow
Write-Host '  2. Verificar local: npm run lint' -ForegroundColor Yellow
Write-Host '  3. git add + commit + push' -ForegroundColor Yellow
Write-Host ''
Write-Host 'NOTA: el build de Vercel usara ESLint con esta config.' -ForegroundColor Yellow
Write-Host '      Si falla (por errores que no vimos), hacer revert del commit.' -ForegroundColor Yellow
Write-Host ''