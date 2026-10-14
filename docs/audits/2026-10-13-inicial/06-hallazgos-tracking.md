# Tracking de Hallazgos - Auditoria 2026-10-13

**Ultima actualizacion:** 2026-10-14 (fin Sesion 13)
**Total de hallazgos:** 34

---

## 1. Resumen

| Estado | Cantidad |
|---|---|
| Abierto | 6 |
| En curso | 0 |
| Cerrado | 27 |
| Aceptado | 1 |

---

## 2. Hallazgos por severidad

| Severidad | Cantidad | Cerrados |
|---|---|---|
| Critica | 8 | 6 |
| Alta | 11 | 7 |
| Media | 8 | 4 |
| Baja | 4 | 1 |

---

## 3. Tabla completa de hallazgos

### Hallazgos criticos

| ID | Titulo | Fase | Prioridad | Estado | Commit |
|---|---|---|---|---|---|
| SEC-001 | .env en historial Git | F4 | P0 | Abierto | - |
| SEC-003 | Admin por user_metadata | F3 | P0 | Cerrado | e5bed103 |
| DB-001 | 250+ advisors Supabase | F1 | P0 | Abierto | - |
| DB-001a | Vistas SECURITY DEFINER | F1 | P0 | Cerrado | 8c5b311a |
| DB-001b | Politicas RLS Always True | F1 | P0 | Cerrado | fea87bb2 |
| DB-001c | Funciones SECURITY DEFINER publicas | F1 | P0 | Cerrado | 542e3a2e |
| SEC-004 | UPDATE clientes.role desde cliente | F3 | P0 | Cerrado | 4d5bd9c2 |
| SEC-005 | anon con DDL sobre clientes | F3 | P0 | Cerrado | 4d5bd9c2 |

### Hallazgos altos

| ID | Titulo | Fase | Prioridad | Estado | Commit |
|---|---|---|---|---|---|
| SEC-002 | DEFAULT_SUPABASE_ANON_KEY hardcodeada | F3 | P1 | Cerrado | 4a17c7d5 |
| SEC-006 | redirectTo hardcodeado | F3 | P1 | Cerrado | 4d5bd9c2 |
| SEC-007 | INSERT clientes.role desde frontend | F3 | P1 | Cerrado | 4d5bd9c2 |
| SEC-011 | email_logs SELECT true para authenticated | F1/F3 | P1 | Cerrado | (Sesion 8) |
| SEC-013 | email_logs INSERT permisiva para authenticated | F1/F3 | P2 | Cerrado | (Sesion 8) |
| AUTH-001 | Contrasenas debiles | F3 | P1 | Cerrado | ccee0c88 |
| AUTH-002 | Registro sin validar duplicados | F3 | P1 | Cerrado | 7b014cc4 + f47b9417 |
| DBG-001 | console.log con datos sensibles | F3 | P1 | Cerrado | a031ba2e |
| DB-001d | Bucket Storage listable | F1 | P1 | Cerrado | 326d4edd |
| DB-001g | Funciones con search_path mutable | F1 | P1 | Cerrado | 3e500e77 |
| DB-001h | Leaked Password Protection | F1 | P1 | Aceptado | (plan Free) |
| P7 | 3 politicas con auth.jwt() raiz | F3 | P1 | Cerrado | 4d5bd9c2 |

### Hallazgos medios

| ID | Titulo | Fase | Prioridad | Estado | Commit |
|---|---|---|---|---|---|
| BUG-001 | NEXT_PUBLIC_VAPID_KEY inconsistente | F3 | P2 | Abierto | - |
| BUG-002 | route.js inserta avatar (columna avatar_url) | F3 | P2 | Cerrado | 4d5bd9c2 |
| CONF-001 | ESLint ignorado en build | F3 | P2 | Abierto | - |
| CONF-002 | Sin headers de seguridad | F3 | P2 | Abierto | - |
| DB-001e | ~60 politicas RLS sin optimizar | F1 | P2 | Cerrado | 02311b72 |
| DB-001f | ~150 politicas duplicadas | F1 | P2 | Cerrado | e40d9244 |
| SEC-010 | select_publico_productos exponia inactivos (leak) | F1 | P2 | Cerrado | e40d9244 |
| SEC-012 | canjes_premios usa clientes.role en vez de is_admin() | F3 | P2 | Cerrado | (Sesion 9) |

### Hallazgos bajos

| ID | Titulo | Fase | Prioridad | Estado | Commit |
|---|---|---|---|---|---|
| BUG-003 | diptico/[codigo] usa .eq('activo') en vez de is_active | F3 | P3 | Abierto | - |
| SEC-014 | VAPID key hardcodeada en src/app/admin/page.js | F3 | P3 | Abierto | - |
| SEC-015 | URL Supabase hardcodeada en notificar-estado/route.js y notificaciones.js | F3 | P3 | Abierto | - |
| SEC-016 | Cloudinary cloud name hardcodeado en 4 lugares | F3 | P3 | Abierto | - |
| SEC-017 | GA4 Measurement ID hardcodeado en ga4/measurement/route.js | F3 | P3 | Abierto | - |
| BUG-004 | test-email y resend-webhook usaban cliente sin privilegios | F3 | P2 | Cerrado | (Sesion 8) |
| DB-001i | Indices duplicados | F1 | P3 | **Cerrado** | d6957a61 |
| TST-001 | Cobertura de tests baja | F4 | P3 | Abierto | - |
| DOC-001 | Falta PropTypes/JSDoc | F4 | P3 | Abierto | - |
| BUG-005 | AuthModal inserta columnas sin GRANT post-F3-01 | F3 | P2 | Cerrado | 7b014cc4 |

---

## 4. Como cerrar un hallazgo

1. **Fix aplicado** en codigo o DB.
2. **DoD cumplido.**
3. **Commit pusheado** con prefijo `security:`/`fix:`/`refactor:`.
4. **Actualizar este archivo:** Estado -> Cerrado + hash del commit.
5. **Actualizar STATUS.md** (contador de hallazgos cerrados).

---

## 5. Estados posibles

| Estado | Significado |
|---|---|
| Abierto | Identificado, sin fix |
| En curso | Fix en desarrollo |
| Cerrado | Fix aplicado, verificado, documentado |
| Aceptado | Riesgo aceptado, no se fixea |

---

## 6. Referencias

- [Resumen ejecutivo](./00-resumen-ejecutivo.md)
- [Criterios de aceptacion](./05-criterios-aceptacion.md)
- [Plan de remediacion](./99-plan-remediacion.md)
- [Advisors de Supabase](./02-supabase-advisors.md)
- [F1-07 InitPlan](./13-f1-07-rls-initplan.md)
- [F1-08 Consolidacion](./15-f1-08-consolidacion-rls.md)






