# F3-05 / AUTH-002 - Registro sin validar duplicados

**Fecha:** 2026-10-14
**Hallazgos:** AUTH-002 + BUG-005 (nuevo)
**Tarea:** F3-05
**Severidad:** Alta (AUTH-002) / Media (BUG-005)
**Estado:** Cerrado
**Esfuerzo:** S (Small)

---

## 1. Contexto

AUTH-002 (Alta) se registro en la auditoria inicial (2026-10-13): el registro
de clientes no validaba duplicados. Habia 3 puntos de insercion en la tabla
public.clientes con logicas distintas entre si.

Durante el diagnostico (Sesion 12) se detecto ademas BUG-005: el INSERT de
AuthModal.js incluia columnas is_active y role que, post-F3-01, no tienen
GRANT para el rol authenticated. El flujo de registro desde el modal estaba
roto silenciosamente en produccion.

Referencia: ADR-002 define que el rol solo se escribe desde el backend.

---

## 2. Diagnostico

### 2.1 Puntos de insercion en clientes (antes del fix)

| # | Archivo | Metodo | Idempotente |
|---|---|---|---|
| 1 | src/app/register/page.js | insert() | No |
| 2 | src/components/AuthModal.js | insert() | No |
| 3 | src/app/auth/callback/route.js | SELECT + insert() condicional | Parcial |

### 2.2 Hallazgo clave: no hay UNIQUE en user_id

Query ejecutada en el SQL Editor de Supabase:

```sql
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.clientes'::regclass AND contype IN ('u','p');
```

Resultado:

| Constraint | Tipo | Definicion |
|---|---|---|
| clientes_pkey | PK | PRIMARY KEY (id) |
| clientes_email_key | UNIQUE | UNIQUE (email) |

Conclusion: no hay UNIQUE en user_id. Se usa onConflict email, que es la
columna natural de idempotencia (un email = una cuenta).

### 2.3 GRANTs de authenticated sobre clientes

authenticated tiene INSERT permitido en: avatar_url, direccion_*, email,
foto_url, lat, lng, nombre_completo, notas_cliente, prefiere_delivery,
prefiere_retiro, telefono, user_id.

NO tiene INSERT en: id, created_at, is_active, nivel_cliente,
puntos_fidelidad, role, updated_at.

Conclusion (BUG-005): el INSERT de AuthModal.js con is_active true y role
cliente fallaba con error de permiso denegado. El try/catch lo capturaba
pero no lo diferenciaba de otros errores.

---

## 3. Fix aplicado

### 3.1 Estrategia

- Reemplazar insert() por upsert con onConflict email en los 3 puntos.
- BUG-005: quitar is_active true y role cliente del INSERT de AuthModal.
- NO se modifica callback/route.js para quitar el SELECT previo.

### 3.2 Commits

- 7b014cc4 security(auth): evitar duplicados en registro y alinear AuthModal
- f47b9417 fix(auth): completar F3-05 en callback OAuth (AUTH-002)

El segundo commit existe porque el script inicial no matcheo el bloque de
callback/route.js (strings con caracteres no-ASCII en el script, mismo
problema documentado en S11). El fix se completo con un comando PowerShell
puntual, sin amend ni force push.

---

## 4. Verificacion

- register/page.js:73     upsert con onConflict email
- AuthModal.js:125        upsert con onConflict email
- callback/route.js       upsert con onConflict email
- AuthModal sin is_active true ni role cliente

---

## 5. Nota para Fase 2 / auditorias futuras

public.clientes.user_id NO tiene UNIQUE constraint. Relevante para:

- F2-02 (rotacion JWT): conviene agregarla como defensa en profundidad.
- Futuras auditorias: la columna de identidad real es email (UNIQUE).

No se agrega UNIQUE en user_id en esta sesion para no agrandar el scope.
Queda registrado como deuda tecnica.

---

## 6. DoD (F3-05 / AUTH-002 / BUG-005)

- [x] register/page.js migrado a upsert con onConflict email.
- [x] AuthModal.js migrado a upsert + BUG-005 corregido.
- [x] callback/route.js migrado a upsert.
- [x] Commit del fix: 7b014cc4.
- [x] Commit correctivo: f47b9417.
- [x] Doc de auditoria generado (este archivo).
- [x] Tracking actualizado: AUTH-002 -> Cerrado, BUG-005 -> nuevo + Cerrado.

---

## 7. Referencias

- AUTH-002 en tracking: ./06-hallazgos-tracking.md
- ADR-002: ../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md
- F3-04 doc de referencia: ./20-f3-04-auth-001-password.md
