# ============================================================================
# 41-cierre-s15.ps1
# ----------------------------------------------------------------------------
# Cierre formal de la Sesion 15 (ENV).
#
# Actualiza:
#   - docs/BITACORA.md (nueva entrada "Sesion 15 - COMPLETA")
#   - docs/STATUS.md (seccion "Ultima actividad" + "Proximos 3 pasos" + metricas)
#   - docs/operations/ROTACION-CLAVES.md (estado de Bitwarden al cierre de S15)
#
# Fecha: 2026-10-15
# Sesion: 15
# ----------------------------------------------------------------------------
# Uso:
#   Dry run:  .\41-cierre-s15.ps1
#   Aplicar:  .\41-cierre-s15.ps1 -Commit
# ============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BackupDir = Join-Path $PSScriptRoot '.backup-s15'
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
# 1. BITACORA.md - agregar entrada de Sesion 15
# ============================================================================
Write-Step 'Agregar entrada "Sesion 15 - COMPLETA" a BITACORA.md'
$bitPath = Join-Path $RepoRoot 'docs\BITACORA.md'
if (-not (Test-Path -LiteralPath $bitPath)) { Write-Err 'BITACORA.md no existe'; Pop-Location; exit 1 }
$bit = Read-FileRaw $bitPath

if ($bit.Contains('Sesion 15 - COMPLETA')) {
    Write-Skip 'Entrada "Sesion 15 - COMPLETA" ya existe'
} else {
    $bitSeccion = @(
        '',
        '---',
        '',
        '## 2026-10-15 (Sesion 15 - COMPLETA)',
        '',
        '**Duracion:** ~6 horas',
        '**Objetivo:** Fase 2 (ENV) - Migracion Supabase + 5 hallazgos cerrados',
        '',
        '**Completado:**',
        '- SEC-008: funcion crear_usuario_admin eliminada (era SECURITY DEFINER sin uso).',
        '- BUG-011: bug en 29-fix-logger-import.ps1 corregido y script versionado.',
        '- SEC-018: 3 keys huerfanas de Cloudinary eliminadas (quedo 1 activa).',
        '- SEC-019 + F2-06: rotacion completa de Gemini API key + limpieza de 3 huerfanas.',
        '- F2-02: migracion completa de Supabase a Publishable/Secret keys.',
        '- Fix colateral: sanitizeSupabaseKey acepta formato sb_publishable_.',
        '- Legacy keys (anon/service_role) deshabilitadas en Supabase.',
        '- Supabase Advisors: 0 issues (criterio de salida de Fase 1 cumplido).',
        '- Bitwarden actualizado: Supabase, Cloudinary y Gemini con keys rotadas.',
        '',
        '**Commits:**',
        '- 7764b29f security(db): eliminar funcion sin uso crear_usuario_admin (SEC-008)',
        '- 5e111171 fix(scripts): corregir bug en 29-fix-logger-import.ps1 (BUG-011)',
        '- cb6dfe04 security(env): identificar y revocar keys huerfanas de Cloudinary (SEC-018)',
        '- b8767b31 security(env): rotar Gemini API key + revocar huerfanas (SEC-019, F2-06)',
        '- e17110f6 fix(supabase): aceptar formato sb_publishable en sanitizeSupabaseKey (F2-02)',
        '- ea82251e security(env): migrar Supabase a Publishable/Secret keys (F2-02)',
        '',
        '**Hallazgos cerrados:**',
        '- SEC-008: crear_usuario_admin sin chequeo de caller (eliminada)',
        '- BUG-011: bug en script 29-fix-logger-import.ps1',
        '- SEC-018: 3 API keys activas en Cloudinary sin trazabilidad',
        '- SEC-019: 4 API keys activas en Gemini sin trazabilidad',
        '',
        '**Hallazgos nuevos:**',
        '- Ninguno.',
        '',
        '**Bloqueantes:**',
        '- Ninguno.',
        '',
        '**Aprendizajes:**',
        '- Supabase migro a Signing Keys asimetricas (ECC P-256): el JWT Secret legacy',
        '  ya no existe. La rotacion es 1 click y no requiere actualizar Vercel.',
        '- Supabase depreco anon/service_role: la unica forma de rotarlas es migrar al',
        '  sistema nuevo (sb_publishable_ / sb_secret_). No hay comando CMD/PowerShell.',
        '- Vercel bloquea Secret con prefijo NEXT_PUBLIC_: hay que usar Config.',
        '- El SDK @supabase/supabase-js v2.112.3 soporta ambos formatos, pero el codigo',
        '  propio puede tener validaciones estrictas que hay que relajar (sanitizeSupabaseKey).',
        '- Cloudinary plan Free no expone "Last used" por API key: la identificacion se',
        '  hace por test empirico (upload) + eliminacion progresiva.',
        '- Google AI Studio muestra los 4 ultimos caracteres del ID de key, suficiente',
        '  para identificar sin exponer.',
        '- Los scripts de S14 son el patron a seguir: idempotentes, con backups,',
        '  verificacion post-write, y commits atomicos.',
        '',
        '**Proxima sesion (S16):**',
        '- F2-05: Rotar Resend API key (sin bloqueantes, rotacion sencilla).',
        '- F2-04: Rotacion completa de Cloudinary (crear key nueva + revocar la actual).',
        '- F2-13: Auditar las 11 APIs IA secundarias (ANTHROPIC, MISTRAL, DEEPSEEK, etc.).',
        '- F3-07: BUG-001 (VAPID inconsistente).',
        '- Chore: migrar @supabase/auth-helpers-nextjs -> @supabase/ssr.',
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
# 2. STATUS.md - actualizar proximos pasos + metricas + ultima actividad
# ============================================================================
Write-Step 'Actualizar STATUS.md'
$statusPath = Join-Path $RepoRoot 'docs\STATUS.md'
$status = Read-FileRaw $statusPath

# 2a. Proximos 3 pasos
$pasosViejos = @(
    '1. **Fase 2 - Rotaciones (S15)** - Bitwarden + rotar claves (F2-02, F2-04..F2-13)',
    '2. **F3-07** - BUG-001: NEXT_PUBLIC_VAPID_KEY inconsistente (P2)',
    '3. **SEC-018 / SEC-019** - Trazabilidad de keys Cloudinary/Gemini antes de rotar'
) -join "`r`n"
$pasosNuevos = @(
    '1. **F2-05** - Rotar Resend API key (sin bloqueantes)',
    '2. **F2-04** - Rotacion completa de Cloudinary (crear key nueva + revocar actual)',
    '3. **F2-13** - Auditar 11 APIs IA secundarias (ANTHROPIC, MISTRAL, DEEPSEEK, etc.)'
) -join "`r`n"
if ($status.Contains($pasosViejos)) {
    $status = $status.Replace($pasosViejos, $pasosNuevos)
    Write-Ok 'Proximos 3 pasos actualizados'
} else {
    Write-Skip 'Proximos 3 pasos no matchearon'
}

# 2b. Metricas clave
$metricasViejas = @(
    '| Claves productivas rotadas | 0 / 12 | 12 / 12 |',
    '| Claves en Bitwarden | 3 / 12 | 12 / 12 |',
    '| Hallazgos cerrados | 32 / 46 | 46 / 46 |'
) -join "`r`n"
$metricasNuevas = @(
    '| Claves productivas rotadas | 3 / 12 | 12 / 12 |',
    '| Claves en Bitwarden | 3 / 12 | 12 / 12 |',
    '| Hallazgos cerrados | 32 / 46 | 46 / 46 |'
) -join "`r`n"
if ($status.Contains($metricasViejas)) {
    $status = $status.Replace($metricasViejas, $metricasNuevas)
    Write-Ok 'Metricas clave actualizadas (3/12 claves rotadas)'
} else {
    Write-Skip 'Metricas clave no matchearon'
}

# 2c. Bloque "Sesion 15 (COMPLETA)" al final de la seccion 5
$s15Bloque = @(
    '',
    '---',
    '',
    '**2026-10-15 - Sesion 15 (ENV) - COMPLETA**',
    '- SEC-008: funcion crear_usuario_admin eliminada (era SECURITY DEFINER sin uso).',
    '- BUG-011: bug en script 29-fix-logger-import.ps1 corregido y versionado.',
    '- SEC-018: 3 keys huerfanas de Cloudinary eliminadas (quedo 1 activa).',
    '- SEC-019 + F2-06: rotacion completa de Gemini API key + limpieza de huerfanas.',
    '- F2-02: migracion completa de Supabase a Publishable/Secret keys.',
    '- Fix colateral: sanitizeSupabaseKey acepta formato sb_publishable_ (commit e17110f6).',
    '- Legacy keys (anon/service_role) deshabilitadas en Supabase.',
    '- Advisors Supabase: 0 issues (criterio de salida de Fase 1 cumplido).',
    '- Bitwarden actualizado: Supabase, Cloudinary y Gemini con keys rotadas.',
    '- 6 commits pusheados: 7764b29f, 5e111171, cb6dfe04, b8767b31, e17110f6, ea82251e.',
    ''
) -join "`r`n"

# Ancla: el bloque de S14 (que ya existe)
$anclaS14 = '**2026-10-14 - Sesion 14 (ENV) - COMPLETA**'
if ($status.Contains('**2026-10-15 - Sesion 15 (ENV) - COMPLETA**')) {
    Write-Skip 'Bloque Sesion 15 ya existe en STATUS.md'
} else {
    # Insertar el bloque S15 justo antes de "## 6. Comandos utiles"
    $anclaComandos = '## 6. Comandos utiles'
    if ($status.Contains($anclaComandos)) {
        $status = $status.Replace($anclaComandos, $s15Bloque + "`r`n" + $anclaComandos)
        Write-Ok 'Bloque Sesion 15 insertado en STATUS.md'
    } else {
        Write-Skip 'Ancla "## 6. Comandos utiles" no encontrada'
    }
}

if ($Commit) {
    Backup-File $statusPath $stamp
    Write-FileRaw $statusPath $status
    Write-Ok 'STATUS.md escrito'
} else {
    Write-Host '   (dry run: STATUS.md NO escrito)' -ForegroundColor DarkYellow
}

# ============================================================================
# 3. ROTACION-CLAVES.md - agregar seccion "Estado al cierre de S15"
# ============================================================================
Write-Step 'Actualizar ROTACION-CLAVES.md'
$rotPath = Join-Path $RepoRoot 'docs\operations\ROTACION-CLAVES.md'
$rot = Read-FileRaw $rotPath

if ($rot.Contains('Estado de Bitwarden al cierre de S15')) {
    Write-Skip 'Seccion S15 ya existe en ROTACION-CLAVES.md'
} else {
    $rotSeccion = @(
        '',
        '---',
        '',
        '## Estado de Bitwarden al cierre de S15 (2026-10-15)',
        '',
        '**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion',
        '',
        '### Items completos (3/12) - actualizados en S15',
        '',
        '| # | Item | Estado | Fecha | Notas |',
        '|---|---|---|---|---|',
        '| 1 | Supabase - Produccion | OK | 2026-10-15 (S15) | Migrado a sb_publishable_/sb_secret_ + JWT Signing Key rotada |',
        '| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S15) | 3 keys huerfanas revocadas, quedo 1 activa |',
        '| 3 | Gemini - Produccion | OK | 2026-10-15 (S15) | Key rotada + 3 huerfanas eliminadas |',
        '',
        '### Items pendientes (9/12)',
        '',
        'Se completan durante la rotacion en S16. La estrategia sigue siendo:',
        'cuando se rote cada servicio, la key nueva se guarda en Bitwarden',
        '(Produccion) en el mismo flujo.',
        '',
        '| # | Item | Cuenta | Bloquea rotacion |',
        '|---|---|---|---|',
        '| 4 | Resend - Produccion | [S] | F2-05 |',
        '| 5 | Meta WhatsApp - Produccion | [S] | F2-07 |',
        '| 6 | Twilio - Produccion | [S] | F2-08 |',
        '| 7 | Instagram - Produccion | [S] | F2-09 |',
        '| 8 | n8n - Produccion | [S] | F2-10 |',
        '| 9 | GA4 - Produccion | [S] | F2-11 |',
        '| 10 | Clarity - Produccion | [S] | (no bloquea rotacion) |',
        '| 11 | VAPID - Produccion | [S] | F2-12 |',
        '| 12 | Secrets internos - Produccion | [S] | F2-13 / F4-06 |',
        '',
        '### Hallazgo SEC-020: actualizacion',
        '',
        'En S15 se completaron 3 items mas (aunque los items 1, 2 y 3 ya existian,',
        'se actualizaron con las keys rotadas). Los 9 items restantes siguen pendientes.',
        'SEC-020 sigue abierto hasta completar los 9.',
        '',
        '### Deuda tecnica detectada en S15',
        '',
        '- **@supabase/auth-helpers-nextjs@0.15.0 deprecado** (paquete legacy).',
        '  Migrar a @supabase/ssr en S16. No rompe el build, solo warnings.',
        '- **11 APIs IA secundarias en Vercel sin documentar**: ANTHROPIC, MISTRAL,',
        '  DEEPSEEK, COHERE, GROQ, CLOUDFLARE, POLLINATIONS, HF, AIHUBMIX, LEONARDO,',
        '  AGNES. Auditar en F2-13.',
        ''
    ) -join "`r`n"

    if ($Commit) {
        Backup-File $rotPath $stamp
        $rot = $rot.TrimEnd() + "`r`n" + $rotSeccion
        Write-FileRaw $rotPath $rot
        Write-Ok 'ROTACION-CLAVES.md actualizado'
    } else {
        Write-Host '   (dry run: ROTACION-CLAVES.md NO escrito)' -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 4. Verificacion post (solo si Commit)
# ============================================================================
if ($Commit) {
    Write-Step 'Verificacion post'
    $bitPost = Read-FileRaw $bitPath
    $staPost = Read-FileRaw $statusPath
    $rotPost = Read-FileRaw $rotPath

    $checks = @(
        @{ n = 'BITACORA: Sesion 15';              ok = $bitPost.Contains('Sesion 15 - COMPLETA') },
        @{ n = 'BITACORA: commit ea82251e';        ok = $bitPost.Contains('ea82251e') },
        @{ n = 'BITACORA: SEC-008';                ok = $bitPost.Contains('SEC-008') },
        @{ n = 'BITACORA: F2-02';                  ok = $bitPost.Contains('F2-02') },
        @{ n = 'STATUS: Sesion 15 COMPLETA';       ok = $staPost.Contains('Sesion 15 (ENV) - COMPLETA') },
        @{ n = 'STATUS: Proximos = F2-05';         ok = $staPost.Contains('**F2-05**') },
        @{ n = 'STATUS: Claves rotadas 3/12';      ok = $staPost.Contains('| Claves productivas rotadas | 3 / 12 | 12 / 12 |') },
        @{ n = 'ROTACION: Estado S15';             ok = $rotPost.Contains('Estado de Bitwarden al cierre de S15') },
        @{ n = 'ROTACION: Supabase OK';            ok = $rotPost.Contains('Supabase - Produccion | OK | 2026-10-15') },
        @{ n = 'ROTACION: @supabase/auth-helpers'; ok = $rotPost.Contains('auth-helpers-nextjs') }
    )

    $fails = @($checks | Where-Object { -not $_.ok })
    if ($fails.Count -eq 0) {
        Write-Ok ($checks.Count.ToString() + '/' + $checks.Count.ToString() + ' checks OK')
    } else {
        Write-Err ($fails.Count.ToString() + ' checks fallaron:')
        $fails | ForEach-Object { Write-Err ('  - ' + $_.n) }
        Pop-Location
        exit 1
    }
}

# ============================================================================
# 5. Commit + push
# ============================================================================
Write-Step 'Commit'
if (-not $Commit) {
    Write-Host '   Dry run. Nada escrito, nada commiteado.' -ForegroundColor DarkYellow
    Write-Host '   Para aplicar: .\41-cierre-s15.ps1 -Commit' -ForegroundColor DarkYellow
    Pop-Location
    exit 0
}

git add -- docs/BITACORA.md
git add -- docs/STATUS.md
git add -- docs/operations/ROTACION-CLAVES.md

$staged = @(git diff --cached --name-only)
if ($staged.Count -eq 0) {
    Write-Skip 'Nada staged. No hay commit.'
    Pop-Location
    exit 0
}
Write-Ok ('Archivos staged: ' + $staged.Count)
$staged | ForEach-Object { Write-Host ('     - ' + $_) -ForegroundColor DarkGray }

$msg = 'docs(session): cerrar sesion 15 (ENV) - migracion Supabase + 5 hallazgos'
git commit -m $msg
if ($LASTEXITCODE -ne 0) { Write-Err 'git commit fallo'; Pop-Location; exit 1 }

git push origin main
if ($LASTEXITCODE -ne 0) { Write-Err 'git push fallo'; Pop-Location; exit 1 }

Write-Ok ('Commit pusheado: ' + $msg)
Write-Host ''
Write-Host 'Sesion 15 cerrada COMPLETA.' -ForegroundColor Cyan
Write-Host 'Proximo paso: S16 - F2-05 (Resend) o F2-04 (Cloudinary completo).' -ForegroundColor Cyan
Pop-Location