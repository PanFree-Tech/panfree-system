<#
.SYNOPSIS
    Cierra la Sesion 5 y genera el HANDOFF de continuidad.

.DESCRIPTION
    Genera docs/HANDOFF-2026-10-13.md con el estado actual del proyecto,
    actualiza STATUS.md si hace falta, commitea y pushea.

.PARAMETER NoCommit
    Modo dry-run: genera los archivos pero no commitea.

.EXAMPLE
    .\12-handoff-sesion-5.ps1 -NoCommit
    .\12-handoff-sesion-5.ps1
#>

[CmdletBinding()]
param(
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# ============================================================================
# Configuracion
# ============================================================================
$RepoRoot = 'C:\Users\Admin\proyectos\panfree-system'
$Handoff = Join-Path $RepoRoot 'docs\HANDOFF-2026-10-13.md'
$Status = Join-Path $RepoRoot 'docs\STATUS.md'

$Fecha = '2026-10-13'
$Session = 'Sesion 5'

$CommitF301Middleware = 'e5bed103'
$CommitF301 = '4d5bd9c2'
$CommitTooling = 'f14adb28'

function Write-Section([string]$Text) {
    Write-Host ''
    Write-Host ('=' * 70) -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host ('=' * 70) -ForegroundColor Cyan
}

function Write-Ok([string]$Text)   { Write-Host "  [OK] $Text" -ForegroundColor Green }
function Write-Warn([string]$Text) { Write-Host "  [!!] $Text" -ForegroundColor Yellow }
function Write-Err([string]$Text)  { Write-Host "  [XX] $Text" -ForegroundColor Red }
function Write-Info([string]$Text) { Write-Host "  [..] $Text" -ForegroundColor Gray }

# ============================================================================
# 1. Prerequisitos
# ============================================================================
Write-Section '1. Verificando prerequisitos'

if (-not (Test-Path $RepoRoot)) {
    Write-Err "No existe $RepoRoot"
    exit 1
}
Set-Location $RepoRoot
Write-Ok "Repo encontrado"

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') {
    Write-Warn "Rama actual: $branch (esperado: main)"
} else {
    Write-Ok "Rama: main"
}

$statusOutput = git status --short
Write-Info 'Git status:'
Write-Host $statusOutput

# ============================================================================
# 2. Generar HANDOFF
# ============================================================================
Write-Section '2. Generando HANDOFF-2026-10-13.md'

$handoffLines = @(
    '# HANDOFF PACKAGE - PanFree System',
    '',
    '**Generado:** ' + $Fecha,
    '**Sesion:** ' + $Session,
    '**Repo:** PanFree-Tech/panfree-system',
    '**Local:** C:\Users\Admin\proyectos\panfree-system',
    '**Rama:** main',
    '**Uso:** pegar este archivo al inicio de la nueva conversacion con la IA',
    '',
    '---',
    '',
    '## INSTRUCCIONES PARA LA IA',
    '',
    '1. Lee completo este documento antes de responder.',
    '2. Confirma el contexto en el primer mensaje.',
    '3. Lee los documentos clave embebidos a continuacion.',
    '4. Espera a que el usuario confirme el primer paso antes de generar scripts.',
    '',
    '**Idioma:** espanol siempre. Nunca chino.',
    '',
    '**Reglas de trabajo:**',
    '- Scripts PowerShell en `scripts/docs/` con numeracion secuencial.',
    '- Scripts menores a 400 lineas: 1 bloque completo con boton copiar.',
    '- Usar VS Code, no Notepad.',
    '- Conventional Commits (feat, fix, docs, chore, refactor, security, perf).',
    '- Actualizar STATUS.md y BITACORA.md al cerrar sesion.',
    '- Verificar links con `scripts/docs/00-verificar-links.ps1`.',
    '- No usar here-strings para bloques Markdown grandes (usar arrays).',
    '- Scripts idempotentes. Probar con `-NoCommit` antes del commit real.',
    '',
    '---',
    '',
    '## ESTADO AL CIERRE DE ' + $Session.ToUpper() + '',
    '',
    '| Metrica | Valor |',
    '|---|---|',
    '| Fase 0 | 100% (7/7) |',
    '| Fase 1 | 67% (6/9) |',
    '| Fase 2 | 0% (0/14) |',
    '| Fase 3 | 11% (1/9) |',
    '| Fase 4 | 0% (0/8) |',
    '| **Progreso global** | **30% (14/47)** |',
    '| Hallazgos cerrados | 13/27 |',
    '| Hallazgos aceptados | 1/27 |',
    '| Working tree | limpio (salvo package-lock.json, F4-05) |',
    '| Bloqueantes | ninguno |',
    '',
    '---',
    '',
    '## COMMITS DE LA SESION 5',
    '',
    '| Hash | Tipo | Descripcion |',
    '|---|---|---|',
    '| ' + $CommitF301Middleware + ' | fix(auth) | Leer rol solo desde app_metadata en middleware (SEC-003) |',
    '| ' + $CommitF301 + ' | security(auth) | Cerrar F3-01 (SEC-003+004+005+006+007, P7, BUG-002) |',
    '| ' + $CommitTooling + ' | chore(tooling) | Ignorar bloques de codigo en verificador de links |',
    '',
    '---',
    '',
    '## HALLAZGOS CERRADOS EN SESION 5',
    '',
    '| ID | Descripcion | Como se cerro |',
    '|---|---|---|',
    '| SEC-003 | Admin por user_metadata | Middleware lee solo app_metadata |',
    '| SEC-004 | UPDATE clientes.role desde cliente | REVOKE UPDATE (role) |',
    '| SEC-005 | anon con DDL sobre clientes | REVOKE ALL FROM anon |',
    '| SEC-006 | Columnas sensibles editables | GRANT UPDATE por columna |',
    '| SEC-007 | INSERT clientes.role desde frontend | GRANT INSERT por columna |',
    '| P7 | 3 politicas con auth.jwt() raiz | Migradas a app_metadata |',
    '| BUG-002 | route.js inserta avatar (col real: avatar_url) | Corregido |',
    '',
    '---',
    '',
    '## HALLAZGOS NUEVOS DETECTADOS (pendientes de tracking)',
    '',
    '**Detectados durante F3-01, NO agregados al tracking formal todavia:**',
    '',
    '| ID propuesto | Descripcion | Severidad | Fase |',
    '|---|---|---|---|',
    '| SEC-008 | crear_usuario_admin() sin chequeo de caller | **Critica** | F3 |',
    '| BUG-003 | clientes_update_policy no restringe columnas (RLS no puede) | Media | F4 |',
    '',
    '**Verificar SEC-008 en Sesion 6 con:**',
    '',
    '```sql',
    "SELECT proname, proacl FROM pg_proc WHERE proname = 'crear_usuario_admin';",
    '```',
    '',
    '---',
    '',
    '## DEUDA TECNICA ACUMULADA',
    '',
    '| Item | Tipo | Prioridad |',
    '|---|---|---|',
    '| Commit 8e403317 con mensaje duplicado | chore | Baja |',
    '| Cambiar ADVERTENCIA -> [INFO] en scripts | chore | Baja |',
    '| Crear scripts/docs/99-verificar-antes-de-commit.ps1 | chore(tooling) | Media |',
    '| Guardar 11-cerrar-sesion-*.ps1 como template | chore | Baja |',
    '| Entradas duplicadas en BITACORA.md (Sesion 2 x3, Sesion 3 x2) | chore(docs) | Media |',
    '| Seccion Sesion 3 duplicada en STATUS.md | chore(docs) | Media |',
    '| README.md de docs/ con carpetas numeradas (ya sin numeros) | chore(docs) | Baja |',
    '| package-lock.json no esta en repo (F4-05) | F4 | P1 |',
    '| SEC-008: crear_usuario_admin() | F3 | **P0** |',
    '',
    '---',
    '',
    '## PROXIMOS 3 PASOS (Sesion 6)',
    '',
    '1. **SEC-008** - Verificar y cerrar `crear_usuario_admin()` (P0, urgente).',
    '2. **F1-08** - Consolidar ~150 politicas RLS duplicadas (P2, esfuerzo L).',
    '3. **chore(docs)** - Limpiar entradas duplicadas en BITACORA.md y STATUS.md.',
    '',
    '---',
    '',
    '## DOCUMENTOS CLAVE',
    '',
    '**Estado y tracking:**',
    '- `docs/STATUS.md`',
    '- `docs/BITACORA.md`',
    '- `docs/audits/' + $Fecha + '-inicial/06-hallazgos-tracking.md`',
    '',
    '**Auditoria y hallazgos:**',
    '- `docs/audits/' + $Fecha + '-inicial/00-resumen-ejecutivo.md`',
    '- `docs/audits/' + $Fecha + '-inicial/02-supabase-advisors.md`',
    '- `docs/audits/' + $Fecha + '-inicial/13-f1-07-rls-initplan.md`',
    '- `docs/audits/' + $Fecha + '-inicial/14-f3-01-admin-app-metadata.md`',
    '- `docs/audits/' + $Fecha + '-inicial/99-plan-remediacion.md`',
    '',
    '**Arquitectura:**',
    '- `docs/architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md`',
    '- `docs/architecture/DATABASE.md`',
    '',
    '**Operaciones:**',
    '- `docs/operations/PLAN-DE-TRABAJO.md`',
    '- `docs/operations/SISTEMA-DE-TRABAJO.md`',
    '- `docs/operations/WORKFLOW-DIARIO.md`',
    '',
    '**Codigo clave (F3-01):**',
    '- `src/middleware.js` (SEC-003: solo app_metadata)',
    '- `src/app/auth/callback/route.js` (BUG-002: avatar_url)',
    '',
    '**DB (F3-01):**',
    '- `supabase/migrations/' + $Fecha + '-f3-01-admin-app-metadata.sql`',
    '- `supabase/migrations/' + $Fecha + '-f1-07-initplan.sql`',
    '',
    '**Scripts relevantes:**',
    '- `scripts/docs/00-verificar-links.ps1` (v2: ignora bloques de codigo)',
    '- `scripts/docs/10-documentar-f1-07.ps1`',
    '- `scripts/docs/11-documentar-f3-01.ps1`',
    '',
    '---',
    '',
    '## REGLAS DE SUPABASE (aprendidas en sesiones 2-5)',
    '',
    '1. **Here-strings PowerShell** se cortan con bloques Markdown grandes. Usar arrays de strings.',
    '2. **Docker Desktop + Supabase CLI** no cooperan con IPv6. Usar Session Pooler.',
    '3. **Verificar con query antes de aplicar SQL.** Documentar output real.',
    '4. **SQL Editor envuelve el RUN en transaccion implicita.** Si un DROP/CREATE falla, todo se revierte.',
    '5. **Postgres normaliza subselects:**',
    '   - (SELECT is_admin()) -> (SELECT is_admin() AS is_admin)',
    '   - (SELECT auth.uid()) -> (SELECT auth.uid() AS uid)',
    '   - (SELECT auth.jwt()) -> (SELECT auth.jwt() AS jwt)',
    '6. **auth.config NO EXISTE.** Solo Dashboard.',
    '7. **REVOKE UPDATE (col)** no funciona si hay GRANT UPDATE a nivel tabla. Usar REVOKE ALL + GRANT por columna.',
    '8. **Test de humo antes de SQL grande:** aplicar 1, verificar, despues escalar.',
    '9. **Verificar por bloques** (4 bloques de 15-20 items) es mas seguro que un SQL de 500 lineas.',
    '',
    '---',
    '',
    '## COMANDO UTIL - VOLCADO PARA PROXIMA SESION',
    '',
    'Ejecutar al inicio de la Sesion 6 para preparar el contexto:',
    '',
    '```powershell',
    '$archivos = @(',
    "    'docs/STATUS.md',",
    "    'docs/BITACORA.md',",
    "    'docs/audits/" + $Fecha + "-inicial/06-hallazgos-tracking.md',",
    "    'docs/audits/" + $Fecha + "-inicial/14-f3-01-admin-app-metadata.md',",
    "    'docs/audits/" + $Fecha + "-inicial/13-f1-07-rls-initplan.md',",
    "    'docs/audits/" + $Fecha + "-inicial/02-supabase-advisors.md',",
    "    'docs/architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md',",
    "    'docs/operations/PLAN-DE-TRABAJO.md'",
    ')',
    'foreach ($a in $archivos) { Write-Host "`n=== $a ===" ; Get-Content $a }',
    '```',
    '',
    '---',
    '',
    '## FIN DEL HANDOFF ' + $Session.ToUpper() + '',
    '',
    '*Generado por scripts/docs/12-handoff-sesion-5.ps1*'
)

$handoffLines | Set-Content -Path $Handoff -Encoding UTF8
Write-Ok "HANDOFF generado: $Handoff ($($handoffLines.Count) lineas)"

# ============================================================================
# 3. Verificar STATUS.md actualizado
# ============================================================================
Write-Section '3. Verificando STATUS.md'

if (Test-Path $Status) {
    $statusContent = Get-Content $Status -Raw
    if ($statusContent -match 'fin Sesion 5|fin sesion 5|Sesion 5') {
        Write-Ok "STATUS.md menciona Sesion 5"
    } else {
        Write-Warn "STATUS.md no menciona Sesion 5 (revisar)"
    }
} else {
    Write-Err "No existe $Status"
}

# ============================================================================
# 4. Verificar links
# ============================================================================
Write-Section '4. Verificando links'

$verificarLinks = Join-Path $RepoRoot 'scripts\docs\00-verificar-links.ps1'
if (Test-Path $verificarLinks) {
    & $verificarLinks
} else {
    Write-Warn "No existe $verificarLinks"
}

# ============================================================================
# 5. Commit y push
# ============================================================================
Write-Section '5. Commit y push'

if ($NoCommit) {
    Write-Warn "Modo -NoCommit: se omiten git add/commit/push"
    Write-Info "Revisar antes de commitear:"
    Write-Info "  - $Handoff"
    exit 0
}

Write-Info 'Git status:'
git status --short

Write-Info 'Agregando archivos...'
git add $Handoff
git add scripts/docs/12-handoff-sesion-5.ps1

$commitMsg = 'docs(session): cerrar ' + $Session.ToLower() + ' ' + $Fecha + ' v5'
Write-Info "Commit: $commitMsg"
git commit -m $commitMsg

Write-Info 'Push a origin/main...'
git push origin main

Write-Section 'LISTO'
Write-Ok 'Sesion 5 cerrada formalmente'
Write-Ok 'HANDOFF listo para Sesion 6'
Write-Ok 'Proximo paso: F1-08 o SEC-008 (decidir en Sesion 6)'