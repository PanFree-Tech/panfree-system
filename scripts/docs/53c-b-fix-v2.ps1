# 53c-b-fix-v2.ps1
# Corrige: (1) mojibake en SEC-024 del tracking, (2) falta de linea en blanco antes del --- en BITACORA.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root
$utf8 = New-Object System.Text.UTF8Encoding($false)

# --- Fix 1: mojibake en tracking ---
$trackingPath = Join-Path $root 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$t = [System.IO.File]::ReadAllText($trackingPath, $utf8)

$mojibake = [string]([char]0x00C2) + [string]([char]0x00BF)
$viejo = '(' + $mojibake + 'JWT?)'
$nuevo = '(?JWT?)'

if ($t.Contains($viejo)) {
    $t = $t.Replace($viejo, $nuevo)
    [System.IO.File]::WriteAllText($trackingPath, $t, $utf8)
    Write-Host "OK: mojibake corregido en tracking (SEC-024)." -ForegroundColor Green
} elseif ($t.Contains($nuevo)) {
    Write-Host "AVISO: tracking ya estaba corregido." -ForegroundColor Yellow
} else {
    Write-Host "AVISO: no se encontro el patron de mojibake en tracking." -ForegroundColor Yellow
    $count = ([regex]::Matches($t, [regex]::Escape($mojibake))).Count
    Write-Host "  Ocurrencias restantes de mojibake: $count" -ForegroundColor DarkGray
}

# --- Fix 2: linea en blanco antes del --- en BITACORA ---
$bitacoraPath = Join-Path $root 'docs\BITACORA.md'
$b = [System.IO.File]::ReadAllText($bitacoraPath, $utf8)

$viejoB = 'Backlog: sistema simple de promociones en CartSidebar.' + "`r`n" + '---' + "`r`n" + "`r`n" + '## 2026-10-16 (Sesion 18 - EN CURSO)'
$nuevoB = 'Backlog: sistema simple de promociones en CartSidebar.' + "`r`n" + "`r`n" + '---' + "`r`n" + "`r`n" + '## 2026-10-16 (Sesion 18 - EN CURSO)'

if ($b.Contains($viejoB)) {
    $b = $b.Replace($viejoB, $nuevoB)
    [System.IO.File]::WriteAllText($bitacoraPath, $b, $utf8)
    Write-Host "OK: linea en blanco agregada antes del --- en BITACORA." -ForegroundColor Green
} elseif ($b.Contains($nuevoB)) {
    Write-Host "AVISO: BITACORA ya estaba corregida." -ForegroundColor Yellow
} else {
    Write-Host "AVISO: no se encontro el patron en BITACORA. Revisar manualmente." -ForegroundColor Yellow
}

# --- Verificacion ---
Write-Host ""
Write-Host "=== Verificacion ===" -ForegroundColor Cyan

$t2 = [System.IO.File]::ReadAllText($trackingPath, $utf8)
$countMojibake = ([regex]::Matches($t2, [regex]::Escape($mojibake))).Count
Write-Host ("Mojibake restante en tracking: {0}" -f $countMojibake) -ForegroundColor White

$b2 = [System.IO.File]::ReadAllText($bitacoraPath, $utf8)
if ($b2.Contains($nuevoB)) {
    Write-Host "BITACORA: patron correcto." -ForegroundColor White
} else {
    Write-Host "BITACORA: patron INCORRECTO." -ForegroundColor Red
}