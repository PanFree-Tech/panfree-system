# scripts/docs/80-fix-guia-rutas.ps1
# S23 - Actualizar rutas obsoletas en GUIA-RAPIDA.md
# Reemplaza 3 lineas con rutas viejas por las correctas.
# Line endings preservados. Idempotente.
# Uso: powershell -ExecutionPolicy Bypass -File scripts\docs\80-fix-guia-rutas.ps1 [-NoCommit]

[CmdletBinding()]
param(
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$archivo = "docs\operations\GUIA-RAPIDA.md"
$rutaAbs = (Resolve-Path $archivo).Path

# --- Leer byte-safe y detectar line ending ---
$bytes = [System.IO.File]::ReadAllBytes($rutaAbs)
$contenido = [System.Text.Encoding]::UTF8.GetString($bytes)
$cuentaCRLF = ([regex]::Matches($contenido, "`r`n")).Count
$cuentaLF   = ([regex]::Matches($contenido, "`n")).Count
$esCRLF = ($cuentaCRLF -gt ($cuentaLF - $cuentaCRLF))
$lineEnding = if ($esCRLF) { "`r`n" } else { "`n" }
Write-Host "[INFO] Line ending: $(if ($esCRLF) { 'CRLF' } else { 'LF' })" -ForegroundColor DarkGray

# --- Definir reemplazos (antes/despues) ---
$cambios = @(
    @{
        antes    = '| Como se rota una clave | docs\05-runbooks\ |'
        despues  = '| Como se rota una clave | docs\operations\ROTACION-CLAVES.md |'
        nombre   = 'ruta-rotacion'
    },
    @{
        antes    = '| Convenciones de commit | docs\06-referencias\convenciones-codigo.md |'
        despues  = '| Convenciones de commit | docs\operations\SISTEMA-DE-TRABAJO.md |'
        nombre   = 'ruta-convenciones'
    },
    @{
        antes    = '| Sitio caido | Ver docs\05-runbooks\deploy-rollback.md |'
        despues  = '| Sitio caido | Ver docs\runbooks\deploy-rollback.md |'
        nombre   = 'ruta-rollback'
    }
)

# --- Idempotencia: verificar cuantos cambios ya estan aplicados ---
$cuentaYaAplicados = 0
foreach ($c in $cambios) {
    if ($contenido.Contains($c.despues)) { $cuentaYaAplicados++ }
}
if ($cuentaYaAplicados -eq $cambios.Count) {
    Write-Host "[SKIP] Los 3 cambios ya estan aplicados." -ForegroundColor Yellow
    exit 0
}
Write-Host "[INFO] Cambios ya aplicados: $cuentaYaAplicados / $($cambios.Count)" -ForegroundColor DarkGray

# --- Backup ---
$backup = "$archivo.bak-s23-80"
Copy-Item $archivo $backup -Force
Write-Host "[OK] Backup en: $backup" -ForegroundColor DarkGray

# --- Aplicar reemplazos uno por uno ---
foreach ($c in $cambios) {
    if ($contenido.Contains($c.despues)) {
        Write-Host "[SKIP] '$($c.nombre)' ya aplicado." -ForegroundColor Yellow
        continue
    }
    if (-not $contenido.Contains($c.antes)) {
        Write-Host "[ERROR] No se encontro patron para '$($c.nombre)':" -ForegroundColor Red
        Write-Host "        '$($c.antes)'" -ForegroundColor Red
        Move-Item $backup $archivo -Force
        exit 1
    }
    $contenido = $contenido.Replace($c.antes, $c.despues)
    Write-Host "[OK] '$($c.nombre)' reemplazado." -ForegroundColor Green
}

# --- Escribir byte-safe (preservando line ending original) ---
# Como trabajamos con $contenido como string, el line ending se preserva solo.
$utf8SinBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($rutaAbs, $contenido, $utf8SinBom)

# --- Verificacion post-write ---
$bytesV = [System.IO.File]::ReadAllBytes($rutaAbs)
$verif = [System.Text.Encoding]::UTF8.GetString($bytesV)

foreach ($c in $cambios) {
    if (-not $verif.Contains($c.despues)) {
        Write-Host "[ERROR] Post-write: falta '$($c.nombre)'. Restaurando." -ForegroundColor Red
        Move-Item $backup $archivo -Force
        exit 1
    }
    if ($verif.Contains($c.antes)) {
        Write-Host "[ERROR] Post-write: '$($c.nombre)' todavia tiene el patron viejo. Restaurando." -ForegroundColor Red
        Move-Item $backup $archivo -Force
        exit 1
    }
}

# Verificar que no queden rutas viejas
if ($verif.Contains('docs\05-runbooks\')) {
    Write-Host "[WARN] Todavia hay 'docs\05-runbooks\' en el archivo." -ForegroundColor Yellow
}
if ($verif.Contains('docs\06-referencias\')) {
    Write-Host "[WARN] Todavia hay 'docs\06-referencias\' en el archivo." -ForegroundColor Yellow
}

Write-Host "[OK] Verificacion post-write: 3 cambios aplicados." -ForegroundColor Green

Remove-Item $backup -Force

# --- Commit opcional ---
if (-not $NoCommit) {
    git add $archivo
    git commit -m "docs(sync): actualizar rutas obsoletas en GUIA-RAPIDA"
    git push origin main
    Write-Host "[OK] Commit + push hechos." -ForegroundColor Green
} else {
    Write-Host "[NoCommit] Cambio aplicado, NO commiteado." -ForegroundColor Cyan
}