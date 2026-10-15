# 42b-actualizar-politica-rotacion.ps1
# Chore S16: formalizar politica de rotacion sin legacy (parte B).
# Toca: SISTEMA-DE-TRABAJO.md, GESTION-DE-RIESGOS.md.
# Patron S14/S15: -Commit opcional (dry-run por defecto), backup, idempotencia, verificacion.

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'

# --- Paths ---------------------------------------------------------------
$repoRoot    = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$sistemaPath = Join-Path $repoRoot 'docs\operations\SISTEMA-DE-TRABAJO.md'
$riesgosPath = Join-Path $repoRoot 'docs\operations\GESTION-DE-RIESGOS.md'
$backupDir   = Join-Path $repoRoot 'scripts\docs\.backup-s16'

# --- Helpers -------------------------------------------------------------
function Write-Step  { param($m) Write-Host ">> $m" -ForegroundColor Cyan }
function Write-Ok    { param($m) Write-Host "   OK  $m" -ForegroundColor Green }
function Write-Skip  { param($m) Write-Host "   --  $m" -ForegroundColor DarkGray }
function Write-Warn2 { param($m) Write-Host "   !!  $m" -ForegroundColor Yellow }
function Write-Fail  { param($m) Write-Host "   XX  $m" -ForegroundColor Red }

function Backup-File {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return }
    if (-not (Test-Path -LiteralPath $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    }
    $leaf = Split-Path -Leaf $Path
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $dest = Join-Path $backupDir ("{0}.{1}.bak" -f $leaf, $stamp)
    Copy-Item -LiteralPath $Path -Destination $dest -Force
}

function Read-Utf8 {
    param([string]$Path)
    return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $enc)
}

# --- Verificar prerequisitos --------------------------------------------
Write-Step 'Verificando prerequisitos'
$missing = @()
foreach ($p in @($sistemaPath, $riesgosPath)) {
    if (-not (Test-Path -LiteralPath $p)) { $missing += $p }
}
if ($missing.Count -gt 0) {
    foreach ($m in $missing) { Write-Fail "No existe: $m" }
    throw 'Faltan archivos prerequisito. Abortando.'
}
Write-Ok 'Los 2 archivos existen'

if (-not $Commit) {
    Write-Warn2 'MODO DRY-RUN (no se escriben cambios). Usar -Commit para aplicar.'
}

# =========================================================================
# 1. SISTEMA-DE-TRABAJO.md: agregar seccion 7.4
# =========================================================================
Write-Step 'Procesando SISTEMA-DE-TRABAJO.md'
$sis = Read-Utf8 $sistemaPath
$sisOriginal = $sis

# Ancla: la seccion 7.3 termina con "- Prefixes: feat, fix, docs, chore, refactor, security, perf"
$anchor = @(
    '### 7.3 Commits',
    '',
    '- Conventional Commits',
    '- Un commit por tarea',
    '- Prefixes: feat, fix, docs, chore, refactor, security, perf'
) -join "`r`n"

$replacement = @(
    '### 7.3 Commits',
    '',
    '- Conventional Commits',
    '- Un commit por tarea',
    '- Prefixes: feat, fix, docs, chore, refactor, security, perf',
    '',
    '### 7.4 Politica de rotacion de claves',
    '',
    '- Una sola coleccion en Bitwarden: Organizacion PanFree -> Produccion.',
    '- No existe coleccion "Legado". Las keys salientes NO se guardan en',
    '  un item aparte: se revocan en el dashboard y se registran en la NOTA',
    '  del item de Produccion.',
    '- La nota del item incluye: key saliente COMPLETA + fecha de revocacion',
    '  + tarea (F2-XX) + motivo + hash del commit.',
    '- El rollback NO restaura keys viejas (ya revocadas). Es rotacion de',
    '  emergencia: crear key nueva + actualizar Vercel + redeploy.',
    '- Detalle completo en docs/operations/ROTACION-CLAVES.md.'
) -join "`r`n"

if ($sis.Contains('### 7.4 Politica de rotacion de claves')) {
    Write-Skip 'Seccion 7.4 ya existe'
} elseif ($sis.Contains($anchor)) {
    $sis = $sis.Replace($anchor, $replacement)
    Write-Ok 'Seccion 7.4 agregada'
} else {
    Write-Fail 'Ancla de seccion 7.3 no encontrada'
    throw 'SISTEMA-DE-TRABAJO.md: ancla no encontrada.'
}

if ($sis -ne $sisOriginal) {
    if ($Commit) {
        Backup-File $sistemaPath
        Write-Utf8NoBom $sistemaPath $sis
        Write-Ok 'SISTEMA-DE-TRABAJO.md escrito'
    } else {
        Write-Warn2 'SISTEMA-DE-TRABAJO.md cambiaria (dry-run)'
    }
} else {
    Write-Skip 'SISTEMA-DE-TRABAJO.md sin cambios'
}

# =========================================================================
# 2. GESTION-DE-RIESGOS.md: actualizar R-01 y R-05
# =========================================================================
Write-Step 'Procesando GESTION-DE-RIESGOS.md'
$rie = Read-Utf8 $riesgosPath
$rieOriginal = $rie

# 2.1 R-01: quitar "Guardar claves viejas en Bitwarden (coleccion Legado) ANTES de rotar"
$r01Old = '- Guardar claves viejas en Bitwarden (coleccion Legado) ANTES de rotar'
$r01New = @(
    '- Rotar en horario de bajo trafico',
    '- Verificar la key nueva ANTES de revocar la vieja (test empirico + Logs)',
    '- La key vieja se revoca recien cuando la nueva esta confirmada en produccion'
) -join "`r`n"

if ($rie.Contains($r01New.Split("`r`n")[0])) {
    Write-Skip 'R-01 ya actualizado'
} elseif ($rie.Contains($r01Old)) {
    $rie = $rie.Replace($r01Old, $r01New)
    Write-Ok 'R-01 actualizado (mitigacion sin "Legado")'
} else {
    Write-Skip 'R-01 linea vieja no encontrada'
}

# 2.2 R-01: quitar del plan de contingencia "Restaurar claves viejas en Vercel"
$r01PlanOld = @(
    '**Plan de contingencia:**',
    '1. Restaurar claves viejas en Vercel',
    '2. Redeploy',
    '3. Investigar con calma'
) -join "`r`n"

$r01PlanNew = @(
    '**Plan de contingencia:**',
    '1. Rotacion de emergencia: crear key nueva en el dashboard',
    '2. Actualizar Vercel',
    '3. Redeploy',
    '4. Investigar con calma (la key comprometida ya fue revocada)'
) -join "`r`n"

if ($rie.Contains($r01PlanNew.Split("`r`n")[0]) -and $rie.Contains('la key comprometida ya fue revocada')) {
    Write-Skip 'R-01 plan de contingencia ya actualizado'
} elseif ($rie.Contains($r01PlanOld)) {
    $rie = $rie.Replace($r01PlanOld, $r01PlanNew)
    Write-Ok 'R-01 plan de contingencia actualizado'
} else {
    Write-Skip 'R-01 plan de contingencia viejo no encontrado'
}

# 2.3 R-05: actualizar plan de contingencia.
$r05PlanOld = @(
    '**Plan de contingencia:**',
    '1. Usar el JSON exportado',
    '2. Si no: recuperar desde los dashboards de cada servicio',
    '3. Ultimo recurso: rotar TODO desde cero'
) -join "`r`n"

$r05PlanNew = @(
    '**Plan de contingencia:**',
    '1. Usar el JSON exportado',
    '2. Si no: recuperar desde los dashboards de cada servicio',
    '3. Ultimo recurso: rotar TODO desde cero',
    '',
    'Nota S16: no existe coleccion "Legado". El historial de rotaciones',
    'vive en la nota de cada item (key saliente completa + fecha + motivo).',
    'Un export de la boveda (JSON encriptado) ya incluye esas notas; no hay',
    'una coleccion separada que respaldar.'
) -join "`r`n"

if ($rie.Contains('Nota S16: no existe coleccion "Legado"')) {
    Write-Skip 'R-05 ya actualizado'
} elseif ($rie.Contains($r05PlanOld)) {
    $rie = $rie.Replace($r05PlanOld, $r05PlanNew)
    Write-Ok 'R-05 actualizado'
} else {
    Write-Skip 'R-05 bloque no encontrado'
}

# 2.4 Tabla de matriz: no hay cambios necesarios (R-01, R-05 siguen Mitigado).
#      Solo verificamos que no queden menciones a "Legado".
$legacyCount = ([regex]::Matches($rie, 'Legado')).Count
if ($legacyCount -gt 0) {
    Write-Warn2 ("Quedan {0} menciones a 'Legado' (revisar manualmente)" -f $legacyCount)
} else {
    Write-Ok 'Sin menciones a "Legado" en GESTION-DE-RIESGOS.md'
}

if ($rie -ne $rieOriginal) {
    if ($Commit) {
        Backup-File $riesgosPath
        Write-Utf8NoBom $riesgosPath $rie
        Write-Ok 'GESTION-DE-RIESGOS.md escrito'
    } else {
        Write-Warn2 'GESTION-DE-RIESGOS.md cambiaria (dry-run)'
    }
} else {
    Write-Skip 'GESTION-DE-RIESGOS.md sin cambios'
}

# =========================================================================
# Verificacion post-write
# =========================================================================
Write-Step 'Verificacion post-write'
if ($Commit) {
    $checks = @(
        @{ Path = $sistemaPath; Must = @('### 7.4 Politica de rotacion de claves','No existe coleccion "Legado"','Es rotacion de') },
        @{ Path = $riesgosPath; Must = @('la key comprometida ya fue revocada','Nota S16: no existe coleccion "Legado"') }
    )
    $fail = 0
    foreach ($c in $checks) {
        $txt = Read-Utf8 $c.Path
        foreach ($needle in $c.Must) {
            if ($txt.Contains($needle)) {
                Write-Ok ("{0} contiene: {1}" -f (Split-Path -Leaf $c.Path), $needle)
            } else {
                Write-Fail ("{0} NO contiene: {1}" -f (Split-Path -Leaf $c.Path), $needle)
                $fail++
            }
        }
    }
    # Chequeo extra: 0 menciones a "Legado" fuera de la nota historica de R-05
    $rieCheck = Read-Utf8 $riesgosPath
    $sisCheck = Read-Utf8 $sistemaPath
    if ($sisCheck.Contains('Legado') -and -not $sisCheck.Contains('No existe coleccion "Legado"')) {
        Write-Fail 'SISTEMA-DE-TRABAJO.md: mencion a "Legado" sin contexto'
        $fail++
    } else {
        Write-Ok 'SISTEMA-DE-TRABAJO.md: menciones a "Legado" son contextuales'
    }
    if ($fail -gt 0) { throw "Verificacion fallo ($fail checks)" }
    Write-Ok 'Todos los checks pasaron'
} else {
    Write-Skip 'Verificacion omitida en dry-run'
}

# =========================================================================
# Commit (si -Commit)
# =========================================================================
if ($Commit) {
    Write-Step 'Git status'
    Push-Location $repoRoot
    try {
        git status --short
        git add docs/operations/SISTEMA-DE-TRABAJO.md `
                docs/operations/GESTION-DE-RIESGOS.md
        git commit -m 'docs(ops): documentar politica de rotacion en sistema y riesgos (S16)'
        Write-Ok 'Commit creado. Pushear manualmente con: git push origin main'
    } finally {
        Pop-Location
    }
} else {
    Write-Warn2 'Dry-run finalizado. Revisar y luego correr con -Commit.'
}