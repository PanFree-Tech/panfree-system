# scripts/docs/82b-cierre-s24-bitacora.ps1
# S24 - Entrada de cierre de S24 en BITACORA.md
# Preserva line endings. Idempotente.

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$archivo = "docs\BITACORA.md"
$rutaAbs = (Resolve-Path $archivo).Path

$bytes = [System.IO.File]::ReadAllBytes($rutaAbs)
$contenido = [System.Text.Encoding]::UTF8.GetString($bytes)

$cuentaCRLF = ([regex]::Matches($contenido, "`r`n")).Count
$cuentaLF   = ([regex]::Matches($contenido, "`n")).Count
$esCRLF = ($cuentaCRLF -gt ($cuentaLF - $cuentaCRLF))
$le = if ($esCRLF) { "`r`n" } else { "`n" }
Write-Host "[INFO] Line ending: $(if ($esCRLF) { 'CRLF' } else { 'LF' })" -ForegroundColor DarkGray

if ($contenido.Contains('## 2026-10-17 (Sesion 24 - ENV) - COMPLETA')) {
    Write-Host "[SKIP] Entrada S24 ya existe." -ForegroundColor Yellow
    exit 0
}

$entrada = @(
    '',
    '---',
    '',
    '## 2026-10-17 (Sesion 24 - ENV) - COMPLETA',
    '',
    '**Duracion:** ~2 horas',
    '**Objetivo:** ENV - Purga de historial de Git (F4-01) + ticket GitHub Support (F4-02)',
    '',
    '**Completado:**',
    '',
    '### F4-01 - Purga de historial de Git (SEC-001)',
    '- Backup previo: bundle completo (73 MB) + mirror bare (~68 MB).',
    '- Ubicacion: C:\Users\Admin\proyectos\panfree-backup-20261017-021006\.',
    '- Ejecutado git filter-repo con --force (segunda reescritura del historial).',
    '- 363 commits procesados, 32 commits con .env* reescritos.',
    '- HEAD cambio de 691ea92c a 7526022c.',
    '- Verificacion: 0 commits con .env reales, 363 totales, .env.example intacto.',
    '- Remote origin restaurado (filter-repo lo habia removido).',
    '- Push force ejecutado: 691ea92c...7526022c (forced update).',
    '- Doc creado: docs/audits/2026-10-13-inicial/41-f4-01-purga-historial.md.',
    '',
    '### F4-02 - Ticket GitHub Support',
    '- Redactado y enviado a https://support.github.com/contact.',
    '- Motivo: purga de commits huerfanos tras filter-repo.',
    '- Los commits viejos siguen accesibles por SHA directo hasta que soporte actue.',
    '',
    '**Hallazgos cerrados:**',
    '- SEC-001: archivos .env en historial de Git (CERRADO tecnicamente; F4-02 pendiente de soporte).',
    '',
    '**Hallazgos nuevos:**',
    '- Ninguno.',
    '',
    '**Incidentes:**',
    '- git filter-repo removio automaticamente el remote origin por seguridad.',
    '  Restaurado manualmente con git remote add.',
    '',
    '**Bloqueantes:**',
    '- F4-02 depende de GitHub Support (2-5 dias habiles).',
    '',
    '**Nota sobre hashes obsoletos (SEGUNDA reescritura):**',
    '- El historial fue reescrito DOS VECES:',
    '  1. S19: correccion de autoria (script 62).',
    '  2. S24: purga de .env (script 82a).',
    '- Los hashes en BITACORA, tracking y docs de auditoria son:',
    '  - Pre-S19: obsoletos desde S19.',
    '  - Pre-S24: obsoletos desde S24.',
    '- Los MENSAJES de commit se preservan: son la referencia valida.',
    '',
    '**Proxima sesion (S25):**',
    '- F2-03: Cloudinary #392411 (reconsultar desde 2026-10-18).',
    '- F4-05: confirmar package-lock.json.',
    '- F4-06: configurar GitHub Secrets.',
    '- Backlog: 64b (auto-descubrimiento GA4).',
    '',
    '**Aprendizajes:**',
    '- git filter-repo NO soporta --version como flag; el comando devuelve',
    '  un hash en lugar de la version. No confiar en esa salida.',
    '- filter-repo remueve el remote origin por seguridad: hay que restaurarlo',
    '  manualmente antes del push force.',
    '- Verificar el estado del historial con filtros EXACTOS (.env vs .env*),',
    '  porque .env* matchea .env.example (que SI debe estar versionado).',
    '- Los backups previos son OBLIGATORIOS en operaciones destructivas.',
    '  En S24 se hicieron 2 (bundle + mirror) y ambos funcionaron.',
    ''
)

$textoNuevo = $contenido.TrimEnd("`r", "`n") + $le + ($entrada -join $le)

$utf8SinBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($rutaAbs, $textoNuevo, $utf8SinBom)

$bytesV = [System.IO.File]::ReadAllBytes($rutaAbs)
$verif = [System.Text.Encoding]::UTF8.GetString($bytesV)
if (-not $verif.Contains('## 2026-10-17 (Sesion 24 - ENV) - COMPLETA')) {
    Write-Host "[ERROR] Post-write: no se encontro la entrada S24." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Entrada S24 agregada a BITACORA.md." -ForegroundColor Green