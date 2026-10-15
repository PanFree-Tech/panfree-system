# ============================================================================
# 46-bloque0-chore-arranque-s17.ps1
# Bloque 0 de S17: ordenar el working tree antes de tocar codigo.
#
# 3 commits atomicos:
#   1. chore(git):    ignorar dumps de sesion y backups
#   2. chore(deps):   versionar package-lock.json
#   3. chore(scripts): versionar scripts de cierre S14-S16
#
# Uso:
#   .\46-bloque0-chore-arranque-s17.ps1            (dry run, no commitea)
#   .\46-bloque0-chore-arranque-s17.ps1 -Commit    (aplica y pushea)
# ============================================================================

param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$repoRoot = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $repoRoot

function Write-Step($msg) {
    Write-Host ""
    Write-Host "=== $msg ===" -ForegroundColor Cyan
}

function Write-Ok($msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}

function Write-Skip($msg) {
    Write-Host "  [SKIP] $msg" -ForegroundColor Yellow
}

function Write-Info($msg) {
    Write-Host "  [INFO] $msg" -ForegroundColor Gray
}

function Test-GitTracked($path) {
    # Retorna $true si el archivo esta trackeado por git.
    # No lanza error si no esta trackeado.
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    try {
        git ls-files --error-unmatch -- $path 2>$null | Out-Null
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $prev
    }
    return ($code -eq 0)
}

# ---------------------------------------------------------------------------
# Pre-chequeo
# ---------------------------------------------------------------------------

Write-Step "Pre-chequeo"

$head = (git rev-parse --short HEAD).Trim()
Write-Info "HEAD actual: $head"

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') {
    Write-Host "  [ERROR] Rama actual '$branch' no es 'main'. Abortar." -ForegroundColor Red
    exit 1
}
Write-Ok "Rama: main"

$dirty = git status --porcelain
$untracked = @($dirty | Where-Object { $_ -match '^\?\?' })
Write-Info "Archivos untracked detectados: $($untracked.Count)"

# ---------------------------------------------------------------------------
# COMMIT 1: .gitignore
# ---------------------------------------------------------------------------

Write-Step "Commit 1 - chore(git): ignorar dumps de sesion y backups"

$gitignorePath = Join-Path $repoRoot '.gitignore'
$gitignoreText = [System.IO.File]::ReadAllText($gitignorePath, (New-Object System.Text.UTF8Encoding($false)))

$needsDumpRule = -not $gitignoreText.Contains('dump-s*.txt')
$needsBackupDirRule = -not $gitignoreText.Contains('.backup-s*/')

if (-not $needsDumpRule -and -not $needsBackupDirRule) {
    Write-Skip ".gitignore ya tiene ambas reglas (dump-s*.txt y .backup-s*/)"
} else {
    $bloque = @()

    if ($needsDumpRule) {
        $bloque += ''
        $bloque += '# Dumps de sesion - nunca commitear'
        $bloque += 'dump-s*.txt'
        Write-Info "Agregar regla: dump-s*.txt"
    } else {
        Write-Skip "Regla ya presente: dump-s*.txt"
    }

    if ($needsBackupDirRule) {
        $bloque += ''
        $bloque += '# Backups de scripts por sesion - nunca commitear'
        $bloque += '.backup-s*/'
        Write-Info "Agregar regla: .backup-s*/"
    } else {
        Write-Skip "Regla ya presente: .backup-s*/"
    }

    if ($bloque.Count -gt 0) {
        $nuevo = $gitignoreText.TrimEnd() + "`r`n" + ($bloque -join "`r`n") + "`r`n"
        if ($Commit) {
            [System.IO.File]::WriteAllText($gitignorePath, $nuevo, (New-Object System.Text.UTF8Encoding($false)))
            Write-Ok ".gitignore actualizado"
            git add .gitignore
            git commit -m "chore(git): ignorar dumps de sesion y backups" | Out-Host
            if ($LASTEXITCODE -ne 0) { throw "git commit 1 fallo" }
            Write-Ok "Commit 1 aplicado"
        } else {
            Write-Info "[DRY RUN] Se agregarian al .gitignore:"
            $bloque | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
        }
    }
}

# ---------------------------------------------------------------------------
# COMMIT 2: package-lock.json
# ---------------------------------------------------------------------------

Write-Step "Commit 2 - chore(deps): versionar package-lock.json"

$lockPath = Join-Path $repoRoot 'package-lock.json'
if (-not (Test-Path -LiteralPath $lockPath)) {
    Write-Skip "package-lock.json no existe (raro, revisar)"
} else {
    $lockTracked = Test-GitTracked 'package-lock.json'
    if ($lockTracked) {
        Write-Skip "package-lock.json ya esta versionado"
    } else {
        $lockSize = (Get-Item -LiteralPath $lockPath).Length
        Write-Info "package-lock.json: $lockSize bytes"
        if ($Commit) {
            git add package-lock.json
            git commit -m "chore(deps): versionar package-lock.json (F4-05)" | Out-Host
            if ($LASTEXITCODE -ne 0) { throw "git commit 2 fallo" }
            Write-Ok "Commit 2 aplicado"
        } else {
            Write-Info "[DRY RUN] Se agregaria package-lock.json al repo"
        }
    }
}

# ---------------------------------------------------------------------------
# COMMIT 3: scripts 22-45
# ---------------------------------------------------------------------------

Write-Step "Commit 3 - chore(scripts): versionar scripts de cierre S14-S16"

$scriptsList = @(
    'scripts/docs/22-fix-chores-docs.ps1',
    'scripts/docs/22b-fix-bitacora-y-limpieza.ps1',
    'scripts/docs/22c-dedupe-y-clean.ps1',
    'scripts/docs/23a-fix-f3-04-password.ps1',
    'scripts/docs/23b-documentar-f3-04.ps1',
    'scripts/docs/23b1-crear-doc.ps1',
    'scripts/docs/23b2-actualizar-tracking.ps1',
    'scripts/docs/23b3-commit.ps1',
    'scripts/docs/24a-actualizar-status.ps1',
    'scripts/docs/25a-fix-f3-05-y-bug-005.ps1',
    'scripts/docs/26a-fix-f3-06-logger.ps1',
    'scripts/docs/26b-documentar-f3-06.ps1',
    'scripts/docs/27-sincronizar-docs-s13.ps1',
    'scripts/docs/28-fix-gitignore-vercel.ps1',
    'scripts/docs/31-cierre-s14.ps1',
    'scripts/docs/32-actualizar-tracking-s14.ps1',
    'scripts/docs/33-doc-bugs-s14.ps1',
    'scripts/docs/34-estado-bitwarden.ps1',
    'scripts/docs/35-cierre-s14-final.ps1',
    'scripts/docs/36-sec-008-eliminar-crear-usuario-admin.ps1',
    'scripts/docs/37-fix-bug-011.ps1',
    'scripts/docs/38-sec-018-cierre.ps1',
    'scripts/docs/39-sec-019-cierre-gemini.ps1',
    'scripts/docs/40-f2-02-migrar-supabase.ps1',
    'scripts/docs/41-cierre-s15.ps1',
    'scripts/docs/42a-actualizar-politica-rotacion.ps1',
    'scripts/docs/42b-actualizar-politica-rotacion.ps1',
    'scripts/docs/43a-f2-05-rotar-resend.ps1',
    'scripts/docs/44-cierre-s16.ps1',
    'scripts/docs/45-corregir-status-s16.ps1'
)

$existentes = @()
$faltantes = @()
foreach ($s in $scriptsList) {
    if (Test-Path -LiteralPath $s) {
        $existentes += $s
    } else {
        $faltantes += $s
    }
}

Write-Info "Scripts a versionar: $($existentes.Count)"
if ($faltantes.Count -gt 0) {
    Write-Host "  [WARN] No existen en disco ($($faltantes.Count)):" -ForegroundColor Yellow
    $faltantes | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkYellow }
}

if ($existentes.Count -eq 0) {
    Write-Skip "No hay scripts para agregar"
} else {
    if ($Commit) {
        foreach ($s in $existentes) {
            git add -- $s
        }
        git commit -m "chore(scripts): versionar scripts de cierre S14-S16" | Out-Host
        if ($LASTEXITCODE -ne 0) { throw "git commit 3 fallo" }
        Write-Ok "Commit 3 aplicado ($($existentes.Count) scripts)"
    } else {
        Write-Info "[DRY RUN] Se agregarian estos $($existentes.Count) scripts:"
        $existentes | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
    }
}

# ---------------------------------------------------------------------------
# Push y verificacion final
# ---------------------------------------------------------------------------

if ($Commit) {
    Write-Step "Push a origin/main"
    git push origin main | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "git push fallo" }
    Write-Ok "Push OK"

    Write-Step "Verificacion final"
    Write-Host "--- git log --oneline -5 ---" -ForegroundColor Cyan
    git log --oneline -5 | Out-Host
    Write-Host ""
    Write-Host "--- git status --short ---" -ForegroundColor Cyan
    $finalStatus = git status --short
    if ([string]::IsNullOrWhiteSpace(($finalStatus -join ''))) {
        Write-Ok "Working tree limpio"
    } else {
        Write-Info "Working tree restante:"
        $finalStatus | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
    }
} else {
    Write-Step "DRY RUN completado - nada se modifico"
    Write-Host ""
    Write-Host "  Para aplicar los 3 commits + push:" -ForegroundColor Yellow
    Write-Host "    .\46-bloque0-chore-arranque-s17.ps1 -Commit" -ForegroundColor Yellow
}

Write-Host ""