# crear-status.ps1
# Crea los archivos de seguimiento: STATUS.md, BITACORA.md, 06-hallazgos-tracking.md
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\crear-status.ps1 -NoCommit
#   powershell -ExecutionPolicy Bypass -File scripts\crear-status.ps1

param(
    [switch]$NoCommit
)

$ErrorActionPreference = "Stop"

# Ir a la raiz del repo
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $RepoRoot

Write-Host "=== Creando archivos de seguimiento ===" -ForegroundColor Cyan

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
# 1. STATUS.md
# ============================================================================
$content = @"
# Estado del Proyecto - PanFree System

**Ultima actualizacion:** 2026-10-13
**Fase actual:** Fase 0 (COMPLETA) -> Fase 1 (POR EMPEZAR)
**Progreso global:** 13% (6 de 46 tareas)

---

## 1. Resumen por fase

| Fase | Tareas | OK | En curso | Pendiente | % |
|---|---|---|---|---|---|
| F0 - Preparacion | 6 | 6 | 0 | 0 | 100% |
| F1 - Seguridad DB | 9 | 0 | 0 | 9 | 0% |
| F2 - Rotacion claves | 14 | 0 | 0 | 14 | 0% |
| F3 - Codigo | 9 | 0 | 0 | 9 | 0% |
| F4 - Limpieza | 8 | 0 | 0 | 8 | 0% |
| **Total** | **46** | **6** | **0** | **40** | **13%** |

---

## 2. Bloqueantes actuales

**Ninguno.**

---

## 3. Proximos 3 pasos

1. **F1-01** - Fix 3 vistas SECURITY DEFINER (P0)
2. **F1-02** - Fix 4 politicas RLS Always True (P0)
3. **F1-03** - Restringir 4 funciones SECURITY DEFINER (P0)

---

## 4. Metricas clave

| Metrica | Hoy | Meta |
|---|---|---|
| Advisors Supabase severidad 1-2 | 7 | 0 |
| Advisors Supabase severidad 3 | 250+ | menos de 50 |
| Claves productivas rotadas | 0 / 12 | 12 / 12 |
| Claves en Bitwarden | 0 / 12 | 12 / 12 |
| Hallazgos cerrados | 0 / 22 | 22 / 22 |
| Commits de remediacion | 0 | ~40 |

---

## 5. Ultima actividad

**2026-10-13 - Sesion 1**
- Reorganizacion completa de docs/
- Creacion de 6 documentos del Plan de Trabajo
- Configuracion de .github/ (CI + templates)
- Simplificacion de .env.example
- 7 commits pusheados
- 2 hallazgos criticos identificados (SEC-001, DB-001)

---

## 6. Documentos relacionados

- [Plan de Trabajo](../02-operaciones/PLAN-DE-TRABAJO.md)
- [Bitacora](./BITACORA.md)
- [Tracking de hallazgos](../04-auditorias/2026-10-13-inicial/06-hallazgos-tracking.md)
- [Roadmap](../04-auditorias/2026-10-13-inicial/04-roadmap.md)
"@
Write-FileNoBom -Path "docs/STATUS.md" -Content $content

# ============================================================================
# 2. BITACORA.md
# ============================================================================
$content = @"
# Bitacora de Sesiones - PanFree System

Registro cronologico de todas las sesiones de trabajo sobre el proyecto.
Cada sesion agrega una entrada al final.

---

## Plantilla para nuevas entradas

    ## YYYY-MM-DD (sesion N)

    **Duracion:** X horas
    **Objetivo:** descripcion breve

    **Completado:**
    - Item 1
    - Item 2

    **Hallazgos nuevos:**
    - ID: descripcion

    **Bloqueantes:**
    - Ninguno / descripcion

    **Proxima sesion:**
    - Tarea 1
    - Tarea 2

---

## 2026-10-13 (Sesion 1)

**Duracion:** ~6 horas
**Objetivo:** Preparar base documental, plan de trabajo y estructura del repositorio

**Completado:**
- Clonado del repositorio desde GitHub (PanFree-Tech/panfree-system)
- Auditoria inicial del codigo fuente (middleware, libs, hooks, componentes)
- Descubrimiento de SEC-001: .env filtrados en historial de Git
- Descubrimiento de DB-001: 250+ advisors de Supabase
- Reorganizacion completa de la documentacion en estructura docs/
- Creacion de 6 documentos del Plan de Trabajo
- Configuracion de .github/ (workflows CI + templates)
- Simplificacion de .env.example con convencion de cuentas [S]/[C]
- 7 commits pusheados a main

**Commits:**
- 810f6daf docs(env): simplificar .env.example
- 624e06db docs(repo): reorganizar documentacion en estructura docs/
- e34233c4 docs(repo): agregar documentacion base
- 75093e6b chore(ci): agregar templates y workflows de GitHub
- 47982c1e docs(plan): agregar plan de trabajo, politica CI/CD, riesgos, roadmap y DoD
- bf3e8466 chore(scripts): agregar script para regenerar documentacion del Plan

**Hallazgos nuevos:**
- SEC-001: Archivos .env en historial de Git (Critica)
- SEC-002: DEFAULT_SUPABASE_ANON_KEY hardcodeada (Alta)
- SEC-003: Admin por user_metadata (Critica)
- SEC-006: redirectTo hardcodeado (Alta)
- DB-001: 250+ advisors de Supabase (Critica)
- AUTH-001: Contrasenas debiles (Alta)
- AUTH-002: Registro sin validar duplicados (Alta)
- DBG-001: console.log con datos sensibles (Alta)
- CONF-001: ESLint ignorado en build (Media)
- CONF-002: Sin headers de seguridad (Media)
- BUG-001: NEXT_PUBLIC_VAPID_KEY inconsistente (Media)

**Bloqueantes:**
- Supabase con problemas tecnicos al inicio (resuelto)

**Proxima sesion:**
- F1-01: Fix 3 vistas SECURITY DEFINER
- F1-02: Fix politicas RLS Always True
- F1-03: Restringir funciones SECURITY DEFINER

---

## 2026-10-14 (Sesion 2) - PENDIENTE

**Duracion:**
**Objetivo:**
**Completado:**
**Hallazgos nuevos:**
**Bloqueantes:**
**Proxima sesion:**

---

## Notas

- Cada sesion agrega una entrada al final del documento.
- No se editan entradas anteriores (solo se agregan nuevas).
- Si una sesion no tuvo avances, se registra igual.
- Los commits se referencian con hash corto.
"@
Write-FileNoBom -Path "docs/BITACORA.md" -Content $content

# ============================================================================
# 3. 06-hallazgos-tracking.md
# ============================================================================
$content = @"
# Tracking de Hallazgos - Auditoria 2026-10-13

**Ultima actualizacion:** 2026-10-13
**Total de hallazgos:** 22

---

## 1. Resumen

| Estado | Cantidad |
|---|---|
| Abierto | 22 |
| En curso | 0 |
| Cerrado | 0 |
| Aceptado | 0 |

---

## 2. Hallazgos por severidad

| Severidad | Cantidad | Cerrados |
|---|---|---|
| Critica | 6 | 0 |
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
| DB-001a | Vistas SECURITY DEFINER | F1 | P0 | Abierto | - |
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
"@
Write-FileNoBom -Path "docs/04-auditorias/2026-10-13-inicial/06-hallazgos-tracking.md" -Content $content

# ============================================================================
# 4. ACTUALIZAR INDICE DE AUDITORIA
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
- [06-hallazgos-tracking.md](./06-hallazgos-tracking.md)
- [99-plan-remediacion.md](./99-plan-remediacion.md)
"@
Write-FileNoBom -Path "docs/04-auditorias/2026-10-13-inicial/00-resumen-ejecutivo.md" -Content $content

# ============================================================================
# VERIFICACION
# ============================================================================
Write-Host ""
Write-Host "=== Verificacion ===" -ForegroundColor Cyan

Write-Host ""
Write-Host "Archivos creados:" -ForegroundColor Yellow
Write-Host "  docs/STATUS.md"
Write-Host "  docs/BITACORA.md"
Write-Host "  docs/04-auditorias/2026-10-13-inicial/06-hallazgos-tracking.md"
Write-Host "  docs/04-auditorias/2026-10-13-inicial/00-resumen-ejecutivo.md (actualizado)"

Write-Host ""
Write-Host "Git status:" -ForegroundColor Yellow
git status --short

if ($NoCommit) {
    Write-Host ""
    Write-Host "=== -NoCommit activado ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para commitear manualmente:" -ForegroundColor Cyan
    Write-Host "  git add docs/STATUS.md"
    Write-Host "  git add docs/BITACORA.md"
    Write-Host "  git add docs/04-auditorias/2026-10-13-inicial/06-hallazgos-tracking.md"
    Write-Host "  git add docs/04-auditorias/2026-10-13-inicial/00-resumen-ejecutivo.md"
    Write-Host "  git commit -m `"docs(tracking): agregar STATUS, BITACORA y tracking de hallazgos`""
    Write-Host "  git push origin main"
    exit 0
}

# Preguntar antes de commitear
Write-Host ""
$resp = Read-Host "Hacer commit y push? (s/N)"
if ($resp -ne "s" -and $resp -ne "S") {
    Write-Host "Commit cancelado." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== Commiteando ===" -ForegroundColor Cyan

git add docs/STATUS.md
git add docs/BITACORA.md
git add docs/04-auditorias/2026-10-13-inicial/06-hallazgos-tracking.md
git add docs/04-auditorias/2026-10-13-inicial/00-resumen-ejecutivo.md

git commit -m "docs(tracking): agregar STATUS, BITACORA y tracking de hallazgos"

git push origin main

Write-Host ""
Write-Host "=== Listo ===" -ForegroundColor Green
Write-Host ""
git log --oneline -3