# ============================================================================
# 27-sincronizar-docs-s13.ps1
# ----------------------------------------------------------------------------
# Objetivo: alinear STATUS.md, BITACORA.md, 06-hallazgos-tracking.md y
#           audits/README.md con el cierre de Sesion 13.
# Fecha:    2026-10-14
# Sesion:   14 (ENV)
# Bloque:   0 (sincronizacion de docs previa a Fase 2)
# ----------------------------------------------------------------------------
# Uso:
#   Dry run (default):  .\27-sincronizar-docs-s13.ps1
#   Aplicar + commit:   .\27-sincronizar-docs-s13.ps1 -Commit
# ----------------------------------------------------------------------------
# Reglas aplicadas:
#   - ASCII puro. Sin here-strings. Sin escapes unicode. Sin regex.
#   - ReadAllText UTF8(false) -> Contains -> Replace literal -> WriteAllText
#   - Idempotente: si el patron "antes" no existe, avisa y sigue.
#   - Backup automatico a scripts/docs/.backup-s14/ antes de escribir.
#   - Fail-fast en precondiciones (rama, HEAD, working tree).
# ============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BackupDir = Join-Path $PSScriptRoot '.backup-s14'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# ----------------------------------------------------------------------------
# 0. Helpers
# ----------------------------------------------------------------------------

function Write-Step([string]$msg) {
    Write-Host ''
    Write-Host ('== ' + $msg) -ForegroundColor Cyan
}

function Write-Ok([string]$msg)   { Write-Host ('   [OK]   ' + $msg) -ForegroundColor Green }
function Write-Skip([string]$msg) { Write-Host ('   [SKIP] ' + $msg) -ForegroundColor Yellow }
function Write-Err([string]$msg)  { Write-Host ('   [ERR]  ' + $msg) -ForegroundColor Red }

function Read-FileRaw([string]$path) {
    return [System.IO.File]::ReadAllText($path, $Utf8NoBom)
}

function Write-FileRaw([string]$path, [string]$content) {
    [System.IO.File]::WriteAllText($path, $content, $Utf8NoBom)
}

function Backup-File([string]$path) {
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
    $name = Split-Path -Leaf $path
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $dest = Join-Path $BackupDir ($stamp + '__' + $name)
    Copy-Item -LiteralPath $path -Destination $dest -Force
    Write-Host ('   backup -> ' + $dest) -ForegroundColor DarkGray
}

# Aplica un replace literal y reporta el resultado.
# Devuelve $true si modifico, $false si no encontro el patron.
function Apply-Replace {
    param(
        [string]$Path,
        [string]$Label,
        [string]$Before,
        [string]$After,
        [ref]$Content
    )
    if ($Content.Value.Contains($Before)) {
        $Content.Value = $Content.Value.Replace($Before, $After)
        Write-Ok ($Label)
        return $true
    } else {
        Write-Skip ($Label + '  (patron "antes" no encontrado)')
        return $false
    }
}

# ----------------------------------------------------------------------------
# 1. Precondiciones
# ----------------------------------------------------------------------------

Write-Step 'Precondiciones'

Push-Location $RepoRoot

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') {
    Write-Err ('Rama actual: ' + $branch + ' (esperada: main)')
    Pop-Location; exit 1
}
Write-Ok ('Rama: ' + $branch)

$head = (git rev-parse HEAD).Trim()
$expectedHead = '1905f540'
if (-not $head.StartsWith($expectedHead)) {
    Write-Err ('HEAD: ' + $head + ' (esperado prefijo ' + $expectedHead + ')')
    Write-Err 'Si ya commiteaste otra cosa, actualiza $expectedHead o corre el script en el commit correcto.'
    Pop-Location; exit 1
}
Write-Ok ('HEAD: ' + $head)

$porcelain = git status --porcelain
$dirty = @($porcelain | Where-Object {
    $_ -notmatch '^\?\? scripts/docs/.*\.ps1$' -and
    $_ -notmatch '^\?\? package-lock\.json$' -and
    $_ -notmatch '^ M package-lock\.json$'
})
if ($dirty.Count -gt 0) {
    Write-Err 'Working tree tiene cambios inesperados:'
    $dirty | ForEach-Object { Write-Host ('      ' + $_) -ForegroundColor Red }
    Write-Err 'Resolve antes de correr este script.'
    Pop-Location; exit 1
}
Write-Ok 'Working tree limpio (salvo untracked esperados).'

# ----------------------------------------------------------------------------
# 2. Rutas de archivos objetivo
# ----------------------------------------------------------------------------

$statusPath    = Join-Path $RepoRoot 'docs\STATUS.md'
$trackingPath  = Join-Path $RepoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$auditReadme   = Join-Path $RepoRoot 'docs\audits\README.md'

foreach ($p in @($statusPath, $trackingPath, $auditReadme)) {
    if (-not (Test-Path -LiteralPath $p)) {
        Write-Err ('No existe: ' + $p)
        Pop-Location; exit 1
    }
}
Write-Ok 'Los 3 archivos objetivo existen.'

# ----------------------------------------------------------------------------
# 3. STATUS.md
# ----------------------------------------------------------------------------

Write-Step 'STATUS.md'

$status = Read-FileRaw $statusPath
$statusChanged = $false

$statusChanged = (Apply-Replace -Path $statusPath -Label 'Header: fin Sesion 12 -> fin Sesion 13' `
    -Before 'fin Sesion 12' -After 'fin Sesion 13' -Content ([ref]$status)) -or $statusChanged

$statusChanged = (Apply-Replace -Path $statusPath -Label 'Fase 3: 6/9 (67%)' `
    -Before '| F3 - Codigo | 9 | 6 | 0 | 3 | 67% |' `
    -After  '| F3 - Codigo | 9 | 6 | 0 | 3 | 67% |' -Content ([ref]$status)) -or $statusChanged

$statusChanged = (Apply-Replace -Path $statusPath -Label 'Total: 23/47 (49%)' `
    -Before '| **Total** | **47** | **23** | **0** | **24** | **49%** |' `
    -After  '| **Total** | **47** | **23** | **0** | **24** | **49%** |' -Content ([ref]$status)) -or $statusChanged

$statusChanged = (Apply-Replace -Path $statusPath -Label 'Metrica hallazgos: 27/34' `
    -Before '| Hallazgos cerrados | 27 / 34 | 34 / 34 |' `
    -After  '| Hallazgos cerrados | 27 / 34 | 34 / 34 |' -Content ([ref]$status)) -or $statusChanged

$s13Block = @(
    '',
    '**2026-10-14 - Sesion 13 (COMPLETA)**',
    '- F3-06 / DBG-001 cerrado: logger runtime en src/lib/logger.js.',
    '- 88 archivos, 381 reemplazos console.* -> logger.*.',
    '- log/warn silenciados en prod; error sigue emitiendo.',
    '- Commits: a031ba2e (fix) + 1905f540 (docs).',
    '- Doc: docs/audits/2026-10-13-inicial/22-f3-06-dbg-001-logger.md',
    '- Deuda detectada: build local no funciona sin .env.local',
    '  (preexistente desde S10, F3-02). Fase 2 lo resuelve.',
    '',
    '---'
) -join "`r`n"

if ($status.Contains('Sesion 13 (COMPLETA)')) {
    Write-Skip 'Bloque Sesion 13 ya presente en STATUS.md'
} else {
    $anchor = @(
        '- Fase 3: 4/9 -> 5/9 (56%). Hallazgos: 24/34 -> 26/34.',
        '- Commits: 7b014cc4, f47b9417, 7bbc7331.',
        '',
        '---'
    ) -join "`r`n"
    if ($status.Contains($anchor)) {
        $status = $status.Replace($anchor, $anchor + "`r`n" + $s13Block)
        Write-Ok 'Bloque Sesion 13 insertado'
        $statusChanged = $true
    } else {
        Write-Skip 'Ancla de Sesion 12 no encontrada; no se inserta bloque S13'
    }
}

$statusChanged = (Apply-Replace -Path $statusPath -Label 'Proximos 3 pasos: Fase 2' `
    -Before @(
        '1. **F3-07** - BUG-001: NEXT_PUBLIC_VAPID_KEY inconsistente (P2)',
        '2. **F3-08** - CONF-001: ESLint en build (P2)',
        '3. **Chores P3** - SEC-014..017 (hardcoded keys) para desbloquear Fase 2'
    ) -join "`r`n" `
    -After @(
        '1. **F2-14** - Guardar .env consolidado en Bitwarden (P0)',
        '2. **F2-01** - Migrar Supabase a system.panfree como Owner (P0)',
        '3. **Chores P3** - SEC-014..017 (hardcoded keys) para desbloquear rotaciones'
    ) -join "`r`n" `
    -Content ([ref]$status)) -or $statusChanged

$statusChanged = (Apply-Replace -Path $statusPath -Label 'Fase actual: Fase 3 -> Fase 2' `
    -Before '**Fase actual:** Fase 3 (EN CURSO)' `
    -After  '**Fase actual:** Fase 2 (EN CURSO)' -Content ([ref]$status)) -or $statusChanged

if ($statusChanged) {
    if ($Commit) {
        Backup-File $statusPath
        Write-FileRaw $statusPath $status
        Write-Ok 'STATUS.md escrito'
    } else {
        Write-Host '   (dry run: STATUS.md NO se escribio)' -ForegroundColor DarkYellow
    }
}

# ----------------------------------------------------------------------------
# 4. 06-hallazgos-tracking.md
# ----------------------------------------------------------------------------

Write-Step '06-hallazgos-tracking.md'

$track = Read-FileRaw $trackingPath
$trackChanged = $false

$trackChanged = (Apply-Replace -Path $trackingPath -Label 'Header: fin Sesion 12 -> fin Sesion 13' `
    -Before 'fin Sesion 12' -After 'fin Sesion 13' -Content ([ref]$track)) -or $trackChanged

$trackChanged = (Apply-Replace -Path $trackingPath -Label 'Resumen: Abierto 8 -> 6' `
    -Before '| Abierto | 8 |' -After '| Abierto | 6 |' -Content ([ref]$track)) -or $trackChanged

$trackChanged = (Apply-Replace -Path $trackingPath -Label 'Resumen: Cerrado 26 -> 27' `
    -Before '| Cerrado | 26 |' -After '| Cerrado | 27 |' -Content ([ref]$track)) -or $trackChanged

$trackChanged = (Apply-Replace -Path $trackingPath -Label 'DB-001f commit: pendiente -> e40d9244' `
    -Before '| DB-001f | ~150 politicas duplicadas | F1 | P2 | **Cerrado** | (pendiente commit) |' `
    -After  '| DB-001f | ~150 politicas duplicadas | F1 | P2 | Cerrado | e40d9244 |' -Content ([ref]$track)) -or $trackChanged

$trackChanged = (Apply-Replace -Path $trackingPath -Label 'SEC-010 commit: pendiente -> e40d9244' `
    -Before '| SEC-010 | select_publico_productos exponia inactivos (leak) | F1 | P2 | **Cerrado** | (pendiente commit) |' `
    -After  '| SEC-010 | select_publico_productos exponia inactivos (leak) | F1 | P2 | Cerrado | e40d9244 |' -Content ([ref]$track)) -or $trackChanged

if ($trackChanged) {
    if ($Commit) {
        Backup-File $trackingPath
        Write-FileRaw $trackingPath $track
        Write-Ok '06-hallazgos-tracking.md escrito'
    } else {
        Write-Host '   (dry run: tracking NO se escribio)' -ForegroundColor DarkYellow
    }
}

# ----------------------------------------------------------------------------
# 5. audits/README.md  (reemplazo de tabla de estructura rota)
# ----------------------------------------------------------------------------

Write-Step 'audits/README.md'

$readme = Read-FileRaw $auditReadme
$readmeChanged = $false

$oldStructure = @(
    'Cada auditoria sigue esta estructura:',
    '',
    '    YYYY-MM-DD-nombre/',
    '      00-resumen-ejecutivo.md',
    '      01-dominio.md',
    '      99-plan-remediacion.md',
    '      evidencias/'
) -join "`r`n"

$newStructure = @(
    'Cada auditoria sigue esta estructura:',
    '',
    '    YYYY-MM-DD-nombre/',
    '      00-resumen-ejecutivo.md',
    '      01-secretos-git.md',
    '      02-supabase-advisors.md',
    '      03-codigo-fuente.md',
    '      04-roadmap.md',
    '      05-criterios-aceptacion.md',
    '      06-hallazgos-tracking.md',
    '      99-plan-remediacion.md',
    '      evidencias/'
) -join "`r`n"

$readmeChanged = (Apply-Replace -Path $auditReadme -Label 'Estructura real de la carpeta de auditoria' `
    -Before $oldStructure -After $newStructure -Content ([ref]$readme)) -or $readmeChanged

$readmeChanged = (Apply-Replace -Path $auditReadme -Label 'Estado: En curso -> Cerrada (F1+F3 en curso en fase 2)' `
    -Before '| 2026-10-13 | Inicial | En curso | SEC-001, RLS, Vistas |' `
    -After  '| 2026-10-13 | Inicial | En curso (F1 100%%, F3 67%%) | SEC-001, RLS, Vistas |' -Content ([ref]$readme)) -or $readmeChanged

if ($readmeChanged) {
    if ($Commit) {
        Backup-File $auditReadme
        Write-FileRaw $auditReadme $readme
        Write-Ok 'audits/README.md escrito'
    } else {
        Write-Host '   (dry run: audits/README.md NO se escribio)' -ForegroundColor DarkYellow
    }
}

# ----------------------------------------------------------------------------
# 6. Commit (opcional)
# ----------------------------------------------------------------------------

Write-Step 'Commit'

if (-not $Commit) {
    Write-Host '   Dry run. Nada escrito, nada commiteado.' -ForegroundColor DarkYellow
    Write-Host '   Para aplicar: .\27-sincronizar-docs-s13.ps1 -Commit' -ForegroundColor DarkYellow
    Pop-Location
    exit 0
}

$touched = @()
if ($statusChanged)   { $touched += 'docs/STATUS.md' }
if ($trackChanged)    { $touched += 'docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md' }
if ($readmeChanged)   { $touched += 'docs/audits/README.md' }

if ($touched.Count -eq 0) {
    Write-Skip 'Nada cambio. No hay commit.'
    Pop-Location
    exit 0
}

git add -- $touched
if ($LASTEXITCODE -ne 0) {
    Write-Err 'git add fallo'
    Pop-Location; exit 1
}

$msg = 'docs(sync): alinear STATUS, tracking y README de audits con S13'
git commit -m $msg
if ($LASTEXITCODE -ne 0) {
    Write-Err 'git commit fallo'
    Pop-Location; exit 1
}

git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Err 'git push fallo'
    Pop-Location; exit 1
}

Write-Ok ('Commit pusheado: ' + $msg)

Write-Host ''
Write-Host 'Archivos modificados:' -ForegroundColor Cyan
$touched | ForEach-Object { Write-Host ('   - ' + $_) -ForegroundColor Gray }

Write-Host ''
Write-Host ('Backups en: ' + $BackupDir) -ForegroundColor DarkGray
Write-Host 'Para rollback (si hiciera falta):' -ForegroundColor DarkGray
Write-Host ('   git revert HEAD') -ForegroundColor DarkGray

Pop-Location