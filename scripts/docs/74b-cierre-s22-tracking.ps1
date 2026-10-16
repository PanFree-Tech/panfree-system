# ============================================================================
# 74b-cierre-s22-tracking.ps1
# ----------------------------------------------------------------------------
# Actualiza el tracking de hallazgos al cierre de S22:
#   - Cerrar CONF-001 (commit a9fa9a7b)
#   - Cerrar CONF-002 (commit ce7cdd70)
#   - Agregar CONF-003, CONF-004, CONF-005
#   - Actualizar header: fin Sesion 22
#   - Actualizar Total: 69 -> 72
#   - Actualizar resumen: Abierto 22->25, Cerrado 42->44
#
# Idempotente. Dry run por defecto. -Aplicar escribe.
# Verificacion post-write obligatoria.
# ============================================================================

param(
    [switch]$Aplicar
)

$ErrorActionPreference = 'Stop'

$repoRoot     = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$trackingFile = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 74b - Cierre S22 (tracking)' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

$modo = if ($Aplicar) { 'APLICAR' } else { 'DRY RUN' }
Write-Host "Modo: $modo" -ForegroundColor Yellow
Write-Host ''

if (-not (Test-Path -LiteralPath $trackingFile)) {
    Write-Host "[ERROR] No existe: $trackingFile" -ForegroundColor Red
    exit 1
}

$contenido = [System.IO.File]::ReadAllText($trackingFile)

# --- Reemplazos ---------------------------------------------------------------

$reemplazos = @(
    @{
        Id    = 'Header-Fecha'
        Viejo = '**Ultima actualizacion:** 2026-10-16 (fin Sesion 21)'
        Nuevo = '**Ultima actualizacion:** 2026-10-16 (fin Sesion 22)'
    },
    @{
        Id    = 'Header-Total'
        Viejo = '**Total de hallazgos:** 69'
        Nuevo = '**Total de hallazgos:** 72'
    },
    @{
        Id    = 'Resumen-Abierto'
        Viejo = '| Abierto | 22 |'
        Nuevo = '| Abierto | 25 |'
    },
    @{
        Id    = 'Resumen-Cerrado'
        Viejo = '| Cerrado | 42 |'
        Nuevo = '| Cerrado | 44 |'
    },
    @{
        Id    = 'Cerrar-CONF-001'
        Viejo = '| CONF-001 | ESLint ignorado en build | F3 | P2 | Abierto | - |'
        Nuevo = '| CONF-001 | ESLint ignorado en build | F3 | P2 | Cerrado (S22) | a9fa9a7b |'
    },
    @{
        Id    = 'Cerrar-CONF-002'
        Viejo = '| CONF-002 | Sin headers de seguridad | F3 | P2 | Abierto | - |'
        Nuevo = '| CONF-002 | Sin headers de seguridad | F3 | P2 | Cerrado (S22) | ce7cdd70 |'
    }
)

# --- Auditoria previa --------------------------------------------------------

Write-Host '--- Auditoria previa ---' -ForegroundColor Cyan
Write-Host ''

$planes = @()
foreach ($r in $reemplazos) {
    $tieneViejo = $contenido.Contains($r.Viejo)
    $tieneNuevo = $contenido.Contains($r.Nuevo)
    $estado = if ($tieneNuevo) { 'YA aplicado' } elseif ($tieneViejo) { 'Pendiente' } else { 'NO ENCONTRADO' }
    $color = if ($estado -eq 'Pendiente') { 'Yellow' } elseif ($estado -eq 'YA aplicado') { 'Green' } else { 'Red' }
    Write-Host "  [$($r.Id)] $estado" -ForegroundColor $color

    $planes += [pscustomobject]@{
        Id         = $r.Id
        Viejo      = $r.Viejo
        Nuevo      = $r.Nuevo
        TieneViejo = $tieneViejo
        TieneNuevo = $tieneNuevo
    }
}

# Chequeo de los nuevos hallazgos
Write-Host ''
Write-Host '--- Nuevos hallazgos ---' -ForegroundColor Cyan
$tieneCONF003 = $contenido.Contains('CONF-003')
$tieneCONF004 = $contenido.Contains('CONF-004')
$tieneCONF005 = $contenido.Contains('CONF-005')
Write-Host "  CONF-003 ya existe? $tieneCONF003"
Write-Host "  CONF-004 ya existe? $tieneCONF004"
Write-Host "  CONF-005 ya existe? $tieneCONF005"
Write-Host ''

if (-not $Aplicar) {
    Write-Host '[DRY RUN] No se escribe nada. Agregar -Aplicar para aplicar.' -ForegroundColor Yellow
    Write-Host ''
    exit 0
}

# --- Aplicar reemplazos ------------------------------------------------------

$nuevo = $contenido
foreach ($p in $planes) {
    if ($p.TieneNuevo) { continue }
    if (-not $p.TieneViejo) { continue }
    $nuevo = $nuevo.Replace($p.Viejo, $p.Nuevo)
    Write-Host "  [OK] $($p.Id) reemplazado" -ForegroundColor Green
}

# --- Agregar nuevos hallazgos ------------------------------------------------

if (-not $tieneCONF003 -and -not $tieneCONF004 -and -not $tieneCONF005) {
    $nuevos = @(
        '',
        '| CONF-003 | ~30 warnings de ESLint en build (mayoria <img> sin <Image />) | F3 | P3 | Abierto | - |',
        '| CONF-004 | typescript.ignoreBuildErrors: true en next.config.js | F3 | P2 | Abierto | - |',
        '| CONF-005 | Content-Security-Policy (CSP) pendiente | F3 | P3 | Abierto | - |'
    ) -join "`r`n"

    $ancla = "`r`n---`r`n`r`n## 4. Como cerrar un hallazgo"
    if ($nuevo.Contains($ancla)) {
        $nuevo = $nuevo.Replace($ancla, $nuevos + $ancla)
        Write-Host '  [OK] CONF-003, CONF-004, CONF-005 agregados' -ForegroundColor Green
    } else {
        Write-Host '  [WARN] No se encontro el ancla para insertar' -ForegroundColor Yellow
    }
}

[System.IO.File]::WriteAllText($trackingFile, $nuevo, (New-Object System.Text.UTF8Encoding $false))
Write-Host ''
Write-Host '[OK] Tracking actualizado' -ForegroundColor Green
Write-Host ''

# --- Verificacion post-write -------------------------------------------------

Write-Host '--- Verificacion post-write ---' -ForegroundColor Cyan

$post = [System.IO.File]::ReadAllText($trackingFile)

$checks = @(
    @{ Nombre = 'Header fin Sesion 22';      Match = $post.Contains('**Ultima actualizacion:** 2026-10-16 (fin Sesion 22)') },
    @{ Nombre = 'Total 72';                   Match = $post.Contains('**Total de hallazgos:** 72') },
    @{ Nombre = 'Abierto 25';                 Match = $post.Contains('| Abierto | 25 |') },
    @{ Nombre = 'Cerrado 44';                 Match = $post.Contains('| Cerrado | 44 |') },
    @{ Nombre = 'CONF-001 cerrado';           Match = $post.Contains('| CONF-001 | ESLint ignorado en build | F3 | P2 | Cerrado (S22) | a9fa9a7b |') },
    @{ Nombre = 'CONF-002 cerrado';           Match = $post.Contains('| CONF-002 | Sin headers de seguridad | F3 | P2 | Cerrado (S22) | ce7cdd70 |') },
    @{ Nombre = 'CONF-003 agregado';          Match = $post.Contains('CONF-003') },
    @{ Nombre = 'CONF-004 agregado';          Match = $post.Contains('CONF-004') },
    @{ Nombre = 'CONF-005 agregado';          Match = $post.Contains('CONF-005') }
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
Write-Host ' 74b COMPLETADO' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''