# Bitacora de Sesiones - PanFree System

Registro cronologico de todas las sesiones de trabajo sobre el proyecto.
Cada sesion agrega una entrada al final.

---

## Plantilla para nuevas entradas

    ## YYYY-MM-DD (sesion N)

    **Duracion:** X horas
    **Objetivo:** descripcion breve

    **Completado:**
    - Item 1
    - Item 2

    **Hallazgos nuevos:**
    - ID: descripcion

    **Bloqueantes:**
    - Ninguno / descripcion

    **Proxima sesion:**
    - Tarea 1
    - Tarea 2

---

## 2026-10-13 (Sesion 1)

**Duracion:** ~6 horas
**Objetivo:** Preparar base documental, plan de trabajo y estructura del repositorio

**Completado:**
- Clonado del repositorio desde GitHub (PanFree-Tech/panfree-system)
- Auditoria inicial del codigo fuente (middleware, libs, hooks, componentes)
- Descubrimiento de SEC-001: .env filtrados en historial de Git
- Descubrimiento de DB-001: 250+ advisors de Supabase
- Reorganizacion completa de la documentacion en estructura docs/
- Creacion de 6 documentos del Plan de Trabajo
- Configuracion de .github/ (workflows CI + templates)
- Simplificacion de .env.example con convencion de cuentas [S]/[C]
- 7 commits pusheados a main

**Commits:**
- 810f6daf docs(env): simplificar .env.example
- 624e06db docs(repo): reorganizar documentacion en estructura docs/
- e34233c4 docs(repo): agregar documentacion base
- 75093e6b chore(ci): agregar templates y workflows de GitHub
- 47982c1e docs(plan): agregar plan de trabajo, politica CI/CD, riesgos, roadmap y DoD
- bf3e8466 chore(scripts): agregar script para regenerar documentacion del Plan

**Hallazgos nuevos:**
- SEC-001: Archivos .env en historial de Git (Critica)
- SEC-002: DEFAULT_SUPABASE_ANON_KEY hardcodeada (Alta)
- SEC-003: Admin por user_metadata (Critica)
- SEC-006: redirectTo hardcodeado (Alta)
- DB-001: 250+ advisors de Supabase (Critica)
- AUTH-001: Contrasenas debiles (Alta)
- AUTH-002: Registro sin validar duplicados (Alta)
- DBG-001: console.log con datos sensibles (Alta)
- CONF-001: ESLint ignorado en build (Media)
- CONF-002: Sin headers de seguridad (Media)
- BUG-001: NEXT_PUBLIC_VAPID_KEY inconsistente (Media)

**Bloqueantes:**
- Supabase con problemas tecnicos al inicio (resuelto)

**Proxima sesion:**
- F1-01: Fix 3 vistas SECURITY DEFINER
- F1-02: Fix politicas RLS Always True
- F1-03: Restringir funciones SECURITY DEFINER



## Notas

- Cada sesion agrega una entrada al final del documento.
- No se editan entradas anteriores (solo se agregan nuevas).
- Si una sesion no tuvo avances, se registra igual.
- Los commits se referencian con hash corto.
## 2026-10-13 (Sesion 1 - CIERRE)

**Duracion total:** ~8 horas
**Objetivo:** Preparar base documental, plan de trabajo y sistema de seguimiento

**Completado:**
- Clonado del repositorio desde GitHub
- Auditoria inicial del codigo fuente
- Descubrimiento de SEC-001 (env en historial) y DB-001 (250+ advisors)
- Reorganizacion completa de la documentacion en estructura docs/
- Creacion de 6 documentos del Plan de Trabajo
- Creacion de 3 documentos de seguimiento (STATUS, BITACORA, tracking)
- Creacion de 3 documentos del Sistema de Trabajo
- Configuracion de .github/ (workflows CI + templates)
- Simplificacion de .env.example
- 8 commits pusheados a main

**Commits de la sesion:**
- 810f6daf docs(env): simplificar .env.example
- 624e06db docs(repo): reorganizar documentacion en estructura docs/
- e34233c4 docs(repo): agregar documentacion base
- 75093e6b chore(ci): agregar templates y workflows de GitHub
- 47982c1e docs(plan): agregar plan de trabajo, politica CI/CD, riesgos, roadmap y DoD
- bf3e8466 chore(scripts): agregar script para regenerar documentacion del Plan
- cafcb4ea docs(tracking): agregar STATUS, BITACORA y tracking de hallazgos
- (nuevo commit) docs(ops): agregar sistema de trabajo, workflow diario y guia rapida

**Hallazgos nuevos:** (ver 06-hallazgos-tracking.md)

**Bloqueantes:** Ninguno.

**Pendientes para proxima sesion:**
- Ejecutar script 02-crear-adrs.ps1 (crear 3 ADRs)
- Ejecutar script 03-crear-referencias.ps1 (comandos utiles + evidencias README)
- Crear orquestar-docs.ps1
- Arrancar Fase 1: F1-01 fix vistas SECURITY DEFINER

**Documentacion creada esta sesion:** 12 archivos .md nuevos

---

---

## 2026-10-13 (Sesion 2 - CIERRE)

**Duracion:** ~6 horas
**Objetivo:** Cerrar los 3 hallazgos P0 criticos de seguridad de la DB

**Completado:**
- F1-01: Fix 3 vistas SECURITY DEFINER -> SECURITY INVOKER
- F1-02: Fix 4 politicas RLS Always True (canjes_premios, pedidos, detalle_pedido)
- F1-03: Restringir 4 funciones SECURITY DEFINER (REVOKE EXECUTE)
- F1-04: Fijar search_path en 3 funciones
- F1-05: Restringir listado del bucket storage.productos
- Reorganizacion de docs/ (sin numeros, sin anidamiento excesivo)
- Creacion de 3 ADRs (arquitectura) en docs/architecture/decisiones/
- Creacion de estructura supabase/schemas/ declarativa
- Guardado de schema + politicas en Bitwarden (backup estructural)
- Instalacion de Docker Desktop + Supabase CLI (para futuro)
- Verificador de links (00-verificar-links.ps1)

**Commits de la sesion:**
- 885486d3 chore(scripts): agregar verificador de links y corregir STATUS
- 7d46e572 docs(structure): renombrar carpetas a estructura sin numeros
- 8c5b311a security(db): fix SECURITY DEFINER en 3 vistas de costos
- e2bdd7cf docs(db): agregar schema declarativo de tablas criticas (F1-02)
- fea87bb2 security(db): fix 4 politicas RLS Always True
- 542e3a2e security(db): restringir 4 funciones SECURITY DEFINER
- 3e500e77 security(db): fijar search_path en 3 funciones
- 326d4edd security(storage): restringir listado del bucket productos

**Hallazgos cerrados:**
- DB-001a: Vistas SECURITY DEFINER
- DB-001b: Politicas RLS Always True
- DB-001c: Funciones SECURITY DEFINER publicas
- DB-001d: Bucket Storage listable
- DB-001g: Funciones con search_path mutable

**Hallazgos nuevos:**
- Ninguno

**Bloqueantes:**
- Ninguno

**Aprendizajes:**
- Docker Desktop + Supabase CLI no cooperan con conexiones IPv6. Usar Session Pooler.
- Los here-strings de PowerShell se cortan con bloques Markdown grandes. Usar arrays.
- El verificador de links es fundamental cuando se reestructura docs/.

**Proxima sesion:**
- F1-06: Habilitar Leaked Password Protection en Supabase Auth (P1, 15 min)
- F1-07: Optimizar ~60 politicas RLS con InitPlan (P2, esfuerzo L)
- F1-08: Consolidar ~150 politicas duplicadas (P2, esfuerzo L)
- Commit pendiente del .gitignore (backups bloqueados)

---
---

## 2026-10-13 (Sesion 3 - CIERRE)

**Duracion:** ~4 horas
**Objetivo:** Ejecutar F1-07 (Optimizar 79 politicas RLS con InitPlan)

**Completado:**
- F1-07: 79 politicas RLS optimizadas con InitPlan
- Aplicado en 4 bloques por patron + 1 fix puntual
- Verificacion: 0 DIRECTAS en pg_policies (antes: 79)
- 81 OPTIMIZADAS + 13 SIN_auth = 94 totales
- EXPLAIN ANALYZE antes/despues documentado (con limitaciones)
- SQL versionado en supabase/migrations/2026-10-13-f1-07-initplan.sql
- Doc de auditoria: docs/audits/2026-10-13-inicial/13-f1-07-rls-initplan.md
- Script de documentacion: scripts/docs/10-documentar-f1-07.ps1
- Lista de candidatas a F1-08 (consolidacion) documentada
- Hallazgo colateral P7 marcado para F3-01 (auth.jwt ->> role)

**Commits de la sesion:**
- 02311b72 security(db): optimizar 79 politicas RLS con InitPlan
- fd942db0 docs(tracking): actualizar hash de F1-07

**Hallazgos cerrados:**
- DB-001e: ~60 politicas RLS sin optimizar

**Hallazgos nuevos:**
- Ninguno

**Bloqueantes:**
- Ninguno

**Aprendizajes:**
- Postgres normaliza (SELECT is_admin()) como ( SELECT is_admin() AS is_admin).
- El verificador de links (00-verificar-links.ps1) da falsos positivos en bloques de codigo Markdown dentro de HANDOFF-*.md.
- El SQL Editor de Supabase envuelve el RUN en transaccion implicita: si un DROP/CREATE falla, todo se revierte.
- Aplicar el fix en 4 bloques chicos + verificacion por bloque es mas seguro que un solo SQL grande.

**Proxima sesion:**
- F1-08: Consolidar ~150 politicas duplicadas (P2, esfuerzo L)
- F1-09: Eliminar indices duplicados (P3, esfuerzo S)
- F3-01: SEC-003: admin por app_metadata (P0, esfuerzo S) - corregir tambien P7
- chore(tooling): mejorar verificador de links para ignorar bloques de codigo

---

---

## 2026-10-13 (Sesion 5 - CIERRE)

**Duracion:** ~4 horas
**Objetivo:** Cerrar SEC-003 (admin por user_metadata) + P7 + hallazgos colaterales

**Completado:**
- F3-01: SEC-003 cerrado (middleware lee solo app_metadata)
- F3-01: is_admin() reescrita para leer de app_metadata
- F3-01: 3 politicas P7 migradas a app_metadata
- SEC-004: REVOKE UPDATE (role) sobre clientes
- SEC-005: anon sin privilegios sobre clientes
- SEC-006: columnas sensibles bloqueadas en UPDATE
- SEC-007: INSERT sin role desde frontend
- BUG-002: avatar -> avatar_url en route.js
- Doc: docs/audits/
2026-10-13
-inicial/14-f3-01-admin-app-metadata.md
- Migracion: supabase/migrations/
2026-10-13
-f3-01-admin-app-metadata.sql

**Commits de la sesion:**
- 
e5bed103
 fix(auth): leer rol solo desde app_metadata en middleware (SEC-003)
- (pendiente) security(auth): cerrar F3-01 (SEC-003+004+005+006+007, P7, BUG-002)

**Hallazgos cerrados:**
- SEC-003: Admin por user_metadata
- P7: 3 politicas con auth.jwt() raiz
- SEC-004: UPDATE clientes.role desde cliente
- SEC-005: anon con DDL sobre clientes
- SEC-006: columnas sensibles editables
- SEC-007: INSERT clientes.role desde frontend
- BUG-002: avatar -> avatar_url en route.js

**Hallazgos nuevos:**
- SEC-004: UPDATE clientes.role desde cliente (descubierto en chequeo de C)
- SEC-005: anon con DDL sobre clientes (descubierto en chequeo de C)
- SEC-006: columnas sensibles editables (descubierto en chequeo de C)
- SEC-007: INSERT clientes.role desde frontend (descubierto en chequeo de C)
- BUG-002: avatar -> avatar_url en route.js (descubierto en analisis de route.js)

**Bloqueantes:**
- Ninguno

**Aprendizajes:**
- REVOKE UPDATE (role) NO funciona si hay GRANT UPDATE a nivel tabla completa.
  Hay que REVOKE ALL + GRANT por columna explicita.
- El callback OAuth inserta con cliente authenticated (no service_role).
  Eso obliga a restringir GRANT INSERT por columna.
- Los triggers (set_updated_at, actualizar_nivel_cliente) cubren columnas
  que el cliente NO debe poder editar directamente.

**Proxima sesion:**
- F1-08: Consolidar ~150 politicas duplicadas (P2, esfuerzo L)
- F1-09: Eliminar indices duplicados (P3, esfuerzo S)
- chore(tooling): mejorar verificador de links
- chore(docs): limpiar entradas duplicadas en BITACORA.md y STATUS.md


---

## 2026-10-13 (Sesion 6 - CIERRE)

**Duracion:** ~3 horas
**Objetivo:** Ejecutar F1-08 (consolidar ~150 politicas RLS duplicadas)

**Completado:**
- F1-08: 20 politicas RLS consolidadas/eliminadas en 4 bloques
- Bloque 1: 5 duplicados exactos admin ALL (pedidos, detalle_pedido, productos, insumos)
- Bloque 2: 9 duplicados semanticos is_admin() vs auth.jwt()
- Bloque 3a: 3 subsets redundantes SELECT (pedidos, detalle_pedido)
- Bloque 3b: 1 leak de informacion (productos.select_publico_productos)
- Bloque 4: 2 redundantes en notificaciones_admin
- Inventario completo de pg_policies antes/despues (83 -> 63)
- Auditoria de codigo para validar impacto (todos los paths publicos filtran is_active)
- Doc de auditoria: docs/audits/2026-10-13-inicial/15-f1-08-consolidacion-rls.md
- Migracion SQL: supabase/migrations/2026-10-13-f1-08-consolidar-rls.sql

**Commits de la sesion:**
- e40d9244 security(db): consolidar politicas RLS duplicadas (F1-08)

**Hallazgos cerrados:**
- DB-001f: ~150 politicas RLS duplicadas
- SEC-010: select_publico_productos exponia productos inactivos

**Hallazgos nuevos:**
- SEC-011: email_logs.Authenticated users can read email_logs con qual=true (Alta)
- SEC-012: canjes_premios.Admin puede ver todos los canjes usa clientes.role (Media)
- BUG-003: diptico/[codigo] usa .eq('activo') en vez de is_active (Baja)

**Bloqueantes:**
- Ninguno

**Aprendizajes:**
- Postgres combina politicas permisivas con OR: la mas amplia gana.
  Una politica con qual=true puede anular politicas restrictivas vecinas.
- El advisor de Supabase sobreestima duplicados: cuenta permisivas sobre
  roles={public}, no duplicados reales.
- is_admin() y auth.jwt()->app_metadata->>'role' son equivalentes post-F3-01.
- Auditar el codigo antes de eliminar politicas permisivas es obligatorio.

**Proxima sesion:**
- F1-09: Eliminar indices duplicados (P3, esfuerzo S)
- F3-02: SEC-002 quitar claves hardcodeadas (P1)
- chore(docs): limpiar entradas duplicadas en BITACORA.md y STATUS.md
- SEC-011: analizar email_logs SELECT true para authenticated


---
---

## 2026-10-13 (Sesion 7 - COMPLETA)

**Duracion:** ~1.5 horas
**Objetivo:** Ejecutar F1-09 (eliminar indices duplicados)

**Completado:**
- F1-09: 9 indices duplicados eliminados en 2 grupos
- Grupo A: 7 indices idx_* redundantes respecto a UNIQUE hermano
  (clientes, codigos_dipticos, compras, cupones_descuento, pedidos,
  produccion, productos)
- Grupo B: 2 indices no-UNIQUE duplicados en notificaciones_admin
  (idx_notificaciones_created, idx_notificaciones_leida)
- Verificacion 1: 0 constraints respaldadas por los indices a dropear
- Verificacion 2: 7 UNIQUE hermanos confirmados
- Verificacion 2b: 2 pares no-UNIQUE confirmados
- Casi-duplicados documentados para futuras sesiones (recetas,
  push_subscriptions)
- Doc de auditoria: docs/audits/2026-10-13-inicial/16-f1-09-indices-duplicados.md
- Migracion SQL: supabase/migrations/2026-10-13-f1-09-indices-duplicados.sql

**Commits de la sesion:**
- d6957a61 chore(db): eliminar indices duplicados (F1-09)

**Hallazgos cerrados:**
- DB-001i: Indices duplicados

**Hallazgos nuevos:**
- Ninguno

**Bloqueantes:**
- Ninguno

**Aprendizajes:**
- Al dropear un indice idx_* que tiene un UNIQUE hermano con la misma
  firma, siempre dropear el no-UNIQUE. El UNIQUE cubre igualdad y
  ademas aporta la constraint.
- Cuando hay dos no-UNIQUE con la misma firma, conservar el que sigue
  la convencion idx_<tabla_completa>_<columna>.
- DROP INDEX CONCURRENTLY no puede correr en el SQL Editor de Supabase
  (transaccion implicita). Para tablas chicas, DROP INDEX simple es
  seguro y no requiere fragmentar.
- Verificar con pg_constraint ANTES del DROP evita el error
  "cannot drop index because constraint requires it".

**Proxima sesion:**
- SEC-011: analizar email_logs SELECT true para authenticated (P1)
- F3-02: SEC-002 quitar claves hardcodeadas (P1)
- chore(docs): limpiar BITACORA.md y STATUS.md

---

---

## 2026-10-14 (Sesion 8 - COMPLETA)

**Duracion:** ~2 horas
**Objetivo:** Cerrar SEC-011 (email_logs SELECT qual=true) + SEC-013 + BUG-004

**Completado:**
- SEC-011 cerrado: DROP policy "Authenticated users can read email_logs"
  (qual=true) sobre email_logs. Cualquier cliente B2C podia leer PII
  (to_email, body_html, metadata).
- SEC-013 cerrado: DROP policy "Authenticated users can insert email_logs".
  Cualquier authenticated podia insertar filas en email_logs.
- BUG-004 cerrado: test-email/route.js y resend-webhook/route.js usaban
  el cliente generico de @/lib/supabase (sin privilegios). Refactorizados
  para usar createClient con SERVICE_ROLE_KEY (supabaseAdmin).
- send-email/route.js ya usaba SERVICE_ROLE_KEY (no requirio cambio).
- Doc de auditoria: docs/audits/2026-10-13-inicial/17-f1-10-sec-011-email-logs.md
- Migracion SQL: supabase/migrations/2026-10-14-f1-10-sec-011-email-logs.sql
- Script: scripts/docs/17-documentar-sec-011.ps1

**Commits de la sesion:**
- 5ded4ff6 security(db): restringir acceso a email_logs (SEC-011, SEC-013, BUG-004)

**Hallazgos cerrados:**
- SEC-011: email_logs SELECT true para authenticated
- SEC-013: email_logs INSERT permisiva para authenticated (nuevo en S8)
- BUG-004: test-email y resend-webhook usaban cliente sin privilegios (nuevo en S8)

**Hallazgos nuevos:**
- SEC-013: email_logs INSERT permisiva para authenticated (descubierto en S8)
- BUG-004: test-email y resend-webhook usaban cliente sin privilegios (descubierto en S8)

**Bloqueantes:**
- Ninguno

**Aprendizajes:**
- Postgres combina politicas PERMISSIVE con OR: la mas amplia gana.
  Una politica SELECT con qual=true anula restricciones vecinas.
- service_role bypasea RLS. Los endpoints del servidor que escriben en
  tablas con RLS restrictiva deben usar createClient(url, SERVICE_ROLE_KEY),
  no el cliente generico (que lleva ANON_KEY o JWT de usuario).
- Los imports genericos de un cliente Supabase pueden ocultar dependencias
  de politicas permisivas. Auditar grep de 'from @/lib/supabase' antes de
  restringir RLS.
- Politicas con roles={public} aplican a anon Y authenticated. Especificar
  el rol explicito (TO authenticated) evita sorpresas.

**Proxima sesion:**
- SEC-012: canjes_premios usa clientes.role en vez de is_admin() (P2)
- F3-02: SEC-002 quitar claves hardcodeadas (P1)
- chore(docs): limpiar entradas duplicadas en BITACORA.md y STATUS.md

---

## 2026-10-14 (Sesion 9 - COMPLETA)

**Duracion:** ~1 hora
**Objetivo:** Cerrar SEC-012 (canjes_premios usa clientes.role en vez de is_admin())

**Completado:**
- SEC-012 cerrado: DROP policy "Admin puede ver todos los canjes" + CREATE con
  is_admin() y rol {authenticated}. Alinea canjes_premios con ADR-002.
- Auditoria de codigo: 0 referencias a is_admin() en src/, 3 referencias a
  canjes_premios (todas path B2C, sin impacto).
- Doc de auditoria: docs/audits/2026-10-13-inicial/18-f1-11-sec-012-canjes-premios.md
- Migracion SQL: supabase/migrations/2026-10-14-f1-11-sec-012-canjes-premios.sql
- Script: scripts/docs/18-documentar-sec-012.ps1
- Fase 1 queda al 100% (9/9, con F1-06 aceptada por plan Free).

**Commits de la sesion:**
- ca21e7cc security(db): alinear canjes_premios con ADR-002 (SEC-012, F1-11)

**Hallazgos cerrados:**
- SEC-012: canjes_premios usa clientes.role en vez de is_admin()

**Hallazgos nuevos:**
- Ninguno

**Bloqueantes:**
- Ninguno

**Aprendizajes:**
- La normalizacion de Postgres es util para verificar el estado real de
  una politica: (SELECT is_admin()) -> ( SELECT is_admin() AS is_admin).
- Comparar el output textual ANTES y DESPUES es mas confiable que asumir
  que el CREATE POLICY quedo bien porque el SQL Editor devolvio "Success".
- Un fix de consistencia (no vulnerabilidad) se documenta igual que uno de
  seguridad: PRE, POST, DoD, referencias. La trazabilidad no negocia.

**Proxima sesion:**
- F3-02: SEC-002 quitar claves hardcodeadas (P1)
- chore(docs): limpiar entradas duplicadas en BITACORA.md y STATUS.md
- F3-04: AUTH-001 contrasenas debiles (P1)

---

## 2026-10-14 (Sesion 10 - COMPLETA)

**Duracion:** ~2 horas
**Objetivo:** Cerrar SEC-002 (quitar claves hardcodeadas de src/lib/supabase.js)

**Completado:**
- SEC-002 cerrado: eliminadas las constantes DEFAULT_SUPABASE_URL y
  DEFAULT_SUPABASE_ANON_KEY hardcodeadas en src/lib/supabase.js.
- sanitizeSupabaseUrl() y sanitizeSupabaseKey() ahora fail-fast con
  throw new Error() en lugar de fallback silencioso a valor hardcodeado.
- Eliminado el console.warn residual de "valores por defecto".
- 7 consumidores actualizados: import limpio + IIFE throw en el fallback.
- 8 archivos src/ modificados (1 central + 7 consumidores).
- Doc de auditoria: docs/audits/2026-10-13-inicial/19-f3-02-sec-002-anon-key.md
- Scripts: scripts/docs/20a-fix-f3-02-src.ps1 + 20b-documentar-f3-02.ps1
- 4 hallazgos nuevos registrados: SEC-014..017 (P3, chores futuros).
- Fase 3 al 22% (2/9, F3-01 + F3-02 cerradas).

**Commits de la sesion:**
- 4a17c7d5 security(src): eliminar claves hardcodeadas en src/lib/supabase.js (SEC-002, F3-02)
- 9f427ef6 chore(scripts): agregar script 20b-documentar-f3-02

**Hallazgos cerrados:**
- SEC-002: DEFAULT_SUPABASE_ANON_KEY hardcodeada en src/lib/supabase.js

**Hallazgos nuevos:**
- SEC-014: VAPID key hardcodeada en src/app/admin/page.js
- SEC-015: URL Supabase hardcodeada en notificar-estado/route.js y notificaciones.js
- SEC-016: Cloudinary cloud name hardcodeado en 4 lugares
- SEC-017: GA4 Measurement ID hardcodeado en ga4/measurement/route.js

**Bloqueantes:**
- Ninguno

**Aprendizajes:**
- ENCODING EN POWERSHELL 5.1: los .ps1 con caracteres no-ASCII (emojis,
  acentos) rompen si se guardan como UTF-8 sin BOM. PowerShell los lee
  como CP-1252. [char]0xXXXX NO sirve para emojis (rango astral >0xFFFF).
  Solucion: .ps1 en ASCII puro; archivos generados tambien ASCII puro
  cuando sea posible.
- VERIFICACION PREVIA: antes de hardcodear el "antes" en un -replace,
  verificar el estado real del archivo. En S10 el script 20b asumio que
  Fase 3 decia "1/9" pero el STATUS nunca se actualizo tras cerrar F3-01
  (S5). El replace no matcheo. Regla: usar regex flexible o verificar el
  estado real antes de escribir el script.
- UN COMMIT POR TAREA: el script 20b NO se incluye en el commit del fix.
  Va en un commit aparte (chore(scripts)). Mismo patron que S9 con el
  script 19.
- FIX CHICO Y VERIFICABLE: preferir fixes de 1-2 archivos a fixes que
  tocan 12. La tentacion de "aprovechar y limpiar todo" rompe la
  trazabilidad. Los hallazgos colaterales (SEC-014..017) quedaron
  registrados como nuevos, no metidos en el mismo fix.

**Proxima sesion:**
- F3-04: AUTH-001 contrasenas debiles (P1)
- chore(docs): limpiar entradas duplicadas en BITACORA.md y STATUS.md
- F3-05: AUTH-002 registro sin validar duplicados (P1)

---

## 2026-10-14 (Sesion 11 - COMPLETA)

**Duracion:** ~5 horas (Plan B + Plan A)
**Objetivo:** Chores de docs (Plan B) + F3-04 (AUTH-001, Plan A)

**Completado:**

### Plan B - Chores de docs (commit dc88917b)
- BITACORA.md: eliminados duplicados de Sesion 2 (3->1), Sesion 3 (2->1), Sesion 5 (2->1).
- BITACORA.md: hash de F1-08 corregido (e40d9244).
- STATUS.md: tabla Total corregida (19 OK / 40%).
- STATUS.md: seccion 5 reescrita con Sesiones 2-10.
- README.md: reescrito con estructura real (sin numeros).
- GUIA-RAPIDA.md + WORKFLOW-DIARIO.md: rutas viejas actualizadas, findstr -> Select-String.
- PLAN-DE-TRABAJO.md: F3-01, F3-02, F3-03 marcadas OK.
- DoD del doc 19 (F3-02): commit pusheado tildado.
- 21 archivos basura del working tree eliminados con git clean.

### Plan A - F3-04 / AUTH-001 (commits ccee0c88 + f1675f19 + e0168410)
- Modulo src/lib/validar-password.js creado.
  Reglas: minimo 10 chars + mayuscula + minuscula + numero + simbolo.
- src/app/register/page.js: import + validacion + minLength + placeholder.
- src/components/AuthModal.js: import + validacion en manejarRegistro + traducirError.
- src/app/perfil/page.js: import + validacion en cambiarPassword.
- 9 cambios funcionales + 1 modulo nuevo.
- 7 tests unitarios del modulo pasaron.
- Fix colateral: linea pegada en AuthModal.js separada.
- Doc de auditoria: docs/audits/2026-10-13-inicial/20-f3-04-auth-001-password.md.
- Fase 3: 2/9 -> 4/9 (44%).
- Hallazgos cerrados: 23/34 -> 24/34.

**Commits de la sesion:**
- dc88917b docs(chores): limpiar duplicados y actualizar rutas (B-01)
- ccee0c88 security(auth): validar fortaleza de password en registro y cambio (AUTH-001, F3-04)
- f1675f19 style(auth): separar linea pegada en AuthModal (F3-04)
- e0168410 docs(audit): documentar cierre F3-04 (AUTH-001)

**Hallazgos cerrados:**
- AUTH-001: Contrasenas debiles

**Hallazgos nuevos:**
- Ninguno

**Bloqueantes:**
- Ninguno

**Aprendizajes:**

### PowerShell y encoding
- Get-Content y [regex]::Matches en PowerShell 5.1 decodifican como
  CP-1252 por defecto. Los caracteres no-ASCII (n con virgulilla) se ven
  mal en la consola aunque los bytes del archivo esten correctos.
  Verificar con [System.IO.File]::ReadAllBytes, no con Get-Content.
- $txt.Contains() con strings no-ASCII en PS 5.1 puede dar falso
  negativo. No confiar en comparaciones de strings no-ASCII en PS 5.1.
- En PowerShell, el operador -replace NO acepta concatenacion con +.
  El segundo argumento debe ser un solo string. Construirlo antes con
  @() -join "`r`n".
- [regex]::Replace con lookahead NO preserva el salto de linea original.
  Incluir \r\n explicito en el replacement.
- Test-Path -LiteralPath falla con nombres que tienen ", {, } (caracteres
  no permitidos por Win32). Para borrar estos archivos, usar git clean.

### Dedupe de archivos
- Dedupe con indices de [regex]::Matches es fragil: al eliminar bloques,
  los indices se invalidan. Mejor: [regex]::Split con lookahead + -join.

### Scripts largos y copy/paste
- Los here-strings de mas de ~4000 caracteres se cortan al copiar/pegar.
  Usar arrays de strings con -join. Cada linea del array es independiente
  y el paste no se corta silenciosamente.
- Los scripts deben usar $PSScriptRoot o paths hardcodeados. NO pegar
  scripts en la consola directamente: $PSScriptRoot queda vacio.

### Estructura de modulos JS
- Un mismo proyecto puede usar alias (@/lib) en un archivo y path relativo
  (../../lib) en otro. Verificar antes de disenar el regex de import.
- Los modulos con exports ESM en proyectos Next.js pueden no tener
  "type": "module" en package.json. Node los parsea como ESM con un
  warning, pero funciona. No es bloqueante.

### Proceso
- Dry run salva vidas: el bug del path relativo en perfil/page.js se
  detecto ANTES de aplicar cambios en produccion.
- Idempotencia real: un script que inserta contenido en un archivo debe
  verificar que el contenido no exista ya. El 24a no lo hacia y duplico.
- Cuando se corren scripts que modifican archivos, verificar el output
  de git diff --stat antes de seguir. Es la senal mas clara de duplicacion.

**Proxima sesion:**
- Configurar Supabase Auth (Password strength, dashboard) - parte de F3-04.
- F3-05: AUTH-002 registro sin validar duplicados (P1).
- Chores opcionales: .gitattributes, versionar scripts de cierre.

---

## 2026-10-14 (Sesion 12 - COMPLETA)

**Duracion:** ~3 horas
**Objetivo:** Cerrar F3-05 (AUTH-002) + BUG-005 (nuevo hallazgo colateral)

**Completado:**
- F3-05 / AUTH-002 cerrado: upsert con onConflict email en los 3 puntos
  de insercion en public.clientes (register, AuthModal, callback OAuth).
- BUG-005 detectado y cerrado: AuthModal.js insertaba is_active y role
  sin GRANT post-F3-01. El flujo de registro desde el modal fallaba
  silenciosamente en produccion.
- Verificacion previa en Supabase: no hay UNIQUE en user_id, si en email.
  GRANTs de authenticated confirmados. Se usa onConflict email.
- Commits: 7b014cc4 (register + AuthModal + BUG-005) + f47b9417
  (callback OAuth). El segundo commit fue necesario porque el script
  25a no matcheo el bloque de callback/route.js.
- Doc de auditoria: docs/audits/2026-10-13-inicial/21-f3-05-auth-002-duplicados.md
- Fase 3: 4/9 -> 5/9 (56%).
- Hallazgos cerrados: 24/34 -> 26/34.

**Commits de la sesion:**
- 7b014cc4 security(auth): evitar duplicados en registro y alinear AuthModal
- f47b9417 fix(auth): completar F3-05 en callback OAuth (AUTH-002)
- 7bbc7331 docs(audit): documentar cierre F3-05 y BUG-005

**Hallazgos cerrados:**
- AUTH-002: Registro sin validar duplicados
- BUG-005: AuthModal inserta columnas sin GRANT post-F3-01

**Hallazgos nuevos:**
- BUG-005 (detectado durante el diagnostico, cerrado en el mismo fix)

**Bloqueantes:**
- Ninguno

**Aprendizajes:**

### PowerShell: here-strings y escapes (RECURRENTE)
- El script 25a uso here-strings con caracteres no-ASCII en los strings
  (emojis de check, flechas, acentos). Aunque el archivo .ps1 estaba
  en ASCII puro, los -replace no matchearon por dos razones:
  1. Los escapes \\uXXXX no se interpretan en PowerShell.
  2. Los \\" dentro de comillas simples rompen el parser.
- Solucion aplicada: reemplazar con .Replace() literal (no regex) sobre
  strings sin escapes ni caracteres especiales. Funciona a la primera.
- Leccion: para scripts que modifican codigo con comentarios no-ASCII,
  usar .Replace() literal con anclas ASCII puras, NO here-strings con
  escapes. Documentado en BITACORA S11, repetido en S12. Hay que
  aplicarlo desde el diseno, no como correccion.

### Idempotencia de scripts
- El script 25a detecto correctamente que register/page.js y AuthModal.js
  ya estaban modificados (idempotente). Solo fallo en callback/route.js.
- El .Replace() literal con .Contains() previo es el patron correcto
  para scripts de modificacion.

### Desambiguacion de scope en F3-05
- F3-05 no era solo "validar duplicados": los 3 puntos de insercion en
  clientes tenian logicas distintas. El fix los unifico.
- BUG-005 surgio del diagnostico previo (Paso 0 de queries). Detectar
  el bug ANTES de disenar el fix evito un fix incompleto.

### Deuda tecnica registrada
- Tracking seccion 2 "Hallazgos por severidad" esta desactualizada desde
  S7. No se toca en S12 porque requiere recalcular todos los hallazgos
  (hay filas con severidad inconsistente en la tabla: BUG-004 y BUG-005
  figuran en la seccion "bajos" pero son P2/Media).
- Pendiente para una sesion de auditoria de docs.

**Proxima sesion:**
- F3-06: DBG-001 quitar console.log con datos sensibles (P1).
- O bien: chores P3 (SEC-014..017) para desbloquear Fase 2.
- O bien: arrancar Fase 2 (F2-01 + F2-14).

## 2026-10-14 (Sesion 14 - PARCIAL, continua en S15)

**Duracion:** ~5 horas
**Objetivo:** Fase 2 (ENV) - Bitwarden + migraciones + incidente logger

**Completado:**
- Bloque 0: sinc docs S13 (commit fdcb6c70).
- Chore gitignore: .vercel/ fuera del repo + !.env.example (14ba0076 + a0cc5c8f).
- F2-01: Supabase Owner a system.panfree.
- F2-03: Cloudinary a system.panfree.
- F2-14 Bitwarden: 3 de 13 items (Supabase, Cloudinary, Gemini).
- INCIDENTE CRITICO: app caida en produccion (BUG-010).
  Regresion del logger en 88 archivos (import erroneo del S13).
  Fix: 757938c2. Deploy Ready. Verificado en incognito.

**Commits:**
- fdcb6c70 docs(sync): alinear STATUS, tracking y README de audits con S13
- 14ba0076 chore(git): dejar de versionar .vercel/ y exceptuar .env.example
- a0cc5c8f chore(git): limpiar comentario duplicado en .gitignore
- 757938c2 fix(logger): corregir import del logger en 88 archivos (regresion S13)

**Hallazgos cerrados:**
- BUG-010: regresion del logger (import erroneo, 88 archivos)

**Hallazgos nuevos:**
- BUG-010: regresion del logger (cerrado en esta sesion)
- BUG-011: bug en script 29-fix-logger-import.ps1 (linea final)
- SEC-018: 3 API keys activas en Cloudinary sin trazabilidad
- SEC-019: 4 API keys activas en Gemini sin trazabilidad
- BUG-006: .env.example dice gemini-2.5-flash pero codigo usa gemini-3.1-flash-image
- BUG-007: IDs de modelo Gemini hardcodeados en marketing/page.js
- BUG-008: geminiService llama a /generate-caption pero endpoint real es /generar-contenido
- BUG-009: endpoint usa gemini-3.7-flash que no existe en AI Studio
- DOC-002: MARKETING_INTELLIGENT_SYSTEM.md menciona modelos inexistentes
- DOC-003: discrepancia endpoint frontend vs backend

**Bloqueantes:**
- Ninguno. App en produccion OK.

**Aprendizajes:**
- Reemplazos masivos (381 calls en 88 archivos) requieren verificacion
  post-fix en produccion. Build OK no garantiza runtime OK.
- Vercel env pull NO baja valores marcados como Secret.
  Escribe [SENSITIVE] como placeholder.
- NEXT_PUBLIC_* en Vercel suelen ser visibles con ojito.
- Glob ** en Select-String -Path no funciona en PS 5.1.
  Usar Get-ChildItem -Recurse | Select-String.
- $var + ' string' falla si $var es int (PS interpreta suma).
  Usar "$var string".

**Proxima sesion:**
- Completar Bitwarden Tier 1 (10 items).
- Documentar hallazgos nuevos en tracking.
- Cerrar S14 oficialmente.
- (S15+) Iniciar rotaciones (F2-02, F2-04..F2-13).
- (S15+) Bloque B: SEC-014..017 (chores de hardcodes).

---

---

## 2026-10-14 (Sesion 14 - Cierre)

**Duracion:** ~2 horas (parte 2 de S14)
**Objetivo:** Cerrar S14: tracking + hallazgos + estado Bitwarden

**Completado:**
- Bloque A: registrados 10 hallazgos nuevos en tracking.
  - Tracking: 34 -> 45 hallazgos.
  - Cerrado: BUG-010 (regresion logger S13).
  - Nuevos: BUG-006..009, BUG-011, SEC-018, SEC-019, DOC-002, DOC-003.
- Doc nuevo: 24-bugs-s14-gemini-y-otros.md (familia Gemini + keys).
- Bloque B (parcial): documentado estado Bitwarden al cierre de S14.
  - 3/12 items completos. 9 pendientes (se completan durante rotacion S15).
  - SEC-020 registrado.
- Doc nuevo: 24-bugs-s14-gemini-y-otros.md.
- ROTACION-CLAVES.md: seccion "Estado de Bitwarden al cierre de S14".
- ENVIRONMENT.md: referencia a la seccion nueva.

**Commits:**
- a6c9d4d0 docs(audit): registrar 10 hallazgos nuevos de S14 (BUG-006..011, SEC-018/019, DOC-002/003)
- (pendiente) docs(session): cerrar sesion 14 (ENV) - Bloque A + Bitwarden parcial

**Hallazgos cerrados:**
- BUG-010: regresion del logger (ya cerrado en parte 1, formalizado en tracking).

**Hallazgos nuevos:**
- SEC-020: 9 items Bitwarden pendientes (se completan durante rotacion S15).

**Bloqueantes:**
- Ninguno.

**Aprendizajes:**
- En Bitwarden no se cargan valores viejos: se completa en el mismo flujo
  de la rotacion (rotar + guardar nuevo + guardar viejo).
- Los scripts de cierre no commitean; el commit se hace manual o en un
  script 35 dedicado, para agrupar el "docs(session)" con todos los cambios.
- Verificacion post-write con checks explicitos (string.Contains) evita
  falsos OK. El script 34 valido 8/8, el 32 valido 17/17.

**Proxima sesion (S15):**
- F2-02: rotar JWT secret + keys Supabase.
- F2-04: rotar Cloudinary API secret (resolver SEC-018 primero).
- F2-05: rotar Resend API key.
- F2-06: rotar Gemini API key (resolver SEC-019 primero).
- F2-07 a F2-13: resto de rotaciones.
- Completar items Bitwarden como subproducto de cada rotacion.
- F3-07: BUG-001 (VAPID).

---
