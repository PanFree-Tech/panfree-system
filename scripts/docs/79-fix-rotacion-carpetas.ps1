# scripts/docs/79-fix-rotacion-carpetas.ps1
# S23 - Homogeneizar modelo Bitwarden en ROTACION-CLAVES.md
# Cambios:
#   1. Nota aclaratoria antes de S14
#   2. S20: "Coleccion + Carpeta" -> "Carpetas + Fuente de verdad"
#   3. S21: idem
#   4. S22: "Coleccion" -> "Carpetas + Fuente de verdad"
# NO toca S14-S19 (historia preservada).
# Idempotente. Uso: powershell -ExecutionPolicy Bypass -File scripts\docs\79-fix-rotacion-carpetas.ps1 [-NoCommit]

[CmdletBinding()]
param(
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$archivo = "docs\operations\ROTACION-CLAVES.md"

if (-not (Test-Path $archivo)) {
    Write-Host "[ERROR] No existe: $archivo" -ForegroundColor Red
    exit 1
}

$lineas = Get-Content $archivo
$total = $lineas.Count
Write-Host "[INFO] Total de lineas: $total" -ForegroundColor DarkGray

# --- Idempotencia: si ya existe "**Fuente de verdad:** Produccion" 3 veces, skip ---
$cuentaFuente = 0
foreach ($l in $lineas) {
    if ($l -eq '**Fuente de verdad:** Produccion') { $cuentaFuente++ }
}
if ($cuentaFuente -ge 3) {
    Write-Host "[SKIP] Los cambios ya estan aplicados (Fuente de verdad x $cuentaFuente)." -ForegroundColor Yellow
    exit 0
}

# --- Verificar que S14-S19 tienen "Coleccion" (no tocar) ---
$idxSeccionesLegacy = @()
for ($i = 0; $i -lt $total; $i++) {
    if ($lineas[$i] -match '^## Estado de Bitwarden al cierre de S1[4-9]') {
        $idxSeccionesLegacy += $i
    }
}
if ($idxSeccionesLegacy.Count -ne 6) {
    Write-Host "[ERROR] Se esperaban 6 secciones S14-S19, se encontraron $($idxSeccionesLegacy.Count)." -ForegroundColor Red
    exit 1
}
Write-Host "[INFO] Secciones S14-S19 detectadas: $($idxSeccionesLegacy.Count) (NO se tocan)." -ForegroundColor DarkGray

# --- Verificar que S20, S21, S22 existen ---
$idxS20 = -1
$idxS21 = -1
$idxS22 = -1
for ($i = 0; $i -lt $total; $i++) {
    if ($lineas[$i] -match '^## Estado de Bitwarden al cierre de S20') { $idxS20 = $i }
    if ($lineas[$i] -match '^## Estado de Bitwarden al cierre de S21') { $idxS21 = $i }
    if ($lineas[$i] -match '^## Estado de Bitwarden al cierre de S22') { $idxS22 = $i }
}
if ($idxS20 -lt 0 -or $idxS21 -lt 0 -or $idxS22 -lt 0) {
    Write-Host "[ERROR] Falta alguna seccion S20/S21/S22." -ForegroundColor Red
    exit 1
}
Write-Host "[INFO] S20 en linea $($idxS20 + 1), S21 en linea $($idxS21 + 1), S22 en linea $($idxS22 + 1)." -ForegroundColor DarkGray

# --- Verificar que NO hay nota S23 ya insertada ---
$idxNotaS23 = -1
for ($i = 0; $i -lt $total; $i++) {
    if ($lineas[$i] -match '^> \*\*Nota S23:\*\*') { $idxNotaS23 = $i; break }
}

# --- Backup ---
$backup = "$archivo.bak-s23-79"
Copy-Item $archivo $backup -Force
Write-Host "[OK] Backup en: $backup" -ForegroundColor DarkGray

# --- Cambio 1: insertar nota S23 antes de S14 ---
if ($idxNotaS23 -lt 0) {
    $idxS14 = $idxSeccionesLegacy[0]
    $notaS23 = @(
        '> **Nota S23:** las secciones S14 a S19 usan el termino "Coleccion"',
        '> (terminologia legacy del setup inicial). A partir de S20 se usa el',
        '> modelo correcto de 3 carpetas. Ver "Modelo de Bitwarden" al inicio',
        '> de este documento para la politica vigente.',
        ''
    )
    $antes  = if ($idxS14 -gt 0) { $lineas[0..($idxS14 - 1)] } else { @() }
    $despues = $lineas[$idxS14..($total - 1)]
    $lineas = @($antes) + @($notaS23) + @($despues)
    $total = $lineas.Count
    Write-Host "[OK] Nota S23 insertada antes de S14." -ForegroundColor Green
    # Recalcular indices
    $idxS14 = -1; $idxS20 = -1; $idxS21 = -1; $idxS22 = -1
    for ($i = 0; $i -lt $total; $i++) {
        if ($lineas[$i] -match '^## Estado de Bitwarden al cierre de S14') { $idxS14 = $i }
        if ($lineas[$i] -match '^## Estado de Bitwarden al cierre de S20') { $idxS20 = $i }
        if ($lineas[$i] -match '^## Estado de Bitwarden al cierre de S21') { $idxS21 = $i }
        if ($lineas[$i] -match '^## Estado de Bitwarden al cierre de S22') { $idxS22 = $i }
    }
}

# --- Cambio 2-4: reemplazar bloques "Coleccion + Carpeta" en S20, S21, S22 ---
# Localizar las lineas exactas por patron (indices pueden haber cambiado)
$lineaCol = '**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion'
$lineaCarp = '**Carpeta:** PanFree System - Produccion'
$nuevasLineas = @(
    '**Carpetas:** Claves Personales, Desarrollo, Produccion',
    '**Fuente de verdad:** Produccion'
)

function Reemplazar-En-Seccion {
    param([int]$idxHeader, [string[]]$lineasRef)
    # Buscar la linea "**Coleccion:**" despues del header (max 5 lineas despues)
    $idxCol = -1
    for ($j = $idxHeader; $j -lt [Math]::Min($idxHeader + 10, $lineasRef.Count); $j++) {
        if ($lineasRef[$j] -eq $lineaCol) {
            $idxCol = $j
            break
        }
    }
    if ($idxCol -lt 0) {
        Write-Host "[ERROR] No se encontro '**Coleccion:**' cerca del header en linea $($idxHeader + 1)." -ForegroundColor Red
        return $null
    }

    # Verificar si la siguiente linea es "**Carpeta:**"
    $tieneCarpeta = $false
    if (($idxCol + 1) -lt $lineasRef.Count -and $lineasRef[$idxCol + 1] -eq $lineaCarp) {
        $tieneCarpeta = $true
    }

    # Construir nuevo array
    $antes  = if ($idxCol -gt 0) { $lineasRef[0..($idxCol - 1)] } else { @() }
    if ($tieneCarpeta) {
        $despues = if (($idxCol + 2) -lt $lineasRef.Count) { $lineasRef[($idxCol + 2)..($lineasRef.Count - 1)] } else { @() }
    } else {
        $despues = if (($idxCol + 1) -lt $lineasRef.Count) { $lineasRef[($idxCol + 1)..($lineasRef.Count - 1)] } else { @() }
    }
    return @($antes) + @($nuevasLineas) + @($despues)
}

# Aplicar de ABAJO hacia ARRIBA para que los indices de arriba no se invalidan
$resultado = $lineas
foreach ($idxHeader in @($idxS22, $idxS21, $idxS20) | Sort-Object -Descending) {
    if ($idxHeader -lt 0) { continue }
    $res = Reemplazar-En-Seccion -idxHeader $idxHeader -lineasRef $resultado
    if ($null -eq $res) {
        Write-Host "[ERROR] Fallo el reemplazo en linea $($idxHeader + 1). Restaurando." -ForegroundColor Red
        Move-Item $backup $archivo -Force
        exit 1
    }
    $resultado = $res
}
$lineas = $resultado
Write-Host "[OK] S20, S21, S22 reemplazadas." -ForegroundColor Green

# --- Escribir con UTF-8 sin BOM y LF ---
$textoNuevo = ($lineas -join "`n") + "`n"
$utf8SinBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path $archivo).Path, $textoNuevo, $utf8SinBom)

# --- Verificacion post-write ---
$verif = Get-Content $archivo

# 1. Debe haber exactamente 3 "**Fuente de verdad:** Produccion"
$cuentaFV = ($verif | Where-Object { $_ -eq '**Fuente de verdad:** Produccion' }).Count
if ($cuentaFV -ne 3) {
    Write-Host "[ERROR] Post-write: se esperaban 3 'Fuente de verdad', hay $cuentaFV. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# 2. NO debe quedar "**Carpeta:** PanFree System - Produccion" en S20-S22
$cuentaCarp = ($verif | Where-Object { $_ -eq '**Carpeta:** PanFree System - Produccion' }).Count
if ($cuentaCarp -ne 0) {
    Write-Host "[ERROR] Post-write: todavia quedan $cuentaCarp lineas '**Carpeta:**'. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# 3. Debe existir la nota S23
$tieneNota = $false
foreach ($l in $verif) {
    if ($l -match '^> \*\*Nota S23:\*\*') { $tieneNota = $true; break }
}
if (-not $tieneNota) {
    Write-Host "[ERROR] Post-write: falta la nota S23. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# 4. S14-S19 siguen teniendo "**Coleccion:**" (historia preservada)
$lineasCol = ($verif | Where-Object { $_ -eq $lineaCol }).Count
if ($lineasCol -ne 6) {
    Write-Host "[WARN] Se esperaban 6 lineas '**Coleccion:**' en S14-S19, hay $lineasCol." -ForegroundColor Yellow
    Write-Host "       Verificar manualmente antes de commitear." -ForegroundColor Yellow
}

# 5. S22 debe tener "**Carpetas:**"
$idxS22v = -1
for ($i = 0; $i -lt $verif.Count; $i++) {
    if ($verif[$i] -match '^## Estado de Bitwarden al cierre de S22') { $idxS22v = $i; break }
}
if ($idxS22v -ge 0) {
    $encontrado = $false
    for ($j = $idxS22v; $j -lt [Math]::Min($idxS22v + 10, $verif.Count); $j++) {
        if ($verif[$j] -match '^\*\*Carpetas:\*\*') { $encontrado = $true; break }
    }
    if (-not $encontrado) {
        Write-Host "[ERROR] Post-write: S22 no tiene '**Carpetas:**'. Restaurando." -ForegroundColor Red
        Move-Item $backup $archivo -Force
        exit 1
    }
}

Write-Host "[OK] Verificacion post-write:" -ForegroundColor Green
Write-Host "     - 3 'Fuente de verdad' en S20/S21/S22" -ForegroundColor Green
Write-Host "     - 0 'Carpeta:' redundantes" -ForegroundColor Green
Write-Host "     - Nota S23 presente" -ForegroundColor Green
Write-Host "     - S14-S19 intactas ($lineasCol 'Coleccion')" -ForegroundColor Green

Remove-Item $backup -Force

# --- Commit opcional ---
if (-not $NoCommit) {
    git add $archivo
    git commit -m "docs(sync): homogeneizar modelo Bitwarden en ROTACION-CLAVES (S20-S22 + nota S23)"
    git push origin main
    Write-Host "[OK] Commit + push hechos." -ForegroundColor Green
} else {
    Write-Host "[NoCommit] Cambio aplicado, NO commiteado." -ForegroundColor Cyan
}