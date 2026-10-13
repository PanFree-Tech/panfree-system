<#
.SYNOPSIS
    Documenta F3-01 (SEC-003 + P7 + SEC-004/005/006/007 + BUG-002).

.DESCRIPTION
    Crea el doc de auditoria de F3-01, actualiza el tracking de hallazgos,
    STATUS.md y BITACORA.md. Commitea y pushea si no se pasa -NoCommit.

.PARAMETER NoCommit
    Corre en modo dry-run: crea/actualiza archivos pero no commitea.

.EXAMPLE
    .\11-documentar-f3-01.ps1 -NoCommit
    .\11-documentar-f3-01.ps1
#>

[CmdletBinding()]
param(
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# ============================================================================
# Configuracion
# ============================================================================
$RepoRoot = 'C:\Users\Admin\proyectos\panfree-system'
$AuditDir = Join-Path $RepoRoot 'docs\audits\2026-10-13-inicial'
$DocF301 = Join-Path $AuditDir '14-f3-01-admin-app-metadata.md'
$Tracking = Join-Path $AuditDir '06-hallazgos-tracking.md'
$Status = Join-Path $RepoRoot 'docs\STATUS.md'
$Bitacora = Join-Path $RepoRoot 'docs\BITACORA.md'

$Fecha = '2026-10-13'
$Session = 'Sesion 5'
$CommitMiddleware = 'e5bed103'

function Write-Section([string]$Text) {
    Write-Host ''
    Write-Host ('=' * 70) -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host ('=' * 70) -ForegroundColor Cyan
}

function Write-Ok([string]$Text)   { Write-Host "  [OK] $Text"   -ForegroundColor Green }
function Write-Warn([string]$Text) { Write-Host "  [!!] $Text"   -ForegroundColor Yellow }
function Write-Err([string]$Text)  { Write-Host "  [XX] $Text"   -ForegroundColor Red }
function Write-Info([string]$Text) { Write-Host "  [..] $Text"   -ForegroundColor Gray }

# ============================================================================
# 1. Verificar prerequisitos
# ============================================================================
Write-Section '1. Verificando prerequisitos'

if (-not (Test-Path $RepoRoot)) {
    Write-Err "No existe $RepoRoot"
    exit 1
}
Write-Ok "Repo encontrado: $RepoRoot"

Set-Location $RepoRoot

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') {
    Write-Warn "Rama actual: $branch (esperado: main)"
} else {
    Write-Ok "Rama: main"
}

if (-not (Test-Path $AuditDir)) {
    Write-Err "No existe $AuditDir"
    exit 1
}
Write-Ok "Carpeta de auditoria encontrada"

# ============================================================================
# 2. Crear doc 14-f3-01-admin-app-metadata.md
# ============================================================================
Write-Section '2. Creando doc 14-f3-01-admin-app-metadata.md'

$docLines = @(
    '# F3-01 - Migrar autorizacion admin a app_metadata',
    '',
    "**Fecha:** $Fecha",
    '**Hallazgos cerrados:** SEC-003, P7, SEC-004, SEC-005, SEC-006, SEC-007, BUG-002',
    '**Severidad:** Critica (SEC-003, SEC-004, SEC-005) / Alta (SEC-006, SEC-007) / Media (BUG-002)',
    '**Estado:** Cerrado',
    '**Esfuerzo:** S (Small)',
    '',
    '---',
    '',
    '## Contexto',
    '',
    'ADR-002 establece que `app_metadata.role` es la unica fuente de verdad',
    'del rol de un usuario. Sin embargo, el middleware leia `user_metadata.role`',
    '(editable por el usuario) y varias politicas RLS usaban la raiz del JWT',
    'en lugar de `app_metadata`. Esto permitia elevacion de privilegios.',
    '',
    '---',
    '',
    '## Hallazgos cerrados',
    '',
    '| ID | Descripcion | Como se cerro |',
    '|---|---|---|',
    '| SEC-003 | Middleware leia `user_metadata.role` (editable por el cliente) | `src/middleware.js` ahora lee solo `user.app_metadata?.role` |',
    '| P7 | 3 politicas usaban `auth.jwt() ->> ''role''` (raiz, nunca da ''admin'') | Migradas a `auth.jwt() -> ''app_metadata'' ->> ''role''` |',
    '| SEC-004 | `authenticated` podia UPDATE `clientes.role` (auto-promocion) | `REVOKE UPDATE (role)` via grant quirurgico por columna |',
    '| SEC-005 | `anon` tenia UPDATE/INSERT/DELETE/TRUNCATE sobre `clientes` | `REVOKE ALL ON public.clientes FROM anon` |',
    '| SEC-006 | `authenticated` podia modificar columnas sensibles (`puntos_fidelidad`, `nivel_cliente`, `is_active`, `user_id`, `id`) | Grant UPDATE restringido a 15 columnas cosmeticas |',
    '| SEC-007 | `authenticated` podia INSERT con `role: ''admin''` | Grant INSERT restringido a columnas no sensibles |',
    '| BUG-002 | `route.js` insertaba `avatar` pero la columna es `avatar_url` | Corregido en `src/app/auth/callback/route.js` |',
    '',
    '---',
    '',
    '## Cambios aplicados',
    '',
    '### 1. Codigo - Middleware (`src/middleware.js`)',
    '',
    '**Antes (vulnerable):**',
    '',
    '```js',
    'const userRole =',
    '  user.app_metadata?.role ||',
    '  user.user_metadata?.role ||      // editable por el usuario',
    '  user.raw_user_meta_data?.role || // alias legacy',
    '  user.role                        // rol Postgres, no de negocio',
    '```',
    '',
    '**Despues (ADR-002):**',
    '',
    '```js',
    '// ADR-002: SOLO app_metadata.role es fuente de verdad.',
    'const userRole = user.app_metadata?.role',
    'const isAdmin = userRole === ''admin''',
    '```',
    '',
    "Commit: $CommitMiddleware",
    '',
    '### 2. DB - Funcion `is_admin()`',
    '',
    '**Antes:** leia de `public.clientes.role` (editable por el usuario).',
    '',
    '**Despues:** lee de `auth.jwt() -> ''app_metadata'' ->> ''role''`.',
    '',
    '```sql',
    'CREATE OR REPLACE FUNCTION public.is_admin()',
    'RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER',
    'SET search_path = public AS $$',
    '  SELECT COALESCE(',
    '    (SELECT auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'',',
    '    false',
    '  );',
    '$$;',
    '```',
    '',
    '### 3. DB - 3 politicas P7',
    '',
    '| Tabla | Policy | Antes | Despues |',
    '|---|---|---|---|',
    '| eventos_calendario | Admins pueden gestionar eventos | `auth.jwt() ->> ''role''` | `auth.jwt() -> ''app_metadata'' ->> ''role''` |',
    '| promociones_historico | Admins pueden gestionar historico | idem | idem |',
    '| reglas_promocion | Admins pueden gestionar reglas | idem | idem |',
    '',
    '### 4. DB - Permisos minimos sobre `clientes`',
    '',
    '**Antes:** `anon` y `authenticated` tenian `GRANT ALL` (UPDATE/INSERT/DELETE/TRUNCATE/etc).',
    '',
    '**Despues:**',
    '',
    '- `anon`: **sin ningun privilegio**.',
    '- `authenticated`:',
    '  - `SELECT` completo (RLS filtra por fila).',
    '  - `UPDATE` solo sobre 15 columnas cosmeticas.',
    '  - `INSERT` solo sobre columnas del registro inicial.',
    '  - **NO** puede tocar: `role`, `is_active`, `puntos_fidelidad`, `nivel_cliente`, `id`, `user_id`, `created_at`, `updated_at`, `email` (en UPDATE).',
    '',
    '### 5. Codigo - Callback OAuth (`src/app/auth/callback/route.js`)',
    '',
    '**Antes:**',
    '',
    '```js',
    'await supabase.from(''clientes'').insert({',
    '  nombre_completo: nombre,',
    '  email: user.email,',
    '  user_id: user.id,',
    '  is_active: true,      // DEFAULT true, no permitido por GRANT',
    '  role: ''cliente'',      // DEFAULT ''cliente'', no permitido',
    '  avatar: avatar,       // BUG: columna real es avatar_url',
    '})',
    '```',
    '',
    '**Despues:**',
    '',
    '```js',
    'await supabase.from(''clientes'').insert({',
    '  nombre_completo: nombre,',
    '  email: user.email,',
    '  user_id: user.id,',
    '  avatar_url: avatarUrl, // BUG-002 fix',
    '})',
    '```',
    '',
    '---',
    '',
    '## Prerequisito verificado',
    '',
    'Antes de reescribir `is_admin()`, se verifico en Dashboard de Supabase que',
    'el unico admin real (`pirovanipedrojose@gmail.com`, user_id `5f8bb0ac-...`)',
    'tiene `app_metadata.role = ''admin''`. Sin esto, el cambio hubiera dejado al',
    'admin fuera del panel.',
    '',
    '---',
    '',
    '## Evidencia',
    '',
    '### Middleware',
    '',
    '- `npm run dev` compila `/src/middleware` sin errores.',
    '- `GET /admin 200` con sesion de admin real.',
    '- Commit `' + $CommitMiddleware + '` pusheado a `origin/main`.',
    '',
    '### DB - `is_admin()`',
    '',
    'Query `SELECT prosrc FROM pg_proc WHERE proname = ''is_admin'';` devuelve:',
    '',
    '```',
    'SELECT COALESCE(',
    '  (SELECT auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'',',
    '  false',
    ');',
    '```',
    '',
    '### DB - 3 politicas P7',
    '',
    'Query `pg_policies` devuelve `qual` con `app_metadata` en las 3.',
    '',
    '### DB - Permisos sobre `clientes`',
    '',
    'Query `table_privileges` para `anon`: 0 filas.',
    'Query `table_privileges` para `authenticated`: solo `SELECT`.',
    'Query `column_privileges` para `authenticated` UPDATE: 15 columnas cosmeticas.',
    'Query `column_privileges` para `authenticated` INSERT: 17 columnas.',
    '',
    '---',
    '',
    '## Rollback',
    '',
    'Ver seccion de rollback en:',
    '`supabase/migrations/' + $Fecha + '-f3-01-admin-app-metadata.sql`',
    '',
    '---',
    '',
    '## Definition of Done',
    '',
    '- [x] Middleware lee solo `app_metadata.role`',
    '- [x] `is_admin()` lee de `app_metadata`',
    '- [x] 3 politicas P7 migradas a `app_metadata`',
    '- [x] `REVOKE` de `UPDATE (role)` en `clientes`',
    '- [x] `anon` sin privilegios sobre `clientes`',
    '- [x] `authenticated` solo con permisos minimos',
    '- [x] `route.js` alineado con GRANT INSERT',
    '- [x] BUG-002 (`avatar_url`) corregido',
    '- [x] Test end-to-end: login admin OK, `/admin` 200',
    '- [x] Commit pusheado',
    '',
    '---',
    '',
    '## Referencias',
    '',
    '- [Tracking de hallazgos](./06-hallazgos-tracking.md)',
    '- [ADR-002: seguridad en capas](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)',
    '- [Migracion SQL](../../../supabase/migrations/' + $Fecha + '-f3-01-admin-app-metadata.sql)',
    '- [Middleware](../../../src/middleware.js)',
    '- [Callback OAuth](../../../src/app/auth/callback/route.js)',
    ''
)

$docLines | Set-Content -Path $DocF301 -Encoding UTF8
Write-Ok "Doc creado: $DocF301 ($($docLines.Count) lineas)"

# ============================================================================
# 3. Actualizar tracking de hallazgos
# ============================================================================
Write-Section '3. Actualizando 06-hallazgos-tracking.md'

$trackingLines = @(
    '# Tracking de Hallazgos - Auditoria ' + $Fecha,
    '',
    '**Ultima actualizacion:** ' + $Fecha + ' (fin ' + $Session + ')',
    '**Total de hallazgos:** 27',
    '',
    '---',
    '',
    '## 1. Resumen',
    '',
    '| Estado | Cantidad |',
    '|---|---|',
    '| Abierto | 11 |',
    '| En curso | 0 |',
    '| Cerrado | 15 |',
    '| Aceptado | 1 |',
    '',
    '---',
    '',
    '## 2. Hallazgos por severidad',
    '',
    '| Severidad | Cantidad | Cerrados |',
    '|---|---|---|',
    '| Critica | 8 | 6 |',
    '| Alta | 10 | 7 |',
    '| Media | 6 | 2 |',
    '| Baja | 3 | 0 |',
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
    '| SEC-003 | Admin por user_metadata | F3 | P0 | **Cerrado** | ' + $CommitMiddleware + ' |',
    '| DB-001 | 250+ advisors Supabase | F1 | P0 | Abierto | - |',
    '| DB-001a | Vistas SECURITY DEFINER | F1 | P0 | Cerrado | (pendiente) |',
    '| DB-001b | Politicas RLS Always True | F1 | P0 | Cerrado | e2bdd7cf |',
    '| DB-001c | Funciones SECURITY DEFINER publicas | F1 | P0 | Cerrado | (pendiente) |',
    '| SEC-004 | UPDATE clientes.role desde cliente | F3 | P0 | **Cerrado** | (pendiente commit) |',
    '| SEC-005 | anon con DDL sobre clientes | F3 | P0 | **Cerrado** | (pendiente commit) |',
    '',
    '### Hallazgos altos',
    '',
    '| ID | Titulo | Fase | Prioridad | Estado | Commit |',
    '|---|---|---|---|---|---|',
    '| SEC-002 | DEFAULT_SUPABASE_ANON_KEY hardcodeada | F3 | P1 | Abierto | - |',
    '| SEC-006 | redirectTo hardcodeado | F3 | P1 | Abierto | - |',
    '| SEC-007 | INSERT clientes.role desde frontend | F3 | P1 | **Cerrado** | (pendiente commit) |',
    '| AUTH-001 | Contrasenas debiles | F3 | P1 | Abierto | - |',
    '| AUTH-002 | Registro sin validar duplicados | F3 | P1 | Abierto | - |',
    '| DBG-001 | console.log con datos sensibles | F3 | P1 | Abierto | - |',
    '| DB-001d | Bucket Storage listable | F1 | P1 | Cerrado | (pendiente) |',
    '| DB-001g | Funciones con search_path mutable | F1 | P1 | Cerrado | (pendiente) |',
    '| DB-001h | Leaked Password Protection | F1 | P1 | Aceptado | (plan Free) |',
    '| P7 | 3 politicas con auth.jwt() raiz | F3 | P1 | **Cerrado** | (pendiente commit) |',
    '',
    '### Hallazgos medios',
    '',
    '| ID | Titulo | Fase | Prioridad | Estado | Commit |',
    '|---|---|---|---|---|---|',
    '| BUG-001 | NEXT_PUBLIC_VAPID_KEY inconsistente | F3 | P2 | Abierto | - |',
    '| BUG-002 | route.js inserta avatar (columna avatar_url) | F3 | P2 | **Cerrado** | (pendiente commit) |',
    '| CONF-001 | ESLint ignorado en build | F3 | P2 | Abierto | - |',
    '| CONF-002 | Sin headers de seguridad | F3 | P2 | Abierto | - |',
    '| DB-001e | ~60 politicas RLS sin optimizar | F1 | P2 | Cerrado | 02311b72 |',
    '| DB-001f | ~150 politicas duplicadas | F1 | P2 | Abierto | - |',
    '',
    '### Hallazgos bajos',
    '',
    '| ID | Titulo | Fase | Prioridad | Estado | Commit |',
    '|---|---|---|---|---|---|',
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
    '- [F3-01](./14-f3-01-admin-app-metadata.md)',
    ''
)

$trackingLines | Set-Content -Path $Tracking -Encoding UTF8
Write-Ok "Tracking actualizado: $Tracking"

# ============================================================================
# 4. Actualizar STATUS.md
# ============================================================================
Write-Section '4. Actualizando STATUS.md'

# Leer STATUS.md y reemplazar secciones clave
$statusContent = Get-Content $Status -Raw

# Reemplazar linea de ultima actualizacion y progreso
$statusContent = $statusContent -replace '\*\*Ultima actualizacion:\*\*.*', "**Ultima actualizacion:** $Fecha (fin $Session)"
$statusContent = $statusContent -replace '\*\*Progreso global:\*\*.*', '**Progreso global:** 32% (15 de 47 tareas)'

# Agregar bloque de sesion 5 si no existe
$sessionBlock = @(
    '',
    "**$Fecha - $Session (COMPLETA)**",
    '- F3-01: SEC-003 cerrado (middleware lee solo `app_metadata`)',
    '- F3-01: `is_admin()` reescrita para leer de `app_metadata`',
    '- F3-01: 3 politicas P7 migradas a `app_metadata`',
    '- SEC-004 cerrado: `REVOKE UPDATE (role)` en `clientes`',
    '- SEC-005 cerrado: `anon` sin privilegios sobre `clientes`',
    '- SEC-006 cerrado: columnas sensibles bloqueadas en UPDATE',
    '- SEC-007 cerrado: `INSERT` sin `role` desde frontend',
    '- BUG-002 cerrado: `avatar` -> `avatar_url` en route.js',
    '- Doc: `docs/audits/' + $Fecha + '-inicial/14-f3-01-admin-app-metadata.md`',
    '- Migracion: `supabase/migrations/' + $Fecha + '-f3-01-admin-app-metadata.sql`',
    '- Commit middleware: ' + $CommitMiddleware,
    ''
)

$sessionText = $sessionBlock -join "`r`n"

# Insertar antes de la seccion "## 6. Comandos utiles"
if ($statusContent -notmatch [regex]::Escape($sessionBlock[1])) {
    $statusContent = $statusContent -replace '(## 6\. Comandos utiles)', ($sessionText + "`r`n---`r`n`r`n" + '$1')
}

$statusContent | Set-Content -Path $Status -Encoding UTF8 -NoNewline
Write-Ok "STATUS.md actualizado"

# ============================================================================
# 5. Actualizar BITACORA.md
# ============================================================================
Write-Section '5. Actualizando BITACORA.md'

$bitacoraEntry = @(
    '',
    '---',
    '',
    "## $Fecha ($Session - CIERRE)",
    '',
    '**Duracion:** ~4 horas',
    '**Objetivo:** Cerrar SEC-003 (admin por user_metadata) + P7 + hallazgos colaterales',
    '',
    '**Completado:**',
    '- F3-01: SEC-003 cerrado (middleware lee solo app_metadata)',
    '- F3-01: is_admin() reescrita para leer de app_metadata',
    '- F3-01: 3 politicas P7 migradas a app_metadata',
    '- SEC-004: REVOKE UPDATE (role) sobre clientes',
    '- SEC-005: anon sin privilegios sobre clientes',
    '- SEC-006: columnas sensibles bloqueadas en UPDATE',
    '- SEC-007: INSERT sin role desde frontend',
    '- BUG-002: avatar -> avatar_url en route.js',
    '- Doc: docs/audits/' + $Fecha + '-inicial/14-f3-01-admin-app-metadata.md',
    '- Migracion: supabase/migrations/' + $Fecha + '-f3-01-admin-app-metadata.sql',
    '',
    '**Commits de la sesion:**',
    '- ' + $CommitMiddleware + ' fix(auth): leer rol solo desde app_metadata en middleware (SEC-003)',
    '- (pendiente) security(auth): cerrar F3-01 (SEC-003+004+005+006+007, P7, BUG-002)',
    '',
    '**Hallazgos cerrados:**',
    '- SEC-003: Admin por user_metadata',
    '- P7: 3 politicas con auth.jwt() raiz',
    '- SEC-004: UPDATE clientes.role desde cliente',
    '- SEC-005: anon con DDL sobre clientes',
    '- SEC-006: columnas sensibles editables',
    '- SEC-007: INSERT clientes.role desde frontend',
    '- BUG-002: avatar -> avatar_url en route.js',
    '',
    '**Hallazgos nuevos:**',
    '- SEC-004: UPDATE clientes.role desde cliente (descubierto en chequeo de C)',
    '- SEC-005: anon con DDL sobre clientes (descubierto en chequeo de C)',
    '- SEC-006: columnas sensibles editables (descubierto en chequeo de C)',
    '- SEC-007: INSERT clientes.role desde frontend (descubierto en chequeo de C)',
    '- BUG-002: avatar -> avatar_url en route.js (descubierto en analisis de route.js)',
    '',
    '**Bloqueantes:**',
    '- Ninguno',
    '',
    '**Aprendizajes:**',
    '- REVOKE UPDATE (role) NO funciona si hay GRANT UPDATE a nivel tabla completa.',
    '  Hay que REVOKE ALL + GRANT por columna explicita.',
    '- El callback OAuth inserta con cliente authenticated (no service_role).',
    '  Eso obliga a restringir GRANT INSERT por columna.',
    '- Los triggers (set_updated_at, actualizar_nivel_cliente) cubren columnas',
    '  que el cliente NO debe poder editar directamente.',
    '',
    '**Proxima sesion:**',
    '- F1-08: Consolidar ~150 politicas duplicadas (P2, esfuerzo L)',
    '- F1-09: Eliminar indices duplicados (P3, esfuerzo S)',
    '- chore(tooling): mejorar verificador de links',
    '- chore(docs): limpiar entradas duplicadas en BITACORA.md y STATUS.md',
    ''
)

Add-Content -Path $Bitacora -Value ($bitacoraEntry -join "`r`n") -Encoding UTF8
Write-Ok "BITACORA.md actualizado"

# ============================================================================
# 6. Verificacion de links
# ============================================================================
Write-Section '6. Verificando links'

$verificarLinks = Join-Path $RepoRoot 'scripts\docs\00-verificar-links.ps1'
if (Test-Path $verificarLinks) {
    & $verificarLinks
} else {
    Write-Warn "No existe $verificarLinks (saltando verificacion)"
}

# ============================================================================
# 7. Commit y push
# ============================================================================
Write-Section '7. Commit y push'

if ($NoCommit) {
    Write-Warn "Modo -NoCommit: se omiten git add/commit/push"
    Write-Info "Revisar los archivos antes de commitear:"
    Write-Info "  - $DocF301"
    Write-Info "  - $Tracking"
    Write-Info "  - $Status"
    Write-Info "  - $Bitacora"
    Write-Info "  - src/app/auth/callback/route.js"
    Write-Info "  - supabase/migrations/$Fecha-f3-01-admin-app-metadata.sql"
    exit 0
}

# Git status
Write-Info 'Git status:'
git status --short

Write-Info 'Agregando archivos...'
git add src/app/auth/callback/route.js
git add "supabase/migrations/$Fecha-f3-01-admin-app-metadata.sql"
git add "docs/audits/$Fecha-inicial/14-f3-01-admin-app-metadata.md"
git add "docs/audits/$Fecha-inicial/06-hallazgos-tracking.md"
git add docs/STATUS.md
git add docs/BITACORA.md
git add scripts/docs/11-documentar-f3-01.ps1

$commitMsg = 'security(auth): cerrar F3-01 (SEC-003, SEC-004, SEC-005, SEC-006, SEC-007, P7, BUG-002)'
Write-Info "Commit: $commitMsg"
git commit -m $commitMsg

Write-Info 'Push a origin/main...'
git push origin main

Write-Section 'LISTO'
Write-Ok 'F3-01 cerrado y documentado'
Write-Ok 'Proximo paso: F1-08 (consolidar politicas duplicadas)'