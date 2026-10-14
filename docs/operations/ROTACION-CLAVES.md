# Runbook: Rotacion de Claves

**Tiempo estimado:** 15-30 min por servicio
**Riesgo:** Medio (usuarios se desloguean)
**Horario:** Madrugada

## Pre-requisitos

- [ ] Bitwarden abierto
- [ ] Vercel abierto en Settings
- [ ] Acceso al dashboard del servicio

## Procedimiento

1. Guardar claves viejas en Bitwarden (Legado)
2. Rotar en el dashboard del servicio
3. Copiar claves nuevas
4. Guardar en Bitwarden (Produccion)
5. Actualizar .env.local
6. Actualizar Vercel
7. Redeploy
8. Verificar

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

Restaurar clave vieja desde Bitwarden (Legado), actualizar Vercel, redeploy.

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
en Bitwarden (Produccion) y la vieja en Bitwarden (Legado) en el
mismo flujo.

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
