# 01-crear-sistema-trabajo.ps1
# Crea SISTEMA-DE-TRABAJO.md, WORKFLOW-DIARIO.md, GUIA-RAPIDA.md
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\01-crear-sistema-trabajo.ps1 -NoCommit
#   powershell -ExecutionPolicy Bypass -File scripts\docs\01-crear-sistema-trabajo.ps1

param(
    [switch]$NoCommit
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $RepoRoot

Write-Host "=== [1/3] Creando documentos del Sistema de Trabajo ===" -ForegroundColor Cyan

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
# 1. SISTEMA-DE-TRABAJO.md
# ============================================================================
$content = @"
# Sistema de Trabajo - PanFree System

**Fecha:** 2026-10-13
**Version:** 1.0
**Responsable:** Pedro J. Pirovani

---

## 1. Objetivo

Definir como se trabaja en el proyecto: como se crean archivos,
como se pasan scripts, como se commitean cambios, como se
mantiene la documentacion viva.

---

## 2. Reglas de tamano de scripts

| Lineas | Estrategia | Notas |
|---|---|---|
| 0 - 200 | 1 bloque completo | Pegar en VS Code |
| 200 - 400 | 1 bloque, verificar | findstr |
| 400+ | Dividir en partes | Max 200 lineas por parte |

### 2.1 Division de scripts extensos

Cuando un script supera 400 lineas:

1. Se divide en archivos numerados: 01-xxx.ps1, 02-xxx.ps1
2. Cada uno crea UN conjunto de archivos (no todos)
3. Se pasa cada uno en mensaje separado
4. Al final se ejecuta un orquestador

---

## 3. Nomenclatura y estructura de scripts

### 3.1 Prefijos

- crear-*.ps1       -> crea archivos nuevos
- actualizar-*.ps1  -> modifica existentes
- verificar-*.ps1   -> valida (no modifica)
- orquestar-*.ps1   -> llama a varios en orden

### 3.2 Estructura

    scripts/
    ├── docs/           -> documentacion
    ├── maintenance/    -> backups, limpiezas
    ├── deploy/         -> deploy y rollback
    └── setup/          -> configuracion inicial

---

## 4. Here-strings en PowerShell

### 4.1 Reglas

- Un here-string abre con @" y cierra con "@
- El "@ DEBE estar al principio de la linea, sin espacios
- NUNCA pegar un "@ al final si no tiene su @" de apertura
- Verificar SIEMPRE con findstr antes de guardar

### 4.2 Verificacion obligatoria

    findstr /N "\"@" script.ps1
    findstr /N "@\"" script.ps1

Ambos comandos deben devolver la MISMA cantidad de lineas.

---

## 5. Verificaciones antes de commitear

- [ ] findstr de "@ y @" cuentan igual
- [ ] Ultima linea del script es util
- [ ] Script corre en -NoCommit sin errores
- [ ] Archivos creados tienen el contenido correcto
- [ ] No hay claves hardcodeadas

---

## 6. Flujo de trabajo por tarea

1. **Planificacion** - que hacer, en que archivo
2. **Script** - crear en scripts/<categoria>/
3. **Ejecucion -NoCommit** - correr sin commitear
4. **Verificacion** - revisar que este bien
5. **Ejecucion real** - correr con commit
6. **Documentacion** - actualizar STATUS.md, BITACORA.md, tracking

---

## 7. Preferencias del equipo

### 7.1 Editor

- **VS Code** es el editor oficial
- **NO usar Notepad** para .ps1, .md o codigo
- VS Code garantiza UTF-8 sin BOM

### 7.2 Automatizacion

- **Siempre preferir scripts** sobre comandos manuales
- Documentacion: crear/modificar/actualizar con scripts
- Scripts idempotentes: correr multiples veces sin daño
- Scripts que validan prerequisitos y fallan limpio

### 7.3 Commits

- Conventional Commits
- Un commit por tarea
- Prefixes: feat, fix, docs, chore, refactor, security, perf

---

## 8. Documentos de seguimiento

| Documento | Actualizar cuando | Quien |
|---|---|---|
| STATUS.md | Al cerrar/abrir tarea | Todos |
| BITACORA.md | Al final de sesion | Todos |
| 06-hallazgos-tracking.md | Al cerrar hallazgo | Todos |
| PLAN-DE-TRABAJO.md | Al agregar tarea | Lider |

---

## 9. Referencias

- [Workflow Diario](./WORKFLOW-DIARIO.md)
- [Guia Rapida](./GUIA-RAPIDA.md)
- [Plan de Trabajo](./PLAN-DE-TRABAJO.md)
- [Politica CI/CD](./POLITICA-CI-CD.md)
"@
Write-FileNoBom -Path "docs/02-operaciones/SISTEMA-DE-TRABAJO.md" -Content $content

# ============================================================================
# 2. WORKFLOW-DIARIO.md
# ============================================================================
$content = @"
# Workflow Diario - PanFree System

**Fecha:** 2026-10-13
**Proposito:** Ritual de cada sesion de trabajo

---

## 1. Al EMPEZAR una sesion (5 min)

### Paso 1 - Leer el estado actual

    type docs\STATUS.md

Te dice:
- Fase actual
- Progreso global
- Bloqueantes
- Proximos 3 pasos

### Paso 2 - Leer la ultima entrada de bitacora

    type docs\BITACORA.md

Anda al final del archivo. La ultima entrada te dice que se hizo.

### Paso 3 - Revisar hallazgos abiertos

    type docs\04-auditorias\2026-10-13-inicial\06-hallazgos-tracking.md

Fijate que hallazgos estan "En curso" o "Abierto" con prioridad P0/P1.

### Paso 4 - Decidir tarea del dia

Basado en los "Proximos 3 pasos" del STATUS.md.

### Paso 5 - Crear rama (opcional)

Para tareas grandes:

    git checkout -b security/fix-vistas-supabase

Para tareas chicas, trabajar directo en main.

---

## 2. DURANTE la sesion

### Regla 1 - Un commit por tarea

No mezclar temas.

### Regla 2 - Verificar antes de commitear

    findstr /N "\"@" scripts\...\script.ps1

### Regla 3 - Documentar en el momento

Cada vez que:
- Cierres una tarea -> actualiza PLAN-DE-TRABAJO.md
- Cierres un hallazgo -> actualiza 06-hallazgos-tracking.md
- Descubras algo nuevo -> crea un doc o agrega al tracking

---

## 3. Al TERMINAR una sesion (5 min)

### Paso 1 - Actualizar BITACORA.md

Agregar entrada al final con:

    ## YYYY-MM-DD (Sesion N)

    **Duracion:** X horas
    **Objetivo:** <una linea>

    **Completado:**
    - Item 1
    - Item 2

    **Commits:**
    - <hash> <mensaje>

    **Hallazgos cerrados:**
    - ID: titulo

    **Hallazgos nuevos:**
    - ID: titulo

    **Bloqueantes:**
    - Ninguno / descripcion

    **Proxima sesion:**
    - Tarea 1
    - Tarea 2

    ---

### Paso 2 - Actualizar STATUS.md

- Progreso %
- Ultima actividad
- Proximos 3 pasos

### Paso 3 - Commit final

    git add docs/
    git commit -m "docs(session): actualizar estado y bitacora del YYYY-MM-DD"
    git push origin main

---

## 4. Plantilla de bitacora

Copiar y pegar al final de BITACORA.md:

    ## YYYY-MM-DD (Sesion N)

    **Duracion:**
    **Objetivo:**

    **Completado:**
    -

    **Commits:**
    -

    **Hallazgos cerrados:**
    -

    **Hallazgos nuevos:**
    -

    **Bloqueantes:**
    -

    **Proxima sesion:**
    -

    ---

---

## 5. Checklist de cierre de sesion

- [ ] Bitacora actualizada
- [ ] STATUS.md actualizado
- [ ] Tracking actualizado (si aplica)
- [ ] Todos los commits pusheados
- [ ] Working tree limpio (git status)
- [ ] Proximos 3 pasos anotados en STATUS.md

---

## 6. Referencias

- [Sistema de Trabajo](./SISTEMA-DE-TRABAJO.md)
- [Guia Rapida](./GUIA-RAPIDA.md)
- [STATUS.md](../STATUS.md)
- [BITACORA.md](../BITACORA.md)
"@
Write-FileNoBom -Path "docs/02-operaciones/WORKFLOW-DIARIO.md" -Content $content

# ============================================================================
# 3. GUIA-RAPIDA.md
# ============================================================================
$content = @"
# Guia Rapida - PanFree System

**Para retomar el trabajo despues de dias sin actividad.**

---

## 1. Arrancar en 1 minuto

    REM 1. Ir al repo
    cd C:\Users\Admin\proyectos\panfree-system

    REM 2. Actualizar
    git pull origin main

    REM 3. Ver estado
    type docs\STATUS.md

    REM 4. Ver ultima bitacora
    type docs\BITACORA.md

    REM 5. Ver hallazgos abiertos
    type docs\04-auditorias\2026-10-13-inicial\06-hallazgos-tracking.md

---

## 2. Mapa de documentos

| Busco... | Voy a... |
|---|---|
| Que hacer hoy | docs\STATUS.md |
| Que se hizo ayer | docs\BITACORA.md |
| Plan completo | docs\02-operaciones\PLAN-DE-TRABAJO.md |
| Que hallazgos faltan | docs\04-auditorias\2026-10-13-inicial\06-hallazgos-tracking.md |
| Como trabajar | docs\02-operaciones\SISTEMA-DE-TRABAJO.md |
| Cuando el CI bloquea | docs\02-operaciones\POLITICA-CI-CD.md |
| Como se rota una clave | docs\05-runbooks\ |
| Convenciones de commit | docs\06-referencias\convenciones-codigo.md |
| Como desplegar | docs\02-operaciones\DEPLOYMENT.md |

---

## 3. Antes de tocar codigo

- [ ] git pull origin main
- [ ] Leer STATUS.md
- [ ] Verificar que no hay bloqueantes
- [ ] Identificar la tarea del dia

---

## 4. Al terminar

- [ ] Actualizar BITACORA.md
- [ ] Actualizar STATUS.md
- [ ] Commit + push
- [ ] Verificar working tree limpio

---

## 5. Comandos frecuentes

    REM Ver estado
    git status

    REM Ver historial reciente
    git log --oneline -5

    REM Commit rapido
    git add .
    git commit -m "tipo(scope): descripcion"
    git push origin main

    REM Ver documento
    type docs\STATUS.md

    REM Editar documento en VS Code
    code docs\STATUS.md

---

## 6. Si algo sale mal

| Sintoma | Solucion |
|---|---|
| No se que hacer | Leer STATUS.md, seccion "Proximos 3 pasos" |
| Olvide que se hizo | Leer ultima entrada de BITACORA.md |
| No se donde esta X | Buscar en este archivo, seccion "Mapa de documentos" |
| El CI falla en rojo | Ver POLITICA-CI-CD.md |
| Perdi una clave | Ver Bitwarden, organizacion PanFree |
| Sitio caido | Ver docs\05-runbooks\deploy-rollback.md |

---

## 7. Contactos

- **Responsable:** Pedro J. Pirovani
- **Email:** system.panfree@gmail.com
- **Repo:** https://github.com/PanFree-Tech/panfree-system

---

## 8. Referencias

- [Sistema de Trabajo](./SISTEMA-DE-TRABAJO.md)
- [Workflow Diario](./WORKFLOW-DIARIO.md)
"@
Write-FileNoBom -Path "docs/02-operaciones/GUIA-RAPIDA.md" -Content $content

# ============================================================================
# VERIFICACION
# ============================================================================
Write-Host ""
Write-Host "=== [1/3] Completado ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Archivos creados:" -ForegroundColor Yellow
Write-Host "  docs/02-operaciones/SISTEMA-DE-TRABAJO.md"
Write-Host "  docs/02-operaciones/WORKFLOW-DIARIO.md"
Write-Host "  docs/02-operaciones/GUIA-RAPIDA.md"
Write-Host ""
git status --short

if ($NoCommit) {
    Write-Host ""
    Write-Host "=== -NoCommit activado ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Continua con el script 02:"
    Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\docs\02-crear-adrs.ps1 -NoCommit"
    exit 0
}

Write-Host ""
$resp = Read-Host "Hacer commit de estos 3 archivos? (s/N)"
if ($resp -ne "s" -and $resp -ne "S") {
    Write-Host "Commit cancelado." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== Commiteando ===" -ForegroundColor Cyan

git add docs/02-operaciones/SISTEMA-DE-TRABAJO.md
git add docs/02-operaciones/WORKFLOW-DIARIO.md
git add docs/02-operaciones/GUIA-RAPIDA.md

git commit -m "docs(ops): agregar sistema de trabajo, workflow diario y guia rapida"
git push origin main

Write-Host ""
Write-Host "=== [1/3] Listo ===" -ForegroundColor Green
git log --oneline -3