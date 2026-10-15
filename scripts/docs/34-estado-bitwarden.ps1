# ============================================================================
# 34-estado-bitwarden.ps1
# ----------------------------------------------------------------------------
# Documenta el estado de Bitwarden al cierre de S14 (3/12 items completos)
# y registra SEC-020 en el tracking.
#
# Actualiza:
#   - docs/operations/ROTACION-CLAVES.md  (nueva seccion "Estado Bitwarden")
#   - docs/operations/ENVIRONMENT.md      (referencia a la seccion nueva)
#   - docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md
#       -> agrega fila SEC-020 (Media, P2, Abierto)
#       -> Total 44 -> 45
#       -> Abierto 15 -> 16
#       -> Media 14 -> 15
#
# NO commitea.
# Fecha: 2026-10-14
# ----------------------------------------------------------------------------
# Uso:
#   Dry run:  .\34-estado-bitwarden.ps1
#   Aplicar:  .\34-estado-bitwarden.ps1 -Commit
# ============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BackupDir = Join-Path $PSScriptRoot '.backup-s14'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-Step([string]$m) { Write-Host ''; Write-Host ('== ' + $m) -ForegroundColor Cyan }
function Write-Ok([string]$m)   { Write-Host ('   [OK]   ' + $m) -ForegroundColor Green }
function Write-Skip([string]$m) { Write-Host ('   [SKIP] ' + $m) -ForegroundColor Yellow }
function Write-Err([string]$m)  { Write-Host ('   [ERR]  ' + $m) -ForegroundColor Red }

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
# 1. ROTACION-CLAVES.md - agregar seccion "Estado Bitwarden"
# ============================================================================

Write-Step 'Actualizar docs/operations/ROTACION-CLAVES.md'

$rotPath = Join-Path $RepoRoot 'docs\operations\ROTACION-CLAVES.md'
if (-not (Test-Path -LiteralPath $rotPath)) {
    Write-Err 'ROTACION-CLAVES.md no existe'
    Pop-Location
    exit 1
}

$rot = Read-FileRaw $rotPath

if ($rot.Contains('Estado de Bitwarden al cierre de S14')) {
    Write-Skip 'Seccion "Estado de Bitwarden" ya existe en ROTACION-CLAVES.md'
} else {
    $rotSeccion = @(
        '',
        '---',
        '',
        '## Estado de Bitwarden al cierre de S14 (2026-10-14)',
        '',
        '**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion',
        '',
        '### Items completos (3/12)',
        '',
        '| # | Item | Usuario | Estado | Fecha |',
        '|---|---|---|---|---|',
        '| 1 | Supabase - Produccion | system.panfree | OK | 2026-10-14 (S14) |',
        '| 2 | Cloudinary - Produccion | system.panfree | OK | 2026-10-14 (S14) |',
        '| 3 | Gemini - Produccion | system.panfree | OK | 2026-10-14 (S14) |',
        '',
        '### Items pendientes (9/12)',
        '',
        'Se completan **durante la rotacion** en S15. No se cargan ahora con',
        'valores viejos: cuando se rote cada servicio, la key nueva se guarda',
        'en Bitwarden (Produccion) y la vieja en Bitwarden (Legado) en el',
        'mismo flujo.',
        '',
        '| # | Item | Cuenta | Bloquea rotacion |',
        '|---|---|---|---|',
        '| 4 | Resend - Produccion | [S] | F2-05 |',
        '| 5 | Meta WhatsApp - Produccion | [S] | F2-07 |',
        '| 6 | Twilio - Produccion | [S] | F2-08 |',
        '| 7 | Instagram - Produccion | [S] | F2-09 |',
        '| 8 | n8n - Produccion | [S] | F2-10 |',
        '| 9 | GA4 - Produccion | [S] | F2-11 |',
        '| 10 | Clarity - Produccion | [S] | (no bloquea rotacion) |',
        '| 11 | VAPID - Produccion | [S] | F2-12 |',
        '| 12 | Secrets internos - Produccion (CRON_SECRET, WEBHOOK_SECRET) | [S] | F2-13 / F4-06 |',
        '',
        '### Item pendiente: nota de auditoria (no rotable)',
        '',
        '| Item | Tipo | Contenido |',
        '|---|---|---|',
        '| APIs IA secundarias - Auditoria | Nota segura | Lista de las 14 APIs (Anthropic, Mistral, Groq, etc.) sin valores. Solo para tracking de F2-13. |',
        '',
        '### Hallazgo asociado',
        '',
        'SEC-020: 9 items Bitwarden pendientes. Se resuelven como subproducto',
        'de la rotacion en S15 (un servicio por commit).',
        ''
    ) -join "`r`n"

    if ($Commit) {
        Backup-File $rotPath $stamp
        $rot = $rot.TrimEnd() + "`r`n" + $rotSeccion
        Write-FileRaw $rotPath $rot
        Write-Ok 'ROTACION-CLAVES.md actualizado'
    } else {
        Write-Host '   (dry run: ROTACION-CLAVES.md NO escrito)' -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 2. ENVIRONMENT.md - agregar referencia
# ============================================================================

Write-Step 'Actualizar docs/operations/ENVIRONMENT.md'

$envPath = Join-Path $RepoRoot 'docs\operations\ENVIRONMENT.md'
if (-not (Test-Path -LiteralPath $envPath)) {
    Write-Err 'ENVIRONMENT.md no existe'
    Pop-Location
    exit 1
}

$envDoc = Read-FileRaw $envPath

if ($envDoc.Contains('Estado de Bitwarden')) {
    Write-Skip 'Seccion "Estado de Bitwarden" ya existe en ENVIRONMENT.md'
} else {
    $envSeccion = @(
        '',
        '## Estado de Bitwarden',
        '',
        'Ver seccion "Estado de Bitwarden al cierre de S14" en',
        '[ROTACION-CLAVES.md](./ROTACION-CLAVES.md).',
        '',
        'Al 2026-10-14 (S14): 3/12 items completos (Supabase, Cloudinary,',
        'Gemini). Los 9 restantes se completan durante la rotacion (S15)',
        'en el mismo flujo: rotar en el dashboard + guardar en Bitwarden',
        '(Produccion) + guardar viejo en Bitwarden (Legado).',
        ''
    ) -join "`r`n"

    if ($Commit) {
        Backup-File $envPath $stamp
        $envDoc = $envDoc.TrimEnd() + "`r`n" + $envSeccion
        Write-FileRaw $envPath $envDoc
        Write-Ok 'ENVIRONMENT.md actualizado'
    } else {
        Write-Host '   (dry run: ENVIRONMENT.md NO escrito)' -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 3. Tracking - agregar SEC-020 + actualizar contadores
# ============================================================================

Write-Step 'Actualizar tracking con SEC-020'

$trackPath = Join-Path $RepoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
if (-not (Test-Path -LiteralPath $trackPath)) {
    Write-Err '06-hallazgos-tracking.md no existe'
    Pop-Location
    exit 1
}

$track = Read-FileRaw $trackPath

if ($track.Contains('SEC-020')) {
    Write-Skip 'SEC-020 ya presente en tracking'
} else {
    # 3a. Total 44 -> 45
    $t44 = '**Total de hallazgos:** 44'
    $t45 = '**Total de hallazgos:** 45'
    if (-not $track.Contains($t44)) {
        Write-Err 'No encontre Total=44'
        Pop-Location
        exit 1
    }
    $track = $track.Replace($t44, $t45)

    # 3b. Resumen: Abierto 15 -> 16
    $resViejo = @(
        '| Estado | Cantidad |',
        '|---|---|',
        '| Abierto | 15 |',
        '| En curso | 0 |',
        '| Cerrado | 28 |',
        '| Aceptado | 1 |'
    ) -join "`r`n"
    $resNuevo = @(
        '| Estado | Cantidad |',
        '|---|---|',
        '| Abierto | 16 |',
        '| En curso | 0 |',
        '| Cerrado | 28 |',
        '| Aceptado | 1 |'
    ) -join "`r`n"
    if (-not $track.Contains($resViejo)) {
        Write-Err 'No encontre resumen (Abierto 15)'
        Pop-Location
        exit 1
    }
    $track = $track.Replace($resViejo, $resNuevo)

    # 3c. Severidad: Media 14 -> 15
    $sevViejo = @(
        '| Severidad | Cantidad | Cerrados |',
        '|---|---|---|',
        '| Critica | 9 | 7 |',
        '| Alta | 11 | 7 |',
        '| Media | 14 | 4 |',
        '| Baja | 7 | 1 |'
    ) -join "`r`n"
    $sevNuevo = @(
        '| Severidad | Cantidad | Cerrados |',
        '|---|---|---|',
        '| Critica | 9 | 7 |',
        '| Alta | 11 | 7 |',
        '| Media | 15 | 4 |',
        '| Baja | 7 | 1 |'
    ) -join "`r`n"
    if (-not $track.Contains($sevViejo)) {
        Write-Err 'No encontre severidad (Media 14/4)'
        Pop-Location
        exit 1
    }
    $track = $track.Replace($sevViejo, $sevNuevo)

    # 3d. Insertar fila SEC-020 al final de "Hallazgos medios" (despues de SEC-019)
    $anclaMedios = '| SEC-019 | 4 API keys activas en Gemini sin trazabilidad | F2 | P2 | Abierto | - |'
    $filaSEC020  = '| SEC-020 | 9 items Bitwarden pendientes (se completan durante rotacion S15) | F2 | P2 | Abierto | - |'
    if (-not $track.Contains($anclaMedios)) {
        Write-Err 'No encontre ancla de medios (SEC-019)'
        Pop-Location
        exit 1
    }
    $track = $track.Replace($anclaMedios, $anclaMedios + "`r`n" + $filaSEC020)

    if ($Commit) {
        Backup-File $trackPath $stamp
        Write-FileRaw $trackPath $track
        Write-Ok 'Tracking actualizado (SEC-020 + contadores)'
    } else {
        Write-Host '   (dry run: tracking NO escrito)' -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 4. Verificacion post (solo si Commit)
# ============================================================================

if ($Commit) {
    Write-Step 'Verificacion post'

    $rotPost = Read-FileRaw $rotPath
    $envPost = Read-FileRaw $envPath
    $trkPost = Read-FileRaw $trackPath

    $checks = @(
        @{ n = 'ROTACION tiene seccion S14'; ok = $rotPost.Contains('Estado de Bitwarden al cierre de S14') },
        @{ n = 'ROTACION 3/12';              ok = $rotPost.Contains('Items completos (3/12)') },
        @{ n = 'ROTACION 9/12';              ok = $rotPost.Contains('Items pendientes (9/12)') },
        @{ n = 'ENVIRONMENT ref';            ok = $envPost.Contains('Estado de Bitwarden') },
        @{ n = 'Tracking Total 45';          ok = $trkPost.Contains('**Total de hallazgos:** 45') },
        @{ n = 'Tracking Abierto 16';        ok = $trkPost.Contains('| Abierto | 16 |') },
        @{ n = 'Tracking Media 15/4';        ok = $trkPost.Contains('| Media | 15 | 4 |') },
        @{ n = 'Tracking SEC-020';           ok = $trkPost.Contains('SEC-020') }
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

Write-Step 'Fin'
if (-not $Commit) {
    Write-Host '   Dry run OK. Nada escrito.' -ForegroundColor DarkYellow
    Write-Host '   Para aplicar: .\34-estado-bitwarden.ps1 -Commit' -ForegroundColor DarkYellow
} else {
    Write-Host '   3 archivos actualizados. NO commiteado.' -ForegroundColor Cyan
    Write-Host '   Proximo paso: 35-cierre-s14-final.ps1' -ForegroundColor Cyan
}

Pop-Location