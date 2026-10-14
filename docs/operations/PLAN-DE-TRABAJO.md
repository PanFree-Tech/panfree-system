# Plan de Trabajo - PanFree System

**Version:** 1.0
**Fecha:** 2026-10-13
**Responsable:** Pedro J. Pirovani
**Estado:** En ejecucion

---

## 1. Vision

Dejar PanFree System en un estado **seguro, mantenible y auditable**, con:

- Base de datos sin vulnerabilidades conocidas (Supabase Advisors en verde)
- Claves rotadas y almacenadas en Bitwarden
- CI/CD configurado segun mejores practicas
- Documentacion completa y navegable
- Historico de cambios trazable

---

## 2. Estado actual

| Area | Estado |
|---|---|
| Documentacion | OK - Estructura docs/ creada |
| Repositorio | Sincronizado con origin/main |
| Base de datos | 250+ advisors de seguridad pendientes |
| Claves productivas | Sin rotar, algunas filtradas en historial |
| CI/CD | Workflows creados (modo tolerante) |
| Bitwarden | Organizacion PanFree creada |

---

## 3. Fases del proyecto

### Fase 0 - Preparacion y documentacion (en curso)

| ID | Tarea | Prioridad | Esfuerzo | Estado | DoD |
|---|---|---|---|---|---|
| F0-01 | Reorganizar documentacion | P1 | S | OK | Estructura docs/ creada |
| F0-02 | Plan de Trabajo | P0 | S | OK | Este documento |
| F0-03 | Politica CI/CD | P1 | S | En curso | Documento creado |
| F0-04 | Gestion de riesgos | P1 | S | En curso | Documento creado |
| F0-05 | Roadmap de remediacion | P1 | S | En curso | Documento creado |
| F0-06 | Criterios de aceptacion | P1 | S | En curso | Documento creado |

**Criterio de salida de Fase 0:** Los 6 documentos existen, estan commiteados y revisados.

### Fase 1 - Seguridad de base de datos (critico)

| ID | Tarea | Prioridad | Esfuerzo | Estado | DoD |
|---|---|---|---|---|---|
| F1-01 | Fix 3 vistas SECURITY DEFINER | P0 | M | Pendiente | Advisor deja de reportar |
| F1-02 | Fix politicas RLS Always True | P0 | M | Pendiente | Advisor deja de reportar |
| F1-03 | Restringir 4 funciones SECURITY DEFINER | P0 | S | Pendiente | Solo roles autorizados ejecutan |
| F1-04 | Fijar search_path de 3 funciones | P1 | S | Pendiente | SET search_path en cada funcion |
| F1-05 | Restringir bucket storage.productos | P1 | S | Pendiente | Bucket no permite listing |
| F1-06 | Habilitar Leaked Password Protection | P1 | S | Pendiente | Configurado en Auth settings |
| F1-07 | Optimizar ~60 politicas RLS (InitPlan) | P2 | L | Pendiente | Advisor deja de reportar |
| F1-08 | Consolidar ~150 politicas duplicadas | P2 | L | Pendiente | Advisor deja de reportar |
| F1-09 | Eliminar indices duplicados | P3 | S | Pendiente | Advisor deja de reportar |

**Criterio de salida de Fase 1:** Supabase Advisors muestra 0 issues de severidad 1-2.

### Fase 2 - Rotacion de claves y migracion de cuentas

| ID | Tarea | Prioridad | Esfuerzo | Estado | DoD |
|---|---|---|---|---|---|
| F2-01 | Migrar Supabase a system.panfree | P0 | S | Pendiente | system.panfree es Owner |
| F2-02 | Rotar JWT secret + keys Supabase | P0 | M | Pendiente | Vercel + local OK |
| F2-03 | Migrar Cloudinary a system.panfree | P1 | S | Pendiente | Imagenes se ven |
| F2-04 | Rotar Cloudinary API secret | P1 | S | Pendiente | Vercel + local OK |
| F2-05 | Rotar Resend API key | P1 | S | Pendiente | Mail de prueba OK |
| F2-06 | Rotar Gemini API key | P1 | S | Pendiente | Marketing IA funciona |
| F2-07 | Migrar Meta WhatsApp a system.panfree | P2 | M | Pendiente | WABA responde |
| F2-08 | Rotar Twilio auth token | P2 | S | Pendiente | WhatsApp fallback OK |
| F2-09 | Rotar Instagram access token | P2 | S | Pendiente | Publicacion funciona |
| F2-10 | Rotar n8n webhook token | P2 | S | Pendiente | Webhook responde |
| F2-11 | Rotar GA4 API secret | P3 | S | Pendiente | Metricas fluyen |
| F2-12 | Regenerar par VAPID | P3 | M | Pendiente | Push funciona |
| F2-13 | Auditar APIs IA secundarias | P3 | M | Pendiente | Usadas o eliminadas |
| F2-14 | Guardar .env consolidado en Bitwarden | P0 | S | Pendiente | Nota segura creada |

**Criterio de salida de Fase 2:** Todas las claves productivas estan en Bitwarden y en Vercel, ninguna filtra en codigo.

### Fase 3 - Correcciones de codigo

| ID | Tarea | Prioridad | Esfuerzo | Estado | DoD |
|---|---|---|---|---|---|
| F3-01 | SEC-003: admin por app_metadata | P0 | S | OK | Test con user normal rechazado |
| F3-02 | SEC-002: quitar claves hardcodeadas | P1 | S | OK | Sin valores reales en src/ |
| F3-03 | SEC-006: redirectTo por env var | P1 | S | OK | Usa NEXT_PUBLIC_SUPABASE_URL |
| F3-04 | AUTH-001: contrasenas fuertes | P1 | S | OK | Minimo 10 chars + complejidad |
| F3-05 | AUTH-002: registro sin duplicados | P1 | S | Pendiente | Upsert con onConflict |
| F3-06 | DBG-001: quitar console.log en prod | P2 | M | Pendiente | NODE_ENV condicional |
| F3-07 | BUG-001: fix NEXT_PUBLIC_VAPID_KEY | P2 | S | Pendiente | Variable consistente |
| F3-08 | CONF-001: ESLint en build | P2 | S | Pendiente | ignoreDuringBuilds: false |
| F3-09 | CONF-002: headers de seguridad | P2 | S | Pendiente | CSP, HSTS, X-Frame-Options |

**Criterio de salida de Fase 3:** Ningun hallazgo critico de codigo pendiente.

### Fase 4 - Limpieza y CI/CD estricto

| ID | Tarea | Prioridad | Esfuerzo | Estado | DoD |
|---|---|---|---|---|---|
| F4-01 | Purgar historial de Git | P0 | M | Pendiente | git filter-repo ejecutado |
| F4-02 | Ticket a GitHub Support | P0 | S | Pendiente | SHAs huerfanos eliminados |
| F4-03 | Eliminar archivos basura | P1 | S | Pendiente | test.txt, .bak eliminados |
| F4-04 | Actualizar .gitignore | P1 | S | Pendiente | .env.production* bloqueado |
| F4-05 | package-lock.json en repo | P1 | S | Pendiente | npm ci funciona |
| F4-06 | Configurar GitHub Secrets | P1 | S | Pendiente | CI corre build sin placeholders |
| F4-07 | CI estricto (sin continue-on-error) | P2 | S | Pendiente | PRs fallan si tests fallan |
| F4-08 | Branch protection en main | P2 | S | Pendiente | PR obligatorio para merge |

**Criterio de salida de Fase 4:** Repositorio limpio, CI en verde, historial sin secretos.

---

## 4. Prioridades

| Prioridad | Significado | SLA |
|---|---|---|
| P0 | Critico: seguridad o perdida de datos | 24-48 horas |
| P1 | Alto: bloquea otras tareas | 1 semana |
| P2 | Medio: mejora importante | 2-4 semanas |
| P3 | Bajo: nice to have | Cuando haya tiempo |

---

## 5. Reglas de trabajo

1. **Un commit por tarea.** No mezclar temas en un mismo commit.
2. **Conventional Commits.** Ver docs/06-referencias/convenciones-codigo.md
3. **Push a main con verificacion previa.** 
pm run build local debe pasar.
4. **DoD obligatorio.** No marcar tarea como OK sin cumplir el DoD.
5. **Documentar hallazgos.** Cada fix que cierra un ID se documenta en la auditoria.

---

## 6. Referencias

- [Auditoria inicial](../audits/2026-10-13-inicial/00-resumen-ejecutivo.md)
- [Plan de remediacion](../audits/2026-10-13-inicial/99-plan-remediacion.md)
- [Roadmap detallado](../audits/2026-10-13-inicial/04-roadmap.md)
- [Criterios de aceptacion](../audits/2026-10-13-inicial/05-criterios-aceptacion.md)
- [Politica CI/CD](./POLITICA-CI-CD.md)
- [Gestion de riesgos](./GESTION-DE-RIESGOS.md)