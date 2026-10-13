# =============================================================================
# Script: 17-documentar-sec-011.ps1
# Autor: Pedro J. Pirovani (PanFree)
# Fecha: 2026-10-14
# Sesion: 8
# Proposito:
#   Documentar el cierre de SEC-011 (email_logs SELECT qual=true)
#   y SEC-013 (email_logs INSERT permisiva para authenticated).
#   Ademas corrige BUG-004 (endpoints usando cliente sin privilegios).
#
# Uso:
#   Dry run (recomendado primero):
#     .\scripts\docs\17-documentar-sec-011.ps1
#
#   Aplicar + commit + push:
#     .\scripts\docs\17-documentar-sec-011.ps1 -Commit
#
# Idempotente: se puede correr multiples veces sin romper nada.
# =============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $repoRoot

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  17 - Documentar cierre SEC-011 + SEC-013 (email_logs)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Repo: $repoRoot"
Write-Host "  Modo: $(if ($Commit) { 'COMMIT + PUSH' } else { 'DRY RUN (sin commit)' })"
Write-Host ""

# -----------------------------------------------------------------------------
# [1/6] Verificaciones previas
# -----------------------------------------------------------------------------
Write-Host "[1/6] Verificando prerequisitos..." -ForegroundColor Yellow

$rutasRequeridas = @(
    'supabase\migrations',
    'docs\audits\2026-10-13-inicial',
    'scripts\docs',
    'docs\STATUS.md',
    'docs\BITACORA.md',
    'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
)

foreach ($r in $rutasRequeridas) {
    $full = Join-Path $repoRoot $r
    if (-not (Test-Path $full)) {
        Write-Host "  [ERROR] No existe: $r" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  OK: todas las rutas existen" -ForegroundColor Green

# Confirmar que los 2 archivos de codigo ya fueron modificados
$testEmail = Join-Path $repoRoot 'src\app\api\admin\marketing\test-email\route.js'
$resendHook = Join-Path $repoRoot 'src\app\api\resend-webhook\route.js'

foreach ($f in @($testEmail, $resendHook)) {
    $contenido = Get-Content $f -Raw
    if ($contenido -notmatch 'supabaseAdmin') {
        Write-Host "  [ERROR] El archivo $f no tiene supabaseAdmin. Corre primero la refactorizacion." -ForegroundColor Red
        exit 1
    }
}
Write-Host "  OK: test-email y resend-webhook usan supabaseAdmin" -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# [2/6] Crear migracion SQL
# -----------------------------------------------------------------------------
Write-Host "[2/6] Creando migracion SQL..." -ForegroundColor Yellow

$migracionPath = Join-Path $repoRoot 'supabase\migrations\2026-10-14-f1-10-sec-011-email-logs.sql'

$migracionLineas = @(
    '-- ============================================================================='
    '-- F1-10 / SEC-011 + SEC-013: Restringir acceso a email_logs'
    '-- Fecha: 2026-10-14'
    '-- Sesion: 8'
    '-- Hallazgos cerrados:'
    '--   SEC-011 (Alta) - "Authenticated users can read email_logs" qual=true'
    '--   SEC-013 (Media) - "Authenticated users can insert email_logs" permisiva'
    '-- Hallazgo colateral corregido en codigo:'
    '--   BUG-004 (Media) - test-email y resend-webhook usaban cliente sin privilegios'
    '-- ============================================================================='
    ''
    '-- -----------------------------------------------------------------------------'
    '-- CONTEXTO'
    '-- -----------------------------------------------------------------------------'
    '-- La tabla public.email_logs tenia 4 politicas RLS:'
    '--   1. "Admin email_logs"                         (ALL,    public,        is_admin OR service_role)'
    '--   2. "Service role full access on email_logs"   (ALL,    service_role,  true)'
    '--   3. "Authenticated users can insert email_logs"(INSERT, public,        auth.uid() IS NOT NULL)'
    '--   4. "Authenticated users can read email_logs"  (SELECT, authenticated, true)   <-- SEC-011'
    '--'
    '-- Postgres combina politicas PERMISSIVE con OR. La politica 4 (qual=true)'
    '-- anulaba cualquier restriccion vecina, permitiendo a CUALQUIER usuario'
    '-- autenticado (incluidos clientes B2C) leer TODA la tabla.'
    '--'
    '-- La politica 3 permitia a cualquier usuario autenticado insertar filas.'
    '-- Ningun path legitimo del frontend necesita insertar en email_logs;'
    '-- los INSERT reales los hacen send-email/test-email via SERVICE_ROLE_KEY.'
    '--'
    '-- Resultado: cualquier cliente B2C podia leer:'
    '--   - to_email, from_email, subject, body_html, body_text, metadata (PII)'
    '--'
    '-- -----------------------------------------------------------------------------'
    '-- VERIFICACION PRE (output real antes del DROP)'
    '-- -----------------------------------------------------------------------------'
    '-- Query ejecutada:'
    '--   SELECT policyname, cmd, roles, qual, with_check'
    '--   FROM pg_policies WHERE tablename = ''email_logs'' ORDER BY cmd, policyname;'
    '--'
    '-- Resultado: 4 filas (las listadas arriba en CONTEXTO).'
    '--'
    '-- -----------------------------------------------------------------------------'
    '-- FIX'
    '-- -----------------------------------------------------------------------------'
    ''
    '-- 1. Eliminar politica SELECT permisiva (SEC-011)'
    'DROP POLICY IF EXISTS "Authenticated users can read email_logs" ON public.email_logs;'
    ''
    '-- 2. Eliminar politica INSERT permisiva (SEC-013)'
    'DROP POLICY IF EXISTS "Authenticated users can insert email_logs" ON public.email_logs;'
    ''
    '-- -----------------------------------------------------------------------------'
    '-- VERIFICACION POST (output real despues del DROP)'
    '-- -----------------------------------------------------------------------------'
    '-- Query ejecutada:'
    '--   SELECT policyname, cmd, roles, qual, with_check'
    '--   FROM pg_policies WHERE tablename = ''email_logs'' ORDER BY cmd, policyname;'
    '--'
    '-- Resultado: 2 filas'
    '--   1. "Admin email_logs"                        (ALL, public,       is_admin OR service_role)'
    '--   2. "Service role full access on email_logs"  (ALL, service_role, true)'
    '--'
    '-- -----------------------------------------------------------------------------'
    '-- ROLLBACK (descomentar y ejecutar si hay que revertir)'
    '-- -----------------------------------------------------------------------------'
    '-- CREATE POLICY "Authenticated users can read email_logs"'
    '--   ON public.email_logs FOR SELECT TO authenticated USING (true);'
    '--'
    '-- CREATE POLICY "Authenticated users can insert email_logs"'
    '--   ON public.email_logs FOR INSERT TO public'
    '--   WITH CHECK ((SELECT auth.uid()) IS NOT NULL);'
    ''
    '-- ============================================================================='
    '-- FIN MIGRACION'
    '-- ============================================================================='
)

Set-Content -Path $migracionPath -Value $migracionLineas -Encoding UTF8
Write-Host "  OK: $migracionPath" -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# [3/6] Crear doc de auditoria
# -----------------------------------------------------------------------------
Write-Host "[3/6] Creando doc de auditoria..." -ForegroundColor Yellow

$docPath = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial\17-f1-10-sec-011-email-logs.md'

$docLineas = @(
    '# F1-10 / SEC-011 + SEC-013 - Restringir acceso a email_logs'
    ''
    '**Fecha:** 2026-10-14'
    '**Hallazgos:** SEC-011 (Alta), SEC-013 (Media), BUG-004 (Media, colateral)'
    '**Severidad:** Alta'
    '**Estado:** Cerrado'
    '**Esfuerzo:** S (Small)'
    ''
    '---'
    ''
    '## 1. Contexto'
    ''
    'Durante F1-08 (Sesion 6) se detecto la politica RLS `Authenticated users can'
    'read email_logs` con `qual=true`, que permitia a cualquier usuario autenticado'
    'leer TODA la tabla `email_logs`. Se registro como SEC-011 (Alta).'
    ''
    'Al preparar el fix en Sesion 8 se detectaron dos problemas adicionales:'
    ''
    '- **SEC-013:** politica `Authenticated users can insert email_logs` con'
    '  `roles={public}` permitia a cualquier autenticado insertar filas.'
    '- **BUG-004:** los endpoints `test-email/route.js` y `resend-webhook/route.js`'
    '  usaban el cliente generico `@/lib/supabase` (sin privilegios) para escribir'
    '  en `email_logs`. Se apoyaban en la politica permisiva para funcionar.'
    ''
    '---'
    ''
    '## 2. Diagnostico'
    ''
    '### Politicas antes del fix (4)'
    ''
    '| # | Nombre | cmd | Roles | Qual / With check |'
    '|---|---|---|---|---|'
    '| 1 | `Admin email_logs` | ALL | `{public}` | `is_admin() OR service_role` |'
    '| 2 | `Service role full access on email_logs` | ALL | `{service_role}` | `true` |'
    '| 3 | `Authenticated users can insert email_logs` | INSERT | `{public}` | `auth.uid() IS NOT NULL` |'
    '| 4 | `Authenticated users can read email_logs` | SELECT | `{authenticated}` | `true` |'
    ''
    '### El problema'
    ''
    'Postgres combina politicas PERMISSIVE con OR: la mas amplia gana. La politica 4'
    '(`qual=true`) anulaba cualquier restriccion vecina. Cualquier cliente B2C con'
    'sesion valida podia hacer `SELECT * FROM email_logs` via PostgREST y obtener:'
    ''
    '- `to_email` (PII de destinatarios)'
    '- `from_email`'
    '- `subject`'
    '- `body_html` / `body_text` (cuerpo completo de correos, incluidos tokens de'
    '  recuperacion, links de verificacion, etc.)'
    '- `metadata` (datos de negocio)'
    '- `status`, `resend_id`, `error_message`, `created_at`'
    ''
    '---'
    ''
    '## 3. Fix aplicado'
    ''
    '### 3.1 Base de datos (SQL)'
    ''
    'Ver migracion: `supabase/migrations/2026-10-14-f1-10-sec-011-email-logs.sql`'
    ''
    '```sql'
    'DROP POLICY IF EXISTS "Authenticated users can read email_logs" ON public.email_logs;'
    'DROP POLICY IF EXISTS "Authenticated users can insert email_logs" ON public.email_logs;'
    '```'
    ''
    '### 3.2 Codigo (BUG-004)'
    ''
    'En `src/app/api/admin/marketing/test-email/route.js` y'
    '`src/app/api/resend-webhook/route.js`:'
    ''
    '- Se reemplazo `import { supabase } from ''@/lib/supabase''` por'
    '  `createClient` de `@supabase/supabase-js` con `SERVICE_ROLE_KEY`.'
    '- Todas las escrituras a `email_logs` pasaron de `supabase` a `supabaseAdmin`.'
    ''
    'Resultado: los endpoints bypasean RLS correctamente y no dependen de politicas'
    'permisivas.'
    ''
    '---'
    ''
    '## 4. Verificacion'
    ''
    '### 4.1 Politicas despues del fix (2)'
    ''
    '| # | Nombre | cmd | Roles | Qual / With check |'
    '|---|---|---|---|---|'
    '| 1 | `Admin email_logs` | ALL | `{public}` | `is_admin() OR service_role` |'
    '| 2 | `Service role full access on email_logs` | ALL | `{service_role}` | `true` |'
    ''
    '### 4.2 Comportamiento esperado'
    ''
    '| Sujeto | SELECT email_logs | INSERT email_logs | UPDATE email_logs |'
    '|---|---|---|---|'
    '| Cliente B2C autenticado | 0 filas (RLS) | Error RLS | Error RLS |'
    '| Admin (`is_admin()`) | Todo | Todo | Todo |'
    '| `service_role` | Todo | Todo | Todo |'
    '| `anon` | 0 filas (RLS) | Error RLS | Error RLS |'
    ''
    '### 4.3 Endpoints verificados'
    ''
    '| Endpoint | Cliente | Antes | Despues |'
    '|---|---|---|---|'
    '| `send-email/route.js` | service_role | OK | OK |'
    '| `test-email/route.js` | service_role | OK (por politica permisiva) | OK (por service_role) |'
    '| `resend-webhook/route.js` | service_role | OK (por politica permisiva) | OK (por service_role) |'
    '| `correos/page.js` | authenticated + is_admin | OK | OK |'
    ''
    '---'
    ''
    '## 5. Impacto'
    ''
    '### Seguridad'
    ''
    '- **SEC-011 cerrado:** clientes B2C ya no pueden leer PII de correos.'
    '- **SEC-013 cerrado:** clientes B2C ya no pueden insertar filas en email_logs.'
    '- **BUG-004 cerrado:** endpoints ahora usan service_role explicitamente.'
    ''
    '### Funcionalidad'
    ''
    '- Sin regresiones esperadas.'
    '- `correos/page.js` sigue funcionando (admin con is_admin()).'
    '- Los 3 endpoints siguen funcionando (ahora via service_role).'
    ''
    '---'
    ''
    '## 6. DoD (F1-10)'
    ''
    '- [x] Diagnostico completo de las 4 politicas.'
    '- [x] Verificacion PRE con output real de pg_policies.'
    '- [x] DROP de las 2 politicas permisivas.'
    '- [x] Verificacion POST: solo 2 politicas restantes.'
    '- [x] Auditoria de los 4 archivos de codigo que tocan email_logs.'
    '- [x] Fix de BUG-004 en los 2 endpoints afectados.'
    '- [x] Migracion SQL versionada en supabase/migrations/.'
    '- [x] Doc de auditoria generado (este archivo).'
    '- [x] Tracking actualizado (SEC-011, SEC-013 -> Cerrado; BUG-004 -> Cerrado).'
    '- [ ] Commit pusheado con security(db):.'
    ''
    '---'
    ''
    '## 7. Referencias'
    ''
    '- [SEC-011 en tracking](./06-hallazgos-tracking.md)'
    '- [F1-08 - Consolidacion RLS](./15-f1-08-consolidacion-rls.md)'
    '- [ADR-002 - app_metadata](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)'
    '- [Migracion SQL](../../../supabase/migrations/2026-10-14-f1-10-sec-011-email-logs.sql)'
    '- [Supabase - RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security)'
    '- [Supabase - API Keys](https://supabase.com/docs/guides/api/api-keys)'
)

Set-Content -Path $docPath -Value $docLineas -Encoding UTF8
Write-Host "  OK: $docPath" -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# [4/6] Actualizar tracking de hallazgos
# -----------------------------------------------------------------------------
Write-Host "[4/6] Actualizando 06-hallazgos-tracking.md..." -ForegroundColor Yellow

$trackingPath = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$tracking = Get-Content $trackingPath -Raw

# SEC-011: Abierto -> Cerrado
$tracking = $tracking -replace `
    '\| SEC-011 \| email_logs SELECT true para authenticated \| F1/F3 \| P1 \| Abierto \| - \|', `
    '| SEC-011 | email_logs SELECT true para authenticated | F1/F3 | P1 | Cerrado | (Sesion 8) |'

# SEC-013 y BUG-004 nuevos: agregar debajo de la tabla de altos (SEC-011)
if ($tracking -notmatch 'SEC-013') {
    $tracking = $tracking -replace `
        '(\| SEC-011 \| email_logs SELECT true para authenticated \| F1/F3 \| P1 \| Cerrado \| \(Sesion 8\) \|)', `
        "`$1`r`n| SEC-013 | email_logs INSERT permisiva para authenticated | F1/F3 | P2 | Cerrado | (Sesion 8) |"
}

if ($tracking -notmatch 'BUG-004') {
    # Agregar BUG-004 debajo de BUG-003 en la tabla de bajos
    $tracking = $tracking -replace `
        '(\| BUG-003 \| diptico/\[codigo\] usa \.eq\(''activo''\) en vez de is_active \| F3 \| P3 \| Abierto \| - \|)', `
        "`$1`r`n| BUG-004 | test-email y resend-webhook usaban cliente sin privilegios | F3 | P2 | Cerrado | (Sesion 8) |"
}

Set-Content -Path $trackingPath -Value $tracking -Encoding UTF8
Write-Host "  OK: tracking actualizado (SEC-011, SEC-013, BUG-004 -> Cerrado)" -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# [5/6] Actualizar STATUS.md
# -----------------------------------------------------------------------------
Write-Host "[5/6] Actualizando STATUS.md..." -ForegroundColor Yellow

$statusPath = Join-Path $repoRoot 'docs\STATUS.md'
$status = Get-Content $statusPath -Raw

# Actualizar contador de hallazgos cerrados: 18 -> 21
$status = $status -replace '\| Hallazgos cerrados \| 18 / 31 \| 31 / 31 \|', `
    '| Hallazgos cerrados | 21 / 34 | 34 / 34 |'

# Actualizar "Ultima actualizacion"
$status = $status -replace '\*\*Ultima actualizacion:\*\* 2026-10-13 \(fin Sesion 7\)', `
    '**Ultima actualizacion:** 2026-10-14 (fin Sesion 8)'

# Actualizar Proximos 3 pasos
$status = $status -replace '1\. \*\*SEC-011\*\* - email_logs SELECT true para authenticated \(P1, Alta\)', `
    '1. **F3-02** - SEC-002: quitar claves hardcodeadas (P1)'
$status = $status -replace '2\. \*\*F3-02\*\* - SEC-002: quitar claves hardcodeadas \(P1\)', `
    '2. **SEC-012** - canjes_premios usa clientes.role en vez de is_admin() (P2)'
$status = $status -replace '3\. \*\*chore\(docs\)\*\* - Limpiar BITACORA.md y STATUS.md \(duplicados\)', `
    '3. **chore(docs)** - Limpiar BITACORA.md y STATUS.md (duplicados)'

Set-Content -Path $statusPath -Value $status -Encoding UTF8
Write-Host "  OK: STATUS.md actualizado" -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# [6/6] Verificar links + commit opcional
# -----------------------------------------------------------------------------
Write-Host "[6/6] Verificando links de la documentacion..." -ForegroundColor Yellow

$verificadorLinks = Join-Path $repoRoot 'scripts\docs\00-verificar-links.ps1'
if (Test-Path $verificadorLinks) {
    & powershell -ExecutionPolicy Bypass -File $verificadorLinks
} else {
    Write-Host "  [WARN] No se encontro 00-verificar-links.ps1" -ForegroundColor Yellow
}

Write-Host ""

if ($Commit) {
    Write-Host "Modo -Commit activado. Preparando commit..." -ForegroundColor Yellow
    Write-Host ""

    git add supabase/migrations/2026-10-14-f1-10-sec-011-email-logs.sql
    git add docs/audits/2026-10-13-inicial/17-f1-10-sec-011-email-logs.md
    git add docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md
    git add docs/STATUS.md
    git add src/app/api/admin/marketing/test-email/route.js
    git add src/app/api/resend-webhook/route.js
    git add scripts/docs/17-documentar-sec-011.ps1

    git commit -m "security(db): restringir acceso a email_logs (SEC-011, SEC-013, BUG-004)"
    git push origin main

    Write-Host ""
    Write-Host "  OK: commit + push completados" -ForegroundColor Green
} else {
    Write-Host "Modo DRY RUN. No se commiteo nada." -ForegroundColor Cyan
    Write-Host "Revisa los archivos creados/modificados y despues corre:" -ForegroundColor Cyan
    Write-Host "  .\scripts\docs\17-documentar-sec-011.ps1 -Commit" -ForegroundColor White
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Script 17 finalizado" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""