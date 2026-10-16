# ============================================================================
# 68b-update-s21.ps1
# ----------------------------------------------------------------------------
# Actualiza docs de seguimiento al cierre de S21:
#   - 06-hallazgos-tracking.md: DOC-017 (cerrado) + DOC-018/019 (abiertos) +
#     DOC-015/016 (no aplica)
#   - STATUS.md: header a "fin Sesion 21" + append entrada S21
#   - BITACORA.md: append entrada S21
#
# Idempotente. Dry run por defecto. -Aplicar escribe.
# ============================================================================

param(
    [switch]$Aplicar
)

$ErrorActionPreference = 'Stop'

$repoRoot     = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$trackingFile = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$statusFile   = Join-Path $repoRoot 'docs\STATUS.md'
$bitacoraFile = Join-Path $repoRoot 'docs\BITACORA.md'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 68b - Update tracking + STATUS + BITACORA (S21)' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

$modo = if ($Aplicar) { 'APLICAR' } else { 'DRY RUN' }
Write-Host "Modo: $modo" -ForegroundColor Yellow
Write-Host ''

foreach ($f in @($trackingFile, $statusFile, $bitacoraFile)) {
    if (-not (Test-Path -LiteralPath $f)) {
        Write-Host "[ERROR] No existe: $f" -ForegroundColor Red
        exit 1
    }
}

# ============================================================================
# Chequeo idempotencia
# ============================================================================

$trackingContent = [System.IO.File]::ReadAllText($trackingFile)
$statusContent   = [System.IO.File]::ReadAllText($statusFile)
$bitacoraContent = [System.IO.File]::ReadAllText($bitacoraFile)

$yaTracking = $trackingContent.Contains('DOC-017')
$yaStatus   = $statusContent.Contains('fin Sesion 21')
$yaBitacora = $bitacoraContent.Contains('Sesion 21 - COMPLETA')

Write-Host '--- Estado actual ---' -ForegroundColor Cyan
Write-Host "  Tracking tiene DOC-017?     $yaTracking"
Write-Host "  STATUS dice fin S21?        $yaStatus"
Write-Host "  BITACORA tiene S21?         $yaBitacora"
Write-Host ''

if ($yaTracking -and $yaStatus -and $yaBitacora) {
    Write-Host '[INFO] Todos los cambios ya estan aplicados. Saliendo.' -ForegroundColor Yellow
    exit 0
}

if (-not $Aplicar) {
    Write-Host '[DRY RUN] No se escribe nada. Agregar -Aplicar para aplicar.' -ForegroundColor Yellow
    Write-Host ''
    exit 0
}

# ============================================================================
# 1. TRACKING: agregar DOC-017, DOC-018, DOC-019 + marcar DOC-015/016
# ============================================================================

Write-Host '--- 1. Actualizando tracking ---' -ForegroundColor Cyan

if ($yaTracking) {
    Write-Host '  [SKIP] tracking ya tiene DOC-017' -ForegroundColor Yellow
} else {
    # Marcar DOC-015 y DOC-016 como no aplica (si existen)
    $trackingContent = $trackingContent.Replace(
        '| DOC-015 | Alias Vercel www.panfree.fit apuntaba a deployment viejo (hyx06fts0, 63d) | F4 | P2 | Abierto (revision S21) | (S20) |',
        '| DOC-015 | Alias Vercel apuntaba a deployment viejo | F4 | P2 | No aplica (falsa alarma S21) | (S21) |'
    )

    # Append de los 3 nuevos hallazgos
    $appendTracking = @(
        '',
        '| DOC-017 | Service Worker cacheaba HTML viejo (SW servia 5 chunks en vez de 16) | F3 | P2 | Cerrado (S21) | 16ea5eec |',
        '| DOC-018 | meta apple-mobile-web-app-capable deprecado | F4 | P3 | Abierto | - |',
        '| DOC-019 | Icono icon-144x144.png faltante en manifest PWA | F4 | P3 | Abierto | - |'
    ) -join "`r`n"

    # Insertar antes de "## 4. Como cerrar un hallazgo"
    $anchor = "`r`n---`r`n`r`n## 4. Como cerrar un hallazgo"
    if ($trackingContent.Contains($anchor)) {
        $trackingContent = $trackingContent.Replace($anchor, $appendTracking + $anchor)
        Write-Host '  [OK] DOC-017/018/019 agregados al tracking' -ForegroundColor Green
    } else {
        Write-Host '  [WARN] No se encontro el ancla para insertar' -ForegroundColor Yellow
    }

    [System.IO.File]::WriteAllText($trackingFile, $trackingContent, (New-Object System.Text.UTF8Encoding $false))
    Write-Host '  [OK] Tracking actualizado' -ForegroundColor Green
}
Write-Host ''

# ============================================================================
# 2. STATUS: header + append S21
# ============================================================================

Write-Host '--- 2. Actualizando STATUS ---' -ForegroundColor Cyan

if ($yaStatus) {
    Write-Host '  [SKIP] STATUS ya dice fin S21' -ForegroundColor Yellow
} else {
    $statusContent = $statusContent.Replace(
        '**Ultima actualizacion:** 2026-10-16 (fin Sesion 20)',
        '**Ultima actualizacion:** 2026-10-16 (fin Sesion 21)'
    )

    $appendStatus = @(
        '',
        '---',
        '',
        '**2026-10-16 - Sesion 21 (ENV) - COMPLETA**',
        '- Fix PWA: Service Worker ya no cachea HTML viejo (DOC-017).',
        '  - next.config.js: clientsClaim: true + runtimeCaching custom.',
        '  - Verificacion: 5 scripts -> 16 scripts en /admin.',
        '  - Commit: 16ea5eec.',
        '- Recon S21: doc 40-recon-s21.md.',
        '- STATUS actualizado a cierre real de S20.',
        '- Hallazgos nuevos: DOC-018 (meta deprecated), DOC-019 (icono 144x144).',
        '- DOC-015 y DOC-016 resultaron falsas alarmas.',
        '- Commits S21: 16ea5eec, 8cddc665, 82bf85f5.'
    ) -join "`r`n"

    $statusContent = $statusContent.TrimEnd() + "`r`n" + $appendStatus + "`r`n"
    [System.IO.File]::WriteAllText($statusFile, $statusContent, (New-Object System.Text.UTF8Encoding $false))
    Write-Host '  [OK] STATUS actualizado' -ForegroundColor Green
}
Write-Host ''

# ============================================================================
# 3. BITACORA: append S21
# ============================================================================

Write-Host '--- 3. Actualizando BITACORA ---' -ForegroundColor Cyan

if ($yaBitacora) {
    Write-Host '  [SKIP] BITACORA ya tiene S21' -ForegroundColor Yellow
} else {
    $appendBitacora = @(
        '',
        '---',
        '',
        '## 2026-10-16 (Sesion 21 - COMPLETA)',
        '',
        '**Duracion:** ~4 horas',
        '**Objetivo:** ENV - Fix Service Worker + recon + hallazgos menores',
        '',
        '**Completado:**',
        '',
        '### Bloque 0+1 - Recon + fix STATUS',
        '- 67a-v2: recon S21 (git + next.config.js).',
        '- Fix STATUS.md: header, progreso (76%), F2 (13/14), append S20.',
        '- Commit: 8cddc665.',
        '',
        '### Bloque 2 - Supabase legacy (DOC-016)',
        '- Auditoria inicial mostro "eyJ..." en Vercel env ls.',
        '- Verificacion con vercel env pull + Dashboard: valor real',
        '  es sb_publishable_. DOC-016 NO aplica.',
        '- Leccion: el CLI de Vercel puede mostrar el ojito con formato',
        '  JWT interno, no el valor real. Siempre verificar con env pull',
        '  o dashboard.',
        '',
        '### Bloque 3 - Service Worker (DOC-017)',
        '- Sintoma: /admin solo cargaba 5 scripts (framework base), no los',
        '  chunks de admin. La app se veia pero no hidrataba.',
        '- Diagnostico:',
        '  - view-source mostraba HTML correcto (13 scripts).',
        '  - document mostraba HTML viejo (5 scripts).',
        '  - El SW cacheaba HTML con CacheFirst (default de next-pwa).',
        '- Fix en next.config.js:',
        '  - clientsClaim: true.',
        '  - runtimeCaching custom (NetworkFirst para HTML).',
        '- Commit: 16ea5eec.',
        '- Verificacion: 16 scripts en el DOM (antes 5).',
        '',
        '### Hallazgos nuevos',
        '- DOC-017 (Service Worker): cerrado.',
        '- DOC-018 (meta apple deprecated): abierto F4 P3.',
        '- DOC-019 (icono 144x144 faltante): abierto F4 P3.',
        '- DOC-015 (alias Vercel): no aplica (falsa alarma).',
        '- DOC-016 (Supabase legacy): no aplica (falsa alarma).',
        '',
        '### Hallazgos cerrados en S21',
        '- DOC-017.',
        '',
        '**Commits S21:**',
        '- 16ea5eec fix(pwa): evitar cacheo de HTML en service worker (DOC-017)',
        '- 8cddc665 docs(status): actualizar STATUS a cierre S20 + recon S21',
        '- 82bf85f5 docs(audit): registrar DOC-017 + DOC-018 + DOC-019 (S21)',
        '',
        '**Bloqueantes:**',
        '- Ninguno.',
        '',
        '**Proxima sesion (S22):**',
        '- Bloque 4: rehacer 64b/64c (deuda S20).',
        '- Bloque 5: reconciliar Bitwarden vs docs (3 carpetas).',
        '- Cloudinary #392411 (reconsultar desde 2026-10-18).',
        '- F3-08 / F3-09 (ESLint + headers de seguridad).',
        '',
        '**Aprendizajes:**',
        '- El CLI de Vercel puede mostrar el ojito con formato JWT interno',
        '  para valores Sensitive. No confiar en env ls para verificar.',
        '- next-pwa sin runtimeCaching cachea HTML con CacheFirst.',
        '  Consecuencia: los clientes recurrentes quedan con HTML viejo',
        '  indefinidamente.',
        '- skipWaiting + clientsClaim son ambos necesarios para reemplazo',
        '  inmediato del SW.',
        '- Para docs con mucho codigo/comillas, creacion manual en VS Code',
        '  es mas robusta que scripts (el escaping en PowerShell 5.1 es',
        '  fragil).'
    ) -join "`r`n"

    $bitacoraContent = $bitacoraContent.TrimEnd() + "`r`n" + $appendBitacora + "`r`n"
    [System.IO.File]::WriteAllText($bitacoraFile, $bitacoraContent, (New-Object System.Text.UTF8Encoding $false))
    Write-Host '  [OK] BITACORA actualizada' -ForegroundColor Green
}
Write-Host ''

Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 68b COMPLETADO' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'PROXIMO PASO:' -ForegroundColor Yellow
Write-Host '  1. git diff --stat docs/' -ForegroundColor Yellow
Write-Host '  2. Si OK, commit + push' -ForegroundColor Yellow
Write-Host ''