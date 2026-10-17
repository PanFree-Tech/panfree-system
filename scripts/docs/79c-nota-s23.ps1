# scripts/docs/79c-nota-s23.ps1
# S23 - Insertar nota aclaratoria S23 antes de la seccion S14 en ROTACION-CLAVES.md
# Lectura/escritura byte-safe (UTF-8 sin BOM).
# Idempotente. Uso: powershell -ExecutionPolicy Bypass -File scripts\docs\79c-nota-s23.ps1 [-NoCommit]

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

# --- Idempotencia: ya existe la nota? ---
foreach ($l in $lineas) {
    if ($l -match '^> \*\*Nota S23:\*\*') {
        Write-Host "[SKIP] La nota S23 ya esta insertada." -ForegroundColor Yellow
        exit 0
    }
}

# --- Localizar header S14 ---
$idxS14 = -1
for ($i = 0; $i -lt $total; $i++) {
    if ($lineas[$i] -match '^## Estado de Bitwarden al cierre de S14') {
        $idxS14 = $i
        break
    }
}

if ($idxS14 -lt 0) {
    Write-Host "[ERROR] No se encontro '## Estado de Bitwarden al cierre de S14'." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Header S14 encontrado en indice $idxS14 (linea $($idxS14 + 1))." -ForegroundColor Green

# --- Backup ---
$backup = "$archivo.bak-s23-79c"
Copy-Item $archivo $backup -Force
Write-Host "[OK] Backup en: $backup" -ForegroundColor DarkGray

# --- Nota a insertar ---
$nota = @(
    '> **Nota S23:** las secciones S14 a S19 usan el termino "Coleccion"',
    '> (terminologia legacy del setup inicial). A partir de S20 se usa el',
    '> modelo correcto de 3 carpetas. Ver "Modelo de Bitwarden" al inicio',
    '> de este documento para la politica vigente.',
    ''
)

# --- Insertar antes del header S14 ---
$antes   = if ($idxS14 -gt 0) { $lineas[0..($idxS14 - 1)] } else { @() }
$despues = $lineas[$idxS14..($total - 1)]
$lineas  = @($antes) + @($nota) + @($despues)

# --- Reconstruir con LF ---
$textoNuevo = ($lineas -join "`n")
# Asegurar un solo \n final
$textoNuevo = $textoNuevo.TrimEnd("`n") + "`n"

# --- Escribir byte-safe ---
$utf8SinBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($rutaAbs, $textoNuevo, $utf8SinBom)

# --- Verificacion post-write ---
$bytesV = [System.IO.File]::ReadAllBytes($rutaAbs)
$verif = [System.Text.Encoding]::UTF8.GetString($bytesV)
$lineasV = $verif -split "`n"

$tieneNota = $false
$idxNotaV = -1
$idxS14V = -1
for ($i = 0; $i -lt $lineasV.Count; $i++) {
    if ($lineasV[$i] -match '^> \*\*Nota S23:\*\*') { $tieneNota = $true; $idxNotaV = $i }
    if ($lineasV[$i] -match '^## Estado de Bitwarden al cierre de S14') { $idxS14V = $i }
}

if (-not $tieneNota) {
    Write-Host "[ERROR] Post-write: la nota S23 no se inserto. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

if ($idxNotaV -ge $idxS14V) {
    Write-Host "[ERROR] Post-write: la nota S23 NO esta antes de S14. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

Write-Host "[OK] Verificacion post-write:" -ForegroundColor Green
Write-Host "     - Nota S23 insertada en linea $($idxNotaV + 1)" -ForegroundColor Green
Write-Host "     - Header S14 en linea $($idxS14V + 1)" -ForegroundColor Green
Write-Host "     - Total de lineas: $($lineasV.Count)" -ForegroundColor Green

Remove-Item $backup -Force

# --- Commit opcional ---
if (-not $NoCommit) {
    git add $archivo
    git commit -m "docs(sync): agregar nota S23 aclaratoria en ROTACION-CLAVES"
    git push origin main
    Write-Host "[OK] Commit + push hechos." -ForegroundColor Green
} else {
    Write-Host "[NoCommit] Cambio aplicado, NO commiteado." -ForegroundColor Cyan
}