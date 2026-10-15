# PowerShell
# =============================================================================
# 23b2 - Actualizar tracking + STATUS + PLAN-DE-TRABAJO (F3-04 / AUTH-001)
# =============================================================================
# NO commitea. Eso lo hace 23b3.
# =============================================================================

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $repoRoot
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-OK($m)   { Write-Host ("  OK: $m") -ForegroundColor Green }
function Write-INFO($m) { Write-Host ("  INFO: $m") -ForegroundColor Yellow }
function Write-ERR($m)  { Write-Host ("  ERROR: $m") -ForegroundColor Red }
function Read-File($p)  { return [System.IO.File]::ReadAllText((Join-Path $repoRoot $p)) }
function Write-File($p, $c) { [System.IO.File]::WriteAllText((Join-Path $repoRoot $p), $c, $utf8NoBom) }

Write-Host ''
Write-Host ('=' * 70) -ForegroundColor Magenta
Write-Host '  23b2 - Actualizar tracking + STATUS + PLAN' -ForegroundColor Magenta
Write-Host ('=' * 70) -ForegroundColor Magenta

# -----------------------------------------------------------------------------
Write-Host ''
Write-Host '[1/3] Actualizando tracking (AUTH-001 -> Cerrado)...' -ForegroundColor Cyan

$trackingPath = 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$t = Read-File $trackingPath
$antes = $t

# AUTH-001 en la fila de hallazgos altos
$t = $t -replace '\| AUTH-001 \| Contrasenas debiles \| F3 \| P1 \| Abierto \| - \|',
                '| AUTH-001 | Contrasenas debiles | F3 | P1 | Cerrado | ccee0c88 |'

# Actualizar contador de "Abierto" 14 -> 13 (opcional, no critico)
$t = $t -replace '\| Abierto \| 14 \|', '| Abierto | 13 |'
$t = $t -replace '\| Cerrado \| 19 \|', '| Cerrado | 20 |'

if ($t -ne $antes) {
    Write-File $trackingPath $t
    Write-OK "tracking actualizado."
} else {
    Write-INFO "tracking sin cambios (idempotente o fila no matcheo)."
}

# -----------------------------------------------------------------------------
Write-Host ''
Write-Host '[2/3] Actualizando STATUS.md...' -ForegroundColor Cyan

$statusPath = 'docs\STATUS.md'
$s = Read-File $statusPath
$antes = $s

# 2.1 Ultima actualizacion
$s = $s -replace '\*\*Ultima actualizacion:\*\* 2026-10-14 \(fin Sesion 10\)',
                '**Ultima actualizacion:** 2026-10-14 (fin Sesion 11, parcial)'

# 2.2 Fila Fase 3: 2 OK / 22% -> 4 OK / 44%
$s = $s -replace '\| F3 - Codigo \| 9 \| 2 \| 0 \| 7 \| 22% \|',
                '| F3 - Codigo | 9 | 4 | 0 | 5 | 44% |'

# 2.3 Fila Total: 19 OK / 40% -> 21 OK / 45%
$s = $s -replace '\| \*\*Total\*\* \| \*\*47\*\* \| \*\*19\*\* \| \*\*0\*\* \| \*\*28\*\* \| \*\*40%\*\* \|',
                '| **Total** | **47** | **21** | **0** | **26** | **45%** |'

# 2.4 Progreso global
$s = $s -replace '\*\*Progreso global:\*\* 40% \(19 de 47 tareas\)',
                '**Progreso global:** 45% (21 de 47 tareas)'

# 2.5 Hallazgos cerrados: 23/34 -> 24/34
$s = $s -replace '\| Hallazgos cerrados \| 23 / 34 \| 34 / 34 \|',
                '| Hallazgos cerrados | 24 / 34 | 34 / 34 |'

# 2.6 Proximos 3 pasos
$nuevos3 = @(
    '## 3. Proximos 3 pasos',
    '',
    '1. **F3-05** - AUTH-002: registro sin validar duplicados (P1)',
    '2. **Configurar Supabase Auth** - Password strength en dashboard (parte de F3-04)',
    '3. **Cerrar Sesion 11** - Bitacora + STATUS final',
    ''
) -join "`r`n"

$patron3 = '(?s)## 3\. Proximos 3 pasos.*?(?=## 4\. Metricas clave)'
$s = [regex]::Replace($s, $patron3, $nuevos3 + "`r`n")

if ($s -ne $antes) {
    Write-File $statusPath $s
    Write-OK "STATUS.md actualizado."
} else {
    Write-INFO "STATUS.md sin cambios (idempotente)."
}

# -----------------------------------------------------------------------------
Write-Host ''
Write-Host '[3/3] Actualizando PLAN-DE-TRABAJO.md (F3-04 -> OK)...' -ForegroundColor Cyan

$planPath = 'docs\operations\PLAN-DE-TRABAJO.md'
$p = Read-File $planPath
$antes = $p

$p = $p -replace '\| F3-04 \| AUTH-001: contrasenas fuertes \| P1 \| S \| Pendiente \|',
                '| F3-04 | AUTH-001: contrasenas fuertes | P1 | S | OK |'

if ($p -ne $antes) {
    Write-File $planPath $p
    Write-OK "PLAN-DE-TRABAJO.md actualizado."
} else {
    Write-INFO "PLAN-DE-TRABAJO.md sin cambios (idempotente)."
}

# -----------------------------------------------------------------------------
Write-Host ''
Write-Host '=== git status --short ===' -ForegroundColor Cyan
git status --short

Write-Host ''
Write-Host '=== git diff --stat ===' -ForegroundColor Cyan
git diff --stat

Write-Host ''
Write-Host 'Siguiente: .\scripts\docs\23b3-commit.ps1' -ForegroundColor Yellow
Write-Host ''