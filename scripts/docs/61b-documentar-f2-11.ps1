# ============================================================================
# 61b-documentar-f2-11.ps1
# ----------------------------------------------------------------------------
# Documenta el cierre de F2-11 (rotacion completa de GA4).
# Parte B: actualiza tracking + PLAN + STATUS + .env.example.
#
# Idempotente. No commitea. Solo aplica cambios al working tree.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/docs/61b-documentar-f2-11.ps1
# ============================================================================

$ErrorActionPreference = 'Stop'

$repoRoot      = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$trackingPath  = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$planPath      = Join-Path $repoRoot 'docs\operations\PLAN-DE-TRABAJO.md'
$statusPath    = Join-Path $repoRoot 'docs\STATUS.md'
$envPath       = Join-Path $repoRoot '.env.example'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 61b - Documentar F2-11 (rotacion GA4) - Parte B' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

# ---------------------------------------------------------------------------
# 1. Tracking: cerrar SEC-023 + agregar DOC-014
# ---------------------------------------------------------------------------

Write-Host '[1/4] Actualizando tracking (SEC-023, DOC-014)...' -ForegroundColor Green

if (-not (Test-Path -LiteralPath $trackingPath)) {
    Write-Host "[ERROR] No existe: $trackingPath" -ForegroundColor Red
    exit 1
}

$trk = [System.IO.File]::ReadAllText($trackingPath)

# 1a. Cerrar SEC-023
$sec023Old = '| SEC-023 | GA4 con dos juegos de credenciales coexistiendo en Vercel | F2 | P2 | Abierto | - |'
$sec023New = '| SEC-023 | GA4 con dos juegos de credenciales coexistiendo en Vercel | F2 | P2 | Cerrado (S19) | No era duplicado: coexistencia legitima (Service Account + Measurement Protocol) |'

if ($trk.Contains($sec023New)) {
    Write-Host '      [SKIP] SEC-023 ya actualizada' -ForegroundColor Yellow
} elseif ($trk.Contains($sec023Old)) {
    $trk = $trk.Replace($sec023Old, $sec023New)
    Write-Host '      [OK] SEC-023 -> Cerrado' -ForegroundColor Green
} else {
    Write-Host '      [WARN] No se encontro el patron de SEC-023. Revisar manualmente.' -ForegroundColor Yellow
}

# 1b. Agregar DOC-014 (si no existe)
if ($trk.Contains('| DOC-014 |')) {
    Write-Host '      [SKIP] DOC-014 ya existe' -ForegroundColor Yellow
} else {
    # Agregar DOC-014 despues de DOC-013 en la tabla de severidad Media
    $doc013Line = '| DOC-013 | APIs IA secundarias (13 keys) plomeria inerte en Marketing, eliminadas de Vercel | F2 | P2 | Cerrado | (S18) |'
    $doc014Line = '| DOC-014 | GA4 Service Account plomeria inerte (cargado en ga-metrics/route.js pero no usado) | F2 | P2 | Abierto (revision 2027-04-16) | (S19) |'

    if ($trk.Contains($doc013Line)) {
        $trk = $trk.Replace($doc013Line, $doc013Line + "`r`n" + $doc014Line)
        Write-Host '      [OK] DOC-014 agregado' -ForegroundColor Green
    } else {
        Write-Host '      [WARN] No se encontro DOC-013 para insertar DOC-014 despues. Revisar manualmente.' -ForegroundColor Yellow
    }
}

[System.IO.File]::WriteAllText($trackingPath, $trk, (New-Object System.Text.UTF8Encoding $false))

# ---------------------------------------------------------------------------
# 2. PLAN-DE-TRABAJO.md: F2-11 -> OK
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '[2/4] Actualizando PLAN-DE-TRABAJO.md (F2-11)...' -ForegroundColor Green

if (-not (Test-Path -LiteralPath $planPath)) {
    Write-Host "[ERROR] No existe: $planPath" -ForegroundColor Red
    exit 1
}

$plan = [System.IO.File]::ReadAllText($planPath)

$planOld = '| F2-11 | Rotar GA4 API secret | P3 | S | Pendiente | Metricas fluyen |'
$planNew = '| F2-11 | Rotar GA4 API secret + private key | P3 | S | OK | 2 rotaciones completas. Legacy recuperable + irrecuperable documentados. Cierra SEC-023 |'

if ($plan.Contains($planNew)) {
    Write-Host '      [SKIP] F2-11 ya esta OK' -ForegroundColor Yellow
} elseif ($plan.Contains($planOld)) {
    $plan = $plan.Replace($planOld, $planNew)
    [System.IO.File]::WriteAllText($planPath, $plan, (New-Object System.Text.UTF8Encoding $false))
    Write-Host '      [OK] F2-11 -> OK' -ForegroundColor Green
} else {
    Write-Host '      [WARN] No se encontro el patron de F2-11. Revisar manualmente.' -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
# 3. STATUS.md: F2 -> 11/14, global -> 72%
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '[3/4] Actualizando STATUS.md (F2 11/14, global 72%)...' -ForegroundColor Green

if (-not (Test-Path -LiteralPath $statusPath)) {
    Write-Host "[ERROR] No existe: $statusPath" -ForegroundColor Red
    exit 1
}

$status = [System.IO.File]::ReadAllText($statusPath)

# 3a. Fila de F2
$f2Old = '| F2 - Rotacion claves | 14 | 10 | 0 | 4 | 71% |'
$f2New = '| F2 - Rotacion claves | 14 | 11 | 0 | 3 | 79% |'

if ($status.Contains($f2New)) {
    Write-Host '      [SKIP] F2 ya actualizada' -ForegroundColor Yellow
} elseif ($status.Contains($f2Old)) {
    $status = $status.Replace($f2Old, $f2New)
    Write-Host '      [OK] F2: 10/14 -> 11/14' -ForegroundColor Green
} else {
    Write-Host '      [WARN] No se encontro la fila de F2. Revisar manualmente.' -ForegroundColor Yellow
}

# 3b. Fila Total
$totalOld = '| **Total** | **47** | **33** | **0** | **14** | **70%** |'
$totalNew = '| **Total** | **47** | **34** | **0** | **13** | **72%** |'

if ($status.Contains($totalNew)) {
    Write-Host '      [SKIP] Total ya actualizado' -ForegroundColor Yellow
} elseif ($status.Contains($totalOld)) {
    $status = $status.Replace($totalOld, $totalNew)
    Write-Host '      [OK] Total: 33/47 -> 34/47' -ForegroundColor Green
} else {
    Write-Host '      [WARN] No se encontro la fila Total. Revisar manualmente.' -ForegroundColor Yellow
}

# 3c. Header (progreso)
$headerOld = '**Progreso global:** 70% (33 de 47 tareas)'
$headerNew = '**Progreso global:** 72% (34 de 47 tareas)'

if ($status.Contains($headerNew)) {
    Write-Host '      [SKIP] Header ya actualizado' -ForegroundColor Yellow
} elseif ($status.Contains($headerOld)) {
    $status = $status.Replace($headerOld, $headerNew)
    Write-Host '      [OK] Header: 70% -> 72%' -ForegroundColor Green
} else {
    Write-Host '      [WARN] No se encontro el header de progreso. Revisar manualmente.' -ForegroundColor Yellow
}

# 3d. Proximos 3 pasos
$pasosOld = @'
1. **F2-11** - Rotar GA4 API secret (auditar los 2 juegos primero, ver SEC-023)
2. **F2-12** - Regenerar par VAPID (verificar SEC-024 antes)
3. **F2-14** - Guardar .env consolidado en Bitwarden
'@

$pasosNew = @'
1. **F2-12** - Regenerar par VAPID (verificar SEC-024 + BUG-001 antes)
2. **F2-14** - Guardar .env consolidado en Bitwarden
3. **F3-07** - Fix BUG-001 (VAPID inconsistente en admin/page.js)
'@

# Normalizar el bloque viejo (maneja \r\n y \n)
$pasosOldNorm = $pasosOld.Replace("`r`n", "`n")
$statusNorm = $status.Replace("`r`n", "`n")

if ($statusNorm.Contains($pasosOldNorm)) {
    $statusNorm = $statusNorm.Replace($pasosOldNorm, $pasosNew.Replace("`r`n", "`n"))
    $status = $statusNorm.Replace("`n", "`r`n")
    Write-Host '      [OK] Proximos 3 pasos actualizados' -ForegroundColor Green
} else {
    Write-Host '      [SKIP/WARN] No se encontro el bloque de proximos pasos. Revisar manualmente.' -ForegroundColor Yellow
}

[System.IO.File]::WriteAllText($statusPath, $status, (New-Object System.Text.UTF8Encoding $false))

# ---------------------------------------------------------------------------
# 4. .env.example: comentario de rotacion en seccion GA4
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '[4/4] Actualizando .env.example (seccion GA4)...' -ForegroundColor Green

if (-not (Test-Path -LiteralPath $envPath)) {
    Write-Host "[ERROR] No existe: $envPath" -ForegroundColor Red
    exit 1
}

$envTxt = [System.IO.File]::ReadAllText($envPath)

$envOldLine = @'
# --- GA4 ---------------------------------------------------------------------
# Email:  [S] system.panfree@gmail.com
# Estado: OK
# Panel:  https://analytics.google.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-QE8GQS3MSR
GA4_API_SECRET=
GA_PROPERTY_ID=
'@

$envNewLine = @'
# --- GA4 ---------------------------------------------------------------------
# Email:  [S] system.panfree@gmail.com
# Estado: OK
# Rotado: 2026-10-16 (S19) - F2-11
#   - GA4_API_SECRET  (Measurement Protocol): rotado + secret viejo revocado
#   - GA4_PRIVATE_KEY (Service Account):      rotado + key vieja revocada
# Nota: el Service Account (GA4_PROJECT_ID, GA4_PRIVATE_KEY, GA4_CLIENT_EMAIL,
#       GA_PROPERTY_ID) esta cargado en Vercel pero NO usado por el codigo actual.
#       El endpoint admin/ga-metrics/route.js calcula metricas solo desde
#       Supabase, no llama a la Data API de Google. Ver SEC-023 / DOC-014.
# Panel:  https://analytics.google.com
# Cloud:  https://console.cloud.google.com (project: gen-lang-client-0840688115)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-QE8GQS3MSR
GA4_API_SECRET=
GA_PROPERTY_ID=
GA4_PROJECT_ID=
GA4_CLIENT_EMAIL=
GA4_PRIVATE_KEY=
'@

# Normalizar el bloque viejo (maneja \r\n y \n)
$envOldNorm = $envOldLine.Replace("`r`n", "`n")
$envTxtNorm = $envTxt.Replace("`r`n", "`n")

if ($envTxtNorm.Contains('Rotado: 2026-10-16 (S19) - F2-11')) {
    Write-Host '      [SKIP] Seccion GA4 ya actualizada' -ForegroundColor Yellow
} elseif ($envTxtNorm.Contains($envOldNorm)) {
    $envTxtNorm = $envTxtNorm.Replace($envOldNorm, $envNewLine.Replace("`r`n", "`n"))
    $envTxt = $envTxtNorm.Replace("`n", "`r`n")
    [System.IO.File]::WriteAllText($envPath, $envTxt, (New-Object System.Text.UTF8Encoding $false))
    Write-Host '      [OK] Seccion GA4 actualizada' -ForegroundColor Green
} else {
    Write-Host '      [WARN] No se encontro el bloque exacto de GA4. Revisar manualmente.' -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
# Verificacion
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '--- Verificacion ---' -ForegroundColor Cyan

$trkChk = [System.IO.File]::ReadAllText($trackingPath)
if ($trkChk.Contains('| SEC-023 |') -and $trkChk.Contains('Cerrado (S19)')) {
    Write-Host '  [OK] SEC-023 cerrada' -ForegroundColor Green
} else {
    Write-Host '  [WARN] SEC-023 no quedo cerrada' -ForegroundColor Yellow
}

if ($trkChk.Contains('| DOC-014 |')) {
    Write-Host '  [OK] DOC-014 registrado' -ForegroundColor Green
} else {
    Write-Host '  [WARN] DOC-014 no registrado' -ForegroundColor Yellow
}

$planChk = [System.IO.File]::ReadAllText($planPath)
if ($planChk.Contains('| F2-11 |') -and $planChk.Contains('| OK | 2 rotaciones completas')) {
    Write-Host '  [OK] F2-11 marcada OK' -ForegroundColor Green
} else {
    Write-Host '  [WARN] F2-11 no quedo OK' -ForegroundColor Yellow
}

$statusChk = [System.IO.File]::ReadAllText($statusPath)
if ($statusChk.Contains('72% (34 de 47 tareas)')) {
    Write-Host '  [OK] STATUS header 72%' -ForegroundColor Green
} else {
    Write-Host '  [WARN] STATUS header no actualizado' -ForegroundColor Yellow
}

$envChk = [System.IO.File]::ReadAllText($envPath)
if ($envChk.Contains('Rotado: 2026-10-16 (S19) - F2-11')) {
    Write-Host '  [OK] .env.example seccion GA4 actualizada' -ForegroundColor Green
} else {
    Write-Host '  [WARN] .env.example no actualizado' -ForegroundColor Yellow
}

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 61b COMPLETADO' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Siguiente: revisar git diff y commitear con:' -ForegroundColor Yellow
Write-Host '  git add .' -ForegroundColor White
Write-Host '  git commit -m "security(env): rotar GA4 API secret y private key (F2-11, SEC-023)"' -ForegroundColor White
Write-Host ''