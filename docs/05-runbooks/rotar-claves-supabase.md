# Runbook: Rotar Claves de Supabase

**Tiempo:** 15 minutos
**Riesgo:** Alto (usuarios se desloguean)

## Pre-requisitos

- [ ] system.panfree es Owner de la org
- [ ] Claves viejas en Bitwarden (Legado)
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
8. Verificar
   - Home carga
   - Login funciona
   - /admin funciona
   - Pedido de prueba OK

## Rollback

Restaurar claves viejas desde Bitwarden (Legado), actualizar Vercel, redeploy.
