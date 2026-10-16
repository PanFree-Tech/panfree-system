# ============================================================================
# 70-reconciliar-bitwarden.ps1
# ----------------------------------------------------------------------------
# Reconciliar docs con la realidad de Bitwarden: 3 carpetas (Claves
# Personales, Desarrollo, Produccion) vs 1 documentada.
#
# Toca 4 archivos:
#   - docs/operations/SISTEMA-DE-TRABAJO.md (seccion 7.4)
#   - docs/operations/ENVIRONMENT.md (seccion Almacenamiento)
#   - docs/operations/ROTACION-CLAVES.md (Modelo de Bitwarden)
#   - docs/operations/GESTION-DE-RIESGOS.md (R-05 nota)
#
# Idempotente. Dry run por defecto. -Aplicar escribe.
# Verificacion post-write obligatoria.
# ============================================================================

param(
    [switch]$Aplicar
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

$archivos = @(
    @{
        Id = '01-SISTEMA-DE-TRABAJO'
        Ruta = 'docs\operations\SISTEMA-DE-TRABAJO.md'
        Viejo = '- Una sola coleccion en Bitwarden: Organizacion PanFree -> Produccion.'
        Nuevo = @'
- Bitwarden -> Organizacion PanFree tiene 3 carpetas: Claves Personales,
  Desarrollo, Produccion. La carpeta Produccion es la fuente de verdad
  para claves productivas.
'@
    },
    @{
        Id = '02-ENVIRONMENT'
        Ruta = 'docs\operations\ENVIRONMENT.md'
        Viejo = @'
Bitwarden - Organizacion PanFree - Coleccion Produccion.

Una sola coleccion. No existe "Legado". El historial de rotaciones
vive en la NOTA de cada item (key saliente completa + fecha de
revocacion + tarea + motivo).
'@
        Nuevo = @'
Bitwarden - Organizacion PanFree tiene 3 carpetas:
- Claves Personales (n8n, admin, etc.)
- Desarrollo
- Produccion (fuente de verdad para claves productivas)

No existe carpeta "Legado". El historial de rotaciones vive en la
NOTA de cada item (key saliente completa + fecha + tarea + motivo).

Items sueltos: panfree.fit y supabase.com (sin sufijo - Produccion).
Son logins de los dashboards (no API keys).
'@
    },
    @{
        Id = '03-ROTACION-CLAVES'
        Ruta = 'docs\operations\ROTACION-CLAVES.md'
        Viejo = @'
- Una sola coleccion: Bitwarden -> Organizacion PanFree -> Produccion.
- No existe coleccion "Legado".
'@
        Nuevo = @'
- Bitwarden -> Organizacion PanFree tiene 3 carpetas: Claves Personales,
  Desarrollo, Produccion.
- La carpeta Produccion es la fuente de verdad para claves productivas.
- No existe carpeta "Legado".
'@
    },
    @{
        Id = '04-GESTION-DE-RIESGOS'
        Ruta = 'docs\operations\GESTION-DE-RIESGOS.md'
        Viejo = @'
Nota S16: no existe coleccion "Legado". El historial de rotaciones
vive en la nota de cada item (key saliente completa + fecha + motivo).
Un export de la boveda (JSON encriptado) ya incluye esas notas; no hay
una coleccion separada que respaldar.
'@
        Nuevo = @'
Nota S16+S22: no existe carpeta "Legado". El historial de rotaciones
vive en la nota de cada item (key saliente completa + fecha + motivo).
Un export de la boveda (JSON encriptado) ya incluye esas notas; no hay
una carpeta separada que respaldar.

Nota S22: Bitwarden -> Organizacion PanFree tiene 3 carpetas
(Claves Personales, Desarrollo, Produccion). Un export de la boveda
las incluye todas.
'@
    }
)

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 70 - Reconciliar Bitwarden vs docs (S22)' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

$modo = if ($Aplicar) { 'APLICAR' } else { 'DRY RUN' }
Write-Host "Modo: $modo" -ForegroundColor Yellow
Write-Host ''

# --- Auditoria previa -------------------------------------------------------

Write-Host '--- Auditoria previa ---' -ForegroundColor Cyan
Write-Host ''

$planes = @()
foreach ($a in $archivos) {
    $full = Join-Path $repoRoot $a.Ruta
    if (-not (Test-Path -LiteralPath $full)) {
        Write-Host "  [$($a.Id)] ERROR: no existe $($a.Ruta)" -ForegroundColor Red
        exit 1
    }

    $contenido = [System.IO.File]::ReadAllText($full)
    $tieneViejo = $contenido.Contains($a.Viejo.Trim())
    $tieneNuevo = $contenido.Contains('3 carpetas')

    $estado = if ($tieneNuevo) { 'YA aplicado' } elseif ($tieneViejo) { 'Pendiente' } else { 'NO ENCONTRADO' }
    $color = if ($estado -eq 'Pendiente') { 'Yellow' } elseif ($estado -eq 'YA aplicado') { 'Green' } else { 'Red' }
    Write-Host "  [$($a.Id)] $estado" -ForegroundColor $color

    $planes += [pscustomobject]@{
        Id         = $a.Id
        Ruta       = $a.Ruta
        Full       = $full
        Viejo      = $a.Viejo.Trim()
        Nuevo      = $a.Nuevo.Trim()
        TieneViejo = $tieneViejo
        TieneNuevo = $tieneNuevo
    }
}

Write-Host ''

# --- Dry run ----------------------------------------------------------------

if (-not $Aplicar) {
    Write-Host '[DRY RUN] No se escribe nada. Agregar -Aplicar para aplicar.' -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'Acciones que se realizarian:' -ForegroundColor Yellow
    foreach ($p in $planes) {
        if ($p.TieneNuevo) {
            Write-Host "  [SKIP] $($p.Id) - ya aplicado" -ForegroundColor Yellow
        } elseif (-not $p.TieneViejo) {
            Write-Host "  [WARN] $($p.Id) - no matchea el bloque viejo" -ForegroundColor Yellow
        } else {
            Write-Host "  [OK]   $($p.Id) - reemplazar" -ForegroundColor Yellow
        }
    }
    Write-Host ''
    exit 0
}

# --- Aplicar ----------------------------------------------------------------

foreach ($p in $planes) {
    if ($p.TieneNuevo) {
        Write-Host "  [SKIP] $($p.Id) - ya aplicado" -ForegroundColor Yellow
        continue
    }
    if (-not $p.TieneViejo) {
        Write-Host "  [WARN] $($p.Id) - no matchea, no se toca" -ForegroundColor Yellow
        continue
    }

    $contenido = [System.IO.File]::ReadAllText($p.Full)
    $contenidoNuevo = $contenido.Replace($p.Viejo, $p.Nuevo)

    if ($contenidoNuevo -eq $contenido) {
        Write-Host "  [WARN] $($p.Id) - sin cambios netos" -ForegroundColor Yellow
        continue
    }

    [System.IO.File]::WriteAllText($p.Full, $contenidoNuevo, (New-Object System.Text.UTF8Encoding $false))
    Write-Host "  [OK] $($p.Id) reemplazado" -ForegroundColor Green
}

Write-Host ''
Write-Host '[OK] Los 4 archivos fueron procesados.' -ForegroundColor Green
Write-Host ''

# --- Verificacion post-write ------------------------------------------------

Write-Host '--- Verificacion post-write ---' -ForegroundColor Cyan

$checks = @()
foreach ($p in $planes) {
    $post = [System.IO.File]::ReadAllText($p.Full)
    $checks += @{
        Nombre = "$($p.Id): contiene '3 carpetas'"
        Match  = $post.Contains('3 carpetas')
    }
    $checks += @{
        Nombre = "$($p.Id): ya NO dice 'Una sola coleccion'"
        Match  = -not $post.Contains('Una sola coleccion')
    }
}

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
Write-Host ' 70 COMPLETADO' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'PROXIMO PASO:' -ForegroundColor Yellow
Write-Host '  1. git diff docs/operations/' -ForegroundColor Yellow
Write-Host '  2. Si OK, commit + push' -ForegroundColor Yellow
Write-Host ''