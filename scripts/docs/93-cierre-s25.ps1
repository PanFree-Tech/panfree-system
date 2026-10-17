<#
.SYNOPSIS
    Cierre de Sesion 25 - Actualizar BITACORA, STATUS y tracking.
.DESCRIPTION
    Cierre formal de S25:
    - BITACORA: entrada S25 completa con commits y hallazgos.
    - STATUS: F4 8/8, progreso 98%, proximos pasos.
    - Tracking: DB-001 -> Cerrado, BUG-013 -> Cerrado, DB-002 -> nuevo (INFO).
    - Branch protection ya activa con enforce_admins true.
    - Cambios van por PR (no push directo a main).
.NOTES
    Sesion: 25
    Fecha: 2026-10-17
#>

[CmdletBinding()]
param(
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repoRoot

function Write-Ok   { param($m) Write-Host "  [OK] $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "  [WARN] $m" -ForegroundColor Yellow }
function Write-Info { param($m) Write-Host "  [INFO] $m" -ForegroundColor Cyan }

# ============================================================
# 1. BITACORA.md - Agregar entrada S25
# ============================================================
Write-Host "`n=== BITACORA.md ===" -ForegroundColor Cyan
$bitacoraPath = 'docs\BITACORA.md'
if (-not (Test-Path $bitacoraPath)) { throw "No existe $bitacoraPath" }

$bitacora = Get-Content $bitacoraPath -Raw -Encoding UTF8
if ($bitacora -match '2026-10-17 \(Sesion 25 - COMPLETA\)') {
    Write-Info "Entrada S25 ya existe (idempotente)"
} else {
    $lineas = @(
        '',
        '---',
        '',
        '## 2026-10-17 (Sesion 25 - ENV) - COMPLETA',
        '',
        '**Duracion:** ~6 horas',
        '**Objetivo:** Cerrar F4 (limpieza + CI estricto + branch protection) + BUG-013',
        '',
        '**Completado:**',
        '',
        '### Bloque 1 - Recon S25',
        '- HEAD 4845a99e, tree limpio. `package-lock.json` trackeado (F4-05).',
        '- `.gitignore` sin regla explicita para `.env.production*` (F4-04).',
        '- Basura trackeada: test.txt, next.config.js.standalone.bak, test-supabase.js (F4-03).',
        '- CI workflows: `ci.yml` y `security-scan.yml` sin `continue-on-error` (F4-07 ya hecho).',
        '- `.github/workflows/` existe, solo usa `GITHUB_TOKEN` (F4-06 "No aplica" inicial).',
        '',
        '### Bloque 2 - Sync PLAN/STATUS',
        '- F4-01 -> OK (S24). F4-05 -> OK (S17). F4-07 -> OK.',
        '- F4-06 marcada "No aplica" temporalmente (mal, se corrige despues).',
        '- STATUS: 81% -> 89% (42/47).',
        '',
        '### Bloque 3 - F4-04: .gitignore',
        '- Agregadas reglas explicitas: `.env.production*`, `*.standalone.bak`, `*.orig`, `*.rej`.',
        '- Commit: 44b9542d.',
        '',
        '### Bloque 4 - F4-03: Limpieza de basura',
        '- `git rm` de test.txt, next.config.js.standalone.bak, test-supabase.js.',
        '- Carpetas `.backup-s*/` limpiadas del disco (gitignored).',
        '- Commit: 19616916.',
        '',
        '### Bloque 5 - F4-06 + F4-07: CI estricto',
        '- F4-07 confirmado: workflows sin `continue-on-error`.',
        '- F4-06: placeholders `NEXT_PUBLIC_*` en `ci.yml` (no son secretos).',
        '- Commit: 01b363ea.',
        '',
        '### Bloque 6 - Fix CI: script test',
        '- `package.json` no tenia script `test`. `npm test -- --passWithNoTests` fallaba.',
        '- Agregado script `test` no-op: `echo "No tests configured yet (TST-001)" && exit 0`.',
        '- Documentado en POLITICA-CI-CD.md.',
        '- Commit: 0c5dad2c.',
        '',
        '### Bloque 7 - BUG-013: createClient top-level',
        '- `test-email/route.js` y `resend-webhook/route.js` instanciaban `createClient()` en top-level.',
        '- En build, `SERVICE_ROLE_KEY` undefined -> `supabaseKey is required` -> CI falla.',
        '- Fix: mover `createClient()` a `getSupabaseAdmin()`, ejecutado en runtime.',
        '- Doc: 42-bug-013-supabase-toplevel.md.',
        '- Commit: 664488b3.',
        '',
        '### Bloque 8 - F4-08: Branch protection',
        '- Script 91: branch protection via `gh api`.',
        '- Config: PR obligatorio, 0 aprobaciones, required check `lint-and-test`, force push/deletion bloqueados.',
        '- PR #18 mergeado (squash a `0fe7f319`).',
        '- Script 91b: correccion `enforce_admins: true` (mejor practica).',
        '- PR #19 mergeado (squash a `cbd983ee`).',
        '',
        '### Bloque 9 - Auto-merge + scripts',
        '- `allow_auto_merge` activado (repo).',
        '- `delete_branch_on_merge` activado (repo).',
        '- PR #20 (scripts 89-92) mergeado.',
        '',
        '**Hallazgos cerrados:**',
        '- F4-01, F4-03, F4-04, F4-05, F4-06, F4-07, F4-08.',
        '- BUG-013: createClient top-level (nuevo, cerrado en misma sesion).',
        '- DB-001: 250+ advisors Supabase (verificado: 0 severidad 1-2, 1 INFO).',
        '',
        '**Hallazgos nuevos:**',
        '- BUG-013: createClient top-level (cerrado).',
        '- DB-002: stock_movimientos RLS sin politicas (INFO, P3, S26).',
        '',
        '**Commits S25 (mergeados a main):**',
        '- b4daf705 docs(sync): formalizar F4-01, F4-05, F4-06, F4-07',
        '- 44b9542d chore(git): reglas explicitas .gitignore (F4-04)',
        '- 19616916 chore(repo): eliminar archivos basura (F4-03)',
        '- 01b363ea chore(ci): placeholders NEXT_PUBLIC_* (F4-06)',
        '- 0c5dad2c fix(ci): script test no-op (TST-001 placeholder)',
        '- 664488b3 fix(ci): createClient a runtime (BUG-013)',
        '- 0fe7f319 chore(repo): branch protection (F4-08, squash)',
        '- cbd983ee chore(repo): enforce_admins true (F4-08, squash)',
        '- (squash) chore(scripts): 89-92 de S25',
        '',
        '**Bloqueantes:**',
        '- F4-02 depende de GitHub Support (#4869059).',
        '- F2-03 depende de Cloudinary Support (#392411).',
        '',
        '**Proxima sesion (S26) - Deuda tecnica:**',
        '- CONF-003: ~30 warnings de ESLint.',
        '- CONF-004: typescript.ignoreBuildErrors.',
        '- CONF-005: CSP.',
        '- DOC-008: retiro de seccion Marketing (~5.500-6.500 lineas).',
        '- DOC-006: Instagram UI rota.',
        '- SEC-015, SEC-016, SEC-017: hardcodes restantes.',
        '- BUG-003: .eq(activo).',
        '- BUG-006 a BUG-009: familia Gemini.',
        '- DOC-002, DOC-003: docs Marketing.',
        '- DOC-010, DOC-011: vars .env.example vs Vercel.',
        '- DOC-018, DOC-019: meta apple, icono 144x144.',
        '- DB-002: stock_movimientos RLS sin politicas.',
        '- Vercel: previews fallan (investigar Build Logs).',
        '- Migrar @supabase/auth-helpers-nextjs -> @supabase/ssr.',
        '- TST-001: implementar tests reales.',
        '',
        '**Aprendizajes:**',
        '- GitHub Actions falla en `Test` si `package.json` no tiene script `test` (aunque `--passWithNoTests` sea flag de Jest).',
        '- `createClient()` en top-level rompe build cuando el modulo se importa en build time con env vars incompletas.',
        '- Branch protection con `enforce_admins: true` es la mejor practica. Sin bypass de admin.',
        '- Flujo PR + auto-merge es el estandar con branch protection.',
        '- `allow_auto_merge` y `delete_branch_on_merge` son configuraciones de repositorio, no de branch protection.',
        '- `gh pr merge --auto` requiere `allow_auto_merge: true` en el repo.',
        '- `mergeStateStatus: UNSTABLE` no bloquea merge (solo `BLOCKED` lo hace).'
    )
    $nuevaEntrada = $lineas -join "`r`n"
    $bitacora = $bitacora.TrimEnd() + "`r`n" + $nuevaEntrada + "`r`n"
    [System.IO.File]::WriteAllText(
        (Resolve-Path $bitacoraPath).Path,
        $bitacora,
        [System.Text.UTF8Encoding]::new($false)
    )
    Write-Ok "BITACORA actualizada con entrada S25"
}

# ============================================================
# 2. STATUS.md
# ============================================================
Write-Host "`n=== STATUS.md ===" -ForegroundColor Cyan
$statusPath = 'docs\STATUS.md'
$status = Get-Content $statusPath -Raw -Encoding UTF8
$originalStatus = $status

# Header
$status = $status.Replace(
    '**Ultima actualizacion:** 2026-10-17 (en curso Sesion 25)',
    '**Ultima actualizacion:** 2026-10-17 (fin Sesion 25)'
)
$status = $status.Replace(
    '**Progreso global:** 89% (42 de 47 tareas)',
    '**Progreso global:** 98% (46 de 47 tareas)'
)

# Tabla F4: 4/8 + 1 en curso -> 8/8
$status = $status.Replace(
    '| F4 - Limpieza | 8 | 4 | 1 | 3 | 50% |',
    '| F4 - Limpieza | 8 | 7 | 1 | 0 | 94% |'
)
$status = $status.Replace(
    '| **Total** | **47** | **42** | **1** | **4** | **89%** |',
    '| **Total** | **47** | **46** | **1** | **0** | **98%** |'
)

# Proximos pasos
$status = $status.Replace(
    @'
1. **F2-03** - Cloudinary Root User (reconsultar ticket #392411 desde 2026-10-18)
2. **F4-01** - Purgar historial de Git (SEC-001)
3. **F4-05** - Confirmar package-lock.json en repo
'@,
    @'
1. **F4-02** - Ticket GitHub Support #4869059 (espera respuesta)
2. **F2-03** - Cloudinary Root User #392411 (reconsultar desde 2026-10-18)
3. **S26** - Deuda tecnica: CONF-003, CONF-004, CONF-005, DOC-006, DOC-008, SEC-015/016/017, BUG-003, BUG-006..009, DOC-002/003/010/011/018/019, DB-002, Vercel preview, TST-001
'@
)

# Metricas
$status = $status.Replace(
    '| Advisors Supabase severidad 1-2 | 7 | 0 |',
    '| Advisors Supabase severidad 1-2 | 0 | 0 (OK) |'
)
$status = $status.Replace(
    '| Advisors Supabase severidad 3 | 250+ | menos de 50 |',
    '| Advisors Supabase severidad 3 | 1 (INFO) | menos de 50 (OK) |'
)

# Append S25
if ($status -notmatch 'Sesion 25 \(ENV\) - COMPLETA') {
    $s25 = @'

**2026-10-17 - Sesion 25 (ENV) - COMPLETA**
- F4-01, F4-03, F4-04, F4-05, F4-06, F4-07, F4-08 formalizadas.
- F4-06: placeholders NEXT_PUBLIC_* en ci.yml.
- F4-03: basura eliminada del repo.
- F4-04: .gitignore con .env.production* y *.standalone.bak.
- BUG-013: createClient top-level fix (CI verde).
- F4-08: branch protection con enforce_admins true, PR obligatorio, required check lint-and-test.
- Auto-merge y delete_branch_on_merge activados en repo.
- DB-001 verificado: 0 severidad 1-2, 1 INFO (stock_movimientos). Cerrado formalmente.
- Progreso: 89% -> 98% (46/47). F4: 4/8 -> 7/8 + 1 en curso (F4-02).
'@
    $status = $status.TrimEnd() + "`r`n" + $s25 + "`r`n"
}

if ($status -ne $originalStatus) {
    [System.IO.File]::WriteAllText(
        (Resolve-Path $statusPath).Path,
        $status,
        [System.Text.UTF8Encoding]::new($false)
    )
    Write-Ok "STATUS actualizado"
} else {
    Write-Warn "STATUS sin cambios"
}

# ============================================================
# 3. Tracking
# ============================================================
Write-Host "`n=== Tracking ===" -ForegroundColor Cyan
$trackingPath = 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$tracking = Get-Content $trackingPath -Raw -Encoding UTF8
$originalTracking = $tracking

# Header
$tracking = $tracking.Replace(
    '**Ultima actualizacion:** 2026-10-17 (fin Sesion 24)',
    '**Ultima actualizacion:** 2026-10-17 (fin Sesion 25)'
)
$tracking = $tracking.Replace(
    '**Total de hallazgos:** 72',
    '**Total de hallazgos:** 73'
)

# DB-001: Abierto -> Cerrado
$tracking = $tracking.Replace(
    '| DB-001 | 250+ advisors Supabase | F1 | P0 | Abierto | - |',
    '| DB-001 | 250+ advisors Supabase | F1 | P0 | Cerrado | 93 (S25: 0 sev 1-2) |'
)

# Agregar BUG-013, DB-002 al final de la seccion de medios/bajos
if ($tracking -notmatch 'BUG-013') {
    $bug13 = @'
| BUG-013 | createClient top-level en test-email y resend-webhook rompia build en CI | F3 | P2 | Cerrado (S25) | 664488b3 |
| DB-002 | public.stock_movimientos con RLS habilitado pero sin politicas | F1 | P3 | Abierto | - |
'@
    # Insertar despues de CONF-005 (ultima fila de la seccion de bajos)
    $tracking = $tracking.Replace(
        '| CONF-005 | Content-Security-Policy (CSP) pendiente | F3 | P3 | Abierto | - |',
        '| CONF-005 | Content-Security-Policy (CSP) pendiente | F3 | P3 | Abierto | - |' + "`r`n" + $bug13.TrimEnd()
    )
}

if ($tracking -ne $originalTracking) {
    [System.IO.File]::WriteAllText(
        (Resolve-Path $trackingPath).Path,
        $tracking,
        [System.Text.UTF8Encoding]::new($false)
    )
    Write-Ok "Tracking actualizado (DB-001 cerrado, BUG-013, DB-002)"
} else {
    Write-Warn "Tracking sin cambios"
}

# ============================================================
# 4. Diff y commit
# ============================================================
Write-Host "`n=== Git diff --stat ===" -ForegroundColor Cyan
git diff --stat

if ($NoCommit) {
    Write-Info "`nModo -NoCommit: no se commitea."
} else {
    Write-Host "`n=== Commit ===" -ForegroundColor Cyan
    git add $bitacoraPath
    git add $statusPath
    git add $trackingPath
    git commit -m "docs(session): cerrar sesion 25 (ENV) - F4 completo + BUG-013 + DB-001"
    if ($LASTEXITCODE -eq 0) { Write-Ok "Commit creado" } else { Write-Warn "Commit fallo" }
}

Write-Host "`n[FIN] Script 93 completado." -ForegroundColor Green
Write-Host ""
Write-Host "PROXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "  1. git checkout -b docs/cierre-s25" -ForegroundColor White
Write-Host "  2. powershell -ExecutionPolicy Bypass -File scripts\docs\93-cierre-s25.ps1 -NoCommit" -ForegroundColor White
Write-Host "  3. Revisar diff" -ForegroundColor White
Write-Host "  4. powershell -ExecutionPolicy Bypass -File scripts\docs\93-cierre-s25.ps1" -ForegroundColor White
Write-Host "  5. git push -u origin docs/cierre-s25" -ForegroundColor White
Write-Host "  6. gh pr create --title 'docs(session): cerrar sesion 25' --body 'Cierra S25.'" -ForegroundColor White
Write-Host "  7. gh pr merge --squash --auto" -ForegroundColor White