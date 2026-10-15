# ============================================================================
# 32-actualizar-tracking-s14.ps1
# ----------------------------------------------------------------------------
# Registra los 10 hallazgos nuevos de la Sesion 14 en el tracking.
# NO commitea (se hace despues, junto con el doc de hallazgos).
# Fecha: 2026-10-14
# ----------------------------------------------------------------------------
# Uso:
#   Dry run:  .\32-actualizar-tracking-s14.ps1
#   Aplicar:  .\32-actualizar-tracking-s14.ps1 -Commit
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

# ============================================================================
# 1. Localizar el tracking
# ============================================================================

$trackPath = Join-Path $RepoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'

Write-Step 'Leer tracking'
if (-not (Test-Path -LiteralPath $trackPath)) {
    Write-Err '06-hallazgos-tracking.md no existe'
    Pop-Location
    exit 1
}
$track = Read-FileRaw $trackPath
Write-Ok ('Tracking leido: ' + $track.Length + ' chars')

# ============================================================================
# 2. Idempotencia: si ya hay algun BUG-010, no reescribir
# ============================================================================

Write-Step 'Chequeo de idempotencia'
if ($track.Contains('BUG-010')) {
    Write-Skip 'BUG-010 ya presente en tracking. Nada que hacer.'
    Pop-Location
    exit 0
}
Write-Ok 'Tracking pre-S14: no tiene BUG-010'

# ============================================================================
# 3. Fecha de ultima actualizacion
# ============================================================================

Write-Step 'Actualizar fecha de ultima actualizacion'
$fechaVieja = '**Ultima actualizacion:** 2026-10-14 (fin Sesion 13)'
$fechaNueva = '**Ultima actualizacion:** 2026-10-14 (fin Sesion 14)'
if (-not $track.Contains($fechaVieja)) {
    Write-Err 'No encontre la linea de fecha vieja. Abortando.'
    Pop-Location
    exit 1
}
$track = $track.Replace($fechaVieja, $fechaNueva)
Write-Ok 'Fecha actualizada a fin Sesion 14'

# ============================================================================
# 4. Total de hallazgos: 34 -> 44
# ============================================================================

Write-Step 'Actualizar total de hallazgos (34 -> 44)'
$totalViejo = '**Total de hallazgos:** 34'
$totalNuevo = '**Total de hallazgos:** 44'
if (-not $track.Contains($totalViejo)) {
    Write-Err 'No encontre Total=34. Abortando.'
    Pop-Location
    exit 1
}
$track = $track.Replace($totalViejo, $totalNuevo)
Write-Ok 'Total actualizado: 34 -> 44'

# ============================================================================
# 5. Resumen seccion 1: Abierto 6 -> 15, Cerrado 27 -> 28
# ============================================================================

Write-Step 'Actualizar resumen seccion 1'

$bloqueResumenViejo = @(
    '| Estado | Cantidad |',
    '|---|---|',
    '| Abierto | 6 |',
    '| En curso | 0 |',
    '| Cerrado | 27 |',
    '| Aceptado | 1 |'
) -join "`r`n"

$bloqueResumenNuevo = @(
    '| Estado | Cantidad |',
    '|---|---|',
    '| Abierto | 15 |',
    '| En curso | 0 |',
    '| Cerrado | 28 |',
    '| Aceptado | 1 |'
) -join "`r`n"

if (-not $track.Contains($bloqueResumenViejo)) {
    Write-Err 'No encontre el bloque resumen viejo. Abortando.'
    Pop-Location
    exit 1
}
$track = $track.Replace($bloqueResumenViejo, $bloqueResumenNuevo)
Write-Ok 'Resumen seccion 1 actualizado'

# ============================================================================
# 6. Hallazgos por severidad: recalcular
# ============================================================================

Write-Step 'Actualizar seccion 2 (por severidad)'

# Antes:
#   Critica  8 / 6
#   Alta     11 / 7
#   Media    8 / 4
#   Baja     4 / 1
# Despues:
#   Critica  9 / 7   (+1 BUG-010 critico cerrado)
#   Alta     11 / 7  (sin cambios)
#   Media    14 / 4  (+6 medios: BUG-006..009, SEC-018, SEC-019)
#   Baja     7 / 1   (+3 bajos: BUG-011, DOC-002, DOC-003)

$sevViejo = @(
    '| Severidad | Cantidad | Cerrados |',
    '|---|---|---|',
    '| Critica | 8 | 6 |',
    '| Alta | 11 | 7 |',
    '| Media | 8 | 4 |',
    '| Baja | 4 | 1 |'
) -join "`r`n"

$sevNuevo = @(
    '| Severidad | Cantidad | Cerrados |',
    '|---|---|---|',
    '| Critica | 9 | 7 |',
    '| Alta | 11 | 7 |',
    '| Media | 14 | 4 |',
    '| Baja | 7 | 1 |'
) -join "`r`n"

if (-not $track.Contains($sevViejo)) {
    Write-Err 'No encontre el bloque de severidad viejo. Abortando.'
    Pop-Location
    exit 1
}
$track = $track.Replace($sevViejo, $sevNuevo)
Write-Ok 'Seccion 2 (severidad) actualizada'

# ============================================================================
# 7. Insertar BUG-010 en hallazgos criticos
# ============================================================================

Write-Step 'Insertar BUG-010 en hallazgos criticos'

$anclaCriticos = '| SEC-005 | anon con DDL sobre clientes | F3 | P0 | Cerrado | 4d5bd9c2 |'
$filaBUG010 = '| BUG-010 | Regresion del logger (S13): import erroneo en 88 archivos | F3 | P1 | Cerrado | 757938c2 |'

if (-not $track.Contains($anclaCriticos)) {
    Write-Err 'No encontre ancla de criticos (SEC-005). Abortando.'
    Pop-Location
    exit 1
}
$track = $track.Replace($anclaCriticos, $anclaCriticos + "`r`n" + $filaBUG010)
Write-Ok 'BUG-010 insertado en criticos'

# ============================================================================
# 8. Insertar los 6 medios despues de SEC-012
# ============================================================================

Write-Step 'Insertar hallazgos medios (BUG-006..009, SEC-018, SEC-019)'

$anclaMedios = '| SEC-012 | canjes_premios usa clientes.role en vez de is_admin() | F3 | P2 | Cerrado | (Sesion 9) |'

$filasMedias = @(
    '| BUG-006 | .env.example dice gemini-2.5-flash pero codigo usa gemini-3.1-flash-image | F3 | P2 | Abierto | - |',
    '| BUG-007 | IDs de modelo Gemini hardcodeados en marketing/page.js:51-52 | F3 | P2 | Abierto | - |',
    '| BUG-008 | geminiService llama a /generate-caption pero endpoint real es /generar-contenido | F3 | P2 | Abierto | - |',
    '| BUG-009 | endpoint usa gemini-3.7-flash que no existe en AI Studio | F3 | P2 | Abierto | - |',
    '| SEC-018 | 3 API keys activas en Cloudinary sin trazabilidad | F2 | P2 | Abierto | - |',
    '| SEC-019 | 4 API keys activas en Gemini sin trazabilidad | F2 | P2 | Abierto | - |'
) -join "`r`n"

if (-not $track.Contains($anclaMedios)) {
    Write-Err 'No encontre ancla de medios (SEC-012). Abortando.'
    Pop-Location
    exit 1
}
$track = $track.Replace($anclaMedios, $anclaMedios + "`r`n" + $filasMedias)
Write-Ok '6 hallazgos medios insertados'

# ============================================================================
# 9. Insertar los 3 bajos despues de BUG-005 (ultima fila de bajos)
# ============================================================================

Write-Step 'Insertar hallazgos bajos (BUG-011, DOC-002, DOC-003)'

$anclaBajos = '| BUG-005 | AuthModal inserta columnas sin GRANT post-F3-01 | F3 | P2 | Cerrado | 7b014cc4 |'

$filasBajas = @(
    '| BUG-011 | bug en script 29-fix-logger-import.ps1 (Write-Ok con $modified + string) | F3 | P3 | Abierto | - |',
    '| DOC-002 | MARKETING_INTELLIGENT_SYSTEM.md menciona modelos gemini-3.5-flash inexistentes | F3 | P3 | Abierto | - |',
    '| DOC-003 | discrepancia endpoint frontend vs backend (geminiService) | F3 | P3 | Abierto | - |'
) -join "`r`n"

if (-not $track.Contains($anclaBajos)) {
    Write-Err 'No encontre ancla de bajos (BUG-005). Abortando.'
    Pop-Location
    exit 1
}
$track = $track.Replace($anclaBajos, $anclaBajos + "`r`n" + $filasBajas)
Write-Ok '3 hallazgos bajos insertados'

# ============================================================================
# 10. Escribir
# ============================================================================

Write-Step 'Escribir tracking'

if ($Commit) {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    Backup-File $trackPath $stamp
    Write-FileRaw $trackPath $track
    Write-Ok 'Tracking escrito y backup guardado'
} else {
    Write-Host '   (dry run: tracking NO escrito)' -ForegroundColor DarkYellow
}

# ============================================================================
# 11. Verificacion post (solo si Commit)
# ============================================================================

if ($Commit) {
    Write-Step 'Verificacion post'
    $post = Read-FileRaw $trackPath
    $checks = @(
        @{ n = 'Fecha S14';        ok = $post.Contains('fin Sesion 14') },
        @{ n = 'Total 44';         ok = $post.Contains('**Total de hallazgos:** 44') },
        @{ n = 'Abierto 15';       ok = $post.Contains('| Abierto | 15 |') },
        @{ n = 'Cerrado 28';       ok = $post.Contains('| Cerrado | 28 |') },
        @{ n = 'Critica 9/7';      ok = $post.Contains('| Critica | 9 | 7 |') },
        @{ n = 'Media 14/4';       ok = $post.Contains('| Media | 14 | 4 |') },
        @{ n = 'Baja 7/1';         ok = $post.Contains('| Baja | 7 | 1 |') },
        @{ n = 'BUG-006';          ok = $post.Contains('BUG-006') },
        @{ n = 'BUG-007';          ok = $post.Contains('BUG-007') },
        @{ n = 'BUG-008';          ok = $post.Contains('BUG-008') },
        @{ n = 'BUG-009';          ok = $post.Contains('BUG-009') },
        @{ n = 'BUG-010';          ok = $post.Contains('BUG-010') },
        @{ n = 'BUG-011';          ok = $post.Contains('BUG-011') },
        @{ n = 'SEC-018';          ok = $post.Contains('SEC-018') },
        @{ n = 'SEC-019';          ok = $post.Contains('SEC-019') },
        @{ n = 'DOC-002';          ok = $post.Contains('DOC-002') },
        @{ n = 'DOC-003';          ok = $post.Contains('DOC-003') }
    )
    $fails = @($checks | Where-Object { -not $_.ok })
    if ($fails.Count -eq 0) {
        Write-Ok ('17/17 checks OK')
    } else {
        Write-Err ($fails.Count.ToString() + ' checks fallaron:')
        $fails | ForEach-Object { Write-Err ('  - ' + $_.n) }
        Pop-Location
        exit 1
    }
}

Write-Step 'Fin'
if (-not $Commit) {
    Write-Host '   Dry run OK. Nada escrito.' -ForegroundColor DarkYellow
    Write-Host '   Para aplicar: .\32-actualizar-tracking-s14.ps1 -Commit' -ForegroundColor DarkYellow
} else {
    Write-Host '   Tracking actualizado. NO commiteado (se hace despues).' -ForegroundColor Cyan
    Write-Host '   Proximo paso: 33-doc-bugs-s14.ps1' -ForegroundColor Cyan
}

Pop-Location