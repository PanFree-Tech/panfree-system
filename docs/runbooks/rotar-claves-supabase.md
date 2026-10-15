# Runbook: Rotar Claves de Supabase

**Tiempo:** 15 minutos
**Riesgo:** Alto (usuarios se desloguean)

Nota: desde S16, la politica general de rotacion vive en
docs/operations/ROTACION-CLAVES.md. Este runbook es el detalle
especifico de Supabase.

## Pre-requisitos

- [ ] system.panfree es Owner de la org
- [ ] .env.local abierto
- [ ] Vercel abierto

## Pasos

1. Supabase - Settings - API - JWT Settings
2. Generate new JWT secret - Confirmar
3. Copiar keys anon y service_role nuevas
4. Actualizar .env.local
5. Guardar en Bitwarden (Produccion)
6. Actualizar Vercel
7. Redeploy
8. Verificar:
   - Home carga
   - Login funciona
   - /admin funciona
   - Pedido de prueba OK
9. Revocar las keys viejas en Supabase
10. Completar la nota del item de Bitwarden con:
    - Las keys viejas COMPLETAS.
    - Fecha de revocacion.
    - Estado: "revocadas".

## Rollback

Rotacion de emergencia (ver ROTACION-CLAVES.md):

1. Crear keys nuevas en Supabase.
2. Actualizar Vercel.
3. Redeploy.

Las keys comprometidas ya fueron revocadas en el paso 9; no se restauran.
