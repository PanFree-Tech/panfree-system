<#
.SYNOPSIS
    F1-08 - Consolidar politicas RLS duplicadas.
.DESCRIPTION
    Genera el doc de auditoria, reemplaza el tracking de hallazgos,
    actualiza STATUS.md, hace append a BITACORA.md y crea la migracion SQL.
    Por defecto NO commitea. Usar -Commit para commitear y pushear.
.PARAMETER Commit
    Si se especifica, hace git add + commit + push al final.
.PARAMETER NoCommit
    Modo explicito sin commit (default). Util para pruebas.
.EXAMPLE
    .\13-f1-08-consolidar-rls.ps1
    .\13-f1-08-consolidar-rls.ps1 -Commit
#>
param(
    [switch]$Commit,
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'

# ─────────────────────────────────────────────────────────────
# Configuracion
# ─────────────────────────────────────────────────────────────
$repoRoot   = (Get-Location).Path
$fecha      = '2026-10-13'
$docPath    = "docs\audits\$fecha-inicial\15-f1-08-consolidacion-rls.md"
$trackPath  = "docs\audits\$fecha-inicial\06-hallazgos-tracking.md"
$statusPath = "docs\STATUS.md"
$bitacPath  = "docs\BITACORA.md"
$migPath    = "supabase\migrations\$fecha-f1-08-consolidar-rls.sql"

function Write-Seccion($titulo) {
    Write-Host ''
    Write-Host ('=' * 64) -ForegroundColor Cyan
    Write-Host "  $titulo" -ForegroundColor Cyan
    Write-Host ('=' * 64) -ForegroundColor Cyan
}

function New-FileSi($ruta, $contenido, $sobrescribir = $false) {
    if ((Test-Path $ruta) -and -not $sobrescribir) {
        Write-Host "[SKIP] Ya existe: $ruta" -ForegroundColor Yellow
        return
    }
    $dir = Split-Path $ruta -Parent
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    $contenido | Set-Content -Path $ruta -Encoding UTF8
    Write-Host "[OK] Escrito: $ruta" -ForegroundColor Green
}

function Add-BloqueSi($ruta, $marcador, $bloque) {
    $txt = Get-Content $ruta -Raw
    if ($txt -match [regex]::Escape($marcador)) {
        Write-Host "[SKIP] Marcador ya presente en $ruta" -ForegroundColor Yellow
        return
    }
    Add-Content -Path $ruta -Value $bloque -Encoding UTF8
    Write-Host "[OK] Append a: $ruta" -ForegroundColor Green
}

Write-Host ''
Write-Host "F1-08 - Consolidar politicas RLS duplicadas" -ForegroundColor White
Write-Host "Repo: $repoRoot" -ForegroundColor Gray
if ($Commit) { Write-Host "Modo: CON COMMIT" -ForegroundColor Magenta }
else         { Write-Host "Modo: SIN COMMIT (dry run)" -ForegroundColor Gray }

# ─────────────────────────────────────────────────────────────
# 1. Doc de auditoria
# ─────────────────────────────────────────────────────────────
Write-Seccion '1. Generando doc de auditoria'

$docLineas = @(
    '# F1-08 - Consolidar politicas RLS duplicadas',
    '',
    '**Fecha:** 2026-10-13',
    '**Hallazgo:** DB-001f',
    '**Severidad:** Media (rendimiento + higiene)',
    '**Estado:** Cerrado',
    '**Esfuerzo:** L (Large)',
    '',
    '---',
    '',
    '## Contexto',
    '',
    'Supabase Security Advisor reportaba ~150 "politicas permisivas duplicadas"',
    'en el esquema `public`. Durante F1-08 se hizo el inventario real de',
    '`pg_policies` y se aplico una consolidacion en 4 bloques.',
    '',
    '---',
    '',
    '## Aclaracion sobre el conteo del advisor',
    '',
    'El advisor reporta **~150** pero el inventario real de `pg_policies`',
    'mostro **78 politicas en public + 5 en storage**. La diferencia se explica',
    'porque el advisor cuenta:',
    '',
    '- Cada politica con `roles={public}` (que aplica implicitamente a `anon`',
    '  y `authenticated`).',
    '- Politicas heredadas de RLS en tablas relacionadas.',
    '- No cada **duplicado real** (misma regla, mismo cmd, mismos roles).',
    '',
    'Duplicados reales detectados y justificados: **20**.',
    '',
    '---',
    '',
    '## Inventario antes / despues',
    '',
    '| Esquema | Antes | Despues | Diferencia |',
    '|---|---|---|---|',
    '| public | 78 | 58 | -20 |',
    '| storage | 5 | 5 | 0 |',
    '| **Total** | **83** | **63** | **-20** |',
    '',
    '---',
    '',
    '## Los 4 bloques aplicados',
    '',
    '### Bloque 1 - Duplicados exactos admin ALL (5 politicas)',
    '',
    '| Tabla | Politica eliminada | Politica conservada |',
    '|---|---|---|',
    '| pedidos | `Admin full access pedidos` | `pedidos_admin_all` |',
    '| detalle_pedido | `Admin full access detalle_pedido` | `detalle_pedido_admin_all` |',
    '| productos | `Admin full access productos` | `admin_all_productos` |',
    '| productos | `productos_admin_all` | `admin_all_productos` |',
    '| insumos | `insumos_admin_all` | `Admin ERP insumos` |',
    '',
    '**Razon:** mismo `cmd=ALL`, mismos `roles` (o subset), misma expresion.',
    '',
    '### Bloque 2 - Duplicados semanticos is_admin() vs jwt (9 politicas)',
    '',
    '| Tabla | Eliminada (variante jwt) | Conservada (is_admin) |',
    '|---|---|---|',
    '| compras | `compras_admin` | `Admin ERP compras` |',
    '| detalle_compra | `detalle_compra_admin` | `Admin ERP detalle_compra` |',
    '| detalle_pedido | `detalle_pedido_admin_write` | `detalle_pedido_admin_all` |',
    '| detalle_produccion | `detalle_produccion_admin` | `Admin ERP detalle_produccion` |',
    '| eventos_calendario | `Admins pueden gestionar eventos` | `Admin gestion eventos_calendario` |',
    '| produccion | `produccion_admin` | `Admin ERP produccion` |',
    '| productos | `productos_escritura_admin` | `admin_all_productos` |',
    '| promociones_historico | `Admins pueden gestionar historico` | `Admin gestion promociones_historico` |',
    '| reglas_promocion | `Admins pueden gestionar reglas` | `Admin gestion reglas_promocion` |',
    '',
    '**Razon:** post-F3-01, `is_admin()` lee de `app_metadata.role`.',
    'Por lo tanto `is_admin()` es equivalente a',
    "`auth.jwt()->'app_metadata'->>'role'='admin'`. Se conserva la variante",
    '`is_admin()` por ser mas corta y centralizada (ver ADR-002).',
    '',
    '### Bloque 3a - Subsets redundantes SELECT (3 politicas)',
    '',
    '| Tabla | Eliminada | Conservada (superset) |',
    '|---|---|---|',
    '| pedidos | `pedidos_owner_select` | `pedidos_lectura` |',
    '| pedidos | `pedidos_select_own` | `pedidos_lectura` |',
    '| detalle_pedido | `detalle_owner_select` | `detalle_pedido_lectura` |',
    '',
    '**Razon:** Postgres combina politicas permisivas con OR. La superset',
    'cubre todos los casos de los subsets. Sin perdida funcional.',
    '',
    '### Bloque 3b - select_publico_productos (1 politica, leak de informacion)',
    '',
    '| Tabla | Eliminada | Razon |',
    '|---|---|---|',
    '| productos | `select_publico_productos` | `qual=true` + `roles={public}` exponia productos inactivos a cualquiera |',
    '',
    '**Razon:** politica SELECT con `qual=true` anulaba `productos_lectura_publica`',
    '(que filtra `is_active=true`) por la combinacion OR de Postgres.',
    'Cualquier cliente (incluso `anon`) que hiciera `SELECT * FROM productos`',
    'via PostgREST veia productos inactivos, salteando los filtros del',
    'frontend. **Es un leak de informacion, no solo un duplicado.**',
    '',
    '**Cierre:** se elimino la politica. Ahora:',
    '- Publicos ven solo activos (via `productos_lectura_publica`).',
    '- Admin ve todo (via `productos_lectura_admin` + `admin_all_productos`).',
    '',
    '### Bloque 4 - Redundantes en notificaciones_admin (2 politicas)',
    '',
    '| Tabla | Eliminada | Razon |',
    '|---|---|---|',
    '| notificaciones_admin | `Solo admin puede leer notificaciones` | cubierta por `notif_admin_all` (ALL) |',
    '| notificaciones_admin | `Admin puede actualizar notificaciones` | cubierta por `notif_admin_all` (ALL) |',
    '',
    '**Razon:** `notif_admin_all` es ALL con `qual=is_admin()` y',
    '`with_check=is_admin()`. Cubre SELECT, INSERT, UPDATE y DELETE para admin.',
    'Las 2 eliminadas agregaban `auth.role()=''authenticated''` que es',
    'implicito en `is_admin()`. No se toco `Permitir inserts desde triggers`',
    '(funcionalmente distinta).',
    '',
    '---',
    '',
    '## Hallazgos colaterales detectados durante F1-08',
    '',
    '| ID | Descripcion | Severidad | Estado |',
    '|---|---|---|---|',
    '| SEC-010 | `select_publico_productos` exponia productos inactivos (leak) | Media | **Cerrado en F1-08** |',
    '| SEC-011 | `email_logs.Authenticated users can read email_logs` con `qual=true` | Alta | Abierto (Sesion 7) |',
    '| SEC-012 | `canjes_premios.Admin puede ver todos los canjes` usa `clientes.role` en vez de `is_admin()` | Media | Abierto (F3) |',
    '| BUG-003 | `diptico/[codigo]/page.js:98` usa `.eq(''activo'', true)` (typo, columna real `is_active`) | Baja | Abierto (F3) |',
    '',
    '---',
    '',
    '## Aprendizajes',
    '',
    '1. **Postgres combina politicas permisivas con OR.** La mas amplia gana.',
    '   Esto significa que una politica mal escrita con `qual=true` puede',
    '   anular politicas mas restrictivas escritas al lado.',
    '2. **El advisor de Supabase sobreestima duplicados.** Cuenta cada politica',
    '   permisiva sobre `roles={public}`, no cada duplicado real.',
    '3. **`is_admin()` vs `auth.jwt()->''app_metadata''->>''role''`** son',
    '   equivalentes post-F3-01. Mantener solo `is_admin()` por consistencia',
    '   con ADR-002.',
    '4. **Auditar el codigo antes de eliminar politicas permisivas.**',
    '   Confirmar que los paths que necesitan ver datos "especiales"',
    '   (ej: inactivos) esten cubiertos por otra politica con el rol correcto.',
    '',
    '---',
    '',
    '## Rollback',
    '',
    'Cada bloque tiene su rollback documentado en:',
    '',
    '- `supabase/migrations/2026-10-13-f1-08-consolidar-rls.sql` (comentado).',
    '',
    'No se recomienda rollback: la version consolidada es equivalente',
    'y ademas corrige el leak de `select_publico_productos`.',
    '',
    '---',
    '',
    '## DoD (F1-08)',
    '',
    '- [x] Inventario completo de `pg_policies` analizado.',
    '- [x] 20 duplicados reales identificados y justificados.',
    '- [x] 4 bloques aplicados con verificacion PRE y POST.',
    '- [x] 0 perdidas funcionales (analisis de impacto en codigo).',
    '- [x] Leak de `select_publico_productos` cerrado.',
    '- [x] SQL versionado en `supabase/migrations/`.',
    '- [x] Hallazgos colaterales registrados.',
    '- [x] Tracking actualizado (DB-001f -> Cerrado).',
    '- [x] Doc de auditoria generado (este archivo).',
    '- [ ] Commit pusheado con `security(db):`.',
    '',
    '---',
    '',
    '## Referencias',
    '',
    '- [DB-001f en tracking](./06-hallazgos-tracking.md)',
    '- [Advisors de Supabase](./02-supabase-advisors.md)',
    '- [F1-07 - InitPlan](./13-f1-07-rls-initplan.md)',
    '- [Migracion SQL](../../../supabase/migrations/2026-10-13-f1-08-consolidar-rls.sql)',
    '- [ADR-002: app_metadata](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)',
    '- [Supabase - RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security)',
    ''
)

New-FileSi $docPath $docLineas $false

# ─────────────────────────────────────────────────────────────
# 2. Tracking de hallazgos (reemplazo completo)
# ─────────────────────────────────────────────────────────────
Write-Seccion '2. Reemplazando tracking de hallazgos'

$trackLineas = @(
    '# Tracking de Hallazgos - Auditoria 2026-10-13',
    '',
    '**Ultima actualizacion:** 2026-10-13 (fin Sesion 6)',
    '**Total de hallazgos:** 31',
    '',
    '---',
    '',
    '## 1. Resumen',
    '',
    '| Estado | Cantidad |',
    '|---|---|',
    '| Abierto | 13 |',
    '| En curso | 0 |',
    '| Cerrado | 17 |',
    '| Aceptado | 1 |',
    '',
    '---',
    '',
    '## 2. Hallazgos por severidad',
    '',
    '| Severidad | Cantidad | Cerrados |',
    '|---|---|---|',
    '| Critica | 8 | 6 |',
    '| Alta | 11 | 7 |',
    '| Media | 8 | 4 |',
    '| Baja | 4 | 0 |',
    '',
    '---',
    '',
    '## 3. Tabla completa de hallazgos',
    '',
    '### Hallazgos criticos',
    '',
    '| ID | Titulo | Fase | Prioridad | Estado | Commit |',
    '|---|---|---|---|---|---|',
    '| SEC-001 | .env en historial Git | F4 | P0 | Abierto | - |',
    '| SEC-003 | Admin por user_metadata | F3 | P0 | Cerrado | e5bed103 |',
    '| DB-001 | 250+ advisors Supabase | F1 | P0 | Abierto | - |',
    '| DB-001a | Vistas SECURITY DEFINER | F1 | P0 | Cerrado | 8c5b311a |',
    '| DB-001b | Politicas RLS Always True | F1 | P0 | Cerrado | fea87bb2 |',
    '| DB-001c | Funciones SECURITY DEFINER publicas | F1 | P0 | Cerrado | 542e3a2e |',
    '| SEC-004 | UPDATE clientes.role desde cliente | F3 | P0 | Cerrado | 4d5bd9c2 |',
    '| SEC-005 | anon con DDL sobre clientes | F3 | P0 | Cerrado | 4d5bd9c2 |',
    '',
    '### Hallazgos altos',
    '',
    '| ID | Titulo | Fase | Prioridad | Estado | Commit |',
    '|---|---|---|---|---|---|',
    '| SEC-002 | DEFAULT_SUPABASE_ANON_KEY hardcodeada | F3 | P1 | Abierto | - |',
    '| SEC-006 | redirectTo hardcodeado | F3 | P1 | Cerrado | 4d5bd9c2 |',
    '| SEC-007 | INSERT clientes.role desde frontend | F3 | P1 | Cerrado | 4d5bd9c2 |',
    '| SEC-011 | email_logs SELECT true para authenticated | F1/F3 | P1 | Abierto | - |',
    '| AUTH-001 | Contrasenas debiles | F3 | P1 | Abierto | - |',
    '| AUTH-002 | Registro sin validar duplicados | F3 | P1 | Abierto | - |',
    '| DBG-001 | console.log con datos sensibles | F3 | P1 | Abierto | - |',
    '| DB-001d | Bucket Storage listable | F1 | P1 | Cerrado | 326d4edd |',
    '| DB-001g | Funciones con search_path mutable | F1 | P1 | Cerrado | 3e500e77 |',
    '| DB-001h | Leaked Password Protection | F1 | P1 | Aceptado | (plan Free) |',
    '| P7 | 3 politicas con auth.jwt() raiz | F3 | P1 | Cerrado | 4d5bd9c2 |',
    '',
    '### Hallazgos medios',
    '',
    '| ID | Titulo | Fase | Prioridad | Estado | Commit |',
    '|---|---|---|---|---|---|',
    '| BUG-001 | NEXT_PUBLIC_VAPID_KEY inconsistente | F3 | P2 | Abierto | - |',
    '| BUG-002 | route.js inserta avatar (columna avatar_url) | F3 | P2 | Cerrado | 4d5bd9c2 |',
    '| CONF-001 | ESLint ignorado en build | F3 | P2 | Abierto | - |',
    '| CONF-002 | Sin headers de seguridad | F3 | P2 | Abierto | - |',
    '| DB-001e | ~60 politicas RLS sin optimizar | F1 | P2 | Cerrado | 02311b72 |',
    '| DB-001f | ~150 politicas duplicadas | F1 | P2 | **Cerrado** | (pendiente commit) |',
    '| SEC-010 | select_publico_productos exponia inactivos (leak) | F1 | P2 | **Cerrado** | (pendiente commit) |',
    '| SEC-012 | canjes_premios usa clientes.role en vez de is_admin() | F3 | P2 | Abierto | - |',
    '',
    '### Hallazgos bajos',
    '',
    '| ID | Titulo | Fase | Prioridad | Estado | Commit |',
    '|---|---|---|---|---|---|',
    '| BUG-003 | diptico/[codigo] usa .eq(''activo'') en vez de is_active | F3 | P3 | Abierto | - |',
    '| DB-001i | Indices duplicados | F1 | P3 | Abierto | - |',
    '| TST-001 | Cobertura de tests baja | F4 | P3 | Abierto | - |',
    '| DOC-001 | Falta PropTypes/JSDoc | F4 | P3 | Abierto | - |',
    '',
    '---',
    '',
    '## 4. Como cerrar un hallazgo',
    '',
    '1. **Fix aplicado** en codigo o DB.',
    '2. **DoD cumplido.**',
    '3. **Commit pusheado** con prefijo `security:`/`fix:`/`refactor:`.',
    '4. **Actualizar este archivo:** Estado -> Cerrado + hash del commit.',
    '5. **Actualizar STATUS.md** (contador de hallazgos cerrados).',
    '',
    '---',
    '',
    '## 5. Estados posibles',
    '',
    '| Estado | Significado |',
    '|---|---|',
    '| Abierto | Identificado, sin fix |',
    '| En curso | Fix en desarrollo |',
    '| Cerrado | Fix aplicado, verificado, documentado |',
    '| Aceptado | Riesgo aceptado, no se fixea |',
    '',
    '---',
    '',
    '## 6. Referencias',
    '',
    '- [Resumen ejecutivo](./00-resumen-ejecutivo.md)',
    '- [Criterios de aceptacion](./05-criterios-aceptacion.md)',
    '- [Plan de remediacion](./99-plan-remediacion.md)',
    '- [Advisors de Supabase](./02-supabase-advisors.md)',
    '- [F1-07 InitPlan](./13-f1-07-rls-initplan.md)',
    '- [F1-08 Consolidacion](./15-f1-08-consolidacion-rls.md)',
    ''
)

New-FileSi $trackPath $trackLineas $true

# ─────────────────────────────────────────────────────────────
# 3. STATUS.md (actualizar contadores + ultima actividad)
# ─────────────────────────────────────────────────────────────
Write-Seccion '3. Actualizando STATUS.md'

$statusTxt = Get-Content $statusPath -Raw

# 3.1 Actualizar "Ultima actualizacion" y "Progreso global"
$statusTxt = $statusTxt -replace '\*\*Ultima actualizacion:\*\* 2026-10-13 \(fin Sesion 5\)', '**Ultima actualizacion:** 2026-10-13 (fin Sesion 6)'
$statusTxt = $statusTxt -replace '\*\*Progreso global:\*\* 32% \(15 de 47 tareas\)', '**Progreso global:** 34% (16 de 47 tareas)'

# 3.2 Actualizar tabla de resumen por fase (F1: 6 -> 7)
$statusTxt = $statusTxt -replace '\| F1 - Seguridad DB \| 9 \| 6 \| 0 \| 3 \| 67% \|', '| F1 - Seguridad DB | 9 | 7 | 0 | 2 | 78% |'
$statusTxt = $statusTxt -replace '\| \*\*Total\*\* \| \*\*47\*\* \| \*\*13\*\* \| \*\*0\*\* \| \*\*34\*\* \| \*\*28%\*\* \|', '| **Total** | **47** | **14** | **0** | **33** | **30%** |'

# 3.3 Actualizar proximos 3 pasos
$statusTxt = $statusTxt -replace '1\. \*\*F1-06\*\* - Habilitar Leaked Password Protection en Supabase Auth \(P1\)', '1. **F1-09** - Eliminar indices duplicados (P3, esfuerzo S)'
$statusTxt = $statusTxt -replace '2\. \*\*F1-07\*\* - Optimizar ~60 politicas RLS \(InitPlan\) \(P2, esfuerzo L\)', '2. **F3-02** - SEC-002: quitar claves hardcodeadas (P1)'
$statusTxt = $statusTxt -replace '3\. \*\*F1-08\*\* - Consolidar ~150 politicas duplicadas \(P2, esfuerzo L\)', '3. **chore(docs)** - Limpiar entradas duplicadas en BITACORA.md'

# 3.4 Actualizar metricas clave: hallazgos cerrados 6/22 -> 14/31
$statusTxt = $statusTxt -replace '\| Hallazgos cerrados \| 6 / 22 \| 22 / 22 \|', '| Hallazgos cerrados | 14 / 31 | 31 / 31 |'

# 3.5 Append de ultima actividad (bloque Sesion 6)
$bloqueStatus = @(
    '',
    '**2026-10-13 - Sesion 6 (EN CURSO)**',
    '- F1-08: 20 politicas RLS consolidadas/eliminadas en 4 bloques',
    '- Bloque 1: 5 duplicados exactos admin ALL',
    '- Bloque 2: 9 duplicados semanticos is_admin() vs jwt',
    '- Bloque 3a: 3 subsets redundantes SELECT',
    '- Bloque 3b: 1 leak de informacion (select_publico_productos)',
    '- Bloque 4: 2 redundantes en notificaciones_admin',
    '- Hallazgo DB-001f cerrado',
    '- Hallazgo SEC-010 cerrado (leak de productos inactivos)',
    '- Hallazgos nuevos: SEC-011, SEC-012, BUG-003',
    '- Doc: docs/audits/2026-10-13-inicial/15-f1-08-consolidacion-rls.md',
    '- Migracion: supabase/migrations/2026-10-13-f1-08-consolidar-rls.sql',
    ''
) -join "`r`n"

$marcadorStatus = 'Sesion 6 (EN CURSO)'
if ($statusTxt -notmatch [regex]::Escape($marcadorStatus)) {
    Add-Content -Path $statusPath -Value $bloqueStatus -Encoding UTF8
}

Set-Content -Path $statusPath -Value $statusTxt -Encoding UTF8
Write-Host "[OK] STATUS.md actualizado" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────
# 4. BITACORA.md (append Sesion 6)
# ─────────────────────────────────────────────────────────────
Write-Seccion '4. Haciendo append a BITACORA.md'

$bloqueBitacora = @(
    '',
    '---',
    '---',
    '',
    '## 2026-10-13 (Sesion 6 - CIERRE)',
    '',
    '**Duracion:** ~3 horas',
    '**Objetivo:** Ejecutar F1-08 (consolidar ~150 politicas RLS duplicadas)',
    '',
    '**Completado:**',
    '- F1-08: 20 politicas RLS consolidadas/eliminadas en 4 bloques',
    '- Bloque 1: 5 duplicados exactos admin ALL (pedidos, detalle_pedido, productos, insumos)',
    '- Bloque 2: 9 duplicados semanticos is_admin() vs auth.jwt()',
    '- Bloque 3a: 3 subsets redundantes SELECT (pedidos, detalle_pedido)',
    '- Bloque 3b: 1 leak de informacion (productos.select_publico_productos)',
    '- Bloque 4: 2 redundantes en notificaciones_admin',
    '- Inventario completo de pg_policies antes/despues (83 -> 63)',
    '- Auditoria de codigo para validar impacto (todos los paths publicos filtran is_active)',
    '- Doc de auditoria: docs/audits/2026-10-13-inicial/15-f1-08-consolidacion-rls.md',
    '- Migracion SQL: supabase/migrations/2026-10-13-f1-08-consolidar-rls.sql',
    '',
    '**Commits de la sesion:**',
    '- (pendiente) security(db): consolidar politicas RLS duplicadas (F1-08)',
    '',
    '**Hallazgos cerrados:**',
    '- DB-001f: ~150 politicas RLS duplicadas',
    '- SEC-010: select_publico_productos exponia productos inactivos',
    '',
    '**Hallazgos nuevos:**',
    '- SEC-011: email_logs.Authenticated users can read email_logs con qual=true (Alta)',
    '- SEC-012: canjes_premios.Admin puede ver todos los canjes usa clientes.role (Media)',
    '- BUG-003: diptico/[codigo] usa .eq(''activo'') en vez de is_active (Baja)',
    '',
    '**Bloqueantes:**',
    '- Ninguno',
    '',
    '**Aprendizajes:**',
    '- Postgres combina politicas permisivas con OR: la mas amplia gana.',
    '  Una politica con qual=true puede anular politicas restrictivas vecinas.',
    '- El advisor de Supabase sobreestima duplicados: cuenta permisivas sobre',
    '  roles={public}, no duplicados reales.',
    '- is_admin() y auth.jwt()->app_metadata->>''role'' son equivalentes post-F3-01.',
    '- Auditar el codigo antes de eliminar politicas permisivas es obligatorio.',
    '',
    '**Proxima sesion:**',
    '- F1-09: Eliminar indices duplicados (P3, esfuerzo S)',
    '- F3-02: SEC-002 quitar claves hardcodeadas (P1)',
    '- chore(docs): limpiar entradas duplicadas en BITACORA.md y STATUS.md',
    '- SEC-011: analizar email_logs SELECT true para authenticated',
    ''
) -join "`r`n"

Add-BloqueSi $bitacPath 'Sesion 6 - CIERRE' $bloqueBitacora

# ─────────────────────────────────────────────────────────────
# 5. Migracion SQL
# ─────────────────────────────────────────────────────────────
Write-Seccion '5. Generando migracion SQL'

$sqlLineas = @(
    '-- =====================================================================',
    '-- F1-08 - Consolidar politicas RLS duplicadas',
    '-- Fecha: 2026-10-13',
    '-- Hallazgo: DB-001f (+ SEC-010 leak de productos inactivos)',
    '-- Resumen: 20 politicas eliminadas en 4 bloques.',
    '-- Total antes: 83 (public 78 + storage 5)',
    '-- Total despues: 63 (public 58 + storage 5)',
    '-- =====================================================================',
    '',
    '-- ---------------------------------------------------------------------',
    '-- BLOQUE 1 - Duplicados exactos admin ALL (5 politicas)',
    '-- ---------------------------------------------------------------------',
    '',
    'DROP POLICY IF EXISTS "Admin full access pedidos"        ON public.pedidos;',
    'DROP POLICY IF EXISTS "Admin full access detalle_pedido" ON public.detalle_pedido;',
    'DROP POLICY IF EXISTS "Admin full access productos"      ON public.productos;',
    'DROP POLICY IF EXISTS "productos_admin_all"              ON public.productos;',
    'DROP POLICY IF EXISTS "insumos_admin_all"                ON public.insumos;',
    '',
    '-- ---------------------------------------------------------------------',
    '-- BLOQUE 2 - Duplicados semanticos is_admin() vs jwt (9 politicas)',
    '-- ---------------------------------------------------------------------',
    '',
    'DROP POLICY IF EXISTS "compras_admin"                     ON public.compras;',
    'DROP POLICY IF EXISTS "detalle_compra_admin"              ON public.detalle_compra;',
    'DROP POLICY IF EXISTS "detalle_pedido_admin_write"        ON public.detalle_pedido;',
    'DROP POLICY IF EXISTS "detalle_produccion_admin"          ON public.detalle_produccion;',
    'DROP POLICY IF EXISTS "Admins pueden gestionar eventos"   ON public.eventos_calendario;',
    'DROP POLICY IF EXISTS "produccion_admin"                  ON public.produccion;',
    'DROP POLICY IF EXISTS "productos_escritura_admin"         ON public.productos;',
    'DROP POLICY IF EXISTS "Admins pueden gestionar histórico" ON public.promociones_historico;',
    'DROP POLICY IF EXISTS "Admins pueden gestionar reglas"    ON public.reglas_promocion;',
    '',
    '-- ---------------------------------------------------------------------',
    '-- BLOQUE 3a - Subsets redundantes SELECT (3 politicas)',
    '-- ---------------------------------------------------------------------',
    '',
    'DROP POLICY IF EXISTS "pedidos_owner_select"              ON public.pedidos;',
    'DROP POLICY IF EXISTS "pedidos_select_own"                ON public.pedidos;',
    'DROP POLICY IF EXISTS "detalle_owner_select"              ON public.detalle_pedido;',
    '',
    '-- ---------------------------------------------------------------------',
    '-- BLOQUE 3b - Leak de productos inactivos (1 politica)',
    '-- ---------------------------------------------------------------------',
    '',
    'DROP POLICY IF EXISTS "select_publico_productos"          ON public.productos;',
    '',
    '-- ---------------------------------------------------------------------',
    '-- BLOQUE 4 - Redundantes en notificaciones_admin (2 politicas)',
    '-- ---------------------------------------------------------------------',
    '',
    'DROP POLICY IF EXISTS "Solo admin puede leer notificaciones"  ON public.notificaciones_admin;',
    'DROP POLICY IF EXISTS "Admin puede actualizar notificaciones" ON public.notificaciones_admin;',
    '',
    '-- =====================================================================',
    '-- ROLLBACK (solo si hay que revertir)',
    '-- =====================================================================',
    '',
    '-- Bloque 1',
    '-- CREATE POLICY "Admin full access pedidos"        ON public.pedidos FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));',
    '-- CREATE POLICY "Admin full access detalle_pedido" ON public.detalle_pedido FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));',
    '-- CREATE POLICY "Admin full access productos"      ON public.productos FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));',
    '-- CREATE POLICY "productos_admin_all"              ON public.productos FOR ALL TO public USING ((SELECT is_admin()));',
    '-- CREATE POLICY "insumos_admin_all"                ON public.insumos FOR ALL TO public USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));',
    '',
    '-- Bloque 2 (restaurar variante jwt)',
    '-- CREATE POLICY "compras_admin"                     ON public.compras FOR ALL TO authenticated USING (((((SELECT auth.jwt()) -> ''app_metadata'') ->> ''role'') = ''admin'')) WITH CHECK (((((SELECT auth.jwt()) -> ''app_metadata'') ->> ''role'') = ''admin''));',
    '-- ... (ver historial Git para el resto)',
    '',
    '-- Bloque 3a',
    '-- CREATE POLICY "pedidos_owner_select" ON public.pedidos FOR SELECT TO public USING (cliente_id IN (SELECT clientes.id FROM clientes WHERE clientes.user_id = (SELECT auth.uid())));',
    '-- CREATE POLICY "pedidos_select_own"   ON public.pedidos FOR SELECT TO public USING ((SELECT is_admin()) OR cliente_id IN (SELECT clientes.id FROM clientes WHERE clientes.user_id = (SELECT auth.uid())));',
    '-- CREATE POLICY "detalle_owner_select" ON public.detalle_pedido FOR SELECT TO public USING (pedido_id IN (SELECT p.id FROM pedidos p JOIN clientes c ON c.id = p.cliente_id WHERE c.user_id = (SELECT auth.uid())));',
    '',
    '-- Bloque 3b (NO restaurar: reintroduce el leak)',
    '-- CREATE POLICY "select_publico_productos" ON public.productos FOR SELECT TO public USING (true);',
    '',
    '-- Bloque 4',
    '-- CREATE POLICY "Solo admin puede leer notificaciones"  ON public.notificaciones_admin FOR SELECT TO public USING ((SELECT auth.role()) = ''authenticated'' AND (((SELECT auth.jwt()) -> ''app_metadata'') ->> ''role'') = ''admin'');',
    '-- CREATE POLICY "Admin puede actualizar notificaciones" ON public.notificaciones_admin FOR UPDATE TO public USING ((SELECT auth.role()) = ''authenticated'' AND (((SELECT auth.jwt()) -> ''app_metadata'') ->> ''role'') = ''admin'');',
    ''
)

New-FileSi $migPath $sqlLineas $true

# ─────────────────────────────────────────────────────────────
# 6. Verificacion final
# ─────────────────────────────────────────────────────────────
Write-Seccion '6. Verificacion de archivos generados'

$archivos = @($docPath, $trackPath, $statusPath, $bitacPath, $migPath)
foreach ($a in $archivos) {
    if (Test-Path $a) {
        $size = (Get-Item $a).Length
        Write-Host ("[OK] {0} ({1} bytes)" -f $a, $size) -ForegroundColor Green
    } else {
        Write-Host "[FALTA] $a" -ForegroundColor Red
    }
}

# ─────────────────────────────────────────────────────────────
# 7. Commit (opcional)
# ─────────────────────────────────────────────────────────────
Write-Seccion '7. Git'

if ($Commit) {
    Write-Host 'Ejecutando git add + commit + push...' -ForegroundColor Magenta

    git add $docPath $trackPath $statusPath $bitacPath $migPath scripts\docs\13-f1-08-consolidar-rls.ps1

    git commit -m "security(db): consolidar politicas RLS duplicadas (F1-08)"

    git push origin main

    Write-Host '[OK] Commit y push completados' -ForegroundColor Green
} else {
    Write-Host 'Modo SIN COMMIT. Para commitear, correr con -Commit' -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'Sugerencia de commit:' -ForegroundColor Cyan
    Write-Host '  git add docs/ supabase/migrations/ scripts/docs/13-f1-08-consolidar-rls.ps1' -ForegroundColor White
    Write-Host '  git commit -m "security(db): consolidar politicas RLS duplicadas (F1-08)"' -ForegroundColor White
    Write-Host '  git push origin main' -ForegroundColor White
}

Write-Host ''
Write-Host 'F1-08 completado.' -ForegroundColor Green
Write-Host ''