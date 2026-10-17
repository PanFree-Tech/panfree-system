# scripts/docs/79d-s20-s21-s22-carpetas.ps1
# S23 - Homogeneizar modelo Bitwarden en S20, S21, S22 de ROTACION-CLAVES.md
# Reemplaza:
#   "**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion"
#   "**Carpeta:** PanFree System - Produccion"  (si existe)
# por:
#   "**Carpetas:** Claves Personales, Desarrollo, Produccion"
#   "**Fuente de verdad:** Produccion"
# NO toca S14-S19 (historia preservada).
# Lectura/escritura byte-safe. Idempotente.
# Uso: powershell -ExecutionPolicy Bypass -File scripts\docs\79d-s20-s21-s22-carpetas.ps1 [-NoCommit]

[CmdletBinding()]
param(
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$archivo = "docs\operations\ROTACION-CLAVES.md"
$rutaAbs = (Resolve-Path $archivo).Path

# --- Leer byte-safe ---
$bytes = [System.IO.File]::ReadAllBytes($rutaAbs)
$contenido = [System.Text.Encoding]::UTF8.GetString($bytes)
$lineas = $contenido -split "`n"

$total = $lineas.Count
Write-Host "[INFO] Total de lineas: $total" -ForegroundColor DarkGray

# --- Idempotencia: si ya hay 3 "Fuente de verdad", skip ---
$cuentaFV = ($lineas | Where-Object { $_ -eq '**Fuente de verdad:** Produccion' }).Count
if ($cuentaFV -ge 3) {
    Write-Host "[SKIP] Ya hay $cuentaFV lineas 'Fuente de verdad'. Cambio aplicado." -ForegroundColor Yellow
    exit 0
}

# --- Verificar que S14-S19 tienen 6 "Coleccion" (no tocar) ---
$cuentaColLegacy = ($lineas | Where-Object { $_ -eq '**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion' }).Count
Write-Host "[INFO] Lineas '**Coleccion:**' presentes: $cuentaColLegacy" -ForegroundColor DarkGray

if ($cuentaColLegacy -ne 9) {
    Write-Host "[WARN] Se esperaban 9 lineas '**Coleccion:**' (S14-S22), hay $cuentaColLegacy." -ForegroundColor Yellow
    Write-Host "       Verificar antes de continuar." -ForegroundColor Yellow
}

# --- Backup ---
$backup = "$archivo.bak-s23-79d"
Copy-Item $archivo $backup -Force
Write-Host "[OK] Backup en: $backup" -ForegroundColor DarkGray

# --- Localizar indices de S14, S20, S21, S22 ---
$idxS14 = -1
$idxS20 = -1
$idxS21 = -1
$idxS22 = -1
for ($i = 0; $i -lt $total; $i++) {
    if ($idxS14 -lt 0 -and $lineas[$i] -match '^## Estado de Bitwarden al cierre de S14') { $idxS14 = $i }
    if ($idxS20 -lt 0 -and $lineas[$i] -match '^## Estado de Bitwarden al cierre de S20') { $idxS20 = $i }
    if ($idxS21 -lt 0 -and $lineas[$i] -match '^## Estado de Bitwarden al cierre de S21') { $idxS21 = $i }
    if ($idxS22 -lt 0 -and $lineas[$i] -match '^## Estado de Bitwarden al cierre de S22') { $idxS22 = $i }
}

if ($idxS20 -lt 0 -or $idxS21 -lt 0 -or $idxS22 -lt 0) {
    Write-Host "[ERROR] Falta header S20, S21 o S22." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

Write-Host "[INFO] S20 en linea $($idxS20 + 1), S21 en linea $($idxS21 + 1), S22 en linea $($idxS22 + 1)" -ForegroundColor DarkGray

# --- Constantes literales ---
$lineaCol    = '**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion'
$lineaCarp   = '**Carpeta:** PanFree System - Produccion'
$lineaNueva1 = '**Carpetas:** Claves Personales, Desarrollo, Produccion'
$lineaNueva2 = '**Fuente de verdad:** Produccion'

# --- Funcion: reemplazar en una seccion (por indice del header) ---
function Reemplazar-En-Seccion {
    param(
        [int]$idxHeader,
        [string[]]$arrLineas
    )
    # Buscar "**Coleccion:**" hasta 10 lineas despues del header
    $idxCol = -1
    for ($j = $idxHeader; $j -lt [Math]::Min($idxHeader + 10, $arrLineas.Count); $j++) {
        if ($arrLineas[$j] -eq $lineaCol) { $idxCol = $j; break }
    }
    if ($idxCol -lt 0) {
        Write-Host "[ERROR] No se encontro '**Coleccion:**' cerca del header en linea $($idxHeader + 1)." -ForegroundColor Red
        return $null
    }

    # Verificar si la siguiente linea es "**Carpeta:**"
    $tieneCarpeta = $false
    if (($idxCol + 1) -lt $arrLineas.Count -and $arrLineas[$idxCol + 1] -eq $lineaCarp) {
        $tieneCarpeta = $true
    }

    # Construir array nuevo
    $antes   = if ($idxCol -gt 0) { $arrLineas[0..($idxCol - 1)] } else { @() }
    if ($tieneCarpeta) {
        $despues = if (($idxCol + 2) -lt $arrLineas.Count) { $arrLineas[($idxCol + 2)..($arrLineas.Count - 1)] } else { @() }
    } else {
        $despues = if (($idxCol + 1) -lt $arrLineas.Count) { $arrLineas[($idxCol + 1)..($arrLineas.Count - 1)] } else { @() }
    }
    return @($antes) + @($lineaNueva1, $lineaNueva2) + @($despues)
}

# --- Aplicar de ABAJO hacia ARRIBA para que los indices no se invaliden ---
$resultado = $lineas
foreach ($idx in @($idxS22, $idxS21, $idxS20) | Sort-Object -Descending) {
    $res = Reemplazar-En-Seccion -idxHeader $idx -arrLineas $resultado
    if ($null -eq $res) {
        Write-Host "[ERROR] Fallo reemplazo en S-$(($idx + 1)). Restaurando." -ForegroundColor Red
        Move-Item $backup $archivo -Force
        exit 1
    }
    $resultado = $res
}

# --- Reconstruir ---
$textoNuevo = ($resultado -join "`n").TrimEnd("`n") + "`n"

# --- Escribir byte-safe ---
$utf8SinBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($rutaAbs, $textoNuevo, $utf8SinBom)

# --- Verificacion post-write ---
$bytesV = [System.IO.File]::ReadAllBytes($rutaAbs)
$verif = [System.Text.Encoding]::UTF8.GetString($bytesV)
$lineasV = $verif -split "`n"

# 1. Exactamente 3 "Fuente de verdad"
$cuentaFVv = ($lineasV | Where-Object { $_ -eq '**Fuente de verdad:** Produccion' }).Count
if ($cuentaFVv -ne 3) {
    Write-Host "[ERROR] Post-write: se esperaban 3 'Fuente de verdad', hay $cuentaFVv. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# 2. Cero "Carpeta:" residual
$cuentaCarpV = ($lineasV | Where-Object { $_ -eq $lineaCarp }).Count
if ($cuentaCarpV -ne 0) {
    Write-Host "[ERROR] Post-write: quedan $cuentaCarpV lineas '**Carpeta:**'. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# 3. Exactamente 6 "Coleccion" (solo S14-S19)
$cuentaColV = ($lineasV | Where-Object { $_ -eq $lineaCol }).Count
if ($cuentaColV -ne 6) {
    Write-Host "[ERROR] Post-write: se esperaban 6 'Coleccion' (S14-S19), hay $cuentaColV. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# 4. S22 debe tener "**Carpetas:**"
$idxS22v = -1
for ($i = 0; $i -lt $lineasV.Count; $i++) {
    if ($lineasV[$i] -match '^## Estado de Bitwarden al cierre de S22') { $idxS22v = $i; break }
}
$encontrado = $false
for ($j = $idxS22v; $j -lt [Math]::Min($idxS22v + 10, $lineasV.Count); $j++) {
    if ($lineasV[$j] -match '^\*\*Carpetas:\*\*') { $encontrado = $true; break }
}
if (-not $encontrado) {
    Write-Host "[ERROR] Post-write: S22 no tiene '**Carpetas:**'. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

Write-Host "[OK] Verificacion post-write:" -ForegroundColor Green
Write-Host "     - 3 'Fuente de verdad' (S20/S21/S22)" -ForegroundColor Green
Write-Host "     - 0 lineas '**Carpeta:**' residuales" -ForegroundColor Green
Write-Host "     - 6 'Coleccion' en S14-S19 (intactas)" -ForegroundColor Green
Write-Host "     - S22 tiene '**Carpetas:**'" -ForegroundColor Green
Write-Host "     - Total de lineas: $($lineasV.Count)" -ForegroundColor Green

Remove-Item $backup -Force

# --- Commit opcional ---
if (-not $NoCommit) {
    git add $archivo
    git commit -m "docs(sync): homogeneizar modelo Bitwarden en S20-S22 (ROTACION-CLAVES)"
    git push origin main
    Write-Host "[OK] Commit + push hechos." -ForegroundColor Green
} else {
    Write-Host "[NoCommit] Cambio aplicado, NO commiteado." -ForegroundColor Cyan
}