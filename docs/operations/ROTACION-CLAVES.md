# Runbook: Rotacion de Claves

**Tiempo estimado:** 15-30 min por servicio
**Riesgo:** Medio (usuarios se desloguean)
**Horario:** Madrugada

## Pre-requisitos

- [ ] Bitwarden abierto
- [ ] Vercel abierto en Settings
- [ ] Acceso al dashboard del servicio

## Modelo de Bitwarden

- Una sola coleccion: Bitwarden -> Organizacion PanFree -> Produccion.
- No existe coleccion "Legado".
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
5. Meta WhatsApp
6. Twilio
7. Instagram
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
| 4 | Resend - Produccion | [S] | F2-05 |
| 5 | Meta WhatsApp - Produccion | [S] | F2-07 |
| 6 | Twilio - Produccion | [S] | F2-08 |
| 7 | Instagram - Produccion | [S] | F2-09 |
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
| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S15) | 3 keys huerfanas revocadas, quedo 1 activa |
| 3 | Gemini - Produccion | OK | 2026-10-15 (S15) | Key rotada + 3 huerfanas eliminadas |

### Items pendientes (9/12)

Se completan durante la rotacion en S16. La estrategia sigue siendo:
cuando se rote cada servicio, la key nueva se guarda en Bitwarden
(Produccion) en el mismo flujo.

| # | Item | Cuenta | Bloquea rotacion |
|---|---|---|---|
| 4 | Resend - Produccion | [S] | F2-05 |
| 5 | Meta WhatsApp - Produccion | [S] | F2-07 |
| 6 | Twilio - Produccion | [S] | F2-08 |
| 7 | Instagram - Produccion | [S] | F2-09 |
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
| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S15) | 3 keys huerfanas revocadas, quedo 1 activa |
| 3 | Gemini - Produccion | OK | 2026-10-15 (S15) | Key rotada + 3 huerfanas eliminadas |

### Items pendientes (9/12)

Se completan durante la rotacion en S16. La estrategia es:
rotar + verificar + revocar vieja + documentar en nota del item.

| # | Item | Cuenta | Bloquea rotacion |
|---|---|---|---|
| 4 | Resend - Produccion | [S] | F2-05 |
| 5 | Meta WhatsApp - Produccion | [S] | F2-07 |
| 6 | Twilio - Produccion | [S] | F2-08 |
| 7 | Instagram - Produccion | [S] | F2-09 |
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
- F2-04 (rotar Cloudinary) pendiente.
- Auditar 11 APIs IA secundarias (F2-13).
