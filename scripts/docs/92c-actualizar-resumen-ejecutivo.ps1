<#
.SYNOPSIS
    Actualiza 00-resumen-ejecutivo.md al cierre de la auditoria.
.DESCRIPTION
    Cambia Estado a CERRADA, actualiza tabla de hallazgos criticos,
    agrega resumen de cierre al final.
.PARAMETER Commit
    Si esta presente, commitea el cambio.
.NOTES
    Script: scripts/docs/92c-actualizar-resumen-ejecutivo.ps1
    Sesion: S26 (2026-10-17)
#>
[CmdletBinding()]
param([switch]$Commit, [switch]$NoCommit)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

$archivo = 'docs/audits/2026-10-13-inicial/00-resumen-ejecutivo.md'
if (-not (Test-Path $archivo)) { throw "No existe: $archivo" }

$bytes  = [System.IO.File]::ReadAllBytes((Resolve-Path $archivo).Path)
$texto  = [System.Text.Encoding]::UTF8.GetString($bytes)
$esCRLF = ([regex]::Matches($texto, "`r`n")).Count -gt 0
$eol    = if ($esCRLF) { "`r`n" } else { "`n" }

if ($texto.Contains('**Estado:** CERRADA (2026-10-17, fin Sesion 26)')) {
    Write-Host "[SKIP] 92c: resumen ejecutivo ya esta cerrado (idempotente)." -ForegroundColor Yellow
    return
}

$texto = $texto.Replace('**Estado:** En curso', '**Estado:** CERRADA (2026-10-17, fin Sesion 26)')
$texto = $texto.Replace(
    '**Auditores:** Pedro J. Pirovani + IA',
    "**Auditores:** Pedro J. Pirovani + IA$eol**Cierre:** Ver [46-cierre-auditoria-inicial.md](./46-cierre-auditoria-inicial.md)"
)

$texto = $texto.Replace(
    '| SEC-001 | Archivos .env en historial de Git | Critica | Abierto |',
    '| SEC-001 | Archivos .env en historial de Git | Critica | Cerrado (S24, F4-01) |'
)
$texto = $texto.Replace(
    '| SEC-003 | Auth de admin por user_metadata | Critica | Abierto |',
    '| SEC-003 | Auth de admin por user_metadata | Critica | Cerrado (S5, F3-01) |'
)
$texto = $texto.Replace(
    '| DB-001 | 250+ advisors de Supabase | Critica | Abierto |',
    '| DB-001 | 250+ advisors de Supabase | Critica | Cerrado (S25, 0 sev 1-2) |'
)

$seccion = @(
    '',
    '---',
    '',
    '## Resumen de cierre (Sesion 26, 2026-10-17)',
    '',
    '- **Hallazgos cerrados o aceptados:** 71 de 72 (98.6%)',
    '- **Hallazgos abiertos P0/P1:** 0',
    '- **Hallazgos abiertos P2/P3:** 24 (backlog aceptado con revision agendada)',
    '- **Fases completadas:** F0 (100%), F1 (100%), F2 (100%), F3 (100%), F4 (94%, pendiente externo #4869059)',
    '- **Progreso global:** 47/47 tareas (100%)',
    '',
    'La auditoria se considera **CERRADA** con backlog P2/P3 aceptado. Los',
    'hallazgos abiertos estan documentados en `06-hallazgos-tracking.md` con',
    'fecha o condicion de revision. Ver `46-cierre-auditoria-inicial.md`.',
    ''
) -join $eol

$texto = $texto.TrimEnd() + $eol + $seccion
$bytesOrig = [System.IO.File]::ReadAllBytes((Resolve-Path $archivo).Path)
$teniaBom  = ($bytesOrig.Length -ge 3 -and $bytesOrig[0] -eq 0xEF -and $bytesOrig[1] -eq 0xBB -and $bytesOrig[2] -eq 0xBF)
$enc       = New-Object System.Text.UTF8Encoding($teniaBom)
[System.IO.File]::WriteAllText((Resolve-Path $archivo).Path, $texto, $enc)
Write-Host "[OK] 92c: resumen ejecutivo actualizado." -ForegroundColor Green

$verif = Get-Content $archivo -Raw
if (-not $verif.Contains('**Estado:** CERRADA (2026-10-17')) { throw "[ERROR] 92c: verificacion fallo." }

if ($Commit) {
    git add $archivo
    git commit -m "docs(audit): cerrar resumen ejecutivo de la auditoria (S26)"
} else {
    Write-Host "[DRY-RUN] 92c sin commit." -ForegroundColor Cyan
}