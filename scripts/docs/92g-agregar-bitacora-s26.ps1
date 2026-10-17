<#
.SYNOPSIS
    Agrega la entrada de Sesion 26 a BITACORA.md.
.DESCRIPTION
    Cierre formal de la auditoria inicial. Idempotente: si la entrada
    ya existe, no la duplica.
.PARAMETER Commit
    Si esta presente, commitea el cambio.
.NOTES
    Script: scripts/docs/92g-agregar-bitacora-s26.ps1
    Sesion: S26 (2026-10-17)
#>
[CmdletBinding()]
param([switch]$Commit, [switch]$NoCommit)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

$archivo = 'docs/BITACORA.md'
if (-not (Test-Path $archivo)) { throw "No existe: $archivo" }

$bytes  = [System.IO.File]::ReadAllBytes((Resolve-Path $archivo).Path)
$texto  = [System.Text.Encoding]::UTF8.GetString($bytes)
$esCRLF = ([regex]::Matches($texto, "`r`n")).Count -gt 0
$eol    = if ($esCRLF) { "`r`n" } else { "`n" }

if ($texto.Contains('## 2026-10-17 (Sesion 26 - ENV) - COMPLETA')) {
    Write-Host "[SKIP] 92g: entrada S26 ya existe en BITACORA (idempotente)." -ForegroundColor Yellow
    return
}

$entrada = @(
    '',
    '---',
    '',
    '## 2026-10-17 (Sesion 26 - ENV) - COMPLETA',
    '',
    '**Duracion:** ~3 horas',
    '**Objetivo:** Cierre formal de la auditoria inicial 2026-10-13',
    '',
    '**Completado:**',
    '',
    '### Bloque 1 - Verificacion de Vercel',
    '- `vercel env ls production` ejecutado.',
    '- 20 variables en Production, todas legitimas.',
    '- 0 variables huerfanas (SEC-022, DOC-012, DOC-013 ya eliminadas en S18).',
    '- 4 variables GA4 Service Account inertes (DOC-014, revision 2027-04-16).',
    '- Conclusion: F2-14 se puede cerrar como OK.',
    '',
    '### Bloque 2 - Cierre documental de la auditoria',
    '- `PLAN-DE-TRABAJO.md`: F2-14 marcada OK.',
    '- `STATUS.md`: F2 al 100%, global 47/47 (100%), seccion "8. Cierre" agregada.',
    '- `00-resumen-ejecutivo.md`: Estado "En curso" -> "CERRADA". Tabla de hallazgos criticos actualizada (SEC-001, SEC-003, DB-001 a Cerrado). Resumen de cierre agregado.',
    '- `06-hallazgos-tracking.md`: 24 abiertos reclasificados a "Aceptado con revision agendada". Seccion "7. Cierre de la auditoria" agregada con tabla por ID.',
    '- `01-secretos-git.md`: SEC-001 a Cerrado (S24, F4-01).',
    '- `46-cierre-auditoria-inicial.md`: creado (documento de cierre formal).',
    '',
    '### Bloque 3 - Infraestructura de sesion',
    '- PR #22 mergeado (dump-session.ps1 + .gitignore para DUMP-S*.txt).',
    '- `scripts/docs/dump-session.ps1` disponible para proximas sesiones.',
    '',
    '**Hallazgos cerrados:**',
    '- Ninguno tecnico nuevo. Se formaliza el cierre de los 71 hallazgos',
    '  ya cerrados o aceptados a lo largo de las sesiones S1-S25.',
    '',
    '**Hallazgos nuevos:**',
    '- Ninguno.',
    '',
    '**Bloqueantes:**',
    '- GitHub Support #4869059 (F4-02, pendiente externo).',
    '- Cloudinary Support #392411 (F2-03, pendiente externo).',
    '',
    '**Estado de la auditoria:**',
    '- **CERRADA** al 2026-10-17.',
    '- 47/47 tareas completadas (100%).',
    '- 0 hallazgos P0/P1 abiertos.',
    '- 24 hallazgos P2/P3 en backlog aceptado con revision agendada.',
    '- 2 bloqueantes externos con ticket abierto.',
    '',
    '**Proxima sesion (S27):**',
    '- BUG-003: `.eq(''activo'')` -> `.eq(''is_active'')` en `diptico/[codigo]/page.js:98` (smoke test del proceso post-auditoria con branch protection).',
    '- Validar que el flujo PR -> CI -> merge funciona con `enforce_admins: true`.',
    '',
    '**Aprendizajes:**',
    '- La auditoria cubrio las 4 capas del proyecto: codigo, DB, credenciales,',
    '  infraestructura. No fue una auditoria "de proceso": toco codigo real,',
    '  politicas RLS reales, endpoints reales, secrets reales.',
    '- El concepto de "plomeria inerte" (codigo preparado pero sin tokens',
    '  configurados) fue clave para no sobre-remediar servicios que no se usan',
    '  (n8n, Meta, Twilio, Instagram, APIs IA secundarias).',
    '- La distincion entre "hallazgo abierto" y "hallazgo aceptado con',
    '  revision agendada" permite cerrar la auditoria sin dejar deuda sin',
    '  documentar. El criterio: si el hallazgo es P0/P1, no puede quedar',
    '  abierto; si es P2/P3, puede aceptarse con fecha de revision.',
    '- `vercel env ls` confirma la lista de variables sin exponer valores',
    '  Secret. Es la forma correcta de auditar Vercel sin tocar el `.env`.',
    ''
) -join $eol

$texto = $texto.TrimEnd() + $eol + $entrada
$bytesOrig = [System.IO.File]::ReadAllBytes((Resolve-Path $archivo).Path)
$teniaBom  = ($bytesOrig.Length -ge 3 -and $bytesOrig[0] -eq 0xEF -and $bytesOrig[1] -eq 0xBB -and $bytesOrig[2] -eq 0xBF)
$enc       = New-Object System.Text.UTF8Encoding($teniaBom)
[System.IO.File]::WriteAllText((Resolve-Path $archivo).Path, $texto, $enc)
Write-Host "[OK] 92g: entrada S26 agregada a BITACORA." -ForegroundColor Green

$verif = Get-Content $archivo -Raw
if (-not $verif.Contains('## 2026-10-17 (Sesion 26 - ENV) - COMPLETA')) { throw "[ERROR] 92g: verificacion fallo." }

if ($Commit) {
    git add $archivo
    git commit -m "docs(session): cerrar sesion 26 (ENV) - cierre de auditoria inicial"
} else {
    Write-Host "[DRY-RUN] 92g sin commit." -ForegroundColor Cyan
}