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

    type docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md

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
# Cuenta aperturas y cierres de here-string (deben coincidir)
(Select-String -Path script.ps1 -Pattern '@"').Count
(Select-String -Path script.ps1 -Pattern '"@').Count
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