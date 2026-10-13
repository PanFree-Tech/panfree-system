# crear-docs.ps1
# Crea los archivos de documentacion base

$ErrorActionPreference = "Stop"

Write-Host "=== Creando archivos de documentacion ===" -ForegroundColor Cyan

# --- docs/README.md ---
$content = @"
# Documentacion - PanFree System

Indice maestro de la documentacion del proyecto.

## Estructura

| Carpeta | Proposito |
|---|---|
| 01-arquitectura/ | Como esta construido el sistema |
| 02-operaciones/ | Como se opera y despliega |
| 03-integraciaciones/ | Como se conecta con servicios externos |
| 04-auditorias/ | Historial de auditorias tecnicas |
| 05-runbooks/ | Procedimientos de emergencia |
| 06-referencias/ | Material de consulta general |

## Indice rapido

- [Arquitectura](./01-arquitectura/ARCHITECTURE.md)
- [Base de datos](./01-arquitectura/DATABASE.md)
- [API](./01-arquitectura/API.md)
- [Deployment](./02-operaciones/DEPLOYMENT.md)
- [Contributing](./02-operaciones/CONTRIBUTING.md)
- [Auditorias](./04-auditorias/README.md)
"@
Set-Content -Path "docs/README.md" -Value $content -Encoding UTF8
Write-Host "[OK] docs/README.md" -ForegroundColor Green

# --- docs/04-auditorias/README.md ---
$content = @"
# Auditorias Tecnicas

Historial de auditorias realizadas al sistema PanFree.

| Fecha | Nombre | Estado | Hallazgos criticos |
|---|---|---|---|
| 2026-10-13 | Inicial | En curso | SEC-001, RLS, Vistas |

## Estructura

Cada auditoria sigue esta estructura:

    YYYY-MM-DD-nombre/
      00-resumen-ejecutivo.md
      01-dominio.md
      99-plan-remediacion.md
      evidencias/
"@
Set-Content -Path "docs/04-auditorias/README.md" -Value $content -Encoding UTF8
Write-Host "[OK] docs/04-auditorias/README.md" -ForegroundColor Green

# --- docs/04-auditorias/2026-10-13-inicial/00-resumen-ejecutivo.md ---
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

## Documentos

- [01-secretos-git.md](./01-secretos-git.md)
- [02-supabase-advisors.md](./02-supabase-advisors.md)
- [03-codigo-fuente.md](./03-codigo-fuente.md)
- [99-plan-remediacion.md](./99-plan-remediacion.md)
"@
Set-Content -Path "docs/04-auditorias/2026-10-13-inicial/00-resumen-ejecutivo.md" -Value $content -Encoding UTF8
Write-Host "[OK] 00-resumen-ejecutivo.md" -ForegroundColor Green

# --- docs/04-auditorias/2026-10-13-inicial/01-secretos-git.md ---
$content = @"
# SEC-001 - Archivos .env en historial de Git

**Severidad:** Critica
**Estado:** Abierto
**Fecha:** 2026-10-13

## Evidencia

    .env.production.backup
    .env.local

Aparecen en el historial del repo publico PanFree-Tech/panfree-system.

## Impacto

- Repo publico: cualquier clon tiene copia
- 0 forks, 0 stars: riesgo bajo de explotacion
- Se recomienda rotar todas las claves

## Remediacion

1. Rotar todas las claves (en curso)
2. Purgar historial con git filter-repo
3. Abrir ticket a GitHub Support
"@
Set-Content -Path "docs/04-auditorias/2026-10-13-inicial/01-secretos-git.md" -Value $content -Encoding UTF8
Write-Host "[OK] 01-secretos-git.md" -ForegroundColor Green

# --- docs/04-auditorias/2026-10-13-inicial/02-supabase-advisors.md ---
$content = @"
# DB-001 - 250+ Advisors de Supabase

**Severidad:** Critica
**Estado:** Abierto
**Fecha:** 2026-10-13

## Resumen

Supabase Advisors detecto 250+ problemas:

- 3 vistas con SECURITY DEFINER (bypass RLS)
- ~60 politicas RLS sin optimizar
- ~150 politicas permisivas duplicadas
- 4 politicas RLS Always True
- 4 funciones SECURITY DEFINER ejecutables publicamente
- 3 funciones con search_path mutable
- 1 bucket de Storage listable publicamente
- Leaked Password Protection deshabilitado

## Evidencia

Ver evidencias/supabase-advisors-2026-10-13.txt

## Remediacion

Ver 99-plan-remediacion.md
"@
Set-Content -Path "docs/04-auditorias/2026-10-13-inicial/02-supabase-advisors.md" -Value $content -Encoding UTF8
Write-Host "[OK] 02-supabase-advisors.md" -ForegroundColor Green

# --- docs/04-auditorias/2026-10-13-inicial/03-codigo-fuente.md ---
$content = @"
# Codigo Fuente - Hallazgos

**Fecha:** 2026-10-13

## Hallazgos

| ID | Descripcion | Severidad |
|---|---|---|
| SEC-002 | DEFAULT_SUPABASE_ANON_KEY hardcodeada | Alta |
| SEC-006 | redirectTo hardcodeado en AuthModal.js | Alta |
| AUTH-001 | Contrasenas sin requisitos minimos | Alta |
| AUTH-002 | Registro sin validar duplicados | Alta |
| DBG-001 | console.log con datos sensibles | Alta |
| CONF-001 | eslint.ignoreDuringBuilds: true | Media |
| CONF-002 | Sin headers de seguridad | Media |
| BUG-001 | NEXT_PUBLIC_VAPID_KEY inconsistente | Media |
"@
Set-Content -Path "docs/04-auditorias/2026-10-13-inicial/03-codigo-fuente.md" -Value $content -Encoding UTF8
Write-Host "[OK] 03-codigo-fuente.md" -ForegroundColor Green

# --- docs/04-auditorias/2026-10-13-inicial/99-plan-remediacion.md ---
$content = @"
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
"@
Set-Content -Path "docs/04-auditorias/2026-10-13-inicial/99-plan-remediacion.md" -Value $content -Encoding UTF8
Write-Host "[OK] 99-plan-remediacion.md" -ForegroundColor Green

# --- docs/02-operaciones/ENVIRONMENT.md ---
$content = @"
# Variables de Entorno

Guia completa de variables de entorno del proyecto.

## Convencion de cuentas

- [S] = system.panfree@gmail.com (tecnico)
- [C] = contacto.panfree@gmail.com (comercial)

## Referencia

Ver .env.example en la raiz del repositorio.

## Almacenamiento

Bitwarden - Organizacion PanFree - Coleccion Produccion

## Rotacion

Ver ROTACION-CLAVES.md
"@
Set-Content -Path "docs/02-operaciones/ENVIRONMENT.md" -Value $content -Encoding UTF8
Write-Host "[OK] ENVIRONMENT.md" -ForegroundColor Green

# --- docs/02-operaciones/ROTACION-CLAVES.md ---
$content = @"
# Runbook: Rotacion de Claves

**Tiempo estimado:** 15-30 min por servicio
**Riesgo:** Medio (usuarios se desloguean)
**Horario:** Madrugada

## Pre-requisitos

- [ ] Bitwarden abierto
- [ ] Vercel abierto en Settings
- [ ] Acceso al dashboard del servicio

## Procedimiento

1. Guardar claves viejas en Bitwarden (Legado)
2. Rotar en el dashboard del servicio
3. Copiar claves nuevas
4. Guardar en Bitwarden (Produccion)
5. Actualizar .env.local
6. Actualizar Vercel
7. Redeploy
8. Verificar

## Orden

1. Supabase
2. Cloudinary
3. Resend
4. Gemini
5. Meta WhatsApp
6. Twilio
7. Instagram
8. n8n
9. GA4
10. VAPID
11. Secrets internos
12. APIs secundarias

## Rollback

Restaurar clave vieja desde Bitwarden (Legado), actualizar Vercel, redeploy.
"@
Set-Content -Path "docs/02-operaciones/ROTACION-CLAVES.md" -Value $content -Encoding UTF8
Write-Host "[OK] ROTACION-CLAVES.md" -ForegroundColor Green

# --- docs/05-runbooks/rotar-claves-supabase.md ---
$content = @"
# Runbook: Rotar Claves de Supabase

**Tiempo:** 15 minutos
**Riesgo:** Alto (usuarios se desloguean)

## Pre-requisitos

- [ ] system.panfree es Owner de la org
- [ ] Claves viejas en Bitwarden (Legado)
- [ ] .env.local abierto
- [ ] Vercel abierto

## Pasos

1. Supabase - Settings - API - JWT Settings
2. Generate new JWT secret - Confirmar
3. Copiar keys anon y service_role nuevas
4. Actualizar .env.local
5. Guardar en Bitwarden (Produccion)
6. Actualizar Vercel
7. Redeploy
8. Verificar
   - Home carga
   - Login funciona
   - /admin funciona
   - Pedido de prueba OK

## Rollback

Restaurar claves viejas desde Bitwarden (Legado), actualizar Vercel, redeploy.
"@
Set-Content -Path "docs/05-runbooks/rotar-claves-supabase.md" -Value $content -Encoding UTF8
Write-Host "[OK] rotar-claves-supabase.md" -ForegroundColor Green

# --- docs/05-runbooks/deploy-rollback.md ---
$content = @"
# Runbook: Rollback de Deploy en Vercel

## Pasos

1. Vercel - Project - Deployments
2. Identificar el ultimo deploy funcional
3. Click en los tres puntos - Promote to Production
4. Confirmar

Vercel hace el switch en segundos.
"@
Set-Content -Path "docs/05-runbooks/deploy-rollback.md" -Value $content -Encoding UTF8
Write-Host "[OK] deploy-rollback.md" -ForegroundColor Green

# --- docs/06-referencias/convenciones-codigo.md ---
$content = @"
# Convenciones de Codigo

## Commits (Conventional Commits)

    tipo(scope): descripcion

Tipos:
- feat: nueva funcionalidad
- fix: correccion de bug
- docs: documentacion
- chore: mantenimiento
- refactor: refactorizacion
- security: correccion de seguridad
- perf: performance

## Ramas

- main: produccion
- develop: integracion
- feat/nombre: nueva funcionalidad
- fix/nombre: correccion
- security/nombre: fix de seguridad
"@
Set-Content -Path "docs/06-referencias/convenciones-codigo.md" -Value $content -Encoding UTF8
Write-Host "[OK] convenciones-codigo.md" -ForegroundColor Green

# --- docs/06-referencias/glosario.md ---
$content = @"
# Glosario

| Termino | Significado |
|---|---|
| RLS | Row Level Security (PostgreSQL) |
| PPP | Precio Promedio Ponderado |
| WABA | WhatsApp Business Account |
| VAPID | Voluntary Application Server Identification |
| PWA | Progressive Web App |
| ADR | Architecture Decision Record |
| SSR | Server-Side Rendering |
| RSC | React Server Components |
"@
Set-Content -Path "docs/06-referencias/glosario.md" -Value $content -Encoding UTF8
Write-Host "[OK] glosario.md" -ForegroundColor Green

# --- docs/06-referencias/stack-tecnologico.md ---
$content = @"
# Stack Tecnologico

## Core
- Next.js 14 (App Router)
- React 18
- Node.js 18+

## Base de datos
- Supabase (PostgreSQL 15 + RLS)

## Integraciones
- Cloudinary (media)
- Resend (email)
- Meta WhatsApp Cloud API
- Twilio (fallback)
- Instagram Graph API
- Google Gemini (IA)
- n8n (automatizacion)
- GA4 + Clarity (analytics)

## Deploy
- Vercel

## Seguridad
- Bitwarden (secretos)
"@
Set-Content -Path "docs/06-referencias/stack-tecnologico.md" -Value $content -Encoding UTF8
Write-Host "[OK] stack-tecnologico.md" -ForegroundColor Green

# --- docs/01-arquitectura/decisiones/TEMPLATE.md ---
$content = @"
# ADR-NNN: Titulo de la decision

**Fecha:** YYYY-MM-DD
**Estado:** Propuesto | Aceptado | Rechazado | Obsoleto
**Decisores:** nombres

## Contexto

Que problema estamos resolviendo? Que restricciones tenemos?

## Decision

Que elegimos hacer?

## Consecuencias

### Positivas
- ...

### Negativas
- ...

## Alternativas consideradas

- Alternativa A: razon de rechazo
- Alternativa B: razon de rechazo
"@
Set-Content -Path "docs/01-arquitectura/decisiones/TEMPLATE.md" -Value $content -Encoding UTF8
Write-Host "[OK] TEMPLATE.md (ADR)" -ForegroundColor Green

# --- SECURITY.md ---
$content = @"
# Security Policy

## Reportar una vulnerabilidad

Si encontras una vulnerabilidad, NO abras un issue publico.

Envia un email a: system.panfree@gmail.com

Inclui:
- Descripcion del problema
- Pasos para reproducir
- Impacto potencial
- Sugerencia de fix (opcional)

## Tiempo de respuesta

- Confirmacion: 48 horas
- Fix o plan: 7 dias

## Alcance

Proyecto de uso privado de PanFree.
"@
Set-Content -Path "SECURITY.md" -Value $content -Encoding UTF8
Write-Host "[OK] SECURITY.md" -ForegroundColor Green

Write-Host ""
Write-Host "=== Archivos creados exitosamente ===" -ForegroundColor Cyan
Get-ChildItem -Path docs -Recurse -File | ForEach-Object { Write-Host "  $($_.FullName.Replace($PWD.Path + '\', ''))" }
Get-ChildItem -Path . -Filter "SECURITY.md" | ForEach-Object { Write-Host "  SECURITY.md" }