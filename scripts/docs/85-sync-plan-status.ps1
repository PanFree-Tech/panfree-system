<#
.SYNOPSIS
    Sincroniza PLAN-DE-TRABAJO y STATUS con el estado real de S24 + hallazgos del recon S25.
.DESCRIPTION
    - F4-01 -> OK (hecho en S24)
    - F4-02 -> En curso (espera soporte GitHub #4869059)
    - F4-05 -> OK (hecho en S17, commit f9b1f7ba)
    - F4-06 -> No aplica (solo GITHUB_TOKEN, auto-provisionado)
    - F4-07 -> OK (workflows ya sin continue-on-error)
    - STATUS: F4 4/8, progreso recalculado, proximos pasos actualizados
.NOTES
    Sesion: 25
    Fecha: 2026-10-17
#>

[CmdletBinding()]
param(
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repoRoot

function Write-Ok   { param($m) Write-Host "  [OK] $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "  [WARN] $m" -ForegroundColor Yellow }
function Write-Info { param($m) Write-Host "  [INFO] $m" -ForegroundColor Cyan }

# ============================================================
# 1. PLAN-DE-TRABAJO.md
# ============================================================
Write-Host "`n=== PLAN-DE-TRABAJO.md ===" -ForegroundColor Cyan
$planPath = 'docs\operations\PLAN-DE-TRABAJO.md'
if (-not (Test-Path $planPath)) { throw "No existe $planPath" }

$plan = Get-Content $planPath -Raw -Encoding UTF8
$originalPlan = $plan

# F4-01: Pendiente -> OK
$plan = $plan.Replace(
    '| F4-01 | Purgar historial de Git | P0 | M | Pendiente | git filter-repo ejecutado |',
    '| F4-01 | Purgar historial de Git | P0 | M | OK | git filter-repo ejecutado en S24 (commit 7526022c) |'
)

# F4-02: Pendiente -> En curso
$plan = $plan.Replace(
    '| F4-02 | Ticket a GitHub Support | P0 | S | Pendiente | SHAs huerfanos eliminados |',
    '| F4-02 | Ticket a GitHub Support | P0 | S | En curso | Ticket #4869059 enviado S24. Espera respuesta de soporte (2-5 dias habiles) |'
)

# F4-05: Pendiente -> OK
$plan = $plan.Replace(
    '| F4-05 | package-lock.json en repo | P1 | S | Pendiente | npm ci funciona |',
    '| F4-05 | package-lock.json en repo | P1 | S | OK | Trackeado desde S17 (commit f9b1f7ba). npm ci verificado en S25 |'
)

# F4-06: Pendiente -> No aplica
$plan = $plan.Replace(
    '| F4-06 | Configurar GitHub Secrets | P1 | S | Pendiente | CI corre build sin placeholders |',
    '| F4-06 | Configurar GitHub Secrets | P1 | S | No aplica | Workflows solo usan GITHUB_TOKEN (auto-provisionado). Sin secrets extra requeridos |'
)

# F4-07: Pendiente -> OK
$plan = $plan.Replace(
    '| F4-07 | CI estricto (sin continue-on-error) | P2 | S | Pendiente | PRs fallan si tests fallan |',
    '| F4-07 | CI estricto (sin continue-on-error) | P2 | S | OK | Workflows ya sin continue-on-error (verificado S25) |'
)

if ($plan -eq $originalPlan) {
    Write-Warn "PLAN no cambio (ya estaba sincronizado o los strings no matchearon)"
} else {
    Set-Content -Path $planPath -Value $plan -Encoding UTF8 -NoNewline
    Write-Ok "PLAN-DE-TRABAJO.md actualizado"
}

# ============================================================
# 2. STATUS.md
# ============================================================
Write-Host "`n=== STATUS.md ===" -ForegroundColor Cyan
$statusPath = 'docs\STATUS.md'
if (-not (Test-Path $statusPath)) { throw "No existe $statusPath" }

$status = Get-Content $statusPath -Raw -Encoding UTF8
$originalStatus = $status

# Tabla de fases: F4 0/8 -> 4/8, Total 38 -> 42
$status = $status.Replace(
    '| F4 - Limpieza | 8 | 0 | 0 | 8 | 0% |',
    '| F4 - Limpieza | 8 | 4 | 1 | 3 | 50% |'
)
$status = $status.Replace(
    '| **Total** | **47** | **38** | **0** | **9** | **81%** |',
    '| **Total** | **47** | **42** | **1** | **4** | **89%** |'
)

# Header de progreso
$status = $status.Replace(
    '**Progreso global:** 81% (38 de 47 tareas)',
    '**Progreso global:** 89% (42 de 47 tareas)'
)
$status = $status.Replace(
    '**Ultima actualizacion:** 2026-10-17 (fin Sesion 24)',
    '**Ultima actualizacion:** 2026-10-17 (en curso Sesion 25)'
)

# Proximos 3 pasos
$status = $status.Replace(
    @'
1. **F2-03** - Cloudinary Root User (reconsultar ticket #392411 desde 2026-10-18)
2. **F4-01** - Purgar historial de Git (SEC-001)
3. **F4-05** - Confirmar package-lock.json en repo
'@,
    @'
1. **F2-03** - Cloudinary Root User (reconsultar ticket #392411 desde 2026-10-18)
2. **F4-03** - Eliminar archivos basura (test.txt, .bak trackeados)
3. **F4-04** - Actualizar .gitignore (.env.production* explicito)
'@
)

# Agregar S25 al final de "Ultima actividad" (antes de "## 6. Comandos utiles")
$nuevaActividad = @'

**2026-10-17 - Sesion 25 (ENV) - EN CURSO**
- Recon S25: HEAD 4845a99e, tree limpio salvo script 84.
- F4-01 verificado: 0 .env en historial, .env.example intacto.
- F4-05 formalizado: package-lock.json trackeado desde S17 (f9b1f7ba).
- F4-06 reformulado a "No aplica": workflows solo usan GITHUB_TOKEN.
- F4-07 formalizado: ci.yml y security-scan.yml sin continue-on-error.
- F4-02: ticket #4869059 sigue esperando respuesta de soporte.
- Progreso: 81% -> 89% (42/47). F4: 0/8 -> 4/8 (+ 1 en curso).

'@
$status = $status.Replace(
    "## 6. Comandos utiles",
    $nuevaActividad + "## 6. Comandos utiles"
)

if ($status -eq $originalStatus) {
    Write-Warn "STATUS no cambio (ya estaba sincronizado o los strings no matchearon)"
} else {
    Set-Content -Path $statusPath -Value $status -Encoding UTF8 -NoNewline
    Write-Ok "STATUS.md actualizado"
}

# ============================================================
# 3. Verificacion
# ============================================================
Write-Host "`n=== Verificacion ===" -ForegroundColor Cyan

$planCheck = Get-Content $planPath -Raw -Encoding UTF8
if ($planCheck -match 'F4-01 \| Purgar historial de Git \| P0 \| M \| OK') { Write-Ok "PLAN: F4-01 = OK" } else { Write-Warn "PLAN: F4-01 no quedo OK" }
if ($planCheck -match 'F4-05 \| package-lock.json en repo \| P1 \| S \| OK') { Write-Ok "PLAN: F4-05 = OK" } else { Write-Warn "PLAN: F4-05 no quedo OK" }
if ($planCheck -match 'F4-07 \| CI estricto \(sin continue-on-error\) \| P2 \| S \| OK') { Write-Ok "PLAN: F4-07 = OK" } else { Write-Warn "PLAN: F4-07 no quedo OK" }

$statusCheck = Get-Content $statusPath -Raw -Encoding UTF8
if ($statusCheck -match '89% \(42 de 47 tareas\)') { Write-Ok "STATUS: progreso 89%" } else { Write-Warn "STATUS: progreso no actualizado" }
if ($statusCheck -match 'F4 - Limpieza \| 8 \| 4 \| 1 \| 3 \| 50%') { Write-Ok "STATUS: F4 4/8 + 1 en curso" } else { Write-Warn "STATUS: F4 no actualizada" }

# ============================================================
# 4. Commit (opcional)
# ============================================================
Write-Host "`n=== Git ===" -ForegroundColor Cyan
$diff = git diff --stat
Write-Info "Diff:`n$diff"

if ($NoCommit) {
    Write-Info "Modo -NoCommit: no se commitea. Revisar diff y correr sin -NoCommit."
} else {
    git add $planPath $statusPath
    git commit -m "docs(sync): formalizar F4-01, F4-05, F4-06, F4-07 tras recon S25"
    Write-Ok "Commit creado. Revisar con: git log -1 --oneline"
}

Write-Host "`n[FIN] Script 85 completado." -ForegroundColor Green