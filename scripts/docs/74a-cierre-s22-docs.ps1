# ============================================================================
# 74a-cierre-s22-docs.ps1
# ----------------------------------------------------------------------------
# Cierre documental de S22:
#   - STATUS.md: header a S22 + tabla + progreso + entrada S22
#   - BITACORA.md: append entrada S22 completa
#   - ROTACION-CLAVES.md: append seccion S22
#
# Idempotente. Dry run por defecto. -Aplicar escribe.
# Verificacion post-write obligatoria.
# ============================================================================

param(
    [switch]$Aplicar
)

$ErrorActionPreference = 'Stop'

$repoRoot      = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$statusFile    = Join-Path $repoRoot 'docs\STATUS.md'
$bitacoraFile  = Join-Path $repoRoot 'docs\BITACORA.md'
$rotacionFile  = Join-Path $repoRoot 'docs\operations\ROTACION-CLAVES.md'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 74a - Cierre S22 (docs)' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

$modo = if ($Aplicar) { 'APLICAR' } else { 'DRY RUN' }
Write-Host "Modo: $modo" -ForegroundColor Yellow
Write-Host ''

foreach ($f in @($statusFile, $bitacoraFile, $rotacionFile)) {
    if (-not (Test-Path -LiteralPath $f)) {
        Write-Host "[ERROR] No existe: $f" -ForegroundColor Red
        exit 1
    }
}

# ============================================================================
# 1. STATUS.md - reemplazos literales
# ============================================================================

Write-Host '--- 1. STATUS.md ---' -ForegroundColor Cyan

$status = [System.IO.File]::ReadAllText($statusFile)

$reemplazos = @(
    @{
        Id    = 'STATUS-Header'
        Viejo = '**Ultima actualizacion:** 2026-10-16 (fin Sesion 21)'
        Nuevo = '**Ultima actualizacion:** 2026-10-16 (fin Sesion 22)'
    },
    @{
        Id    = 'STATUS-Progreso'
        Viejo = '**Progreso global:** 76% (36 de 47 tareas)'
        Nuevo = '**Progreso global:** 81% (38 de 47 tareas)'
    },
    @{
        Id    = 'STATUS-Tabla-F3'
        Viejo = '| F3 - Codigo | 9 | 7 | 0 | 2 | 78% |'
        Nuevo = '| F3 - Codigo | 9 | 9 | 0 | 0 | 100% |'
    },
    @{
        Id    = 'STATUS-Tabla-Total'
        Viejo = '| **Total** | **47** | **37** | **0** | **10** | **79%** |'
        Nuevo = '| **Total** | **47** | **38** | **0** | **9** | **81%** |'
    },
    @{
        Id    = 'STATUS-Proximos-Pasos'
        Viejo = @'
1. **F2-03** - Cloudinary Root User (reconsultar ticket #392411 desde 2026-10-18)
2. **F3-08** - ESLint en build (CONF-001)
3. **F3-09** - Headers de seguridad (CONF-002)
'@
        Nuevo = @'
1. **F2-03** - Cloudinary Root User (reconsultar ticket #392411 desde 2026-10-18)
2. **F4-01** - Purgar historial de Git (SEC-001)
3. **F4-05** - Confirmar package-lock.json en repo
'@
    },
    @{
        Id    = 'STATUS-Metrica-Hallazgos'
        Viejo = '| Hallazgos cerrados | 42 / 67 | 67 / 67 |'
        Nuevo = '| Hallazgos cerrados | 44 / 72 | 72 / 72 |'
    },
    @{
        Id    = 'STATUS-Metrica-Commits'
        Viejo = '| Commits de remediacion | ~50 | ~50 (OK) |'
        Nuevo = '| Commits de remediacion | ~59 | ~59 (OK) |'
    }
)

$planes = @()
foreach ($r in $reemplazos) {
    $tieneViejo = $status.Contains($r.Viejo)
    $tieneNuevo = $status.Contains($r.Nuevo)
    $estado = if ($tieneNuevo) { 'YA aplicado' } elseif ($tieneViejo) { 'Pendiente' } else { 'NO ENCONTRADO' }
    $color = if ($estado -eq 'Pendiente') { 'Yellow' } elseif ($estado -eq 'YA aplicado') { 'Green' } else { 'Red' }
    Write-Host "  [$($r.Id)] $estado" -ForegroundColor $color

    $planes += [pscustomobject]@{
        Id         = $r.Id
        Viejo      = $r.Viejo
        Nuevo      = $r.Nuevo
        TieneViejo = $tieneViejo
        TieneNuevo = $tieneNuevo
    }
}
Write-Host ''

# ============================================================================
# 2. BITACORA.md - append S22
# ============================================================================

Write-Host '--- 2. BITACORA.md ---' -ForegroundColor Cyan

$bitacora = [System.IO.File]::ReadAllText($bitacoraFile)
$yaBitacora = $bitacora.Contains('Sesion 22 - COMPLETA')

if ($yaBitacora) {
    Write-Host '  [SKIP] BITACORA ya tiene S22' -ForegroundColor Yellow
} else {
    Write-Host '  [OK] Se agregara entrada S22' -ForegroundColor Green
}
Write-Host ''

# ============================================================================
# 3. ROTACION-CLAVES.md - append S22
# ============================================================================

Write-Host '--- 3. ROTACION-CLAVES.md ---' -ForegroundColor Cyan

$rotacion = [System.IO.File]::ReadAllText($rotacionFile)
$yaRotacion = $rotacion.Contains('Estado de Bitwarden al cierre de S22')

if ($yaRotacion) {
    Write-Host '  [SKIP] ROTACION ya tiene S22' -ForegroundColor Yellow
} else {
    Write-Host '  [OK] Se agregara seccion S22' -ForegroundColor Green
}
Write-Host ''

# ============================================================================
# DRY RUN
# ============================================================================

if (-not $Aplicar) {
    Write-Host '[DRY RUN] No se escribe nada. Agregar -Aplicar para aplicar.' -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'Acciones que se realizarian:' -ForegroundColor Yellow
    foreach ($p in $planes) {
        if ($p.TieneNuevo) {
            Write-Host "  [SKIP] $($p.Id) - ya aplicado" -ForegroundColor Yellow
        } elseif (-not $p.TieneViejo) {
            Write-Host "  [WARN] $($p.Id) - no matchea" -ForegroundColor Yellow
        } else {
            Write-Host "  [OK]   $($p.Id) - reemplazar" -ForegroundColor Yellow
        }
    }
    if (-not $yaBitacora) { Write-Host '  [OK]   BITACORA - append S22' -ForegroundColor Yellow }
    if (-not $yaRotacion) { Write-Host '  [OK]   ROTACION-CLAVES - append S22' -ForegroundColor Yellow }
    Write-Host ''
    exit 0
}

# ============================================================================
# APLICAR
# ============================================================================

# --- STATUS.md ---

$statusNuevo = $status
foreach ($p in $planes) {
    if ($p.TieneNuevo) { continue }
    if (-not $p.TieneViejo) { continue }
    $statusNuevo = $statusNuevo.Replace($p.Viejo, $p.Nuevo)
    Write-Host "  [OK] STATUS: $($p.Id) reemplazado" -ForegroundColor Green
}

$appendStatus = @(
    '',
    '---',
    '',
    '**2026-10-16 - Sesion 22 (ENV) - COMPLETA**',
    '- Bloque 1-5: sincronizacion de docs post-S21 (STATUS, tracking, PLAN, ROTACION, Bitwarden vs docs).',
    '- Bloque 6: fix del orquestador GA4 (invocacion directa, sin powershell -File anidado).',
    '- Bloque 7 / F3-08: ESLint activo en build (CONF-001).',
    '- Bloque 8 / F3-09: headers de seguridad (CONF-002).',
    '- Progreso: 76% -> 81%. F3: 78% -> 100%.',
    '- Commits S22: e1e1ce65, 53dbd4e8, 926dac53, 72627936, 9509d951, bd8315f3, a9fa9a7b, ce7cdd70.'
) -join "`r`n"

$statusNuevo = $statusNuevo.TrimEnd() + "`r`n" + $appendStatus + "`r`n"
[System.IO.File]::WriteAllText($statusFile, $statusNuevo, (New-Object System.Text.UTF8Encoding $false))
Write-Host '[OK] STATUS.md actualizado' -ForegroundColor Green

# --- BITACORA.md ---

if (-not $yaBitacora) {
    $appendBitacora = @(
        '',
        '---',
        '',
        '## 2026-10-16 (Sesion 22 - COMPLETA)',
        '',
        '**Duracion:** ~3 horas',
        '**Objetivo:** Sincronizacion de docs + fix orquestador + F3-08 + F3-09',
        '',
        '**Completado:**',
        '',
        '### Bloque 1 - STATUS.md sincronizado',
        '- Tabla: F3 6->7, Total 36->37.',
        '- Proximos pasos: F3-08 y F3-09 (los cerramos en la misma sesion).',
        '- Metricas: claves 3/12 -> 6/12, hallazgos 31/47 -> 42/67, commits 8 -> ~50.',
        '- Eliminada duplicacion de Sesion 20.',
        '- Commit: e1e1ce65.',
        '',
        '### Bloque 2 - Tracking sincronizado',
        '- Header: fin Sesion 20 -> fin Sesion 21.',
        '- Total: 63 -> 69 (conteo real de filas).',
        '- Resumen: Abierto 20->22, Cerrado 41->42.',
        '- Eliminada fila vacia entre DOC-011 y DOC-015.',
        '- Commit: 53dbd4e8.',
        '',
        '### Bloque 3 - PLAN-DE-TRABAJO sincronizado',
        '- F2-12: Pendiente -> OK.',
        '- F3-07: Pendiente -> OK.',
        '- Commit: 926dac53.',
        '',
        '### Bloque 4 - ROTACION-CLAVES: seccion S21 agregada',
        '- S21 no roto claves. Documentado en seccion nueva.',
        '- Commit: 72627936.',
        '',
        '### Bloque 5 - Reconciliar Bitwarden vs docs',
        '- 4 archivos: SISTEMA-DE-TRABAJO, ENVIRONMENT, ROTACION-CLAVES, GESTION-DE-RIESGOS.',
        '- 3 carpetas reales: Claves Personales, Desarrollo, Produccion.',
        '- Fix colateral (70b): el 70 no matcheo ROTACION por falso positivo.',
        '- Commit: 9509d951.',
        '',
        '### Bloque 6 - Fix orquestador GA4',
        '- Bug S20: `& powershell -File` anidado causaba loop infinito.',
        '- Fix S22: invocacion directa `& script.ps1`.',
        '- Script 71 verificado: 59 + 60 corren sin loop.',
        '- Commit: bd8315f3.',
        '',
        '### Bloque 7 - F3-08: ESLint en build (CONF-001)',
        '- next.config.js: `eslint.ignoreDuringBuilds: true -> false`.',
        '- Verificacion local: 4 warnings, 0 errores. Deploy OK.',
        '- En CI aparecieron ~30 warnings (Next.js corre ESLint sobre TODOS los archivos).',
        '- Commit: a9fa9a7b.',
        '',
        '### Bloque 8 - F3-09: Headers de seguridad (CONF-002)',
        '- Agregados 4 headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.',
        '- HSTS ya servido por Vercel.',
        '- Verificacion post-deploy: 4/4 headers activos en www.panfree.fit.',
        '- Commit: ce7cdd70.',
        '',
        '**Hallazgos cerrados:**',
        '- CONF-001: ESLint ignorado en build.',
        '- CONF-002: Sin headers de seguridad.',
        '',
        '**Hallazgos nuevos:**',
        '- CONF-003: ~30 warnings de ESLint (mayoria <img> sin <Image />). F3 P3.',
        '- CONF-004: typescript.ignoreBuildErrors: true. F3 P2.',
        '- CONF-005: CSP pendiente. F3 P3.',
        '',
        '**Commits S22:**',
        '- e1e1ce65 docs(sync): corregir STATUS.md a estado real post-S21',
        '- 53dbd4e8 docs(sync): actualizar tracking con estado real post-S21',
        '- 926dac53 docs(sync): marcar F2-12 y F3-07 como OK en PLAN',
        '- 72627936 docs(sync): agregar seccion S21 a ROTACION-CLAVES',
        '- 9509d951 docs(env): reconciliar Bitwarden vs docs (3 carpetas)',
        '- bd8315f3 chore(scripts): fix orquestador GA4 con invocacion directa',
        '- a9fa9a7b chore(eslint): activar ESLint en build (F3-08, CONF-001)',
        '- ce7cdd70 security(headers): agregar headers de seguridad (F3-09, CONF-002)',
        '',
        '**Bloqueantes:**',
        '- Ninguno.',
        '',
        '**Proxima sesion (S23):**',
        '- F4-01: purgar historial de Git (SEC-001).',
        '- F4-05: confirmar package-lock.json.',
        '- Cloudinary #392411 (reconsultar desde 2026-10-18).',
        '- Backlog: 64b-reescribir-60 (auto-descubrimiento GA4).',
        '- Backlog: limpieza de warnings de ESLint (CONF-003).',
        '- Backlog: activar TypeScript en build (CONF-004).',
        '',
        '**Aprendizajes:**',
        '- Regex PowerShell no matchea confiable en Markdown tables. Usar .Replace() literal.',
        '- Falsos positivos en idempotencia: strings unicos y especificos, no fragmentos comunes.',
        '- `$h:` en strings PowerShell = error. Usar `-f` o `${h}`.',
        '- Orquestadores: invocacion directa `& script.ps1`, NO `powershell -File` anidado.',
        '- En CI, Next.js corre ESLint sobre TODOS los archivos (~30 warnings vs 4 local).',
        '- `vercel env ls` miente: siempre verificar con `env pull` o dashboard.'
    ) -join "`r`n"

    $bitacoraNuevo = $bitacora.TrimEnd() + "`r`n" + $appendBitacora + "`r`n"
    [System.IO.File]::WriteAllText($bitacoraFile, $bitacoraNuevo, (New-Object System.Text.UTF8Encoding $false))
    Write-Host '[OK] BITACORA.md actualizada' -ForegroundColor Green
}

# --- ROTACION-CLAVES.md ---

if (-not $yaRotacion) {
    $appendRotacion = @(
        '',
        '---',
        '',
        '## Estado de Bitwarden al cierre de S22 (2026-10-16)',
        '',
        '**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion',
        '',
        '### Cambios respecto a S21',
        '',
        'En S22 NO se roto ninguna clave. La sesion se dedico a:',
        '- Sincronizacion de documentacion post-S21.',
        '- Fix del orquestador GA4 (deuda S20).',
        '- F3-08: activar ESLint en build (CONF-001).',
        '- F3-09: agregar headers de seguridad (CONF-002).',
        '',
        '### Items completos (sin cambios, 6/12)',
        '',
        'Supabase, Cloudinary, Gemini, Resend, GA4, VAPID.',
        '',
        '### Items "No aplica" o "Rotos" (sin cambios)',
        '',
        'Meta WhatsApp, Twilio, Instagram, n8n, Clarity, Secrets internos.',
        '',
        '### Deuda tecnica al cierre de S22',
        '',
        '- Rehacer 64b-reescribir-60 (auto-descubrimiento GA4).',
        '- Auditar items sueltos: panfree.fit, supabase.com (logins de dashboards).',
        '- Migrar @supabase/auth-helpers-nextjs -> @supabase/ssr.',
        '- Sistema simple de promociones en CartSidebar (DOC-008 seccion 9).',
        '- Ocultar seccion Marketing del menu admin.',
        '- Limpieza de la seccion Marketing (~5.500-6.500 lineas, DOC-008).'
    ) -join "`r`n"

    $rotacionNuevo = $rotacion.TrimEnd() + "`r`n" + $appendRotacion + "`r`n"
    [System.IO.File]::WriteAllText($rotacionFile, $rotacionNuevo, (New-Object System.Text.UTF8Encoding $false))
    Write-Host '[OK] ROTACION-CLAVES.md actualizada' -ForegroundColor Green
}

Write-Host ''

# ============================================================================
# VERIFICACION POST-WRITE
# ============================================================================

Write-Host '--- Verificacion post-write ---' -ForegroundColor Cyan

$postStatus   = [System.IO.File]::ReadAllText($statusFile)
$postBitacora = [System.IO.File]::ReadAllText($bitacoraFile)
$postRotacion = [System.IO.File]::ReadAllText($rotacionFile)

$checks = @(
    @{ Nombre = 'STATUS: fin Sesion 22';         Match = $postStatus.Contains('**Ultima actualizacion:** 2026-10-16 (fin Sesion 22)') },
    @{ Nombre = 'STATUS: progreso 81%';           Match = $postStatus.Contains('**Progreso global:** 81%') },
    @{ Nombre = 'STATUS: F3 100%';                Match = $postStatus.Contains('| F3 - Codigo | 9 | 9 | 0 | 0 | 100% |') },
    @{ Nombre = 'STATUS: Total 38';               Match = $postStatus.Contains('| **Total** | **47** | **38** | **0** | **9** | **81%** |') },
    @{ Nombre = 'BITACORA: entrada S22';          Match = $postBitacora.Contains('## 2026-10-16 (Sesion 22 - COMPLETA)') },
    @{ Nombre = 'BITACORA: menciona CONF-001';    Match = $postBitacora.Contains('CONF-001') },
    @{ Nombre = 'BITACORA: menciona CONF-002';    Match = $postBitacora.Contains('CONF-002') },
    @{ Nombre = 'ROTACION: seccion S22';          Match = $postRotacion.Contains('## Estado de Bitwarden al cierre de S22') }
)

$todoOk = $true
foreach ($c in $checks) {
    $symbol = if ($c.Match) { 'OK  ' } else { 'FAIL' }
    $color = if ($c.Match) { 'Green' } else { 'Red' }
    Write-Host "  [$symbol] $($c.Nombre)" -ForegroundColor $color
    if (-not $c.Match) { $todoOk = $false }
}

Write-Host ''
if (-not $todoOk) {
    Write-Host '[ERROR] Verificacion post-write FALLO.' -ForegroundColor Red
    exit 1
}

Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 74a COMPLETADO' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''