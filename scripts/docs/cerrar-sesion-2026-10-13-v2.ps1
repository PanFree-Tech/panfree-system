# cerrar-sesion-2026-10-13-v2.ps1
# Cierre de sesion: actualiza STATUS.md y BITACORA.md con el estado real.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\cerrar-sesion-2026-10-13-v2.ps1 -NoCommit
#   powershell -ExecutionPolicy Bypass -File scripts\docs\cerrar-sesion-2026-10-13-v2.ps1

param(
    [switch]$NoCommit
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $RepoRoot

Write-Host "=== Cerrando sesion 2026-10-13 ===" -ForegroundColor Cyan
Write-Host ""

function Write-FileNoBom {
    param(
        [string]$Path,
        [string]$Content
    )
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText((Join-Path (Get-Location) $Path), $Content, $utf8NoBom)
    Write-Host "[OK] $Path" -ForegroundColor Green
}

# ============================================================
# 1. STATUS.md actualizado
# ============================================================
$status = @(
    '# Estado del Proyecto - PanFree System',
    '',
    '**Ultima actualizacion:** 2026-10-13 (fin de sesion 2)',
    '**Fase actual:** Fase 1 (EN CURSO)',
    '**Progreso global:** 26% (12 de 47 tareas)',
    '',
    '---',
    '',
    '## 1. Resumen por fase',
    '',
    '| Fase | Tareas | OK | En curso | Pendiente | % |',
    '|---|---|---|---|---|---|',
    '| F0 - Preparacion | 7 | 7 | 0 | 0 | 100% |',
    '| F1 - Seguridad DB | 9 | 5 | 0 | 4 | 56% |',
    '| F2 - Rotacion claves | 14 | 0 | 0 | 14 | 0% |',
    '| F3 - Codigo | 9 | 0 | 0 | 9 | 0% |',
    '| F4 - Limpieza | 8 | 0 | 0 | 8 | 0% |',
    '| **Total** | **47** | **12** | **0** | **35** | **26%** |',
    '',
    '---',
    '',
    '## 2. Bloqueantes actuales',
    '',
    '**Ninguno.**',
    '',
    '---',
    '',
    '## 3. Proximos 3 pasos',
    '',
    '1. **F1-06** - Habilitar Leaked Password Protection en Supabase Auth (P1)',
    '2. **F1-07** - Optimizar ~60 politicas RLS (InitPlan) (P2, esfuerzo L)',
    '3. **F1-08** - Consolidar ~150 politicas duplicadas (P2, esfuerzo L)',
    '',
    '---',
    '',
    '## 4. Metricas clave',
    '',
    '| Metrica | Hoy | Meta |',
    '|---|---|---|',
    '| Advisors Supabase severidad 1-2 | 7 | 0 |',
    '| Advisors Supabase severidad 3 | 250+ | menos de 50 |',
    '| Claves productivas rotadas | 0 / 12 | 12 / 12 |',
    '| Claves en Bitwarden | 0 / 12 | 12 / 12 |',
    '| Hallazgos cerrados | 5 / 22 | 22 / 22 |',
    '| Documentos .md en docs/ | 30+ | 30+ (OK) |',
    '| Commits de remediacion | 8 | ~40 |',
    '',
    '---',
    '',
    '## 5. Ultima actividad',
    '',
    '**2026-10-13 - Sesion 2 (COMPLETA)**',
    '- 8 commits de remediacion pusheados',
    '- 5 tareas de Fase 1 cerradas (F1-01 a F1-05)',
    '- 5 hallazgos cerrados (DB-001a/b/c/d/g)',
    '- Estructura supabase/schemas/ creada (declarativa)',
    '- Estructura docs/ reorganizada (sin numeros)',
    '- 3 ADRs creados (Supabase, seguridad, Next.js)',
    '- Backup estructural en Bitwarden + local',
    '',
    '---',
    '',
    '## 6. Comandos utiles',
    '',
    '    REM Ver estado actual',
    '    type docs\STATUS.md',
    '',
    '    REM Ver bitacora completa',
    '    type docs\BITACORA.md',
    '',
    '    REM Ver hallazgos abiertos',
    '    type docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md',
    '',
    '    REM Verificar links de toda la documentacion',
    '    powershell -ExecutionPolicy Bypass -File scripts\docs\00-verificar-links.ps1',
    '',
    '---',
    '',
    '## 7. Documentos relacionados',
    '',
    '- [Plan de Trabajo](./operations/PLAN-DE-TRABAJO.md)',
    '- [Bitacora](./BITACORA.md)',
    '- [Sistema de Trabajo](./operations/SISTEMA-DE-TRABAJO.md)',
    '- [Workflow Diario](./operations/WORKFLOW-DIARIO.md)',
    '- [Guia Rapida](./operations/GUIA-RAPIDA.md)',
    '- [Tracking de hallazgos](./audits/2026-10-13-inicial/06-hallazgos-tracking.md)'
)
Write-FileNoBom -Path "docs/STATUS.md" -Content ($status -join "`n")

# ============================================================
# 2. BITACORA.md - agregar entrada de sesion 2
# ============================================================
$bitacora = @(
    '',
    '---',
    '',
    '## 2026-10-13 (Sesion 2 - CIERRE)',
    '',
    '**Duracion:** ~6 horas',
    '**Objetivo:** Cerrar los 3 hallazgos P0 criticos de seguridad de la DB',
    '',
    '**Completado:**',
    '- F1-01: Fix 3 vistas SECURITY DEFINER -> SECURITY INVOKER',
    '- F1-02: Fix 4 politicas RLS Always True (canjes_premios, pedidos, detalle_pedido)',
    '- F1-03: Restringir 4 funciones SECURITY DEFINER (REVOKE EXECUTE)',
    '- F1-04: Fijar search_path en 3 funciones',
    '- F1-05: Restringir listado del bucket storage.productos',
    '- Reorganizacion de docs/ (sin numeros, sin anidamiento excesivo)',
    '- Creacion de 3 ADRs (arquitectura) en docs/architecture/decisiones/',
    '- Creacion de estructura supabase/schemas/ declarativa',
    '- Guardado de schema + politicas en Bitwarden (backup estructural)',
    '- Instalacion de Docker Desktop + Supabase CLI (para futuro)',
    '- Verificador de links (00-verificar-links.ps1)',
    '',
    '**Commits de la sesion:**',
    '- 885486d3 chore(scripts): agregar verificador de links y corregir STATUS',
    '- 7d46e572 docs(structure): renombrar carpetas a estructura sin numeros',
    '- 8c5b311a security(db): fix SECURITY DEFINER en 3 vistas de costos',
    '- e2bdd7cf docs(db): agregar schema declarativo de tablas criticas (F1-02)',
    '- fea87bb2 security(db): fix 4 politicas RLS Always True',
    '- 542e3a2e security(db): restringir 4 funciones SECURITY DEFINER',
    '- 3e500e77 security(db): fijar search_path en 3 funciones',
    '- 326d4edd security(storage): restringir listado del bucket productos',
    '',
    '**Hallazgos cerrados:**',
    '- DB-001a: Vistas SECURITY DEFINER',
    '- DB-001b: Politicas RLS Always True',
    '- DB-001c: Funciones SECURITY DEFINER publicas',
    '- DB-001d: Bucket Storage listable',
    '- DB-001g: Funciones con search_path mutable',
    '',
    '**Hallazgos nuevos:**',
    '- Ninguno',
    '',
    '**Bloqueantes:**',
    '- Ninguno',
    '',
    '**Aprendizajes:**',
    '- Docker Desktop + Supabase CLI no cooperan con conexiones IPv6. Usar Session Pooler.',
    '- Los here-strings de PowerShell se cortan con bloques Markdown grandes. Usar arrays.',
    '- El verificador de links es fundamental cuando se reestructura docs/.',
    '',
    '**Proxima sesion:**',
    '- F1-06: Habilitar Leaked Password Protection en Supabase Auth (P1, 15 min)',
    '- F1-07: Optimizar ~60 politicas RLS con InitPlan (P2, esfuerzo L)',
    '- F1-08: Consolidar ~150 politicas duplicadas (P2, esfuerzo L)',
    '- Commit pendiente del .gitignore (backups bloqueados)',
    '',
    '---'
)
$bitacoraPath = "docs/BITACORA.md"
$bitacoraContent = Get-Content $bitacoraPath -Raw -Encoding UTF8
$bitacoraContent = $bitacoraContent + ($bitacora -join "`n")
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $bitacoraPath), $bitacoraContent, $utf8NoBom)
Write-Host "[OK] docs/BITACORA.md actualizado" -ForegroundColor Green

# ============================================================
# 3. Verificar links
# ============================================================
Write-Host ""
Write-Host "--- Verificando links ---" -ForegroundColor Yellow
Write-Host ""

& powershell -ExecutionPolicy Bypass -File (Join-Path $RepoRoot "scripts\docs\00-verificar-links.ps1")
$verifyExit = $LASTEXITCODE

if ($verifyExit -ne 0) {
    Write-Host "ADVERTENCIA: links rotos." -ForegroundColor Red
    exit 1
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
    Write-Host "  git add scripts/docs/cerrar-sesion-2026-10-13-v2.ps1"
    Write-Host "  git commit -m `"docs(session): cerrar sesion 2026-10-13 v2 con estado real`""
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
git add scripts/docs/cerrar-sesion-2026-10-13-v2.ps1

git commit -m "docs(session): cerrar sesion 2026-10-13 v2 con estado real"
git push origin main

Write-Host ""
Write-Host "=== Sesion cerrada ===" -ForegroundColor Green
git log --oneline -5