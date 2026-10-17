<#
.SYNOPSIS
    Actualiza 06-hallazgos-tracking.md al cierre de la auditoria.
.DESCRIPTION
    Cambia tabla resumen (Abierto 0, Aceptado con revision agendada 26),
    agrega seccion 7 con tabla de reclasificacion por ID.
.PARAMETER Commit
    Si esta presente, commitea el cambio.
.NOTES
    Script: scripts/docs/92d-actualizar-tracking-cierre.ps1
    Sesion: S26 (2026-10-17)
#>
[CmdletBinding()]
param([switch]$Commit, [switch]$NoCommit)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

$archivo = 'docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md'
if (-not (Test-Path $archivo)) { throw "No existe: $archivo" }

$bytes  = [System.IO.File]::ReadAllBytes((Resolve-Path $archivo).Path)
$texto  = [System.Text.Encoding]::UTF8.GetString($bytes)
$esCRLF = ([regex]::Matches($texto, "`r`n")).Count -gt 0
$eol    = if ($esCRLF) { "`r`n" } else { "`n" }

if ($texto.Contains('## 7. Cierre de la auditoria (S26, 2026-10-17)')) {
    Write-Host "[SKIP] 92d: tracking ya esta cerrado (idempotente)." -ForegroundColor Yellow
    return
}

# Tabla resumen
$tablaVieja = @(
    '| Estado | Cantidad |',
    '|---|---|',
    '| Abierto | 24 |',
    '| En curso | 0 |',
    '| Cerrado | 45 |',
    '| Aceptado | 2 |'
) -join $eol

$tablaNueva = @(
    '| Estado | Cantidad |',
    '|---|---|',
    '| Abierto | 0 |',
    '| En curso | 0 |',
    '| Cerrado | 45 |',
    '| Aceptado con revision agendada | 26 |',
    '| No aplica | 2 |',
    '| **Total** | **~72** |',
    '',
    '> **Nota de cierre (S26, 2026-10-17):** los 24 hallazgos que estaban',
    '> "Abiertos" fueron reclasificados a "Aceptado con revision agendada"',
    '> segun su severidad (todos P2/P3) y condicion de desbloqueo. Ver',
    '> `46-cierre-auditoria-inicial.md` para el detalle por ID.'
) -join $eol

if (-not $texto.Contains($tablaVieja)) {
    throw "[ERROR] 92d: no encuentro la tabla resumen esperada. Verificar manualmente."
}
$texto = $texto.Replace($tablaVieja, $tablaNueva)

# Seccion 7 (antes de "## 6. Referencias")
$seccion = @(
    '---',
    '',
    '## 7. Cierre de la auditoria (S26, 2026-10-17)',
    '',
    'Los 24 hallazgos que estaban "Abiertos" al cierre de S25 se',
    'reclasificaron segun esta tabla:',
    '',
    '| Categoria | IDs | Condicion de revision |',
    '|---|---|---|',
    '| Familia Gemini | BUG-006, BUG-007, BUG-008, BUG-009 | Se cierran con DOC-008 (retiro de Marketing) |',
    '| Hardcodes residuales | SEC-015, SEC-016, SEC-017 | Chore post-auditoria (S28) |',
    '| RLS pendiente | DB-002 | Chore post-auditoria (S30) |',
    '| Instagram roto | DOC-006 | Bloqueante externo: RUC / Meta Business Verification (DOC-007) |',
    '| Seccion Marketing inerte | DOC-008 | Sesion dedicada (retiro de ~6.000 lineas) |',
    '| GA4 Service Account inerte | DOC-014 | Revision 2027-04-16 |',
    '| Vars .env.example vs Vercel | DOC-010, DOC-011 | S30 |',
    '| Doc Marketing desalineada | DOC-002, DOC-003 | Se cierra con BUG-008 |',
    '| PWA cosmetico | DOC-018, DOC-019 | S31+ |',
    '| Higiene tecnica | CONF-003, CONF-004, CONF-005 | S31+ |',
    '| Tests reales | TST-001 | Sesion dedicada |',
    '| BUG funcional menor | BUG-003 | S27 (smoke test post-auditoria) |',
    '| PropTypes/JSDoc | DOC-001 | Backlog |',
    '',
    '**Todos los hallazgos P0/P1 estan cerrados o aceptados.** Ninguno de',
    'los 24 abiertos representa un riesgo critico o alto. La auditoria se',
    'considera **CERRADA**.',
    ''
) -join $eol

$marcador = '## 6. Referencias'
if (-not $texto.Contains($marcador)) {
    throw "[ERROR] 92d: no encuentro '## 6. Referencias' para insertar la seccion 7."
}
$texto = $texto.Replace($marcador, $seccion + $eol + '## 6. Referencias')

$bytesOrig = [System.IO.File]::ReadAllBytes((Resolve-Path $archivo).Path)
$teniaBom  = ($bytesOrig.Length -ge 3 -and $bytesOrig[0] -eq 0xEF -and $bytesOrig[1] -eq 0xBB -and $bytesOrig[2] -eq 0xBF)
$enc       = New-Object System.Text.UTF8Encoding($teniaBom)
[System.IO.File]::WriteAllText((Resolve-Path $archivo).Path, $texto, $enc)
Write-Host "[OK] 92d: tracking actualizado al cierre." -ForegroundColor Green

$verif = Get-Content $archivo -Raw
if (-not $verif.Contains('## 7. Cierre de la auditoria (S26')) { throw "[ERROR] 92d: verificacion fallo." }

if ($Commit) {
    git add $archivo
    git commit -m "docs(audit): cerrar tracking - 24 abiertos a Aceptado con revision (S26)"
} else {
    Write-Host "[DRY-RUN] 92d sin commit." -ForegroundColor Cyan
}