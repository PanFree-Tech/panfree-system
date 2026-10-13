# 01b-fix-links-adrs.ps1
# Corrige los links rotos en docs/architecture/decisiones/*.md
# despues del renombre de carpetas (01-arquitectura -> architecture, etc).
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\01b-fix-links-adrs.ps1 -NoCommit
#   powershell -ExecutionPolicy Bypass -File scripts\docs\01b-fix-links-adrs.ps1

param(
    [switch]$NoCommit
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $RepoRoot

Write-Host "=== Corrigiendo links rotos en ADRs ===" -ForegroundColor Cyan
Write-Host ""

# Mapeo completo: cubre los 3 niveles de prefijo (../  ../../  ../../../)
$replacements = @(
    # Nivel 2 (../) — ya cubierto por el script anterior, pero por las dudas
    @{ From = '../01-arquitectura/';    To = '../architecture/'   },
    @{ From = '../02-operaciones/';     To = '../operations/'     },
    @{ From = '../03-integraciaciones/';To = '../integrations/'   },
    @{ From = '../04-auditorias/';      To = '../audits/'         },
    @{ From = '../05-runbooks/';        To = '../runbooks/'       },
    @{ From = '../06-referencias/';     To = '../reference/'      },
    # Nivel 3 (../../) — el caso que fallo
    @{ From = '../../01-arquitectura/';    To = '../../architecture/'   },
    @{ From = '../../02-operaciones/';     To = '../../operations/'     },
    @{ From = '../../03-integraciaciones/';To = '../../integrations/'   },
    @{ From = '../../04-auditorias/';      To = '../../audits/'         },
    @{ From = '../../05-runbooks/';        To = '../../runbooks/'       },
    @{ From = '../../06-referencias/';     To = '../../reference/'      }
)

$adrPath = Join-Path $RepoRoot "docs/architecture/decisiones"
if (-not (Test-Path $adrPath)) {
    Write-Host "ERROR: no existe docs/architecture/decisiones/" -ForegroundColor Red
    Write-Host "El renombre anterior no se aplico correctamente." -ForegroundColor Red
    exit 1
}

$mdFiles = Get-ChildItem -Path $adrPath -Recurse -Filter *.md
$filesChanged = 0
$totalReplacements = 0

foreach ($file in $mdFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if (-not $content) { continue }

    $original = $content
    $fileReplacements = 0

    foreach ($rep in $replacements) {
        $matches = ([regex]::Matches($content, [regex]::Escape($rep.From))).Count
        if ($matches -gt 0) {
            $content = $content.Replace($rep.From, $rep.To)
            $fileReplacements += $matches
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

# Verificar
Write-Host "--- Verificando links ---" -ForegroundColor Yellow
Write-Host ""

& powershell -ExecutionPolicy Bypass -File (Join-Path $RepoRoot "scripts\docs\00-verificar-links.ps1")
$verifyExit = $LASTEXITCODE

Write-Host ""
if ($verifyExit -ne 0) {
    Write-Host "AUN hay links rotos. Revisar arriba." -ForegroundColor Red
    Write-Host "Para revertir todo:" -ForegroundColor Yellow
    Write-Host "  git reset --hard HEAD"
    exit 1
}

Write-Host "Links OK. Todos los .md apuntan a archivos existentes." -ForegroundColor Green
Write-Host ""

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
    Write-Host "Commit cancelado." -ForegroundColor Yellow
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