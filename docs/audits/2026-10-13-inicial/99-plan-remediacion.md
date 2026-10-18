# HISTORICO - Plan de Remediacion (Auditoria 2026-10-13)

> **Este documento es historico.** El estado real esta en PLAN-DE-TRABAJO.md y 06-hallazgos-tracking.md. Se preserva por trazabilidad.

# Plan de Remediacion - Auditoria 2026-10-13

## Fases

### Fase 0 - Preparacion
- [x] Reorganizar documentacion
- [ ] Documentar hallazgos
- [ ] Guardar evidencias

### Fase 1 - Seguridad de Supabase (critico)
- [ ] Corregir vistas SECURITY DEFINER
- [ ] Corregir politicas RLS Always True
- [ ] Restringir funciones SECURITY DEFINER
- [ ] Fijar search_path de funciones
- [ ] Restringir bucket storage.productos
- [ ] Habilitar Leaked Password Protection

### Fase 2 - Rotacion de claves
- [ ] Bitwarden configurado
- [ ] Supabase migrado a system.panfree
- [ ] Cloudinary migrado
- [ ] Todas las claves rotadas
- [ ] Vercel actualizado

### Fase 3 - Correcciones de codigo
- [ ] SEC-003: admin por app_metadata
- [ ] SEC-002: quitar DEFAULT_SUPABASE_ANON_KEY
- [ ] AUTH-001: contrasenas fuertes
- [ ] AUTH-002: registro sin duplicados
- [ ] DBG-001: quitar console.log
- [ ] BUG-001: fix NEXT_PUBLIC_VAPID_KEY
- [ ] CONF-001: ESLint en build
- [ ] CONF-002: headers de seguridad

### Fase 4 - Limpieza
- [ ] Purgar historial de Git
- [ ] Eliminar test.txt, test-supabase.js, .bak
- [ ] Actualizar .gitignore
- [ ] Configurar CI/CD
