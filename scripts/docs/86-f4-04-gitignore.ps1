<#
.SYNOPSIS
    F4-04 - Actualizar .gitignore.
.DESCRIPTION
    Agrega reglas explicitas:
    - .env.production* (aunque ya lo cubra .env*)
    - *.standalone.bak (el next.config.js.standalone.bak que se colo)
    - *.orig, *.rej (higiene, conflictos de merge)
    Verifica que .backup-s*/ ya cubra las carpetas existentes.
    Idempotente: si las reglas ya estan, no hace nada.
.NOTES
    Sesion: 25
    Fecha: 2026-10-17
#>

[CmdletBinding()]
param(
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repoRoot

function Write-Ok   { param($m) Write-Host "  [OK] $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "  [WARN] $m" -ForegroundColor Yellow }
function Write-Info { param($m) Write-Host "  [INFO] $m" -ForegroundColor Cyan }

$gitignorePath = '.gitignore'
if (-not (Test-Path $gitignorePath)) { throw "No existe $gitignorePath" }

$contenido = Get-Content $gitignorePath -Raw -Encoding UTF8
$original = $contenido

# Las reglas que queremos asegurar
$reglas = @(
    @{ Patron = '^\.env\.production'; Linea = '.env.production*' },
    @{ Patron = '^\*\.standalone\.bak'; Linea = '*.standalone.bak' },
    @{ Patron = '^\*\.orig'; Linea = '*.orig' },
    @{ Patron = '^\*\.rej'; Linea = '*.rej' }
)

# Verificar .backup-s*/ (ya existe, pero avisamos)
if ($contenido -match '(?m)^\.backup-s\*/') {
    Write-Ok ".backup-s*/ ya esta en .gitignore"
} else {
    Write-Warn ".backup-s*/ NO esta en .gitignore (las carpetas .backup-s16/ etc. estan sin cubrir)"
}

# Detectar line ending del archivo
$bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $gitignorePath).Path)
$textoBytes = [System.Text.Encoding]::UTF8.GetString($bytes)
$cuentaCRLF = ([regex]::Matches($textoBytes, "`r`n")).Count
$cuentaLF   = ([regex]::Matches($textoBytes, "`n")).Count
$esCRLF = $cuentaCRLF -gt 0 -and $cuentaCRLF -eq $cuentaLF
Write-Info "Line ending detectado: $(if ($esCRLF) { 'CRLF' } else { 'LF' })"

# Agregar las que falten
$agregadas = @()
$bloqueNuevo = @()

foreach ($r in $reglas) {
    if ($contenido -match "(?m)$($r.Patron)") {
        Write-Ok "Ya esta: $($r.Linea)"
    } else {
        $bloqueNuevo += $r.Linea
        $agregadas += $r.Linea
    }
}

if ($agregadas.Count -gt 0) {
    # Agregar al final, con un comentario
    $separador = if ($esCRLF) { "`r`n" } else { "`n" }
    $encabezado = "$separador# Reglas explicitas agregadas en S25 (F4-04)$separador"
    $cuerpo = ($bloqueNuevo -join $separador) + $separador
    $contenido = $contenido.TrimEnd() + $separador + $encabezado + $cuerpo

    if ($contenido -eq $original) {
        Write-Warn "No se pudo modificar (contenido identico). Revisar manualmente."
    } else {
        [System.IO.File]::WriteAllText(
            (Resolve-Path $gitignorePath).Path,
            $contenido,
            [System.Text.UTF8Encoding]::new($false)
        )
        Write-Ok "Se agregaron $($agregadas.Count) reglas: $($agregadas -join ', ')"
    }
} else {
    Write-Info "No hay reglas que agregar. .gitignore ya esta completo."
}

# Verificacion
Write-Host "`n=== Verificacion ===" -ForegroundColor Cyan
$final = Get-Content $gitignorePath -Raw -Encoding UTF8
foreach ($r in $reglas) {
    if ($final -match "(?m)$($r.Patron)") {
        Write-Ok "Presente: $($r.Linea)"
    } else {
        Write-Warn "FALTA: $($r.Linea)"
    }
}

# Estado de archivos que matchean la nueva regla
Write-Host "`n=== Archivos afectados por las nuevas reglas ===" -ForegroundColor Cyan
$trackedStandaloneBak = git ls-files | Select-String -Pattern '\.standalone\.bak$'
if ($trackedStandaloneBak) {
    Write-Warn "Archivos trackeados que matchean *.standalone.bak (deberian eliminarse en F4-03):"
    $trackedStandaloneBak | ForEach-Object { Write-Warn "  $_" }
} else {
    Write-Ok "Ningun archivo trackeado matchea *.standalone.bak"
}

# Diff
Write-Host "`n=== Git diff ===" -ForegroundColor Cyan
$diff = git diff -- .gitignore
if ([string]::IsNullOrWhiteSpace($diff)) {
    Write-Info "Sin cambios en .gitignore."
} else {
    Write-Info "Diff:`n$diff"
}

# Commit
if ($NoCommit) {
    Write-Info "Modo -NoCommit: no se commitea."
} else {
    if ([string]::IsNullOrWhiteSpace($diff)) {
        Write-Info "No hay cambios que commitear."
    } else {
        git add $gitignorePath
        git commit -m "chore(git): reglas explicitas .env.production* y *.standalone.bak (F4-04)"
        Write-Ok "Commit creado."
    }
}

Write-Host "`n[FIN] Script 86 completado." -ForegroundColor Green