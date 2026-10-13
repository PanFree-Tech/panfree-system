# Tracking de Hallazgos - Auditoria 2026-10-13

**Ultima actualizacion:** 2026-10-13
**Total de hallazgos:** 22

---

## 1. Resumen

| Estado | Cantidad |
|---|---|
| Abierto | 21 |
| En curso | 0 |
| Cerrado | 1 |
| Aceptado | 0 |

---

## 2. Hallazgos por severidad

| Severidad | Cantidad | Cerrados |
|---|---|---|
| Critica | 6 | 1 |
| Alta | 8 | 0 |
| Media | 5 | 0 |
| Baja | 3 | 0 |

---

## 3. Tabla completa de hallazgos

### Hallazgos criticos

| ID | Titulo | Fase | Prioridad | Estado | Commit |
|---|---|---|---|---|---|
| SEC-001 | .env en historial Git | F4 | P0 | Abierto | - |
| SEC-003 | Admin por user_metadata | F3 | P0 | Abierto | - |
| DB-001 | 250+ advisors Supabase | F1 | P0 | Abierto | - |
| DB-001a | Vistas SECURITY DEFINER | F1 | P0 | Cerrado | (pendiente) |
| DB-001b | Politicas RLS Always True | F1 | P0 | Abierto | - |
| DB-001c | Funciones SECURITY DEFINER publicas | F1 | P0 | Abierto | - |

### Hallazgos altos

| ID | Titulo | Fase | Prioridad | Estado | Commit |
|---|---|---|---|---|---|
| SEC-002 | DEFAULT_SUPABASE_ANON_KEY hardcodeada | F3 | P1 | Abierto | - |
| SEC-006 | redirectTo hardcodeado | F3 | P1 | Abierto | - |
| AUTH-001 | Contrasenas debiles | F3 | P1 | Abierto | - |
| AUTH-002 | Registro sin validar duplicados | F3 | P1 | Abierto | - |
| DBG-001 | console.log con datos sensibles | F3 | P1 | Abierto | - |
| DB-001d | Bucket Storage listable | F1 | P1 | Abierto | - |
| DB-001g | Funciones con search_path mutable | F1 | P1 | Abierto | - |
| DB-001h | Leaked Password Protection | F1 | P1 | Abierto | - |

### Hallazgos medios

| ID | Titulo | Fase | Prioridad | Estado | Commit |
|---|---|---|---|---|---|
| BUG-001 | NEXT_PUBLIC_VAPID_KEY inconsistente | F3 | P2 | Abierto | - |
| CONF-001 | ESLint ignorado en build | F3 | P2 | Abierto | - |
| CONF-002 | Sin headers de seguridad | F3 | P2 | Abierto | - |
| DB-001e | ~60 politicas RLS sin optimizar | F1 | P2 | Abierto | - |
| DB-001f | ~150 politicas duplicadas | F1 | P2 | Abierto | - |

### Hallazgos bajos

| ID | Titulo | Fase | Prioridad | Estado | Commit |
|---|---|---|---|---|---|
| DB-001i | Indices duplicados | F1 | P3 | Abierto | - |
| TST-001 | Cobertura de tests baja | F4 | P3 | Abierto | - |
| DOC-001 | Falta PropTypes/JSDoc | F4 | P3 | Abierto | - |

---

## 4. Como cerrar un hallazgo

1. **Fix aplicado** en codigo o DB
2. **DoD cumplido** (ver 05-criterios-aceptacion.md)
3. **Commit pusheado** con prefijo security:/fix:/refactor:
4. **Actualizar este archivo:**
   - Cambiar Estado: Abierto -> Cerrado
   - Agregar hash del commit
5. **Actualizar STATUS.md** (contador de hallazgos cerrados)

---

## 5. Estados posibles

| Estado | Significado |
|---|---|
| Abierto | Identificado, sin fix |
| En curso | Fix en desarrollo |
| Cerrado | Fix aplicado, verificado, documentado |
| Aceptado | Riesgo aceptado, no se fixea (con justificacion) |

---

## 6. Referencias

- [Resumen ejecutivo](./00-resumen-ejecutivo.md)
- [Criterios de aceptacion](./05-criterios-aceptacion.md)
- [Plan de remediacion](./99-plan-remediacion.md)
- [Advisors de Supabase](./02-supabase-advisors.md)