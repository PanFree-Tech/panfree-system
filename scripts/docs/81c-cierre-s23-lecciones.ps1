# scripts/docs/81c-cierre-s23-lecciones.ps1
# S23 - Agregar lecciones de S23 a SISTEMA-DE-TRABAJO.md (subseccion 4.3)
# Preserva line endings. Idempotente.
# Uso: powershell -ExecutionPolicy Bypass -File scripts\docs\81c-cierre-s23-lecciones.ps1 [-NoCommit]

[CmdletBinding()]
param(
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$archivo = "docs\operations\SISTEMA-DE-TRABAJO.md"
$rutaAbs = (Resolve-Path $archivo).Path

# --- Leer byte-safe ---
$bytes = [System.IO.File]::ReadAllBytes($rutaAbs)
$contenido = [System.Text.Encoding]::UTF8.GetString($bytes)

# --- Detectar line ending ---
$cuentaCRLF = ([regex]::Matches($contenido, "`r`n")).Count
$cuentaLF   = ([regex]::Matches($contenido, "`n")).Count
$esCRLF = ($cuentaCRLF -gt ($cuentaLF - $cuentaCRLF))
$le = if ($esCRLF) { "`r`n" } else { "`n" }

# --- Idempotencia ---
if ($contenido.Contains('### 4.3 Line endings al modificar archivos')) {
    Write-Host "[SKIP] La subseccion 4.3 ya existe." -ForegroundColor Yellow
    exit 0
}

# --- Localizar donde insertar: despues de la subseccion 4.2 y antes de "## 5." ---
$marca = '## 5. Verificaciones antes de commitear'
$idx = $contenido.IndexOf($marca)
if ($idx -lt 0) {
    Write-Host "[ERROR] No se encontro '## 5. Verificaciones antes de commitear'." -ForegroundColor Red
    exit 1
}

# --- Construir la nueva subseccion ---
$nueva = @(
    '### 4.3 Line endings al modificar archivos',
    '',
    'Antes de modificar un archivo con un script, verificar su line ending:',
    '',
    '    $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $archivo).Path)',
    '    $texto = [System.Text.Encoding]::UTF8.GetString($bytes)',
    '    $cuentaCRLF = ([regex]::Matches($texto, "`r`n")).Count',
    '    $cuentaLF   = ([regex]::Matches($texto, "`n")).Count',
    '',
    '- Si el archivo es CRLF (mayoria en este repo): normalizar al leer con',
    '  `($contenido -split "`n") | ForEach-Object { $_.TrimEnd("`r") }`.',
    '  Y al escribir, usar `-join "`r`n"`.',
    '- Si el archivo es LF (BITACORA, STATUS): usar `-split "`n"` y `-join "`n"`.',
    '- Nunca asumir LF: en S23, el script 79d fallo porque comparaba con `-eq`',
    '  contra strings que tenian un `\r` residual invisible.',
    '',
    '### 4.4 Deteccion de mojibake',
    '',
    'Si un archivo tiene caracteres mal codificados (ej: "a con circunflejo +',
    'euro + comilla" en vez de em-dash), detectarlo con codigos Unicode:',
    '',
    '    $pA = [char]0x00E2  # a con circunflejo',
    '    $pEur = [char]0x20AC  # euro',
    '',
    'NO usar los caracteres literales en el script. Los .ps1 con caracteres',
    'no-ASCII rompen el parser de PowerShell 5.1.',
    '',
    '### 4.5 Invocacion de scripts',
    '',
    'Siempre invocar scripts con uno de estos formatos:',
    '',
    '    powershell -ExecutionPolicy Bypass -File scripts\docs\NN-script.ps1',
    '    & ".\scripts\docs\NN-script.ps1"',
    '',
    'Nunca invocar `scripts\docs\NN-script.ps1` directo desde la consola:',
    'PowerShell lo interpreta como comando (modulo), no como ruta.',
    '',
    '### 4.6 -NoCommit como default',
    '',
    'Los scripts de fix deben aceptar `-NoCommit` para dry-run:',
    '',
    '- Correr primero con `-NoCommit`: verifica el diff sin commitear.',
    '- Si el diff es correcto, commit manual o segunda corrida sin `-NoCommit`.',
    '- Previene commitear cambios no verificados.',
    '',
    '---',
    '',
    ''
)

$contenido = $contenido.Substring(0, $idx) + ($nueva -join $le) + $contenido.Substring($idx)

# --- Escribir byte-safe ---
$utf8SinBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($rutaAbs, $contenido, $utf8SinBom)

# --- Verificacion ---
$bytesV = [System.IO.File]::ReadAllBytes($rutaAbs)
$verif = [System.Text.Encoding]::UTF8.GetString($bytesV)

foreach ($m in @('### 4.3 Line endings al modificar archivos', '### 4.4 Deteccion de mojibake', '### 4.5 Invocacion de scripts', '### 4.6 -NoCommit como default')) {
    if (-not $verif.Contains($m)) {
        Write-Host "[ERROR] Post-write: falta '$m'." -ForegroundColor Red
        exit 1
    }
}

Write-Host "[OK] Subsecciones 4.3-4.6 agregadas a SISTEMA-DE-TRABAJO." -ForegroundColor Green

# --- Commit opcional ---
if (-not $NoCommit) {
    git add $archivo
    git commit -m "docs(ops): agregar lecciones S23 a SISTEMA-DE-TRABAJO"
    git push origin main
    Write-Host "[OK] Commit + push hechos." -ForegroundColor Green
} else {
    Write-Host "[NoCommit] Cambio aplicado, NO commiteado." -ForegroundColor Cyan
}