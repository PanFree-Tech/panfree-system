# 42a-actualizar-politica-rotacion.ps1
# Chore S16: formalizar politica de rotacion sin legacy (parte A).
# Toca: ROTACION-CLAVES.md, ENVIRONMENT.md, rotar-claves-supabase.md.
# Patron S14/S15: -Commit opcional (dry-run por defecto), backup, idempotencia, verificacion.

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'

# --- Paths ---------------------------------------------------------------
$repoRoot        = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$rotacionPath    = Join-Path $repoRoot 'docs\operations\ROTACION-CLAVES.md'
$environmentPath = Join-Path $repoRoot 'docs\operations\ENVIRONMENT.md'
$runbookPath     = Join-Path $repoRoot 'docs\runbooks\rotar-claves-supabase.md'
$backupDir       = Join-Path $repoRoot 'scripts\docs\.backup-s16'

# --- Helpers -------------------------------------------------------------
function Write-Step  { param($m) Write-Host ">> $m" -ForegroundColor Cyan }
function Write-Ok    { param($m) Write-Host "   OK  $m" -ForegroundColor Green }
function Write-Skip  { param($m) Write-Host "   --  $m" -ForegroundColor DarkGray }
function Write-Warn2 { param($m) Write-Host "   !!  $m" -ForegroundColor Yellow }
function Write-Fail  { param($m) Write-Host "   XX  $m" -ForegroundColor Red }

function Backup-File {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return }
    if (-not (Test-Path -LiteralPath $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    }
    $leaf = Split-Path -Leaf $Path
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $dest = Join-Path $backupDir ("{0}.{1}.bak" -f $leaf, $stamp)
    Copy-Item -LiteralPath $Path -Destination $dest -Force
}

function Read-Utf8 {
    param([string]$Path)
    return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $enc)
}

function Ensure-Dir {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

# --- Verificar prerequisitos --------------------------------------------
Write-Step 'Verificando prerequisitos'
$missing = @()
foreach ($p in @($rotacionPath, $environmentPath, $runbookPath)) {
    if (-not (Test-Path -LiteralPath $p)) { $missing += $p }
}
if ($missing.Count -gt 0) {
    foreach ($m in $missing) { Write-Fail "No existe: $m" }
    throw 'Faltan archivos prerequisito. Abortando.'
}
Write-Ok 'Los 3 archivos existen'

if (-not $Commit) {
    Write-Warn2 'MODO DRY-RUN (no se escriben cambios). Usar -Commit para aplicar.'
}

# =========================================================================
# 1. ROTACION-CLAVES.md
# =========================================================================
Write-Step 'Procesando ROTACION-CLAVES.md'
$rot = Read-Utf8 $rotacionPath
$rotOriginal = $rot

# 1.1 Reemplazar bloque "Procedimiento" + "Orden" viejo por la politica nueva.
$oldProc = @(
    '## Procedimiento',
    '',
    '1. Guardar claves viejas en Bitwarden (Legado)',
    '2. Rotar en el dashboard del servicio',
    '3. Copiar claves nuevas',
    '4. Guardar en Bitwarden (Produccion)',
    '5. Actualizar .env.local',
    '6. Actualizar Vercel',
    '7. Redeploy',
    '8. Verificar'
) -join "`r`n"

$newProc = @(
    '## Modelo de Bitwarden',
    '',
    '- Una sola coleccion: Bitwarden -> Organizacion PanFree -> Produccion.',
    '- No existe coleccion "Legado".',
    '- El historial de rotaciones vive en la NOTA de cada item de Bitwarden.',
    '',
    '## Procedimiento',
    '',
    '1. Crear key nueva en el dashboard del servicio (mismo scope y dominio',
    '   que la actual).',
    '2. Guardar la key nueva en el item de Bitwarden (Produccion):',
    '   campo de credencial + nota con fecha + tarea (F2-XX) + motivo.',
    '3. Actualizar .env.local.',
    '4. Actualizar Vercel (Production + Preview).',
    '5. Redeploy.',
    '6. Verificar: test empirico + Logs del servicio filtrados por la key nueva.',
    '7. Revocar la key vieja en el dashboard del servicio.',
    '8. Completar la nota del item de Bitwarden con:',
    '   - La key vieja COMPLETA.',
    '   - Fecha de revocacion.',
    '   - Estado: "revocada".',
    '9. Documentar en docs/audits/2026-10-13-inicial/XX-f2-XX-rotar-<servicio>.md.'
) -join "`r`n"

if ($rot.Contains($oldProc)) {
    $rot = $rot.Replace($oldProc, $newProc)
    Write-Ok 'Procedimiento reemplazado'
} else {
    Write-Skip 'Procedimiento viejo no encontrado (ya actualizado o distinto)'
}

# 1.2 Reemplazar bloque "Rollback".
$oldRollback = @(
    '## Rollback',
    '',
    'Restaurar clave vieja desde Bitwarden (Legado), actualizar Vercel, redeploy.'
) -join "`r`n"

$newRollback = @(
    '## Rollback',
    '',
    'Rotacion de emergencia:',
    '',
    '1. Crear key nueva en el dashboard.',
    '2. Actualizar Vercel.',
    '3. Redeploy.',
    '',
    'La key comprometida ya fue revocada en el paso 7 del procedimiento;',
    'no se restaura.'
) -join "`r`n"

if ($rot.Contains($oldRollback)) {
    $rot = $rot.Replace($oldRollback, $newRollback)
    Write-Ok 'Rollback reemplazado'
} else {
    Write-Skip 'Rollback viejo no encontrado (ya actualizado o distinto)'
}

# 1.3 Reemplazar menciones a "Legado" en la seccion S14.
$s14Old = @(
    '### Items pendientes (9/12)',
    '',
    'Se completan **durante la rotacion** en S15. No se cargan ahora con',
    'valores viejos: cuando se rote cada servicio, la key nueva se guarda',
    'en Bitwarden (Produccion) y la vieja en Bitwarden (Legado) en el',
    'mismo flujo.'
) -join "`r`n"

$s14New = @(
    '### Items pendientes (9/12)',
    '',
    'Se completan **durante la rotacion** en S15. No se cargan ahora con',
    'valores viejos: cuando se rote cada servicio, la key nueva se guarda',
    'en Bitwarden (Produccion) y la vieja queda registrada en la nota del',
    'mismo item, tras ser revocada en el dashboard.'
) -join "`r`n"

if ($rot.Contains($s14Old)) {
    $rot = $rot.Replace($s14Old, $s14New)
    Write-Ok 'Seccion S14 actualizada (sin "Legado")'
} else {
    Write-Skip 'Bloque S14 viejo no encontrado'
}

# 1.4 Insertar bloque nuevo: Estado de Bitwarden al cierre de S16.
$s16Block = @(
    '',
    '---',
    '',
    '## Estado de Bitwarden al cierre de S16 (2026-10-15)',
    '',
    '**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion',
    '',
    '### Politica vigente desde S16',
    '',
    '- Una sola coleccion (Produccion). No existe "Legado".',
    '- Cada item tiene una NOTA con el historial de rotaciones:',
    '  key saliente COMPLETA + fecha de revocacion + tarea + motivo.',
    '- Las keys salientes se revocan en el dashboard ANTES de completar la nota.',
    '',
    '### Items completos (3/12)',
    '',
    '| # | Item | Estado | Fecha | Notas |',
    '|---|---|---|---|---|',
    '| 1 | Supabase - Produccion | OK | 2026-10-15 (S15) | Migrado a sb_publishable_/sb_secret_ + JWT Signing Key rotada |',
    '| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S15) | 3 keys huerfanas revocadas, quedo 1 activa |',
    '| 3 | Gemini - Produccion | OK | 2026-10-15 (S15) | Key rotada + 3 huerfanas eliminadas |',
    '',
    '### Items pendientes (9/12)',
    '',
    'Se completan durante la rotacion en S16. La estrategia es:',
    'rotar + verificar + revocar vieja + documentar en nota del item.',
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
    '### Hallazgo SEC-020',
    '',
    'Sigue abierto. Se cierra cuando los 9 items pendientes esten completos',
    '(con keys rotadas, revocadas y documentadas en nota).',
    '',
    '### Deuda tecnica al cierre de S16',
    '',
    '- Migrar @supabase/auth-helpers-nextjs -> @supabase/ssr.',
    '- F2-04 (rotar Cloudinary) pendiente.',
    '- Auditar 11 APIs IA secundarias (F2-13).'
) -join "`r`n"

if (-not $rot.Contains('## Estado de Bitwarden al cierre de S16')) {
    $rot = $rot.TrimEnd() + "`r`n" + $s16Block + "`r`n"
    Write-Ok 'Bloque S16 agregado'
} else {
    Write-Skip 'Bloque S16 ya existe'
}

# Escribir si cambio y -Commit
if ($rot -ne $rotOriginal) {
    if ($Commit) {
        Backup-File $rotacionPath
        Write-Utf8NoBom $rotacionPath $rot
        Write-Ok 'ROTACION-CLAVES.md escrito'
    } else {
        Write-Warn2 'ROTACION-CLAVES.md cambiaria (dry-run)'
    }
} else {
    Write-Skip 'ROTACION-CLAVES.md sin cambios'
}

# =========================================================================
# 2. ENVIRONMENT.md
# =========================================================================
Write-Step 'Procesando ENVIRONMENT.md'
$env = Read-Utf8 $environmentPath
$envOriginal = $env

$envNew = @(
    '# Variables de Entorno',
    '',
    'Guia completa de variables de entorno del proyecto.',
    '',
    '## Convencion de cuentas',
    '',
    '- [S] = system.panfree@gmail.com (tecnico)',
    '- [C] = contacto.panfree@gmail.com (comercial)',
    '',
    '## Referencia',
    '',
    'Ver .env.example en la raiz del repositorio.',
    '',
    '## Almacenamiento',
    '',
    'Bitwarden - Organizacion PanFree - Coleccion Produccion.',
    '',
    'Una sola coleccion. No existe "Legado". El historial de rotaciones',
    'vive en la NOTA de cada item (key saliente completa + fecha de',
    'revocacion + tarea + motivo).',
    '',
    '## Rotacion',
    '',
    'Ver ROTACION-CLAVES.md (procedimiento, rollback, modelo de Bitwarden).',
    '',
    '## Estado de Bitwarden',
    '',
    'Ver ROTACION-CLAVES.md, seccion "Estado de Bitwarden al cierre de S16".'
) -join "`r`n"

if ($env.TrimEnd() -ne $envNew.TrimEnd()) {
    if ($Commit) {
        Backup-File $environmentPath
        Write-Utf8NoBom $environmentPath ($envNew + "`r`n")
        Write-Ok 'ENVIRONMENT.md escrito'
    } else {
        Write-Warn2 'ENVIRONMENT.md cambiaria (dry-run)'
    }
} else {
    Write-Skip 'ENVIRONMENT.md sin cambios'
}

# =========================================================================
# 3. docs/runbooks/rotar-claves-supabase.md
# =========================================================================
Write-Step 'Procesando docs/runbooks/rotar-claves-supabase.md'
$rb = Read-Utf8 $runbookPath
$rbOriginal = $rb

$rbNew = @(
    '# Runbook: Rotar Claves de Supabase',
    '',
    '**Tiempo:** 15 minutos',
    '**Riesgo:** Alto (usuarios se desloguean)',
    '',
    'Nota: desde S16, la politica general de rotacion vive en',
    'docs/operations/ROTACION-CLAVES.md. Este runbook es el detalle',
    'especifico de Supabase.',
    '',
    '## Pre-requisitos',
    '',
    '- [ ] system.panfree es Owner de la org',
    '- [ ] .env.local abierto',
    '- [ ] Vercel abierto',
    '',
    '## Pasos',
    '',
    '1. Supabase - Settings - API - JWT Settings',
    '2. Generate new JWT secret - Confirmar',
    '3. Copiar keys anon y service_role nuevas',
    '4. Actualizar .env.local',
    '5. Guardar en Bitwarden (Produccion)',
    '6. Actualizar Vercel',
    '7. Redeploy',
    '8. Verificar:',
    '   - Home carga',
    '   - Login funciona',
    '   - /admin funciona',
    '   - Pedido de prueba OK',
    '9. Revocar las keys viejas en Supabase',
    '10. Completar la nota del item de Bitwarden con:',
    '    - Las keys viejas COMPLETAS.',
    '    - Fecha de revocacion.',
    '    - Estado: "revocadas".',
    '',
    '## Rollback',
    '',
    'Rotacion de emergencia (ver ROTACION-CLAVES.md):',
    '',
    '1. Crear keys nuevas en Supabase.',
    '2. Actualizar Vercel.',
    '3. Redeploy.',
    '',
    'Las keys comprometidas ya fueron revocadas en el paso 9; no se restauran.'
) -join "`r`n"

if ($rb.TrimEnd() -ne $rbNew.TrimEnd()) {
    if ($Commit) {
        Backup-File $runbookPath
        Write-Utf8NoBom $runbookPath ($rbNew + "`r`n")
        Write-Ok 'rotar-claves-supabase.md escrito'
    } else {
        Write-Warn2 'rotar-claves-supabase.md cambiaria (dry-run)'
    }
} else {
    Write-Skip 'rotar-claves-supabase.md sin cambios'
}

# =========================================================================
# Verificacion post-write
# =========================================================================
Write-Step 'Verificacion post-write'
if ($Commit) {
    $checks = @(
        @{ Path = $rotacionPath;    Must = @('## Modelo de Bitwarden','No existe coleccion "Legado"','Rotacion de emergencia','al cierre de S16') },
        @{ Path = $environmentPath; Must = @('No existe "Legado"','historial de rotaciones','Estado de Bitwarden al cierre de S16') },
        @{ Path = $runbookPath;     Must = @('Rotacion de emergencia','revocadas en el paso 9') }
    )
    $fail = 0
    foreach ($c in $checks) {
        $txt = Read-Utf8 $c.Path
        foreach ($needle in $c.Must) {
            if ($txt.Contains($needle)) {
                Write-Ok ("{0} contiene: {1}" -f (Split-Path -Leaf $c.Path), $needle)
            } else {
                Write-Fail ("{0} NO contiene: {1}" -f (Split-Path -Leaf $c.Path), $needle)
                $fail++
            }
        }
    }
    if ($fail -gt 0) { throw "Verificacion fallo ($fail checks)" }
    Write-Ok 'Todos los checks pasaron'
} else {
    Write-Skip 'Verificacion omitida en dry-run'
}

# =========================================================================
# Commit (si -Commit)
# =========================================================================
if ($Commit) {
    Write-Step 'Git status'
    Push-Location $repoRoot
    try {
        git status --short
        git add docs/operations/ROTACION-CLAVES.md `
                docs/operations/ENVIRONMENT.md `
                docs/runbooks/rotar-claves-supabase.md
        git commit -m 'docs(ops): formalizar politica de rotacion sin legacy (S16)'
        Write-Ok 'Commit creado. Pushear manualmente con: git push origin main'
    } finally {
        Pop-Location
    }
} else {
    Write-Warn2 'Dry-run finalizado. Revisar y luego correr con -Commit.'
}