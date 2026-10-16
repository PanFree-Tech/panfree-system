# scripts/docs/77-fix-bitacora-s18.ps1
# S23 - Reformatear bloque pegado del cierre de S18 en BITACORA.md
# Idempotente. Uso: powershell -ExecutionPolicy Bypass -File scripts\docs\77-fix-bitacora-s18.ps1 [-NoCommit]

[CmdletBinding()]
param(
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$archivo = "docs\BITACORA.md"

if (-not (Test-Path $archivo)) {
    Write-Host "[ERROR] No existe: $archivo" -ForegroundColor Red
    exit 1
}

$lineas = Get-Content $archivo

# --- Idempotencia: ya esta reformateado? ---
$yaReformateado = $false
foreach ($l in $lineas) {
    if ($l -eq '**Cierre S18:**') {
        $yaReformateado = $true
        break
    }
}
if ($yaReformateado) {
    Write-Host "[SKIP] El cierre de S18 ya esta reformateado." -ForegroundColor Yellow
    exit 0
}

# --- Buscar la linea pegada (empieza con " **Cierre S18:**") ---
$indice = -1
for ($i = 0; $i -lt $lineas.Count; $i++) {
    if ($lineas[$i].StartsWith(' **Cierre S18:**')) {
        $indice = $i
        break
    }
}

if ($indice -lt 0) {
    Write-Host "[ERROR] No se encontro la linea pegada de Cierre S18." -ForegroundColor Red
    Write-Host "        Se esperaba una linea que empiece con: ' **Cierre S18:**'" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Linea pegada encontrada en indice $indice (linea $($indice + 1))." -ForegroundColor Green
Write-Host "     Longitud: $($lineas[$indice].Length) chars" -ForegroundColor DarkGray

# --- Backup ---
$backup = "$archivo.bak-s23-77"
Copy-Item $archivo $backup -Force
Write-Host "[OK] Backup en: $backup" -ForegroundColor DarkGray

# --- Construir las lineas nuevas (reemplazo del bloque pegado) ---
$nuevas = @(
    '**Cierre S18:**',
    '- 5 bloques completados, 3 commits pusheados.',
    '- 3 tareas F2 cerradas: F2-10 (n8n No aplica), F2-13 (APIs IA No aplica),',
    '  subproducto de F2-14 (secrets internos eliminados de Vercel).',
    '- 8 hallazgos registrados: DOC-009/010/011/012/013, SEC-022/023/024.',
    '- Limpieza masiva de Vercel: 16 variables eliminadas',
    '  (13 APIs IA + 3 secrets internos).',
    '- Progreso: 66% -> 70% (33 de 47 tareas).',
    '- F2: 8/14 -> 10/14.',
    '',
    '**Commits S18:**',
    '- 6ec46c30 docs(env): documentar n8n plomeria inerte y hallazgos de Vercel',
    '- 74486761 docs(env): documentar secrets internos como plomeria inerte',
    '- 9b99efe7 docs(env): auditar y eliminar 13 APIs IA secundarias',
    '',
    '**Proxima sesion (S19):**',
    '- F2-11: rotar GA4 API secret (auditar SEC-023 primero).',
    '- F2-12: regenerar par VAPID (verificar SEC-024 + BUG-001).',
    '- F2-14: guardar .env consolidado en Bitwarden.',
    '- Backlog: sistema simple de promociones en CartSidebar (DOC-008 seccion 9).',
    '- Pendiente futuro: retiro del modulo Marketing completo (DOC-008).',
    '',
    '**Bloqueantes:**',
    '- Ninguno. Cloudinary #392411 se reconsulta a partir del 2026-10-18.'
)

# --- Reconstruir: tomar las lineas antes + nuevas + lineas despues ---
$antes  = if ($indice -gt 0) { $lineas[0..($indice - 1)] } else { @() }
$despues = if ($indice -lt ($lineas.Count - 1)) { $lineas[($indice + 1)..($lineas.Count - 1)] } else { @() }

$resultado = @($antes) + @($nuevas) + @($despues)

# --- Escribir con UTF-8 sin BOM y LF ---
$textoNuevo = ($resultado -join "`n") + "`n"
$utf8SinBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path $archivo).Path, $textoNuevo, $utf8SinBom)

# --- Verificacion post-write ---
$verificacion = Get-Content $archivo

# 1. Debe existir la linea exacta "**Cierre S18:**"
$tieneCierre = $false
foreach ($l in $verificacion) {
    if ($l -eq '**Cierre S18:**') {
        $tieneCierre = $true
        break
    }
}
if (-not $tieneCierre) {
    Write-Host "[ERROR] Verificacion: no se encontro '**Cierre S18:**' como linea propia. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# 2. NO debe existir la linea pegada original
$siguePegada = $false
foreach ($l in $verificacion) {
    if ($l.StartsWith(' **Cierre S18:**')) {
        $siguePegada = $true
        break
    }
}
if ($siguePegada) {
    Write-Host "[ERROR] Verificacion: la linea pegada original sigue presente. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# 3. Deben aparecer las secciones nuevas
foreach ($patron in @('**Commits S18:**', '**Proxima sesion (S19):**', '**Bloqueantes:**')) {
    $tiene = $false
    foreach ($l in $verificacion) {
        if ($l -eq $patron) {
            $tiene = $true
            break
        }
    }
    if (-not $tiene) {
        Write-Host "[ERROR] Verificacion: falta '$patron'. Restaurando." -ForegroundColor Red
        Move-Item $backup $archivo -Force
        exit 1
    }
}

Write-Host "[OK] Verificacion post-write: S18 reformateado correctamente." -ForegroundColor Green
Remove-Item $backup -Force

# --- Commit opcional ---
if (-not $NoCommit) {
    git add $archivo
    git commit -m "docs(sync): reformatear cierre de Sesion 18 en BITACORA"
    git push origin main
    Write-Host "[OK] Commit + push hechos." -ForegroundColor Green
} else {
    Write-Host "[NoCommit] Cambio aplicado, NO commiteado." -ForegroundColor Cyan
}