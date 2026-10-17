<#
.SYNOPSIS
    Genera un dump de contexto de la sesión actual y lo copia al portapapeles.

.DESCRIPTION
    Recopila git log, git status, STATUS.md, últimas sesiones de BITACORA.md
    y el tracking de la auditoría vigente, y lo escribe en un archivo
    (por defecto DUMP-S<n>.txt en la raíz del repo) y opcionalmente lo copia
    al portapapeles vía clip.exe.

.PARAMETER Session
    Número de sesión. Si se omite, se infiere del último commit
    "docs(session): cerrar sesion N" + 1.

.PARAMETER OutFile
    Ruta del archivo de salida. Por defecto: DUMP-S<Session>.txt en la raíz.

.PARAMETER NoClip
    No copiar al portapapeles (útil en CI o sesiones no interactivas).

.PARAMETER Audit
    Nombre de la carpeta de auditoría dentro de docs\audits\.
    Por defecto: la más reciente por fecha en el nombre.

.EXAMPLE
    .\scripts\docs\dump-session.ps1
    .\scripts\docs\dump-session.ps1 -Session 27
    .\scripts\docs\dump-session.ps1 -Session 27 -NoClip -OutFile .\tmp\dump.txt
#>

[CmdletBinding()]
param(
    [int]    $Session,
    [string] $OutFile,
    [string] $Audit,
    [switch] $NoClip
)

$ErrorActionPreference = 'Stop'

# --- 0. Ir a la raíz del repo -------------------------------------------------
try {
    $root = (git rev-parse --show-toplevel 2>$null).Trim()
} catch { $root = $null }
if (-not $root) {
    Write-Error "No estoy dentro de un repositorio git. Abortando."
    exit 1
}
Set-Location $root

# --- 1. Inferir número de sesión si no se pasó --------------------------------
if (-not $Session) {
    $last = (git log --oneline --grep='cerrar sesion' -1) -replace '^.*cerrar sesion\s+',''
    if ($last -match '^\d+$') {
        $Session = [int]$last + 1
    } else {
        $Session = 0
        Write-Warning "No pude inferir el número de sesión. Uso 0."
    }
}

if (-not $OutFile) { $OutFile = Join-Path $root ("DUMP-S{0}.txt" -f $Session) }

# --- 2. Detectar auditoría por defecto (la más reciente) ----------------------
if (-not $Audit) {
    $auditsDir = Join-Path $root 'docs\audits'
    if (Test-Path $auditsDir) {
        $Audit = Get-ChildItem $auditsDir -Directory |
                 Sort-Object Name -Descending |
                 Select-Object -First 1 -ExpandProperty Name
    }
}

# --- 3. Helpers ---------------------------------------------------------------
$dump = [System.Collections.Generic.List[string]]::new()

function Add-Section {
    param([string]$Title, $Content, [switch]$Optional)
    $dump.Add("")
    $dump.Add("=== $Title ===")
    $dump.Add("")
    if ($null -eq $Content -or ($Content -is [array] -and $Content.Count -eq 0)) {
        if ($Optional) { return }
        $dump.Add("(vacio)")
        return
    }
    if ($Content -is [array]) {
        foreach ($line in $Content) { $dump.Add([string]$line) }
    } else {
        $dump.Add([string]$Content)
    }
}

function Add-FileSection {
    param([string]$Title, [string]$RelativePath)
    $full = Join-Path $root $RelativePath
    if (Test-Path $full) {
        Add-Section $Title (Get-Content $full -Raw -Encoding UTF8)
    } else {
        Add-Section $Title "[WARN] No existe: $RelativePath"
    }
}

# --- 4. Armar el dump ---------------------------------------------------------
$dump.Add("# DUMP Sesion S$Session")
$dump.Add("# Generado: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')")
$dump.Add("# Repo:     $root")
$dump.Add("# Branch:   $((git rev-parse --abbrev-ref HEAD).Trim())")

Add-Section "GIT LOG (ultimos 10)"   (git log --oneline -10)
Add-Section "GIT STATUS"             (git status --short)

Add-FileSection "STATUS.md" "docs\STATUS.md"

$bitacoraPath = Join-Path $root 'docs\BITACORA.md'
if (Test-Path $bitacoraPath) {
    $bitacora = (Get-Content $bitacoraPath -Raw -Encoding UTF8) -split '## 2026'
    Add-Section "BITACORA (ultimas 3 sesiones)" (($bitacora | Select-Object -Last 3) -join '## 2026')
} else {
    Add-Section "BITACORA (ultimas 3 sesiones)" "[WARN] No existe: docs\BITACORA.md"
}

if ($Audit) {
    Add-FileSection "TRACKING ($Audit)" "docs\audits\$Audit\06-hallazgos-tracking.md"
}

# --- 5. Escribir -------------------------------------------------------------
$text = $dump -join "`r`n"
$outDir = Split-Path -Parent $OutFile
if ($outDir -and -not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
Set-Content -Path $OutFile -Value $text -Encoding UTF8

$size = (Get-Item $OutFile).Length
Write-Host ("[OK] Dump escrito: {0} ({1} bytes)" -f $OutFile, $size) -ForegroundColor Green

# --- 6. Portapapeles ---------------------------------------------------------
if (-not $NoClip) {
    try {
        Get-Content $OutFile -Raw | clip.exe
        Write-Host "[OK] Copiado al portapapeles (clip.exe)" -ForegroundColor Green
    } catch {
        Write-Warning "No pude copiar al portapapeles: $($_.Exception.Message)"
    }
} else {
    Write-Host "[SKIP] -NoClip activo, no se copia al portapapeles"
}