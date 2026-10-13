# =============================================================================
# 19 - Cerrar Sesion 9 (2026-10-14)
# =============================================================================
# Sesion: 9
# Hallazgo cerrado: SEC-012 (F1-11)
# Commit de remediacion: ca21e7cc
#
# Uso:
#   .\scripts\docs\19-cerrar-sesion-9.ps1            # DRY RUN
#   .\scripts\docs\19-cerrar-sesion-9.ps1 -Commit    # COMMIT + PUSH
# =============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'

# --- Rutas base ---------------------------------------------------------------
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$status   = Join-Path $repoRoot 'docs\STATUS.md'
$bitacora = Join-Path $repoRoot 'docs\BITACORA.md'
$verLinks = Join-Path $repoRoot 'scripts\docs\00-verificar-links.ps1'
$script18 = Join-Path $repoRoot 'scripts\docs\18-documentar-sec-012.ps1'

Write-Host ''
Write-Host ('=' * 60) -ForegroundColor Cyan
Write-Host '  19 - Cerrar Sesion 9 (2026-10-14)' -ForegroundColor Cyan
Write-Host ('=' * 60) -ForegroundColor Cyan
Write-Host ("  Repo: " + $repoRoot)
if ($Commit) {
    Write-Host '  Modo: COMMIT + PUSH' -ForegroundColor Yellow
} else {
    Write-Host '  Modo: DRY RUN (sin commit)' -ForegroundColor Yellow
}
Write-Host ''

# --- [1/6] Prerequisitos ------------------------------------------------------
Write-Host '[1/6] Verificando prerequisitos...'
$faltantes = @()
foreach ($p in @($status, $bitacora, $verLinks, $script18)) {
    if (-not (Test-Path $p)) { $faltantes += $p }
}
if ($faltantes.Count -gt 0) {
    Write-Host ('  ERROR: faltan rutas: ' + ($faltantes -join ', ')) -ForegroundColor Red
    exit 1
}
Write-Host '  OK: todas las rutas existen'

# --- [2/6] STATUS.md ----------------------------------------------------------
Write-Host ''
Write-Host '[2/6] Actualizando STATUS.md...'

$s = Get-Content -Path $status -Raw

# Ultima actualizacion
$s = $s -replace '\*\*Ultima actualizacion:\*\* 2026-10-14 \(fin Sesion 8\)', '**Ultima actualizacion:** 2026-10-14 (fin Sesion 9)'

# Fase actual
$s = $s -replace '\*\*Fase actual:\*\* Fase 1 \(EN CURSO\)', '**Fase actual:** Fase 3 (EN CURSO)'

# Nota sobre F1-06 aceptada (idempotente: solo si no esta)
if ($s -notmatch 'F1-06 \(Leaked Password Protection\)') {
    $nota = @(
        '',
        '> **Nota Fase 1:** F1-06 (Leaked Password Protection) queda **Aceptada**',
        '> por limitacion del plan Free de Supabase. No es un pendiente tecnico.',
        '> Ver [tracking](./audits/2026-10-13-inicial/06-hallazgos-tracking.md).'
    ) -join "`r`n"

    # Insertar despues de la tabla de fases (antes del separador --- siguiente)
    $s = $s -replace '(\| \*\*Total\*\* \| \*\*47\*\* \| \*\*16\*\* \| \*\*0\*\* \| \*\*31\*\* \| \*\*34%\*\* \|\r?\n)', ('$1' + $nota + "`r`n")
}

Set-Content -Path $status -Value $s -Encoding UTF8 -NoNewline
Write-Host '  OK: STATUS.md actualizado'

# --- [3/6] BITACORA.md --------------------------------------------------------
Write-Host ''
Write-Host '[3/6] Actualizando BITACORA.md...'

$b = Get-Content -Path $bitacora -Raw
$marca = '## 2026-10-14 (Sesion 9 - COMPLETA)'

if ($b -match [regex]::Escape($marca)) {
    Write-Host '  INFO: entrada Sesion 9 ya existe (idempotente)'
} else {
    $entrada = @(
        '',
        '---',
        '',
        '## 2026-10-14 (Sesion 9 - COMPLETA)',
        '',
        '**Duracion:** ~1 hora',
        '**Objetivo:** Cerrar SEC-012 (canjes_premios usa clientes.role en vez de is_admin())',
        '',
        '**Completado:**',
        '- SEC-012 cerrado: DROP policy "Admin puede ver todos los canjes" + CREATE con',
        '  is_admin() y rol {authenticated}. Alinea canjes_premios con ADR-002.',
        '- Auditoria de codigo: 0 referencias a is_admin() en src/, 3 referencias a',
        '  canjes_premios (todas path B2C, sin impacto).',
        '- Doc de auditoria: docs/audits/2026-10-13-inicial/18-f1-11-sec-012-canjes-premios.md',
        '- Migracion SQL: supabase/migrations/2026-10-14-f1-11-sec-012-canjes-premios.sql',
        '- Script: scripts/docs/18-documentar-sec-012.ps1',
        '- Fase 1 queda al 100% (9/9, con F1-06 aceptada por plan Free).',
        '',
        '**Commits de la sesion:**',
        '- ca21e7cc security(db): alinear canjes_premios con ADR-002 (SEC-012, F1-11)',
        '',
        '**Hallazgos cerrados:**',
        '- SEC-012: canjes_premios usa clientes.role en vez de is_admin()',
        '',
        '**Hallazgos nuevos:**',
        '- Ninguno',
        '',
        '**Bloqueantes:**',
        '- Ninguno',
        '',
        '**Aprendizajes:**',
        '- La normalizacion de Postgres es util para verificar el estado real de',
        '  una politica: (SELECT is_admin()) -> ( SELECT is_admin() AS is_admin).',
        '- Comparar el output textual ANTES y DESPUES es mas confiable que asumir',
        '  que el CREATE POLICY quedo bien porque el SQL Editor devolvio "Success".',
        '- Un fix de consistencia (no vulnerabilidad) se documenta igual que uno de',
        '  seguridad: PRE, POST, DoD, referencias. La trazabilidad no negocia.',
        '',
        '**Proxima sesion:**',
        '- F3-02: SEC-002 quitar claves hardcodeadas (P1)',
        '- chore(docs): limpiar entradas duplicadas en BITACORA.md y STATUS.md',
        '- F3-04: AUTH-001 contrasenas debiles (P1)'
    ) -join "`r`n"

    $b = $b.TrimEnd() + "`r`n" + $entrada + "`r`n"
    Set-Content -Path $bitacora -Value $b -Encoding UTF8 -NoNewline
    Write-Host '  OK: entrada Sesion 9 agregada'
}

# --- [4/6] Verificar links ----------------------------------------------------
Write-Host ''
Write-Host '[4/6] Verificando links de la documentacion...'
& powershell -ExecutionPolicy Bypass -File $verLinks

# --- [5/6] Resumen de cambios -------------------------------------------------
Write-Host ''
Write-Host '[5/6] Cambios a commitear:'
Push-Location $repoRoot
try {
    git status --short
} finally {
    Pop-Location
}

# --- [6/6] Commit opcional ----------------------------------------------------
Write-Host ''
if (-not $Commit) {
    Write-Host 'Modo DRY RUN. No se commiteo nada.' -ForegroundColor Yellow
    Write-Host 'Revisa los archivos creados/modificados y despues corre:'
    Write-Host '  .\scripts\docs\19-cerrar-sesion-9.ps1 -Commit' -ForegroundColor Cyan
} else {
    Write-Host 'Modo -Commit activado. Preparando commit...' -ForegroundColor Yellow

    Push-Location $repoRoot
    try {
        git add $status
        git add $bitacora
        git add $script18

        $msg = 'docs(session): cerrar sesion 9 2026-10-14'
        git commit -m $msg
        if ($LASTEXITCODE -ne 0) {
            Write-Host '  ERROR: git commit fallo' -ForegroundColor Red
            exit 1
        }
        git push origin main
        if ($LASTEXITCODE -ne 0) {
            Write-Host '  ERROR: git push fallo' -ForegroundColor Red
            exit 1
        }
        Write-Host '  OK: commit + push completados' -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

Write-Host ''
Write-Host ('=' * 60) -ForegroundColor Cyan
Write-Host '  Script 19 finalizado' -ForegroundColor Cyan
Write-Host ('=' * 60) -ForegroundColor Cyan