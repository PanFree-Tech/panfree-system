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
