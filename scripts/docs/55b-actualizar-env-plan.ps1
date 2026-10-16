# 55b-actualizar-env-plan.ps1
# Actualiza .env.example (SECRETS INTERNOS -> ELIMINADOS) y PLAN (nota en F2-14).
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root
$utf8 = New-Object System.Text.UTF8Encoding($false)

# --- 1. .env.example: seccion SECRETS INTERNOS ---
$envPath = Join-Path $root '.env.example'
Write-Host "=== .env.example ===" -ForegroundColor Cyan

$envTxt = [System.IO.File]::ReadAllText($envPath, $utf8)

$viejo = @(
    '# --- SECRETS INTERNOS --------------------------------------------------------'
    '# Email:  [S] system.panfree@gmail.com'
    '# Estado: OK'
    '# Generar: node -e "console.log(require(''crypto'').randomBytes(32).toString(''hex''))"'
    'CRON_SECRET='
    'WEBHOOK_SECRET='
) -join "`r`n"

$nuevo = @(
    '# --- SECRETS INTERNOS (ELIMINADOS en S18) ------------------------------------'
    '# Email:  [S] system.panfree@gmail.com'
    '# Estado: ELIMINADOS - ver DOC-012 (34-doc-secrets-internos-plomeria-inerte.md)'
    '# Nota: los 3 secrets eran plomeria inerte (0 uso en codigo, 0 uso en todo el repo).'
    '#       Se eliminaron de Vercel (Production + Preview) en S18.'
    '#       Si en el futuro se implementan cron jobs o webhooks firmados, se crean de nuevo.'
    '# Generar: node -e "console.log(require(''crypto'').randomBytes(32).toString(''hex''))"'
    '# CRON_SECRET=        <-- eliminado de Vercel (S18)'
    '# WEBHOOK_SECRET=     <-- eliminado de Vercel (S18)'
    '# REVALIDATE_SECRET=  <-- eliminado de Vercel (S18), no estaba documentado'
) -join "`r`n"

if ($envTxt.Contains($nuevo)) {
    Write-Host "  AVISO: .env.example ya estaba actualizado." -ForegroundColor Yellow
} elseif (-not $envTxt.Contains($viejo)) {
    Write-Host "  AVISO: no se encontro el bloque. Revisar manualmente." -ForegroundColor Red
} else {
    $envTxt = $envTxt.Replace($viejo, $nuevo)
    [System.IO.File]::WriteAllText($envPath, $envTxt, $utf8)
    Write-Host "  OK: seccion SECRETS INTERNOS marcada como ELIMINADOS." -ForegroundColor Green
}

# --- 2. PLAN-DE-TRABAJO.md: nota en F2-14 ---
$planPath = Join-Path $root 'docs\operations\PLAN-DE-TRABAJO.md'
Write-Host ""
Write-Host "=== PLAN-DE-TRABAJO.md ===" -ForegroundColor Cyan

$plan = [System.IO.File]::ReadAllText($planPath, $utf8)

$viejoF214 = '| F2-14 | Guardar .env consolidado en Bitwarden | P0 | S | Pendiente | Nota segura creada |'
$nuevoF214 = '| F2-14 | Guardar .env consolidado en Bitwarden | P0 | S | Pendiente | Nota segura creada. Incluye registrar en S18 la eliminacion de secrets internos (DOC-012). |'

if ($plan.Contains($nuevoF214)) {
    Write-Host "  AVISO: F2-14 ya tenia la nota." -ForegroundColor Yellow
} elseif (-not $plan.Contains($viejoF214)) {
    Write-Host "  AVISO: no se encontro la fila F2-14 vieja. Revisar." -ForegroundColor Red
} else {
    $plan = $plan.Replace($viejoF214, $nuevoF214)
    [System.IO.File]::WriteAllText($planPath, $plan, $utf8)
    Write-Host "  OK: F2-14 anotada con referencia a DOC-012." -ForegroundColor Green
}

Write-Host ""
Write-Host "PROXIMO PASO: verificar con git diff y luego ejecutar 55c." -ForegroundColor Cyan