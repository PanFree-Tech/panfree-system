# scripts/docs/79a-recon-mojibake.ps1
# Recon: contar lineas con mojibake en ROTACION-CLAVES.md
# Solo lectura, no modifica nada.
# Usa solo ASCII puro. Detecta mojibake por rango de bytes, no por caracteres literales.

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$archivo = "docs\operations\ROTACION-CLAVES.md"
$bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $archivo).Path)
$contenido = [System.Text.Encoding]::UTF8.GetString($bytes)

$lineas = $contenido -split "`n"
Write-Host "Total de lineas: $($lineas.Count)" -ForegroundColor Cyan
Write-Host "---"

# Detectar mojibake por rango Unicode:
# - U+00C3 (Ã)   -> 195 decimal
# - U+00C2 (Â)   -> 194 decimal
# - U+00E2 (â)   -> 226 decimal
# - U+00F0 (ð)   -> 240 decimal
# - U+20AC (€)   -> 8364 decimal
$patrones = @(
    [char]0x00C3,  # A con tilde
    [char]0x00C2,  # A con circunflejo
    [char]0x00E2,  # a con circunflejo
    [char]0x00F0,  # eth
    [char]0x20AC   # euro
)

$cuenta = 0
for ($i = 0; $i -lt $lineas.Count; $i++) {
    $linea = $lineas[$i]
    $tieneMojibake = $false
    foreach ($p in $patrones) {
        if ($linea.Contains($p)) {
            $tieneMojibake = $true
            break
        }
    }
    if ($tieneMojibake) {
        Write-Host "[$($i + 1)] $linea" -ForegroundColor Yellow
        $cuenta++
    }
}
Write-Host "---"
Write-Host "Total de lineas con mojibake: $cuenta" -ForegroundColor Cyan