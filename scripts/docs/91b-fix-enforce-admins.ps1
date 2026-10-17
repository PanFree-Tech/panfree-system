<#
.SYNOPSIS
    F4-08 fix - Corregir enforce_admins a true (mejor practica GitHub).
.DESCRIPTION
    El script 91 aplico enforce_admins: false, que permite al admin
    pushear directo a main sin pasar por CI. GitHub recomienda true
    para garantias reales. El DoD de F4-08 pide PR obligatorio sin
    excepciones de admin.

    Este script actualiza la branch protection de main con
    enforce_admins: true. El resto de la configuracion queda igual.

    Requiere gh CLI autenticado como PanFree-Tech con scope repo.
.NOTES
    Sesion: 25
    Fecha: 2026-10-17
    Tarea: F4-08 (correccion)
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

# Verificar gh
Write-Host "`n=== Verificando gh ===" -ForegroundColor Cyan
$oldEAP = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    $ghStatus = (& gh auth status) 2>&1 | Out-String
} finally {
    $ErrorActionPreference = $oldEAP
}

if ($ghStatus -match 'Logged in to github\.com account PanFree-Tech') {
    Write-Ok "gh autenticado como PanFree-Tech"
} else {
    Write-Warn "gh NO autenticado como PanFree-Tech"
    throw "gh no esta listo"
}

# Ver config actual
Write-Host "`n=== Config actual de $rama ===" -ForegroundColor Cyan
$oldEAP = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    $actual = (& gh api "repos/$repo/branches/$rama/protection") 2>&1 | Out-String
} finally {
    $ErrorActionPreference = $oldEAP
}
Write-Info $actual

# Payload: mismo que 91 pero enforce_admins: true
$payload = @'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["lint-and-test"]
  },
  "enforce_admins": true,
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

Write-Host "`n=== Payload propuesto (enforce_admins: true) ===" -ForegroundColor Cyan
$payload -split "`n" | ForEach-Object { Write-Host "  $_" }

if (-not $Apply) {
    Write-Warn ""
    Write-Warn "Modo sin -Apply. Correr con -Apply para aplicar."
} else {
    Write-Host "`n=== Aplicando ===" -ForegroundColor Cyan
    $oldEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $out = ($payload | & gh api -X PUT "repos/$repo/branches/$rama/protection" --input -) 2>&1 | Out-String
        $exit = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $oldEAP
    }
    $out -split "`n" | ForEach-Object { Write-Host "  $_" }

    if ($exit -eq 0) {
        Write-Ok "Branch protection actualizada (enforce_admins: true)"
    } else {
        Write-Warn "Fallo (exit=$exit)"
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
    if ($nuevo -match '"enforce_admins":\s*\{[^}]*"enabled":\s*true') {
        Write-Ok "Verificado: enforce_admins = true"
    } else {
        Write-Warn "No se pudo verificar enforce_admins = true"
        Write-Warn $nuevo
    }
}

# Actualizar PLAN (nota) y POLITICA-CI-CD.md
if ($Apply) {
    Write-Host "`n=== POLITICA-CI-CD.md ===" -ForegroundColor Cyan
    $polPath = 'docs\operations\POLITICA-CI-CD.md'
    if (Test-Path $polPath) {
        $pol = Get-Content $polPath -Raw -Encoding UTF8
        if ($pol -match 'enforce_admins: true|sin bypass de admin') {
            Write-Info "Ya documentado (idempotente)"
        } else {
            $lineas = @(
                '',
                '**Correccion S25 (mejor practica)**: `enforce_admins: true`.',
                'Ningun usuario, incluido el admin, puede pushear directo a `main`.',
                'Todo cambio va por PR. Si el CI falla, el PR no mergea.',
                'No hay bypass de emergencia. Si el CI esta roto por causas externas,',
                'se arregla el CI o se espera. Esto garantiza que `main` siempre',
                'tenga el CI en verde antes de recibir cambios.'
            )
            $nota = $lineas -join "`r`n"
            Add-Content -Path $polPath -Value $nota -Encoding UTF8
            Write-Ok "Nota de correccion agregada a POLITICA-CI-CD.md"
        }
    }

    if (-not $NoCommit) {
        Write-Host "`n=== Commit ===" -ForegroundColor Cyan
        git add $polPath
        git commit -m "chore(repo): corregir enforce_admins a true en branch protection (F4-08)"
        if ($LASTEXITCODE -eq 0) { Write-Ok "Commit creado" } else { Write-Warn "Commit fallo" }
    }
}

Write-Host "`n[FIN] Script 91b completado." -ForegroundColor Green