# 53c-b-actualizar-tracking-status-bitacora.ps1
# Actualiza tracking + STATUS + BITACORA con los hallazgos y avances de S18 (parcial).
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root
$utf8 = New-Object System.Text.UTF8Encoding($false)

# =====================================================================
# 1. TRACKING (06-hallazgos-tracking.md)
# =====================================================================
$trackingPath = Join-Path $root 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
Write-Host "=== tracking ===" -ForegroundColor Cyan
$t = [System.IO.File]::ReadAllText($trackingPath, $utf8)

# 1.1 Fecha + total
$t = $t.Replace(
    '**Ultima actualizacion:** 2026-10-15 (fin Sesion 17)' + "`r`n" + '**Total de hallazgos:** 55',
    '**Ultima actualizacion:** 2026-10-16 (Sesion 18 en curso)' + "`r`n" + '**Total de hallazgos:** 61'
)

# 1.2 Contadores resumen
$t = $t.Replace(
    '| Abierto | 21 |' + "`r`n" + '| En curso | 0 |' + "`r`n" + '| Cerrado | 32 |' + "`r`n" + '| Aceptado | 2 |',
    '| Abierto | 24 |' + "`r`n" + '| En curso | 0 |' + "`r`n" + '| Cerrado | 34 |' + "`r`n" + '| Aceptado | 2 |'
)

# 1.3 Por severidad (solo Media y Baja cambian: Media Cantidad 16->21, Media Cerrados 7->9; Baja Cantidad 7->9)
$t = $t.Replace(
    '| Media | 16 | 7 |',
    '| Media | 21 | 9 |'
)
$t = $t.Replace(
    '| Baja | 7 | 2 |',
    '| Baja | 9 | 2 |'
)

# 1.4 Insertar DOC-009, SEC-022, SEC-023, SEC-024 en "medios" (despues de DOC-008)
$anclaMedia = '| DOC-008 | Seccion Marketing sin uso real (~8.100 lineas) - plan de retiro | F3 | P3 | Abierto | - |'
$nuevasMedia = @(
    $anclaMedia
    '| DOC-009 | n8n: plomeria inerte, tokens nunca creados | F2 | P2 | Cerrado | (S18) |'
    '| SEC-022 | Variable basura NEXT_PUBLIC_UPLOAD_PRESETNEXT_PUBLIC_UPLOAD_PRESET en Vercel | F2 | P2 | Cerrado | (S18) |'
    '| SEC-023 | GA4 con dos juegos de credenciales coexistiendo en Vercel | F2 | P2 | Abierto | - |'
    '| SEC-024 | NEXT_PUBLIC_VAPID_EMAIL con valor sospechoso (¿JWT?) | F2 | P2 | Abierto | - |'
) -join "`r`n"

if ($t.Contains($anclaMedia) -and -not $t.Contains('| DOC-009 |')) {
    $t = $t.Replace($anclaMedia, $nuevasMedia)
    Write-Host "  OK: agregados 4 hallazgos en 'medios'." -ForegroundColor Green
} else {
    Write-Host "  AVISO: ya existia DOC-009 o no se encontro el ancla. Saltando." -ForegroundColor Yellow
}

# 1.5 Insertar DOC-010, DOC-011 en "bajos" (despues de DOC-003)
$anclaBaja = '| DOC-003 | discrepancia endpoint frontend vs backend (geminiService) | F3 | P3 | Abierto | - |'
$nuevasBaja = @(
    $anclaBaja
    '| DOC-010 | Variables en Vercel sin documentar en .env.example (GA4 service account, REVALIDATE_SECRET) | F2 | P3 | Abierto | - |'
    '| DOC-011 | Variables en .env.example sin equivalente en Vercel (CLARITY, EMAIL_FROM, BASE_URL, GEMINI_MODEL, NEXA) | F2 | P3 | Abierto | - |'
) -join "`r`n"

if ($t.Contains($anclaBaja) -and -not $t.Contains('| DOC-010 |')) {
    $t = $t.Replace($anclaBaja, $nuevasBaja)
    Write-Host "  OK: agregados 2 hallazgos en 'bajos'." -ForegroundColor Green
} else {
    Write-Host "  AVISO: ya existia DOC-010 o no se encontro el ancla. Saltando." -ForegroundColor Yellow
}

[System.IO.File]::WriteAllText($trackingPath, $t, $utf8)
Write-Host "  tracking actualizado." -ForegroundColor Green

# =====================================================================
# 2. STATUS (docs/STATUS.md)
# =====================================================================
$statusPath = Join-Path $root 'docs\STATUS.md'
Write-Host ""
Write-Host "=== STATUS ===" -ForegroundColor Cyan
$s = [System.IO.File]::ReadAllText($statusPath, $utf8)

# 2.1 Fecha + progreso global
$s = $s.Replace(
    '**Ultima actualizacion:** 2026-10-15 (fin Sesion 17)' + "`r`n" + '**Fase actual:** Fase 2 (EN CURSO)' + "`r`n" + '**Progreso global:** 66% (31 de 47 tareas)',
    '**Ultima actualizacion:** 2026-10-16 (Sesion 18 en curso)' + "`r`n" + '**Fase actual:** Fase 2 (EN CURSO)' + "`r`n" + '**Progreso global:** 68% (32 de 47 tareas)'
)

# 2.2 Fila F2 en tabla de fases
$s = $s.Replace(
    '| F2 - Rotacion claves | 14 | 8 | 0 | 6 | 57% |',
    '| F2 - Rotacion claves | 14 | 9 | 0 | 5 | 64% |'
)
# 2.3 Fila Total
$s = $s.Replace(
    '| **Total** | **47** | **31** | **0** | **16** | **66%** |',
    '| **Total** | **47** | **32** | **0** | **15** | **68%** |'
)

# 2.4 Proximos 3 pasos (F2-10 ya no aplica; ahora F2-11)
$s = $s.Replace(
    '1. **F2-10** - Rotar n8n webhook token' + "`r`n" + '2. **F2-11** - Rotar GA4 API secret' + "`r`n" + '3. **F2-12** - Regenerar par VAPID',
    '1. **F2-11** - Rotar GA4 API secret (auditar los 2 juegos primero, ver SEC-023)' + "`r`n" + '2. **F2-12** - Regenerar par VAPID (verificar SEC-024 antes)' + "`r`n" + '3. **F2-13** - Auditar APIs IA secundarias'
)

[System.IO.File]::WriteAllText($statusPath, $s, $utf8)
Write-Host "  STATUS actualizado." -ForegroundColor Green

# =====================================================================
# 3. BITACORA (docs/BITACORA.md) - agregar entrada S18 parcial al final
# =====================================================================
$bitacoraPath = Join-Path $root 'docs\BITACORA.md'
Write-Host ""
Write-Host "=== BITACORA ===" -ForegroundColor Cyan
$b = [System.IO.File]::ReadAllText($bitacoraPath, $utf8)

$entradaS18 = @(
    ''
    '---'
    ''
    '## 2026-10-16 (Sesion 18 - EN CURSO)'
    ''
    '**Duracion:** en curso'
    '**Objetivo:** ENV - F2-10 n8n (reformulada) + auditoria Vercel + hallazgos colaterales'
    ''
    '**Completado (parcial):**'
    '- Bloque 1: auditoria de n8n (script 52).'
    '  - Codigo: 20 coincidencias en 5 archivos.'
    '  - Vercel: 3 variables N8N_* NO existen.'
    '  - Veredicto: plomeria inerte. F2-10 reformulada a "No aplica".'
    '  - Doc nuevo: 32-doc-n8n-plomeria-inerte.md.'
    '- Bloque 2: auditoria completa de Vercel (vercel env ls).'
    '  - Detectada variable basura NEXT_PUBLIC_UPLOAD_PRESETNEXT_PUBLIC_UPLOAD_PRESET.'
    '  - SEC-022: eliminada de Production + Preview en Vercel.'
    '  - Doc nuevo: 33-doc-vercel-hallazgos.md.'
    '- Bloque 3: reformular PLAN-DE-TRABAJO + .env.example.'
    '  - F2-10 -> "No aplica" (mismo patron que F2-07/08/09).'
    '  - Seccion N8N en .env.example -> "NO USADO".'
    ''
    '**Hallazgos nuevos:**'
    '- DOC-009: n8n plomeria inerte (Cerrado).'
    '- SEC-022: variable basura en Vercel (Cerrado).'
    '- SEC-023: GA4 con dos juegos de credenciales coexistiendo (Abierto).'
    '- SEC-024: NEXT_PUBLIC_VAPID_EMAIL con valor sospechoso (Abierto).'
    '- DOC-010: variables en Vercel sin documentar (Abierto).'
    '- DOC-011: variables en .env.example sin equivalente en Vercel (Abierto).'
    ''
    '**Bloqueantes:**'
    '- Ninguno. Cloudinary #392411 se reconsulta a partir del 2026-10-18.'
    ''
    '**Proxima sesion / continuacion S18:**'
    '- F2-11: rotar GA4 API secret (resolver SEC-023 primero).'
    '- F2-12: regenerar par VAPID (resolver SEC-024 + BUG-001).'
    '- F2-13: secrets internos (CRON_SECRET, WEBHOOK_SECRET).'
    '- F2-14: auditar 11 APIs IA secundarias.'
    ''
    '**Pendiente:**'
    '- Reconsultar Cloudinary #392411 (a partir del 2026-10-18).'
) -join "`r`n"

if ($b.Contains('## 2026-10-16 (Sesion 18')) {
    Write-Host "  AVISO: entrada S18 ya existe. Saltando." -ForegroundColor Yellow
} else {
    $b = $b.TrimEnd() + $entradaS18 + "`r`n"
    [System.IO.File]::WriteAllText($bitacoraPath, $b, $utf8)
    Write-Host "  OK: entrada S18 agregada." -ForegroundColor Green
}

Write-Host ""
Write-Host "PROXIMO PASO: git diff para verificar." -ForegroundColor Cyan