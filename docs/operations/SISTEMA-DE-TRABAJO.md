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
    â”œâ”€â”€ docs/           -> documentacion
    â”œâ”€â”€ maintenance/    -> backups, limpiezas
    â”œâ”€â”€ deploy/         -> deploy y rollback
    â””â”€â”€ setup/          -> configuracion inicial

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
- Scripts idempotentes: correr multiples veces sin daÃ±o
- Scripts que validan prerequisitos y fallan limpio

### 7.3 Commits

- Conventional Commits
- Un commit por tarea
- Prefixes: feat, fix, docs, chore, refactor, security, perf

### 7.4 Politica de rotacion de claves

- Una sola coleccion en Bitwarden: Organizacion PanFree -> Produccion.
- No existe coleccion "Legado". Las keys salientes NO se guardan en
  un item aparte: se revocan en el dashboard y se registran en la NOTA
  del item de Produccion.
- La nota del item incluye: key saliente COMPLETA + fecha de revocacion
  + tarea (F2-XX) + motivo + hash del commit.
- El rollback NO restaura keys viejas (ya revocadas). Es rotacion de
  emergencia: crear key nueva + actualizar Vercel + redeploy.
- Detalle completo en docs/operations/ROTACION-CLAVES.md.

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