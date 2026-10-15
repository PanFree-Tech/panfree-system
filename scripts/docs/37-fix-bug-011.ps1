# ============================================================================
# 37-fix-bug-011.ps1
# ----------------------------------------------------------------------------
# Cierra BUG-011: corrige el bug en 29-fix-logger-import.ps1 y lo versiona.
#
# Contexto:
#   - BUG-011 detectado en S14 durante el fix del logger (BUG-010).
#   - El script 29 tiene la linea final:
#       Write-Ok ($modified + ' archivos modificados')
#     PowerShell interpreta int + string como suma aritmetica y falla.
#   - Fix: usar interpolacion de string -> "$modified archivos modificados".
#
# Actualiza:
#   - scripts/docs/29-fix-logger-import.ps1 (fix + agregar al repo)
#   - docs/audits/2026-10-13-inicial/24-bugs-s14-gemini-y-otros.md
#     (agrega seccion "Cierre de BUG-011")
#   - docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md
#     (BUG-011 -> Cerrado + contadores)
#   - docs/STATUS.md (metrica hallazgos cerrados)
#
# Fecha: 2026-10-14
# Sesion: 15
# ----------------------------------------------------------------------------
# Uso:
#   Dry run:  .\37-fix-bug-011.ps1
#   Aplicar:  .\37-fix-bug-011.ps1 -Commit
# ============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BackupDir = Join-Path $PSScriptRoot '.backup-s15'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-Step([string]$m) { Write-Host ''; Write-Host ('== ' + $m) -ForegroundColor Cyan }
function Write-Ok([string]$m)   { Write-Host ('   [OK]   ' + $m) -ForegroundColor Green }
function Write-Skip([string]$m) { Write-Host ('   [SKIP] ' + $m) -ForegroundColor Yellow }
function Write-Err([string]$m)  { Write-Host ('   [ERR]  ' + $m) -ForegroundColor Red }
function Write-Warn([string]$m) { Write-Host ('   [WARN] ' + $m) -ForegroundColor Yellow }

function Read-FileRaw([string]$path) {
    return [System.IO.File]::ReadAllText($path, $Utf8NoBom)
}
function Write-FileRaw([string]$path, [string]$content) {
    [System.IO.File]::WriteAllText($path, $content, $Utf8NoBom)
}
function Backup-File([string]$path, [string]$stamp) {
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
    $rel = $path.Substring($RepoRoot.Length).TrimStart('\')
    $safe = $rel.Replace('\', '__')
    $dest = Join-Path $BackupDir ($stamp + '__' + $safe)
    Copy-Item -LiteralPath $path -Destination $dest -Force
}

Write-Step 'Precondiciones'
Push-Location $RepoRoot

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') { Write-Err ('Rama: ' + $branch); Pop-Location; exit 1 }
Write-Ok ('Rama: ' + $branch)
Write-Ok ('HEAD: ' + (git rev-parse HEAD).Trim())

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

# ============================================================================
# 1. Fix del script 29
# ============================================================================

Write-Step 'Fix en scripts/docs/29-fix-logger-import.ps1'

$script29Path = Join-Path $RepoRoot 'scripts\docs\29-fix-logger-import.ps1'
if (-not (Test-Path -LiteralPath $script29Path)) {
    Write-Err '29-fix-logger-import.ps1 no existe'
    Pop-Location
    exit 1
}

$script29 = Read-FileRaw $script29Path

# Patron con bug (bug intencional): Write-Ok ($modified + ' archivos modificados')
$bugLineVieja  = 'Write-Ok ($modified + '' archivos modificados'')'
$bugLineNueva  = 'Write-Ok "$modified archivos modificados"'

if ($script29.Contains($bugLineNueva)) {
    Write-Skip 'Script 29 ya tiene el fix aplicado'
} elseif ($script29.Contains($bugLineVieja)) {
    $script29 = $script29.Replace($bugLineVieja, $bugLineNueva)
    if ($Commit) {
        Backup-File $script29Path $stamp
        Write-FileRaw $script29Path $script29
        Write-Ok 'Script 29 corregido'
    } else {
        Write-Host '   (dry run: script 29 NO escrito)' -ForegroundColor DarkYellow
    }
} else {
    Write-Warn 'No encontre la linea con bug en el script 29'
    Write-Host '   (puede estar ya corregida con otro formato)' -ForegroundColor DarkYellow
}

# ============================================================================
# 2. Auditoria del script 29 (buscar otros patrones similares)
# ============================================================================

Write-Step 'Auditoria del script 29 (patrones ($var + string))'

$contentParaAuditar = if ($Commit) { Read-FileRaw $script29Path } else { $script29 }
$lineas = $contentParaAuditar -split "`r`n"
$sospechosas = @()

for ($i = 0; $i -lt $lineas.Count; $i++) {
    $linea = $lineas[$i].Trim()
    # Buscar patrones tipo ($var + '...') o ($var + "...")
    if ($linea -match '\(\s*\$[a-zA-Z_][a-zA-Z0-9_]*\s*\+\s*[''"]') {
        $sospechosas += ('Linea {0}: {1}' -f ($i + 1), $lineas[$i].Trim())
    }
}

if ($sospechosas.Count -eq 0) {
    Write-Ok 'Sin otros patrones sospechosos detectados'
} else {
    Write-Warn ($sospechosas.Count.ToString() + ' posibles patrones similares detectados:')
    $sospechosas | ForEach-Object { Write-Host ('     ' + $_) -ForegroundColor DarkYellow }
    Write-Host '   (revisar manualmente; el script NO los modifica)' -ForegroundColor DarkYellow
}

# ============================================================================
# 3. Agregar seccion "Cierre de BUG-011" al doc 24
# ============================================================================

Write-Step 'Actualizar 24-bugs-s14-gemini-y-otros.md (seccion Cierre BUG-011)'

$doc24Path = Join-Path $RepoRoot 'docs\audits\2026-10-13-inicial\24-bugs-s14-gemini-y-otros.md'
if (-not (Test-Path -LiteralPath $doc24Path)) {
    Write-Err '24-bugs-s14-gemini-y-otros.md no existe'
    Pop-Location
    exit 1
}

$doc24 = Read-FileRaw $doc24Path

$marcaCierre = '## 9. Cierre de BUG-011 (2026-10-14, Sesion 15)'

if ($doc24.Contains($marcaCierre)) {
    Write-Skip 'Seccion "Cierre de BUG-011" ya existe en doc 24'
} else {
    $seccionCierre = @(
        '',
        '---',
        '',
        '## 9. Cierre de BUG-011 (2026-10-14, Sesion 15)',
        '',
        '**Estado:** Cerrado',
        '**Commit fix:** (pendiente)',
        '',
        '### Fix aplicado',
        '',
        'En `scripts/docs/29-fix-logger-import.ps1`, la linea final:',
        '',
        '```powershell',
        "Write-Ok (`$modified + ' archivos modificados')",
        '```',
        '',
        'Se reemplazo por:',
        '',
        '```powershell',
        'Write-Ok "$modified archivos modificados"',
        '```',
        '',
        '**Causa raiz:** PowerShell interpreta `int + string` como suma',
        'aritmetica. Con `$modified` siendo `int`, el operador `+` intenta',
        'sumar y falla al no poder convertir el string a numero.',
        '',
        '**Fix:** usar interpolacion de string (`"$var texto"`), que',
        'convierte `$var` a string antes de concatenar.',
        '',
        '### Auditoria del script 29',
        '',
        'Se reviso el script completo buscando otros patrones del tipo',
        '`($var + string)`. Resultado documentado en la salida del script',
        '37 (ver commit correspondiente).',
        '',
        '### Versionado',
        '',
        'El script 29 estaba sin versionar (`??` en git status). Se',
        'versiona junto con el fix para preservar la trazabilidad y',
        'servir como plantilla de futuros fixes masivos de imports.',
        '',
        '### Verificacion',
        '',
        '- Script 29 sin la linea con bug.',
        '- Versionado en el repo.',
        '- Tracking actualizado (BUG-011 -> Cerrado).',
        '- STATUS.md con metricas actualizadas.',
        '',
        '### Referencias',
        '',
        '- [BUG-011 en tracking](./06-hallazgos-tracking.md)',
        '- [23-bug-010-logger-regresion.md](./23-bug-010-logger-regresion.md) - seccion "Hallazgo colateral"',
        '- [29-fix-logger-import.ps1](../../../scripts/docs/29-fix-logger-import.ps1)',
        ''
    ) -join "`r`n"

    if ($Commit) {
        Backup-File $doc24Path $stamp
        # Insertar antes de "## 8. Referencias" si existe, si no al final
        $anclaRef = '## 8. Referencias'
        if ($doc24.Contains($anclaRef)) {
            $doc24 = $doc24.Replace($anclaRef, $seccionCierre + "`r`n" + $anclaRef)
            Write-Ok 'Seccion de cierre insertada antes de Referencias'
        } else {
            $doc24 = $doc24.TrimEnd() + "`r`n" + $seccionCierre
            Write-Ok 'Seccion de cierre agregada al final'
        }
        Write-FileRaw $doc24Path $doc24
    } else {
        Write-Host '   (dry run: doc 24 NO escrito)' -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 4. Actualizar tracking (BUG-011 -> Cerrado)
# ============================================================================

Write-Step 'Actualizar tracking (BUG-011 -> Cerrado)'

$trackPath = Join-Path $RepoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
if (-not (Test-Path -LiteralPath $trackPath)) {
    Write-Err '06-hallazgos-tracking.md no existe'
    Pop-Location
    exit 1
}

$track = Read-FileRaw $trackPath

# 4a. Fila de BUG-011 (bajos)
$bug011Viejo = '| BUG-011 | bug en script 29-fix-logger-import.ps1 (Write-Ok con $modified + string) | F3 | P3 | Abierto | - |'
$bug011Nuevo = '| BUG-011 | bug en script 29-fix-logger-import.ps1 (Write-Ok con $modified + string) | F3 | P3 | Cerrado | (S15) |'

if ($track.Contains($bug011Nuevo)) {
    Write-Skip 'BUG-011 ya marcado como Cerrado'
} elseif ($track.Contains($bug011Viejo)) {
    $track = $track.Replace($bug011Viejo, $bug011Nuevo)
    Write-Ok 'Fila BUG-011 actualizada a Cerrado'
} else {
    Write-Warn 'No encontre la fila exacta de BUG-011 (puede estar reformateada)'
}

# 4b. Resumen: Cerrado 29 -> 30
$resViejo = @(
    '| Estado | Cantidad |',
    '|---|---|',
    '| Abierto | 16 |',
    '| En curso | 0 |',
    '| Cerrado | 29 |',
    '| Aceptado | 1 |'
) -join "`r`n"
$resNuevo = @(
    '| Estado | Cantidad |',
    '|---|---|',
    '| Abierto | 16 |',
    '| En curso | 0 |',
    '| Cerrado | 30 |',
    '| Aceptado | 1 |'
) -join "`r`n"
if ($track.Contains($resViejo)) {
    $track = $track.Replace($resViejo, $resNuevo)
    Write-Ok 'Resumen: Cerrado 29 -> 30'
} else {
    Write-Skip 'Resumen (Cerrado 29) no matcheo'
}

# 4c. Severidad: Baja 7/1 -> 7/2
$sevViejo = @(
    '| Severidad | Cantidad | Cerrados |',
    '|---|---|---|',
    '| Critica | 9 | 7 |',
    '| Alta | 11 | 7 |',
    '| Media | 16 | 5 |',
    '| Baja | 7 | 1 |'
) -join "`r`n"
$sevNuevo = @(
    '| Severidad | Cantidad | Cerrados |',
    '|---|---|---|',
    '| Critica | 9 | 7 |',
    '| Alta | 11 | 7 |',
    '| Media | 16 | 5 |',
    '| Baja | 7 | 2 |'
) -join "`r`n"
if ($track.Contains($sevViejo)) {
    $track = $track.Replace($sevViejo, $sevNuevo)
    Write-Ok 'Severidad: Baja 7/1 -> 7/2'
} else {
    Write-Skip 'Severidad (Baja 7/1) no matcheo'
}

if ($Commit) {
    Backup-File $trackPath $stamp
    Write-FileRaw $trackPath $track
    Write-Ok 'Tracking escrito'
} else {
    Write-Host '   (dry run: tracking NO escrito)' -ForegroundColor DarkYellow
}

# ============================================================================
# 5. Actualizar STATUS.md
# ============================================================================

Write-Step 'Actualizar STATUS.md'

$statusPath = Join-Path $RepoRoot 'docs\STATUS.md'
$status = Read-FileRaw $statusPath

$statusMetricaVieja = '| Hallazgos cerrados | 29 / 46 | 46 / 46 |'
$statusMetricaNueva = '| Hallazgos cerrados | 30 / 46 | 46 / 46 |'

if ($status.Contains($statusMetricaNueva)) {
    Write-Skip 'STATUS.md ya tiene 30/46'
} elseif ($status.Contains($statusMetricaVieja)) {
    $status = $status.Replace($statusMetricaVieja, $statusMetricaNueva)
    if ($Commit) {
        Backup-File $statusPath $stamp
        Write-FileRaw $statusPath $status
        Write-Ok 'STATUS.md actualizado'
    } else {
        Write-Host '   (dry run: STATUS.md NO escrito)' -ForegroundColor DarkYellow
    }
} else {
    Write-Warn 'No encontre la metrica 29/46 en STATUS.md'
}

# ============================================================================
# 6. Verificacion post (solo si Commit)
# ============================================================================

if ($Commit) {
    Write-Step 'Verificacion post'

    $s29Post = Read-FileRaw $script29Path
    $d24Post = Read-FileRaw $doc24Path
    $trkPost = Read-FileRaw $trackPath
    $staPost = Read-FileRaw $statusPath

    $checks = @(
        @{ n = 'Script 29: linea con bug eliminada';  ok = -not $s29Post.Contains('Write-Ok ($modified + '' archivos modificados'')') },
        @{ n = 'Script 29: fix aplicado';             ok = $s29Post.Contains('Write-Ok "$modified archivos modificados"') },
        @{ n = 'Doc 24: seccion cierre';              ok = $d24Post.Contains('## 9. Cierre de BUG-011') },
        @{ n = 'Doc 24: causa raiz documentada';      ok = $d24Post.Contains('Causa raiz') },
        @{ n = 'Doc 24: versionado documentado';      ok = $d24Post.Contains('### Versionado') },
        @{ n = 'Tracking: BUG-011 Cerrado';           ok = $trkPost.Contains('| BUG-011 |') -and $trkPost.Contains('| F3 | P3 | Cerrado | (S15) |') },
        @{ n = 'Tracking: Cerrado 30';                ok = $trkPost.Contains('| Cerrado | 30 |') },
        @{ n = 'Tracking: Baja 7/2';                  ok = $trkPost.Contains('| Baja | 7 | 2 |') },
        @{ n = 'STATUS: 30/46';                       ok = $staPost.Contains('| Hallazgos cerrados | 30 / 46 | 46 / 46 |') }
    )

    $fails = @($checks | Where-Object { -not $_.ok })
    if ($fails.Count -eq 0) {
        Write-Ok ($checks.Count.ToString() + '/' + $checks.Count.ToString() + ' checks OK')
    } else {
        Write-Err ($fails.Count.ToString() + ' checks fallaron:')
        $fails | ForEach-Object { Write-Err ('  - ' + $_.n) }
        Pop-Location
        exit 1
    }
}

# ============================================================================
# 7. Commit + push
# ============================================================================

Write-Step 'Commit'

if (-not $Commit) {
    Write-Host '   Dry run. Nada escrito, nada commiteado.' -ForegroundColor DarkYellow
    Write-Host '   Para aplicar: .\37-fix-bug-011.ps1 -Commit' -ForegroundColor DarkYellow
    Pop-Location
    exit 0
}

# Versionar el script 29 + actualizar docs
git add -- scripts/docs/29-fix-logger-import.ps1
git add -- docs/audits/2026-10-13-inicial/24-bugs-s14-gemini-y-otros.md
git add -- docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md
git add -- docs/STATUS.md

$staged = @(git diff --cached --name-only)
if ($staged.Count -eq 0) {
    Write-Skip 'Nada staged. No hay commit.'
    Pop-Location
    exit 0
}
Write-Ok ('Archivos staged: ' + $staged.Count)
$staged | ForEach-Object { Write-Host ('     - ' + $_) -ForegroundColor DarkGray }

$msg = 'fix(scripts): corregir bug en 29-fix-logger-import.ps1 (BUG-011)'
git commit -m $msg
if ($LASTEXITCODE -ne 0) { Write-Err 'git commit fallo'; Pop-Location; exit 1 }

git push origin main
if ($LASTEXITCODE -ne 0) { Write-Err 'git push fallo'; Pop-Location; exit 1 }

Write-Ok ('Commit pusheado: ' + $msg)
Write-Host ''
Write-Host 'BUG-011 cerrado COMPLETO.' -ForegroundColor Cyan
Write-Host 'Proximo paso: 38-trazabilidad-sec-018-019.ps1' -ForegroundColor Cyan

Pop-Location