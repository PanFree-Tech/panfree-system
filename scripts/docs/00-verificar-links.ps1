# 00-verificar-links.ps1
# Verifica que todos los links relativos en archivos .md de docs/ apunten a archivos existentes.
# No modifica nada. Solo reporta.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\00-verificar-links.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\docs\00-verificar-links.ps1 -Fix

param(
    [switch]$Fix
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $RepoRoot

Write-Host "=== Verificando links relativos en docs/ ===" -ForegroundColor Cyan
Write-Host ""

$docsPath = Join-Path $RepoRoot "docs"
if (-not (Test-Path $docsPath)) {
    Write-Host "ERROR: no existe docs/" -ForegroundColor Red
    exit 1
}

$files = Get-ChildItem -Path $docsPath -Recurse -Filter *.md
$totalLinks = 0
$brokenLinks = @()

# Regex para capturar [texto](ruta) — solo rutas relativas (empiezan con ./ o ../)
# Ignora URLs absolutas (http/https), anchors (#anchor), mailto: y tel:
$linkRegex = [regex]'\]\((\.\.?/[^\)\s]+)\)'

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if (-not $content) { continue }

    $matches = $linkRegex.Matches($content)
    foreach ($m in $matches) {
        $totalLinks++
        $link = $m.Groups[1].Value
        # Quitar anchor si lo tiene: ../ruta/archivo.md#seccion
        $linkPath = $link -replace '#.*$', ''
        if ([string]::IsNullOrWhiteSpace($linkPath)) { continue }

        # Resolver ruta relativa al archivo
        $target = Join-Path $file.DirectoryName $linkPath
        # Normalizar (resolver ../ y ./)
        try {
            $target = [System.IO.Path]::GetFullPath($target)
        } catch {
            $brokenLinks += [PSCustomObject]@{
                Source = $file.FullName.Replace($RepoRoot + '\', '')
                Link   = $link
                Reason = "Ruta invalida"
            }
            continue
        }

        if (-not (Test-Path $target)) {
            $brokenLinks += [PSCustomObject]@{
                Source = $file.FullName.Replace($RepoRoot + '\', '')
                Link   = $link
                Reason = "No existe"
            }
        }
    }
}

Write-Host "Archivos .md revisados: $($files.Count)" -ForegroundColor Yellow
Write-Host "Links relativos encontrados: $totalLinks" -ForegroundColor Yellow
Write-Host "Links rotos: $($brokenLinks.Count)" -ForegroundColor $(if ($brokenLinks.Count -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($brokenLinks.Count -gt 0) {
    Write-Host "=== Links rotos ===" -ForegroundColor Red
    foreach ($b in $brokenLinks) {
        Write-Host "  [$($b.Reason)] $($b.Source)" -ForegroundColor Red
        Write-Host "      -> $($b.Link)" -ForegroundColor DarkRed
    }
    Write-Host ""
    if ($Fix) {
        Write-Host "Modo -Fix activado, pero la correccion automatica no esta implementada." -ForegroundColor Yellow
        Write-Host "Corregir manualmente los links listados arriba." -ForegroundColor Yellow
    } else {
        Write-Host "Corregir los links manualmente antes de commitear." -ForegroundColor Yellow
    }
    exit 1
} else {
    Write-Host "OK: no se encontraron links rotos." -ForegroundColor Green
    exit 0
}