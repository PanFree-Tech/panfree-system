# 53c-b-fix-encoding.ps1
# Corrige el caracter mojibake (Â¿ -> ?) en la linea de SEC-024.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root
$utf8 = New-Object System.Text.UTF8Encoding($false)

$trackingPath = Join-Path $root 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$t = [System.IO.File]::ReadAllText($trackingPath, $utf8)

# El caracter mojibake es: A con circunflejo (U+00C2) + inverted question mark (U+00BF)
# En PS 5.1: [char]0x00C2 + [char]0x00BF
$mojibake = [string]([char]0x00C2) + [string]([char]0x00BF)
$correcto = '?'

$viejo = 'NEXT_PUBLIC_VAPID_EMAIL con valor sospechoso (' + $mojibake + 'JWT?)'
$nuevo = 'NEXT_PUBLIC_VAPID_EMAIL con valor sospechoso (' + $correcto + 'JWT?)'

if ($t.Contains($viejo)) {
    $t = $t.Replace($viejo, $nuevo)
    [System.IO.File]::WriteAllText($trackingPath, $t, $utf8)
    Write-Host "OK: corregido mojibake en SEC-024." -ForegroundColor Green
} elseif ($t.Contains($nuevo)) {
    Write-Host "AVISO: ya estaba corregido." -ForegroundColor Yellow
} else {
    Write-Host "AVISO: no se encontro el patron. Revisar manualmente." -ForegroundColor Yellow
    Write-Host "Buscando cualquier ocurrencia de mojibake..." -ForegroundColor DarkGray
    $count = ([regex]::Matches($t, [regex]::Escape($mojibake))).Count
    Write-Host "  Ocurrencias de mojibake en el archivo: $count" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Verificacion:" -ForegroundColor Cyan
$t2 = [System.IO.File]::ReadAllText($trackingPath, $utf8)
$lineas = $t2 -split "`r`n" | Where-Object { $_ -match 'SEC-024' }
foreach ($l in $lineas) {
    Write-Host "  $l" -ForegroundColor White
}