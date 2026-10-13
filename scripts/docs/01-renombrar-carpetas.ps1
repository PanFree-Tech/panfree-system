# 01-renombrar-carpetas.ps1
# Renombra las 6 carpetas de docs/ a nombres sin numeros (best practice)
# y actualiza todos los links relativos en archivos .md.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\01-renombrar-carpetas.ps1 -NoCommit
#   powershell -ExecutionPolicy Bypass -File scripts\docs\01-renombrar-carpetas.ps1

param(
    [switch]$NoCommit
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $RepoRoot

Write-Host "=== Renombrando carpetas de docs/ ===" -ForegroundColor Cyan
Write-Host ""

# Mapeo viejo -> nuevo
$renames = @(
    @{ Old = "docs/01-arquitectura";    New = "docs/architecture"  },
    @{ Old = "docs/02-operaciones";     New = "docs/operations"    },
    @{ Old = "docs/03-integraciaciones";New = "docs/integrations"  },
    @{ Old = "docs/04-auditorias";      New = "docs/audits"        },
    @{ Old = "docs/05-runbooks";        New = "docs/runbooks"      },
    @{ Old = "docs/06-referencias";     New = "docs/reference"     }
)

# ============================================================
# 1. Renombrar carpetas con git mv
# ============================================================
Write-Host "--- Paso 1: git mv carpetas ---" -ForegroundColor Yellow

foreach ($r in $renames) {
    $oldPath = Join-Path $RepoRoot $r.Old
    $newPath = Join-Path $RepoRoot $r.New

    if (-not (Test-Path $oldPath)) {
        Write-Host "  SKIP: $($r.Old) no existe (ya renombrado?)" -ForegroundColor DarkYellow
        continue
    }
    if (Test-Path $newPath) {
        Write-Host "  SKIP: $($r.New) ya existe" -ForegroundColor DarkYellow
        continue
    }

    git mv $r.Old $r.New
    Write-Host "  [OK] $($r.Old) -> $($r.New)" -ForegroundColor Green
}

Write-Host ""

# ============================================================
# 2. Actualizar links relativos en TODOS los .md de docs/
# ============================================================
Write-Host "--- Paso 2: actualizar links en archivos .md ---" -ForegroundColor Yellow
Write-Host ""

# Construir mapa de reemplazos (solo dentro de links relativos)
# Cubre los casos: ](../01-arquitectura/  ](01-arquitectura/  ](./01-arquitectura/
$replacements = @()
foreach ($r in $renames) {
    $oldName = Split-Path $r.Old -Leaf     # 01-arquitectura
    $newName = Split-Path $r.New -Leaf     # architecture

    # Reemplazos para los 3 prefijos posibles
    $replacements += @{ From = "]($oldName/";  To = "]($newName/"  }       # sin prefijo
    $replacements += @{ From = "](../$oldName/"; To = "](../$newName/" }   # ../
    $replacements += @{ From = "](./$oldName/"; To = "](./$newName/" }     # ./
}

$docsPath = Join-Path $RepoRoot "docs"
$mdFiles = Get-ChildItem -Path $docsPath -Recurse -Filter *.md

$filesChanged = 0
$totalReplacements = 0

foreach ($file in $mdFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if (-not $content) { continue }

    $original = $content
    $fileReplacements = 0

    foreach ($rep in $replacements) {
        $before = $content.Length
        $content = $content.Replace($rep.From, $rep.To)
        if ($content.Length -ne $before) {
            $count = ([regex]::Matches($original, [regex]::Escape($rep.From))).Count
            $fileReplacements += $count
        }
    }

    if ($content -ne $original) {
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        $rel = $file.FullName.Replace($RepoRoot + '\', '')
        Write-Host "  [OK] $rel  ($fileReplacements reemplazos)" -ForegroundColor Green
        $filesChanged++
        $totalReplacements += $fileReplacements
    }
}

Write-Host ""
Write-Host "Archivos modificados: $filesChanged" -ForegroundColor Yellow
Write-Host "Reemplazos totales: $totalReplacements" -ForegroundColor Yellow
Write-Host ""

# ============================================================
# 3. Verificar links
# ============================================================
Write-Host "--- Paso 3: verificar links ---" -ForegroundColor Yellow
Write-Host ""

& powershell -ExecutionPolicy Bypass -File (Join-Path $RepoRoot "scripts\docs\00-verificar-links.ps1")
$verifyExit = $LASTEXITCODE

Write-Host ""
if ($verifyExit -ne 0) {
    Write-Host "ATENCION: hay links rotos despues del renombre." -ForegroundColor Red
    Write-Host "Revisar arriba. NO commitear hasta corregir." -ForegroundColor Red
    Write-Host ""
    Write-Host "Para revertir el renombre:" -ForegroundColor Yellow
    Write-Host "  git reset --hard HEAD"
    exit 1
}

Write-Host "Links OK. Todos los .md apuntan a archivos existentes." -ForegroundColor Green
Write-Host ""

# ============================================================
# 4. Git status + commit
# ============================================================
Write-Host "Git status:" -ForegroundColor Yellow
git status --short

if ($NoCommit) {
    Write-Host ""
    Write-Host "=== -NoCommit activado ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para commitear manualmente:"
    Write-Host "  git add -A"
    Write-Host "  git commit -m `"docs(structure): renombrar carpetas a estructura sin numeros`""
    Write-Host "  git push origin main"
    exit 0
}

Write-Host ""
$resp = Read-Host "Hacer commit y push? (s/N)"
if ($resp -ne "s" -and $resp -ne "S") {
    Write-Host "Commit cancelado. Los cambios quedan sin commitear." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== Commiteando ===" -ForegroundColor Cyan

git add -A
git commit -m "docs(structure): renombrar carpetas a estructura sin numeros"
git push origin main

Write-Host ""
Write-Host "=== Listo ===" -ForegroundColor Green
git log --oneline -3