# scripts/docs/79b-fix-mojibake-rotacion.ps1
# S23 - Fix mojibake en ROTACION-CLAVES.md (linea 420)
# Reemplaza "a con circunflejo + euro + em-dash roto" por guion simple.
# Lectura/escritura byte-safe (UTF-8 sin BOM).
# Idempotente. Uso: powershell -ExecutionPolicy Bypass -File scripts\docs\79b-fix-mojibake-rotacion.ps1 [-NoCommit]

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

# --- Construir patrones con codigos Unicode (ASCII puro) ---
# "a" con circunflejo: U+00E2
# euro:                U+20AC
# comilla derecha:     U+201D
$pA   = [char]0x00E2
$pEur = [char]0x20AC
$pRD  = [char]0x201D
$pEmDash = [char]0x2014

# Patron esperado: "..." (a^ + euro + ") = mojibake de em-dash (U+2014)
$patronMojibake = "$pA$pEur$pRD"

# Reemplazo: guion simple
$reemplazo = '-'

# --- Idempotencia ---
if (-not $contenido.Contains($patronMojibake)) {
    Write-Host "[SKIP] El mojibake ya no esta presente." -ForegroundColor Yellow
    exit 0
}

# --- Contar ocurrencias ---
$ocurrencias = ([regex]::Matches($contenido, [regex]::Escape($patronMojibake))).Count
Write-Host "[INFO] Ocurrencias de mojibake encontradas: $ocurrencias" -ForegroundColor Cyan

# --- Backup ---
$backup = "$archivo.bak-s23-79b"
Copy-Item $archivo $backup -Force
Write-Host "[OK] Backup en: $backup" -ForegroundColor DarkGray

# --- Reemplazo literal ---
$contenido = $contenido.Replace($patronMojibake, $reemplazo)

# --- Escribir byte-safe UTF-8 sin BOM ---
$utf8SinBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($rutaAbs, $contenido, $utf8SinBom)

# --- Verificacion post-write ---
$bytesV = [System.IO.File]::ReadAllBytes($rutaAbs)
$verif = [System.Text.Encoding]::UTF8.GetString($bytesV)

if ($verif.Contains($patronMojibake)) {
    Write-Host "[ERROR] Post-write: el mojibake todavia esta presente. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

Write-Host "[OK] Verificacion post-write: mojibake eliminado." -ForegroundColor Green
Remove-Item $backup -Force

# --- Commit opcional ---
if (-not $NoCommit) {
    git add $archivo
    git commit -m "docs(sync): corregir mojibake en ROTACION-CLAVES (linea 420)"
    git push origin main
    Write-Host "[OK] Commit + push hechos." -ForegroundColor Green
} else {
    Write-Host "[NoCommit] Cambio aplicado, NO commiteado." -ForegroundColor Cyan
}