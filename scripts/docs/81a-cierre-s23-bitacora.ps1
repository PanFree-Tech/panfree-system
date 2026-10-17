# scripts/docs/81a-cierre-s23-bitacora.ps1
# S23 - Agregar entrada de cierre de S23 al final de BITACORA.md
# Preserva line endings (BITACORA es LF).
# Idempotente. Uso: powershell -ExecutionPolicy Bypass -File scripts\docs\81a-cierre-s23-bitacora.ps1 [-NoCommit]

[CmdletBinding()]
param(
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$archivo = "docs\BITACORA.md"
$rutaAbs = (Resolve-Path $archivo).Path

# --- Leer byte-safe ---
$bytes = [System.IO.File]::ReadAllBytes($rutaAbs)
$contenido = [System.Text.Encoding]::UTF8.GetString($bytes)

# --- Detectar line ending ---
$cuentaCRLF = ([regex]::Matches($contenido, "`r`n")).Count
$cuentaLF   = ([regex]::Matches($contenido, "`n")).Count
$esCRLF = ($cuentaCRLF -gt ($cuentaLF - $cuentaCRLF))
$le = if ($esCRLF) { "`r`n" } else { "`n" }
Write-Host "[INFO] Line ending: $(if ($esCRLF) { 'CRLF' } else { 'LF' })" -ForegroundColor DarkGray

# --- Idempotencia ---
if ($contenido.Contains('## 2026-10-17 (Sesion 23 - COMPLETA)')) {
    Write-Host "[SKIP] La entrada de S23 ya existe en BITACORA." -ForegroundColor Yellow
    exit 0
}

# --- Construir la entrada S23 ---
$entrada = @(
    '',
    '---',
    '',
    '## 2026-10-17 (Sesion 23 - COMPLETA)',
    '',
    '**Duracion:** ~4 horas',
    '**Objetivo:** Bloque 0 - Sincronizacion de docs post-S22',
    '',
    '**Completado:**',
    '',
    '### Bloque 0 - Fix de documentacion (6 archivos)',
    '- PLAN-DE-TRABAJO: F3-08 y F3-09 marcados OK (commit 44a44c21).',
    '- Tracking: conteo Aceptados corregido 3 -> 2 (commit 51f82788).',
    '- BITACORA: cierre de Sesion 18 reformateado, parrafo pegado dividido en lineas (commit 7039034b).',
    '- STATUS: sesiones S16-S22 movidas dentro de "Ultima actividad" (commit cee6bce9).',
    '- ROTACION-CLAVES: 3 sub-fixes:',
    '  - Fix mojibake en linea 420 (commit 3efd3cf0).',
    '  - Nota S23 aclaratoria insertada antes de S14 (commit e2875579).',
    '  - S20/S21/S22 homogeneizadas a "Carpetas" + "Fuente de verdad" (commit 11d84163).',
    '- GUIA-RAPIDA: 3 rutas obsoletas actualizadas (commit ae3cd460).',
    '- Scripts del Bloque 0 versionados (commits varios, cierre c3710fa9).',
    '',
    '**Hallazgos cerrados:**',
    '- Ninguno (S23 fue limpieza de docs, no cierre de hallazgos tecnicos).',
    '',
    '**Hallazgos nuevos:**',
    '- Ninguno.',
    '',
    '**Incidentes:**',
    '- Commit 3a8b3477 (homogeneizar ROTACION v1) introdujo mojibake colateral en 1 linea.',
    '  Revertido con 519a9086. Rehecho en 79b + 79c + 79e (byte-safe).',
    '- Script 79d v1 fallo por bug de line endings (\r residual al comparar con -eq).',
    '  Fix en 79e v2: normalizacion con TrimEnd("\r") al leer.',
    '',
    '**Bloqueantes:**',
    '- Ninguno.',
    '',
    '**Proxima sesion (S24):**',
    '- F4-01: purgar historial de Git (SEC-001).',
    '- F4-05: confirmar package-lock.json.',
    '- F2-03: Cloudinary #392411 (reconsultar desde 2026-10-18).',
    '- Backlog: 64b (auto-descubrimiento GA4).',
    '',
    '**Aprendizajes:**',
    '- Verificar line ending del archivo antes de modificarlo con scripts.',
    '  Si es CRLF: normalizar con TrimEnd("\r") al leer.',
    '  Si es LF: leer normal.',
    '- Preservar el line ending original al escribir: detectar CRLF vs LF y',
    '  usar -join $lineEnding.',
    '- Mojibake: detectar con [char]0xXXXX (codigos Unicode), no con',
    '  literales. Los .ps1 con caracteres no-ASCII rompen el parser.',
    '- Nunca pegar scripts en la consola: $PSScriptRoot queda vacio.',
    '  Siempre crear en VS Code y correr con "powershell -File".',
    '- -NoCommit como default en scripts de fix. Commit manual tras verificar diff.',
    ''
)

# --- Agregar al final del archivo ---
$textoNuevo = $contenido.TrimEnd("`r", "`n") + $le + ($entrada -join $le)

# --- Escribir byte-safe ---
$utf8SinBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($rutaAbs, $textoNuevo, $utf8SinBom)

# --- Verificacion ---
$bytesV = [System.IO.File]::ReadAllBytes($rutaAbs)
$verif = [System.Text.Encoding]::UTF8.GetString($bytesV)

if (-not $verif.Contains('## 2026-10-17 (Sesion 23 - COMPLETA)')) {
    Write-Host "[ERROR] Post-write: no se encontro la entrada S23." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Entrada S23 agregada a BITACORA.md." -ForegroundColor Green

# --- Commit opcional (por default NO commitea; se hace al final con 81c) ---
if (-not $NoCommit) {
    git add $archivo
    git commit -m "docs(session): cerrar sesion 23 (ENV) - Bloque 0 sync docs"
    git push origin main
    Write-Host "[OK] Commit + push hechos." -ForegroundColor Green
} else {
    Write-Host "[NoCommit] Cambio aplicado, NO commiteado." -ForegroundColor Cyan
}