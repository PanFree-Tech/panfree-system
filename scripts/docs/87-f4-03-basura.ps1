<#
.SYNOPSIS
    F4-03 - Eliminar archivos basura del repo.
.DESCRIPTION
    git rm de archivos trackeados que son basura:
    - test.txt
    - next.config.js.standalone.bak
    - test-supabase.js (si esta trackeado)
    Lista (no borra) los .bak en .backup-s*/ porque ya estan gitignored.
    Marca F4-03 como OK en PLAN.
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
# 1. Detectar archivos basura trackeados
# ============================================================
Write-Host "`n=== Deteccion ===" -ForegroundColor Cyan

$candidatos = @(
    'test.txt',
    'next.config.js.standalone.bak',
    'test-supabase.js'
)

$aBorrar = @()
foreach ($f in $candidatos) {
    $tracked = git ls-files -- $f
    if ($tracked) {
        Write-Warn "Trackeado (se va a borrar): $f"
        $aBorrar += $f
    } else {
        if (Test-Path $f) {
            Write-Info "Existe en disco pero no trackeado: $f (no se toca)"
        } else {
            Write-Ok "No existe: $f"
        }
    }
}

# ============================================================
# 2. Reportar .bak en .backup-s*/ (no se tocan)
# ============================================================
Write-Host "`n=== .bak en carpetas .backup-s*/ (gitignored, NO se tocan) ===" -ForegroundColor Cyan
$baksBackup = Get-ChildItem -Path . -Recurse -File -Filter '*.bak' -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match '\\\.backup-s\d+\\' -or $_.FullName -match '\\\.backup-s\d+' }
if ($baksBackup) {
    $baksBackup | ForEach-Object {
        Write-Info "  $($_.FullName.Substring($repoRoot.Path.Length+1))"
    }
    Write-Info "  ($($baksBackup.Count) archivos. Limpieza de disco opcional, no afecta al repo)"
} else {
    Write-Ok "No hay .bak en .backup-s*/"
}

# ============================================================
# 3. Borrar con git rm
# ============================================================
Write-Host "`n=== Borrado ===" -ForegroundColor Cyan
if ($aBorrar.Count -eq 0) {
    Write-Info "No hay archivos basura trackeados que borrar."
} else {
    foreach ($f in $aBorrar) {
        if ($NoCommit) {
            Write-Info "  [DRY-RUN] git rm --cached $f"
        } else {
            git rm -- $f
            if ($LASTEXITCODE -eq 0) {
                Write-Ok "Borrado: $f"
            } else {
                Write-Warn "Fallo git rm: $f"
            }
        }
    }
}

# ============================================================
# 4. Actualizar PLAN (F4-03 -> OK)
# ============================================================
Write-Host "`n=== PLAN-DE-TRABAJO.md ===" -ForegroundColor Cyan
$planPath = 'docs\operations\PLAN-DE-TRABAJO.md'
if (Test-Path $planPath) {
    $plan = Get-Content $planPath -Raw -Encoding UTF8
    $originalPlan = $plan
    $plan = $plan.Replace(
        '| F4-03 | Eliminar archivos basura | P1 | S | Pendiente | test.txt, .bak eliminados |',
        '| F4-03 | Eliminar archivos basura | P1 | S | OK | test.txt, next.config.js.standalone.bak, test-supabase.js eliminados (S25) |'
    )
    if ($plan -eq $originalPlan) {
        Write-Warn "PLAN no cambio (string no matcheo o ya estaba OK)"
    } else {
        [System.IO.File]::WriteAllText(
            (Resolve-Path $planPath).Path,
            $plan,
            [System.Text.UTF8Encoding]::new($false)
        )
        Write-Ok "PLAN actualizado (F4-03 -> OK)"
    }
} else {
    Write-Warn "No existe $planPath"
}

# ============================================================
# 5. Verificacion
# ============================================================
Write-Host "`n=== Verificacion ===" -ForegroundColor Cyan

foreach ($f in $candidatos) {
    $tracked = git ls-files -- $f
    if ($tracked) {
        Write-Warn "AUN trackeado: $f"
    } else {
        if (Test-Path $f) {
            Write-Info "No trackeado pero existe en disco: $f"
        } else {
            Write-Ok "Eliminado: $f"
        }
    }
}

# ============================================================
# 6. Diff y commit
# ============================================================
Write-Host "`n=== Git status ===" -ForegroundColor Cyan
git status --short

Write-Host "`n=== Git diff --stat ===" -ForegroundColor Cyan
git diff --stat

if ($NoCommit) {
    Write-Info "`nModo -NoCommit: no se commitea. Revisar diff y correr sin -NoCommit."
} else {
    Write-Host "`n=== Commit ===" -ForegroundColor Cyan
    # El script 87 ya hizo git rm (que stagea automaticamente).
    # Solo falta agregar el PLAN modificado.
    git add docs/operations/PLAN-DE-TRABAJO.md
    $msg = "chore(repo): eliminar archivos basura test.txt, .standalone.bak, test-supabase.js (F4-03)"
    git commit -m $msg
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Commit creado."
    } else {
        Write-Warn "Fallo el commit. Revisar manualmente."
    }
}

Write-Host "`n[FIN] Script 87 completado." -ForegroundColor Green