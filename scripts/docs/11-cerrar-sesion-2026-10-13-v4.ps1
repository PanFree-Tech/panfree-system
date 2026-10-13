# 11-cerrar-sesion-2026-10-13-v4.ps1
# Cierra la sesion del 2026-10-13 (v4) tras completar F1-07.
# Actualiza STATUS.md y BITACORA.md, verifica links, commitea.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\11-cerrar-sesion-2026-10-13-v4.ps1 -NoCommit
#   powershell -ExecutionPolicy Bypass -File scripts\docs\11-cerrar-sesion-2026-10-13-v4.ps1

param(
    [switch]$NoCommit
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $RepoRoot

Write-Host "=== Cerrando sesion 2026-10-13 (v4) ===" -ForegroundColor Cyan
Write-Host ""

function Write-FileNoBom {
    param([string]$Path, [string]$Content)
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText((Join-Path (Get-Location) $Path), $Content, $utf8NoBom)
    Write-Host "[OK] $Path" -ForegroundColor Green
}

# ============================================================
# 1. Actualizar STATUS.md
# ============================================================
Write-Host "--- Actualizando STATUS.md ---" -ForegroundColor Yellow

$statusPath = "docs/STATUS.md"
$status = Get-Content $statusPath -Raw -Encoding UTF8

$status = $status.Replace(
    "**Ultima actualizacion:** 2026-10-13 (fin de sesion 2)",
    "**Ultima actualizacion:** 2026-10-13 (fin de sesion 3)"
)
$status = $status.Replace(
    "**Progreso global:** 26% (12 de 47 tareas)",
    "**Progreso global:** 28% (13 de 47 tareas)"
)
$status = $status.Replace(
    "| F1 - Seguridad DB | 9 | 5 | 0 | 4 | 56% |",
    "| F1 - Seguridad DB | 9 | 6 | 0 | 3 | 67% |"
)
$status = $status.Replace(
    "| **Total** | **47** | **12** | **0** | **35** | **26%** |",
    "| **Total** | **47** | **13** | **0** | **34** | **28%** |"
)
$status = $status.Replace(
    "1. **F1-06** - Habilitar Leaked Password Protection en Supabase Auth (P1)`r`n2. **F1-07** - Optimizar ~60 politicas RLS (InitPlan) (P2, esfuerzo L)`r`n3. **F1-08** - Consolidar ~150 politicas duplicadas (P2, esfuerzo L)",
    "1. **F1-08** - Consolidar ~150 politicas duplicadas (P2, esfuerzo L)`r`n2. **F1-09** - Eliminar indices duplicados (P3, esfuerzo S)`r`n3. **F3-01** - SEC-003: admin por app_metadata (P0, esfuerzo S)"
)
$status = $status.Replace(
    "| Hallazgos cerrados | 5 / 22 | 22 / 22 |",
    "| Hallazgos cerrados | 6 / 22 | 22 / 22 |"
)

# Ultima actividad
$nuevaActividad = @(
    "**2026-10-13 - Sesion 3 (COMPLETA)**",
    "- F1-07: 79 politicas RLS optimizadas con InitPlan",
    "- 0 politicas DIRECTAS en pg_policies (antes: 79)",
    "- 81 politicas OPTIMIZADAS (antes: 0)",
    "- Hallazgo DB-001e cerrado (hash 02311b72)",
    "- SQL versionado en supabase/migrations/",
    "- Script 10-documentar-f1-07.ps1 agregado",
    "- Verificador de links reporta 14 falsos positivos en HANDOFF-2026-10-13.md (pendiente arreglar en chore(tooling))"
) -join "`n"

$status = $status -replace "(?s)(\*\*2026-10-13 - Sesion 2 \(COMPLETA\)\*\*.*?)- Backup estructural en Bitwarden \+ local", "`$1- Backup estructural en Bitwarden + local`n`n$nuevaActividad"

Write-FileNoBom -Path $statusPath -Content $status

# ============================================================
# 2. Actualizar BITACORA.md
# ============================================================
Write-Host ""
Write-Host "--- Actualizando BITACORA.md ---" -ForegroundColor Yellow

$bitacoraPath = "docs/BITACORA.md"
$bitacora = Get-Content $bitacoraPath -Raw -Encoding UTF8

$nuevaEntrada = @(
    "",
    "---",
    "",
    "## 2026-10-13 (Sesion 3 - CIERRE)",
    "",
    "**Duracion:** ~4 horas",
    "**Objetivo:** Ejecutar F1-07 (Optimizar 79 politicas RLS con InitPlan)",
    "",
    "**Completado:**",
    "- F1-07: 79 politicas RLS optimizadas con InitPlan",
    "- Aplicado en 4 bloques por patron + 1 fix puntual",
    "- Verificacion: 0 DIRECTAS en pg_policies (antes: 79)",
    "- 81 OPTIMIZADAS + 13 SIN_auth = 94 totales",
    "- EXPLAIN ANALYZE antes/despues documentado (con limitaciones)",
    "- SQL versionado en supabase/migrations/2026-10-13-f1-07-initplan.sql",
    "- Doc de auditoria: docs/audits/2026-10-13-inicial/13-f1-07-rls-initplan.md",
    "- Script de documentacion: scripts/docs/10-documentar-f1-07.ps1",
    "- Lista de candidatas a F1-08 (consolidacion) documentada",
    "- Hallazgo colateral P7 marcado para F3-01 (auth.jwt ->> role)",
    "",
    "**Commits de la sesion:**",
    "- 02311b72 security(db): optimizar 79 politicas RLS con InitPlan",
    "- fd942db0 docs(tracking): actualizar hash de F1-07",
    "",
    "**Hallazgos cerrados:**",
    "- DB-001e: ~60 politicas RLS sin optimizar",
    "",
    "**Hallazgos nuevos:**",
    "- Ninguno",
    "",
    "**Bloqueantes:**",
    "- Ninguno",
    "",
    "**Aprendizajes:**",
    "- Postgres normaliza `(SELECT is_admin())` como `( SELECT is_admin() AS is_admin)`.",
    "- El verificador de links (00-verificar-links.ps1) da falsos positivos en bloques de codigo Markdown dentro de HANDOFF-*.md.",
    "- El SQL Editor de Supabase envuelve el RUN en transaccion implicita: si un DROP/CREATE falla, todo se revierte.",
    "- Aplicar el fix en 4 bloques chicos + verificacion por bloque es mas seguro que un solo SQL grande.",
    "",
    "**Proxima sesion:**",
    "- F1-08: Consolidar ~150 politicas duplicadas (P2, esfuerzo L)",
    "- F1-09: Eliminar indices duplicados (P3, esfuerzo S)",
    "- F3-01: SEC-003: admin por app_metadata (P0, esfuerzo S) - corregir tambien P7",
    "- chore(tooling): mejorar verificador de links para ignorar bloques de codigo",
    "",
    "---"
) -join "`n"

$bitacora = $bitacora + "`n" + $nuevaEntrada

Write-FileNoBom -Path $bitacoraPath -Content $bitacora

# ============================================================
# 3. Verificar links (informativo, no bloqueante por falsos positivos)
# ============================================================
Write-Host ""
Write-Host "--- Verificando links (informativo) ---" -ForegroundColor Yellow
Write-Host ""
Write-Host "NOTA: el verificador reporta 14 falsos positivos en HANDOFF-2026-10-13.md" -ForegroundColor DarkYellow
Write-Host "      (links dentro de bloques de codigo). No bloquean el cierre." -ForegroundColor DarkYellow
Write-Host ""

& powershell -ExecutionPolicy Bypass -File (Join-Path $RepoRoot "scripts\docs\00-verificar-links.ps1")
$verifyExit = $LASTEXITCODE

if ($verifyExit -ne 0) {
    Write-Host ""
    Write-Host "AVISO: verificador reporto links rotos (ver nota arriba sobre falsos positivos)." -ForegroundColor Yellow
    Write-Host "El cierre de sesion continua igual." -ForegroundColor Yellow
}

# ============================================================
# 4. Git status + commit
# ============================================================
Write-Host ""
Write-Host "Git status:" -ForegroundColor Yellow
git status --short

if ($NoCommit) {
    Write-Host ""
    Write-Host "=== -NoCommit activado ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para commitear manualmente:"
    Write-Host "  git add docs/STATUS.md"
    Write-Host "  git add docs/BITACORA.md"
    Write-Host "  git add scripts/docs/11-cerrar-sesion-2026-10-13-v4.ps1"
    Write-Host "  git commit -m `"docs(session): cerrar sesion 2026-10-13 v4`""
    Write-Host "  git push origin main"
    exit 0
}

Write-Host ""
$resp = Read-Host "Hacer commit y push? (s/N)"
if ($resp -ne "s" -and $resp -ne "S") {
    Write-Host "Commit cancelado." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== Commiteando ===" -ForegroundColor Cyan

git add docs/STATUS.md
git add docs/BITACORA.md
git add scripts/docs/11-cerrar-sesion-2026-10-13-v4.ps1

git commit -m "docs(session): cerrar sesion 2026-10-13 v4"
git push origin main

Write-Host ""
Write-Host "=== Listo ===" -ForegroundColor Green
git log --oneline -5