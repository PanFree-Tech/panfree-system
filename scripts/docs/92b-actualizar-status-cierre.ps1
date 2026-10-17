<#
.SYNOPSIS
    Actualiza STATUS.md al cierre de la auditoria (47/47, 100%).
.DESCRIPTION
    Cambia cabecera, tabla de fases (F2 al 100%, Total 100%) y agrega
    seccion "8. Cierre de la auditoria inicial".
.PARAMETER Commit
    Si esta presente, commitea el cambio.
.NOTES
    Script: scripts/docs/92b-actualizar-status-cierre.ps1
    Sesion: S26 (2026-10-17)
#>
[CmdletBinding()]
param([switch]$Commit, [switch]$NoCommit)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

$archivo = 'docs/STATUS.md'
if (-not (Test-Path $archivo)) { throw "No existe: $archivo" }

$bytes  = [System.IO.File]::ReadAllBytes((Resolve-Path $archivo).Path)
$texto  = [System.Text.Encoding]::UTF8.GetString($bytes)
$esCRLF = ([regex]::Matches($texto, "`r`n")).Count -gt 0
$eol    = if ($esCRLF) { "`r`n" } else { "`n" }

if ($texto.Contains('**Progreso global:** 100% (47 de 47 tareas)')) {
    Write-Host "[SKIP] 92b: STATUS ya esta en 100% (idempotente)." -ForegroundColor Yellow
    return
}

# Cabecera
$texto = $texto.Replace(
    '**Ultima actualizacion:** 2026-10-17 (fin Sesion 25)',
    '**Ultima actualizacion:** 2026-10-17 (fin Sesion 26 - auditoria cerrada)'
)
$texto = $texto.Replace(
    '**Fase actual:** Fase 2 (EN CURSO)',
    '**Fase actual:** Auditoria inicial CERRADA. Backlog P2/P3 aceptado con revision agendada.'
)
$texto = $texto.Replace(
    '**Progreso global:** 98% (46 de 47 tareas)',
    '**Progreso global:** 100% (47 de 47 tareas)'
)

# Tabla de fases
$texto = $texto.Replace(
    '| F2 - Rotacion claves | 14 | 13 | 0 | 1 | 93% |',
    '| F2 - Rotacion claves | 14 | 14 | 0 | 0 | 100% |'
)
$texto = $texto.Replace(
    '| **Total** | **47** | **46** | **1** | **0** | **98%** |',
    '| **Total** | **47** | **47** | **0** | **0** | **100%** |'
)

# Seccion 8: cierre
$seccion = @(
    '',
    '---',
    '',
    '## 8. Cierre de la auditoria inicial (Sesion 26, 2026-10-17)',
    '',
    '**Estado:** CERRADA',
    '',
    '**Hallazgos totales:** ~72',
    '- Cerrados: 45',
    '- Aceptados (riesgo documentado): 26 (los 24 abiertos P2/P3 + DB-001h + DOC-007)',
    '- No aplica: 2',
    '- **Abiertos P0/P1/P2 bloqueantes: 0**',
    '',
    '**Cobertura de la auditoria:**',
    '- Codigo fuente: auditoria completa (SEC-002/003/006/014, AUTH-001/002, DBG-001, CONF-001/002, BUG-001..013)',
    '- Base de datos Supabase: auditoria completa (DB-001a..i, SEC-004/005/007/010/011/012/013, P7, BUG-004)',
    '- Credenciales y secretos: 8 rotaciones completas + 4 limpiezas de huerfanas',
    '- Infraestructura/CI: historial purgado, branch protection, CI estricto, service worker, alias Vercel',
    '',
    '**Backlog aceptado con revision agendada:**',
    '- Familia Gemini (BUG-006..009): se cierra con DOC-008 (retiro de Marketing)',
    '- Hardcodes residuales (SEC-015/016/017): chore post-auditoria',
    '- RLS pendiente (DB-002): chore post-auditoria',
    '- Deuda documental (DOC-010/011): S30',
    '- Higiene tecnica (CONF-003/004/005, DOC-018/019): S31+',
    '- Tests reales (TST-001): sesion dedicada',
    '- Retiro de Marketing (DOC-008): sesion dedicada',
    '',
    '**Bloqueantes externos (no bloquean el cierre):**',
    '- GitHub Support #4869059 (purga de commits huerfanos, F4-02)',
    '- Cloudinary Support #392411 (Root User, F2-03)',
    '',
    '**Documento de cierre:** `docs/audits/2026-10-13-inicial/46-cierre-auditoria-inicial.md`',
    '',
    '**Proximos 3 pasos (producto, no auditoria):**',
    '1. BUG-003: `.eq(''activo'')` -> `.eq(''is_active'')` en diptico/[codigo]/page.js:98 (smoke test del proceso post-auditoria)',
    '2. SEC-015/016/017: chore de hardcodes residuales',
    '3. Familia Gemini (BUG-006..009): depende de DOC-008',
    ''
) -join $eol

$texto = $texto.TrimEnd() + $eol + $seccion
$bytesOrig = [System.IO.File]::ReadAllBytes((Resolve-Path $archivo).Path)
$teniaBom  = ($bytesOrig.Length -ge 3 -and $bytesOrig[0] -eq 0xEF -and $bytesOrig[1] -eq 0xBB -and $bytesOrig[2] -eq 0xBF)
$enc       = New-Object System.Text.UTF8Encoding($teniaBom)
[System.IO.File]::WriteAllText((Resolve-Path $archivo).Path, $texto, $enc)
Write-Host "[OK] 92b: STATUS actualizado a cierre de auditoria." -ForegroundColor Green

$verif = Get-Content $archivo -Raw
if (-not $verif.Contains('## 8. Cierre de la auditoria inicial')) { throw "[ERROR] 92b: verificacion fallo." }

if ($Commit) {
    git add $archivo
    git commit -m "docs(status): cerrar auditoria al 100% (47/47) - S26"
} else {
    Write-Host "[DRY-RUN] 92b sin commit." -ForegroundColor Cyan
}