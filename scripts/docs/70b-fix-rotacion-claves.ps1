# ============================================================================
# 70b-fix-rotacion-claves.ps1
# ----------------------------------------------------------------------------
# Fix puntual para docs/operations/ROTACION-CLAVES.md: la seccion
# "Modelo de Bitwarden" quedo sin actualizar en el script 70 (falso
# positivo por contener "3 carpetas" en la seccion S21 agregada antes).
#
# Idempotente. Dry run por defecto. -Aplicar escribe.
# ============================================================================

param(
    [switch]$Aplicar
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$rotFile  = Join-Path $repoRoot 'docs\operations\ROTACION-CLAVES.md'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 70b - Fix ROTACION-CLAVES (Modelo de Bitwarden)' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

$modo = if ($Aplicar) { 'APLICAR' } else { 'DRY RUN' }
Write-Host "Modo: $modo" -ForegroundColor Yellow
Write-Host ''

if (-not (Test-Path -LiteralPath $rotFile)) {
    Write-Host "[ERROR] No existe: $rotFile" -ForegroundColor Red
    exit 1
}

$contenido = [System.IO.File]::ReadAllText($rotFile)

$viejo = @'
- Una sola coleccion: Bitwarden -> Organizacion PanFree -> Produccion.
- No existe coleccion "Legado".
'@

$nuevo = @'
- Bitwarden -> Organizacion PanFree tiene 3 carpetas: Claves Personales,
  Desarrollo, Produccion.
- La carpeta Produccion es la fuente de verdad para claves productivas.
- No existe carpeta "Legado".
'@

$tieneViejo = $contenido.Contains($viejo.Trim())
$tieneNuevo = $contenido.Contains('Bitwarden -> Organizacion PanFree tiene 3 carpetas')

Write-Host '--- Auditoria previa ---' -ForegroundColor Cyan
Write-Host "  Contiene bloque viejo?  $tieneViejo"
Write-Host "  Contiene bloque nuevo?  $tieneNuevo"
Write-Host ''

if ($tieneNuevo) {
    Write-Host '[INFO] Ya aplicado. Nada que hacer.' -ForegroundColor Green
    exit 0
}

if (-not $tieneViejo) {
    Write-Host '[ERROR] No matchea el bloque viejo. Abortando.' -ForegroundColor Red
    exit 1
}

if (-not $Aplicar) {
    Write-Host '[DRY RUN] No se escribe nada. Agregar -Aplicar para aplicar.' -ForegroundColor Yellow
    Write-Host ''
    exit 0
}

$contenidoNuevo = $contenido.Replace($viejo.Trim(), $nuevo.Trim())

if ($contenidoNuevo -eq $contenido) {
    Write-Host '[WARN] Sin cambios netos.' -ForegroundColor Yellow
    exit 0
}

[System.IO.File]::WriteAllText($rotFile, $contenidoNuevo, (New-Object System.Text.UTF8Encoding $false))
Write-Host '[OK] ROTACION-CLAVES.md actualizado' -ForegroundColor Green
Write-Host ''

# --- Verificacion post-write ------------------------------------------------

Write-Host '--- Verificacion post-write ---' -ForegroundColor Cyan

$post = [System.IO.File]::ReadAllText($rotFile)

$checks = @(
    @{ Nombre = 'Contiene "Bitwarden -> Organizacion PanFree tiene 3 carpetas"'; Match = $post.Contains('Bitwarden -> Organizacion PanFree tiene 3 carpetas') },
    @{ Nombre = 'Ya NO contiene "Una sola coleccion:"';                         Match = -not $post.Contains('Una sola coleccion:') },
    @{ Nombre = 'Contiene "No existe carpeta \"Legado\""';                      Match = $post.Contains('No existe carpeta "Legado"') }
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
Write-Host ' 70b COMPLETADO' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''