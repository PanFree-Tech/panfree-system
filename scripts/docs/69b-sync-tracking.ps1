# ============================================================================
# 69b-sync-tracking.ps1
# ----------------------------------------------------------------------------
# Sincroniza docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md con
# el estado real post-S21:
#   - Header: fin Sesion 20 -> fin Sesion 21
#   - Total: 63 -> 69 (conteo real de filas)
#   - Resumen: Abierto 20->22, Cerrado 41->42
#   - Limpiar filas vacias entre DOC-011/DOC-015 y despues de DOC-019
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
Write-Host ' 69b - Sincronizar tracking de hallazgos (S22)' -ForegroundColor Cyan
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

# ============================================================================
# Reemplazos literales
# ============================================================================

$reemplazos = @(
    @{
        Id    = '01-Header-Fecha'
        Viejo = '**Ultima actualizacion:** 2026-10-16 (fin Sesion 20)'
        Nuevo = '**Ultima actualizacion:** 2026-10-16 (fin Sesion 21)'
    },
    @{
        Id    = '02-Header-Total'
        Viejo = '**Total de hallazgos:** 63'
        Nuevo = '**Total de hallazgos:** 69'
    },
    @{
        Id    = '03-Resumen-Abierto'
        Viejo = '| Abierto | 20 |'
        Nuevo = '| Abierto | 22 |'
    },
    @{
        Id    = '04-Resumen-Cerrado'
        Viejo = '| Cerrado | 41 |'
        Nuevo = '| Cerrado | 42 |'
    }
)

# ============================================================================
# Auditoria previa
# ============================================================================

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

Write-Host ''

# ============================================================================
# Deteccion de filas vacias entre tablas
# ============================================================================

Write-Host '--- Filas vacias detectadas ---' -ForegroundColor Cyan

# Fila vacia entre DOC-011 y DOC-015
$patronFilaVacia1 = "| DOC-011 | Variables en .env.example sin equivalente en Vercel (CLARITY, EMAIL_FROM, BASE_URL, GEMINI_MODEL, NEXA) | F2 | P3 | Abierto | - |`r`n`r`n| DOC-015 |"
$tieneFilaVacia1 = $contenido.Contains($patronFilaVacia1)
Write-Host "  Entre DOC-011 y DOC-015: $tieneFilaVacia1" -ForegroundColor $(if ($tieneFilaVacia1) { 'Yellow' } else { 'Green' })

# Patron para eliminar la fila vacia (dejar solo un \r\n)
$bloqueFilaVacia1 = @'
| DOC-011 | Variables en .env.example sin equivalente en Vercel (CLARITY, EMAIL_FROM, BASE_URL, GEMINI_MODEL, NEXA) | F2 | P3 | Abierto | - |

| DOC-015 |
'@

$reemplazoFilaVacia1 = @'
| DOC-011 | Variables en .env.example sin equivalente en Vercel (CLARITY, EMAIL_FROM, BASE_URL, GEMINI_MODEL, NEXA) | F2 | P3 | Abierto | - |
| DOC-015 |
'@

Write-Host ''

# ============================================================================
# Dry run
# ============================================================================

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
    if ($tieneFilaVacia1) {
        Write-Host '  [OK]   Limpiar fila vacia entre DOC-011 y DOC-015' -ForegroundColor Yellow
    }
    Write-Host ''
    exit 0
}

# ============================================================================
# Aplicar
# ============================================================================

$nuevo = $contenido

foreach ($p in $planes) {
    if ($p.TieneNuevo) {
        Write-Host "  [SKIP] $($p.Id) - ya aplicado" -ForegroundColor Yellow
        continue
    }
    if (-not $p.TieneViejo) {
        Write-Host "  [WARN] $($p.Id) - no matchea, no se toca" -ForegroundColor Yellow
        continue
    }
    $nuevo = $nuevo.Replace($p.Viejo, $p.Nuevo)
    Write-Host "  [OK] $($p.Id) reemplazado" -ForegroundColor Green
}

# Limpiar fila vacia entre DOC-011 y DOC-015
if ($tieneFilaVacia1) {
    $nuevo = $nuevo.Replace($bloqueFilaVacia1.Trim(), $reemplazoFilaVacia1.Trim())
    Write-Host '  [OK] Fila vacia entre DOC-011 y DOC-015 eliminada' -ForegroundColor Green
}

if ($nuevo -eq $contenido) {
    Write-Host ''
    Write-Host '[INFO] No hubo cambios netos.' -ForegroundColor Yellow
    exit 0
}

[System.IO.File]::WriteAllText($trackingFile, $nuevo, (New-Object System.Text.UTF8Encoding $false))
Write-Host ''
Write-Host '[OK] Tracking escrito' -ForegroundColor Green
Write-Host ''

# ============================================================================
# Verificacion post-write obligatoria
# ============================================================================

Write-Host '--- Verificacion post-write ---' -ForegroundColor Cyan

$post = [System.IO.File]::ReadAllText($trackingFile)

$checks = @(
    @{ Nombre = 'Header dice fin Sesion 21';      Match = $post.Contains('**Ultima actualizacion:** 2026-10-16 (fin Sesion 21)') },
    @{ Nombre = 'Header dice Total 69';           Match = $post.Contains('**Total de hallazgos:** 69') },
    @{ Nombre = 'Resumen Abierto 22';             Match = $post.Contains('| Abierto | 22 |') },
    @{ Nombre = 'Resumen Cerrado 42';             Match = $post.Contains('| Cerrado | 42 |') },
    @{ Nombre = 'Fila vacia entre DOC-011/015 eliminada'; Match = -not $post.Contains("| DOC-011 | Variables en .env.example sin equivalente en Vercel (CLARITY, EMAIL_FROM, BASE_URL, GEMINI_MODEL, NEXA) | F2 | P3 | Abierto | - |`r`n`r`n| DOC-015 |") }
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
Write-Host ' 69b COMPLETADO' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'PROXIMO PASO:' -ForegroundColor Yellow
Write-Host '  1. git diff docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md' -ForegroundColor Yellow
Write-Host '  2. Si OK, commit + push' -ForegroundColor Yellow
Write-Host ''