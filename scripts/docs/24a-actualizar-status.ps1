# PowerShell
# =============================================================================
# 24a - Actualizar STATUS.md para cierre de Sesion 11
# =============================================================================

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $repoRoot
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

Write-Host ''
Write-Host ('=' * 70) -ForegroundColor Magenta
Write-Host '  24a - Actualizar STATUS.md (cierre Sesion 11)' -ForegroundColor Magenta
Write-Host ('=' * 70) -ForegroundColor Magenta

$statusPath = 'docs\STATUS.md'
$s = [System.IO.File]::ReadAllText((Join-Path $repoRoot $statusPath))
$antes = $s

# 1. Ultima actualizacion
$s = $s -replace '\*\*Ultima actualizacion:\*\* 2026-10-14 \(fin Sesion 11, parcial\)',
                '**Ultima actualizacion:** 2026-10-14 (fin Sesion 11)'
$s = $s -replace '\*\*Ultima actualizacion:\*\* 2026-10-14 \(fin Sesion 10\)',
                '**Ultima actualizacion:** 2026-10-14 (fin Sesion 11)'

# 2. Agregar entrada de Sesion 11 al final de seccion "Ultima actividad"
# Buscamos el final de la seccion 5 (antes de "## 6. Comandos utiles") y appendeamos.
$entradaS11 = @(
    '',
    '**2026-10-14 - Sesion 11 (COMPLETA)**',
    '- Plan B (chores): limpieza de duplicados en BITACORA/STATUS, README reescrito,',
    '  GUIA-RAPIDA + WORKFLOW actualizados, PLAN-DE-TRABAJO alineado (commit dc88917b).',
    '- F3-04 (AUTH-001): modulo src/lib/validar-password.js + 3 consumidores migrados.',
    '  Minimo 10 chars + mayuscula + minuscula + numero + simbolo (commit ccee0c88).',
    '- Fix colateral: separar linea pegada en AuthModal.js (commit f1675f19).',
    '- Doc de auditoria: docs/audits/2026-10-13-inicial/20-f3-04-auth-001-password.md',
    '  (commit e0168410).',
    '- 7 tests unitarios del modulo pasaron.',
    '- Fase 3 al 44% (4/9). AUTH-001 cerrado.',
    '- Pendiente manual: config de Password Strength en Supabase Auth.',
    '',
    '---'
) -join "`r`n"

# Insertar antes de "## 6. Comandos utiles"
$patron = '(?s)(\r?\n## 6\. Comandos utiles)'
$reemplazo = $entradaS11 + "`r`n`r`n" + '$1'
$s = [regex]::Replace($s, $patron, $reemplazo, 1)

if ($s -ne $antes) {
    [System.IO.File]::WriteAllText((Join-Path $repoRoot $statusPath), $s, $utf8NoBom)
    Write-Host '  OK: STATUS.md actualizado.' -ForegroundColor Green
} else {
    Write-Host '  INFO: STATUS.md sin cambios (idempotente).' -ForegroundColor Yellow
}

Write-Host ''
Write-Host '  --- git diff --stat docs/STATUS.md ---' -ForegroundColor Cyan
git diff --stat docs/STATUS.md

Write-Host ''
Write-Host 'Siguiente: .\scripts\docs\24b-agregar-bitacora.ps1' -ForegroundColor Yellow
Write-Host ''