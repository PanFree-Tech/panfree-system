# ============================================================================
# 66c-cierre-s20.ps1
# ----------------------------------------------------------------------------
# Cierre documental de Sesion 20:
#   - Append entrada S20 en BITACORA.md
#   - Append seccion S20 en ROTACION-CLAVES.md
#   - Fix header + resumen del tracking (con .Replace() literal)
#   - Cerrar SEC-020
#
# Idempotente. Dry run por defecto.
# ============================================================================

param(
    [switch]$Aplicar
)

$ErrorActionPreference = 'Stop'

$repoRoot      = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$bitacoraFile  = Join-Path $repoRoot 'docs\BITACORA.md'
$rotacionFile  = Join-Path $repoRoot 'docs\operations\ROTACION-CLAVES.md'
$trackingFile  = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 66c - Cierre documental S20' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

$modo = if ($Aplicar) { 'APLICAR' } else { 'DRY RUN' }
Write-Host "Modo: $modo" -ForegroundColor Yellow
Write-Host ''

foreach ($f in @($bitacoraFile, $rotacionFile, $trackingFile)) {
    if (-not (Test-Path -LiteralPath $f)) {
        Write-Host "[ERROR] No existe: $f" -ForegroundColor Red
        exit 1
    }
}

# --- 1. Chequeo idempotencia -------------------------------------------------

$bitacoraContent = [System.IO.File]::ReadAllText($bitacoraFile)
$rotacionContent = [System.IO.File]::ReadAllText($rotacionFile)
$trackingContent = [System.IO.File]::ReadAllText($trackingFile)

$yaBitacora = $bitacoraContent.Contains('Sesion 20 (ENV) - COMPLETA')
$yaRotacion = $rotacionContent.Contains('Estado de Bitwarden al cierre de S20')
$yaTracking = $trackingContent.Contains('fin Sesion 20')

Write-Host '--- Estado actual ---' -ForegroundColor Cyan
Write-Host "  BITACORA tiene S20?     $yaBitacora"
Write-Host "  ROTACION tiene S20?     $yaRotacion"
Write-Host "  Tracking header S20?    $yaTracking"
Write-Host ''

if ($yaBitacora -and $yaRotacion -and $yaTracking) {
    Write-Host '[INFO] Los cambios ya fueron aplicados. Saliendo.' -ForegroundColor Yellow
    exit 0
}

if (-not $Aplicar) {
    Write-Host '[DRY RUN] No se escribe nada. Agregar -Aplicar para aplicar.' -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'Acciones:' -ForegroundColor Yellow
    Write-Host '  - BITACORA: append entrada S20' -ForegroundColor Yellow
    Write-Host '  - ROTACION-CLAVES: append estado S20' -ForegroundColor Yellow
    Write-Host '  - Tracking: fix header + resumen + cerrar SEC-020' -ForegroundColor Yellow
    Write-Host ''
    exit 0
}

# --- 2. BITACORA -------------------------------------------------------------

Write-Host '--- Actualizando BITACORA ---' -ForegroundColor Cyan

if ($yaBitacora) {
    Write-Host '  [SKIP] ya tiene S20' -ForegroundColor Yellow
} else {
    $appendBitacora = @(
        '',
        '## 2026-10-16 (Sesion 20 - COMPLETA)',
        '',
        '**Duracion:** ~6 horas',
        '**Objetivo:** ENV - Chore scripts + F2-12 VAPID + F3-07 + cierre',
        '',
        '**Completado:**',
        '',
        '### Bloque 0 - Chore de arranque',
        '- 64a: reescribir 59-auditar-ga4.ps1 con scope total (patron 54).',
        '- 64a commiteado como 7d2bf3a8.',
        '- 64b/64c quedaron con contenido cruzado por here-strings anidados.',
        '- Deuda registrada: recrear 64b/64c bien en S21.',
        '',
        '### Bloque 1 - F2-12 VAPID + F3-07 + SEC-014 + BUG-001 + BUG-012',
        '',
        '**Auditoria previa:**',
        '- Confirmado BUG-001: clave hardcodeada en admin/page.js distinta a Vercel.',
        '- Confirmado SEC-014: la misma constante hardcodeada.',
        '- Confirmado BUG-012 (nuevo): PWAInstallPrompt.js leia NEXT_PUBLIC_VAPID_KEY inexistente.',
        '- Confirmado SEC-024: NO aplica. Era artefacto visual del CLI de Vercel.',
        '',
        '**Rotacion:**',
        '- Par VAPID generado con Out-File (regla 7.5 aplicada).',
        '- Incidente S20-01: un par intermedio quedo expuesto en el chat de IA.',
        '  Descartado sin cargarlo. Par valido generado con redireccion.',
        '- Bitwarden: item "VAPID - Produccion" creado en carpeta',
        '  "PanFree System - Produccion". 3 campos + nota con historial.',
        '- Vercel: Production + Preview con las 3 vars nuevas.',
        '- Supabase: push_subscriptions vaciada (suscripciones huerfanas).',
        '',
        '**Fix de codigo:**',
        '- src/app/admin/page.js: const VAPID_PUBLIC_KEY desde process.env.',
        '- src/components/PWAInstallPrompt.js: idem (variable correcta).',
        '- Commit: 5923f3a6.',
        '',
        '**Hallazgo colateral (DOC-015):**',
        '- Al verificar el bundle se descubrio que el alias www.panfree.fit',
        '  apuntaba a un deployment viejo (hyx06fts0, 63d). Vercel no actualiza',
        '  el alias automaticamente.',
        '- Fix: vercel --prod --force --yes. Deployment jc4bivlqy + alias OK.',
        '- Pendiente S21: auditar si fixes previos llegaron a produccion.',
        '',
        '**Verificacion end-to-end:**',
        '- Suscripcion desde /admin -> POST /api/push-suscribir 200.',
        '- 1 fila en push_subscriptions con user_id valido.',
        '',
        '**Hallazgos cerrados:**',
        '- F2-12 (rotacion VAPID)',
        '- F3-07 (fix BUG-001 en admin)',
        '- SEC-014 (VAPID key hardcodeada)',
        '- BUG-001 (VAPID inconsistente)',
        '- BUG-012 (PWAInstallPrompt leia variable inexistente)',
        '- SEC-024 (no aplica)',
        '',
        '**Hallazgos nuevos:**',
        '- DOC-015: alias Vercel apuntaba a deployment viejo (abierto, revision S21).',
        '',
        '**Commits S20:**',
        '- 7d2bf3a8 chore(scripts): reescribir 59 con scope total (patron 54)',
        '- 5923f3a6 fix(pwa,admin): unificar VAPID_PUBLIC_KEY desde env (F3-07, SEC-014, BUG-001, BUG-012)',
        '- (pendiente) docs(session): cerrar sesion 20 (ENV) - VAPID + cierre',
        '',
        '**Aprendizajes:**',
        '- Here-strings @''...''@ NO se anidan en PowerShell.',
        '- Regla 7.5 aplicada: secretos generados por CLI van a archivo con 2>&1 | Out-File.',
        '- Service Worker puede servir chunks viejos post-redeploy.',
        '- cache:no-store rompe fetch de chunks servidos por el SW.',
        '- performance.getEntriesByType tiene buffer limitado (150-250 entries).',
        '- Vercel alias NO se actualiza solo con push a main.',
        '- Regex PowerShell con (?m)^...$ no matchea confiable en Markdown tables.',
        '  Usar .Replace() literal.',
        '',
        '**Bloqueantes:**',
        '- Ninguno.',
        '',
        '**Proxima sesion (S21):**',
        '- Rehacer 64b/64c en VS Code (script 65 y 66 completos).',
        '- Auditar DOC-015: que fixes previos llegaron a produccion.',
        '- F2-14: Bitwarden consolidado (opcional, ya cubierto por items).',
        '- Reconciliar doc vs realidad: Bitwarden tiene 3 carpetas, doc dice 1.',
        '- Items sueltos en Bitwarden (panfree.fit, supabase.com) - auditar.'
    ) -join "`r`n"

    $bitacoraContent = $bitacoraContent.TrimEnd() + "`r`n" + $appendBitacora + "`r`n"
    [System.IO.File]::WriteAllText($bitacoraFile, $bitacoraContent, (New-Object System.Text.UTF8Encoding $false))
    Write-Host '  [OK] BITACORA actualizada' -ForegroundColor Green
}

# --- 3. ROTACION-CLAVES ------------------------------------------------------

Write-Host '--- Actualizando ROTACION-CLAVES ---' -ForegroundColor Cyan

if ($yaRotacion) {
    Write-Host '  [SKIP] ya tiene S20' -ForegroundColor Yellow
} else {
    $appendRotacion = @(
        '',
        '---',
        '',
        '## Estado de Bitwarden al cierre de S20 (2026-10-16)',
        '',
        '**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion',
        '**Carpeta:** PanFree System - Produccion',
        '',
        '### Cambios respecto a S19',
        '',
        'En S20 se completo la rotacion de VAPID (F2-12), ultimo item rotable',
        'pendiente. Tambien se corrigio el codigo que consumia la clave',
        '(F3-07, SEC-014, BUG-001, BUG-012).',
        '',
        '### Items completos (6/12)',
        '',
        '| # | Item | Estado | Fecha | Notas |',
        '|---|---|---|---|---|',
        '| 1 | Supabase - Produccion | OK | 2026-10-15 (S15) | sb_publishable_/sb_secret_ + JWT rotada |',
        '| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S16) | 1 key rotada + 3 huerfanas. Ticket #392411 abierto |',
        '| 3 | Gemini - Produccion | OK | 2026-10-15 (S15) | Key rotada + 3 huerfanas eliminadas |',
        '| 4 | Resend - Produccion | OK | 2026-10-15 (S16) | Migrado [C]->[S], dominio via Claim |',
        '| 9 | GA4 - Produccion | OK | 2026-10-16 (S19) | 2 rotaciones (API secret + private key) |',
        '| 11 | **VAPID - Produccion** | **OK** | **2026-10-16 (S20)** | **Par rotado + fix de codigo. Par saliente: public recuperable, private irrecuperable** |',
        '',
        '### Items pendientes (6/12)',
        '',
        '| # | Item | Estado | Bloquea rotacion |',
        '|---|---|---|---|',
        '| 5 | Meta WhatsApp - Produccion | NO APLICA | DOC-005 |',
        '| 6 | Twilio - Produccion | NO APLICA | DOC-005 |',
        '| 7 | Instagram - Produccion | ROTO | DOC-006 |',
        '| 8 | n8n - Produccion | NO APLICA | DOC-009 |',
        '| 10 | Clarity - Produccion | Pendiente | (no bloquea rotacion) |',
        '| 12 | Secrets internos - Produccion | ELIMINADOS | DOC-012 (S18) |',
        '',
        '### Hallazgo SEC-020',
        '',
        'Cerrado en S20. Los items realmente rotables estan completos:',
        'Supabase, Cloudinary, Gemini, Resend, GA4, VAPID. Los items 5-6-7-8-12',
        'son "No aplica" o "Eliminados" por decision documentada. El item 10',
        '(Clarity) es la unica deuda menor, no bloqueante.',
        '',
        '### Politica de env.local',
        '',
        'Confirmado en S20: el archivo .env.local NO se mantiene en disco.',
        'Se reconstruye on-demand desde Bitwarden cuando se necesita',
        'desarrollo local. Esto reduce la superficie de exposicion.',
        '',
        '### Incidente S20-01 (par VAPID expuesto en chat IA)',
        '',
        'Par intermedio expuesto durante la generacion. Descartado sin cargarlo.',
        'Par valido generado con Out-File directo a archivo. Regla 7.5 aplicada.',
        'Documentado en doc 38-f2-12-rotar-vapid.md.',
        '',
        '### Deuda tecnica al cierre de S20',
        '',
        '- Rehacer 64b/64c en VS Code.',
        '- Auditar DOC-015: alias Vercel apuntaba a deployment viejo.',
        '- Migrar @supabase/auth-helpers-nextjs -> @supabase/ssr.',
        '- Sistema simple de promociones en CartSidebar (DOC-008 seccion 9).',
        '- Reconciliar doc Bitwarden (3 carpetas reales vs 1 en doc).',
        '- Auditar items sueltos: panfree.fit, supabase.com.'
    ) -join "`r`n"

    $rotacionContent = $rotacionContent.TrimEnd() + "`r`n" + $appendRotacion + "`r`n"
    [System.IO.File]::WriteAllText($rotacionFile, $rotacionContent, (New-Object System.Text.UTF8Encoding $false))
    Write-Host '  [OK] ROTACION-CLAVES actualizada' -ForegroundColor Green
}

# --- 4. Tracking: header + resumen + SEC-020 --------------------------------

Write-Host '--- Actualizando tracking (header + resumen + SEC-020) ---' -ForegroundColor Cyan

# Fix header
$trackingContent = $trackingContent.Replace(
    '**Ultima actualizacion:** 2026-10-16 (Sesion 18 en curso)',
    '**Ultima actualizacion:** 2026-10-16 (fin Sesion 20)'
)

# Fix resumen
$trackingContent = $trackingContent.Replace(
    '| Abierto | 24 |',
    '| Abierto | 20 |'
)
$trackingContent = $trackingContent.Replace(
    '| Cerrado | 36 |',
    '| Cerrado | 41 |'
)
$trackingContent = $trackingContent.Replace(
    '| Aceptado | 2 |',
    '| Aceptado | 3 |'
)

# SEC-020 (si esta abierto)
$trackingContent = $trackingContent.Replace(
    '| SEC-020 | 9 items Bitwarden pendientes (se completan durante rotacion S15) | F2 | P2 | Abierto | - |',
    '| SEC-020 | 9 items Bitwarden pendientes (se completan durante rotacion S15) | F2 | P2 | Cerrado (S20: VAPID era el ultimo) | (S20) |'
)

[System.IO.File]::WriteAllText($trackingFile, $trackingContent, (New-Object System.Text.UTF8Encoding $false))
Write-Host '  [OK] Tracking actualizado (header + resumen + SEC-020)' -ForegroundColor Green

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 66c completado' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'PROXIMO PASO (manual):' -ForegroundColor Yellow
Write-Host '  1. git diff --stat docs/' -ForegroundColor Yellow
Write-Host '  2. git add docs/ scripts/docs/66*.ps1' -ForegroundColor Yellow
Write-Host '  3. git commit -m ''docs(session): cerrar sesion 20 (ENV) - VAPID + cierre''' -ForegroundColor Yellow
Write-Host '  4. git push origin main' -ForegroundColor Yellow
Write-Host '  5. Borrar Desktop\vapid-nuevo.txt (Shift+Delete)' -ForegroundColor Yellow
Write-Host ''