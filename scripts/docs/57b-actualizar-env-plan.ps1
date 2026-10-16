# 57b-actualizar-env-plan.ps1
# Actualiza .env.example (APIS IA -> ELIMINADAS) y PLAN (F2-13 -> No aplica).
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root
$utf8 = New-Object System.Text.UTF8Encoding($false)

# --- 1. .env.example: seccion APIS IA SECUNDARIAS ---
$envPath = Join-Path $root '.env.example'
Write-Host "=== .env.example ===" -ForegroundColor Cyan

$envTxt = [System.IO.File]::ReadAllText($envPath, $utf8)

$viejo = @(
    '# --- APIS IA SECUNDARIAS ----------------------------------------- [S] ?'
    '# Email:  [S] system.panfree@gmail.com'
    '# Estado: ? — auditar uso real antes de rotar'
    '# Si no se usan en el código, ELIMINAR.'
    'ANTHROPIC_API_KEY='
    'MISTRAL_API_KEY='
    'GROQ_API_KEY='
    'DEEPSEEK_API_KEY='
    'COHERE_API_KEY='
    'HF_API_KEY='
    'REPLICATE_API_TOKEN='
    'LEONARDO_API_KEY='
    'POLLINATIONS_API_KEY='
    'CLOUDFLARE_ACCOUNT_ID='
    'CLOUDFLARE_API_KEY='
    'AIHUBMIX_API_KEY='
    'NEXA_API_KEY='
    'AGNES_API_KEY='
) -join "`r`n"

$nuevo = @(
    '# --- APIS IA SECUNDARIAS (ELIMINADAS en S18) --------------------------------'
    '# Email:  [S] system.panfree@gmail.com'
    '# Estado: ELIMINADAS - ver DOC-013 (35-doc-apis-ia-eliminadas.md)'
    '# Nota: las 13 APIs IA eran plomeria inerte dentro del modulo Marketing (DOC-008).'
    '#       Se eliminaron de Vercel (Production + Preview) en S18.'
    '#       El codigo de Marketing que las referencia se retira junto con el modulo'
    '#       segun el plan de DOC-008. No se crea tarea nueva.'
    '# Si en el futuro se reactiva Marketing, se crean keys nuevas con el flujo estandar.'
    '# ANTHROPIC_API_KEY=      <-- eliminada de Vercel (S18)'
    '# MISTRAL_API_KEY=        <-- eliminada de Vercel (S18)'
    '# GROQ_API_KEY=           <-- eliminada de Vercel (S18)'
    '# DEEPSEEK_API_KEY=       <-- eliminada de Vercel (S18)'
    '# COHERE_API_KEY=         <-- eliminada de Vercel (S18)'
    '# HF_API_KEY=             <-- eliminada de Vercel (S18)'
    '# REPLICATE_API_TOKEN=    <-- eliminada de Vercel (S18)'
    '# LEONARDO_API_KEY=       <-- eliminada de Vercel (S18)'
    '# POLLINATIONS_API_KEY=   <-- eliminada de Vercel (S18)'
    '# CLOUDFLARE_ACCOUNT_ID=  <-- eliminada de Vercel (S18)'
    '# CLOUDFLARE_API_KEY=     <-- eliminada de Vercel (S18)'
    '# AIHUBMIX_API_KEY=       <-- eliminada de Vercel (S18)'
    '# NEXA_API_KEY=           <-- no estaba en Vercel, limpiada de .env.example'
    '# AGNES_API_KEY=          <-- eliminada de Vercel (S18)'
) -join "`r`n"

if ($envTxt.Contains($nuevo)) {
    Write-Host "  AVISO: .env.example ya estaba actualizado." -ForegroundColor Yellow
} elseif (-not $envTxt.Contains($viejo)) {
    Write-Host "  AVISO: no se encontro el bloque. Revisar manualmente." -ForegroundColor Red
} else {
    $envTxt = $envTxt.Replace($viejo, $nuevo)
    [System.IO.File]::WriteAllText($envPath, $envTxt, $utf8)
    Write-Host "  OK: seccion APIS IA marcada como ELIMINADAS." -ForegroundColor Green
}

# --- 2. PLAN-DE-TRABAJO.md: F2-13 -> No aplica ---
$planPath = Join-Path $root 'docs\operations\PLAN-DE-TRABAJO.md'
Write-Host ""
Write-Host "=== PLAN-DE-TRABAJO.md ===" -ForegroundColor Cyan

$plan = [System.IO.File]::ReadAllText($planPath, $utf8)

$viejoF213 = '| F2-13 | Auditar APIs IA secundarias | P3 | M | Pendiente | Usadas o eliminadas |'
$nuevoF213 = '| F2-13 | Auditar APIs IA secundarias | P3 | M | No aplica | 13 APIs eran plomeria inerte en Marketing (DOC-008). Eliminadas de Vercel (DOC-013). |'

if ($plan.Contains($nuevoF213)) {
    Write-Host "  AVISO: F2-13 ya estaba actualizada." -ForegroundColor Yellow
} elseif (-not $plan.Contains($viejoF213)) {
    Write-Host "  AVISO: no se encontro la fila F2-13 vieja. Revisar." -ForegroundColor Red
} else {
    $plan = $plan.Replace($viejoF213, $nuevoF213)
    [System.IO.File]::WriteAllText($planPath, $plan, $utf8)
    Write-Host "  OK: F2-13 reformulada a No aplica." -ForegroundColor Green
}

Write-Host ""
Write-Host "PROXIMO PASO: verificar con git diff y luego ejecutar 57c." -ForegroundColor Cyan