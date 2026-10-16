# 53c-a-fix-env-n8n.ps1
# Corrige la duplicacion de '# Email' y el '# Estado: OK' viejo en la seccion N8N.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root
$utf8 = New-Object System.Text.UTF8Encoding($false)

$envPath = Join-Path $root '.env.example'
$envTxt = [System.IO.File]::ReadAllText($envPath, $utf8)

$viejo = @(
    '# Panel:  (n/a - n8n nunca desplegado)'
    '# Email:  [S] system.panfree@gmail.com'
    '# Estado: OK'
) -join "`r`n"

$nuevo = '# Panel:  (n/a - n8n nunca desplegado)'

if ($envTxt.Contains($nuevo) -and -not $envTxt.Contains($viejo)) {
    Write-Host "AVISO: la seccion N8N ya parece corregida." -ForegroundColor Yellow
} elseif (-not $envTxt.Contains($viejo)) {
    Write-Host "AVISO: no se encontro el bloque a corregir. Revisar a mano." -ForegroundColor Red
} else {
    $envTxt = $envTxt.Replace($viejo, $nuevo)
    [System.IO.File]::WriteAllText($envPath, $envTxt, $utf8)
    Write-Host "OK: seccion N8N corregida (sin duplicado de Email ni Estado OK)." -ForegroundColor Green
}