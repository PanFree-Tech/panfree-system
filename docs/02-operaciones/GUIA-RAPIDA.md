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