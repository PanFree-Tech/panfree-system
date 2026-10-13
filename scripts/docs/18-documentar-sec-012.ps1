# =============================================================================
# 18 - Documentar cierre SEC-012 (canjes_premios usa is_admin())
# =============================================================================
# Fecha: 2026-10-14
# Sesion: 9
# Hallazgo: SEC-012 (Media, consistencia con ADR-002)
# Tarea:    F1-11
#
# Uso:
#   .\scripts\docs\18-documentar-sec-012.ps1            # DRY RUN
#   .\scripts\docs\18-documentar-sec-012.ps1 -Commit    # COMMIT + PUSH
# =============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'

# --- Rutas base ---------------------------------------------------------------
$repoRoot   = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$migracion  = Join-Path $repoRoot 'supabase\migrations\2026-10-14-f1-11-sec-012-canjes-premios.sql'
$docAudit   = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial\18-f1-11-sec-012-canjes-premios.md'
$tracking   = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$status     = Join-Path $repoRoot 'docs\STATUS.md'
$verLinks   = Join-Path $repoRoot 'scripts\docs\00-verificar-links.ps1'

Write-Host ''
Write-Host ('=' * 60) -ForegroundColor Cyan
Write-Host '  18 - Documentar cierre SEC-012 (canjes_premios)' -ForegroundColor Cyan
Write-Host ('=' * 60) -ForegroundColor Cyan
Write-Host ("  Repo: " + $repoRoot)
if ($Commit) {
    Write-Host '  Modo: COMMIT + PUSH' -ForegroundColor Yellow
} else {
    Write-Host '  Modo: DRY RUN (sin commit)' -ForegroundColor Yellow
}
Write-Host ''

# --- [1/6] Prerequisitos ------------------------------------------------------
Write-Host '[1/6] Verificando prerequisitos...'
$faltantes = @()
foreach ($p in @($tracking, $status, $verLinks)) {
    if (-not (Test-Path $p)) { $faltantes += $p }
}
if ($faltantes.Count -gt 0) {
    Write-Host ('  ERROR: faltan rutas: ' + ($faltantes -join ', ')) -ForegroundColor Red
    exit 1
}
Write-Host '  OK: rutas base existen'

# --- [2/6] Migracion SQL ------------------------------------------------------
Write-Host ''
Write-Host '[2/6] Creando migracion SQL...'

$sql = @(
    '-- =============================================================================',
    '-- F1-11 / SEC-012: canjes_premios usa is_admin() en vez de clientes.role',
    '-- Fecha: 2026-10-14',
    '-- Sesion: 9',
    '-- Hallazgo: SEC-012 (Media, consistencia con ADR-002)',
    '-- =============================================================================',
    '',
    '-- -----------------------------------------------------------------------------',
    '-- CONTEXTO',
    '-- -----------------------------------------------------------------------------',
    '-- La politica "Admin puede ver todos los canjes" sobre public.canjes_premios',
    '-- usaba un EXISTS manual contra clientes.role, en vez de is_admin() (fuente',
    '-- unica de verdad de rol segun ADR-002).',
    '--',
    '-- Estado ANTES: 5 politicas sobre canjes_premios.',
    '--',
    '--   # Nombre                                    cmd    roles           qual / with_check',
    '--   1 Admin puede eliminar canjes               DELETE {authenticated}  is_admin()',
    '--   2 Usuarios pueden crear sus propios canjes  INSERT {public}         auth.uid() = cliente_id',
    '--   3 Admin puede ver todos los canjes          SELECT {public}         EXISTS (SELECT 1 FROM',
    '--                                                                        clientes WHERE',
    '--                                                                        clientes.user_id = auth.uid()',
    '--                                                                        AND clientes.role=''admin'')',
    '--   4 Usuarios pueden ver sus propios canjes    SELECT {public}         auth.uid() = cliente_id',
    '--   5 Admin puede actualizar canjes             UPDATE {authenticated}  is_admin()',
    '--',
    '-- Problemas:',
    '--   - Inconsistencia con ADR-002 (fuente unica de rol = app_metadata via is_admin()).',
    '--   - Subquery correlacionada no optimizada (InitPlan). F1-07 ya migro el resto.',
    '--   - roles={public} cuando deberia ser {authenticated} (consistente con #1 y #5).',
    '--',
    '-- No hay vulnerabilidad: anon no matchea el EXISTS (auth.uid() = NULL), y',
    '-- "Usuarios pueden ver sus propios canjes" cubre el path B2C. Este fix es',
    '-- consistencia + rendimiento + higiene.',
    '',
    '-- -----------------------------------------------------------------------------',
    '-- VERIFICACION PRE (output real, 2026-10-14)',
    '-- -----------------------------------------------------------------------------',
    '-- Query:',
    '--   SELECT policyname, cmd, roles, qual, with_check',
    '--   FROM pg_policies',
    '--   WHERE schemaname=''public'' AND tablename=''canjes_premios''',
    '--   ORDER BY cmd, policyname;',
    '--',
    '-- Resultado: 5 filas (las listadas en CONTEXTO).',
    '',
    '-- -----------------------------------------------------------------------------',
    '-- FIX',
    '-- -----------------------------------------------------------------------------',
    '',
    '-- 1. Eliminar la politica inconsistente',
    'DROP POLICY IF EXISTS "Admin puede ver todos los canjes" ON public.canjes_premios;',
    '',
    '-- 2. Recrearla con is_admin() (InitPlan) y rol authenticated',
    'CREATE POLICY "Admin puede ver todos los canjes"',
    '  ON public.canjes_premios',
    '  FOR SELECT',
    '  TO authenticated',
    '  USING ( (SELECT is_admin()) );',
    '',
    '-- -----------------------------------------------------------------------------',
    '-- VERIFICACION POST (output real, 2026-10-14)',
    '-- -----------------------------------------------------------------------------',
    '-- Query:',
    '--   SELECT policyname, cmd, roles, qual, with_check',
    '--   FROM pg_policies',
    '--   WHERE schemaname=''public'' AND tablename=''canjes_premios''',
    '--   ORDER BY cmd, policyname;',
    '--',
    '-- Resultado: 5 filas. Politica #3 actualizada:',
    '--   policyname = Admin puede ver todos los canjes',
    '--   cmd        = SELECT',
    '--   roles      = {authenticated}',
    '--   qual       = ( SELECT is_admin() AS is_admin)',
    '--',
    '-- Las otras 4 politicas sin cambios.',
    '',
    '-- -----------------------------------------------------------------------------',
    '-- ROLLBACK (descomentar y ejecutar si hay que revertir)',
    '-- -----------------------------------------------------------------------------',
    '-- DROP POLICY IF EXISTS "Admin puede ver todos los canjes" ON public.canjes_premios;',
    '-- CREATE POLICY "Admin puede ver todos los canjes"',
    '--   ON public.canjes_premios',
    '--   FOR SELECT',
    '--   TO public',
    '--   USING (',
    '--     EXISTS (',
    '--       SELECT 1 FROM clientes',
    '--       WHERE clientes.user_id = (SELECT auth.uid())',
    '--         AND clientes.role = ''admin''',
    '--     )',
    '--   );',
    '',
    '-- =============================================================================',
    '-- FIN MIGRACION',
    '-- ============================================================================='
)
$sql | Set-Content -Path $migracion -Encoding UTF8
Write-Host ('  OK: ' + $migracion)

# --- [3/6] Doc de auditoria ---------------------------------------------------
Write-Host ''
Write-Host '[3/6] Creando doc de auditoria...'

$doc = @(
    '# F1-11 / SEC-012 - canjes_premios usa is_admin() en vez de clientes.role',
    '',
    '**Fecha:** 2026-10-14',
    '**Hallazgo:** SEC-012',
    '**Tarea:** F1-11',
    '**Severidad:** Media (consistencia + rendimiento, no vulnerabilidad)',
    '**Estado:** Cerrado',
    '**Esfuerzo:** S (Small)',
    '',
    '---',
    '',
    '## 1. Contexto',
    '',
    'Durante F1-08 (Sesion 6) se detecto que la politica RLS',
    '`Admin puede ver todos los canjes` sobre `public.canjes_premios` usa un',
    '`EXISTS` manual contra `clientes.role` en vez de `is_admin()`, la fuente',
    'unica de verdad de rol definida en [ADR-002](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md).',
    '',
    'Es la unica de las 5 politicas de la tabla que no usa `is_admin()`:',
    '',
    '| # | Nombre | cmd | roles | qual / with_check |',
    '|---|---|---|---|---|',
    '| 1 | `Admin puede eliminar canjes` | DELETE | `{authenticated}` | `is_admin()` |',
    '| 2 | `Usuarios pueden crear sus propios canjes` | INSERT | `{public}` | `auth.uid() = cliente_id` |',
    '| 3 | **`Admin puede ver todos los canjes`** | **SELECT** | **`{public}`** | **`EXISTS (SELECT 1 FROM clientes WHERE clientes.user_id = auth.uid() AND clientes.role = ''admin'')`** |',
    '| 4 | `Usuarios pueden ver sus propios canjes` | SELECT | `{public}` | `auth.uid() = cliente_id` |',
    '| 5 | `Admin puede actualizar canjes` | UPDATE | `{authenticated}` | `is_admin()` |',
    '',
    '---',
    '',
    '## 2. Diagnostico',
    '',
    '### 2.1 Inconsistencia con ADR-002',
    '',
    'ADR-002 establece que `app_metadata.role` es la **fuente unica de verdad**',
    'del rol y que `is_admin()` es el helper canonico para consultarlo desde RLS.',
    'La politica #3 no lo usa: recalcula el rol a mano con un `EXISTS` contra',
    '`clientes.role`.',
    '',
    '### 2.2 Subquery correlacionada no optimizada',
    '',
    'El patron `EXISTS (SELECT 1 FROM clientes WHERE ...)` se evalua por fila.',
    'F1-07 migro el resto del esquema al patron InitPlan `(SELECT is_admin())`,',
    'que se evalua una sola vez por query. Esta politica quedo afuera.',
    '',
    '### 2.3 Rol `{public}` en vez de `{authenticated}`',
    '',
    'Las otras 2 politicas admin de la tabla (`Admin puede eliminar canjes` y',
    '`Admin puede actualizar canjes`) usan `{authenticated}`. La #3 usa',
    '`{public}`. En la practica no hay leak (anon tiene `auth.uid() = NULL` y el',
    '`EXISTS` filtra todo), pero es inconsistente con las vecinas.',
    '',
    '### 2.4 No hay vulnerabilidad',
    '',
    '- `anon` no matchea el `EXISTS` (auth.uid() = NULL) -> 0 filas.',
    '- Clientes B2C siguen viendo solo sus propios canjes via politica #4.',
    '- Admin via `is_admin()` sigue viendo todos.',
    '',
    'Es un fix de **consistencia + rendimiento + higiene**, no de seguridad.',
    '',
    '---',
    '',
    '## 3. Fix aplicado',
    '',
    '### 3.1 Base de datos (SQL)',
    '',
    'Ver migracion: `supabase/migrations/2026-10-14-f1-11-sec-012-canjes-premios.sql`',
    '',
    '```sql',
    'DROP POLICY IF EXISTS "Admin puede ver todos los canjes" ON public.canjes_premios;',
    '',
    'CREATE POLICY "Admin puede ver todos los canjes"',
    '  ON public.canjes_premios',
    '  FOR SELECT',
    '  TO authenticated',
    '  USING ( (SELECT is_admin()) );',
    '```',
    '',
    '### 3.2 Codigo',
    '',
    'Sin cambios. El unico codigo que toca `canjes_premios` es el path B2C:',
    '',
    '- `src/app/perfil/puntos/page.js:167` (listado del propio cliente)',
    '- `src/lib/dipertivos.js:267` (registro del canje)',
    '- `src/lib/dipertivos.js:280` (log de error)',
    '',
    'Ninguno depende del rol admin. `is_admin` no aparece en `src/`.',
    '',
    '---',
    '',
    '## 4. Verificacion',
    '',
    '### 4.1 Politicas despues del fix (5)',
    '',
    '| # | Nombre | cmd | roles | qual / with_check |',
    '|---|---|---|---|---|',
    '| 1 | `Admin puede eliminar canjes` | DELETE | `{authenticated}` | `is_admin()` |',
    '| 2 | `Usuarios pueden crear sus propios canjes` | INSERT | `{public}` | `auth.uid() = cliente_id` |',
    '| 3 | `Admin puede ver todos los canjes` | SELECT | `{authenticated}` | `(SELECT is_admin())` |',
    '| 4 | `Usuarios pueden ver sus propios canjes` | SELECT | `{public}` | `auth.uid() = cliente_id` |',
    '| 5 | `Admin puede actualizar canjes` | UPDATE | `{authenticated}` | `is_admin()` |',
    '',
    '### 4.2 Comportamiento esperado',
    '',
    '| Sujeto | SELECT canjes_premios |',
    '|---|---|',
    '| Cliente B2C autenticado | Solo los suyos (politica #4) |',
    '| Admin (`is_admin()`) | Todos (politica #3) |',
    '| `service_role` | Todos (bypasea RLS) |',
    '| `anon` | 0 filas |',
    '',
    '### 4.3 Consistencia con ADR-002',
    '',
    'Las 5 politicas de `canjes_premios` usan ahora `is_admin()` cuando',
    'corresponde al rol admin. La tabla queda alineada con la fuente unica de',
    'verdad de rol definida en ADR-002.',
    '',
    '---',
    '',
    '## 5. Impacto',
    '',
    '### Consistencia',
    '',
    '- SEC-012 cerrado: `canjes_premios` alineado con ADR-002.',
    '- 5/5 politicas de la tabla usan `is_admin()` (o criterios B2C explicitos).',
    '',
    '### Rendimiento',
    '',
    '- Politica #3 pasa de subquery correlacionada a InitPlan.',
    '- Impacto medible: bajo (tabla chica, consultas esporadicas). Documentado',
    '  por completitud, sin EXPLAIN ANALYZE (no hay señal medible).',
    '',
    '### Funcionalidad',
    '',
    '- Sin regresiones esperadas.',
    '- Path B2C intacto (politicas #2 y #4 sin cambios).',
    '- Path admin intacto (politicas #1, #3, #5 con `is_admin()`).',
    '',
    '---',
    '',
    '## 6. DoD (F1-11 / SEC-012)',
    '',
    '- [x] Diagnostico completo de las 5 politicas.',
    '- [x] Verificacion PRE con output real de pg_policies (5 filas).',
    '- [x] DROP de la politica inconsistente.',
    '- [x] CREATE con `is_admin()` + rol `{authenticated}`.',
    '- [x] Verificacion POST: 5 filas, politica #3 actualizada.',
    '- [x] Auditoria de codigo (`src/`) para confirmar 0 impactos.',
    '- [x] Migracion SQL versionada en `supabase/migrations/`.',
    '- [x] Doc de auditoria generado (este archivo).',
    '- [x] Tracking actualizado (SEC-012 -> Cerrado).',
    '- [ ] Commit pusheado con `security(db):`.',
    '',
    '---',
    '',
    '## 7. Referencias',
    '',
    '- [SEC-012 en tracking](./06-hallazgos-tracking.md)',
    '- [ADR-002 - app_metadata](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)',
    '- [F1-08 - Consolidacion RLS](./15-f1-08-consolidacion-rls.md)',
    '- [F1-07 - InitPlan](./13-f1-07-rls-initplan.md)',
    '- [Migracion SQL](../../../supabase/migrations/2026-10-14-f1-11-sec-012-canjes-premios.sql)',
    '- [Supabase - RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security)'
)
$doc | Set-Content -Path $docAudit -Encoding UTF8
Write-Host ('  OK: ' + $docAudit)

# --- [4/6] Tracking -----------------------------------------------------------
Write-Host ''
Write-Host '[4/6] Actualizando 06-hallazgos-tracking.md...'

$t = Get-Content -Path $tracking -Raw

# Reemplazar la fila de SEC-012 en la tabla de hallazgos medios
$filaVieja = '| SEC-012 | canjes_premios usa clientes.role en vez de is_admin() | F3 | P2 | Abierto | - |'
$filaNueva = '| SEC-012 | canjes_premios usa clientes.role en vez de is_admin() | F3 | P2 | Cerrado | (Sesion 9) |'

if ($t -match [regex]::Escape($filaVieja)) {
    $t = $t -replace [regex]::Escape($filaVieja), $filaNueva
    Write-Host '  OK: fila SEC-012 actualizada (Abierto -> Cerrado)'
} elseif ($t -match [regex]::Escape($filaNueva)) {
    Write-Host '  INFO: fila SEC-012 ya estaba en Cerrado (idempotente)'
} else {
    Write-Host '  ADVERTENCIA: no se encontro la fila SEC-012 en el tracking' -ForegroundColor Yellow
    Write-Host '  Revisar manualmente antes de commitear.' -ForegroundColor Yellow
}

Set-Content -Path $tracking -Value $t -Encoding UTF8 -NoNewline
Write-Host '  OK: tracking actualizado'

# --- [5/6] STATUS -------------------------------------------------------------
Write-Host ''
Write-Host '[5/6] Actualizando STATUS.md...'

$s = Get-Content -Path $status -Raw

# Fase 1: 8/9 -> 9/9, 89% -> 100%
$s = $s -replace '\| F1 - Seguridad DB \| 9 \| 8 \| 0 \| 1 \| 89% \|', '| F1 - Seguridad DB | 9 | 9 | 0 | 0 | 100% |'

# Total: 15 -> 16 OK, 32 -> 31 pendiente, 32% -> 34%
$s = $s -replace '\| \*\*Total\*\* \| \*\*47\*\* \| \*\*15\*\* \| \*\*0\*\* \| \*\*32\*\* \| \*\*32%\*\* \|', '| **Total** | **47** | **16** | **0** | **31** | **34%** |'

# Progreso global (linea de encabezado)
$s = $s -replace '\*\*Progreso global:\*\* 36% \(17 de 47 tareas\)', '**Progreso global:** 38% (18 de 47 tareas)'

# Hallazgos cerrados en metricas: 21/34 -> 22/34
$s = $s -replace '\| Hallazgos cerrados \| 21 / 34 \| 34 / 34 \|', '| Hallazgos cerrados | 22 / 34 | 34 / 34 |'

# Proximos 3 pasos
$s = $s -replace '1\. \*\*F3-02\*\* - SEC-002: quitar claves hardcodeadas \(P1\)', '1. **F3-02** - SEC-002: quitar claves hardcodeadas (P1)'
$s = $s -replace '2\. \*\*SEC-012\*\* - canjes_premios usa clientes\.role en vez de is_admin\(\) \(P2\)', '2. **chore(docs)** - Limpiar BITACORA.md y STATUS.md (duplicados)'
$s = $s -replace '3\. \*\*chore\(docs\)\*\* - Limpiar BITACORA.md y STATUS.md \(duplicados\)', '3. **F3-04** - AUTH-001: contrasenas debiles (P1)'

Set-Content -Path $status -Value $s -Encoding UTF8 -NoNewline
Write-Host '  OK: STATUS.md actualizado'

# --- [6/6] Verificacion de links ---------------------------------------------
Write-Host ''
Write-Host '[6/6] Verificando links de la documentacion...'
if (Test-Path $verLinks) {
    & powershell -ExecutionPolicy Bypass -File $verLinks
} else {
    Write-Host '  INFO: 00-verificar-links.ps1 no encontrado, salteando' -ForegroundColor Yellow
}

# --- Commit opcional ----------------------------------------------------------
Write-Host ''
if (-not $Commit) {
    Write-Host 'Modo DRY RUN. No se commiteo nada.' -ForegroundColor Yellow
    Write-Host 'Revisa los archivos creados/modificados y despues corre:'
    Write-Host '  .\scripts\docs\18-documentar-sec-012.ps1 -Commit' -ForegroundColor Cyan
} else {
    Write-Host 'Modo -Commit activado. Preparando commit...' -ForegroundColor Yellow

    Push-Location $repoRoot
    try {
        git add $migracion
        git add $docAudit
        git add $tracking
        git add $status

        $msg = 'security(db): alinear canjes_premios con ADR-002 (SEC-012, F1-11)'
        git commit -m $msg
        if ($LASTEXITCODE -ne 0) {
            Write-Host '  ERROR: git commit fallo' -ForegroundColor Red
            exit 1
        }
        git push origin main
        if ($LASTEXITCODE -ne 0) {
            Write-Host '  ERROR: git push fallo' -ForegroundColor Red
            exit 1
        }
        Write-Host '  OK: commit + push completados' -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

Write-Host ''
Write-Host ('=' * 60) -ForegroundColor Cyan
Write-Host '  Script 18 finalizado' -ForegroundColor Cyan
Write-Host ('=' * 60) -ForegroundColor Cyan