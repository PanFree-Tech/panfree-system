# ============================================================================
# scripts/docs/26a-fix-f3-06-logger.ps1  (v2 - fix imports multilinea)
# F3-06 / DBG-001: silenciar console.log y console.warn en produccion
# Crea src/lib/logger.js y reemplaza console.* por logger.* en src/.
# Idempotente. Dry-run por defecto. -Commit para commitear y pushear.
# ============================================================================
[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root

$loggerPath = Join-Path $root 'src\lib\logger.js'
$utf8 = New-Object System.Text.UTF8Encoding($false)

# ----------------------------------------------------------------------------
# 1. Contenido de src/lib/logger.js
# ----------------------------------------------------------------------------
$loggerLines = @(
    '/**',
    ' * Logger central de PanFree System.',
    ' *',
    ' * - En desarrollo: emite log, warn y error normalmente.',
    ' * - En produccion: silencia log y warn, mantiene error para observabilidad.',
    ' *',
    ' * Uso: import { log, warn, error } from ''@/lib/logger''',
    ' */',
    '',
    'const IS_PROD = process.env.NODE_ENV === ''production''',
    '',
    'export function log(...args) {',
    '  if (!IS_PROD) console.log(...args)',
    '}',
    '',
    'export function warn(...args) {',
    '  if (!IS_PROD) console.warn(...args)',
    '}',
    '',
    'export function error(...args) {',
    '  console.error(...args)',
    '}',
    '',
    'export default { log, warn, error }'
)
$loggerContent = ($loggerLines -join "`r`n") + "`r`n"

# ----------------------------------------------------------------------------
# 2. Recolectar archivos objetivo
# ----------------------------------------------------------------------------
$targets = Get-ChildItem -Path (Join-Path $root 'src') -Recurse -Include *.js,*.jsx |
    Where-Object { $_.FullName -ne $loggerPath }

$totalArchivos = 0
$totalReemplazos = 0
$detalle = @()

foreach ($f in $targets) {
    $txt = [System.IO.File]::ReadAllText($f.FullName, $utf8)

    $n1 = ([regex]::Matches($txt, [regex]::Escape('console.log('))).Count
    $n2 = ([regex]::Matches($txt, [regex]::Escape('console.warn('))).Count
    $n3 = ([regex]::Matches($txt, [regex]::Escape('console.error('))).Count

    $count = $n1 + $n2 + $n3
    if ($count -eq 0) { continue }

    if ($n1 -gt 0) { $txt = $txt.Replace('console.log(',   'logger.log(')   }
    if ($n2 -gt 0) { $txt = $txt.Replace('console.warn(',  'logger.warn(')  }
    if ($n3 -gt 0) { $txt = $txt.Replace('console.error(', 'logger.error(') }

    $totalArchivos++
    $totalReemplazos += $count
    $detalle += [pscustomobject]@{
        Archivo = $f.FullName.Replace($root + '\', '')
        Log     = $n1
        Warn    = $n2
        Error   = $n3
        Total   = $count
    }

    if ($Commit) {
        [System.IO.File]::WriteAllText($f.FullName, $txt, $utf8)
    }
}

# ----------------------------------------------------------------------------
# 3. Crear logger.js (idempotente)
# ----------------------------------------------------------------------------
$loggerExiste = Test-Path -LiteralPath $loggerPath

if (-not $loggerExiste -and $Commit) {
    $loggerDir = Split-Path $loggerPath -Parent
    if (-not (Test-Path -LiteralPath $loggerDir)) {
        New-Item -ItemType Directory -Path $loggerDir -Force | Out-Null
    }
    [System.IO.File]::WriteAllText($loggerPath, $loggerContent, $utf8)
}

# ----------------------------------------------------------------------------
# 4. Insertar import de logger (solo donde falte)
#    Maneja imports multilinea: detecta "import {" y busca el cierre "} from"
# ----------------------------------------------------------------------------
$importLinea = "import { log, warn, error } from '@/lib/logger'"
$archivosConImport = 0
$archivosSalteados = 0
$archivosError = 0

foreach ($d in $detalle) {
    $full = Join-Path $root $d.Archivo
    $txt = [System.IO.File]::ReadAllText($full, $utf8)

    if ($txt.Contains("@/lib/logger")) { continue }

    # Detectar EOL
    $eol = if ($txt.Contains("`r`n")) { "`r`n" } else { "`n" }
    $lineas = $txt -split "\r?\n", 0
    $lineasOriginales = $lineas.Count
        $importsOriginales = @($lineas | Where-Object { $_ -match '^\s*import\s' }).Count

    # Encontrar donde insertar
    $insertIdx = -1

    # Caso A: primer import simple (una linea) que arranca con "import " y NO es multilinea
    for ($i = 0; $i -lt $lineas.Count; $i++) {
        if ($lineas[$i] -match '^\s*import\s') {
            # ¿Es multilinea? (termina con "{" y no cierra en la misma linea)
            if ($lineas[$i] -match '^\s*import\s*\{\s*$') {
                # buscar cierre "} from '...'" o similar
                $cierre = -1
                for ($j = $i + 1; $j -lt $lineas.Count; $j++) {
                    if ($lineas[$j] -match '\}\s*from\s*[''"]') {
                        $cierre = $j
                        break
                    }
                }
                if ($cierre -ge 0) {
                    $insertIdx = $cierre + 1
                } else {
                    # no encontro cierre: saltear
                    $insertIdx = -1
                }
            } else {
                $insertIdx = $i
            }
            break
        }
    }

    # Caso B: sin imports, con 'use client' arriba
    if ($insertIdx -lt 0 -and $lineas.Count -gt 0 -and $lineas[0] -match "^'use client'") {
        $insertIdx = 1
    }

    # Caso C: sin imports ni 'use client'
    if ($insertIdx -lt 0) {
        $insertIdx = 0
    }

    # Armar el nuevo contenido
    $nuevas = @()
    if ($insertIdx -gt 0) {
        $nuevas += $lineas[0..($insertIdx - 1)]
    }
    $nuevas += $importLinea
    if ($insertIdx -lt $lineas.Count) {
        $nuevas += $lineas[$insertIdx..($lineas.Count - 1)]
    }
    $nuevoTxt = ($nuevas -join $eol)

    # Validacion: el conteo de imports debe haber aumentado en 1
    $importsNuevos = @(($nuevoTxt -Split "\r?\n", 0) | Where-Object { $_ -Match '^\s*import\s' }).Count
    if ($importsNuevos -ne ($importsOriginales + 1)) {
        Write-Host ("  [SKIP] " + $d.Archivo + " -> imports " + $importsOriginales + " -> " + $importsNuevos) -ForegroundColor Red
        $archivosError++
        continue
    }

    if ($Commit) {
        [System.IO.File]::WriteAllText($full, $nuevoTxt, $utf8)
    }
    $archivosConImport++
}

# ----------------------------------------------------------------------------
# 5. Reporte
# ----------------------------------------------------------------------------
Write-Host ''
Write-Host '=== F3-06 / DBG-001 - Resumen ===' -ForegroundColor Cyan
Write-Host ("Modo:                " + $(if ($Commit) { 'COMMIT (aplicado)' } else { 'DRY RUN (sin cambios)' }))
Write-Host ("logger.js existe:    " + $loggerExiste)
Write-Host ("Archivos afectados:  " + $totalArchivos)
Write-Host ("Reemplazos totales:  " + $totalReemplazos)
Write-Host ("Con import:          " + $archivosConImport)
Write-Host ("Salteados:           " + $archivosSalteados)
Write-Host ("Con error:           " + $archivosError)
Write-Host ''

if ($detalle.Count -gt 0) {
    Write-Host 'Detalle por archivo (top 15):' -ForegroundColor Yellow
    $detalle | Sort-Object Total -Descending | Select-Object -First 15 | Format-Table -AutoSize
}

# ----------------------------------------------------------------------------
# 6. Triaje PII (solo lectura)
# ----------------------------------------------------------------------------
Write-Host ''
Write-Host '=== Triaje PII (solo lectura) ===' -ForegroundColor Cyan
Write-Host 'Buscando: email|token|password|key|secret|userId|cliente|phone|whatsapp'
Write-Host ''

$piiPattern = 'email|token|password|key|secret|userId|cliente|phone|whatsapp'
$hitsTotales = 0

foreach ($d in $detalle) {
    $full = Join-Path $root $d.Archivo
    $lineas = [System.IO.File]::ReadAllLines($full, $utf8)
    for ($i = 0; $i -lt $lineas.Count; $i++) {
        $l = $lineas[$i]
        if ($l -match '(console|logger)\.(log|warn|error)\(' -and $l -match $piiPattern) {
            $hitsTotales++
        }
    }
}
Write-Host ("Total hits PII potenciales: " + $hitsTotales) -ForegroundColor Magenta

# ----------------------------------------------------------------------------
# 7. Commit + push (solo con -Commit)
# ----------------------------------------------------------------------------
if ($Commit) {
    Write-Host ''
    if ($archivosError -gt 0) {
        Write-Host ("ABORTADO: " + $archivosError + " archivos con error de import. Revisar y re-correr.") -ForegroundColor Red
        return
    }
    git add src/lib/logger.js
    git add src/
    git commit -m "security(logger): silenciar console.log/warn en produccion (DBG-001, F3-06)"
    git push origin main
} else {
    Write-Host ''
    Write-Host 'Para aplicar: .\scripts\docs\26a-fix-f3-06-logger.ps1 -Commit' -ForegroundColor Green
}