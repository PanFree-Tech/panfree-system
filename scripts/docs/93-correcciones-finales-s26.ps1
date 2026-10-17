<#
.SYNOPSIS
    Correcciones finales de S26: STATUS (secciones 3/4/5), PLAN (F2-03, F4-02), BITACORA (texto PR #22).
.DESCRIPTION
    Un solo script que deja los 3 archivos consistentes con el cierre de la auditoria.
    Idempotente: si ya esta aplicado, imprime [SKIP] sin tocar nada.
.PARAMETER Commit
    Si esta presente, commitea el cambio.
.NOTES
    Script: scripts/docs/93-correcciones-finales-s26.ps1
    Sesion: S26 (2026-10-17)
#>
[CmdletBinding()]
param([switch]$Commit, [switch]$NoCommit)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

function Write-Utf8PreservingBom([string]$Path, [string]$Content) {
    $b = [System.IO.File]::ReadAllBytes((Resolve-Path $Path).Path)
    $teniaBom = ($b.Length -ge 3 -and $b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF)
    # Quitar cualquier BOM que ya venga dentro del content
    while ($Content.Length -ge 1 -and $Content[0] -eq [char]0xFEFF) { $Content = $Content.Substring(1) }
    $enc = New-Object System.Text.UTF8Encoding($teniaBom)
    [System.IO.File]::WriteAllText((Resolve-Path $Path).Path, $Content, $enc)
}

$totalCambios = 0

# ============================================================================
# 1. STATUS.md - secciones 3, 4, 5
# ============================================================================
$status = 'docs/STATUS.md'
if (-not (Test-Path $status)) { throw "No existe: $status" }
$bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $status).Path)
$texto = [System.Text.Encoding]::UTF8.GetString($bytes)
while ($texto.Length -ge 1 -and $texto[0] -eq [char]0xFEFF) { $texto = $texto.Substring(1) }
$esCRLF = ([regex]::Matches($texto, "`r`n")).Count -gt 0
$eol = if ($esCRLF) { "`r`n" } else { "`n" }

# 1a. Seccion "3. Proximos 3 pasos"
$viejoPasos = @(
    '## 3. Proximos 3 pasos',
    '',
    '1. **F2-03** - Cloudinary Root User (reconsultar ticket #392411 desde 2026-10-18)',
    '2. **F4-01** - Purgar historial de Git (SEC-001)',
    '3. **F4-05** - Confirmar package-lock.json en repo'
) -join $eol

$nuevoPasos = @(
    '## 3. Proximos 3 pasos',
    '',
    '1. **BUG-003** - `.eq(''activo'')` -> `.eq(''is_active'')` en `diptico/[codigo]/page.js:98` (S27, smoke test post-auditoria)',
    '2. **SEC-015/016/017** - Chore de hardcodes residuales (S28)',
    '3. **Familia Gemini** (BUG-006..009) - Depende de DOC-008 (S29)'
) -join $eol

if ($texto.Contains($nuevoPasos)) {
    Write-Host "[SKIP] STATUS seccion 3 ya actualizada." -ForegroundColor Yellow
} elseif ($texto.Contains($viejoPasos)) {
    $texto = $texto.Replace($viejoPasos, $nuevoPasos)
    $totalCambios++
    Write-Host "[OK] STATUS seccion 3 actualizada (proximos pasos post-auditoria)." -ForegroundColor Green
} else {
    Write-Host "[WARN] STATUS seccion 3 no matcheo. Verificar manualmente." -ForegroundColor Yellow
}

# 1b. Seccion "4. Metricas clave"
$viejoMetricas = @(
    '| Claves productivas rotadas | 6 / 12 | 12 / 12 |',
    '| Claves en Bitwarden | 6 / 12 | 12 / 12 |',
    '| Hallazgos cerrados | 44 / 72 | 72 / 72 |'
) -join $eol

$nuevoMetricas = @(
    '| Claves productivas rotadas | 8 / 12 | 12 / 12 |',
    '| Claves en Bitwarden | 8 / 12 | 12 / 12 |',
    '| Hallazgos cerrados o aceptados | 71 / 73 | 73 / 73 |'
) -join $eol

if ($texto.Contains($nuevoMetricas)) {
    Write-Host "[SKIP] STATUS seccion 4 ya actualizada." -ForegroundColor Yellow
} elseif ($texto.Contains($viejoMetricas)) {
    $texto = $texto.Replace($viejoMetricas, $nuevoMetricas)
    $totalCambios++
    Write-Host "[OK] STATUS seccion 4 actualizada (metricas reales)." -ForegroundColor Green
} else {
    Write-Host "[WARN] STATUS seccion 4 no matcheo exacto. Verificar manualmente." -ForegroundColor Yellow
}

# 1c. Seccion "5. Ultima actividad" - agregar entrada S26 si no existe
if (-not $texto.Contains('2026-10-17 - Sesion 26 (ENV) - CIERRE DE AUDITORIA')) {
    $entradaS26 = @(
        '',
        '**2026-10-17 - Sesion 26 (ENV) - CIERRE DE AUDITORIA**',
        '- Auditoria inicial 2026-10-13 CERRADA formalmente.',
        '- 47/47 tareas (100%), 0 hallazgos P0/P1 abiertos.',
        '- 24 hallazgos P2/P3 reclasificados a Aceptado con revision agendada.',
        '- Documento de cierre: docs/audits/2026-10-13-inicial/46-cierre-auditoria-inicial.md',
        '- PR #23 mergeado via squash (318eab39). PR #22 cerrado como obsoleto.',
        '- Scripts de sesion versionados: 92a-92h + dump-session.ps1 + 93 (este).',
        ''
    ) -join $eol

    # Insertar antes de "## 6. Comandos utiles"
    $marcador = '## 6. Comandos utiles'
    if ($texto.Contains($marcador)) {
        $texto = $texto.Replace($marcador, $entradaS26 + $eol + $marcador)
        $totalCambios++
        Write-Host "[OK] STATUS seccion 5 actualizada (entrada S26)." -ForegroundColor Green
    } else {
        Write-Host "[WARN] STATUS no tiene '## 6. Comandos utiles'. Agregando al final." -ForegroundColor Yellow
        $texto = $texto.TrimEnd() + $eol + $entradaS26
        $totalCambios++
    }
} else {
    Write-Host "[SKIP] STATUS seccion 5 ya tiene entrada S26." -ForegroundColor Yellow
}

Write-Utf8PreservingBom -Path $status -Content $texto

# ============================================================================
# 2. PLAN-DE-TRABAJO.md - F2-03 y F4-02 a "Pendiente externo"
# ============================================================================
$plan = 'docs/operations/PLAN-DE-TRABAJO.md'
if (-not (Test-Path $plan)) { throw "No existe: $plan" }
$bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $plan).Path)
$texto = [System.Text.Encoding]::UTF8.GetString($bytes)
while ($texto.Length -ge 1 -and $texto[0] -eq [char]0xFEFF) { $texto = $texto.Substring(1) }

$cambiosPlan = 0

# F2-03
$viejoF203 = '| F2-03 | Migrar Cloudinary a system.panfree | P1 | S | En curso | Root User pendiente (ticket #392411) |'
$nuevoF203 = '| F2-03 | Migrar Cloudinary a system.panfree | P1 | S | Pendiente externo | Root User pendiente (ticket #392411). Migracion funcional OK desde S16; solo falta transferencia de Root User. |'
if ($texto.Contains($nuevoF203)) {
    Write-Host "[SKIP] PLAN F2-03 ya actualizada." -ForegroundColor Yellow
} elseif ($texto.Contains($viejoF203)) {
    $texto = $texto.Replace($viejoF203, $nuevoF203)
    $cambiosPlan++
    Write-Host "[OK] PLAN F2-03: En curso -> Pendiente externo." -ForegroundColor Green
} else {
    Write-Host "[WARN] PLAN F2-03 no matcheo. Verificar manualmente." -ForegroundColor Yellow
}

# F4-02
$viejoF402 = '| F4-02 | Ticket a GitHub Support | P0 | S | En curso | Ticket #4869059 enviado S24. Espera respuesta de soporte (2-5 dias habiles) |'
$nuevoF402 = '| F4-02 | Ticket a GitHub Support | P0 | S | Pendiente externo | Ticket #4869059 enviado S24. Espera respuesta de soporte (2-5 dias habiles). No bloquea cierre de auditoria. |'
if ($texto.Contains($nuevoF402)) {
    Write-Host "[SKIP] PLAN F4-02 ya actualizada." -ForegroundColor Yellow
} elseif ($texto.Contains($viejoF402)) {
    $texto = $texto.Replace($viejoF402, $nuevoF402)
    $cambiosPlan++
    Write-Host "[OK] PLAN F4-02: En curso -> Pendiente externo." -ForegroundColor Green
} else {
    Write-Host "[WARN] PLAN F4-02 no matcheo. Verificar manualmente." -ForegroundColor Yellow
}

if ($cambiosPlan -gt 0) { $totalCambios += $cambiosPlan }
Write-Utf8PreservingBom -Path $plan -Content $texto

# ============================================================================
# 3. BITACORA.md - corregir texto del PR #22 y duracion de S26
# ============================================================================
$bitacora = 'docs/BITACORA.md'
if (-not (Test-Path $bitacora)) { throw "No existe: $bitacora" }
$bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $bitacora).Path)
$texto = [System.Text.Encoding]::UTF8.GetString($bytes)
while ($texto.Length -ge 1 -and $texto[0] -eq [char]0xFEFF) { $texto = $texto.Substring(1) }

$cambiosBit = 0

# Duracion S26: "~3 horas" -> "~6 horas"
$viejoDur = '**Duracion:** ~3 horas' + $eol + '**Objetivo:** Cierre formal de la auditoria inicial 2026-10-13'
$nuevoDur = '**Duracion:** ~6 horas' + $eol + '**Objetivo:** Cierre formal de la auditoria inicial 2026-10-13'
if ($texto.Contains($nuevoDur)) {
    Write-Host "[SKIP] BITACORA duracion S26 ya corregida." -ForegroundColor Yellow
} elseif ($texto.Contains($viejoDur)) {
    $texto = $texto.Replace($viejoDur, $nuevoDur)
    $cambiosBit++
    Write-Host "[OK] BITACORA: duracion S26 ~3h -> ~6h." -ForegroundColor Green
} else {
    Write-Host "[WARN] BITACORA duracion S26 no matcheo." -ForegroundColor Yellow
}

# Texto del PR #22
$viejoPR22 = '- PR #22 mergeado (dump-session.ps1 + .gitignore para DUMP-S*.txt).'
$nuevoPR22 = '- PR #23 mergeado via squash (318eab39): scripts 92a-92h + dump-session.ps1 + .gitignore.' + $eol + '- PR #22 cerrado como obsoleto (sus cambios fueron incluidos en #23).'
if ($texto.Contains($nuevoPR22)) {
    Write-Host "[SKIP] BITACORA texto PR #22 ya corregido." -ForegroundColor Yellow
} elseif ($texto.Contains($viejoPR22)) {
    $texto = $texto.Replace($viejoPR22, $nuevoPR22)
    $cambiosBit++
    Write-Host "[OK] BITACORA: texto PR #22 corregido." -ForegroundColor Green
} else {
    Write-Host "[WARN] BITACORA texto PR #22 no matcheo." -ForegroundColor Yellow
}

if ($cambiosBit -gt 0) { $totalCambios += $cambiosBit }
Write-Utf8PreservingBom -Path $bitacora -Content $texto

# ============================================================================
# Resumen y commit
# ============================================================================
Write-Host ""
if ($totalCambios -eq 0) {
    Write-Host "[OK] Nada que cambiar. Todos los archivos ya estan consistentes." -ForegroundColor Green
    return
}

Write-Host "[OK] $totalCambios cambio(s) aplicados." -ForegroundColor Green
Write-Host ""
Write-Host "Verificar con: git diff docs/" -ForegroundColor Cyan

if ($Commit) {
    git add docs/STATUS.md docs/operations/PLAN-DE-TRABAJO.md docs/BITACORA.md
    git commit -m "docs(session): corregir consistencia post-cierre S26 (proximos pasos, metricas, PR #22)"
    Write-Host "[OK] Commit creado." -ForegroundColor Green
} else {
    Write-Host "[DRY-RUN] Sin commit. Revisar y correr con -Commit." -ForegroundColor Cyan
}