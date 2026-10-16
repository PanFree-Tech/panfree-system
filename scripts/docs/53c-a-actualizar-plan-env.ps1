# 53c-a-actualizar-plan-env.ps1
# Actualiza PLAN-DE-TRABAJO (F2-10 -> No aplica) y .env.example (seccion n8n -> NO USADO).
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root

$utf8 = New-Object System.Text.UTF8Encoding($false)

# --- 1. PLAN-DE-TRABAJO.md ---
$planPath = Join-Path $root 'docs\operations\PLAN-DE-TRABAJO.md'
Write-Host "=== PLAN-DE-TRABAJO.md ===" -ForegroundColor Cyan

$plan = [System.IO.File]::ReadAllText($planPath, $utf8)

$viejoF210 = '| F2-10 | Rotar n8n webhook token | P2 | S | Pendiente | Webhook responde |'
$nuevoF210 = '| F2-10 | Migrar n8n a system.panfree | P2 | S | No aplica | Plomeria inerte (DOC-009). Tokens nunca creados |'

if (-not $plan.Contains($viejoF210)) {
    Write-Host "AVISO: no se encontro la linea F2-10 vieja. Puede que ya este actualizada." -ForegroundColor Yellow
    Write-Host "  Buscando: $viejoF210" -ForegroundColor DarkGray
} elseif ($plan.Contains($nuevoF210)) {
    Write-Host "F2-10 ya estaba actualizada. Sin cambios." -ForegroundColor Yellow
} else {
    $plan = $plan.Replace($viejoF210, $nuevoF210)
    [System.IO.File]::WriteAllText($planPath, $plan, $utf8)
    Write-Host "OK: F2-10 reformulada a No aplica." -ForegroundColor Green
}

# --- 2. .env.example ---
$envPath = Join-Path $root '.env.example'
Write-Host ""
Write-Host "=== .env.example ===" -ForegroundColor Cyan

$envTxt = [System.IO.File]::ReadAllText($envPath, $utf8)

$viejoHeader = '# --- N8N ---------------------------------------------------------------------'
$nuevoHeader = @(
    '# --- N8N ---------------------------------------------------------------------'
    '# Email:  [S] system.panfree@gmail.com'
    '# Estado: NO USADO - ver DOC-009 (plomeria inerte, tokens nunca creados en Vercel)'
    '# Nota: el codigo llama a estas env vars pero nunca fueron configuradas en produccion.'
    '#       - notificar-pedido/route.js: if (n8nUrl) evita la llamada si la URL no existe.'
    '#       - webhook-pedido/route.js: rechaza requests entrantes por token undefined.'
    '#       - send-whatsapp-team/route.js: N8N_WEBHOOK_TOKEN como fallback.'
    '# Bloqueante: no aplica (nunca se activo n8n). Decision de conservar plomeria.'
    '# Panel:  (n/a - n8n nunca desplegado)'
) -join "`r`n"

if (-not $envTxt.Contains($viejoHeader)) {
    Write-Host "AVISO: no se encontro el header N8N. Puede que ya este actualizado." -ForegroundColor Yellow
} elseif ($envTxt.Contains($nuevoHeader)) {
    Write-Host "Seccion N8N ya estaba actualizada. Sin cambios." -ForegroundColor Yellow
} else {
    $envTxt = $envTxt.Replace($viejoHeader, $nuevoHeader)
    [System.IO.File]::WriteAllText($envPath, $envTxt, $utf8)
    Write-Host "OK: seccion N8N marcada como NO USADO." -ForegroundColor Green
}

Write-Host ""
Write-Host "PROXIMO PASO: verificar con git diff y luego ejecutar 53c-b." -ForegroundColor Cyan