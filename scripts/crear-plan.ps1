# crear-plan.ps1
# Crea los documentos del Plan de Trabajo y hace commit automatico
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\crear-plan.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\crear-plan.ps1 -NoCommit

param(
    [switch]$NoCommit
)

$ErrorActionPreference = "Stop"

# Ir a la raiz del repo
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $RepoRoot

Write-Host "=== Creando documentos del Plan de Trabajo ===" -ForegroundColor Cyan

# Funcion auxiliar: escribe archivo SIN BOM
function Write-FileNoBom {
    param(
        [string]$Path,
        [string]$Content
    )
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText((Join-Path (Get-Location) $Path), $Content, $utf8NoBom)
    Write-Host "[OK] $Path" -ForegroundColor Green
}

# ============================================================================
# 1. PLAN DE TRABAJO
# ============================================================================
$content = @"
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
| F3-01 | SEC-003: admin por app_metadata | P0 | S | Pendiente | Test con user normal rechazado |
| F3-02 | SEC-002: quitar claves hardcodeadas | P1 | S | Pendiente | Sin valores reales en src/ |
| F3-03 | SEC-006: redirectTo por env var | P1 | S | Pendiente | Usa NEXT_PUBLIC_SUPABASE_URL |
| F3-04 | AUTH-001: contrasenas fuertes | P1 | S | Pendiente | Minimo 10 chars + complejidad |
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
3. **Push a main con verificacion previa.** `npm run build` local debe pasar.
4. **DoD obligatorio.** No marcar tarea como OK sin cumplir el DoD.
5. **Documentar hallazgos.** Cada fix que cierra un ID se documenta en la auditoria.

---

## 6. Referencias

- [Auditoria inicial](../04-auditorias/2026-10-13-inicial/00-resumen-ejecutivo.md)
- [Plan de remediacion](../04-auditorias/2026-10-13-inicial/99-plan-remediacion.md)
- [Roadmap detallado](../04-auditorias/2026-10-13-inicial/04-roadmap.md)
- [Criterios de aceptacion](../04-auditorias/2026-10-13-inicial/05-criterios-aceptacion.md)
- [Politica CI/CD](./POLITICA-CI-CD.md)
- [Gestion de riesgos](./GESTION-DE-RIESGOS.md)
"@
Write-FileNoBom -Path "docs/02-operaciones/PLAN-DE-TRABAJO.md" -Content $content

# ============================================================================
# 2. POLITICA CI/CD
# ============================================================================
$content = @"
# Politica de CI/CD - PanFree System

**Fecha:** 2026-10-13

---

## 1. Objetivo

Definir cuando los workflows de GitHub Actions son **estrictos** (bloquean el merge) y cuando son **tolerantes** (reportan sin bloquear), segun la fase del proyecto.

---

## 2. Estados del CI

### Estado A: Tolerante (Fase 0-3)

**Aplica durante:** preparacion, remediacion de seguridad, rotacion de claves, correcciones de codigo.

**Caracteristicas:**
- Todos los workflows con continue-on-error: true
- El objetivo es **detectar** problemas, no bloquear el trabajo
- Los PRs se pueden mergear aunque el CI falle
- **Excepcion:** security-scan.yml (gitleaks) es estricto desde el dia 1

**Razon:** durante la migracion el proyecto tiene dependencias no resueltas (falta package-lock.json, faltan env vars), y bloquear por eso frenaria el trabajo sin aportar valor.

### Estado B: Estricto (Fase 4+)

**Aplica cuando:**
- package-lock.json esta commiteado
- GitHub Secrets configurados (NEXT_PUBLIC_SUPABASE_URL, etc.)
- Cobertura de tests minima del 60%
- Supabase Advisors en verde
- Historial de Git purgado

**Caracteristicas:**
- Sin continue-on-error
- Los PRs fallan si lint, test o build fallan
- Branch protection en main
- PR obligatorio (no push directo)

---

## 3. Transicion A -> B

**Checklist para activar Estado B:**

- [ ] package-lock.json en el repo
- [ ] npm ci funciona localmente
- [ ] GitHub Secrets configurados:
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] npm run build pasa localmente sin placeholders
- [ ] Al menos 3 tests unitarios reales (no passWithNoTests)
- [ ] Supabase Advisors sin issues de severidad 1-2
- [ ] git filter-repo ejecutado

**Cuando todos esten en OK:** editar .github/workflows/ci.yml y quitar los continue-on-error.

---

## 4. Workflows actuales

### ci.yml - Estado A

- **Dispara:** push a main/develop, PRs
- **Pasos:** install, lint, test, build
- **Todos los pasos:** continue-on-error: true
- **Build:** usa env vars placeholder

### security-scan.yml - Estado B (estricto desde el dia 1)

- **Dispara:** push a main/develop, PRs a main
- **gitleaks:** estricto (queremos ver leaks)
- **npm audit:** tolerante (|| true)

**Razon:** queremos que **cualquier secreto filtrado** aparezca inmediatamente en el CI. Es la unica manera de que no vuelva a pasar SEC-001.

---

## 5. Cuando modificar un workflow

| Situacion | Accion |
|---|---|
| Falso positivo en gitleaks | Agregar a `.gitleaksignore` |
| Workflow rompe por dependencia no disponible | Agregar `continue-on-error: true` temporal |
| Se agrega nuevo paso al build | Documentar en este archivo |
| Se pasa a Estado B | Actualizar secciones 2 y 4 |

---

## 6. Reglas de oro

1. **El CI nunca debe bloquear sin razon.** Si bloquea, la razon debe estar documentada.
2. **Antes de pasar a estricto, probar 1 semana en tolerante.** Evita sorpresas.
3. **Los secrets van en GitHub Secrets, nunca en el workflow.** Ver `${{ secrets.X }}`.
4. **Documentar cada cambio de politica.** Este archivo es la fuente de verdad.
"@
Write-FileNoBom -Path "docs/02-operaciones/POLITICA-CI-CD.md" -Content $content

# ============================================================================
# 3. GESTION DE RIESGOS
# ============================================================================
$content = @"
# Gestion de Riesgos - PanFree System

**Fecha:** 2026-10-13
**Metodologia:** impacto x probabilidad = severidad

---

## 1. Riesgos identificados

### R-01: Rotacion de claves rompe autenticacion

| Campo | Valor |
|---|---|
| **Impacto** | Alto |
| **Probabilidad** | Media |
| **Severidad** | ALTA |
| **Fase afectada** | 2 |

**Descripcion:** al rotar el JWT secret de Supabase, todas las sesiones activas se invalidan. Si Vercel no se actualiza inmediatamente, el sitio queda caido.

**Mitigacion:**
- Guardar claves viejas en Bitwarden (coleccion Legado) ANTES de rotar
- Tener Vercel abierto en otra pestana
- Hacerlo en horario de bajo trafico
- Documentar en runbook: `docs/05-runbooks/rotar-claves-supabase.md`

**Plan de contingencia:**
1. Restaurar claves viejas en Vercel
2. Redeploy
3. Investigar con calma

---

### R-02: Migracion de Supabase pierde datos

| Campo | Valor |
|---|---|
| **Impacto** | Critico |
| **Probabilidad** | Baja |
| **Severidad** | CRITICA |
| **Fase afectada** | 2 |

**Descripcion:** al migrar entre cuentas de Supabase, riesgo de perder tablas, usuarios o archivos.

**Mitigacion:**
- NO migrar datos, solo agregar `system.panfree` como Owner
- Si se necesita migracion real: `pg_dump` completo antes
- Probar en proyecto de staging primero

**Plan de contingencia:**
1. Restaurar desde backup
2. Documentar en `docs/05-runbooks/restaurar-supabase.md`

---

### R-03: CI bloquea deploys legitimos

| Campo | Valor |
|---|---|
| **Impacto** | Medio |
| **Probabilidad** | Alta |
| **Severidad** | MEDIA |
| **Fase afectada** | 4 |

**Descripcion:** al pasar a CI estricto, algun PR puede fallar por razones no relacionadas con el cambio.

**Mitigacion:**
- Probar 1 semana en modo tolerante antes
- Ver `docs/02-operaciones/POLITICA-CI-CD.md`
- Documentar excepciones

**Plan de contingencia:**
1. Revertir a modo tolerante temporalmente
2. Investigar el fallo
3. Corregir y volver a estricto

---

### R-04: Gitleaks detecta falsos positivos

| Campo | Valor |
|---|---|
| **Impacto** | Bajo |
| **Probabilidad** | Alta |
| **Severidad** | BAJA |
| **Fase afectada** | 0-4 |

**Descripcion:** gitleaks puede marcar strings largos aleatorios como secretos (ej: hashes de commits).

**Mitigacion:**
- Crear `.gitleaksignore` si aparecen falsos positivos
- Configurar `.gitleaks.toml` con reglas especificas

**Plan de contingencia:**
- Agregar el patron a `.gitleaksignore` con un comentario explicando por que

---

### R-05: Bitwarden pierde claves

| Campo | Valor |
|---|---|
| **Impacto** | Critico |
| **Probabilidad** | Muy baja |
| **Severidad** | CRITICA |
| **Fase afectada** | 2+ |

**Descripcion:** perdida de la contrasena maestra de Bitwarden, o corrupcion de la boveda.

**Mitigacion:**
- Contrasena maestra guardada OFFLINE (papel en caja fuerte)
- 2FA activado
- Codigos de recuperacion descargados
- Exportar la boveda periodicamente en JSON encriptado

**Plan de contingencia:**
1. Usar el JSON exportado
2. Si no: recuperar desde los dashboards de cada servicio
3. Ultimo recurso: rotar TODO desde cero

---

### R-06: Vercel se desconecta del repo al migrar

| Campo | Valor |
|---|---|
| **Impacto** | Alto |
| **Probabilidad** | Media |
| **Severidad** | ALTA |
| **Fase afectada** | 2+ |

**Descripcion:** Vercel puede perder la conexion con el repo si se transfiere a otra cuenta.

**Mitigacion:**
- Hacer el cambio de repo fuera de horario critico
- Tener el dominio y DNS a mano
- Documentar la configuracion actual de Vercel

**Plan de contingencia:**
1. Reconectar manualmente
2. Re-deployar desde el ultimo commit
3. Si falla: usar el runbook `deploy-rollback.md`

---

### R-07: Servicio externo cambia su API

| Campo | Valor |
|---|---|
| **Impacto** | Medio |
| **Probabilidad** | Baja |
| **Severidad** | MEDIA |
| **Fase afectada** | Cualquiera |

**Descripcion:** Meta, Cloudinary, Gemini, etc. pueden cambiar su API y romper integraciones.

**Mitigacion:**
- Mantener las integraciones aisladas en `/lib`
- Tests de integracion en cada servicio
- Monitoreo de status pages

**Plan de contingencia:**
- Adaptar el codigo en `/lib`
- Actualizar versiones del SDK

---

### R-08: El proyecto crece y no escala

| Campo | Valor |
|---|---|
| **Impacto** | Medio |
| **Probabilidad** | Media |
| **Severidad** | MEDIA |
| **Fase afectada** | Futuro |

**Descripcion:** la base de Supabase en plan Free (500MB) puede quedar chica.

**Mitigacion:**
- Monitorear uso mensualmente
- Plan de upgrade a Pro ($25/mes) cuando sea necesario
- Optimizar queries y datos historicos

---

## 2. Matriz de riesgos

| ID | Impacto | Probabilidad | Severidad | Estado |
|---|---|---|---|---|
| R-01 | Alto | Media | ALTA | Mitigado |
| R-02 | Critico | Baja | CRITICA | Mitigado |
| R-03 | Medio | Alta | MEDIA | Aceptado |
| R-04 | Bajo | Alta | BAJA | Aceptado |
| R-05 | Critico | Muy baja | CRITICA | Mitigado |
| R-06 | Alto | Media | ALTA | Mitigado |
| R-07 | Medio | Baja | MEDIA | Aceptado |
| R-08 | Medio | Media | MEDIA | Monitoreado |

---

## 3. Revision

- **Frecuencia:** mensual, o cuando aparezca un riesgo nuevo
- **Responsable:** Pedro J. Pirovani
- **Fuente de nuevos riesgos:** incidentes, auditorias, cambios de servicio
"@
Write-FileNoBom -Path "docs/02-operaciones/GESTION-DE-RIESGOS.md" -Content $content

# ============================================================================
# 4. ROADMAP DE REMEDIACION
# ============================================================================
$content = @"
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
- **Documentar cada hallazgo cerrado.** Actualizar el `99-plan-remediacion.md`.
- **Si algo se desvia del plan, actualizar este roadmap.**
"@
Write-FileNoBom -Path "docs/04-auditorias/2026-10-13-inicial/04-roadmap.md" -Content $content

# ============================================================================
# 5. CRITERIOS DE ACEPTACION
# ============================================================================
$content = @"
# Criterios de Aceptacion (Definition of Done)

**Fecha:** 2026-10-13

---

## 1. Proposito

Definir que significa **"terminado"** para cada tipo de tarea, para evitar ambiguedad.

---

## 2. DoD por tipo de tarea

### 2.1 Fix de seguridad

Un fix de seguridad esta **terminado** cuando:

- [ ] El cambio esta implementado en el codigo o en la DB
- [ ] El advisor de Supabase **deja de reportar** el issue (o se reduce severidad)
- [ ] **Test manual** verifica que el fix funciona
- [ ] **Test negativo** verifica que el ataque ya no funciona
- [ ] Documentado en `docs/04-auditorias/2026-10-13-inicial/`
- [ ] Commit con prefijo `security:` o `fix:`
- [ ] Pusheado a `main`
- [ ] **Verificado en produccion** (panfree.fit)

**Ejemplo (F1-01 - vistas SECURITY DEFINER):**
- Cambio SQL aplicado en Supabase
- Supabase Advisors ya no reporta las 3 vistas
- Test: SELECT * FROM vista_costo_receta con user anon - debe fallar
- Test: mismo query con admin - debe funcionar
- Documento actualizado con el SQL aplicado
- Commit: `security(db): fix SECURITY DEFINER en vistas de costos`

### 2.2 Rotacion de claves

Una rotacion esta **terminada** cuando:

- [ ] Clave vieja guardada en Bitwarden (coleccion Legado)
- [ ] Clave nueva generada en el dashboard del servicio
- [ ] Clave nueva guardada en Bitwarden (coleccion Produccion)
- [ ] `.env.local` actualizado (localmente)
- [ ] Vercel Environment Variables actualizado
- [ ] Redeploy exitoso
- [ ] **Verificacion end-to-end:** home carga, login funciona, funcionalidad especifica del servicio OK
- [ ] Clave vieja revocada en el servicio
- [ ] Documentado en el `PLAN-DE-TRABAJO.md` (marcar OK)

**Ejemplo (F2-02 - Supabase JWT):**
- Bitwarden: item "Supabase - Claves Viejas" con la key vieja
- Supabase: JWT secret rotado
- Bitwarden: item "Supabase - PanFree Produccion" con la key nueva
- `.env.local` actualizado
- Vercel actualizado
- Redeploy OK
- Home + login + admin funcionan
- Documentado

### 2.3 Migracion de cuenta

Una migracion esta **terminada** cuando:

- [ ] Nueva cuenta tiene acceso **Owner** al servicio
- [ ] Todos los recursos son visibles desde la nueva cuenta
- [ ] Nueva cuenta puede **modificar** recursos (no solo leer)
- [ ] Cuenta vieja **degradada** a rol minimo (o removida)
- [ ] Documentado en el `.env.example` con `[S]` y `OK`
- [ ] Documentado en `PLAN-DE-TRABAJO.md`

### 2.4 Correccion de codigo

Un fix de codigo esta **terminado** cuando:

- [ ] Codigo modificado
- [ ] **Build local pasa:** `npm run build` sin errores
- [ ] **Lint pasa:** `npm run lint` sin errores (o con tolerancia justificada)
- [ ] **Test existe** (o se justifica por que no)
- [ ] **Test pasa:** `npm test`
- [ ] Documentado si el cambio es significativo
- [ ] Commit con prefijo adecuado (`fix:`, `refactor:`, etc.)
- [ ] Pusheado
- [ ] **Verificado en produccion**

### 2.5 Limpieza de repositorio

Una limpieza esta **terminada** cuando:

- [ ] Archivos no deseados eliminados con `git rm`
- [ ] `.gitignore` actualizado si aplica
- [ ] Working tree limpio (`git status` sin cambios)
- [ ] **Historico limpio:** `git log --all --full-history -- <path>` no muestra el archivo
- [ ] Documentado

### 2.6 Actualizacion de documentacion

Un doc esta **terminado** cuando:

- [ ] Contenido completo (no placeholders)
- [ ] Links internos funcionan
- [ ] Formato Markdown valido
- [ ] Commit con prefijo `docs:`
- [ ] Pusheado
- [ ] **Revisado visualmente en GitHub** (se ve bien en el navegador)

---

## 3. DoD por fase

### Fase 0 - Preparacion

- [ ] 6 documentos creados: plan, politica, riesgos, roadmap, criterios, remediacion
- [ ] Todos commiteados y pusheados
- [ ] Links cruzados funcionan en GitHub
- [ ] Revision visual completa

### Fase 1 - Seguridad de DB

- [ ] **Todos los advisors de severidad 1-2 en verde**
- [ ] Advisors de severidad 3 reducidos a menos de 50
- [ ] Tests de seguridad pasan (anon no puede leer datos sensibles)
- [ ] Documentado el SQL de cada fix

### Fase 2 - Rotacion

- [ ] **Todas las claves productivas en Bitwarden**
- [ ] **Ninguna clave filtra en el codigo** (grep no encuentra)
- [ ] `.env.example` actualizado con estado final
- [ ] Vercel con todas las env vars nuevas
- [ ] **Verificacion end-to-end en produccion**

### Fase 3 - Codigo

- [ ] Todos los hallazgos SEC/AUTH/DBG/CONF cerrados
- [ ] **Ningun `console.log` con datos sensibles**
- [ ] Headers de seguridad configurados
- [ ] Tests unitarios para auth y RLS

### Fase 4 - Limpieza

- [ ] `git filter-repo` ejecutado
- [ ] Ticket a GitHub Support abierto y cerrado
- [ ] `package-lock.json` en el repo
- [ ] CI estricto activado
- [ ] Branch protection en `main`
- [ ] **Sin secretos en el historial** (gitleaks limpio)

---

## 4. Checklist de cierre de proyecto

Al terminar todas las fases:

- [ ] Supabase Advisors: 0 issues severidad 1-2
- [ ] Bitwarden: organizacion PanFree con todos los items
- [ ] Vercel: env vars actualizadas
- [ ] GitHub: historial limpio, CI estricto, PRs obligatorios
- [ ] Local: `npm run build` pasa sin warnings
- [ ] Produccion: panfree.fit funciona end-to-end
- [ ] Documentacion: completa y navegable
- [ ] Auditoria: todos los hallazgos cerrados o aceptados

**Cuando todos esten OK:** el proyecto se considera **sano**.

---

## 5. Reglas anti-dudas

1. **Si dudas si esta terminado, NO lo marques como OK.**
2. **Si falla 1 item del DoD, la tarea sigue abierta.**
3. **Si el DoD no aplica, escribi uno especifico para esa tarea.**
4. **El DoD es la fuente de verdad para cerrar tareas.**
"@
Write-FileNoBom -Path "docs/04-auditorias/2026-10-13-inicial/05-criterios-aceptacion.md" -Content $content

# ============================================================================
# 6. ACTUALIZAR INDICE DE AUDITORIA
# ============================================================================
$content = @"
# Auditoria Inicial - 2026-10-13

**Estado:** En curso
**Alcance:** Repositorio completo, Supabase, integraciones
**Auditores:** Pedro J. Pirovani + IA

## Hallazgos criticos

| ID | Titulo | Severidad | Estado |
|---|---|---|---|
| SEC-001 | Archivos .env en historial de Git | Critica | Abierto |
| SEC-003 | Auth de admin por user_metadata | Critica | Abierto |
| DB-001 | 250+ advisors de Supabase | Critica | Abierto |

## Documentos de esta auditoria

- [01-secretos-git.md](./01-secretos-git.md)
- [02-supabase-advisors.md](./02-supabase-advisors.md)
- [03-codigo-fuente.md](./03-codigo-fuente.md)
- [04-roadmap.md](./04-roadmap.md)
- [05-criterios-aceptacion.md](./05-criterios-aceptacion.md)
- [99-plan-remediacion.md](./99-plan-remediacion.md)
"@
Write-FileNoBom -Path "docs/04-auditorias/2026-10-13-inicial/00-resumen-ejecutivo.md" -Content $content

# ============================================================================
# VERIFICACION Y COMMIT
# ============================================================================

Write-Host ""
Write-Host "=== Verificacion ===" -ForegroundColor Cyan

Write-Host ""
Write-Host "Archivos creados:" -ForegroundColor Yellow
Get-ChildItem -Path "docs/02-operaciones" -Filter "*.md" | ForEach-Object { Write-Host "  docs/02-operaciones/$($_.Name)" }
Get-ChildItem -Path "docs/04-auditorias/2026-10-13-inicial" -Filter "*.md" | ForEach-Object { Write-Host "  docs/04-auditorias/2026-10-13-inicial/$($_.Name)" }

Write-Host ""
Write-Host "Git status:" -ForegroundColor Yellow
git status --short

if ($NoCommit) {
    Write-Host ""
    Write-Host "=== -NoCommit activado: no se hace commit ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para commitear manualmente:" -ForegroundColor Cyan
    Write-Host "  git add ."
    Write-Host "  git commit -m `"docs(plan): agregar plan de trabajo, politica CI/CD, riesgos, roadmap y DoD`""
    Write-Host "  git push origin main"
    exit 0
}

# Preguntar antes de commitear
Write-Host ""
$resp = Read-Host "Hacer commit y push? (s/N)"
if ($resp -ne "s" -and $resp -ne "S") {
    Write-Host "Commit cancelado. Los archivos estan creados pero no commiteados." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== Commiteando ===" -ForegroundColor Cyan

git add docs/02-operaciones/PLAN-DE-TRABAJO.md
git add docs/02-operaciones/POLITICA-CI-CD.md
git add docs/02-operaciones/GESTION-DE-RIESGOS.md
git add docs/04-auditorias/2026-10-13-inicial/04-roadmap.md
git add docs/04-auditorias/2026-10-13-inicial/05-criterios-aceptacion.md
git add docs/04-auditorias/2026-10-13-inicial/00-resumen-ejecutivo.md

git commit -m "docs(plan): agregar plan de trabajo, politica CI/CD, riesgos, roadmap y DoD"

git push origin main

Write-Host ""
Write-Host "=== Listo ===" -ForegroundColor Green
Write-Host ""
git log --oneline -3