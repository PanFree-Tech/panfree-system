<#
.SYNOPSIS
    F4-08 - Configurar branch protection en main via gh api.
.DESCRIPTION
    Aplica proteccion a la rama main de PanFree-Tech/panfree-system:
    - Require PR before merging (0 aprobaciones: unico colaborador)
    - Require status checks: lint-and-test
    - Require branches to be up to date
    - Block force pushes
    - Block deletions
    - Admin NO incluido (bypass de emergencia documentado en R-03)

    Verifica antes y despues. Idempotente.
    Requiere gh CLI autenticado como PanFree-Tech con scope repo.
.NOTES
    Sesion: 25
    Fecha: 2026-10-17
    Tarea: F4-08
#>

[CmdletBinding()]
param(
    [switch]$NoCommit,
    [switch]$Apply
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repoRoot

function Write-Ok   { param($m) Write-Host "  [OK] $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "  [WARN] $m" -ForegroundColor Yellow }
function Write-Info { param($m) Write-Host "  [INFO] $m" -ForegroundColor Cyan }

$repo = 'PanFree-Tech/panfree-system'
$rama = 'main'

# ------------------------------------------------------------
# 0. Verificar gh (capturando stderr sin cortar)
# ------------------------------------------------------------
Write-Host "`n=== Verificando gh ===" -ForegroundColor Cyan
$oldEAP = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    $ghStatus = (& gh auth status) 2>&1 | Out-String
} finally {
    $ErrorActionPreference = $oldEAP
}

# NO mirar exit code: gh auth status sale con 1 si CUALQUIER cuenta
# (aunque no sea la activa) tiene token invalido. Mirar el contenido.
if ($ghStatus -match 'Logged in to github\.com account PanFree-Tech') {
    Write-Ok "gh autenticado como PanFree-Tech"
} else {
    Write-Warn "gh NO autenticado como PanFree-Tech"
    $ghStatus -split "`n" | ForEach-Object { Write-Host "  $_" }
    throw "gh no esta listo"
}

# ------------------------------------------------------------
# 1. Ver configuracion actual
# ------------------------------------------------------------
Write-Host "`n=== Branch protection actual de $rama ===" -ForegroundColor Cyan
$oldEAP = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    $actual = (& gh api "repos/$repo/branches/$rama/protection") 2>&1 | Out-String
} finally {
    $ErrorActionPreference = $oldEAP
}

if ($actual -match 'Not Found|Branch not protected|404') {
    Write-Info "Sin branch protection configurada."
} else {
    Write-Info "Configuracion actual:"
    $actual -split "`n" | ForEach-Object { Write-Host "  $_" }
}

# ------------------------------------------------------------
# 2. Mostrar configuracion propuesta
# ------------------------------------------------------------
Write-Host "`n=== Configuracion propuesta ===" -ForegroundColor Cyan

$payload = @'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["lint-and-test"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": false
}
'@

Write-Info "Payload:"
$payload -split "`n" | ForEach-Object { Write-Host "  $_" }

Write-Info ""
Write-Info "Explicacion:"
Write-Info "  - required_status_checks.contexts: ['lint-and-test'] -> CI debe pasar"
Write-Info "  - strict: true -> branch debe estar al dia antes de mergear"
Write-Info "  - enforce_admins: false -> admin puede pushear directo (emergencia, R-03)"
Write-Info "  - required_approving_review_count: 0 -> sin aprobacion (unico colaborador)"
Write-Info "  - allow_force_pushes: false -> bloquea force push"
Write-Info "  - allow_deletions: false -> bloquea borrar la rama"
Write-Info "  - required_pull_request_reviews: presente -> PR obligatorio"

# ------------------------------------------------------------
# 3. Aplicar (solo si -Apply)
# ------------------------------------------------------------
if (-not $Apply) {
    Write-Warn ""
    Write-Warn "Modo sin -Apply: NO se aplica el cambio."
    Write-Warn "Revisar y correr con -Apply:"
    Write-Warn "  powershell -ExecutionPolicy Bypass -File scripts\docs\91-f4-08-branch-protection.ps1 -Apply"
} else {
    Write-Host "`n=== Aplicando branch protection ===" -ForegroundColor Cyan
    $oldEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $applyOut = ($payload | & gh api -X PUT "repos/$repo/branches/$rama/protection" --input -) 2>&1 | Out-String
        $applyExit = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $oldEAP
    }
    $applyOut -split "`n" | ForEach-Object { Write-Host "  $_" }

    if ($applyExit -eq 0) {
        Write-Ok "Branch protection aplicada"
    } else {
        Write-Warn "Fallo al aplicar (exit=$applyExit)"
        throw "No se pudo aplicar"
    }

    # Verificar
    Write-Host "`n=== Verificacion ===" -ForegroundColor Cyan
    $oldEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $nuevo = (& gh api "repos/$repo/branches/$rama/protection") 2>&1 | Out-String
    } finally {
        $ErrorActionPreference = $oldEAP
    }
    if ($nuevo -match 'lint-and-test') {
        Write-Ok "Verificado: lint-and-test es required check"
    } else {
        Write-Warn "No se pudo verificar el required check"
    }
    if ($nuevo -match 'required_pull_request_reviews') {
        Write-Ok "Verificado: PR obligatorio"
    } else {
        Write-Warn "No se pudo verificar PR obligatorio"
    }
}

# ------------------------------------------------------------
# 4. Actualizar PLAN (F4-08 -> OK) y POLITICA-CI-CD.md
# ------------------------------------------------------------
if ($Apply) {
    Write-Host "`n=== PLAN-DE-TRABAJO.md ===" -ForegroundColor Cyan
    $planPath = 'docs\operations\PLAN-DE-TRABAJO.md'
    if (Test-Path $planPath) {
        $plan = Get-Content $planPath -Raw -Encoding UTF8
        $originalPlan = $plan
        $plan = $plan.Replace(
            '| F4-08 | Branch protection en main | P2 | S | Pendiente | PR obligatorio para merge |',
            '| F4-08 | Branch protection en main | P2 | S | OK | PR obligatorio + status check lint-and-test + force push/deletion bloqueados (S25) |'
        )
        if ($plan -eq $originalPlan) {
            Write-Warn "PLAN no cambio (string no matcheo o ya estaba OK)"
        } else {
            [System.IO.File]::WriteAllText(
                (Resolve-Path $planPath).Path,
                $plan,
                [System.Text.UTF8Encoding]::new($false)
            )
            Write-Ok "PLAN actualizado (F4-08 -> OK)"
        }
    }

    Write-Host "`n=== POLITICA-CI-CD.md ===" -ForegroundColor Cyan
    $polPath = 'docs\operations\POLITICA-CI-CD.md'
    if (Test-Path $polPath) {
        $pol = Get-Content $polPath -Raw -Encoding UTF8
        if ($pol -match 'Estado B activado|F4-08.*OK') {
            Write-Info "Ya documentado (idempotente)"
        } else {
            $lineas = @(
                '',
                '---',
                '',
                '## Nota S25: Estado B activado',
                '',
                'A partir de S25, la rama `main` tiene branch protection activa:',
                '',
                '- **PR obligatorio** antes de mergear (0 aprobaciones: unico colaborador).',
                '- **Required status check**: `lint-and-test` (el job del `ci.yml`).',
                '- **Branch up to date** antes de mergear.',
                '- **Force push** y **deletion** bloqueados.',
                '- **Admin NO incluido**: bypass de emergencia documentado en `GESTION-DE-RIESGOS.md` R-03.',
                '',
                '**Implicancia**: no se puede pushear directo a `main`. Cada cambio',
                'va por PR, el CI corre, y solo mergea si pasa.',
                '',
                '**Excepcion de emergencia**: `enforce_admins: false` permite al admin',
                'pushear directo si el CI esta roto por causas externas. Documentar el',
                'motivo en el commit y en la bitacora.'
            )
            $nota = $lineas -join "`r`n"
            Add-Content -Path $polPath -Value $nota -Encoding UTF8
            Write-Ok "Nota agregada a POLITICA-CI-CD.md"
        }
    }

    # Commit
    if (-not $NoCommit) {
        Write-Host "`n=== Commit ===" -ForegroundColor Cyan
        git add $planPath
        if (Test-Path $polPath) { git add $polPath }
        git commit -m "chore(repo): activar branch protection en main (F4-08)"
        if ($LASTEXITCODE -eq 0) { Write-Ok "Commit creado" } else { Write-Warn "Commit fallo" }
    }
}

Write-Host "`n[FIN] Script 91 completado." -ForegroundColor Green