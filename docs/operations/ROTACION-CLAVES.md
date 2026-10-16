# Runbook: Rotacion de Claves

**Tiempo estimado:** 15-30 min por servicio
**Riesgo:** Medio (usuarios se desloguean)
**Horario:** Madrugada

## Pre-requisitos

- [ ] Bitwarden abierto
- [ ] Vercel abierto en Settings
- [ ] Acceso al dashboard del servicio

## Modelo de Bitwarden

- Bitwarden -> Organizacion PanFree tiene 3 carpetas: Claves Personales,
  Desarrollo, Produccion.
- La carpeta Produccion es la fuente de verdad para claves productivas.
- No existe carpeta "Legado".
- El historial de rotaciones vive en la NOTA de cada item de Bitwarden.

## Procedimiento

1. Crear key nueva en el dashboard del servicio (mismo scope y dominio
   que la actual).
2. Guardar la key nueva en el item de Bitwarden (Produccion):
   campo de credencial + nota con fecha + tarea (F2-XX) + motivo.
3. Actualizar .env.local.
4. Actualizar Vercel (Production + Preview).
5. Redeploy.
6. Verificar: test empirico + Logs del servicio filtrados por la key nueva.
7. Revocar la key vieja en el dashboard del servicio.
8. Completar la nota del item de Bitwarden con:
   - La key vieja COMPLETA.
   - Fecha de revocacion.
   - Estado: "revocada".
9. Documentar en docs/audits/2026-10-13-inicial/XX-f2-XX-rotar-<servicio>.md.

## Orden

1. Supabase
2. Cloudinary
3. Resend
4. Gemini
5. Meta WhatsApp  [NO APLICA - ver DOC-005]
6. Twilio        [NO APLICA - ver DOC-005]
7. Instagram     [NO APLICA - ver DOC-006]
8. n8n
9. GA4
10. VAPID
11. Secrets internos
12. APIs secundarias

## Rollback

Rotacion de emergencia:

1. Crear key nueva en el dashboard.
2. Actualizar Vercel.
3. Redeploy.

La key comprometida ya fue revocada en el paso 7 del procedimiento;
no se restaura.

---

> **Nota S23:** las secciones S14 a S19 usan el termino "Coleccion"
> (terminologia legacy del setup inicial). A partir de S20 se usa el
> modelo correcto de 3 carpetas. Ver "Modelo de Bitwarden" al inicio
> de este documento para la politica vigente.

## Estado de Bitwarden al cierre de S14 (2026-10-14)

**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion

### Items completos (3/12)

| # | Item | Usuario | Estado | Fecha |
|---|---|---|---|---|
| 1 | Supabase - Produccion | system.panfree | OK | 2026-10-14 (S14) |
| 2 | Cloudinary - Produccion | system.panfree | OK | 2026-10-14 (S14) |
| 3 | Gemini - Produccion | system.panfree | OK | 2026-10-14 (S14) |

### Items pendientes (9/12)

Se completan **durante la rotacion** en S15. No se cargan ahora con
valores viejos: cuando se rote cada servicio, la key nueva se guarda
en Bitwarden (Produccion) y la vieja queda registrada en la nota del
mismo item, tras ser revocada en el dashboard.

| # | Item | Cuenta | Bloquea rotacion |
|---|---|---|---|
| 4 | Resend - Produccion | OK | 2026-10-15 (S16) | Migrado [C]->[S], dominio via Claim, key con scope minimo (F2-05, SEC-021, DOC-004) |
| 5 | Meta WhatsApp - Produccion | NO APLICA - DOC-005 | 2026-10-15 (S17) | Plomeria inerte. Canal real es wa.me. Ver 30-doc-meta-plomeria-inerte.md |
| 6 | Twilio - Produccion | NO APLICA - DOC-005 | 2026-10-15 (S17) | Plomeria inerte. Tokens nunca creados. Ver 30-doc-meta-plomeria-inerte.md |
| 7 | Instagram - Produccion | ROTO - DOC-006 | 2026-10-15 (S17) | Endpoints activos, tokens ausentes. Publicar manual. Ver 30-doc-meta-plomeria-inerte.md |
| 8 | n8n - Produccion | [S] | F2-10 |
| 9 | GA4 - Produccion | [S] | F2-11 |
| 10 | Clarity - Produccion | [S] | (no bloquea rotacion) |
| 11 | VAPID - Produccion | [S] | F2-12 |
| 12 | Secrets internos - Produccion (CRON_SECRET, WEBHOOK_SECRET) | [S] | F2-13 / F4-06 |

### Item pendiente: nota de auditoria (no rotable)

| Item | Tipo | Contenido |
|---|---|---|
| APIs IA secundarias - Auditoria | Nota segura | Lista de las 14 APIs (Anthropic, Mistral, Groq, etc.) sin valores. Solo para tracking de F2-13. |

### Hallazgo asociado

SEC-020: 9 items Bitwarden pendientes. Se resuelven como subproducto
de la rotacion en S15 (un servicio por commit).

---

## Estado de Bitwarden al cierre de S15 (2026-10-15)

**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion

### Items completos (3/12) - actualizados en S15

| # | Item | Estado | Fecha | Notas |
|---|---|---|---|---|
| 1 | Supabase - Produccion | OK | 2026-10-15 (S15) | Migrado a sb_publishable_/sb_secret_ + JWT Signing Key rotada |
| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S16) | 1 key rotada (F2-04) + 3 huerfanas revocadas. Ticket Root #392411 abierto. |
| 3 | Gemini - Produccion | OK | 2026-10-15 (S15) | Key rotada + 3 huerfanas eliminadas |

### Items pendientes (9/12)

Se completan durante la rotacion en S17. La estrategia sigue siendo:
cuando se rote cada servicio, la key nueva se guarda en Bitwarden
(Produccion) en el mismo flujo.

| # | Item | Cuenta | Bloquea rotacion |
|---|---|---|---|
| 4 | Resend - Produccion | OK | 2026-10-15 (S16) | Migrado [C]->[S], dominio via Claim, key con scope minimo (F2-05, SEC-021, DOC-004) |
| 5 | Meta WhatsApp - Produccion | NO APLICA - DOC-005 | 2026-10-15 (S17) | Plomeria inerte. Canal real es wa.me. Ver 30-doc-meta-plomeria-inerte.md |
| 6 | Twilio - Produccion | NO APLICA - DOC-005 | 2026-10-15 (S17) | Plomeria inerte. Tokens nunca creados. Ver 30-doc-meta-plomeria-inerte.md |
| 7 | Instagram - Produccion | ROTO - DOC-006 | 2026-10-15 (S17) | Endpoints activos, tokens ausentes. Publicar manual. Ver 30-doc-meta-plomeria-inerte.md |
| 8 | n8n - Produccion | [S] | F2-10 |
| 9 | GA4 - Produccion | [S] | F2-11 |
| 10 | Clarity - Produccion | [S] | (no bloquea rotacion) |
| 11 | VAPID - Produccion | [S] | F2-12 |
| 12 | Secrets internos - Produccion | [S] | F2-13 / F4-06 |

### Hallazgo SEC-020: actualizacion

En S15 se completaron 3 items mas (aunque los items 1, 2 y 3 ya existian,
se actualizaron con las keys rotadas). Los 9 items restantes siguen pendientes.
SEC-020 sigue abierto hasta completar los 9.

### Deuda tecnica detectada en S15

- **@supabase/auth-helpers-nextjs@0.15.0 deprecado** (paquete legacy).
  Migrar a @supabase/ssr en S16. No rompe el build, solo warnings.
- **11 APIs IA secundarias en Vercel sin documentar**: ANTHROPIC, MISTRAL,
  DEEPSEEK, COHERE, GROQ, CLOUDFLARE, POLLINATIONS, HF, AIHUBMIX, LEONARDO,
  AGNES. Auditar en F2-13.

---

## Estado de Bitwarden al cierre de S16 (2026-10-15)

**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion

### Politica vigente desde S16

- Una sola coleccion (Produccion). No existe "Legado".
- Cada item tiene una NOTA con el historial de rotaciones:
  key saliente COMPLETA + fecha de revocacion + tarea + motivo.
- Las keys salientes se revocan en el dashboard ANTES de completar la nota.

### Items completos (3/12)

| # | Item | Estado | Fecha | Notas |
|---|---|---|---|---|
| 1 | Supabase - Produccion | OK | 2026-10-15 (S15) | Migrado a sb_publishable_/sb_secret_ + JWT Signing Key rotada |
| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S16) | 1 key rotada (F2-04) + 3 huerfanas revocadas. Ticket Root #392411 abierto. |
| 3 | Gemini - Produccion | OK | 2026-10-15 (S15) | Key rotada + 3 huerfanas eliminadas |

### Items pendientes (9/12)

Se completan durante la rotacion en S17. La estrategia es:
rotar + verificar + revocar vieja + documentar en nota del item.

| # | Item | Cuenta | Bloquea rotacion |
|---|---|---|---|
| 4 | Resend - Produccion | OK | 2026-10-15 (S16) | Migrado [C]->[S], dominio via Claim, key con scope minimo (F2-05, SEC-021, DOC-004) |
| 5 | Meta WhatsApp - Produccion | NO APLICA - DOC-005 | 2026-10-15 (S17) | Plomeria inerte. Canal real es wa.me. Ver 30-doc-meta-plomeria-inerte.md |
| 6 | Twilio - Produccion | NO APLICA - DOC-005 | 2026-10-15 (S17) | Plomeria inerte. Tokens nunca creados. Ver 30-doc-meta-plomeria-inerte.md |
| 7 | Instagram - Produccion | ROTO - DOC-006 | 2026-10-15 (S17) | Endpoints activos, tokens ausentes. Publicar manual. Ver 30-doc-meta-plomeria-inerte.md |
| 8 | n8n - Produccion | [S] | F2-10 |
| 9 | GA4 - Produccion | [S] | F2-11 |
| 10 | Clarity - Produccion | [S] | (no bloquea rotacion) |
| 11 | VAPID - Produccion | [S] | F2-12 |
| 12 | Secrets internos - Produccion | [S] | F2-13 / F4-06 |

### Hallazgo SEC-020

Sigue abierto. Se cierra cuando los 9 items pendientes esten completos
(con keys rotadas, revocadas y documentadas en nota).

### Deuda tecnica al cierre de S16

- Migrar @supabase/auth-helpers-nextjs -> @supabase/ssr.
- (resuelto en S16) F2-04 Cloudinary: key rotada 2026-10-15.
- Auditar 11 APIs IA secundarias (F2-13).

---

## Estado de Bitwarden al cierre de S17 (2026-10-15)

**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion

### Cambios respecto a S16

En S17 no se roto ninguna key nueva. Se reformularon 3 tareas:

| # | Item | Estado S17 | Motivo |
|---|---|---|---|
| 5 | Meta WhatsApp - Produccion | NO APLICA | Plomeria inerte (DOC-005). Canal real es wa.me |
| 6 | Twilio - Produccion | NO APLICA | Plomeria inerte (DOC-005). Tokens nunca creados |
| 7 | Instagram - Produccion | ROTO | Endpoints activos, tokens ausentes (DOC-006). Publicar manual |

Ver docs/audits/2026-10-13-inicial/30-doc-meta-plomeria-inerte.md para el detalle completo.

### Items completos (4/12)

| # | Item | Estado | Fecha | Notas |
|---|---|---|---|---|
| 1 | Supabase - Produccion | OK | 2026-10-15 (S15) | sb_publishable_/sb_secret_ + JWT rotada |
| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S16) | 1 key rotada + 3 huerfanas revocadas. Ticket #392411 abierto |
| 3 | Gemini - Produccion | OK | 2026-10-15 (S15) | Key rotada + 3 huerfanas eliminadas |
| 4 | Resend - Produccion | OK | 2026-10-15 (S16) | Migrado [C]->[S], dominio via Claim, key con scope minimo |

### Items pendientes (8/12)

| # | Item | Cuenta | Bloquea rotacion |
|---|---|---|---|
| 5 | Meta WhatsApp - Produccion | NO APLICA | - (DOC-005) |
| 6 | Twilio - Produccion | NO APLICA | - (DOC-005) |
| 7 | Instagram - Produccion | ROTO | - (DOC-006) |
| 8 | n8n - Produccion | [S] | F2-10 |
| 9 | GA4 - Produccion | [S] | F2-11 |
| 10 | Clarity - Produccion | [S] | (no bloquea rotacion) |
| 11 | VAPID - Produccion | [S] | F2-12 |
| 12 | Secrets internos - Produccion | [S] | F2-13 / F4-06 |

### Hallazgo SEC-020

Sigue abierto. Se cierra cuando los items realmente rotables esten completos:
n8n, GA4, Clarity, VAPID, Secrets internos. Los items 5-6-7 se consideran cerrados
por decision (no aplica / roto documentado).

### Deuda tecnica al cierre de S17

- Migrar @supabase/auth-helpers-nextjs -> @supabase/ssr.
- Auditar 11 APIs IA secundarias (F2-14).
- Sistema simple de promociones en CartSidebar (backlog, ver DOC-008 seccion 9).
- Ocultar la seccion Marketing del menu admin (S17-B diferido).
- Limpieza de la seccion Marketing (~5.500-6.500 lineas candidatas a retiro, ver DOC-008).

---

## Estado de Bitwarden al cierre de S18 (2026-10-16)

**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion

### Cambios respecto a S17

En S18 no se roto ninguna key nueva. Se auditoron y eliminaron:

- 13 APIs IA secundarias (DOC-013).
- 3 secrets internos: CRON_SECRET, WEBHOOK_SECRET, REVALIDATE_SECRET (DOC-012).
- 1 variable basura: NEXT_PUBLIC_UPLOAD_PRESETNEXT_PUBLIC_UPLOAD_PRESET (SEC-022).

### Items completos (4/12)

| # | Item | Estado | Fecha | Notas |
|---|---|---|---|---|
| 1 | Supabase - Produccion | OK | 2026-10-15 (S15) | sb_publishable_/sb_secret_ + JWT rotada |
| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S16) | 1 key rotada + 3 huerfanas revocadas. Ticket #392411 abierto |
| 3 | Gemini - Produccion | OK | 2026-10-15 (S15) | Key rotada + 3 huerfanas eliminadas |
| 4 | Resend - Produccion | OK | 2026-10-15 (S16) | Migrado [C]->[S], dominio via Claim, key con scope minimo |

### Items pendientes (8/12)

| # | Item | Estado | Bloquea rotacion |
|---|---|---|---|
| 5 | Meta WhatsApp - Produccion | NO APLICA | DOC-005 |
| 6 | Twilio - Produccion | NO APLICA | DOC-005 |
| 7 | Instagram - Produccion | ROTO | DOC-006 |
| 8 | n8n - Produccion | NO APLICA | DOC-009 (plomeria inerte) |
| 9 | GA4 - Produccion | Pendiente | F2-11 |
| 10 | Clarity - Produccion | Pendiente | (no bloquea rotacion) |
| 11 | VAPID - Produccion | Pendiente | F2-12 |
| 12 | Secrets internos - Produccion | ELIMINADOS | DOC-012 (S18) |

---

## Estado de Bitwarden al cierre de S19 (2026-10-16)

**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion

### Cambios respecto a S18

En S19 se completo la rotacion de GA4 (F2-11), con 2 sub-rotaciones:

- GA4_API_SECRET: rotado (exposicion accidental + pendiente desde S18).
- GA4_PRIVATE_KEY: rotado (obligatorio; valor legacy irrecuperable).

Se creo el item "GA4 - Produccion" con 5 campos personalizados y nota
con historial completo de rotaciones.

### Items completos (5/12)

| # | Item | Estado | Fecha | Notas |
|---|---|---|---|---|
| 1 | Supabase - Produccion | OK | 2026-10-15 (S15) | sb_publishable_/sb_secret_ + JWT rotada |
| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S16) | 1 key rotada + 3 huerfanas revocadas. Ticket #392411 abierto |
| 3 | Gemini - Produccion | OK | 2026-10-15 (S15) | Key rotada + 3 huerfanas eliminadas |
| 4 | Resend - Produccion | OK | 2026-10-15 (S16) | Migrado [C]->[S], dominio via Claim, key con scope minimo |
| 9 | **GA4 - Produccion** | **OK** | **2026-10-16 (S19)** | **2 rotaciones (API secret + private key). Legacy recuperable + irrecuperable documentados** |

### Items pendientes (7/12)

| # | Item | Estado | Bloquea rotacion |
|---|---|---|---|
| 5 | Meta WhatsApp - Produccion | NO APLICA | DOC-005 |
| 6 | Twilio - Produccion | NO APLICA | DOC-005 |
| 7 | Instagram - Produccion | ROTO | DOC-006 |
| 8 | n8n - Produccion | NO APLICA | DOC-009 |
| 10 | Clarity - Produccion | Pendiente | (no bloquea rotacion) |
| 11 | VAPID - Produccion | Pendiente | F2-12 |
| 12 | Secrets internos - Produccion | ELIMINADOS | DOC-012 (S18) |

### Hallazgo SEC-020

Sigue abierto. Se cierra cuando los items realmente rotables
estan completos: GA4, Clarity, VAPID.

### Deuda tecnica al cierre de S19

- Migrar @supabase/auth-helpers-nextjs -> @supabase/ssr.
- Sistema simple de promociones en CartSidebar (DOC-008 seccion 9).
- Ocultar la seccion Marketing del menu admin.
- Limpieza de la seccion Marketing (~5.500-6.500 lineas, DOC-008).

---

## Estado de Bitwarden al cierre de S20 (2026-10-16)

**Carpetas:** Claves Personales, Desarrollo, Produccion
**Fuente de verdad:** Produccion

### Cambios respecto a S19

En S20 se completo la rotacion de VAPID (F2-12), ultimo item rotable
pendiente. Tambien se corrigio el codigo que consumia la clave
(F3-07, SEC-014, BUG-001, BUG-012).

### Items completos (6/12)

| # | Item | Estado | Fecha | Notas |
|---|---|---|---|---|
| 1 | Supabase - Produccion | OK | 2026-10-15 (S15) | sb_publishable_/sb_secret_ + JWT rotada |
| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S16) | 1 key rotada + 3 huerfanas. Ticket #392411 abierto |
| 3 | Gemini - Produccion | OK | 2026-10-15 (S15) | Key rotada + 3 huerfanas eliminadas |
| 4 | Resend - Produccion | OK | 2026-10-15 (S16) | Migrado [C]->[S], dominio via Claim |
| 9 | GA4 - Produccion | OK | 2026-10-16 (S19) | 2 rotaciones (API secret + private key) |
| 11 | **VAPID - Produccion** | **OK** | **2026-10-16 (S20)** | **Par rotado + fix de codigo. Par saliente: public recuperable, private irrecuperable** |

### Items pendientes (6/12)

| # | Item | Estado | Bloquea rotacion |
|---|---|---|---|
| 5 | Meta WhatsApp - Produccion | NO APLICA | DOC-005 |
| 6 | Twilio - Produccion | NO APLICA | DOC-005 |
| 7 | Instagram - Produccion | ROTO | DOC-006 |
| 8 | n8n - Produccion | NO APLICA | DOC-009 |
| 10 | Clarity - Produccion | Pendiente | (no bloquea rotacion) |
| 12 | Secrets internos - Produccion | ELIMINADOS | DOC-012 (S18) |

### Hallazgo SEC-020

Cerrado en S20. Los items realmente rotables estan completos:
Supabase, Cloudinary, Gemini, Resend, GA4, VAPID. Los items 5-6-7-8-12
son "No aplica" o "Eliminados" por decision documentada. El item 10
(Clarity) es la unica deuda menor, no bloqueante.

### Politica de env.local

Confirmado en S20: el archivo .env.local NO se mantiene en disco.
Se reconstruye on-demand desde Bitwarden cuando se necesita
desarrollo local. Esto reduce la superficie de exposicion.

### Incidente S20-01 (par VAPID expuesto en chat IA)

Par intermedio expuesto durante la generacion. Descartado sin cargarlo.
Par valido generado con Out-File directo a archivo. Regla 7.5 aplicada.
Documentado en doc 38-f2-12-rotar-vapid.md.

### Deuda tecnica al cierre de S20

- Rehacer 64b/64c en VS Code.
- Auditar DOC-015: alias Vercel apuntaba a deployment viejo.
- Migrar @supabase/auth-helpers-nextjs -> @supabase/ssr.
- Sistema simple de promociones en CartSidebar (DOC-008 seccion 9).
- Reconciliar doc Bitwarden (3 carpetas reales vs 1 en doc).
- Auditar items sueltos: panfree.fit, supabase.com.

---

## Estado de Bitwarden al cierre de S21 (2026-10-16)

**Carpetas:** Claves Personales, Desarrollo, Produccion
**Fuente de verdad:** Produccion

### Cambios respecto a S20

En S21 NO se roto ninguna clave. La sesion se dedico a:

- Fix del Service Worker (DOC-017, commit 16ea5eec).
- Recon S21 (doc 40-recon-s21.md).
- Descartar dos falsas alarmas: DOC-015 (alias Vercel apuntaba a
  deployment viejo) y DOC-016 (Supabase legacy en Vercel Ã¢â‚¬â€ era un
  artefacto visual del CLI de Vercel, no el valor real).

### Items completos (sin cambios respecto a S20, 6/12)

| # | Item | Estado | Fecha |
|---|---|---|---|
| 1 | Supabase - Produccion | OK | 2026-10-15 (S15) |
| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S16) |
| 3 | Gemini - Produccion | OK | 2026-10-15 (S15) |
| 4 | Resend - Produccion | OK | 2026-10-15 (S16) |
| 9 | GA4 - Produccion | OK | 2026-10-16 (S19) |
| 11 | VAPID - Produccion | OK | 2026-10-16 (S20) |

### Items "No aplica" o "Rotos" (sin cambios)

| # | Item | Estado |
|---|---|---|
| 5 | Meta WhatsApp - Produccion | NO APLICA (DOC-005) |
| 6 | Twilio - Produccion | NO APLICA (DOC-005) |
| 7 | Instagram - Produccion | ROTO (DOC-006) |
| 8 | n8n - Produccion | NO APLICA (DOC-009) |
| 10 | Clarity - Produccion | Pendiente (no bloqueante) |
| 12 | Secrets internos - Produccion | ELIMINADOS (DOC-012) |

### Hallazgo SEC-020

Cerrado en S20. Sin cambios en S21.

### Politica de env.local

Confirmada en S20, sin cambios en S21: el archivo .env.local NO se
mantiene en disco. Se reconstruye on-demand desde Bitwarden cuando
se necesita desarrollo local.

### Deuda tecnica al cierre de S21

Sin cambios respecto a S20:

- Rehacer 64b/64c en VS Code (diferido a S22).
- Reconciliar doc Bitwarden (3 carpetas reales vs 1 en doc).
- Auditar items sueltos: panfree.fit, supabase.com.
- Migrar @supabase/auth-helpers-nextjs -> @supabase/ssr.
- Sistema simple de promociones en CartSidebar (DOC-008 seccion 9).
- Ocultar la seccion Marketing del menu admin.
- Limpieza de la seccion Marketing (~5.500-6.500 lineas, DOC-008).

---

## Estado de Bitwarden al cierre de S22 (2026-10-16)

**Carpetas:** Claves Personales, Desarrollo, Produccion
**Fuente de verdad:** Produccion

### Cambios respecto a S21

En S22 NO se roto ninguna clave. La sesion se dedico a:
- Sincronizacion de documentacion post-S21.
- Fix del orquestador GA4 (deuda S20).
- F3-08: activar ESLint en build (CONF-001).
- F3-09: agregar headers de seguridad (CONF-002).

### Items completos (sin cambios, 6/12)

Supabase, Cloudinary, Gemini, Resend, GA4, VAPID.

### Items "No aplica" o "Rotos" (sin cambios)

Meta WhatsApp, Twilio, Instagram, n8n, Clarity, Secrets internos.

### Deuda tecnica al cierre de S22

- Rehacer 64b-reescribir-60 (auto-descubrimiento GA4).
- Auditar items sueltos: panfree.fit, supabase.com (logins de dashboards).
- Migrar @supabase/auth-helpers-nextjs -> @supabase/ssr.
- Sistema simple de promociones en CartSidebar (DOC-008 seccion 9).
- Ocultar seccion Marketing del menu admin.
- Limpieza de la seccion Marketing (~5.500-6.500 lineas, DOC-008).
