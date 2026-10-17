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

### 4.3 Line endings al modificar archivos

Antes de modificar un archivo con un script, verificar su line ending:

    $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $archivo).Path)
    $texto = [System.Text.Encoding]::UTF8.GetString($bytes)
    $cuentaCRLF = ([regex]::Matches($texto, "`r`n")).Count
    $cuentaLF   = ([regex]::Matches($texto, "`n")).Count

- Si el archivo es CRLF (mayoria en este repo): normalizar al leer con
  `($contenido -split "`n") | ForEach-Object { $_.TrimEnd("`r") }`.
  Y al escribir, usar `-join "`r`n"`.
- Si el archivo es LF (BITACORA, STATUS): usar `-split "`n"` y `-join "`n"`.
- Nunca asumir LF: en S23, el script 79d fallo porque comparaba con `-eq`
  contra strings que tenian un `\r` residual invisible.

### 4.4 Deteccion de mojibake

Si un archivo tiene caracteres mal codificados (ej: "a con circunflejo +
euro + comilla" en vez de em-dash), detectarlo con codigos Unicode:

    $pA = [char]0x00E2  # a con circunflejo
    $pEur = [char]0x20AC  # euro

NO usar los caracteres literales en el script. Los .ps1 con caracteres
no-ASCII rompen el parser de PowerShell 5.1.

### 4.5 Invocacion de scripts

Siempre invocar scripts con uno de estos formatos:

    powershell -ExecutionPolicy Bypass -File scripts\docs\NN-script.ps1
    & ".\scripts\docs\NN-script.ps1"

Nunca invocar `scripts\docs\NN-script.ps1` directo desde la consola:
PowerShell lo interpreta como comando (modulo), no como ruta.

### 4.6 -NoCommit como default

Los scripts de fix deben aceptar `-NoCommit` para dry-run:

- Correr primero con `-NoCommit`: verifica el diff sin commitear.
- Si el diff es correcto, commit manual o segunda corrida sin `-NoCommit`.
- Previene commitear cambios no verificados.

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

- Bitwarden -> Organizacion PanFree tiene 3 carpetas: Claves Personales,
  Desarrollo, Produccion. La carpeta Produccion es la fuente de verdad
  para claves productivas.
- No existe coleccion "Legado". Las keys salientes NO se guardan en
  un item aparte: se revocan en el dashboard y se registran en la NOTA
  del item de Produccion.
- La nota del item incluye: key saliente COMPLETA + fecha de revocacion
  + tarea (F2-XX) + motivo + hash del commit.
- El rollback NO restaura keys viejas (ya revocadas). Es rotacion de
  emergencia: crear key nueva + actualizar Vercel + redeploy.
- Detalle completo en docs/operations/ROTACION-CLAVES.md.

---

### 7.5 Manejo de secretos en el chat de IA

- **Nunca pegar valores de secretos reales en el chat de la IA.**
  Aplica a: API keys, tokens, private keys, JWT secrets, contraseÃ±as.
- Si se necesita validar que un valor esta bien cargado, verificar por
  **comportamiento** (que la app funcione), no por inspeccion directa del valor.
- Si se pega por error un secreto, **rotarlo inmediatamente** y documentar el
  incidente en la bitacora de la sesion.
- Motivo: los chats de IA quedan en logs de la plataforma (Anthropic, OpenAI,
  etc.), en el historial local, y en backups. Aunque se rote despues, la
  ventana de exposicion existe.

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