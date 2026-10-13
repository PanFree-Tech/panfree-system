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
- (pendiente) security(db): consolidar politicas RLS duplicadas (F1-08)

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
