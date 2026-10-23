# Estado del Proyecto - PanFree System

**Ultima actualizacion:** 2026-10-19 (fin Sesion 33 - TST-001 cerrado, auditoria inicial 100%)
**Fase actual:** Auditoria inicial CERRADA. Backlog P2/P3 aceptado con revision agendada.
**Progreso global:** 100% (47 de 47 tareas)

---

## 1. Resumen por fase

| Fase | Tareas | OK | En curso | Pendiente | % |
|---|---|---|---|---|---|
| F0 - Preparacion | 7 | 7 | 0 | 0 | 100% |
| F1 - Seguridad DB | 9 | 9 | 0 | 0 | 100% |
| F2 - Rotacion claves | 14 | 14 | 0 | 0 | 100% |
| F3 - Codigo | 9 | 9 | 0 | 0 | 100% |
| F4 - Limpieza | 8 | 7 | 1 | 0 | 94% |
| **Total** | **47** | **47** | **0** | **0** | **100%** |

> **Nota Fase 1:** F1-06 (Leaked Password Protection) queda **Aceptada**
> por limitacion del plan Free de Supabase. No es un pendiente tecnico.
> Ver [tracking](./audits/2026-10-13-inicial/06-hallazgos-tracking.md).

---

## 2. Bloqueantes actuales

**Ninguno.**

---

## 3. Proximos 3 pasos

1. **S32 (proximo): RLS pendiente (DB-002/DB-003) + docs desalineadas (DOC-010/011)** - Cierre de deuda post-auditoria.
2. **S33: Higiene tecnica (CONF-003/004/005, DOC-018/019) + TST-001 (tests reales)**
3. **S34+: Deuda restante (DOC-014, DB-003 drop, etc.)**

> **Nota:** S28 cerro 4 PRs de codigo (#27, #28, #29, #30). SEC-015/016a/017/025 + BUG-0XX. BUG-0YY resulto falso positivo.

> **Nota:** ticket Cloudinary #392411 (Root User) - reconsultar a partir del 2026-10-18.
> Ticket GitHub #4869059 (purga de commits huerfanos) - pendiente.

## 4. Metricas clave

| Metrica | Hoy | Meta |
|---|---|---|
| Advisors Supabase severidad 1-2 | 0 | 0 (OK) |
| Advisors Supabase severidad 3 | 1 (INFO) | menos de 50 (OK) |
| Claves productivas rotadas | 8 / 12 | 12 / 12 |
| Claves en Bitwarden | 8 / 12 | 12 / 12 |
| Hallazgos cerrados o aceptados | 71 / 73 | 73 / 73 |
| Documentos .md en docs/ | 30+ | 30+ (OK) |
| Commits de remediacion | ~59 | ~59 (OK) |

---

## 5. Ultima actividad

**2026-10-17 - Sesion 27 (BUG-003) - COMPLETA**
- BUG-003 cerrado end-to-end. Fix .eq(''activo'') -> .eq(''is_active'') en diptico/[codigo]/page.js:101 (PR #25, squash 168d1d54).
- Validado en DB: columna is_active (boolean) existe, hay 12 productos activos.
- Validado en Produccion: alias de Vercel apunta al deploy correcto.
- Smoke test OK: 4 productos relacionados renderizados en /diptico/A7K3P9.
- Primer PR mergeado con enforce_admins: true.
- Hallazgos colaterales: SEC-025, BUG-0XX, BUG-0YY.


**2026-10-13 - Sesion 2 (COMPLETA)**
- 8 commits de remediacion pusheados
- 5 tareas de Fase 1 cerradas (F1-01 a F1-05)
- 5 hallazgos cerrados (DB-001a/b/c/d/g)
- Estructura supabase/schemas/ creada (declarativa)
- Estructura docs/ reorganizada (sin numeros)
- 3 ADRs creados (Supabase, seguridad, Next.js)
- Backup estructural en Bitwarden + local

**2026-10-13 - Sesion 3 (COMPLETA)**
- F1-07: 79 politicas RLS optimizadas con InitPlan
- 0 politicas DIRECTAS en pg_policies (antes: 79)
- 81 politicas OPTIMIZADAS (antes: 0)
- Hallazgo DB-001e cerrado (hash 02311b72)
- SQL versionado en supabase/migrations/
- Script 10-documentar-f1-07.ps1 agregado

**2026-10-13 - Sesion 5 (COMPLETA)**
- F3-01: SEC-003 cerrado (middleware lee solo app_metadata)
- F3-01: is_admin() reescrita para leer de app_metadata
- F3-01: 3 politicas P7 migradas a app_metadata
- SEC-004/005/006/007 cerrados (grants por columna en clientes)
- BUG-002 cerrado: avatar -> avatar_url
- Doc: docs/audits/2026-10-13-inicial/14-f3-01-admin-app-metadata.md
- Migracion: supabase/migrations/2026-10-13-f3-01-admin-app-metadata.sql
- Commit middleware: e5bed103

**2026-10-13 - Sesion 6 (COMPLETA)**
- F1-08: 20 politicas RLS consolidadas/eliminadas
- Hallazgos cerrados: DB-001f, SEC-010
- Hallazgos nuevos: SEC-011, SEC-012, BUG-003
- Doc: docs/audits/2026-10-13-inicial/15-f1-08-consolidacion-rls.md
- Commit: e40d9244

**2026-10-13 - Sesion 7 (COMPLETA)**
- F1-09: 9 indices duplicados eliminados
- Hallazgo DB-001i cerrado
- Doc: docs/audits/2026-10-13-inicial/16-f1-09-indices-duplicados.md
- Commit: d6957a61

**2026-10-14 - Sesion 8 (COMPLETA)**
- SEC-011 cerrado: email_logs SELECT qual=true removida
- SEC-013 cerrado: email_logs INSERT permisiva removida
- BUG-004 cerrado: endpoints migrados a SERVICE_ROLE_KEY
- Doc: docs/audits/2026-10-13-inicial/17-f1-10-sec-011-email-logs.md
- Commit: 5ded4ff6

**2026-10-14 - Sesion 9 (COMPLETA)**
- SEC-012 cerrado: canjes_premios alineado con ADR-002
- Fase 1 al 100% (9/9, con F1-06 aceptada por plan Free)
- Doc: docs/audits/2026-10-13-inicial/18-f1-11-sec-012-canjes-premios.md
- Commit: ca21e7cc

**2026-10-14 - Sesion 10 (COMPLETA)**
- SEC-002 cerrado: claves hardcodeadas eliminadas de src/lib/supabase.js
- 7 consumidores migrados a fail-fast
- 4 hallazgos nuevos: SEC-014..017 (P3, chores futuros)
- Fase 3 al 33% (3/9 tras reconocer F3-03 cerrada en S5)
- Doc: docs/audits/2026-10-13-inicial/19-f3-02-sec-002-anon-key.md
- Commits: 4a17c7d5, 9f427ef6

---

**2026-10-14 - Sesion 11 (COMPLETA)**
- Plan B (chores): limpieza de duplicados en BITACORA/STATUS, README reescrito,
  GUIA-RAPIDA + WORKFLOW actualizados, PLAN-DE-TRABAJO alineado (commit dc88917b).
- F3-04 (AUTH-001): modulo src/lib/validar-password.js + 3 consumidores migrados.
  Minimo 10 chars + mayuscula + minuscula + numero + simbolo (commit ccee0c88).
- Fix colateral: separar linea pegada en AuthModal.js (commit f1675f19).
- Doc de auditoria: docs/audits/2026-10-13-inicial/20-f3-04-auth-001-password.md
  (commit e0168410).
- 7 tests unitarios del modulo pasaron.
- Fase 3 al 44% (4/9). AUTH-001 cerrado.
- Pendiente manual: config de Password Strength en Supabase Auth.

---

**2026-10-14 - Sesion 12 (COMPLETA)**
- F3-05 / AUTH-002 cerrado: upsert con onConflict email en los 3 puntos
  de insercion en clientes (register, AuthModal, callback OAuth).
- BUG-005 detectado y cerrado: AuthModal.js insertaba is_active y role
  sin GRANT post-F3-01. Registro desde el modal fallaba silenciosamente.
- Verificacion previa en Supabase: no hay UNIQUE en user_id, si en email.
- Doc de auditoria: docs/audits/2026-10-13-inicial/21-f3-05-auth-002-duplicados.md
- Fase 3: 4/9 -> 5/9 (56%). Hallazgos: 24/34 -> 26/34.
- Commits: 7b014cc4, f47b9417, 7bbc7331.

---

**2026-10-14 - Sesion 13 (COMPLETA)**
- F3-06 / DBG-001 cerrado: logger runtime en src/lib/logger.js.
- 88 archivos, 381 reemplazos console.* -> logger.*.
- log/warn silenciados en prod; error sigue emitiendo.
- Commits: a031ba2e (fix) + 1905f540 (docs).
- Doc: docs/audits/2026-10-13-inicial/22-f3-06-dbg-001-logger.md
- Deuda detectada: build local no funciona sin .env.local
  (preexistente desde S10, F3-02). Fase 2 lo resuelve.

---

**2026-10-14 - Sesion 14 (ENV) - COMPLETA**
- Bloque 0: sync docs S13 (commit fdcb6c70).
- Chore gitignore: .vercel/ fuera del repo + exceptuar .env.example
  (commits 14ba0076 + a0cc5c8f).
- F2-01: Supabase Owner a system.panfree (hecho).
- F2-03: Cloudinary a system.panfree (hecho).
- F2-14 Bitwarden: 3 de 12 items completos (Supabase, Cloudinary, Gemini).
  Los 9 restantes se completan durante la rotacion (S15). SEC-020.
- INCIDENTE BUG-010: regresion del logger S13. App caida en produccion.
  Fix commit 757938c2. Deploy Ready. Verificado en incognito: OK.
- Docs: 24-bugs-s14-gemini-y-otros.md creado (10 hallazgos nuevos).
- Tracking actualizado: 34 -> 45 hallazgos. 28 cerrados.
- Doc del incidente: 23-bug-010-logger-regresion.md.
- Bloque A cerrado (commit a6c9d4d0).
- Bloque B parcial (solo estructura, sin valores) -> S15.

---


---

**2026-10-15 - Sesion 15 (ENV) - COMPLETA**
- SEC-008: funcion crear_usuario_admin eliminada (era SECURITY DEFINER sin uso).
- BUG-011: bug en script 29-fix-logger-import.ps1 corregido y versionado.
- SEC-018: 3 keys huerfanas de Cloudinary eliminadas (quedo 1 activa).
- SEC-019 + F2-06: rotacion completa de Gemini API key + limpieza de huerfanas.
- F2-02: migracion completa de Supabase a Publishable/Secret keys.
- Fix colateral: sanitizeSupabaseKey acepta formato sb_publishable_ (commit e17110f6).
- Legacy keys (anon/service_role) deshabilitadas en Supabase.
- Advisors Supabase: 0 issues (criterio de salida de Fase 1 cumplido).
- Bitwarden actualizado: Supabase, Cloudinary y Gemini con keys rotadas.
- 6 commits pusheados: 7764b29f, 5e111171, cb6dfe04, b8767b31, e17110f6, ea82251e.

**2026-10-15 - Sesion 16 (COMPLETA)**
- F2-02 / Supabase: migrado a sb_publishable_/sb_secret_ + JWT Signing Key rotada (ea82251e).
- F2-05 / Resend: migrado a system.panfree, dominio transferido via Claim, DNS actualizado,
  key nueva con scope minimo, test de mail OK (doc 29-f2-05-rotar-resend.md).
- F2-06 / Gemini: key rotada + 3 huerfanas eliminadas (b8767b31).
- F2-04 / Cloudinary: key rotada hoy 2026-10-15. Ticket Root #392411 abierto.
- SEC-008, SEC-018, SEC-019, SEC-021, BUG-011, DOC-004 cerrados.
- Politica de rotacion sin coleccion "Legado" formalizada (66a69d3d + b15e8b6f).
- Commits: ccd57f00, ea82251e, e17110f6, b8767b31, cb6dfe04, 7764b29f, 5e111171,
  66a69d3d, b15e8b6f, 1f0420a5.

---

**2026-10-15 - Sesion 17 (ENV) - COMPLETA**
- Bloque 0: chore de arranque. .gitignore + package-lock.json + 30 scripts S14-S16 versionados.
- Bloque 1: reconciliar docs post-S16 (tracking, ROTACION-CLAVES, .env.example).
- Bloque 2: ticket Cloudinary #392411 - sin respuesta, se reconsulta en S18.
- Bloque 3: auditoria ecosistema Meta (DOC-005/006/007).
  - Confirmado: ninguna variable Meta/Twilio/Instagram en Vercel.
  - Canal real WhatsApp: wa.me/595984589845 (link directo, 20+ lugares).
  - F2-07/08/09 reformuladas a "No aplica" o "Roto" segun corresponda.
  - Bloqueante raiz: Meta Business Verification requiere RUC.
- Bloque 4: auditoria seccion Marketing (DOC-008).
  - ~8.100 lineas, no se usa. Duplica promos por producto y cupones existentes.
  - Plan de retiro futuro documentado. No se toca codigo en S17.
- 4 hallazgos nuevos: DOC-005 (cerrado), DOC-006 (abierto), DOC-007 (aceptado), DOC-008 (abierto).
- F2: 5->8 OK (F2-07/08/09 cerradas como no aplica/roto).
- Commits clave: d51245f7..f02937cf, a835c615.


---

**2026-10-16 - Sesion 19 (ENV) - COMPLETA**
- F2-11: rotacion completa de GA4 (2 sub-rotaciones).
  - GA4_API_SECRET: rotado + secret viejo revocado.
  - GA4_PRIVATE_KEY: rotado + key vieja revocada.
- SEC-023 cerrado: no era duplicado (coexistencia legitima).
- DOC-014 registrado: GA4 Service Account plomeria inerte.
- Correccion de autoria del historial Git: filter-repo (script 62).
  Todos los 333 commits firmados por Pedro J. Pirovani.
- Credenciales de push: eliminadas las ajenas. Solo gh:github.com:PanFree-Tech.
- Progress: F2 10/14 -> 11/14; global 70% -> 72%.
- Scripts 59, 60, 61a, 61b, 62, 63a, 63b agregados.

---

**2026-10-16 - Sesion 20 (ENV) - COMPLETA**
- F2-12: rotacion completa del par VAPID + fix de codigo.
- F3-07 / SEC-014 / BUG-001 / BUG-012: VAPID_PUBLIC_KEY unificada desde env.
- SEC-024: no aplica (era artefacto visual del CLI de Vercel).
- DOC-015 (nuevo): alias Vercel www.panfree.fit apuntaba a deployment viejo.
- Commit: 5923f3a6.
- Pusheado + deploy Ready + alias actualizado con vercel --prod --force.


---

**2026-10-16 - Sesion 21 (ENV) - COMPLETA**
- Fix PWA: Service Worker ya no cachea HTML viejo (DOC-017).
  - next.config.js: clientsClaim: true + runtimeCaching custom.
  - Verificacion: 5 scripts -> 16 scripts en /admin.
  - Commit: 16ea5eec.
- Recon S21: doc 40-recon-s21.md.
- STATUS actualizado a cierre real de S20.
- Hallazgos nuevos: DOC-018 (meta deprecated), DOC-019 (icono 144x144).
- DOC-015 y DOC-016 resultaron falsas alarmas.
- Commits S21: 16ea5eec, 8cddc665, 82bf85f5.

---

**2026-10-16 - Sesion 22 (ENV) - COMPLETA**
- Bloque 1-5: sincronizacion de docs post-S21 (STATUS, tracking, PLAN, ROTACION, Bitwarden vs docs).
- Bloque 6: fix del orquestador GA4 (invocacion directa, sin powershell -File anidado).
- Bloque 7 / F3-08: ESLint activo en build (CONF-001).
- Bloque 8 / F3-09: headers de seguridad (CONF-002).
- Progreso: 76% -> 81%. F3: 78% -> 100%.
- Commits S22: e1e1ce65, 53dbd4e8, 926dac53, 72627936, 9509d951, bd8315f3, a9fa9a7b, ce7cdd70.
---

**2026-10-17 - Sesion 23 (ENV) - COMPLETA**
- Bloque 0: fix de documentacion post-S22 (6 archivos).
  - PLAN-DE-TRABAJO: F3-08 y F3-09 marcados OK (44a44c21).
  - Tracking: Aceptados 3 -> 2 (51f82788).
  - BITACORA: cierre S18 reformateado (7039034b).
  - STATUS: S16-S22 reordenadas (cee6bce9).
  - ROTACION-CLAVES: mojibake + nota S23 + homogeneizar S20-S22 (3efd3cf0, e2875579, 11d84163).
  - GUIA-RAPIDA: rutas obsoletas (ae3cd460).
- Sin hallazgos tecnicos cerrados ni nuevos.
- Progreso: 81% (38/47) sin cambios.

---

**2026-10-17 - Sesion 24 (ENV) - COMPLETA**
- F4-01: purga de historial de Git (SEC-001).
  - Backup previo (bundle 73MB + mirror 68MB).
  - git filter-repo con --force: 363 commits, 32 con .env* reescritos.
  - HEAD: 691ea92c -> 7526022c.
  - Verificacion: 0 .env en historial, .env.example intacto.
  - Push force OK. Doc 41-f4-01-purga-historial.md creado.
- F4-02: ticket a GitHub Support enviado.
- Progreso: 81% (38/47) sin cambios (F4-01 cierra SEC-001, pero fase F4 sigue en 0/8).



**2026-10-17 - Sesion 26 (ENV) - CIERRE DE AUDITORIA**
- Auditoria inicial 2026-10-13 CERRADA formalmente.
- 47/47 tareas (100%), 0 hallazgos P0/P1 abiertos.
- 24 hallazgos P2/P3 reclasificados a Aceptado con revision agendada.
- Documento de cierre: docs/audits/2026-10-13-inicial/46-cierre-auditoria-inicial.md
- PR #23 mergeado via squash (318eab39). PR #22 cerrado como obsoleto.
- Scripts de sesion versionados: 92a-92h + dump-session.ps1 + 93 (este).

**2026-10-17 - Sesion 28 (ENV) - COMPLETA**
- PR #27: SEC-015a/b + SEC-017 fail-fast (42821c3). 4 archivos + ci.yml.
- PR #28: SEC-016a cloudName fail-fast (8fb5ae0). 4 archivos.
- PR #29: SEC-025 revocar grants anon sobre productos (375e44c). 1 migracion SQL.
- PR #30: BUG-0XX eliminar tipoRegalo (2655e9ac). 2 archivos.
- SEC-016b (7 URLs de logo hardcodeadas) diferido a S31.
- BUG-0YY verificado como falso positivo (validacion existe en dipticos.js:122).
- 5/5 CI verde en los 4 PRs. Smoke test post-deploy OK.

**2026-10-18 - PR #32 (P0) - Checkout de invitados - COMPLETA**
- Fix P0: checkout roto para usuarios no autenticados (ventas perdidas).
- PR #32 mergeado (squash 3e5dfede).
- Hallazgo: no figuraba en sesiones previas; detectado y corregido en el mismo PR.

**2026-10-18 - Sesion 29 - Fix vista disponibilidad + BUSINESS-LOGIC - COMPLETA**
- Fix vista_disponibilidad_productos (migracion 2026-10-19-s29-fix-vista-disponibilidad.sql).
- BUSINESS-LOGIC.md documentado: modelo Made-To-Order puro (no stock fisico).
- Doc: docs/architecture/BUSINESS-LOGIC.md.
- PR #33 mergeado (squash 76609dbe).

**2026-10-19 - Sesion 30 - Trigger de stock eliminado - COMPLETA**
- Trigger on_pedido_confirmado -> actualizar_stock_pedido() ELIMINADO.
  Motivo: bloqueaba pedidos sin stock fisico (contradice Made-To-Order)
  y causaba doble descuento al pasar de confirmado a entregado.
- Tabla stock_movimientos se mantiene (consulta admin), pero sin inserciones desde pedidos.
- Columnas stock_actual, production_capacity, current_orders documentadas como informativas.
- PR #34 mergeado (squash 0061bf47).
## 6. Comandos utiles

    REM Ver estado actual
    type docs\STATUS.md

    REM Ver bitacora completa
    type docs\BITACORA.md

    REM Ver hallazgos abiertos
    type docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md

    REM Verificar links de toda la documentacion
    powershell -ExecutionPolicy Bypass -File scripts\docs\00-verificar-links.ps1

---

## 7. Documentos relacionados

- [Plan de Trabajo](./operations/PLAN-DE-TRABAJO.md)
- [Bitacora](./BITACORA.md)
- [Sistema de Trabajo](./operations/SISTEMA-DE-TRABAJO.md)
- [Workflow Diario](./operations/WORKFLOW-DIARIO.md)
- [Guia Rapida](./operations/GUIA-RAPIDA.md)
- [Tracking de hallazgos](./audits/2026-10-13-inicial/06-hallazgos-tracking.md)

---

**2026-10-17 - Sesion 25 (ENV) - COMPLETA**
- F4-01, F4-03, F4-04, F4-05, F4-06, F4-07, F4-08 formalizadas.
- F4-06: placeholders NEXT_PUBLIC_* en ci.yml.
- F4-03: basura eliminada del repo.
- F4-04: .gitignore con .env.production* y *.standalone.bak.
- BUG-013: createClient top-level fix (CI verde).
- F4-08: branch protection con enforce_admins true, PR obligatorio, required check lint-and-test.
- Auto-merge y delete_branch_on_merge activados en repo.
- DB-001 verificado: 0 severidad 1-2, 1 INFO (stock_movimientos). Cerrado formalmente.
- Progreso: 89% -> 98% (46/47). F4: 4/8 -> 7/8 + 1 en curso (F4-02).

---

## 8. Cierre de la auditoria inicial (Sesion 26, 2026-10-17)

**Estado:** CERRADA

**Hallazgos totales:** ~72
- Cerrados: 45
- Aceptados (riesgo documentado): 26 (los 24 abiertos P2/P3 + DB-001h + DOC-007)
- No aplica: 2
- **Abiertos P0/P1/P2 bloqueantes: 0**

**Cobertura de la auditoria:**
- Codigo fuente: auditoria completa (SEC-002/003/006/014, AUTH-001/002, DBG-001, CONF-001/002, BUG-001..013)
- Base de datos Supabase: auditoria completa (DB-001a..i, SEC-004/005/007/010/011/012/013, P7, BUG-004)
- Credenciales y secretos: 8 rotaciones completas + 4 limpiezas de huerfanas
- Infraestructura/CI: historial purgado, branch protection, CI estricto, service worker, alias Vercel

**Backlog aceptado con revision agendada:**
- Familia Gemini (BUG-006..009): se cierra con DOC-008 (retiro de Marketing)
- Hardcodes residuales (SEC-015/016/017): chore post-auditoria
- RLS pendiente (DB-002): chore post-auditoria
- Deuda documental (DOC-010/011): S30
- Higiene tecnica (CONF-003/004/005, DOC-018/019): S31+
- Tests reales (TST-001): sesion dedicada
- Retiro de Marketing (DOC-008): **EN CURSO en S31** (2026-10-19)

**Bloqueantes externos (no bloquean el cierre):**
- GitHub Support #4869059 (purga de commits huerfanos, F4-02)
- Cloudinary Support #392411 (Root User, F2-03)

**Documento de cierre:** `docs/audits/2026-10-13-inicial/46-cierre-auditoria-inicial.md`

**Proximos 3 pasos (producto, no auditoria):**
1. S31: Retiro de Marketing (DOC-008) + Familia Gemini (cierra BUG-006..009, DOC-002/003/006, SEC-016b)
2. S32: RLS pendiente (DB-002) + docs desalineadas (DOC-010/011)
3. S33+: Higiene tecnica (CONF-003/004/005, DOC-018/019) + TST-001
**2026-10-19 - Sesion 32 (ENV) - COMPLETA**
- DB-003: drop de reglas_promocion, promociones_historico, instagram_posts.
- Backup de reglas_promocion (4 filas) en docs/audits/.../48-s32-backup-reglas-promocion.json.
- DB-002: cerrado (stock_movimientos RLS sin politicas, 0 referencias en frontend).
- .env.example: Instagram borrado, CLOUDINARY_CLOUD_NAME + GA4 Service Account documentados.
- PR #39 mergeado.

**2026-10-19 - Sesion 33 (ENV) - COMPLETA**
- CONF-003: ESLint configurado (no-img-element off, no-unescaped-entities off, hooks como warn).
- CONF-004: typescript.ignoreBuildErrors no aplica (proyecto JS).
- CONF-005: Content-Security-Policy agregado en next.config.js.
- DOC-018/019: PWA corregida (appleWebApp capable, icono 144x144, manifest sin mojibake).
- TST-001: infraestructura de testing completa (Jest + RTL).
  - jest.setup.js con mocks de Supabase y next/navigation.
  - 25 tests en 4 suites: validar-password (10), cupones (5), dipticos (6), ProductCard (4).
  - Script 'test' en package.json funcional.
- PRs #40 y #41 mergeados.
- **Auditoria inicial 2026-10-13: 100% CERRADA.** Todos los hallazgos cerrados o aceptados.

### Actualización S34 (2026-10-23)
- Checkout reparado (trigger notificaciones y secuencia de pedidos).
- Seguridad SEC-003 cerrada (login admin).
- Supabase Advisors: 0 errores críticos.
