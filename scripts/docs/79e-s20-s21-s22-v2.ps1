# scripts/docs/79e-s20-s21-s22-v2.ps1
# S23 - Homogeneizar modelo Bitwarden en S20-S22 (fix v2)
# Fix sobre 79d: normaliza \r al leer, preserva line ending original al escribir.
# Reemplaza en S20/S21/S22:
#   "**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion" (+ "**Carpeta:**" si existe)
# por:
#   "**Carpetas:** Claves Personales, Desarrollo, Produccion"
#   "**Fuente de verdad:** Produccion"
# NO toca S14-S19.
# Uso: powershell -ExecutionPolicy Bypass -File scripts\docs\79e-s20-s21-s22-v2.ps1 [-NoCommit]

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

# --- Detectar line ending dominante ---
$cuentaCRLF = ([regex]::Matches($contenido, "`r`n")).Count
$cuentaLF   = ([regex]::Matches($contenido, "`n")).Count
$esCRLF = ($cuentaCRLF -gt ($cuentaLF - $cuentaCRLF))
$lineEnding = if ($esCRLF) { "`r`n" } else { "`n" }
Write-Host "[INFO] Line ending dominante: $(if ($esCRLF) { 'CRLF' } else { 'LF' }) (CRLF=$cuentaCRLF, LF=$cuentaLF)" -ForegroundColor DarkGray

# --- Split normalizando: quitar \r al final de cada linea ---
$lineas = ($contenido -split "`n") | ForEach-Object { $_.TrimEnd("`r") }
$total = $lineas.Count
Write-Host "[INFO] Total de lineas: $total" -ForegroundColor DarkGray

# --- Idempotencia ---
$cuentaFV = ($lineas | Where-Object { $_ -eq '**Fuente de verdad:** Produccion' }).Count
if ($cuentaFV -ge 3) {
    Write-Host "[SKIP] Ya hay $cuentaFV lineas 'Fuente de verdad'." -ForegroundColor Yellow
    exit 0
}

# --- Constantes ---
$lineaCol    = '**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion'
$lineaCarp   = '**Carpeta:** PanFree System - Produccion'
$lineaNueva1 = '**Carpetas:** Claves Personales, Desarrollo, Produccion'
$lineaNueva2 = '**Fuente de verdad:** Produccion'

# --- Contar las "Coleccion" actuales ---
$cuentaCol = ($lineas | Where-Object { $_ -eq $lineaCol }).Count
Write-Host "[INFO] Lineas '**Coleccion:**' encontradas: $cuentaCol" -ForegroundColor DarkGray

if ($cuentaCol -ne 9) {
    Write-Host "[WARN] Se esperaban 9 lineas '**Coleccion:**' (S14-S22), hay $cuentaCol." -ForegroundColor Yellow
}

# --- Backup ---
$backup = "$archivo.bak-s23-79e"
Copy-Item $archivo $backup -Force
Write-Host "[OK] Backup en: $backup" -ForegroundColor DarkGray

# --- Localizar indices de S20, S21, S22 ---
$idxS20 = -1; $idxS21 = -1; $idxS22 = -1
for ($i = 0; $i -lt $total; $i++) {
    if ($idxS20 -lt 0 -and $lineas[$i] -match '^## Estado de Bitwarden al cierre de S20') { $idxS20 = $i }
    if ($idxS21 -lt 0 -and $lineas[$i] -match '^## Estado de Bitwarden al cierre de S21') { $idxS21 = $i }
    if ($idxS22 -lt 0 -and $lineas[$i] -match '^## Estado de Bitwarden al cierre de S22') { $idxS22 = $i }
}
if ($idxS20 -lt 0 -or $idxS21 -lt 0 -or $idxS22 -lt 0) {
    Write-Host "[ERROR] Falta S20/S21/S22." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}
Write-Host "[INFO] S20 linea $($idxS20 + 1), S21 linea $($idxS21 + 1), S22 linea $($idxS22 + 1)" -ForegroundColor DarkGray

# --- Funcion de reemplazo ---
function Reemplazar-En-Seccion {
    param([int]$idxHeader, [string[]]$arr)
    $idxCol = -1
    for ($j = $idxHeader; $j -lt [Math]::Min($idxHeader + 10, $arr.Count); $j++) {
        if ($arr[$j] -eq $lineaCol) { $idxCol = $j; break }
    }
    if ($idxCol -lt 0) {
        Write-Host "[ERROR] No se encontro '**Coleccion:**' cerca de linea $($idxHeader + 1)." -ForegroundColor Red
        return $null
    }
    $tieneCarpeta = $false
    if (($idxCol + 1) -lt $arr.Count -and $arr[$idxCol + 1] -eq $lineaCarp) {
        $tieneCarpeta = $true
    }
    $antes = if ($idxCol -gt 0) { $arr[0..($idxCol - 1)] } else { @() }
    if ($tieneCarpeta) {
        $despues = if (($idxCol + 2) -lt $arr.Count) { $arr[($idxCol + 2)..($arr.Count - 1)] } else { @() }
    } else {
        $despues = if (($idxCol + 1) -lt $arr.Count) { $arr[($idxCol + 1)..($arr.Count - 1)] } else { @() }
    }
    return @($antes) + @($lineaNueva1, $lineaNueva2) + @($despues)
}

# --- Aplicar de abajo hacia arriba ---
$resultado = $lineas
foreach ($idx in @($idxS22, $idxS21, $idxS20) | Sort-Object -Descending) {
    $res = Reemplazar-En-Seccion -idxHeader $idx -arr $resultado
    if ($null -eq $res) {
        Write-Host "[ERROR] Fallo reemplazo en S-$($idx + 1). Restaurando." -ForegroundColor Red
        Move-Item $backup $archivo -Force
        exit 1
    }
    $resultado = $res
}

# --- Reconstruir preservando line ending ---
$textoNuevo = ($resultado -join $lineEnding)
if (-not $textoNuevo.EndsWith($lineEnding)) {
    $textoNuevo += $lineEnding
}

# --- Escribir byte-safe ---
$utf8SinBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($rutaAbs, $textoNuevo, $utf8SinBom)

# --- Verificacion post-write ---
$bytesV = [System.IO.File]::ReadAllBytes($rutaAbs)
$verif = [System.Text.Encoding]::UTF8.GetString($bytesV)
$lineasV = ($verif -split "`n") | ForEach-Object { $_.TrimEnd("`r") }

# 1. 3 "Fuente de verdad"
$cuentaFVv = ($lineasV | Where-Object { $_ -eq $lineaNueva2 }).Count
if ($cuentaFVv -ne 3) {
    Write-Host "[ERROR] Post-write: $cuentaFVv 'Fuente de verdad', se esperaban 3. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# 2. 0 "Carpeta:" residual
$cuentaCarpV = ($lineasV | Where-Object { $_ -eq $lineaCarp }).Count
if ($cuentaCarpV -ne 0) {
    Write-Host "[ERROR] Post-write: quedan $cuentaCarpV '**Carpeta:**'. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# 3. 6 "Coleccion" (S14-S19 intactas)
$cuentaColV = ($lineasV | Where-Object { $_ -eq $lineaCol }).Count
if ($cuentaColV -ne 6) {
    Write-Host "[ERROR] Post-write: $cuentaColV 'Coleccion', se esperaban 6. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# 4. S22 con "**Carpetas:**"
$idxS22v = -1
for ($i = 0; $i -lt $lineasV.Count; $i++) {
    if ($lineasV[$i] -match '^## Estado de Bitwarden al cierre de S22') { $idxS22v = $i; break }
}
$encontrado = $false
for ($j = $idxS22v; $j -lt [Math]::Min($idxS22v + 10, $lineasV.Count); $j++) {
    if ($lineasV[$j] -eq $lineaNueva1) { $encontrado = $true; break }
}
if (-not $encontrado) {
    Write-Host "[ERROR] Post-write: S22 no tiene '**Carpetas:**'. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

Write-Host "[OK] Verificacion post-write:" -ForegroundColor Green
Write-Host "     - 3 'Fuente de verdad' (S20/S21/S22)" -ForegroundColor Green
Write-Host "     - 0 lineas '**Carpeta:**'" -ForegroundColor Green
Write-Host "     - 6 'Coleccion' en S14-S19 (intactas)" -ForegroundColor Green
Write-Host "     - S22 con '**Carpetas:**'" -ForegroundColor Green
Write-Host "     - Total de lineas: $($lineasV.Count)" -ForegroundColor Green
Write-Host "     - Line ending preservado: $(if ($esCRLF) { 'CRLF' } else { 'LF' })" -ForegroundColor Green

Remove-Item $backup -Force

# --- Commit opcional ---
if (-not $NoCommit) {
    git add $archivo
    git commit -m "docs(sync): homogeneizar modelo Bitwarden en S20-S22 (fix v2)"
    git push origin main
    Write-Host "[OK] Commit + push hechos." -ForegroundColor Green
} else {
    Write-Host "[NoCommit] Cambio aplicado, NO commiteado." -ForegroundColor Cyan
}