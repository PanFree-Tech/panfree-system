<#
.SYNOPSIS
    Marca F2-14 como OK en PLAN-DE-TRABAJO.md.
.DESCRIPTION
    Cierre de auditoria S26. F2-14 estaba Pendiente con nota "incluye registrar
    en S18 la eliminacion de secrets internos". Se cierra con la verificacion de
    Vercel en S26 (20 variables legitimas, 0 huerfanas).
.PARAMETER Commit
    Si esta presente, commitea el cambio.
.NOTES
    Script: scripts/docs/92a-actualizar-plan-f2-14.ps1
    Sesion: S26 (2026-10-17)
#>
[CmdletBinding()]
param([switch]$Commit, [switch]$NoCommit)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

$archivo = 'docs/operations/PLAN-DE-TRABAJO.md'
if (-not (Test-Path $archivo)) { throw "No existe: $archivo" }

$bytes  = [System.IO.File]::ReadAllBytes((Resolve-Path $archivo).Path)
$texto  = [System.Text.Encoding]::UTF8.GetString($bytes)
$esCRLF = ([regex]::Matches($texto, "`r`n")).Count -gt 0
$eol    = if ($esCRLF) { "`r`n" } else { "`n" }

$lineaVieja = '| F2-14 | Guardar .env consolidado en Bitwarden | P0 | S | Pendiente | Nota segura creada. Incluye registrar en S18 la eliminacion de secrets internos (DOC-012). |'
$lineaNueva = '| F2-14 | Guardar .env consolidado en Bitwarden | P0 | S | OK | Keys productivas guardadas en Bitwarden (6 items en carpeta Produccion, con notas de rotacion). Vercel verificado en S26: 20 variables legitimas, 0 huerfanas. Reauditoria de Vercel: S30 (DOC-010/011). |'

if ($texto.Contains($lineaNueva)) {
    Write-Host "[SKIP] 92a: F2-14 ya esta en OK (idempotente)." -ForegroundColor Yellow
    return
}
if (-not $texto.Contains($lineaVieja)) {
    throw "[ERROR] 92a: no encuentro la linea F2-14 esperada en $archivo. Verificar manualmente."
}

$texto = $texto.Replace($lineaVieja, $lineaNueva)
$bytesOrig = [System.IO.File]::ReadAllBytes((Resolve-Path $archivo).Path)
$teniaBom  = ($bytesOrig.Length -ge 3 -and $bytesOrig[0] -eq 0xEF -and $bytesOrig[1] -eq 0xBB -and $bytesOrig[2] -eq 0xBF)
$enc       = New-Object System.Text.UTF8Encoding($teniaBom)
[System.IO.File]::WriteAllText((Resolve-Path $archivo).Path, $texto, $enc)
Write-Host "[OK] 92a: F2-14 marcada OK en $archivo" -ForegroundColor Green

$verif = Get-Content $archivo -Raw
if (-not $verif.Contains('| F2-14 | Guardar .env consolidado en Bitwarden | P0 | S | OK |')) {
    throw "[ERROR] 92a: verificacion post-write fallo."
}

if ($Commit) {
    git add $archivo
    git commit -m "docs(plan): marcar F2-14 OK (cierre auditoria S26)"
} else {
    Write-Host "[DRY-RUN] 92a sin commit. Correr con -Commit para commitear." -ForegroundColor Cyan
}