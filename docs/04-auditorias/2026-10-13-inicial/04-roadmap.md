# Roadmap de Remediacion - Auditoria 2026-10-13

**Fecha inicio:** 2026-10-13
**Duracion estimada:** 3-4 semanas (a tiempo parcial)

---

## 1. Timeline

### Semana 1 (2026-10-13 a 2026-10-19)

**Objetivo:** completar Fase 0 y empezar Fase 1

| Dia | Tarea | Prioridad |
|---|---|---|
| Lun 13 | F0: docs reorganizados, plan de trabajo | P1 |
| Mar 14 | F1-01: fix vistas SECURITY DEFINER | P0 |
| Mie 15 | F1-02: fix RLS Always True | P0 |
| Jue 16 | F1-03: restringir funciones SECURITY DEFINER | P0 |
| Vie 17 | F1-04: search_path + F1-05: bucket Storage | P1 |
| Sab 18 | F1-06: Leaked Password Protection | P1 |
| Dom 19 | Descanso + revision | - |

### Semana 2 (2026-10-20 a 2026-10-26)

**Objetivo:** terminar Fase 1 y empezar Fase 2

| Dia | Tarea | Prioridad |
|---|---|---|
| Lun 20 | F1-07: optimizar politicas RLS | P2 |
| Mar 21 | F1-07 continuacion | P2 |
| Mie 22 | F1-08: consolidar politicas duplicadas | P2 |
| Jue 23 | F1-09: indices duplicados | P3 |
| Vie 24 | F2-01: migrar Supabase a system.panfree | P0 |
| Sab 25 | F2-02: rotar JWT secret + keys | P0 |
| Dom 26 | Descanso + verificacion | - |

### Semana 3 (2026-10-27 a 2026-11-02)

**Objetivo:** Fase 2 (rotacion de claves)

| Dia | Tarea | Prioridad |
|---|---|---|
| Lun 27 | F2-03 + F2-04: Cloudinary | P1 |
| Mar 28 | F2-05: Resend | P1 |
| Mie 29 | F2-06: Gemini | P1 |
| Jue 30 | F2-07: Meta WhatsApp | P2 |
| Vie 31 | F2-08 + F2-09: Twilio + Instagram | P2 |
| Sab 01 | F2-10 + F2-11: n8n + GA4 | P2 |
| Dom 02 | F2-12: VAPID + F2-13: APIs secundarias | P3 |

### Semana 4 (2026-11-03 a 2026-11-09)

**Objetivo:** Fase 3 (codigo) y Fase 4 (limpieza)

| Dia | Tarea | Prioridad |
|---|---|---|
| Lun 03 | F3-01: admin por app_metadata | P0 |
| Mar 04 | F3-02 + F3-03: quitar hardcoded | P1 |
| Mie 05 | F3-04 + F3-05: auth mejoras | P1 |
| Jue 06 | F3-06 + F3-07: console.log + VAPID bug | P2 |
| Vie 07 | F3-08 + F3-09: ESLint + headers | P2 |
| Sab 08 | F4-01 + F4-02: purgar historial + GitHub Support | P0 |
| Dom 09 | F4-03 a F4-08: limpieza + CI estricto | P1 |

---

## 2. Camino critico

Las tareas que **no se pueden posponer** porque bloquean otras:

1. **F0-02 (Plan de trabajo)** -> bloquea todo
2. **F1-01 a F1-03 (vistas + RLS + funciones)** -> bloquean uso seguro de la DB
3. **F2-01 (migrar Supabase)** -> bloquea rotacion de claves
4. **F2-02 (rotar JWT)** -> bloquea el resto de rotaciones
5. **F4-01 (purgar historial)** -> bloquea CI estricto

**Si algo se atrasa, priorizar estas.**

---

## 3. Hitos

| Hito | Fecha objetivo | Entregable |
|---|---|---|
| H1 - Docs completos | 2026-10-14 | 6 documentos creados |
| H2 - DB segura | 2026-10-22 | Advisors en verde |
| H3 - Claves rotadas | 2026-11-02 | Bitwarden + Vercel OK |
| H4 - Codigo limpio | 2026-11-07 | Hallazgos cerrados |
| H5 - Repositorio purgado | 2026-11-09 | CI estricto, historial limpio |

---

## 4. Estimacion de esfuerzo

| Fase | Esfuerzo | Horas estimadas |
|---|---|---|
| Fase 0 | S | 4-6 horas |
| Fase 1 | L | 15-20 horas |
| Fase 2 | L | 20-25 horas |
| Fase 3 | M | 10-12 horas |
| Fase 4 | M | 8-10 horas |
| **Total** | - | **57-73 horas** |

A tiempo parcial (2-3 horas/dia): ~3-4 semanas.

---

## 5. Dependencias
F0-02 (Plan)
|
v
F1-01 (Vistas) ---> F1-02 (RLS) ---> F1-03 (Funciones)
|
v
F2-01 (Migrar Supabase)
|
v
F2-02 (Rotar JWT)
|
+-------------------+-------------------+
| | |
v v v
F2-03 (Cloudinary) F2-05 (Resend) F2-06 (Gemini)
| | |
+-------------------+-------------------+
|
v
F3-01 (Admin)
|
v
F4-01 (Purgar Git)
|
v
F4-07 (CI estricto)

---

## 6. Notas

- **No trabajar los domingos.** Necesario para descansar.
- **Cada fix requiere verificacion end-to-end.** No solo "parece funcionar".
- **Documentar cada hallazgo cerrado.** Actualizar el 99-plan-remediacion.md.
- **Si algo se desvia del plan, actualizar este roadmap.**