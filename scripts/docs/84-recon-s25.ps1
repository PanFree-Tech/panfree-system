<#
.SYNOPSIS
    Recon S25 - Estado del proyecto al inicio de la Sesion 25.
.DESCRIPTION
    Solo lectura. No modifica archivos ni el repositorio.
    Recolecta informacion para planificar F4-03, F4-04, F4-05, F4-06, F4-07, F4-08.
.NOTES
    Sesion: 25
    Fecha: 2026-10-17
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

function Write-Section {
    param([string]$Titulo)
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host " $Titulo" -ForegroundColor Cyan
    Write-Host ("=" * 70) -ForegroundColor Cyan
}

function Write-Line {
    param([string]$Texto, [string]$Color = 'White')
    Write-Host $Texto -ForegroundColor $Color
}

# Ir a la raiz del repo (asumiendo scripts\docs\84-*.ps1 -> repo root = ..\..)
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repoRoot
Write-Host "Repo root: $repoRoot" -ForegroundColor Green

# ------------------------------------------------------------------
Write-Section "1. GIT - Estado actual"

$head = git rev-parse HEAD
$branch = git rev-parse --abbrev-ref HEAD
Write-Line "HEAD:    $head"
Write-Line "Branch:  $branch"

Write-Line "`nUltimos 5 commits:"
git log --oneline -5 | ForEach-Object { Write-Line "  $_" }

Write-Line "`nWorking tree (git status --short):"
$status = git status --short
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Line "  (limpio)" 'Green'
} else {
    $status -split "`n" | ForEach-Object { Write-Line "  $_" 'Yellow' }
}

# ------------------------------------------------------------------
Write-Section "2. F4-05 - package-lock.json"

$pkgLockTracked = git ls-files package-lock.json
if ([string]::IsNullOrWhiteSpace($pkgLockTracked)) {
    Write-Line "  package-lock.json NO esta trackeado en git." 'Red'
    Write-Line "  -> F4-05 debe agregarlo al repo." 'Yellow'
} else {
    Write-Line "  package-lock.json SI esta trackeado." 'Green'
    $info = git log -1 --format='%h %ci %s' -- package-lock.json
    Write-Line "  Ultimo commit que lo toco: $info"
}

if (Test-Path 'package-lock.json') {
    $size = [math]::Round((Get-Item 'package-lock.json').Length / 1KB, 1)
    Write-Line "  Tamano en disco: $size KB"
} else {
    Write-Line "  package-lock.json NO existe en disco." 'Red'
}

# ------------------------------------------------------------------
Write-Section "3. F4-04 - .gitignore vs .env.production*"

if (Test-Path '.gitignore') {
    $gitignore = Get-Content '.gitignore' -Raw
    Write-Line "  .gitignore existe."
    Write-Line "`n  Lineas que mencionan .env:"
    (Get-Content '.gitignore') | Where-Object { $_ -match '\.env' } | ForEach-Object { Write-Line "    $_" }

    $tieneProductionExplicit = $gitignore -match '\.env\.production'
    if ($tieneProductionExplicit) {
        Write-Line "`n  SI hay regla explicita para .env.production*." 'Green'
    } else {
        Write-Line "`n  NO hay regla explicita para .env.production* (hoy lo cubre '.env*')." 'Yellow'
        Write-Line "  -> F4-04 agrega la regla explicita." 'Yellow'
    }
} else {
    Write-Line "  .gitignore NO existe." 'Red'
}

Write-Line "`n  Archivos .env trackeados en git (deberia ser solo .env.example):"
$envTracked = git ls-files | Select-String -Pattern '^\.env'
if ($envTracked) {
    $envTracked | ForEach-Object { Write-Line "    $_" 'Yellow' }
} else {
    Write-Line "    (ninguno)" 'Red'
}

# ------------------------------------------------------------------
Write-Section "4. F4-03 - Archivos basura"

$basuraCandidatos = @(
    'test.txt',
    'test-supabase.js',
    'test.js',
    '.DS_Store',
    'Thumbs.db'
)

Write-Line "  Busqueda de candidatos conocidos:"
foreach ($f in $basuraCandidatos) {
    if (Test-Path $f) {
        $tracked = git ls-files $f
        $estado = if ($tracked) { "TRACKEADO" } else { "no trackeado" }
        Write-Line "    $f -> existe ($estado)" 'Yellow'
    }
}

Write-Line "`n  Archivos *.bak en working tree:"
$baks = Get-ChildItem -Recurse -File -Filter '*.bak' -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch '\\node_modules\\|\\.next\\|\\.git\\' }
if ($baks) {
    $baks | ForEach-Object { Write-Line "    $($_.FullName.Substring($repoRoot.Path.Length+1))" 'Yellow' }
} else {
    Write-Line "    (ninguno)"
}

Write-Line "`n  Archivos *.backup en working tree:"
$backups = Get-ChildItem -Recurse -File -Filter '*.backup' -ErrorAction SilentlyContinue |
           Where-Object { $_.FullName -notmatch '\\node_modules\\|\\.next\\|\\.git\\' }
if ($backups) {
    $backups | ForEach-Object { Write-Line "    $($_.FullName.Substring($repoRoot.Path.Length+1))" 'Yellow' }
} else {
    Write-Line "    (ninguno)"
}

Write-Line "`n  Archivos versionados que matchean patrones basura:"
$trackedBasura = git ls-files | Select-String -Pattern '(^|/)(test\.(txt|js)|.*\.bak|.*\.backup|\.DS_Store|Thumbs\.db)$'
if ($trackedBasura) {
    $trackedBasura | ForEach-Object { Write-Line "    $_" 'Yellow' }
} else {
    Write-Line "    (ninguno)"
}

# ------------------------------------------------------------------
Write-Section "5. F4-06 / F4-07 - GitHub Workflows"

$workflowsDir = '.github\workflows'
if (Test-Path $workflowsDir) {
    Write-Line "  Directorio $workflowsDir existe." 'Green'
    Write-Line "`n  Workflows encontrados:"
    Get-ChildItem $workflowsDir -File | ForEach-Object {
        $tracked = git ls-files $_.FullName.Replace($repoRoot.Path + '\', '').Replace('\','/')
        $estado = if ($tracked) { "TRACKEADO" } else { "no trackeado" }
        Write-Line "    $($_.Name) ($estado)" 'Yellow'
    }

    Write-Line "`n  continue-on-error por workflow:"
    Get-ChildItem $workflowsDir -File -Filter '*.yml' | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        $count = ([regex]::Matches($content, 'continue-on-error')).Count
        Write-Line "    $($_.Name): $count ocurrencia(s)" $(if ($count -gt 0) { 'Yellow' } else { 'Green' })
    }

    Write-Line "`n  Uso de secrets en workflows (referencias `${{ secrets.X }}):"
    $secretsUsados = @()
    Get-ChildItem $workflowsDir -File -Filter '*.yml' | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        $matches = [regex]::Matches($content, 'secrets\.([A-Z_][A-Z0-9_]*)')
        foreach ($m in $matches) {
            $secretsUsados += $m.Groups[1].Value
        }
    }
    if ($secretsUsados.Count -gt 0) {
        $secretsUsados | Sort-Object -Unique | ForEach-Object { Write-Line "    - $_" 'Yellow' }
    } else {
        Write-Line "    (ninguno)"
    }
} else {
    Write-Line "  Directorio $workflowsDir NO existe." 'Red'
    Write-Line "  -> F4-06 y F4-07 requieren crear los workflows primero." 'Yellow'
}

# ------------------------------------------------------------------
Write-Section "6. F4-01 - Verificacion post-purga (.env en historial)"

Write-Line "  Busqueda de .env reales en TODO el historial (deberia estar VACIO):"
$histEnv = git log --all --full-history --oneline -- ".env" ".env.local" ".env.production" ".env.production.backup" ".env.development" 2>$null
if ([string]::IsNullOrWhiteSpace($histEnv)) {
    Write-Line "    VACIO -> purga S24 exitosa." 'Green'
} else {
    Write-Line "    AUN HAY COMMITS con .env:" 'Red'
    $histEnv -split "`n" | ForEach-Object { Write-Line "    $_" 'Red' }
}

Write-Line "`n  .env.example sigue versionado?"
$exampleTracked = git ls-files '.env.example'
if ($exampleTracked) {
    Write-Line "    SI (correcto)." 'Green'
} else {
    Write-Line "    NO (PROBLEMA: .env.example deberia estar versionado)." 'Red'
}

# ------------------------------------------------------------------
Write-Section "7. SHAs huerfanos (informativo, no concluyente)"

Write-Line "  Probando si SHAs pre-purga siguen accesibles LOCALMENTE:"
$shasPre = @('691ea92c', '7526022c')
foreach ($sha in $shasPre) {
    $tipo = git cat-file -t $sha 2>$null
    if ($tipo -eq 'commit') {
        Write-Line "    $sha -> existe localmente (tipo: commit)" 'Yellow'
    } else {
        Write-Line "    $sha -> no existe localmente" 'Green'
    }
}
Write-Line ""
Write-Line "  NOTA: que existan localmente NO significa que existan en el remoto." 'Yellow'
Write-Line "  La purga remota depende de GitHub Support (#4869059)." 'Yellow'
Write-Line "  Esto es solo informativo, no concluyente." 'Yellow'

# ------------------------------------------------------------------
Write-Section "8. F4-08 - gh CLI disponible?"

$ghVersion = gh --version 2>$null
if ($LASTEXITCODE -eq 0 -and $ghVersion) {
    Write-Line "  gh CLI: INSTALADO." 'Green'
    Write-Line "  $($ghVersion -split "`n" | Select-Object -First 1)"
    $auth = gh auth status 2>&1
    Write-Line "`n  gh auth status:"
    $auth -split "`n" | ForEach-Object { Write-Line "    $_" }
} else {
    Write-Line "  gh CLI: NO disponible en PATH." 'Red'
    Write-Line "  -> F4-08 requiere instalacion o UI manual." 'Yellow'
}

# ------------------------------------------------------------------
Write-Section "9. Resumen"

Write-Line "Recon S25 completado. Revisar arriba las secciones marcadas en YELLOW o RED."
Write-Line ""
Write-Line "Para el proximo paso (script 85), confirmar:"
Write-Line "  - Si package-lock.json esta trackeado (seccion 2)"
Write-Line "  - Si hay archivos basura que eliminar (seccion 4)"
Write-Line "  - Si existen .github/workflows/*.yml (seccion 5)"
Write-Line "  - Si gh CLI esta autenticado (seccion 8)"