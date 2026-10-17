<#
.SYNOPSIS
    Fix CI - agregar script "test" no-op al package.json.
.DESCRIPTION
    El ci.yml corre "npm test -- --passWithNoTests" pero el package.json
    no tiene script "test". npm falla con "Missing script: test" antes
    de llegar a --passWithNoTests (que es flag de Jest, no de npm).
    Agrega un script "test" no-op (echo) hasta que TST-001 se resuelva
    con tests reales (Jest/Vitest).
    Documenta la decision en POLITICA-CI-CD.md.
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

# ------------------------------------------------------------
# 1. Modificar package.json
# ------------------------------------------------------------
Write-Host "`n=== package.json ===" -ForegroundColor Cyan
$pkgPath = 'package.json'
if (-not (Test-Path $pkgPath)) { throw "No existe $pkgPath" }

$pkg = Get-Content $pkgPath -Raw -Encoding UTF8

if ($pkg -match '"test"\s*:') {
    Write-Info "Script 'test' ya existe. Sin cambios."
} else {
    # Insertar "test" despues de "lint" (mantiene orden alfabetico-ish)
    $patronLint = '"lint": "next lint",'
    $testLine = '"test": "echo \"No tests configured yet (TST-001)\" && exit 0",'
    if ($pkg.Contains($patronLint)) {
        $pkg = $pkg.Replace(
            $patronLint,
            $patronLint + "`r`n    " + $testLine
        )
        [System.IO.File]::WriteAllText(
            (Resolve-Path $pkgPath).Path,
            $pkg,
            [System.Text.UTF8Encoding]::new($false)
        )
        Write-Ok "Script 'test' agregado a package.json"
    } else {
        Write-Warn "No matcheo el patron 'lint'. Revisar $pkgPath manualmente."
        throw "No se pudo aplicar"
    }
}

# ------------------------------------------------------------
# 2. Verificar
# ------------------------------------------------------------
Write-Host "`n=== Verificacion ===" -ForegroundColor Cyan
$pkgFinal = Get-Content $pkgPath -Raw -Encoding UTF8
if ($pkgFinal -match '"test"\s*:\s*"echo') {
    Write-Ok "Script 'test' presente en package.json"
} else {
    Write-Warn "Script 'test' NO esta en package.json"
}

# Verificar que npm test no falla
Write-Host "`nEjecutando 'npm test' para verificar..." -ForegroundColor Cyan
$result = npm test 2>&1
$exitCode = $LASTEXITCODE
if ($exitCode -eq 0) {
    Write-Ok "npm test sale con 0 (OK)"
} else {
    Write-Warn "npm test sale con $exitCode (PROBLEMA)"
    $result | Select-Object -Last 10 | ForEach-Object { Write-Host "  $_" }
}

# ------------------------------------------------------------
# 3. Documentar en POLITICA-CI-CD.md
# ------------------------------------------------------------
Write-Host "`n=== POLITICA-CI-CD.md ===" -ForegroundColor Cyan
$politicaPath = 'docs\operations\POLITICA-CI-CD.md'
if (Test-Path $politicaPath) {
    $pol = Get-Content $politicaPath -Raw -Encoding UTF8
    if ($pol -match 'test.*no-op|no-op.*test') {
        Write-Info "Ya documentado (idempotente)"
    } else {
        # Agregar nota al final
        $nota = @"

---

## Nota S25: script `test` no-op

El `package.json` **no tiene tests reales** (TST-001 sigue abierto).
Para que el CI no falle en el step `Test`, se agrego un script
\`test\` no-op al \`package.json\`:

\`\`\`json
"test": "echo \"No tests configured yet (TST-001)\" && exit 0"
\`\`\`

**Cuando se resuelva TST-001** (instalar Jest/Vitest + tests reales),
reemplazar por el script real. Mientras tanto, el CI corre Lint y Build
de verdad, y Test es un placeholder documentado.

**Razon**: \`--passWithNoTests\` es flag de Jest, no de npm. Sin script
\`test\`, npm falla antes de llegar a Jest.
"@
        Add-Content -Path $politicaPath -Value $nota -Encoding UTF8
        Write-Ok "Nota agregada a POLITICA-CI-CD.md"
    }
} else {
    Write-Warn "No existe $politicaPath"
}

# ------------------------------------------------------------
# 4. Diff y commit
# ------------------------------------------------------------
Write-Host "`n=== Git diff --stat ===" -ForegroundColor Cyan
git diff --stat

if ($NoCommit) {
    Write-Info "`nModo -NoCommit: no se commitea."
} else {
    Write-Host "`n=== Commit ===" -ForegroundColor Cyan
    git add $pkgPath $politicaPath
    git commit -m "fix(ci): agregar script 'test' no-op al package.json (TST-001 placeholder)"
    if ($LASTEXITCODE -eq 0) { Write-Ok "Commit creado." } else { Write-Warn "Commit fallo." }
}

Write-Host "`n[FIN] Script 89 completado." -ForegroundColor Green