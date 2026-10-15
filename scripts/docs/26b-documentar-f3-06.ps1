# ============================================================================
# scripts/docs/26b-documentar-f3-06.ps1
# Documenta cierre de F3-06 / DBG-001.
# Crea doc de auditoria. Actualiza tracking, STATUS y PLAN.
# Idempotente. -Commit para commitear y pushear.
# ============================================================================
[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root
$utf8 = New-Object System.Text.UTF8Encoding($false)

# ============================================================================
# 1. Crear doc de auditoria
# ============================================================================
$docPath = Join-Path $root 'docs\audits\2026-10-13-inicial\22-f3-06-dbg-001-logger.md'

$docLines = @(
    '# F3-06 - DBG-001: console.log con datos sensibles',
    '',
    '**Fecha de cierre:** 2026-10-14',
    '**Sesion:** 13',
    '**Hallazgo:** DBG-001 (P1)',
    '**Commit:** a031ba2e',
    '',
    '---',
    '',
    '## 1. Problema',
    '',
    'DBG-001 reportaba `console.log/warn/error` con datos sensibles en `src/`.',
    'En total: **381 llamadas** en **88 archivos**, incluyendo emails, UUIDs',
    'de cliente, IDs de pedido y en algunos casos argumentos de error completos.',
    '',
    'En produccion (Vercel), estos logs van a los logs del runtime y son',
    'visibles en el dashboard de Vercel. No hay filtro automatico.',
    '',
    '---',
    '',
    '## 2. Estrategia',
    '',
    'En lugar de eliminar las 381 llamadas (perdida de trazabilidad en dev,',
    'diff enorme, riesgo alto), se creo un **logger runtime** que silencia',
    '`log` y `warn` en produccion pero mantiene `error` para observabilidad.',
    '',
    'Archivo nuevo: `src/lib/logger.js` (21 lineas):',
    '',
    '    const IS_PROD = process.env.NODE_ENV === ''production''',
    '',
    '    export function log(...args) {',
    '      if (!IS_PROD) console.log(...args)',
    '    }',
    '',
    '    export function warn(...args) {',
    '      if (!IS_PROD) console.warn(...args)',
    '    }',
    '',
    '    export function error(...args) {',
    '      console.error(...args)',
    '    }',
    '',
    '---',
    '',
    '## 3. Cambios aplicados',
    '',
    '- Creado `src/lib/logger.js`.',
    '- 381 reemplazos en 88 archivos:',
    '  - `console.log(`   -> `logger.log(`',
    '  - `console.warn(`  -> `logger.warn(`',
    '  - `console.error(` -> `logger.error(`',
    '- 88 imports agregados: `import { log, warn, error } from ''@/lib/logger''`.',
    '',
    '### Reglas de insercion del import',
    '',
    '- Si el archivo tiene `''use client''`, el import va despues del directive.',
    '- Si el archivo tiene imports multilinea (`import {` ... `} from ''x''`),',
    '  el import va despues del cierre `} from`.',
    '- Si el archivo no tiene imports, el import va al inicio.',
    '',
    '---',
    '',
    '## 4. Verificacion (DoD)',
    '',
    '- [x] `src/lib/logger.js` creado, 21 lineas, sin dependencias.',
    '- [x] 0 `console.*` residuales fuera de `logger.js`.',
    '- [x] 88 archivos con import, 0 errores de insercion.',
    '- [x] Archivos con `''use client''` con import despues del directive.',
    '- [x] Archivos con imports multilinea sin romper bloques.',
    '- [x] `src/app/page.js` y `publish-instagram/route.js` sin syntax errors.',
    '- [x] Commit `a031ba2e` pusheado a main.',
    '',
    '### Verificacion post-fix',
    '',
    '    Select-String -Path src\**\*.js,src\**\*.jsx `',
    '      -Pattern ''console\.(log|warn|error)\('' `',
    '      | Where-Object { $_.Path -notmatch ''logger\.js$'' }',
    '',
    '    -> 0 resultados',
    '',
    '---',
    '',
    '## 5. Triaje PII',
    '',
    'Se corrio un grep de PII (`email|token|password|key|secret|userId|cliente|phone|whatsapp`)',
    'sobre las lineas con logger. Resultado: **54 hits potenciales**.',
    '',
    'Clasificacion:',
    '',
    '- ~20 falsos positivos (palabra `cliente`, `email`, `key` en mensaje de contexto).',
    '- ~34 loguean identificadores reales (UUIDs, emails operativos, IDs de pedido).',
    '- 0 credenciales reales (no hay `password` ni `token` con valor).',
    '',
    'Conclusion: en produccion, `logger.log/warn` silenciados. Los 34',
    'identificadores operativos ya no se emiten. `logger.error` sigue emitiendo',
    'para observabilidad (Sentry/Vercel).',
    '',
    '---',
    '',
    '## 6. Deuda tecnica registrada',
    '',
    '- **Build local no funciona** sin `.env.local`. Esto es preexistente a',
    '  F3-06 (el fail-fast se introdujo en F3-02 / S10).',
    '  Se resolvera con F2-14 (guardar .env en Bitwarden) + crear `.env.local`.',
    '- **PWA regenera artefactos** en `public/` durante `npm run build`',
    '  (sw.js, workbox-*.js, worker-*.js). No commitear. Ya estan',
    '  trackeados y se revierten con `git checkout`.',
    '- **Imports sin uso**: en archivos con un solo `console.log` reemplazado',
    '  a `logger.log`, el import trae `log, warn, error` pero solo usa uno.',
    '  No bloquea (ESLint ignoreDuringBuilds: true). Se resuelve al hacer F3-08.',
    '',
    '---',
    '',
    '## 7. Referencias',
    '',
    '- Hallazgo: [06-hallazgos-tracking.md](./06-hallazgos-tracking.md)',
    '- Fix: commit `a031ba2e`',
    '- Script: [26a-fix-f3-06-logger.ps1](../../../scripts/docs/26a-fix-f3-06-logger.ps1)',
    '- Documentacion: [26b-documentar-f3-06.ps1](../../../scripts/docs/26b-documentar-f3-06.ps1)'
)

$docContent = ($docLines -join "`r`n") + "`r`n"

# ============================================================================
# 2. Actualizar tracking: DBG-001 Abierto -> Cerrado
# ============================================================================
$trackingPath = Join-Path $root 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$tracking = [System.IO.File]::ReadAllText($trackingPath, $utf8)

$viejoTracking = "| DBG-001 | console.log con datos sensibles | F3 | P1 | Abierto | - |"
$nuevoTracking = "| DBG-001 | console.log con datos sensibles | F3 | P1 | Cerrado | a031ba2e |"

if ($tracking.Contains($viejoTracking)) {
    $tracking = $tracking.Replace($viejoTracking, $nuevoTracking)
} elseif ($tracking.Contains($nuevoTracking)) {
    Write-Host '  [INFO] tracking ya actualizado (DBG-001 cerrado).'
} else {
    Write-Host '  [WARN] no se encontro la fila DBG-001 exacta.' -ForegroundColor Yellow
}

# Actualizar contador de resumen
$tracking = $tracking.Replace('**Ultima actualizacion:** 2026-10-14 (fin Sesion 12)', '**Ultima actualizacion:** 2026-10-14 (fin Sesion 13)')

# ============================================================================
# 3. Actualizar STATUS.md
# ============================================================================
$statusPath = Join-Path $root 'docs\STATUS.md'
$status = [System.IO.File]::ReadAllText($statusPath, $utf8)

# 3a. Fase 3: 5/9 -> 6/9
$status = $status.Replace(
    '| F3 - Codigo | 9 | 5 | 0 | 4 | 56% |',
    '| F3 - Codigo | 9 | 6 | 0 | 3 | 67% |'
)

# 3b. Total
$status = $status.Replace(
    '| **Total** | **47** | **22** | **0** | **25** | **47%** |',
    '| **Total** | **47** | **23** | **0** | **24** | **49%** |'
)

# 3c. Header
$status = $status.Replace('**Progreso global:** 47% (22 de 47 tareas)', '**Progreso global:** 49% (23 de 47 tareas)')

# 3d. Hallazgos cerrados (metricas)
$status = $status.Replace('| Hallazgos cerrados | 26 / 34 | 34 / 34 |', '| Hallazgos cerrados | 27 / 34 | 34 / 34 |')

# 3e. Proximos 3 pasos
$status = $status.Replace(
    '1. **F3-06** - DBG-001: quitar console.log con datos sensibles (P1)' + "`r`n" +
    '2. **Chores P3** - SEC-014..017 (hardcoded keys) para desbloquear Fase 2' + "`r`n" +
    '3. **Cerrar Sesion 12** - Bitacora + STATUS final',
    '1. **F3-07** - BUG-001: NEXT_PUBLIC_VAPID_KEY inconsistente (P2)' + "`r`n" +
    '2. **F3-08** - CONF-001: ESLint en build (P2)' + "`r`n" +
    '3. **Chores P3** - SEC-014..017 (hardcoded keys) para desbloquear Fase 2'
)

# ============================================================================
# 4. Actualizar PLAN-DE-TRABAJO.md
# ============================================================================
$planPath = Join-Path $root 'docs\operations\PLAN-DE-TRABAJO.md'
$plan = [System.IO.File]::ReadAllText($planPath, $utf8)

$viejoPlanF305 = "| F3-05 | AUTH-002: registro sin duplicados | P1 | S | Pendiente | Upsert con onConflict |"
$nuevoPlanF305 = "| F3-05 | AUTH-002: registro sin duplicados | P1 | S | OK | Upsert con onConflict |"

$viejoPlanF306 = "| F3-06 | DBG-001: quitar console.log en prod | P2 | M | Pendiente | NODE_ENV condicional |"
$nuevoPlanF306 = "| F3-06 | DBG-001: quitar console.log en prod | P2 | M | OK | NODE_ENV condicional |"

if ($plan.Contains($viejoPlanF305)) { $plan = $plan.Replace($viejoPlanF305, $nuevoPlanF305) }
if ($plan.Contains($viejoPlanF306)) { $plan = $plan.Replace($viejoPlanF306, $nuevoPlanF306) }

# ============================================================================
# 5. Escribir todo (solo con -Commit)
# ============================================================================
Write-Host ''
Write-Host '=== 26b - Documentar F3-06 ===' -ForegroundColor Cyan
Write-Host ("Modo: " + $(if ($Commit) { 'COMMIT' } else { 'DRY RUN' }))
Write-Host ''

if ($Commit) {
    [System.IO.File]::WriteAllText($docPath, $docContent, $utf8)
    Write-Host "  [OK] Creado: docs/audits/2026-10-13-inicial/22-f3-06-dbg-001-logger.md"

    [System.IO.File]::WriteAllText($trackingPath, $tracking, $utf8)
    Write-Host "  [OK] Actualizado: docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md"

    [System.IO.File]::WriteAllText($statusPath, $status, $utf8)
    Write-Host "  [OK] Actualizado: docs/STATUS.md"

    [System.IO.File]::WriteAllText($planPath, $plan, $utf8)
    Write-Host "  [OK] Actualizado: docs/operations/PLAN-DE-TRABAJO.md"

    Write-Host ''
    git add docs/
    git commit -m "docs(audit): documentar cierre F3-06 (DBG-001)"
    git push origin main
} else {
    Write-Host '  [DRY] Crearia: docs/audits/2026-10-13-inicial/22-f3-06-dbg-001-logger.md'
    Write-Host '  [DRY] Actualizaria: 06-hallazgos-tracking.md'
    Write-Host '  [DRY] Actualizaria: STATUS.md'
    Write-Host '  [DRY] Actualizaria: PLAN-DE-TRABAJO.md'
    Write-Host ''
    Write-Host 'Para aplicar: .\scripts\docs\26b-documentar-f3-06.ps1 -Commit' -ForegroundColor Green
}