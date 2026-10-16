# Estado del Proyecto - PanFree System

**Ultima actualizacion:** 2026-10-16 (fin Sesion 22)
**Fase actual:** Fase 2 (EN CURSO)
**Progreso global:** 81% (38 de 47 tareas)

---

## 1. Resumen por fase

| Fase | Tareas | OK | En curso | Pendiente | % |
|---|---|---|---|---|---|
| F0 - Preparacion | 7 | 7 | 0 | 0 | 100% |
| F1 - Seguridad DB | 9 | 9 | 0 | 0 | 100% |
| F2 - Rotacion claves | 14 | 13 | 0 | 1 | 93% |
| F3 - Codigo | 9 | 9 | 0 | 0 | 100% |
| F4 - Limpieza | 8 | 0 | 0 | 8 | 0% |
| **Total** | **47** | **38** | **0** | **9** | **81%** |

> **Nota Fase 1:** F1-06 (Leaked Password Protection) queda **Aceptada**
> por limitacion del plan Free de Supabase. No es un pendiente tecnico.
> Ver [tracking](./audits/2026-10-13-inicial/06-hallazgos-tracking.md).

---

## 2. Bloqueantes actuales

**Ninguno.**

---

## 3. Proximos 3 pasos

1. **F2-03** - Cloudinary Root User (reconsultar ticket #392411 desde 2026-10-18)
2. **F4-01** - Purgar historial de Git (SEC-001)
3. **F4-05** - Confirmar package-lock.json en repo

> **Nueva deuda S19:** los hashes de commits en docs son pre-reescritura.
> Ver nota en BITACORA (S19).

> **Nota:** el ticket Cloudinary #392411 (Root User) no es un paso activo.
> Depende de soporte externo (2-4 dias habiles desde 2026-10-15).
> Reconsultar a partir del **2026-10-18**.

## 4. Metricas clave

| Metrica | Hoy | Meta |
|---|---|---|
| Advisors Supabase severidad 1-2 | 7 | 0 |
| Advisors Supabase severidad 3 | 250+ | menos de 50 |
| Claves productivas rotadas | 6 / 12 | 12 / 12 |
| Claves en Bitwarden | 6 / 12 | 12 / 12 |
| Hallazgos cerrados | 44 / 72 | 72 / 72 |
| Documentos .md en docs/ | 30+ | 30+ (OK) |
| Commits de remediacion | ~59 | ~59 (OK) |

---

## 5. Ultima actividad

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
