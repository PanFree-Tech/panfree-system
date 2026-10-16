# 51-corregir-proximos-pasos-s18.ps1
# Corrige los "Proximos 3 pasos" en STATUS.md: el ticket Cloudinary
# no es un paso activo (depende de terceros, 2-4 dias habiles).
# Uso:
#   .\51-corregir-proximos-pasos-s18.ps1            (dry run)
#   .\51-corregir-proximos-pasos-s18.ps1 -Commit    (aplica)

param([switch]$Commit)

$ErrorActionPreference = 'Stop'
$repoRoot = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $repoRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Write-Ok($m)   { Write-Host "  [OK] $m" -ForegroundColor Green }
function Write-Skip($m) { Write-Host "  [SKIP] $m" -ForegroundColor Yellow }
function Write-Warn($m) { Write-Host "  [WARN] $m" -ForegroundColor Yellow }

$stPath = Join-Path $repoRoot 'docs\STATUS.md'
$st = [System.IO.File]::ReadAllText($stPath, $utf8)

Write-Host ""
Write-Host "=== Corrigiendo Proximos 3 pasos ===" -ForegroundColor Cyan

$viejo = @(
    '1. **Ticket Cloudinary #392411** - Verificar respuesta de soporte (2-4 dias habiles)',
    '2. **F2-10** - Rotar n8n webhook token',
    '3. **F2-14** - Auditar 11 APIs IA secundarias (ANTHROPIC, MISTRAL, DEEPSEEK, etc.)'
) -join "`r`n"

$nuevo = @(
    '1. **F2-10** - Rotar n8n webhook token',
    '2. **F2-11** - Rotar GA4 API secret',
    '3. **F2-12** - Regenerar par VAPID',
    '',
    '> **Nota:** el ticket Cloudinary #392411 (Root User) no es un paso activo.',
    '> Depende de soporte externo (2-4 dias habiles desde 2026-10-15).',
    '> Reconsultar a partir del **2026-10-18**.'
) -join "`r`n"

if ($st.Contains($nuevo)) {
    Write-Skip "Ya corregido"
} elseif ($st.Contains($viejo)) {
    $st = $st.Replace($viejo, $nuevo)
    Write-Ok "Proximos 3 pasos corregidos"
    if ($Commit) {
        [System.IO.File]::WriteAllText($stPath, $st, $utf8)
        Write-Ok "STATUS.md escrito en disco"
    } else {
        Write-Host ""
        Write-Host "  [DRY RUN] Se reemplazarian 3 lineas." -ForegroundColor Yellow
        Write-Host "  Para aplicar:" -ForegroundColor Yellow
        Write-Host "    .\51-corregir-proximos-pasos-s18.ps1 -Commit" -ForegroundColor Yellow
    }
} else {
    Write-Warn "No matcheo el bloque. Revisar STATUS.md manualmente."
}

Write-Host ""