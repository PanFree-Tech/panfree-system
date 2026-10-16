# ============================================================================
# 69a-sync-status.ps1
# ----------------------------------------------------------------------------
# Sincroniza docs/STATUS.md con el estado real post-S21:
#   - Tabla resumen: F3 6->7, Total 36->37
#   - Proximos 3 pasos: F2-14/F3-07 (cerrados) -> F2-03/F3-08/F3-09
#   - Metricas clave: claves, hallazgos, commits
#   - Eliminar duplicacion de Sesion 20
#
# Idempotente. Dry run por defecto. -Aplicar escribe.
# Verificacion post-write obligatoria.
# ============================================================================

param(
    [switch]$Aplicar
)

$ErrorActionPreference = 'Stop'

$repoRoot   = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$statusFile = Join-Path $repoRoot 'docs\STATUS.md'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 69a - Sincronizar STATUS.md (S22)' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

$modo = if ($Aplicar) { 'APLICAR' } else { 'DRY RUN' }
Write-Host "Modo: $modo" -ForegroundColor Yellow
Write-Host ''

if (-not (Test-Path -LiteralPath $statusFile)) {
    Write-Host "[ERROR] No existe: $statusFile" -ForegroundColor Red
    exit 1
}

$contenido = [System.IO.File]::ReadAllText($statusFile)

# ============================================================================
# Reemplazos literales
# ============================================================================

$reemplazos = @(
    @{
        Id    = '01-Tabla-F3'
        Viejo = '| F3 - Codigo | 9 | 6 | 0 | 3 | 67% |'
        Nuevo = '| F3 - Codigo | 9 | 7 | 0 | 2 | 78% |'
    },
    @{
        Id    = '02-Tabla-Total'
        Viejo = '| **Total** | **47** | **36** | **0** | **11** | **76%** |'
        Nuevo = '| **Total** | **47** | **37** | **0** | **10** | **79%** |'
    },
    @{
        Id    = '03-Proximos-Pasos'
        Viejo = @'
1. **F2-03** - Cloudinary Root User (reconsultar ticket #392411 desde 2026-10-18)
2. **F2-14** - Guardar .env consolidado en Bitwarden
3. **F3-07** - Fix BUG-001 (VAPID inconsistente en admin/page.js)
'@
        Nuevo = @'
1. **F2-03** - Cloudinary Root User (reconsultar ticket #392411 desde 2026-10-18)
2. **F3-08** - ESLint en build (CONF-001)
3. **F3-09** - Headers de seguridad (CONF-002)
'@
    },
    @{
        Id    = '04-Metricas-Claves-Rotadas'
        Viejo = '| Claves productivas rotadas | 3 / 12 | 12 / 12 |'
        Nuevo = '| Claves productivas rotadas | 6 / 12 | 12 / 12 |'
    },
    @{
        Id    = '05-Metricas-Bitwarden'
        Viejo = '| Claves en Bitwarden | 4 / 12 | 12 / 12 |'
        Nuevo = '| Claves en Bitwarden | 6 / 12 | 12 / 12 |'
    },
    @{
        Id    = '06-Metricas-Hallazgos'
        Viejo = '| Hallazgos cerrados | 31 / 47 | 47 / 47 |'
        Nuevo = '| Hallazgos cerrados | 42 / 67 | 67 / 67 |'
    },
    @{
        Id    = '07-Metricas-Commits'
        Viejo = '| Commits de remediacion | 8 | ~40 |'
        Nuevo = '| Commits de remediacion | ~50 | ~50 (OK) |'
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
# Deduplicacion de Sesion 20
# ============================================================================

Write-Host '--- Deduplicacion Sesion 20 ---' -ForegroundColor Cyan

# El bloque duplicado completo (con SEC-020):
$bloqueDuplicado = @'

---

**2026-10-16 - Sesion 20 (ENV) - COMPLETA**
- F2-12: rotacion completa del par VAPID + fix de codigo.
- F3-07 / SEC-014 / BUG-001 / BUG-012: VAPID_PUBLIC_KEY unificada desde env.
- SEC-024: no aplica (era artefacto visual del CLI de Vercel).
- DOC-015 (nuevo): alias Vercel www.panfree.fit apuntaba a deployment viejo.
- SEC-020 cerrado: todos los items Bitwarden rotables completos.
- Commit: 5923f3a6 + 13f3cc96.
'@

$contieneDuplicado = $contenido.Contains($bloqueDuplicado)
Write-Host "  Bloque duplicado de S20 presente? $contieneDuplicado" -ForegroundColor $(if ($contieneDuplicado) { 'Yellow' } else { 'Green' })
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
    if ($contieneDuplicado) {
        Write-Host '  [OK]   Deduplicacion - eliminar bloque duplicado de S20' -ForegroundColor Yellow
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

if ($contieneDuplicado) {
    $nuevo = $nuevo.Replace($bloqueDuplicado, '')
    Write-Host '  [OK] Bloque duplicado de S20 eliminado' -ForegroundColor Green
}

if ($nuevo -eq $contenido) {
    Write-Host ''
    Write-Host '[INFO] No hubo cambios netos.' -ForegroundColor Yellow
    exit 0
}

[System.IO.File]::WriteAllText($statusFile, $nuevo, (New-Object System.Text.UTF8Encoding $false))
Write-Host ''
Write-Host '[OK] STATUS.md escrito' -ForegroundColor Green
Write-Host ''

# ============================================================================
# Verificacion post-write obligatoria
# ============================================================================

Write-Host '--- Verificacion post-write ---' -ForegroundColor Cyan

$post = [System.IO.File]::ReadAllText($statusFile)

$checks = @(
    @{ Nombre = 'F3 dice 7 OK';                    Match = $post.Contains('| F3 - Codigo | 9 | 7 | 0 | 2 | 78% |') },
    @{ Nombre = 'Total dice 37 OK';                Match = $post.Contains('| **Total** | **47** | **37** | **0** | **10** | **79%** |') },
    @{ Nombre = 'Proximos pasos dice F3-08';       Match = $post.Contains('2. **F3-08** - ESLint en build') },
    @{ Nombre = 'Proximos pasos dice F3-09';       Match = $post.Contains('3. **F3-09** - Headers de seguridad') },
    @{ Nombre = 'Metricas claves rotadas 6/12';    Match = $post.Contains('| Claves productivas rotadas | 6 / 12 |') },
    @{ Nombre = 'Metricas Bitwarden 6/12';         Match = $post.Contains('| Claves en Bitwarden | 6 / 12 |') },
    @{ Nombre = 'Metricas hallazgos 42/67';        Match = $post.Contains('| Hallazgos cerrados | 42 / 67 |') },
    @{ Nombre = 'Duplicacion eliminada (1 sola entrada S20)'; Match = (($post -split 'Sesion 20 \(ENV\) - COMPLETA').Count -eq 2) }
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
    Write-Host '        Revisar manualmente el STATUS.md antes de commitear.' -ForegroundColor Red
    exit 1
}

Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 69a COMPLETADO' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'PROXIMO PASO:' -ForegroundColor Yellow
Write-Host '  1. git diff docs/STATUS.md' -ForegroundColor Yellow
Write-Host '  2. Si OK, commit + push' -ForegroundColor Yellow
Write-Host ''