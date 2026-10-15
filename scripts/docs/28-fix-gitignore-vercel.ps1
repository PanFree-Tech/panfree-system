# ============================================================================
# 28-fix-gitignore-vercel.ps1
# ----------------------------------------------------------------------------
# Objetivo: (1) dejar de versionar .vercel/ en el repo publico,
#           (2) exceptuar .env.example del glob .env* en .gitignore.
# Fecha:    2026-10-14
# Sesion:   14 (ENV)
# ----------------------------------------------------------------------------
# Uso:
#   Dry run (default):  .\28-fix-gitignore-vercel.ps1
#   Aplicar + commit:   .\28-fix-gitignore-vercel.ps1 -Commit
# ----------------------------------------------------------------------------
# Reglas aplicadas:
#   - ASCII puro. Sin here-strings. Sin escapes unicode. Sin regex.
#   - ReadAllText UTF8(false) -> Contains -> Replace literal -> WriteAllText
#   - Idempotente: si el patron "antes" no existe, avisa y sigue.
#   - Backup automatico a scripts/docs/.backup-s14/ antes de escribir.
#   - Fail-fast en precondiciones.
# ============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BackupDir = Join-Path $PSScriptRoot '.backup-s14'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

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
if (-not $head.StartsWith('fdcb6c70')) {
    Write-Err ('HEAD: ' + $head + ' (esperado prefijo fdcb6c70)')
    Pop-Location; exit 1
}
Write-Ok ('HEAD: ' + $head)

$gitignorePath = Join-Path $RepoRoot '.gitignore'
if (-not (Test-Path -LiteralPath $gitignorePath)) {
    Write-Err '.gitignore no existe'
    Pop-Location; exit 1
}
Write-Ok '.gitignore existe'

# ----------------------------------------------------------------------------
# 2. Verificar que .vercel/* este trackeado
# ----------------------------------------------------------------------------

Write-Step 'Verificar .vercel/ trackeado'

$tracked = @(git ls-files .vercel/)
$needRm = @()
foreach ($t in @('.vercel/README.txt', '.vercel/project.json')) {
    if ($tracked -contains $t) {
        Write-Ok ('Trackeado: ' + $t)
        $needRm += $t
    } else {
        Write-Skip ('No trackeado: ' + $t)
    }
}

# ----------------------------------------------------------------------------
# 3. Editar .gitignore
# ----------------------------------------------------------------------------

Write-Step '.gitignore'

$gi = Read-FileRaw $gitignorePath
$giChanged = $false

# Bloque actual (lo que agrego Vercel):
#   # Vercel (por si se linkea más adelante)
#   .vercel/
#   .vercel
#   .env*
#
# Se reemplaza por version limpia con !.env.example.
# Nota: el acento de "mas" se escribe como "m\u00e1s" en el archivo real.
#       Uso substring sin acento para evitar problemas de encoding.

$oldBlockLines = @(
    '# Vercel (por si se linkea',
    '.vercel/',
    '.vercel',
    '.env*'
)

# Buscamos el bloque por lineas para no depender del acento.
$lines = $gi -split "`r`n"
$idxComment = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i].StartsWith('# Vercel (por si se linkea')) {
        $idxComment = $i
        break
    }
}

if ($idxComment -ge 0 -and ($idxComment + 3) -lt $lines.Count) {
    $lineVercelDir = $lines[$idxComment + 1].Trim()
    $lineVercel    = $lines[$idxComment + 2].Trim()
    $lineEnvGlob   = $lines[$idxComment + 3].Trim()

    if ($lineVercelDir -eq '.vercel/' -and $lineVercel -eq '.vercel' -and $lineEnvGlob -eq '.env*') {
        # Chequear si ya tiene !.env.example despues
        $hasException = $false
        if (($idxComment + 4) -lt $lines.Count) {
            if ($lines[$idxComment + 4].Trim() -eq '!.env.example') {
                $hasException = $true
            }
        }

        if ($hasException) {
            Write-Skip 'Seccion Vercel ya tiene !.env.example'
        } else {
            $newBlock = @(
                '# Vercel',
                '.vercel/',
                '.vercel',
                '.env*',
                '!.env.example'
            )
            # Reconstruir: reemplazar las 4 lineas (comment + 3) por las 5 nuevas.
            $before = $lines[0..$idxComment]
            $after  = @()
            if (($idxComment + 4) -lt $lines.Count) {
                $after = $lines[($idxComment + 4)..($lines.Count - 1)]
            }
            $lines = $before + $newBlock + $after
            $gi = $lines -join "`r`n"
            Write-Ok 'Seccion Vercel reescrita con !.env.example'
            $giChanged = $true
        }
    } else {
        Write-Skip 'Bloque Vercel no matchea la forma esperada'
    }
} else {
    Write-Skip 'Comentario "Vercel (por si se linkea" no encontrado'
}

if ($giChanged) {
    if ($Commit) {
        Backup-File $gitignorePath
        Write-FileRaw $gitignorePath $gi
        Write-Ok '.gitignore escrito'
    } else {
        Write-Host '   (dry run: .gitignore NO se escribio)' -ForegroundColor DarkYellow
    }
}

# ----------------------------------------------------------------------------
# 4. git rm --cached
# ----------------------------------------------------------------------------

Write-Step 'git rm --cached .vercel/'

if ($needRm.Count -eq 0) {
    Write-Skip 'Nada que desindexar'
} else {
    foreach ($t in $needRm) {
        if ($Commit) {
            git rm --cached --quiet -- $t
            if ($LASTEXITCODE -ne 0) {
                Write-Err ('git rm --cached fallo: ' + $t)
                Pop-Location; exit 1
            }
            Write-Ok ('Desindexado: ' + $t)
        } else {
            Write-Host ('   (dry run: git rm --cached ' + $t + ')') -ForegroundColor DarkYellow
        }
    }
}

# ----------------------------------------------------------------------------
# 5. Commit
# ----------------------------------------------------------------------------

Write-Step 'Commit'

if (-not $Commit) {
    Write-Host '   Dry run. Nada escrito, nada commiteado.' -ForegroundColor DarkYellow
    Write-Host '   Para aplicar: .\28-fix-gitignore-vercel.ps1 -Commit' -ForegroundColor DarkYellow
    Pop-Location
    exit 0
}

# Stagear cambios
git add -- .gitignore
if ($LASTEXITCODE -ne 0) {
    Write-Err 'git add .gitignore fallo'
    Pop-Location; exit 1
}

# Ver que hay algo para commitear
$staged = @(git diff --cached --name-only)
if ($staged.Count -eq 0) {
    Write-Skip 'Nada staged. No hay commit.'
    Pop-Location
    exit 0
}

$msg = 'chore(git): dejar de versionar .vercel/ y exceptuar .env.example'
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
Write-Host 'Staged/modificado:' -ForegroundColor Cyan
$staged | ForEach-Object { Write-Host ('   - ' + $_) -ForegroundColor Gray }

Write-Host ''
Write-Host ('Backups en: ' + $BackupDir) -ForegroundColor DarkGray
Write-Host 'Rollback si hiciera falta:  git revert HEAD --no-edit' -ForegroundColor DarkGray

Pop-Location