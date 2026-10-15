# PowerShell
# =============================================================================
# Script 22b - Fix BITACORA dedupe + limpieza de basura
# Corrige lo que el 22 no pudo hacer.
# Dry run por defecto. Usar -Commit para commitear y pushear.
# =============================================================================

param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $repo

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-Section($t) {
    Write-Host ''
    Write-Host ('=' * 70) -ForegroundColor Magenta
    Write-Host ("  $t") -ForegroundColor Magenta
    Write-Host ('=' * 70) -ForegroundColor Magenta
}

function Write-Step($n, $t) {
    Write-Host ''
    Write-Host ("[$n] $t") -ForegroundColor Cyan
}

function Write-OK($m)   { Write-Host ("  OK: $m") -ForegroundColor Green }
function Write-INFO($m) { Write-Host ("  INFO: $m") -ForegroundColor Yellow }
function Write-ERR($m)  { Write-Host ("  ERROR: $m") -ForegroundColor Red }

function Read-File($p) {
    return [System.IO.File]::ReadAllText((Join-Path $repo $p))
}

function Write-File($p, $content) {
    $full = Join-Path $repo $p
    [System.IO.File]::WriteAllText($full, $content, $utf8NoBom)
}

# -----------------------------------------------------------------------------
Write-Section "Script 22b - Fix BITACORA dedupe + limpieza"
Write-Host "  Repo:   $repo"
if ($Commit) {
    Write-Host "  Modo:   COMMIT + PUSH" -ForegroundColor Yellow
} else {
    Write-Host "  Modo:   DRY RUN (sin commit)" -ForegroundColor Yellow
}

# -----------------------------------------------------------------------------
Write-Step "1/5" "Borrando archivos basura del working tree..."

# Lista EXPLICITA de archivos basura (no usar glob).
# Excluye package-lock.json y scripts/docs/22-fix-chores-docs.ps1.
$basura = @(
    '#',
    '$consumidores',
    '$lineas',
    '$n',
    '$scripts20',
    '$supabaseJs',
    "'",
    'Get-Content',
    'Write-Host',
    '"anitizeSupabaseKey(key) {"',
    '"anitizeSupabaseUrl(url) {"',
    'cd',
    'e.js',
    '"ertions(+), 42 deletions(-)"',
    'export',
    'git',
    'main',
    '"ole.warn(''\342\232\240 Supabase usando valores por defecto. Verificar flyctl secrets.'')"',
    'powershell',
    '"t clean = key.trim()"',
    '}'
)

$borrados = 0
foreach ($f in $basura) {
    $full = Join-Path $repo $f
    if (Test-Path -LiteralPath $full) {
        if ($Commit) {
            Remove-Item -LiteralPath $full -Force
            Write-Host ("  Borrado: {0}" -f $f) -ForegroundColor DarkGray
        } else {
            Write-Host ("  [DRY] borraria: {0}" -f $f) -ForegroundColor DarkGray
        }
        $borrados++
    }
}
Write-OK "$borrados archivos basura procesados."

# -----------------------------------------------------------------------------
Write-Step "2/5" "Dedupe de BITACORA.md (funcion corregida)..."

function Remove-DuplicateSessions {
    param([string]$text)

    # Split por header de sesion (lookahead, no consume el header)
    $pattern = '(?m)(?=^## \d{4}-\d{2}-\d{2} \(Sesion)'
    $partes = [regex]::Split($text, $pattern)

    if ($partes.Count -lt 2) { return $text }

    $preambulo = $partes[0]
    $bloques   = @()
    for ($i = 1; $i -lt $partes.Count; $i++) {
        $bloques += $partes[$i]
    }

    $seen = @{}
    $resultado = New-Object System.Collections.ArrayList
    [void]$resultado.Add($preambulo)

    foreach ($blk in $bloques) {
        # Primera linea del bloque
        $firstLine = ($blk -split "`r?`n", 2)[0]
        if ($firstLine -match '\(Sesion (\d+)([^)]*)\)') {
            $num    = $matches[1]
            $suffix = $matches[2].Trim()
            $key    = "$num|$suffix"
            if (-not $seen.ContainsKey($key)) {
                $seen[$key] = $true
                [void]$resultado.Add($blk)
            } else {
                Write-Host ("    DEDUPE: eliminando bloque duplicado -> $firstLine") -ForegroundColor DarkYellow
            }
        } else {
            # Bloque sin match: conservar
            [void]$resultado.Add($blk)
        }
    }

    return ($resultado -join '')
}

$bitacoraPath = 'docs\BITACORA.md'
$b = Read-File $bitacoraPath
$antes = $b

$b = Remove-DuplicateSessions $b

if ($b -ne $antes) {
    if ($Commit) {
        Write-File $bitacoraPath $b
        Write-OK "BITACORA.md deduplicado."
    } else {
        Write-OK "BITACORA.md seria deduplicado (dry run)."
    }
} else {
    Write-INFO "BITACORA.md sin cambios (idempotente)."
}

# -----------------------------------------------------------------------------
Write-Step "3/5" "Verificacion de conteos post-fix..."

$bFinal = Read-File $bitacoraPath
$c2 = ([regex]::Matches($bFinal, '(?m)^## \d{4}-\d{2}-\d{2} \(Sesion 2 - CIERRE')).Count
$c3 = ([regex]::Matches($bFinal, '(?m)^## \d{4}-\d{2}-\d{2} \(Sesion 3 - CIERRE')).Count
$c5 = ([regex]::Matches($bFinal, '(?m)^## \d{4}-\d{2}-\d{2} \(Sesion 5 - CIERRE')).Count

Write-Host ("    Sesion 2: {0} (esperado: 1)" -f $c2)
Write-Host ("    Sesion 3: {0} (esperado: 1)" -f $c3)
Write-Host ("    Sesion 5: {0} (esperado: 1)" -f $c5)

$totalHeaders = ([regex]::Matches($bFinal, '(?m)^## \d{4}-\d{2}-\d{2} \(Sesion')).Count
Write-Host ("    Total headers: {0} (esperado: 10)" -f $totalHeaders)

# -----------------------------------------------------------------------------
Write-Step "4/5" "git status --short..."

git status --short

Write-Host ''
Write-Host '  --- git diff --stat ---'
git diff --stat

# -----------------------------------------------------------------------------
if ($Commit) {
    Write-Step "5/5" "Commit + push..."

    Write-Host '  Preparando commit...'
    git add docs/BITACORA.md
    git add docs/STATUS.md
    git add docs/README.md
    git add docs/operations/GUIA-RAPIDA.md
    git add docs/operations/WORKFLOW-DIARIO.md
    git add docs/operations/PLAN-DE-TRABAJO.md
    git add 'docs/audits/2026-10-13-inicial/19-f3-02-sec-002-anon-key.md'

    git commit -m "docs(chores): limpiar duplicados y actualizar rutas (B-01)"
    Write-OK "commit creado."

    git push origin main
    Write-OK "push completado."

    Write-Host ''
    Write-Host '  git log --oneline -3:'
    git log --oneline -3
} else {
    Write-Step "5/5" "FIN (DRY RUN)"
    Write-Host '  Si todo OK:' -ForegroundColor Yellow
    Write-Host '    .\scripts\docs\22b-fix-bitacora-y-limpieza.ps1 -Commit' -ForegroundColor Yellow
}

Write-Host ''