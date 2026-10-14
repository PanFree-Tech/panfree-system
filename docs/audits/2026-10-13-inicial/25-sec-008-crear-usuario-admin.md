# SEC-008 - Eliminar funcion sin uso crear_usuario_admin

**Fecha:** 2026-10-14
**Hallazgo:** SEC-008
**Severidad:** Media (P2)
**Estado:** Cerrado
**Sesion:** 15
**Origen:** Detectado en handoff de Sesion 5, nunca formalizado en tracking.

---

## 1. Contexto

En el handoff de la Sesion 5 (script 12-handoff-sesion-5.ps1) se detecto
la funcion `public.crear_usuario_admin(text, text)` como posible hallazgo
critico (SEC-008), pero nunca se formalizo en el tracking. La tarea paso
a "pendiente de verificar en Sesion 6" y quedo sin cerrar.

En S15 se retomo el hallazgo y se verifico su estado real.

---

## 2. Diagnostico

### 2.1 Definicion original

```sql
CREATE OR REPLACE FUNCTION public.crear_usuario_admin(p_email text, p_password text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO auth.users (...)
  VALUES (...)
  RETURNING id INTO v_user_id;
  RETURN v_user_id;
END;
$function$
```

### 2.2 Estado de permisos (proacl)

```
{postgres=X/postgres,service_role=X/postgres}
```

**Interpretacion:** solo `postgres` y `service_role` tienen EXECUTE.
`anon` y `authenticated` **NO** pueden invocarla via RPC (ya bloqueado
por F1-03).

### 2.3 Problemas detectados

1. **No valida al caller.** Sin chequeo de quien la ejecuta.
2. **No registra en logs_auditoria.** Viola ARCHITECTURE.md seccion 5.1.
3. **Acepta password en texto plano** como parametro.
4. **Marca email_confirmed_at = NOW()** sin verificacion.
5. **No crea registro en public.clientes** (inconsistencia potencial).
6. **Nunca estuvo en el tracking formal.** Trazabilidad perdida desde S5.

### 2.4 Verificacion de uso (2026-10-14)

Grep en el repositorio:

```powershell
Get-ChildItem -Path src -Recurse -File -Include *.js,*.jsx |
    Select-String -Pattern 'crear_usuario_admin'
```

**Resultado:** 0 referencias en `src/`.

```powershell
Get-ChildItem -Path scripts,supabase -Recurse -File -Include *.ps1,*.sql |
    Select-String -Pattern 'crear_usuario_admin'
```

**Resultado:** 4 referencias, todas dentro de
`scripts/docs/12-handoff-sesion-5.ps1` (autorreferencias del handoff).

Ninguna referencia en codigo de produccion ni en migraciones versionadas.

### 2.5 Reclasificacion de severidad

El handoff de S5 la marco como **Critica (P0)**, pero esa estimacion fue
preliminar, sin verificar `proacl`. Con la evidencia real (2026-10-14):

- **NO es explotable hoy** (proacl restringido a service_role).
- **NO tiene uso** en codigo de produccion.
- **Es inconsistente** con ADR-002 y ARCHITECTURE.md seccion 5.1.

**Severidad real: Media (P2).**

---

## 3. Decision

**Eliminar la funcion.**

Justificacion:
- No tiene uso en codigo de produccion (verificado).
- Es SECURITY DEFINER sin defensa en profundidad.
- Es superficie de ataque innecesaria.
- Es la opcion mas limpia: menos codigo = menos superficie.
- Si en el futuro se necesita crear usuarios admin, se hara desde el
  Dashboard de Supabase o desde un endpoint server-side bien disenado.

---

## 4. Fix aplicado

### 4.1 SQL

```sql
DROP FUNCTION IF EXISTS public.crear_usuario_admin(text, text);
```

### 4.2 Evidencia (SQL Editor, 2026-10-14)

**Ejecucion del DROP:**
```
Success. No rows returned
```

**Verificacion 1 - La funcion no existe:**

```sql
SELECT proname, prosecdef, proacl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'crear_usuario_admin';
```

Resultado: `Success. No rows returned`

**Verificacion 2 - Ninguna otra funcion la invoca:**

```sql
SELECT proname, prosrc
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosrc LIKE '%crear_usuario_admin%'
  AND p.proname <> 'crear_usuario_admin';
```

Resultado: `Success. No rows returned`

---

## 5. Impacto

### Seguridad

- SEC-008 cerrado.
- Reduccion de superficie de ataque (una funcion SECURITY DEFINER menos).
- Consistencia con ADR-002: ninguna funcion privilegiada sin defensa.

### Funcionalidad

- Sin regresiones: la funcion no estaba en uso.
- Sin dependencias ocultas (verificado por query).

---

## 6. Rollback

Si en el futuro se necesita restaurar la funcion:

```sql
CREATE OR REPLACE FUNCTION public.crear_usuario_admin(p_email text, p_password text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO auth.users (...)
  VALUES (...)
  RETURNING id INTO v_user_id;
  RETURN v_user_id;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.crear_usuario_admin(text, text)
  FROM anon, authenticated, public;
```

**NO RECOMENDADO:** reintroduce la superficie de ataque innecesaria.

---

## 7. DoD (SEC-008)

- [x] Diagnostico completo (definicion, proacl, uso en codigo).
- [x] Verificacion de uso: 0 referencias en src/.
- [x] Reclasificacion de severidad (Critica -> Media, con evidencia).
- [x] Decision justificada (eliminar).
- [x] Fix aplicado en DB (DROP FUNCTION).
- [x] Verificacion POST 1: funcion no existe.
- [x] Verificacion POST 2: sin dependencias ocultas.
- [x] Doc de auditoria generado (este archivo).
- [x] Tracking actualizado (SEC-008 -> Cerrado).
- [ ] Commit pusheado con security(db):

---

## 8. Referencias

- [SEC-008 en tracking](./06-hallazgos-tracking.md)
- [Handoff Sesion 5](../../../scripts/docs/12-handoff-sesion-5.ps1)
- [ADR-002 - app_metadata](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)
- [ARCHITECTURE.md seccion 5.1](../../architecture/ARCHITECTURE.md)
- [F1-03 - Restringir funciones SECURITY DEFINER](./09-f1-03-fix-funciones-security-definer.md)
