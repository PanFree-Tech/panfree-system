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

---

## 2026-10-15 (Sesion 15 - COMPLETA)

**Duracion:** ~6 horas
**Objetivo:** Fase 2 (ENV) - Migracion Supabase + 5 hallazgos cerrados

**Completado:**
- SEC-008: funcion crear_usuario_admin eliminada (era SECURITY DEFINER sin uso).
- BUG-011: bug en 29-fix-logger-import.ps1 corregido y script versionado.
- SEC-018: 3 keys huerfanas de Cloudinary eliminadas (quedo 1 activa).
- SEC-019 + F2-06: rotacion completa de Gemini API key + limpieza de 3 huerfanas.
- F2-02: migracion completa de Supabase a Publishable/Secret keys.
- Fix colateral: sanitizeSupabaseKey acepta formato sb_publishable_.
- Legacy keys (anon/service_role) deshabilitadas en Supabase.
- Supabase Advisors: 0 issues (criterio de salida de Fase 1 cumplido).
- Bitwarden actualizado: Supabase, Cloudinary y Gemini con keys rotadas.

**Commits:**
- 7764b29f security(db): eliminar funcion sin uso crear_usuario_admin (SEC-008)
- 5e111171 fix(scripts): corregir bug en 29-fix-logger-import.ps1 (BUG-011)
- cb6dfe04 security(env): identificar y revocar keys huerfanas de Cloudinary (SEC-018)
- b8767b31 security(env): rotar Gemini API key + revocar huerfanas (SEC-019, F2-06)
- e17110f6 fix(supabase): aceptar formato sb_publishable en sanitizeSupabaseKey (F2-02)
- ea82251e security(env): migrar Supabase a Publishable/Secret keys (F2-02)

**Hallazgos cerrados:**
- SEC-008: crear_usuario_admin sin chequeo de caller (eliminada)
- BUG-011: bug en script 29-fix-logger-import.ps1
- SEC-018: 3 API keys activas en Cloudinary sin trazabilidad
- SEC-019: 4 API keys activas en Gemini sin trazabilidad

**Hallazgos nuevos:**
- Ninguno.

**Bloqueantes:**
- Ninguno.

**Aprendizajes:**
- Supabase migro a Signing Keys asimetricas (ECC P-256): el JWT Secret legacy
  ya no existe. La rotacion es 1 click y no requiere actualizar Vercel.
- Supabase depreco anon/service_role: la unica forma de rotarlas es migrar al
  sistema nuevo (sb_publishable_ / sb_secret_). No hay comando CMD/PowerShell.
- Vercel bloquea Secret con prefijo NEXT_PUBLIC_: hay que usar Config.
- El SDK @supabase/supabase-js v2.112.3 soporta ambos formatos, pero el codigo
  propio puede tener validaciones estrictas que hay que relajar (sanitizeSupabaseKey).
- Cloudinary plan Free no expone "Last used" por API key: la identificacion se
  hace por test empirico (upload) + eliminacion progresiva.
- Google AI Studio muestra los 4 ultimos caracteres del ID de key, suficiente
  para identificar sin exponer.
- Los scripts de S14 son el patron a seguir: idempotentes, con backups,
  verificacion post-write, y commits atomicos.

**Proxima sesion (S16):**
- F2-05: Rotar Resend API key (sin bloqueantes, rotacion sencilla).
- F2-04: Rotacion completa de Cloudinary (crear key nueva + revocar la actual).
- F2-13: Auditar las 11 APIs IA secundarias (ANTHROPIC, MISTRAL, DEEPSEEK, etc.).
- F3-07: BUG-001 (VAPID inconsistente).
- Chore: migrar @supabase/auth-helpers-nextjs -> @supabase/ssr.

---

---

## 2026-10-15 (Sesion 16 - COMPLETA)

**Duracion:** ~6 horas
**Objetivo:** Rotaciones Supabase + Cloudinary + Resend + Gemini + politica sin "Legado"

**Completado:**
- F2-02 / Supabase: migrado a sb_publishable_/sb_secret_ + JWT Signing Key rotada.
- F2-04 / Cloudinary: key rotada. Ticket Root User #392411 abierto.
- F2-05 / Resend: migracion [C]->[S], dominio via Claim, DNS en Spaceship,
  key nueva con scope minimo, test de mail real OK.
- F2-06 / Gemini: key rotada + 3 huerfanas eliminadas.
- Politica de rotacion sin coleccion "Legado" formalizada en SISTEMA-DE-TRABAJO
  y GESTION-DE-RIESGOS. Toda la documentacion operativa actualizada.
- SEC-008, SEC-018, SEC-019, SEC-021, BUG-011, DOC-004 cerrados.
- Doc 29: 29-f2-05-rotar-resend.md (248 lineas, con DNS, DoD, aprendizajes).

**Commits:**
- ccd57f00 docs(session): cerrar sesion 15 (ENV) - migracion Supabase + 5 hallazgos
- ea82251e security(env): migrar Supabase a Publishable/Secret keys (F2-02)
- e17110f6 fix(supabase): aceptar formato sb_publishable en sanitizeSupabaseKey (F2-02)
- b8767b31 security(env): rotar Gemini API key + revocar huerfanas (SEC-019, F2-06)
- cb6dfe04 security(env): identificar y revocar keys huerfanas de Cloudinary (SEC-018)
- 5e111171 fix(scripts): corregir bug en 29-fix-logger-import.ps1 (BUG-011)
- 7764b29f security(db): eliminar funcion sin uso crear_usuario_admin (SEC-008)
- 66a69d3d docs(ops): formalizar politica de rotacion sin legacy (S16)
- b15e8b6f docs(ops): documentar politica de rotacion en sistema y riesgos (S16)
- 1f0420a5 docs(audit): documentar cierre F2-05 (SEC-021, DOC-004)

**Hallazgos cerrados:**
- SEC-008: funcion crear_usuario_admin sin uso
- SEC-018: keys huerfanas Cloudinary revocadas
- SEC-019: keys huerfanas Gemini revocadas
- SEC-021: keys huerfanas Resend revocadas + migracion a [S]
- BUG-011: bug en script 29-fix-logger-import.ps1
- DOC-004: Resend mal documentado bajo cuenta [C]

**Hallazgos nuevos:**
- Ninguno (SEC-021 y DOC-004 fueron detectados durante F2-05 y cerrados en la misma sesion).

**Bloqueantes:**
- Ninguno. Cloudinary Root User pendiente (ticket #392411, no bloqueante).

**Aprendizajes:**
- Resend ya no usa Amazon SES. Migro a forge.rmta.net. Los registros DNS
  cambiaron respecto a la documentacion vieja.
- Domain Claim vs Domain Add en Resend: cuando el dominio esta en otra
  cuenta, hay que hacer Claim con TXT en "@", no en un subdominio.
- DKIM cambio de formato: antes v=DKIM1; k=rsa; p=..., ahora solo p=...
- Verificar en Logs de Resend filtrado por API key es la forma mas confiable
  de confirmar que la app usa la key nueva.
- Cloudinary Root User no se puede transferir desde la consola: requiere
  ticket a soporte. Se puede dejar como Master Admin operativamente.
- Cloudinary: el dropdown de Severity en el form de soporte rota solo.
  Priorizar el contenido del ticket, no la severidad.

**Proxima sesion (S17):**
- F2-07: migrar Meta WhatsApp a system.panfree.
- F2-08: rotar Twilio auth token.
- F2-09: rotar Instagram access token.
- Esperar respuesta Cloudinary #392411 (2-4 dias habiles).
- Continuar rotaciones restantes (n8n, GA4, VAPID, Secrets, APIs IA).
- Cerrar SEC-020 cuando todos los items Bitwarden esten completos.

---

---

## 2026-10-15 (Sesion 17 - COMPLETA)

**Duracion:** ~6 horas
**Objetivo:** ENV - Meta plomeria inerte + seccion Marketing sin uso + cierre de F2-07/08/09

**Completado:**

### Bloque 0 - Chore de arranque
- .gitignore: agregadas reglas dump-s*.txt y .backup-s*/
- package-lock.json versionado (habilita npm ci en CI, F4-06)
- 30 scripts de cierre S14-S16 versionados (deuda de working tree pagada)

### Bloque 1 - Reconciliacion de documentacion
- Tracking: Total 51->55 al final de S17. Corregida negrita en DB-001i.
- Header del tracking recalculado automaticamente.
- ROTACION-CLAVES: typo S16->S17 corregido (2 ocurrencias).
- .env.example: Supabase y Cloudinary de [C]/MIG a [S]/OK.

### Bloque 2 - Ticket Cloudinary #392411
- Consulta al ticket: recien enviado, sin respuesta aun.
- Se reconsulta en S18 (2-4 dias habiles).

### Bloque 3 - Auditoria del ecosistema Meta (DOC-005/006/007)
- Confirmado: NINGUNA variable Meta existe en Vercel.
  - WHATSAPP_*: solo ADMIN_WHATSAPP (usado por notificaciones.js).
  - TWILIO_*: no existe.
  - INSTAGRAM_*: no existe.
- Confirmado: todo el codigo Meta es plomeria inerte o rota.
  - WhatsApp Cloud API + Twilio: plomeria inerte (tokens nunca creados).
  - Instagram Graph API: endpoints ACTIVOS con UI visible, pero fallan
    en runtime por falta de tokens.
- Canal real de WhatsApp: wa.me/595984589845 (link directo, 20+ lugares).
- Bloqueante raiz: Meta Business Verification requiere RUC.
- DECISION: conservar plomeria (costo mantener nulo, costo reescribir alto).
  Revision a 2027-04-15.
- .env.example: secciones Meta WhatsApp, Twilio, Instagram marcadas con
  estado real (NO USADO / ROTO).
- F2-07, F2-08, F2-09 reformuladas como "No aplica" en PLAN-DE-TRABAJO.
- Doc nuevo: docs/audits/2026-10-13-inicial/30-doc-meta-plomeria-inerte.md

### Bloque 4 - Auditoria de la seccion Marketing (DOC-008)
- Seccion /admin/marketing: ~8.100 lineas de codigo.
- Confirmado por el responsable: no se usa, no crea contenido util, no publica.
- Duplica funcionalidad existente:
  - Promociones por producto ya existen en /admin/productos.
  - Cupones de descuento ya existen en /admin/cupones y se aplican en checkout.
- Criterio de retiro definido por el responsable:
  - RETIRAR: generacion de imagenes, Instagram, EventCalendar, RulesManager, AutomationPanel.
  - REVISAR: generacion de contenido IA, DecisionPanel, pagina principal.
- Candidato total a retiro: ~5.500-6.500 lineas.
- NO se toca codigo en S17. Plan de limpieza en sesion dedicada futura.
- Doc nuevo: docs/audits/2026-10-13-inicial/31-doc-008-seccion-marketing.md
- Backlog registrado: sistema simple de promociones en CartSidebar (S18+).

**Hallazgos cerrados:**
- Ninguno (los 4 nuevos quedaron Abiertos o Aceptados segun decision).

**Hallazgos nuevos:**
- DOC-005: Meta WhatsApp + Twilio - plomeria inerte (Cerrado).
- DOC-006: Instagram Graph API - endpoints rotos con UI visible (Abierto).
- DOC-007: Bloqueante externo - Meta Business Verification requiere RUC (Aceptado).
- DOC-008: Seccion Marketing sin uso real, ~8.100 lineas (Abierto).

**Bloqueantes:**
- Cloudinary Root User (ticket #392411, 2-4 dias habiles, no bloqueante).

**Aprendizajes:**
- Regla nueva: los scripts PowerShell >150 lineas SIEMPRE se crean/editan en
  VS Code. NUNCA se pegan en la consola interactiva.
  Motivo: al pegar un script grande en la consola, PowerShell lo ejecuta como
  comandos en vivo en lugar de escribir el archivo. Resultado: script vacio
  (0 bytes) commiteado en git. Ocurrio con el script 49.
- Los bloques de ejemplo tampoco se pegan en la consola.
  Separar claramente: bloques de script -> VS Code; comandos -> consola.
- Meta Business Verification es un bloqueante externo real (RUC).
  No hay workaround tecnico. Se documenta como Aceptado.
- Regla nueva: /admin/marketing ya no se debe reactivar sin una decision explicita.
  El codigo se conserva inerte.
- Al hacer scripts muy grandes, dividirlos en a/b (250 lineas maximo por archivo).

**Proxima sesion (S18):**
- Verificar respuesta del ticket Cloudinary #392411.
- Considerar ocultar la seccion Marketing del menu admin (S17-B diferido).
- F2-10: rotar n8n webhook token.
- F2-11: rotar GA4 API secret.
- F2-12: regenerar par VAPID.
- F2-13: secrets internos (CRON_SECRET, WEBHOOK_SECRET).
- F2-14: auditar APIs IA secundarias (11 pendientes).
- Backlog: sistema simple de promociones en CartSidebar.

---

## 2026-10-16 (Sesion 18 - COMPLETA)

**Duracion:** en curso
**Objetivo:** ENV - F2-10 n8n (reformulada) + auditoria Vercel + hallazgos colaterales

**Completado (parcial):**
- Bloque 1: auditoria de n8n (script 52).
  - Codigo: 20 coincidencias en 5 archivos.
  - Vercel: 3 variables N8N_* NO existen.
  - Veredicto: plomeria inerte. F2-10 reformulada a "No aplica".
  - Doc nuevo: 32-doc-n8n-plomeria-inerte.md.
- Bloque 2: auditoria completa de Vercel (vercel env ls).
  - Detectada variable basura NEXT_PUBLIC_UPLOAD_PRESETNEXT_PUBLIC_UPLOAD_PRESET.
  - SEC-022: eliminada de Production + Preview en Vercel.
  - Doc nuevo: 33-doc-vercel-hallazgos.md.
- Bloque 3: reformular PLAN-DE-TRABAJO + .env.example.
  - F2-10 -> "No aplica" (mismo patron que F2-07/08/09).
  - Seccion N8N en .env.example -> "NO USADO".

**Hallazgos nuevos:**
- DOC-009: n8n plomeria inerte (Cerrado).
- SEC-022: variable basura en Vercel (Cerrado).
- SEC-023: GA4 con dos juegos de credenciales coexistiendo (Abierto).
- SEC-024: NEXT_PUBLIC_VAPID_EMAIL con valor sospechoso (Abierto).
- DOC-010: variables en Vercel sin documentar (Abierto).
- DOC-011: variables en .env.example sin equivalente en Vercel (Abierto).

**Bloqueantes:**
- Ninguno. Cloudinary #392411 se reconsulta a partir del 2026-10-18.

**Proxima sesion / continuacion S18:**
- F2-11: rotar GA4 API secret (resolver SEC-023 primero).
- F2-12: regenerar par VAPID (resolver SEC-024 + BUG-001).
- F2-13: secrets internos (CRON_SECRET, WEBHOOK_SECRET).
- F2-14: auditar 11 APIs IA secundarias.

**Pendiente:**
- Reconsultar Cloudinary #392411 (a partir del 2026-10-18).

**Bloque 4 (secrets internos - F2-14 subproducto):**
- Auditoria de secrets internos (script 54).
  - 0 coincidencias en src/ para CRON_SECRET, WEBHOOK_SECRET, REVALIDATE_SECRET.
  - 0 coincidencias en todo el repo excepto docs.
  - No hay vercel.json, ni /api/cron/*, ni /api/revalidate/*.
  - REVALIDATE_SECRET no estaba documentado en .env.example.
- Veredicto: los 3 secrets son plomeria inerte.
- Eliminados de Vercel: CRON_SECRET, WEBHOOK_SECRET, REVALIDATE_SECRET (Production + Preview).
- Doc nuevo: 34-doc-secrets-internos-plomeria-inerte.md (DOC-012).
- .env.example: seccion SECRETS INTERNOS marcada como ELIMINADOS.

**Hallazgos nuevos (bloque 4):**
- DOC-012: Secrets internos plomeria inerte (Cerrado).

**Bloque 5 (APIs IA - F2-13):**
- Auditoria de APIs IA secundarias (script 56).
  - 45 coincidencias en 2 archivos de Marketing.
  - 12 APIs usadas en codigo Marketing (generar-contenido + generar-imagen-cloudinary).
  - 2 APIs sin uso en codigo (POLLINATIONS, REPLICATE).
  - NEXA_API_KEY en codigo pero nunca en Vercel.
- Veredicto: las 13 APIs IA son plomeria inerte dentro del modulo Marketing inerte.
- Eliminadas de Vercel (Production + Preview): 13 variables.
- Doc nuevo: 35-doc-apis-ia-eliminadas.md (DOC-013).
- .env.example: seccion APIS IA marcada como ELIMINADAS.
- PLAN: F2-13 reformulada a "No aplica".
- Pendiente futuro: retirar el codigo de Marketing (referencias a estas APIs)
  junto con el resto del modulo segun DOC-008. No se crea tarea nueva.

**Hallazgos nuevos (bloque 5):**
- DOC-013: APIs IA secundarias plomeria inerte (Cerrado).
**Cierre S18:**
- 5 bloques completados, 3 commits pusheados.
- 3 tareas F2 cerradas: F2-10 (n8n No aplica), F2-13 (APIs IA No aplica),
  subproducto de F2-14 (secrets internos eliminados de Vercel).
- 8 hallazgos registrados: DOC-009/010/011/012/013, SEC-022/023/024.
- Limpieza masiva de Vercel: 16 variables eliminadas
  (13 APIs IA + 3 secrets internos).
- Progreso: 66% -> 70% (33 de 47 tareas).
- F2: 8/14 -> 10/14.

**Commits S18:**
- 6ec46c30 docs(env): documentar n8n plomeria inerte y hallazgos de Vercel
- 74486761 docs(env): documentar secrets internos como plomeria inerte
- 9b99efe7 docs(env): auditar y eliminar 13 APIs IA secundarias

**Proxima sesion (S19):**
- F2-11: rotar GA4 API secret (auditar SEC-023 primero).
- F2-12: regenerar par VAPID (verificar SEC-024 + BUG-001).
- F2-14: guardar .env consolidado en Bitwarden.
- Backlog: sistema simple de promociones en CartSidebar (DOC-008 seccion 9).
- Pendiente futuro: retiro del modulo Marketing completo (DOC-008).

**Bloqueantes:**
- Ninguno. Cloudinary #392411 se reconsulta a partir del 2026-10-18.

---

## 2026-10-16 (Sesion 19 - COMPLETA)

**Duracion:** ~8 horas
**Objetivo:** ENV - Rotacion GA4 (F2-11) + correccion de autoria del historial

**Completado:**

### Bloque 1 - Auditoria GA4 (SEC-023)
- Script 59: auditar variables GA4 en src/ (18 coincidencias en 4 archivos).
- Script 60: leer endpoints que consumen credenciales GA4.
- Conclusion: SEC-023 NO era duplicado. Coexistencia legitima:
  - Grupo A (Service Account): plomeria inerte (ga-metrics/route.js
    solo lee de Supabase, no usa Data API de Google).
  - Grupo B (Measurement Protocol): activo (ga4/measurement/route.js).
- Decision: conservar Grupo A. Rotar solo Grupo B.
- Hallazgo nuevo: DOC-014 (Service Account plomeria inerte, revision 2027-04-16).

### Bloque 2 - Rotacion de GA4_API_SECRET
- Secret nuevo creado en GA4 Admin: panfree-system-2026-10-16.
- Actualizado en Vercel (Production + Preview) + .env.local + Bitwarden.
- Redeploy + verificacion empirica (debug_validation sin errores).
- Secret viejo revocado: panfree-measurement-protocol
  (9kBxpoPjR_aBo1H0-QyE8w, creado 2026-08-22).
- Motivo adicional: exposicion accidental del secret en chat durante la
  auditoria de S19.

### Bloque 3 - Rotacion de GA4_PRIVATE_KEY
- Key nueva creada en Google Cloud Console: panfree-system-2026-10-16.
- Actualizada en Vercel + .env.local + Bitwarden.
- Key vieja revocada (Key ID: 45522eb71b92a80fcdb49c5ff073786d9b02496b,
  creada 2026-08-31).
- Nota: el valor legacy fue IRRECUPERABLE (Google no lo expone post-creacion;
  Vercel no lo muestra por Sensitive). Se documento como excepcion justificada
  a la politica "guardar valor saliente completo".

### Bloque 4 - Correccion de autoria del historial de Git
- Descubierto: todos los commits de S1-S18 estaban firmados por
  "Piromaniaco <dagnershd@gmail.com>" (familiar propietario de la PC).
- Identificado: 4 autores distintos en el historial:
  - Luciana Noelia Da Silva <luzzdevictoria@gmail.com>
  - Panfree <contacto.panfree@gmail.com>
  - PanFree-Tech <system.panfree@gmail.com>
  - Piromaniaco <dagnershd@gmail.com>
- Script 62: reescritura completa del historial con git filter-repo.
  Todos los 333 commits ahora firmados por:
  Pedro J. Pirovani <pirovanipedrojose@gmail.com>
- Push force ejecutado: 88a54bcc -> 2ab9895e (historial reescrito).
- Verificado en GitHub: todos los commits atribuidos a pjpirovani-soft.
- Identidad local del repo configurada (no global).
- Credenciales de push en Windows: eliminadas las de Piromaniaco y
  paraguayffaametalstorm-debug. Solo queda gh:github.com:PanFree-Tech.

### Cierre
- Script 63a: chore .gitignore (reglas para *-audit-*.txt, *-endpoints-*.txt)
  + git rm --cached de 2 .txt versionados por error.
- Script 63b: documentacion de cierre (este).
- Progreso: 70% -> 72% (34 de 47 tareas).
- F2: 10/14 -> 11/14.

**Commits S19:**
- b87aadde security(env): rotar GA4 API secret y private key (F2-11, SEC-023)
- 2ab9895e chore(scripts): agregar script 62 de correccion de autoria
- (pendiente) chore(git): ignorar reportes de auditoria temporales
- (pendiente) docs(session): cerrar sesion 19 (ENV) - rotacion GA4 + correccion de autoria

**Hallazgos cerrados:**
- SEC-023: GA4 con dos juegos de credenciales coexistiendo
  -> Cerrado: no era duplicado, coexistencia legitima.

**Hallazgos nuevos:**
- DOC-014: GA4 Service Account plomeria inerte (Abierto, revision 2027-04-16).

**Hallazgos reabiertos/afectados:**
- SEC-001 (.env en historial Git): el filter-repo NO elimina los .env del
  historial. Sigue pendiente F4-01.

**Bloqueantes:**
- Ninguno. Cloudinary #392411 se reconsulta a partir del 2026-10-18.

**Aprendizajes:**
- Auditoria previa evita rotaciones inutiles. SEC-023 parecia duplicado y
  resulto coexistencia legitima. Mismo patron que S17/S18.
- git filter-repo es la herramienta correcta para reescribir autoria.
  `git filter-branch` es lento y deprecated.
- La credencial de push (Windows Credential Manager) y el autor del commit
  son cosas distintas. Corregir uno no corrige el otro.
- La politica "guardar el valor saliente COMPLETO" tiene una excepcion
  justificada: cuando el valor es tecnicamente irrecuperable (Google Cloud
  private keys). Se documenta como "irrecuperable + revocado".
- Los hashes de commits cambian tras filter-repo. Las referencias en docs
  quedan obsoletas. Se documenta la nota "hashes pre-reescritura".

**Nota S19 sobre hashes obsoletos:**
El historial de Git fue reescrito (correccion de autoria, script 62).
Los hashes de commits anteriores a S19 cambiaron. Las referencias a hashes
en BITACORA.md, 06-hallazgos-tracking.md y docs de auditoria corresponden
al historial pre-reescritura. Los mensajes de commit se preservan y son
la referencia valida.

**Proxima sesion (S20):**
- F2-12: regenerar par VAPID (verificar SEC-024 + BUG-001 antes).
- F2-14: guardar .env consolidado en Bitwarden.
- F3-07: fix BUG-001 (VAPID inconsistente en admin/page.js).
- Reconsultar Cloudinary #392411 (a partir del 2026-10-18).
- Backlog: sistema simple de promociones en CartSidebar (DOC-008 seccion 9).

## 2026-10-16 (Sesion 20 - COMPLETA)

**Duracion:** ~6 horas
**Objetivo:** ENV - Chore scripts + F2-12 VAPID + F3-07 + cierre

**Completado:**

### Bloque 0 - Chore de arranque
- 64a: reescribir 59-auditar-ga4.ps1 con scope total (patron 54).
- 64a commiteado como 7d2bf3a8.
- 64b/64c quedaron con contenido cruzado por here-strings anidados.
- Deuda registrada: recrear 64b/64c bien en S21.

### Bloque 1 - F2-12 VAPID + F3-07 + SEC-014 + BUG-001 + BUG-012

**Auditoria previa:**
- Confirmado BUG-001: clave hardcodeada en admin/page.js distinta a Vercel.
- Confirmado SEC-014: la misma constante hardcodeada.
- Confirmado BUG-012 (nuevo): PWAInstallPrompt.js leia NEXT_PUBLIC_VAPID_KEY inexistente.
- Confirmado SEC-024: NO aplica. Era artefacto visual del CLI de Vercel.

**Rotacion:**
- Par VAPID generado con Out-File (regla 7.5 aplicada).
- Incidente S20-01: un par intermedio quedo expuesto en el chat de IA.
  Descartado sin cargarlo. Par valido generado con redireccion.
- Bitwarden: item "VAPID - Produccion" creado en carpeta
  "PanFree System - Produccion". 3 campos + nota con historial.
- Vercel: Production + Preview con las 3 vars nuevas.
- Supabase: push_subscriptions vaciada (suscripciones huerfanas).

**Fix de codigo:**
- src/app/admin/page.js: const VAPID_PUBLIC_KEY desde process.env.
- src/components/PWAInstallPrompt.js: idem (variable correcta).
- Commit: 5923f3a6.

**Hallazgo colateral (DOC-015):**
- Al verificar el bundle se descubrio que el alias www.panfree.fit
  apuntaba a un deployment viejo (hyx06fts0, 63d). Vercel no actualiza
  el alias automaticamente.
- Fix: vercel --prod --force --yes. Deployment jc4bivlqy + alias OK.
- Pendiente S21: auditar si fixes previos llegaron a produccion.

**Verificacion end-to-end:**
- Suscripcion desde /admin -> POST /api/push-suscribir 200.
- 1 fila en push_subscriptions con user_id valido.

**Hallazgos cerrados:**
- F2-12 (rotacion VAPID)
- F3-07 (fix BUG-001 en admin)
- SEC-014 (VAPID key hardcodeada)
- BUG-001 (VAPID inconsistente)
- BUG-012 (PWAInstallPrompt leia variable inexistente)
- SEC-024 (no aplica)

**Hallazgos nuevos:**
- DOC-015: alias Vercel apuntaba a deployment viejo (abierto, revision S21).

**Commits S20:**
- 7d2bf3a8 chore(scripts): reescribir 59 con scope total (patron 54)
- 5923f3a6 fix(pwa,admin): unificar VAPID_PUBLIC_KEY desde env (F3-07, SEC-014, BUG-001, BUG-012)
- (pendiente) docs(session): cerrar sesion 20 (ENV) - VAPID + cierre

**Aprendizajes:**
- Here-strings @'...'@ NO se anidan en PowerShell.
- Regla 7.5 aplicada: secretos generados por CLI van a archivo con 2>&1 | Out-File.
- Service Worker puede servir chunks viejos post-redeploy.
- cache:no-store rompe fetch de chunks servidos por el SW.
- performance.getEntriesByType tiene buffer limitado (150-250 entries).
- Vercel alias NO se actualiza solo con push a main.
- Regex PowerShell con (?m)^...$ no matchea confiable en Markdown tables.
  Usar .Replace() literal.

**Bloqueantes:**
- Ninguno.

**Proxima sesion (S21):**
- Rehacer 64b/64c en VS Code (script 65 y 66 completos).
- Auditar DOC-015: que fixes previos llegaron a produccion.
- F2-14: Bitwarden consolidado (opcional, ya cubierto por items).
- Reconciliar doc vs realidad: Bitwarden tiene 3 carpetas, doc dice 1.
- Items sueltos en Bitwarden (panfree.fit, supabase.com) - auditar.

---

## 2026-10-16 (Sesion 21 - COMPLETA)

**Duracion:** ~4 horas
**Objetivo:** ENV - Fix Service Worker + recon + hallazgos menores

**Completado:**

### Bloque 0+1 - Recon + fix STATUS
- 67a-v2: recon S21 (git + next.config.js).
- Fix STATUS.md: header, progreso (76%), F2 (13/14), append S20.
- Commit: 8cddc665.

### Bloque 2 - Supabase legacy (DOC-016)
- Auditoria inicial mostro "eyJ..." en Vercel env ls.
- Verificacion con vercel env pull + Dashboard: valor real
  es sb_publishable_. DOC-016 NO aplica.
- Leccion: el CLI de Vercel puede mostrar el ojito con formato
  JWT interno, no el valor real. Siempre verificar con env pull
  o dashboard.

### Bloque 3 - Service Worker (DOC-017)
- Sintoma: /admin solo cargaba 5 scripts (framework base), no los
  chunks de admin. La app se veia pero no hidrataba.
- Diagnostico:
  - view-source mostraba HTML correcto (13 scripts).
  - document mostraba HTML viejo (5 scripts).
  - El SW cacheaba HTML con CacheFirst (default de next-pwa).
- Fix en next.config.js:
  - clientsClaim: true.
  - runtimeCaching custom (NetworkFirst para HTML).
- Commit: 16ea5eec.
- Verificacion: 16 scripts en el DOM (antes 5).

### Hallazgos nuevos
- DOC-017 (Service Worker): cerrado.
- DOC-018 (meta apple deprecated): abierto F4 P3.
- DOC-019 (icono 144x144 faltante): abierto F4 P3.
- DOC-015 (alias Vercel): no aplica (falsa alarma).
- DOC-016 (Supabase legacy): no aplica (falsa alarma).

### Hallazgos cerrados en S21
- DOC-017.

**Commits S21:**
- 16ea5eec fix(pwa): evitar cacheo de HTML en service worker (DOC-017)
- 8cddc665 docs(status): actualizar STATUS a cierre S20 + recon S21
- 82bf85f5 docs(audit): registrar DOC-017 + DOC-018 + DOC-019 (S21)

**Bloqueantes:**
- Ninguno.

**Proxima sesion (S22):**
- Bloque 4: rehacer 64b/64c (deuda S20).
- Bloque 5: reconciliar Bitwarden vs docs (3 carpetas).
- Cloudinary #392411 (reconsultar desde 2026-10-18).
- F3-08 / F3-09 (ESLint + headers de seguridad).

**Aprendizajes:**
- El CLI de Vercel puede mostrar el ojito con formato JWT interno
  para valores Sensitive. No confiar en env ls para verificar.
- next-pwa sin runtimeCaching cachea HTML con CacheFirst.
  Consecuencia: los clientes recurrentes quedan con HTML viejo
  indefinidamente.
- skipWaiting + clientsClaim son ambos necesarios para reemplazo
  inmediato del SW.
- Para docs con mucho codigo/comillas, creacion manual en VS Code
  es mas robusta que scripts (el escaping en PowerShell 5.1 es
  fragil).

---

## 2026-10-16 (Sesion 22 - COMPLETA)

**Duracion:** ~3 horas
**Objetivo:** Sincronizacion de docs + fix orquestador + F3-08 + F3-09

**Completado:**

### Bloque 1 - STATUS.md sincronizado
- Tabla: F3 6->7, Total 36->37.
- Proximos pasos: F3-08 y F3-09 (los cerramos en la misma sesion).
- Metricas: claves 3/12 -> 6/12, hallazgos 31/47 -> 42/67, commits 8 -> ~50.
- Eliminada duplicacion de Sesion 20.
- Commit: e1e1ce65.

### Bloque 2 - Tracking sincronizado
- Header: fin Sesion 20 -> fin Sesion 21.
- Total: 63 -> 69 (conteo real de filas).
- Resumen: Abierto 20->22, Cerrado 41->42.
- Eliminada fila vacia entre DOC-011 y DOC-015.
- Commit: 53dbd4e8.

### Bloque 3 - PLAN-DE-TRABAJO sincronizado
- F2-12: Pendiente -> OK.
- F3-07: Pendiente -> OK.
- Commit: 926dac53.

### Bloque 4 - ROTACION-CLAVES: seccion S21 agregada
- S21 no roto claves. Documentado en seccion nueva.
- Commit: 72627936.

### Bloque 5 - Reconciliar Bitwarden vs docs
- 4 archivos: SISTEMA-DE-TRABAJO, ENVIRONMENT, ROTACION-CLAVES, GESTION-DE-RIESGOS.
- 3 carpetas reales: Claves Personales, Desarrollo, Produccion.
- Fix colateral (70b): el 70 no matcheo ROTACION por falso positivo.
- Commit: 9509d951.

### Bloque 6 - Fix orquestador GA4
- Bug S20: `& powershell -File` anidado causaba loop infinito.
- Fix S22: invocacion directa `& script.ps1`.
- Script 71 verificado: 59 + 60 corren sin loop.
- Commit: bd8315f3.

### Bloque 7 - F3-08: ESLint en build (CONF-001)
- next.config.js: `eslint.ignoreDuringBuilds: true -> false`.
- Verificacion local: 4 warnings, 0 errores. Deploy OK.
- En CI aparecieron ~30 warnings (Next.js corre ESLint sobre TODOS los archivos).
- Commit: a9fa9a7b.

### Bloque 8 - F3-09: Headers de seguridad (CONF-002)
- Agregados 4 headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- HSTS ya servido por Vercel.
- Verificacion post-deploy: 4/4 headers activos en www.panfree.fit.
- Commit: ce7cdd70.

**Hallazgos cerrados:**
- CONF-001: ESLint ignorado en build.
- CONF-002: Sin headers de seguridad.

**Hallazgos nuevos:**
- CONF-003: ~30 warnings de ESLint (mayoria <img> sin <Image />). F3 P3.
- CONF-004: typescript.ignoreBuildErrors: true. F3 P2.
- CONF-005: CSP pendiente. F3 P3.

**Commits S22:**
- e1e1ce65 docs(sync): corregir STATUS.md a estado real post-S21
- 53dbd4e8 docs(sync): actualizar tracking con estado real post-S21
- 926dac53 docs(sync): marcar F2-12 y F3-07 como OK en PLAN
- 72627936 docs(sync): agregar seccion S21 a ROTACION-CLAVES
- 9509d951 docs(env): reconciliar Bitwarden vs docs (3 carpetas)
- bd8315f3 chore(scripts): fix orquestador GA4 con invocacion directa
- a9fa9a7b chore(eslint): activar ESLint en build (F3-08, CONF-001)
- ce7cdd70 security(headers): agregar headers de seguridad (F3-09, CONF-002)

**Bloqueantes:**
- Ninguno.

**Proxima sesion (S23):**
- F4-01: purgar historial de Git (SEC-001).
- F4-05: confirmar package-lock.json.
- Cloudinary #392411 (reconsultar desde 2026-10-18).
- Backlog: 64b-reescribir-60 (auto-descubrimiento GA4).
- Backlog: limpieza de warnings de ESLint (CONF-003).
- Backlog: activar TypeScript en build (CONF-004).

**Aprendizajes:**
- Regex PowerShell no matchea confiable en Markdown tables. Usar .Replace() literal.
- Falsos positivos en idempotencia: strings unicos y especificos, no fragmentos comunes.
- `$h:` en strings PowerShell = error. Usar `-f` o `${h}`.
- Orquestadores: invocacion directa `& script.ps1`, NO `powershell -File` anidado.
- En CI, Next.js corre ESLint sobre TODOS los archivos (~30 warnings vs 4 local).
- `vercel env ls` miente: siempre verificar con `env pull` o dashboard.

---

## 2026-10-17 (Sesion 23 - COMPLETA)

**Duracion:** ~4 horas
**Objetivo:** Bloque 0 - Sincronizacion de docs post-S22

**Completado:**

### Bloque 0 - Fix de documentacion (6 archivos)
- PLAN-DE-TRABAJO: F3-08 y F3-09 marcados OK (commit 44a44c21).
- Tracking: conteo Aceptados corregido 3 -> 2 (commit 51f82788).
- BITACORA: cierre de Sesion 18 reformateado, parrafo pegado dividido en lineas (commit 7039034b).
- STATUS: sesiones S16-S22 movidas dentro de "Ultima actividad" (commit cee6bce9).
- ROTACION-CLAVES: 3 sub-fixes:
  - Fix mojibake en linea 420 (commit 3efd3cf0).
  - Nota S23 aclaratoria insertada antes de S14 (commit e2875579).
  - S20/S21/S22 homogeneizadas a "Carpetas" + "Fuente de verdad" (commit 11d84163).
- GUIA-RAPIDA: 3 rutas obsoletas actualizadas (commit ae3cd460).
- Scripts del Bloque 0 versionados (commits varios, cierre c3710fa9).

**Hallazgos cerrados:**
- Ninguno (S23 fue limpieza de docs, no cierre de hallazgos tecnicos).

**Hallazgos nuevos:**
- Ninguno.

**Incidentes:**
- Commit 3a8b3477 (homogeneizar ROTACION v1) introdujo mojibake colateral en 1 linea.
  Revertido con 519a9086. Rehecho en 79b + 79c + 79e (byte-safe).
- Script 79d v1 fallo por bug de line endings (\r residual al comparar con -eq).
  Fix en 79e v2: normalizacion con TrimEnd("\r") al leer.

**Bloqueantes:**
- Ninguno.

**Proxima sesion (S24):**
- F4-01: purgar historial de Git (SEC-001).
- F4-05: confirmar package-lock.json.
- F2-03: Cloudinary #392411 (reconsultar desde 2026-10-18).
- Backlog: 64b (auto-descubrimiento GA4).

**Aprendizajes:**
- Verificar line ending del archivo antes de modificarlo con scripts.
  Si es CRLF: normalizar con TrimEnd("\r") al leer.
  Si es LF: leer normal.
- Preservar el line ending original al escribir: detectar CRLF vs LF y
  usar -join $lineEnding.
- Mojibake: detectar con [char]0xXXXX (codigos Unicode), no con
  literales. Los .ps1 con caracteres no-ASCII rompen el parser.
- Nunca pegar scripts en la consola: $PSScriptRoot queda vacio.
  Siempre crear en VS Code y correr con "powershell -File".
- -NoCommit como default en scripts de fix. Commit manual tras verificar diff.
