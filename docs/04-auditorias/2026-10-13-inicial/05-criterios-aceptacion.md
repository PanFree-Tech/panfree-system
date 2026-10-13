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
- [ ] Documentado en docs/04-auditorias/2026-10-13-inicial/
- [ ] Commit con prefijo security: o ix:
- [ ] Pusheado a main
- [ ] **Verificado en produccion** (panfree.fit)

**Ejemplo (F1-01 - vistas SECURITY DEFINER):**
- Cambio SQL aplicado en Supabase
- Supabase Advisors ya no reporta las 3 vistas
- Test: SELECT * FROM vista_costo_receta con user anon - debe fallar
- Test: mismo query con admin - debe funcionar
- Documento actualizado con el SQL aplicado
- Commit: security(db): fix SECURITY DEFINER en vistas de costos

### 2.2 Rotacion de claves

Una rotacion esta **terminada** cuando:

- [ ] Clave vieja guardada en Bitwarden (coleccion Legado)
- [ ] Clave nueva generada en el dashboard del servicio
- [ ] Clave nueva guardada en Bitwarden (coleccion Produccion)
- [ ] .env.local actualizado (localmente)
- [ ] Vercel Environment Variables actualizado
- [ ] Redeploy exitoso
- [ ] **Verificacion end-to-end:** home carga, login funciona, funcionalidad especifica del servicio OK
- [ ] Clave vieja revocada en el servicio
- [ ] Documentado en el PLAN-DE-TRABAJO.md (marcar OK)

**Ejemplo (F2-02 - Supabase JWT):**
- Bitwarden: item "Supabase - Claves Viejas" con la key vieja
- Supabase: JWT secret rotado
- Bitwarden: item "Supabase - PanFree Produccion" con la key nueva
- .env.local actualizado
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
- [ ] Documentado en el .env.example con [S] y OK
- [ ] Documentado en PLAN-DE-TRABAJO.md

### 2.4 Correccion de codigo

Un fix de codigo esta **terminado** cuando:

- [ ] Codigo modificado
- [ ] **Build local pasa:** 
pm run build sin errores
- [ ] **Lint pasa:** 
pm run lint sin errores (o con tolerancia justificada)
- [ ] **Test existe** (o se justifica por que no)
- [ ] **Test pasa:** 
pm test
- [ ] Documentado si el cambio es significativo
- [ ] Commit con prefijo adecuado (ix:, efactor:, etc.)
- [ ] Pusheado
- [ ] **Verificado en produccion**

### 2.5 Limpieza de repositorio

Una limpieza esta **terminada** cuando:

- [ ] Archivos no deseados eliminados con git rm
- [ ] .gitignore actualizado si aplica
- [ ] Working tree limpio (git status sin cambios)
- [ ] **Historico limpio:** git log --all --full-history -- <path> no muestra el archivo
- [ ] Documentado

### 2.6 Actualizacion de documentacion

Un doc esta **terminado** cuando:

- [ ] Contenido completo (no placeholders)
- [ ] Links internos funcionan
- [ ] Formato Markdown valido
- [ ] Commit con prefijo docs:
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
- [ ] .env.example actualizado con estado final
- [ ] Vercel con todas las env vars nuevas
- [ ] **Verificacion end-to-end en produccion**

### Fase 3 - Codigo

- [ ] Todos los hallazgos SEC/AUTH/DBG/CONF cerrados
- [ ] **Ningun console.log con datos sensibles**
- [ ] Headers de seguridad configurados
- [ ] Tests unitarios para auth y RLS

### Fase 4 - Limpieza

- [ ] git filter-repo ejecutado
- [ ] Ticket a GitHub Support abierto y cerrado
- [ ] package-lock.json en el repo
- [ ] CI estricto activado
- [ ] Branch protection en main
- [ ] **Sin secretos en el historial** (gitleaks limpio)

---

## 4. Checklist de cierre de proyecto

Al terminar todas las fases:

- [ ] Supabase Advisors: 0 issues severidad 1-2
- [ ] Bitwarden: organizacion PanFree con todos los items
- [ ] Vercel: env vars actualizadas
- [ ] GitHub: historial limpio, CI estricto, PRs obligatorios
- [ ] Local: 
pm run build pasa sin warnings
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