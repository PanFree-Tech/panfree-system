<#
.SYNOPSIS
    F4-06 - Configurar env en ci.yml para el build (placeholders).
.DESCRIPTION
    Agrega env: con placeholders NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
    al step de Build en .github/workflows/ci.yml.
    NEXT_PUBLIC_* no son secretos, van al bundle del browser.
    Si el build falla en CI por SSG, se pasa a GitHub Secrets (opcion B).
    Corrige el estado de F4-06 en PLAN (estaba mal marcada "No aplica").
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

$ciPath = '.github\workflows\ci.yml'
if (-not (Test-Path $ciPath)) { throw "No existe $ciPath" }

# Detectar line ending
$bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $ciPath).Path)
$textoBytes = [System.Text.Encoding]::UTF8.GetString($bytes)
$cuentaCRLF = ([regex]::Matches($textoBytes, "`r`n")).Count
$cuentaLF   = ([regex]::Matches($textoBytes, "`n")).Count
$esCRLF = $cuentaCRLF -gt 0 -and $cuentaCRLF -eq $cuentaLF
$nl = if ($esCRLF) { "`r`n" } else { "`n" }
Write-Info "Line ending: $(if ($esCRLF) { 'CRLF' } else { 'LF' })"

$contenido = Get-Content $ciPath -Raw -Encoding UTF8
$original = $contenido

# ------------------------------------------------------------
# 1. Reemplazar el step de Build para agregar env
# ------------------------------------------------------------
$stepViejo = @'
      - name: Build
        run: npm run build
'@

$stepNuevo = @'
      - name: Build
        env:
          NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: sb_publishable_placeholder_for_ci
        run: npm run build
'@

# Normalizar line endings de los strings para comparar
$stepViejoNorm = $stepViejo -replace "`r`n", "`n"
$stepNuevoNorm = $stepNuevo -replace "`r`n", "`n"
$contenidoNorm = $contenido -replace "`r`n", "`n"

if ($contenidoNorm.Contains($stepNuevoNorm)) {
    Write-Info "El step de Build ya tiene env: (idempotente)"
} elseif ($contenidoNorm.Contains($stepViejoNorm)) {
    $contenidoNorm = $contenidoNorm.Replace($stepViejoNorm, $stepNuevoNorm)
    # Volver a line ending original
    if ($esCRLF) {
        $contenido = $contenidoNorm -replace "`n", "`r`n"
    } else {
        $contenido = $contenidoNorm
    }
    Write-Ok "Step de Build modificado (env agregado)"
} else {
    Write-Warn "No matcheo el step de Build. Revisar $ciPath manualmente."
    throw "No se pudo aplicar el cambio. Abortando sin tocar nada."
}

# ------------------------------------------------------------
# 2. Guardar si cambio
# ------------------------------------------------------------
if ($contenido -ne $original) {
    [System.IO.File]::WriteAllText(
        (Resolve-Path $ciPath).Path,
        $contenido,
        [System.Text.UTF8Encoding]::new($false)
    )
    Write-Ok "ci.yml actualizado"
} else {
    Write-Info "Sin cambios en ci.yml"
}

# ------------------------------------------------------------
# 3. Mostrar diff del ci.yml
# ------------------------------------------------------------
Write-Host "`n=== Diff ci.yml ===" -ForegroundColor Cyan
$diffCi = git diff -- $ciPath
if ([string]::IsNullOrWhiteSpace($diffCi)) {
    Write-Info "Sin cambios en ci.yml"
} else {
    Write-Info "Diff:`n$diffCi"
}

# ------------------------------------------------------------
# 4. Corregir PLAN (F4-06 -> OK)
# ------------------------------------------------------------
Write-Host "`n=== PLAN-DE-TRABAJO.md ===" -ForegroundColor Cyan
$planPath = 'docs\operations\PLAN-DE-TRABAJO.md'
if (Test-Path $planPath) {
    $plan = Get-Content $planPath -Raw -Encoding UTF8
    $originalPlan = $plan
    # Reemplazar la version "No aplica" que quedo mal
    $plan = $plan.Replace(
        '| F4-06 | Configurar GitHub Secrets | P1 | S | No aplica | Workflows solo usan GITHUB_TOKEN (auto-provisionado). Sin secrets extra requeridos |',
        '| F4-06 | Configurar GitHub Secrets | P1 | S | OK | Placeholders NEXT_PUBLIC_* en ci.yml (no son secretos). Ver commit S25 |'
    )
    # Tambien el texto original "Pendiente" por si acaso
    $plan = $plan.Replace(
        '| F4-06 | Configurar GitHub Secrets | P1 | S | Pendiente | CI corre build sin placeholders |',
        '| F4-06 | Configurar GitHub Secrets | P1 | S | OK | Placeholders NEXT_PUBLIC_* en ci.yml (no son secretos). Ver commit S25 |'
    )
    if ($plan -eq $originalPlan) {
        Write-Warn "PLAN no cambio (strings no matchearon)"
    } else {
        [System.IO.File]::WriteAllText(
            (Resolve-Path $planPath).Path,
            $plan,
            [System.Text.UTF8Encoding]::new($false)
        )
        Write-Ok "PLAN actualizado (F4-06 -> OK)"
    }
} else {
    Write-Warn "No existe $planPath"
}

# ------------------------------------------------------------
# 5. Diff total y commit
# ------------------------------------------------------------
Write-Host "`n=== Git diff --stat ===" -ForegroundColor Cyan
git diff --stat

if ($NoCommit) {
    Write-Info "`nModo -NoCommit: no se commitea."
} else {
    Write-Host "`n=== Commit ===" -ForegroundColor Cyan
    git add $ciPath
    git add $planPath
    git commit -m "chore(ci): placeholders NEXT_PUBLIC_* en Build de ci.yml (F4-06)"
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Commit creado."
    } else {
        Write-Warn "Commit fallo."
    }
}

Write-Host "`n[FIN] Script 88 completado." -ForegroundColor Green