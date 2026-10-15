# ============================================================================
# 44-cierre-s16.ps1
# ----------------------------------------------------------------------------
# Cierre de la Sesion 16 (ENV) - Rotaciones Supabase + Cloudinary + Gemini + Resend.
#
# Actualiza:
#   - docs/operations/PLAN-DE-TRABAJO.md      (F2-01..F2-06 -> estado real)
#   - docs/STATUS.md                          (fecha, %, proximos 3 pasos, S16)
#   - docs/BITACORA.md                        (entrada S16 - COMPLETA)
#   - docs/operations/ROTACION-CLAVES.md      (3 correcciones + ticket #392411)
#   - docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md  (SEC-021, DOC-004)
#
# Verifica links y commitea + pushea (con -Commit).
# Fecha: 2026-10-15
# ----------------------------------------------------------------------------
# Uso:
#   Dry run:  .\44-cierre-s16.ps1
#   Aplicar:  .\44-cierre-s16.ps1 -Commit
# ============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BackupDir = Join-Path $PSScriptRoot '.backup-s16'
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
# 1. PLAN-DE-TRABAJO.md
# ============================================================================

Write-Step 'Actualizar docs/operations/PLAN-DE-TRABAJO.md'

$planPath = Join-Path $RepoRoot 'docs\operations\PLAN-DE-TRABAJO.md'
if (-not (Test-Path -LiteralPath $planPath)) {
    Write-Err 'PLAN-DE-TRABAJO.md no existe'
    Pop-Location
    exit 1
}
$plan = Read-FileRaw $planPath

if ($plan.Contains('| F2-01 | Migrar Supabase a system.panfree | P0 | S | OK |')) {
    Write-Skip 'F2-* ya actualizadas en PLAN-DE-TRABAJO.md'
} else {
    $reemplazos = @(
        @{
            old = '| F2-01 | Migrar Supabase a system.panfree | P0 | S | Pendiente | system.panfree es Owner |'
            new = '| F2-01 | Migrar Supabase a system.panfree | P0 | S | OK | system.panfree es Owner |'
        },
        @{
            old = '| F2-02 | Rotar JWT secret + keys Supabase | P0 | M | Pendiente | Vercel + local OK |'
            new = '| F2-02 | Rotar JWT secret + keys Supabase | P0 | M | OK | Vercel + local OK |'
        },
        @{
            old = '| F2-03 | Migrar Cloudinary a system.panfree | P1 | S | Pendiente | Imagenes se ven |'
            new = '| F2-03 | Migrar Cloudinary a system.panfree | P1 | S | En curso | Root User pendiente (ticket #392411) |'
        },
        @{
            old = '| F2-04 | Rotar Cloudinary API secret | P1 | S | Pendiente | Vercel + local OK |'
            new = '| F2-04 | Rotar Cloudinary API secret | P1 | S | OK | Vercel + local OK |'
        },
        @{
            old = '| F2-05 | Rotar Resend API key | P1 | S | Pendiente | Mail de prueba OK |'
            new = '| F2-05 | Rotar Resend API key | P1 | S | OK | Mail de prueba OK |'
        },
        @{
            old = '| F2-06 | Rotar Gemini API key | P1 | S | Pendiente | Marketing IA funciona |'
            new = '| F2-06 | Rotar Gemini API key | P1 | S | OK | Marketing IA funciona |'
        }
    )

    $modificados = 0
    foreach ($r in $reemplazos) {
        if ($plan.Contains($r.old)) {
            $plan = $plan.Replace($r.old, $r.new)
            $modificados++
        }
    }

    if ($Commit) {
        Backup-File $planPath $stamp
        Write-FileRaw $planPath $plan
        Write-Ok ("PLAN-DE-TRABAJO.md actualizado (" + $modificados + "/6 reemplazos)")
    } else {
        Write-Host ("   (dry run: " + $modificados + "/6 reemplazos detectados)") -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 2. STATUS.md
# ============================================================================

Write-Step 'Actualizar docs/STATUS.md'

$statusPath = Join-Path $RepoRoot 'docs\STATUS.md'
if (-not (Test-Path -LiteralPath $statusPath)) {
    Write-Err 'STATUS.md no existe'
    Pop-Location
    exit 1
}
$status = Read-FileRaw $statusPath

$cambiosStatus = 0

# 2a. Fecha + fase
$oldFecha = '**Ultima actualizacion:** 2026-10-14 (fin Sesion 15)'
$newFecha = '**Ultima actualizacion:** 2026-10-15 (fin Sesion 16)'
if ($status.Contains($oldFecha)) {
    $status = $status.Replace($oldFecha, $newFecha)
    $cambiosStatus++
}

# 2b. Progreso global
$oldProg = '**Progreso global:** 51% (24 de 47 tareas)'
$newProg = '**Progreso global:** 60% (28 de 47 tareas)'
if ($status.Contains($oldProg)) {
    $status = $status.Replace($oldProg, $newProg)
    $cambiosStatus++
}

# 2c. Tabla resumen - Fase 2
$oldF2 = '| F2 - Rotacion claves | 14 | 2 | 0 | 12 | 14% |'
$newF2 = '| F2 - Rotacion claves | 14 | 5 | 1 | 8 | 36% |'
if ($status.Contains($oldF2)) {
    $status = $status.Replace($oldF2, $newF2)
    $cambiosStatus++
} else {
    # Intentar variante
    $oldF2b = '| F2 - Rotacion claves | 14 | 3 | 0 | 11 | 21% |'
    if ($status.Contains($oldF2b)) {
        $status = $status.Replace($oldF2b, $newF2)
        $cambiosStatus++
    }
}

# 2d. Total tabla
$oldTotal = '| **Total** | **47** | **24** | **0** | **23** | **51%** |'
$newTotal = '| **Total** | **47** | **28** | **1** | **18** | **60%** |'
if ($status.Contains($oldTotal)) {
    $status = $status.Replace($oldTotal, $newTotal)
    $cambiosStatus++
}

# 2e. Proximos 3 pasos (variante actual)
$oldPasos = @(
    '1. **Fase 2 - Rotaciones (S15)** - Bitwarden + rotar claves (F2-02, F2-04..F2-13)',
    '2. **F3-07** - BUG-001: NEXT_PUBLIC_VAPID_KEY inconsistente (P2)',
    '3. **SEC-018 / SEC-019** - Trazabilidad de keys Cloudinary/Gemini antes de rotar'
) -join "`r`n"

$newPasos = @(
    '1. **F2-07** - Migrar Meta WhatsApp a system.panfree (proxima rotacion)',
    '2. **Cloudinary ticket #392411** - esperar respuesta soporte (2-4 dias habiles)',
    '3. **F2-08..F2-13** - Resto de rotaciones (Twilio, Instagram, n8n, GA4, VAPID, Secrets, APIs IA)'
) -join "`r`n"

if ($status.Contains($oldPasos)) {
    $status = $status.Replace($oldPasos, $newPasos)
    $cambiosStatus++
}

# 2f. Metricas clave
$oldMetricas = @(
    '| Claves productivas rotadas | 0 / 12 | 12 / 12 |',
    '| Claves en Bitwarden | 3 / 12 | 12 / 12 |',
    '| Hallazgos cerrados | 28 / 45 | 45 / 45 |'
) -join "`r`n"

$newMetricas = @(
    '| Claves productivas rotadas | 4 / 12 | 12 / 12 |',
    '| Claves en Bitwarden | 4 / 12 | 12 / 12 |',
    '| Hallazgos cerrados | 31 / 47 | 47 / 47 |'
) -join "`r`n"

if ($status.Contains($oldMetricas)) {
    $status = $status.Replace($oldMetricas, $newMetricas)
    $cambiosStatus++
}

# 2g. Seccion "Ultima actividad" - agregar S16 al final
$s16Block = @(
    '',
    '---',
    '',
    '**2026-10-15 - Sesion 16 (COMPLETA)**',
    '- F2-02 / Supabase: migrado a sb_publishable_/sb_secret_ + JWT Signing Key rotada (ea82251e).',
    '- F2-05 / Resend: migrado a system.panfree, dominio transferido via Claim, DNS actualizado,',
    '  key nueva con scope minimo, test de mail OK (doc 29-f2-05-rotar-resend.md).',
    '- F2-06 / Gemini: key rotada + 3 huerfanas eliminadas (b8767b31).',
    '- F2-04 / Cloudinary: key rotada hoy 2026-10-15. Ticket Root #392411 abierto.',
    '- SEC-008, SEC-018, SEC-019, SEC-021, BUG-011, DOC-004 cerrados.',
    '- Politica de rotacion sin coleccion "Legado" formalizada (66a69d3d + b15e8b6f).',
    '- Commits: ccd57f00, ea82251e, e17110f6, b8767b31, cb6dfe04, 7764b29f, 5e111171,',
    '  66a69d3d, b15e8b6f, 1f0420a5.'
) -join "`r`n"

$s15Anchor = '**2026-10-14 - Sesion 15 (COMPLETA)**'
if (-not $status.Contains('Sesion 16 (COMPLETA)')) {
    # Agregar al final (o despues de S15 si existe)
    if ($status.Contains($s15Anchor)) {
        # ya tiene S15, agregar S16 despues de todo lo demas
        $status = $status.TrimEnd() + "`r`n" + $s16Block
        $cambiosStatus++
    } else {
        $status = $status.TrimEnd() + "`r`n" + $s16Block
        $cambiosStatus++
    }
}

if ($Commit) {
    Backup-File $statusPath $stamp
    Write-FileRaw $statusPath $status
    Write-Ok ("STATUS.md actualizado (" + $cambiosStatus + " cambios)")
} else {
    Write-Host ("   (dry run: " + $cambiosStatus + " cambios en STATUS.md)") -ForegroundColor DarkYellow
}

# ============================================================================
# 3. BITACORA.md
# ============================================================================

Write-Step 'Agregar entrada S16 a BITACORA.md'

$bitPath = Join-Path $RepoRoot 'docs\BITACORA.md'
if (-not (Test-Path -LiteralPath $bitPath)) {
    Write-Err 'BITACORA.md no existe'
    Pop-Location
    exit 1
}
$bit = Read-FileRaw $bitPath

if ($bit.Contains('Sesion 16 - COMPLETA')) {
    Write-Skip 'Entrada S16 ya existe en BITACORA.md'
} else {
    $bitBlock = @(
        '',
        '---',
        '',
        '## 2026-10-15 (Sesion 16 - COMPLETA)',
        '',
        '**Duracion:** ~6 horas',
        '**Objetivo:** Rotaciones Supabase + Cloudinary + Resend + Gemini + politica sin "Legado"',
        '',
        '**Completado:**',
        '- F2-02 / Supabase: migrado a sb_publishable_/sb_secret_ + JWT Signing Key rotada.',
        '- F2-04 / Cloudinary: key rotada. Ticket Root User #392411 abierto.',
        '- F2-05 / Resend: migracion [C]->[S], dominio via Claim, DNS en Spaceship,',
        '  key nueva con scope minimo, test de mail real OK.',
        '- F2-06 / Gemini: key rotada + 3 huerfanas eliminadas.',
        '- Politica de rotacion sin coleccion "Legado" formalizada en SISTEMA-DE-TRABAJO',
        '  y GESTION-DE-RIESGOS. Toda la documentacion operativa actualizada.',
        '- SEC-008, SEC-018, SEC-019, SEC-021, BUG-011, DOC-004 cerrados.',
        '- Doc 29: 29-f2-05-rotar-resend.md (248 lineas, con DNS, DoD, aprendizajes).',
        '',
        '**Commits:**',
        '- ccd57f00 docs(session): cerrar sesion 15 (ENV) - migracion Supabase + 5 hallazgos',
        '- ea82251e security(env): migrar Supabase a Publishable/Secret keys (F2-02)',
        '- e17110f6 fix(supabase): aceptar formato sb_publishable en sanitizeSupabaseKey (F2-02)',
        '- b8767b31 security(env): rotar Gemini API key + revocar huerfanas (SEC-019, F2-06)',
        '- cb6dfe04 security(env): identificar y revocar keys huerfanas de Cloudinary (SEC-018)',
        '- 5e111171 fix(scripts): corregir bug en 29-fix-logger-import.ps1 (BUG-011)',
        '- 7764b29f security(db): eliminar funcion sin uso crear_usuario_admin (SEC-008)',
        '- 66a69d3d docs(ops): formalizar politica de rotacion sin legacy (S16)',
        '- b15e8b6f docs(ops): documentar politica de rotacion en sistema y riesgos (S16)',
        '- 1f0420a5 docs(audit): documentar cierre F2-05 (SEC-021, DOC-004)',
        '',
        '**Hallazgos cerrados:**',
        '- SEC-008: funcion crear_usuario_admin sin uso',
        '- SEC-018: keys huerfanas Cloudinary revocadas',
        '- SEC-019: keys huerfanas Gemini revocadas',
        '- SEC-021: keys huerfanas Resend revocadas + migracion a [S]',
        '- BUG-011: bug en script 29-fix-logger-import.ps1',
        '- DOC-004: Resend mal documentado bajo cuenta [C]',
        '',
        '**Hallazgos nuevos:**',
        '- Ninguno (SEC-021 y DOC-004 fueron detectados durante F2-05 y cerrados en la misma sesion).',
        '',
        '**Bloqueantes:**',
        '- Ninguno. Cloudinary Root User pendiente (ticket #392411, no bloqueante).',
        '',
        '**Aprendizajes:**',
        '- Resend ya no usa Amazon SES. Migro a forge.rmta.net. Los registros DNS',
        '  cambiaron respecto a la documentacion vieja.',
        '- Domain Claim vs Domain Add en Resend: cuando el dominio esta en otra',
        '  cuenta, hay que hacer Claim con TXT en "@", no en un subdominio.',
        '- DKIM cambio de formato: antes v=DKIM1; k=rsa; p=..., ahora solo p=...',
        '- Verificar en Logs de Resend filtrado por API key es la forma mas confiable',
        '  de confirmar que la app usa la key nueva.',
        '- Cloudinary Root User no se puede transferir desde la consola: requiere',
        '  ticket a soporte. Se puede dejar como Master Admin operativamente.',
        '- Cloudinary: el dropdown de Severity en el form de soporte rota solo.',
        '  Priorizar el contenido del ticket, no la severidad.',
        '',
        '**Proxima sesion (S17):**',
        '- F2-07: migrar Meta WhatsApp a system.panfree.',
        '- F2-08: rotar Twilio auth token.',
        '- F2-09: rotar Instagram access token.',
        '- Esperar respuesta Cloudinary #392411 (2-4 dias habiles).',
        '- Continuar rotaciones restantes (n8n, GA4, VAPID, Secrets, APIs IA).',
        '- Cerrar SEC-020 cuando todos los items Bitwarden esten completos.',
        '',
        '---',
        ''
    ) -join "`r`n"

    if ($Commit) {
        Backup-File $bitPath $stamp
        $bit = $bit.TrimEnd() + "`r`n" + $bitBlock
        Write-FileRaw $bitPath $bit
        Write-Ok 'BITACORA.md actualizada'
    } else {
        Write-Host '   (dry run: BITACORA.md NO escrita)' -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 4. ROTACION-CLAVES.md - 3 correcciones + ticket
# ============================================================================

Write-Step 'Corregir ROTACION-CLAVES.md (Cloudinary, Resend, deuda, ticket)'

$rotPath = Join-Path $RepoRoot 'docs\operations\ROTACION-CLAVES.md'
if (-not (Test-Path -LiteralPath $rotPath)) {
    Write-Err 'ROTACION-CLAVES.md no existe'
    Pop-Location
    exit 1
}
$rot = Read-FileRaw $rotPath

$cambiosRot = 0

# 4a. Corregir nota Cloudinary en tabla S16
$oldCloud = '| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S15) | 3 keys huerfanas revocadas, quedo 1 activa |'
$newCloud = '| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S16) | 1 key rotada (F2-04) + 3 huerfanas revocadas. Ticket Root #392411 abierto. |'
if ($rot.Contains($oldCloud)) {
    $rot = $rot.Replace($oldCloud, $newCloud)
    $cambiosRot++
}

# 4b. Mover Resend a completos
$oldResend = '| 4 | Resend - Produccion | [S] | F2-05 |'
$newResend = '| 4 | Resend - Produccion | OK | 2026-10-15 (S16) | Migrado [C]->[S], dominio via Claim, key con scope minimo (F2-05, SEC-021, DOC-004) |'
if ($rot.Contains($oldResend)) {
    $rot = $rot.Replace($oldResend, $newResend)
    $cambiosRot++
}

# 4c. Quitar F2-04 de deuda tecnica
$oldDeuda = '- F2-04 (rotar Cloudinary) pendiente.'
$newDeuda = '- (resuelto en S16) F2-04 Cloudinary: key rotada 2026-10-15.'
if ($rot.Contains($oldDeuda)) {
    $rot = $rot.Replace($oldDeuda, $newDeuda)
    $cambiosRot++
}

if ($Commit) {
    Backup-File $rotPath $stamp
    Write-FileRaw $rotPath $rot
    Write-Ok ("ROTACION-CLAVES.md actualizado (" + $cambiosRot + " cambios)")
} else {
    Write-Host ("   (dry run: " + $cambiosRot + " cambios en ROTACION-CLAVES.md)") -ForegroundColor DarkYellow
}

# ============================================================================
# 5. Tracking: SEC-021 + DOC-004
# ============================================================================

Write-Step 'Agregar SEC-021 y DOC-004 al tracking'

$trackPath = Join-Path $RepoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
if (-not (Test-Path -LiteralPath $trackPath)) {
    Write-Err '06-hallazgos-tracking.md no existe'
    Pop-Location
    exit 1
}
$track = Read-FileRaw $trackPath

if ($track.Contains('SEC-021')) {
    Write-Skip 'SEC-021 ya presente en tracking'
} else {
    # 5a. Total 45 -> 47
    $t45 = '**Total de hallazgos:** 45'
    $t47 = '**Total de hallazgos:** 47'
    if ($track.Contains($t45)) { $track = $track.Replace($t45, $t47) }

    # 5b. Cerrado 29 -> 31
    $cViejo = '| Cerrado | 29 |'
    $cNuevo = '| Cerrado | 31 |'
    if ($track.Contains($cViejo)) { $track = $track.Replace($cViejo, $cNuevo) }

    # 5c. Media 15 -> 17, Cerrados media 5 -> 7
    $mv = '| Media | 15 | 5 |'
    $mn = '| Media | 17 | 7 |'
    if ($track.Contains($mv)) { $track = $track.Replace($mv, $mn) }

    # 5d. Insertar SEC-021 y DOC-004 al final de "Hallazgos medios"
    $anclaMed = '| SEC-020 | 9 items Bitwarden pendientes (se completan durante rotacion S15) | F2 | P2 | Abierto | - |'
    $filasNuevas = @(
        '| SEC-021 | Resend: 2 keys huerfanas revocadas + migracion [C]->[S] | F2 | P2 | Cerrado | (S16) |',
        '| DOC-004 | Resend documentado bajo [C] cuando era [S] | F2 | P2 | Cerrado | (S16) |'
    ) -join "`r`n"

    if ($track.Contains($anclaMed)) {
        $track = $track.Replace($anclaMed, $anclaMed + "`r`n" + $filasNuevas)
    }

    if ($Commit) {
        Backup-File $trackPath $stamp
        Write-FileRaw $trackPath $track
        Write-Ok 'Tracking actualizado (SEC-021 + DOC-004)'
    } else {
        Write-Host '   (dry run: tracking NO escrito)' -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 6. Verificar links (si Commit)
# ============================================================================

if ($Commit) {
    Write-Step 'Verificar links'
    $verPath = Join-Path $RepoRoot 'scripts\docs\00-verificar-links.ps1'
    if (Test-Path -LiteralPath $verPath) {
        & powershell -ExecutionPolicy Bypass -File $verPath
    } else {
        Write-Skip '00-verificar-links.ps1 no encontrado'
    }
}

# ============================================================================
# 7. Commit + push
# ============================================================================

Write-Step 'Commit'

if (-not $Commit) {
    Write-Host '   Dry run. Nada escrito, nada commiteado.' -ForegroundColor DarkYellow
    Write-Host '   Para aplicar: .\44-cierre-s16.ps1 -Commit' -ForegroundColor DarkYellow
    Pop-Location
    exit 0
}

git add -- docs/operations/PLAN-DE-TRABAJO.md
git add -- docs/STATUS.md
git add -- docs/BITACORA.md
git add -- docs/operations/ROTACION-CLAVES.md
git add -- docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md

$staged = @(git diff --cached --name-only)
if ($staged.Count -eq 0) {
    Write-Skip 'Nada staged. No hay commit.'
    Pop-Location
    exit 0
}
Write-Ok ('Archivos staged: ' + $staged.Count)
$staged | ForEach-Object { Write-Host ('     - ' + $_) -ForegroundColor DarkGray }

$msg = 'docs(session): cerrar sesion 16 (ENV) - rotaciones + politica sin legacy'
git commit -m $msg
if ($LASTEXITCODE -ne 0) { Write-Err 'git commit fallo'; Pop-Location; exit 1 }

git push origin main
if ($LASTEXITCODE -ne 0) { Write-Err 'git push fallo'; Pop-Location; exit 1 }

Write-Ok ('Commit pusheado: ' + $msg)
Write-Host ''
Write-Host 'Sesion 16 cerrada COMPLETA.' -ForegroundColor Cyan
Write-Host 'Proximo paso: S17 - continuar rotaciones (F2-07 Meta WhatsApp).' -ForegroundColor Cyan

Pop-Location