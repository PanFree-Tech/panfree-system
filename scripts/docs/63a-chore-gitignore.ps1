# ============================================================================
# 63a-chore-gitignore.ps1
# ----------------------------------------------------------------------------
# Chore de cierre S19:
#   1. Agrega reglas al .gitignore para reportes de auditoria temporales.
#   2. git rm --cached de los .txt versionados por error en el commit de F2-11.
#
# Idempotente. NO commitea. Solo aplica cambios al working tree.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/docs/63a-chore-gitignore.ps1
# ============================================================================

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$envPath  = Join-Path $repoRoot '.gitignore'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 63a - Chore .gitignore + .txt temporales' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

Set-Location $repoRoot

# ---------------------------------------------------------------------------
# 1. Actualizar .gitignore
# ---------------------------------------------------------------------------

Write-Host '[1/3] Actualizando .gitignore...' -ForegroundColor Green

if (-not (Test-Path -LiteralPath $envPath)) {
    Write-Host "  [ERROR] No existe: $envPath" -ForegroundColor Red
    exit 1
}

$gi = [System.IO.File]::ReadAllText($envPath)

$marca = '*-audit-*.txt'

if ($gi.Contains($marca)) {
    Write-Host '  [SKIP] .gitignore ya tiene las reglas' -ForegroundColor Yellow
} else {
    # Asegurar newline al final
    if (-not $gi.EndsWith("`n")) {
        $gi = $gi + "`r`n"
    }

    $bloque = @'

# Reportes de auditoria temporales - nunca commitear
*-audit-*.txt
*-endpoints-*.txt
'@

    $gi = $gi + $bloque
    [System.IO.File]::WriteAllText($envPath, $gi, (New-Object System.Text.UTF8Encoding $false))
    Write-Host '  [OK] Reglas agregadas al .gitignore' -ForegroundColor Green
}

# Verificar
$giChk = [System.IO.File]::ReadAllText($envPath)
if ($giChk.Contains('*-audit-*.txt') -and $giChk.Contains('*-endpoints-*.txt')) {
    Write-Host '  [VERIFY OK] Reglas presentes' -ForegroundColor Green
} else {
    Write-Host '  [VERIFY FAIL] Reglas no aplicadas' -ForegroundColor Red
    exit 1
}

# ---------------------------------------------------------------------------
# 2. git rm --cached de los .txt versionados
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '[2/3] Removiendo .txt del tracking de git...' -ForegroundColor Green

$txts = @(
    'docs/audits/2026-10-13-inicial/36-audit-ga4.txt',
    'docs/audits/2026-10-13-inicial/37-endpoints-ga4.txt'
)

foreach ($txt in $txts) {
    # Verificar si esta trackeado
    $tracked = git ls-files $txt
    if ($tracked) {
        Write-Host "  Removiendo del indice: $txt" -ForegroundColor Cyan
        git rm --cached $txt | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    [OK] Removido de git (sigue en disco)" -ForegroundColor Green
        } else {
            Write-Host "    [WARN] No se pudo remover" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [SKIP] No trackeado: $txt" -ForegroundColor Yellow
    }
}

# ---------------------------------------------------------------------------
# 3. Verificacion final
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '[3/3] Verificando estado del repo...' -ForegroundColor Green
Write-Host ''

Write-Host '--- git status ---' -ForegroundColor Cyan
git status --short

Write-Host ''
Write-Host '--- Archivos .txt de auditoria todavia trackeados ---' -ForegroundColor Cyan
$restantes = git ls-files 'docs/audits/2026-10-13-inicial/*.txt'
if ($restantes) {
    Write-Host "  [WARN] Aun trackeados:" -ForegroundColor Yellow
    $restantes | ForEach-Object { Write-Host "    $_" -ForegroundColor White }
} else {
    Write-Host '  [OK] Ningun .txt de auditoria trackeado' -ForegroundColor Green
}

Write-Host ''
Write-Host '--- Archivos .txt en disco (deberian seguir existiendo) ---' -ForegroundColor Cyan
foreach ($txt in $txts) {
    if (Test-Path -LiteralPath $txt) {
        Write-Host "  [OK] En disco: $txt" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] No existe en disco: $txt" -ForegroundColor Yellow
    }
}

# ---------------------------------------------------------------------------
# Resumen
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 63a COMPLETADO' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Siguiente paso:' -ForegroundColor Yellow
Write-Host '  1. Ejecutar 63b (documentar cierre S19).' -ForegroundColor White
Write-Host '  2. Commit de este chore: git add .gitignore && git commit -m "..."' -ForegroundColor White
Write-Host '  3. Commit de docs de cierre.' -ForegroundColor White
Write-Host ''