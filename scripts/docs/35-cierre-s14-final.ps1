# ============================================================================
# 35-cierre-s14-final.ps1
# ----------------------------------------------------------------------------
# Cierre formal de la Sesion 14 (ENV).
#
# Actualiza:
#   - docs/STATUS.md   (fecha, fase 2, metricas, proximos 3 pasos)
#   - docs/BITACORA.md (nueva entrada "Sesion 14 - Cierre")
#
# Luego:
#   - Corre verificador de links
#   - Commit + push (con flag -Commit)
#
# Fecha: 2026-10-14
# ----------------------------------------------------------------------------
# Uso:
#   Dry run:  .\35-cierre-s14-final.ps1
#   Aplicar:  .\35-cierre-s14-final.ps1 -Commit
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

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

# ============================================================================
# 1. STATUS.md
# ============================================================================

Write-Step 'Actualizar docs/STATUS.md'

$statusPath = Join-Path $RepoRoot 'docs\STATUS.md'
if (-not (Test-Path -LiteralPath $statusPath)) {
    Write-Err 'STATUS.md no existe'
    Pop-Location
    exit 1
}

$status = Read-FileRaw $statusPath

if ($status.Contains('fin Sesion 14') -and $status.Contains('Sesion 14 (ENV) - COMPLETA')) {
    Write-Skip 'STATUS.md ya tiene S14 completa'
} else {
    # 1a. Fecha
    $fechaVieja = '**Ultima actualizacion:** 2026-10-14 (fin Sesion 13)'
    $fechaNueva = '**Ultima actualizacion:** 2026-10-14 (fin Sesion 14)'
    if ($status.Contains($fechaVieja)) {
        $status = $status.Replace($fechaVieja, $fechaNueva)
    }

    # 1b. Tabla resumen: Fase 2 0/14 -> 2/14, Total 23 -> 25
    $tablaVieja = @(
        '| Fase | Tareas | OK | En curso | Pendiente | % |',
        '|---|---|---|---|---|---|',
        '| F0 - Preparacion | 7 | 7 | 0 | 0 | 100% |',
        '| F1 - Seguridad DB | 9 | 9 | 0 | 0 | 100% |',
        '| F2 - Rotacion claves | 14 | 0 | 0 | 14 | 0% |',
        '| F3 - Codigo | 9 | 6 | 0 | 3 | 67% |',
        '| F4 - Limpieza | 8 | 0 | 0 | 8 | 0% |',
        '| **Total** | **47** | **23** | **0** | **24** | **49%** |'
    ) -join "`r`n"

    $tablaNueva = @(
        '| Fase | Tareas | OK | En curso | Pendiente | % |',
        '|---|---|---|---|---|---|',
        '| F0 - Preparacion | 7 | 7 | 0 | 0 | 100% |',
        '| F1 - Seguridad DB | 9 | 9 | 0 | 0 | 100% |',
        '| F2 - Rotacion claves | 14 | 2 | 0 | 12 | 14% |',
        '| F3 - Codigo | 9 | 6 | 0 | 3 | 67% |',
        '| F4 - Limpieza | 8 | 0 | 0 | 8 | 0% |',
        '| **Total** | **47** | **25** | **0** | **22** | **53%** |'
    ) -join "`r`n"

    if ($status.Contains($tablaVieja)) {
        $status = $status.Replace($tablaVieja, $tablaNueva)
    } else {
        Write-Skip 'Tabla resumen no matcheo (posible cambio previo)'
    }

    # 1c. Proximos 3 pasos
    $pasosViejos = @(
        '1. **F3-07** - BUG-001: NEXT_PUBLIC_VAPID_KEY inconsistente (P2)',
        '2. **F3-08** - CONF-001: ESLint en build (P2)',
        '3. **Chores P3** - SEC-014..017 (hardcoded keys) para desbloquear Fase 2'
    ) -join "`r`n"

    $pasosNuevos = @(
        '1. **Fase 2 - Rotaciones (S15)** - Bitwarden + rotar claves (F2-02, F2-04..F2-13)',
        '2. **F3-07** - BUG-001: NEXT_PUBLIC_VAPID_KEY inconsistente (P2)',
        '3. **SEC-018 / SEC-019** - Trazabilidad de keys Cloudinary/Gemini antes de rotar'
    ) -join "`r`n"

    if ($status.Contains($pasosViejos)) {
        $status = $status.Replace($pasosViejos, $pasosNuevos)
    } else {
        Write-Skip 'Proximos 3 pasos no matchearon'
    }

    # 1d. Metricas clave
    $metricasViejas = @(
        '| Advisors Supabase severidad 1-2 | 7 | 0 |',
        '| Advisors Supabase severidad 3 | 250+ | menos de 50 |',
        '| Claves productivas rotadas | 0 / 12 | 12 / 12 |',
        '| Claves en Bitwarden | 0 / 12 | 12 / 12 |',
        '| Hallazgos cerrados | 27 / 34 | 34 / 34 |',
        '| Documentos .md en docs/ | 30+ | 30+ (OK) |',
        '| Commits de remediacion | 8 | ~40 |'
    ) -join "`r`n"

    $metricasNuevas = @(
        '| Advisors Supabase severidad 1-2 | 7 | 0 |',
        '| Advisors Supabase severidad 3 | 250+ | menos de 50 |',
        '| Claves productivas rotadas | 0 / 12 | 12 / 12 |',
        '| Claves en Bitwarden | 3 / 12 | 12 / 12 |',
        '| Hallazgos cerrados | 28 / 45 | 45 / 45 |',
        '| Documentos .md en docs/ | 30+ | 30+ (OK) |',
        '| Commits de remediacion | 8 | ~40 |'
    ) -join "`r`n"

    if ($status.Contains($metricasViejas)) {
        $status = $status.Replace($metricasViejas, $metricasNuevas)
    } else {
        Write-Skip 'Metricas clave no matchearon'
    }

    # 1e. Agregar "S14 COMPLETA" al final de la seccion 5 (ultima actividad)
    #    Buscamos el bloque "Sesion 14 (ENV) - PARCIAL" que puso el script 31
    #    y lo reemplazamos por una version "COMPLETA".
    $s14Viejo = @(
        '**2026-10-14 - Sesion 14 (ENV) - PARCIAL**',
        '- Bloque 0: sync docs S13 (commit fdcb6c70).',
        '- Chore gitignore: dejar de versionar .vercel/ + exceptuar .env.example',
        '  (commits 14ba0076 + a0cc5c8f).',
        '- F2-01: Supabase Owner a system.panfree (hecho).',
        '- F2-03: Cloudinary a system.panfree (hecho).',
        '- F2-14 Bitwarden: 3 de 13 items cargados (Supabase, Cloudinary, Gemini).',
        '- INCIDENTE: BUG-010 (regresion logger S13). App caida en produccion.',
        '  Fix en commit 757938c2. Deploy Ready. Verificado en incognito: OK.',
        '- Nuevos hallazgos pendientes de documentar en tracking:',
        '  BUG-010, BUG-011, SEC-018, SEC-019, BUG-006..009, DOC-002, DOC-003.',
        '- Continua en Sesion 15.'
    ) -join "`r`n"

    $s14Nuevo = @(
        '**2026-10-14 - Sesion 14 (ENV) - COMPLETA**',
        '- Bloque 0: sync docs S13 (commit fdcb6c70).',
        '- Chore gitignore: .vercel/ fuera del repo + exceptuar .env.example',
        '  (commits 14ba0076 + a0cc5c8f).',
        '- F2-01: Supabase Owner a system.panfree (hecho).',
        '- F2-03: Cloudinary a system.panfree (hecho).',
        '- F2-14 Bitwarden: 3 de 12 items completos (Supabase, Cloudinary, Gemini).',
        '  Los 9 restantes se completan durante la rotacion (S15). SEC-020.',
        '- INCIDENTE BUG-010: regresion del logger S13. App caida en produccion.',
        '  Fix commit 757938c2. Deploy Ready. Verificado en incognito: OK.',
        '- Docs: 24-bugs-s14-gemini-y-otros.md creado (10 hallazgos nuevos).',
        '- Tracking actualizado: 34 -> 45 hallazgos. 28 cerrados.',
        '- Doc del incidente: 23-bug-010-logger-regresion.md.',
        '- Bloque A cerrado (commit a6c9d4d0).',
        '- Bloque B parcial (solo estructura, sin valores) -> S15.'
    ) -join "`r`n"

    if ($status.Contains($s14Viejo)) {
        $status = $status.Replace($s14Viejo, $s14Nuevo)
    } else {
        Write-Skip 'Bloque S14 PARCIAL no matcheo (puede estar ya actualizado)'
    }

    if ($Commit) {
        Backup-File $statusPath $stamp
        Write-FileRaw $statusPath $status
        Write-Ok 'STATUS.md actualizado'
    } else {
        Write-Host '   (dry run: STATUS.md NO escrito)' -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 2. BITACORA.md
# ============================================================================

Write-Step 'Agregar entrada "Sesion 14 - Cierre" a BITACORA.md'

$bitPath = Join-Path $RepoRoot 'docs\BITACORA.md'
if (-not (Test-Path -LiteralPath $bitPath)) {
    Write-Err 'BITACORA.md no existe'
    Pop-Location
    exit 1
}

$bit = Read-FileRaw $bitPath

if ($bit.Contains('Sesion 14 - Cierre')) {
    Write-Skip 'Entrada "Sesion 14 - Cierre" ya existe'
} else {
    $bitSeccion = @(
        '',
        '---',
        '',
        '## 2026-10-14 (Sesion 14 - Cierre)',
        '',
        '**Duracion:** ~2 horas (parte 2 de S14)',
        '**Objetivo:** Cerrar S14: tracking + hallazgos + estado Bitwarden',
        '',
        '**Completado:**',
        '- Bloque A: registrados 10 hallazgos nuevos en tracking.',
        '  - Tracking: 34 -> 45 hallazgos.',
        '  - Cerrado: BUG-010 (regresion logger S13).',
        '  - Nuevos: BUG-006..009, BUG-011, SEC-018, SEC-019, DOC-002, DOC-003.',
        '- Doc nuevo: 24-bugs-s14-gemini-y-otros.md (familia Gemini + keys).',
        '- Bloque B (parcial): documentado estado Bitwarden al cierre de S14.',
        '  - 3/12 items completos. 9 pendientes (se completan durante rotacion S15).',
        '  - SEC-020 registrado.',
        '- Doc nuevo: 24-bugs-s14-gemini-y-otros.md.',
        '- ROTACION-CLAVES.md: seccion "Estado de Bitwarden al cierre de S14".',
        '- ENVIRONMENT.md: referencia a la seccion nueva.',
        '',
        '**Commits:**',
        '- a6c9d4d0 docs(audit): registrar 10 hallazgos nuevos de S14 (BUG-006..011, SEC-018/019, DOC-002/003)',
        '- (pendiente) docs(session): cerrar sesion 14 (ENV) - Bloque A + Bitwarden parcial',
        '',
        '**Hallazgos cerrados:**',
        '- BUG-010: regresion del logger (ya cerrado en parte 1, formalizado en tracking).',
        '',
        '**Hallazgos nuevos:**',
        '- SEC-020: 9 items Bitwarden pendientes (se completan durante rotacion S15).',
        '',
        '**Bloqueantes:**',
        '- Ninguno.',
        '',
        '**Aprendizajes:**',
        '- En Bitwarden no se cargan valores viejos: se completa en el mismo flujo',
        '  de la rotacion (rotar + guardar nuevo + guardar viejo).',
        '- Los scripts de cierre no commitean; el commit se hace manual o en un',
        '  script 35 dedicado, para agrupar el "docs(session)" con todos los cambios.',
        '- Verificacion post-write con checks explicitos (string.Contains) evita',
        '  falsos OK. El script 34 valido 8/8, el 32 valido 17/17.',
        '',
        '**Proxima sesion (S15):**',
        '- F2-02: rotar JWT secret + keys Supabase.',
        '- F2-04: rotar Cloudinary API secret (resolver SEC-018 primero).',
        '- F2-05: rotar Resend API key.',
        '- F2-06: rotar Gemini API key (resolver SEC-019 primero).',
        '- F2-07 a F2-13: resto de rotaciones.',
        '- Completar items Bitwarden como subproducto de cada rotacion.',
        '- F3-07: BUG-001 (VAPID).',
        '',
        '---',
        ''
    ) -join "`r`n"

    if ($Commit) {
        Backup-File $bitPath $stamp
        $bit = $bit.TrimEnd() + "`r`n" + $bitSeccion
        Write-FileRaw $bitPath $bit
        Write-Ok 'BITACORA.md actualizada'
    } else {
        Write-Host '   (dry run: BITACORA.md NO escrita)' -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 3. Verificar links (solo si Commit)
# ============================================================================

if ($Commit) {
    Write-Step 'Verificar links de la documentacion'
    $verPath = Join-Path $RepoRoot 'scripts\docs\00-verificar-links.ps1'
    if (Test-Path -LiteralPath $verPath) {
        & powershell -ExecutionPolicy Bypass -File $verPath
        if ($LASTEXITCODE -ne 0) {
            Write-Host '   (verificador devolvio exit code distinto de 0; revisar arriba)' -ForegroundColor DarkYellow
        }
    } else {
        Write-Skip '00-verificar-links.ps1 no encontrado'
    }
}

# ============================================================================
# 4. Commit + push
# ============================================================================

Write-Step 'Commit'

if (-not $Commit) {
    Write-Host '   Dry run. Nada escrito, nada commiteado.' -ForegroundColor DarkYellow
    Write-Host '   Para aplicar: .\35-cierre-s14-final.ps1 -Commit' -ForegroundColor DarkYellow
    Pop-Location
    exit 0
}

# Staging: los 5 archivos del cierre (tracking, ROTACION, ENVIRONMENT, STATUS, BITACORA)
git add -- docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md
git add -- docs/operations/ROTACION-CLAVES.md
git add -- docs/operations/ENVIRONMENT.md
git add -- docs/STATUS.md
git add -- docs/BITACORA.md

$staged = @(git diff --cached --name-only)
if ($staged.Count -eq 0) {
    Write-Skip 'Nada staged. No hay commit.'
    Pop-Location
    exit 0
}
Write-Ok ('Archivos staged: ' + $staged.Count)
$staged | ForEach-Object { Write-Host ('     - ' + $_) -ForegroundColor DarkGray }

$msg = 'docs(session): cerrar sesion 14 (ENV) - Bloque A + Bitwarden parcial'
git commit -m $msg
if ($LASTEXITCODE -ne 0) { Write-Err 'git commit fallo'; Pop-Location; exit 1 }

git push origin main
if ($LASTEXITCODE -ne 0) { Write-Err 'git push fallo'; Pop-Location; exit 1 }

Write-Ok ('Commit pusheado: ' + $msg)
Write-Host ''
Write-Host 'Sesion 14 cerrada COMPLETA.' -ForegroundColor Cyan
Write-Host 'Proximo paso: S15 - Rotaciones + Bitwarden.' -ForegroundColor Cyan

Pop-Location