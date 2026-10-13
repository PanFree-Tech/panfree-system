# PowerShell
# =============================================================================
# 20b - Documentar cierre F3-02 / SEC-002
# =============================================================================
# Fecha: 2026-10-14
# Sesion: 10
# Hallazgo: SEC-002 (claves hardcodeadas en src/lib/supabase.js)
#
# Uso:
#   .\scripts\docs\20b-documentar-f3-02.ps1            # DRY RUN
#   .\scripts\docs\20b-documentar-f3-02.ps1 -Commit    # 2 commits + push
#
# Con -Commit hace DOS commits secuenciales:
#   1) security(src): eliminar claves hardcodeadas ... (SEC-002, F3-02)
#   2) chore(scripts): agregar script 20b-documentar-f3-02
# =============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'

# --- Rutas base --------------------------------------------------------------
$repoRoot   = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $repoRoot

$docAudit   = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial\19-f3-02-sec-002-anon-key.md'
$tracking   = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$status     = Join-Path $repoRoot 'docs\STATUS.md'
$verLinks   = Join-Path $repoRoot 'scripts\docs\00-verificar-links.ps1'
$script20a  = Join-Path $repoRoot 'scripts\docs\20a-fix-f3-02-src.ps1'
$script20b  = Join-Path $repoRoot 'scripts\docs\20b-documentar-f3-02.ps1'
$utf8NoBom  = New-Object System.Text.UTF8Encoding($false)

Write-Host ''
Write-Host ('=' * 60) -ForegroundColor Cyan
Write-Host '  20b - Documentar cierre F3-02 / SEC-002' -ForegroundColor Cyan
Write-Host ('=' * 60) -ForegroundColor Cyan
Write-Host ("  Repo: " + $repoRoot)
if ($Commit) {
    Write-Host '  Modo: COMMIT x2 + PUSH' -ForegroundColor Yellow
} else {
    Write-Host '  Modo: DRY RUN (sin commit)' -ForegroundColor Yellow
}
Write-Host ''

# --- [1/8] Prerequisitos -----------------------------------------------------
Write-Host '[1/8] Verificando prerequisitos...'

$faltantes = @()
foreach ($p in @($tracking, $status, $verLinks, $script20a)) {
    if (-not (Test-Path $p)) { $faltantes += $p }
}
if ($faltantes.Count -gt 0) {
    Write-Host ('  ERROR: faltan rutas: ' + ($faltantes -join ', ')) -ForegroundColor Red
    exit 1
}
Write-Host '  OK: rutas base existen.'

# --- [2/8] Verificar que el fix del 20a esta aplicado ------------------------
Write-Host ''
Write-Host '[2/8] Verificando que el fix del 20a esta aplicado...'

$restantes = Get-ChildItem -Path 'src' -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx |
    Select-String -Pattern 'DEFAULT_SUPABASE_ANON_KEY|DEFAULT_SUPABASE_URL'

if ($restantes) {
    Write-Host '  ERROR: todavia hay referencias a las constantes en src/:' -ForegroundColor Red
    $restantes | ForEach-Object {
        Write-Host ("    " + $_.Path + ":" + $_.LineNumber) -ForegroundColor Red
    }
    Write-Host '  Corre primero el 20a.' -ForegroundColor Yellow
    exit 1
}
Write-Host '  OK: 0 referencias en src/. El fix del 20a esta aplicado.'

# --- [3/8] Doc de auditoria --------------------------------------------------
Write-Host ''
Write-Host '[3/8] Creando doc de auditoria 19-f3-02-sec-002-anon-key.md...'

$doc = @(
    '# F3-02 / SEC-002 - Eliminar claves hardcodeadas de src/lib/supabase.js',
    '',
    '**Fecha:** 2026-10-14',
    '**Hallazgo:** SEC-002',
    '**Tarea:** F3-02',
    '**Severidad:** Alta (clave productiva filtrada en repo)',
    '**Estado:** Cerrado',
    '**Esfuerzo:** S (Small)',
    '',
    '---',
    '',
    '## 1. Contexto',
    '',
    'Durante la auditoria inicial (2026-10-13) se detecto que `src/lib/supabase.js`',
    'contenia dos constantes con valores productivos hardcodeados:',
    '',
    '- `DEFAULT_SUPABASE_URL = ''https://gbdrcaumghykiipqgbty.supabase.co'''',',
    '- `DEFAULT_SUPABASE_ANON_KEY = ''eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...''`.',
    '',
    'Se registro como **SEC-002** (Alta). La anon key es publica por diseno en',
    'Supabase (va en el bundle del browser igual), pero hardcodearla en el repo',
    'es un anti-patron por varias razones:',
    '',
    '- **Configuracion fragil:** si cambia el proyecto Supabase (o la key se',
    '  rota en Fase 2), el valor hardcodeado queda desactualizado y el fallback',
    '  silencioso enmascara el error de configuracion.',
    '- **Deploy silenciosamente roto:** si en Vercel (o donde se deploye) falta',
    '  la env var, el cliente cae silenciosamente a la constante hardcodeada,',
    '  y no hay sintoma visible de que el entorno esta mal configurado.',
    '- **Superficie de rotacion:** cualquier rotacion futura de la key obliga a',
    '  tocar el codigo, no solo las env vars.',
    '',
    'Referencia: [ADR-002](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)',
    'establece que las claves productivas viven en env vars, nunca en el codigo.',
    '',
    '---',
    '',
    '## 2. Diagnostico',
    '',
    '### 2.1 Constantes hardcodeadas',
    '',
    'En `src/lib/supabase.js` lineas 9-10:',
    '',
    '```js',
    "export const DEFAULT_SUPABASE_URL = 'https://gbdrcaumghykiipqgbty.supabase.co'",
    "export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'",
    '```',
    '',
    '### 2.2 Fallbacks silenciosos (8 archivos)',
    '',
    'Las constantes se usaban como fallback silencioso en 3 lugares dentro de',
    '`supabase.js` (`sanitizeSupabaseUrl`, `sanitizeSupabaseKey` dos veces) y en',
    '7 archivos consumidores adicionales:',
    '',
    '| # | Archivo | Uso |',
    '|---|---|---|',
    '| 1 | `src/middleware.js` | import + fallback en `supabaseAnonKey` |',
    '| 2 | `src/app/api/send-email/route.js` | import + fallback |',
    '| 3 | `src/app/api/send-whatsapp-team/route.js` | import + fallback |',
    '| 4 | `src/app/api/resumen-diario/route.js` | import + fallback |',
    '| 5 | `src/app/api/dipticos/canjear/route.js` | import (URL + KEY) + ternario |',
    '| 6 | `src/app/api/admin/marketing/programar-publicacion/route.js` | import + fallback |',
    '| 7 | `src/app/api/admin/marketing/publish-instagram/route.js` | import + fallback |',
    '',
    '### 2.3 Por que es Alta severidad',
    '',
    'La anon key es publica por diseno, asi que no hay leak de secreto real.',
    'Pero el patron de fallback silencioso convierte un error de configuracion',
    '(env var faltante) en un deploy silenciosamente distinto, lo que viola el',
    'principio de "config explicita" y complica la rotacion en Fase 2.',
    '',
    '---',
    '',
    '## 3. Fix aplicado',
    '',
    '### 3.1 Cambios en `src/lib/supabase.js`',
    '',
    '- Eliminadas las constantes `DEFAULT_SUPABASE_URL` y `DEFAULT_SUPABASE_ANON_KEY`.',
    '- `sanitizeSupabaseUrl()` y `sanitizeSupabaseKey()` ahora **fail-fast** con',
    '  `throw new Error(...)` en lugar de caer silenciosamente a un valor hardcodeado.',
    '- Eliminado el `console.warn` del bloque `if (typeof window !== ''undefined'')`',
    '  que avisaba de valores por defecto (ya no aplica: fail-fast).',
    '',
    '### 3.2 Cambios en los 7 consumidores',
    '',
    'En cada uno se reemplazo el fallback `|| DEFAULT_SUPABASE_ANON_KEY` por:',
    '',
    '```js',
    "|| (() => { throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no configurada') })()",
    '```',
    '',
    'Y se removieron los imports de las constantes eliminadas.',
    '',
    '**Decision de diseno:** no se unifico la logica de sanitizacion en los',
    'consumidores. Cada archivo mantiene su logica especifica (algunos leen',
    '`process.env` directo, otros tienen variables intermedias). Solo se cambio',
    'el punto de fallo: de caer a un valor hardcodeado, a tirar error explicito.',
    'La sanitizacion fuerte queda centralizada en `src/lib/supabase.js`.',
    '',
    '---',
    '',
    '## 4. Verificacion',
    '',
    '### 4.1 grep a 0',
    '',
    '```',
    'Get-ChildItem -Path src -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx |',
    '    Select-String -Pattern ''DEFAULT_SUPABASE_ANON_KEY|DEFAULT_SUPABASE_URL''',
    '',
    'Resultado: 0 referencias.',
    '```',
    '',
    '### 4.2 Diff limpio en archivos clave',
    '',
    '- `src/lib/supabase.js`: sin constantes, con throws, sin console.warn.',
    '- `src/middleware.js`: import limpio + IIFE throw.',
    '- `src/app/api/dipticos/canjear/route.js`: AMBAS constantes removidas del',
    '  import, ternario reemplazado.',
    '',
    '### 4.3 Comportamiento esperado',
    '',
    '| Escenario | Antes | Despues |',
    '|---|---|---|',
    '| Env vars OK | Funciona | Funciona |',
    '| Falta NEXT_PUBLIC_SUPABASE_ANON_KEY | Usa la constante hardcodeada silenciosamente | `throw new Error(''NEXT_PUBLIC_SUPABASE_ANON_KEY no configurada'')` |',
    '| Falta NEXT_PUBLIC_SUPABASE_URL | Usa la constante hardcodeada silenciosamente | `throw new Error(''NEXT_PUBLIC_SUPABASE_URL no esta configurada'')` |',
    '',
    '---',
    '',
    '## 5. Impacto',
    '',
    '### Seguridad',
    '',
    '- SEC-002 cerrado: sin valores productivos hardcodeados en `src/`.',
    '- Rotacion futura (Fase 2) no requiere tocar codigo.',
    '',
    '### Operacional',
    '',
    '- Fail-fast: si falta una env var, el error es explicito y apunta al nombre',
    '  exacto de la variable. No hay deploy silenciosamente distinto.',
    '',
    '### Funcionalidad',
    '',
    '- Sin regresiones esperadas. Los clientes se construyen igual, solo cambia',
    '  el comportamiento cuando falta configuracion.',
    '',
    '---',
    '',
    '## 6. Hallazgos colaterales (NO tocados en este fix)',
    '',
    'Durante el diagnostico se detectaron otros valores hardcodeados en `src/`',
    'que **no** se incluyeron en este fix para mantener "un commit por tarea":',
    '',
    '- **SEC-014:** VAPID key hardcodeada en `src/app/admin/page.js:41-42`.',
    '- **SEC-015:** URL Supabase hardcodeada en `src/app/api/pedidos/notificar-estado/route.js:18`',
    '  y `src/lib/notificaciones.js:39`.',
    '- **SEC-016:** Cloudinary cloud name hardcodeado en 4 lugares.',
    '- **SEC-017:** GA4 Measurement ID hardcodeado en `src/app/api/ga4/measurement/route.js:17`.',
    '',
    'Todos son P3 (higiene) y se agendan para sesiones de chores futuras.',
    '',
    '---',
    '',
    '## 7. DoD (F3-02 / SEC-002)',
    '',
    '- [x] Diagnostico completo (2 constantes, 8 archivos consumidores).',
    '- [x] Eliminadas las constantes hardcodeadas.',
    '- [x] Reemplazados los fallbacks silenciosos por fail-fast.',
    '- [x] Eliminado el `console.warn` residual.',
    '- [x] Verificacion grep a 0 en `src/`.',
    '- [x] Diff limpio en los archivos clave.',
    '- [x] Doc de auditoria generado (este archivo).',
    '- [x] Tracking actualizado (SEC-002 -> Cerrado).',
    '- [ ] Commit pusheado con `security(src):`.',
    '',
    '---',
    '',
    '## 8. Referencias',
    '',
    '- [SEC-002 en tracking](./06-hallazgos-tracking.md)',
    '- [ADR-002 - app_metadata](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)',
    '- [F1-08 - Consolidacion RLS](./15-f1-08-consolidacion-rls.md)',
    '- [F1-10 - SEC-011 email_logs](./17-f1-10-sec-011-email-logs.md)',
    '- [F1-11 - SEC-012 canjes_premios](./18-f1-11-sec-012-canjes-premios.md)',
    '- [Supabase - API Keys](https://supabase.com/docs/guides/api/api-keys)',
    '- [Supabase - Managing Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)'
) -join "`r`n"

[System.IO.File]::WriteAllText($docAudit, $doc + "`r`n", $utf8NoBom)
Write-Host ('  OK: ' + $docAudit)

# --- [4/8] Tracking ----------------------------------------------------------
Write-Host ''
Write-Host '[4/8] Actualizando 06-hallazgos-tracking.md...'

$t = [System.IO.File]::ReadAllText($tracking)
$tCambios = 0

# 4.1 SEC-002: Abierto -> Cerrado (todavia sin hash, se completa post-commit)
$filaVieja = '| SEC-002 | DEFAULT_SUPABASE_ANON_KEY hardcodeada | F3 | P1 | Abierto | - |'
$filaNueva = '| SEC-002 | DEFAULT_SUPABASE_ANON_KEY hardcodeada | F3 | P1 | Cerrado | (Sesion 10) |'

if ($t -match [regex]::Escape($filaVieja)) {
    $t = $t -replace [regex]::Escape($filaVieja), $filaNueva
    $tCambios++
    Write-Host '  OK: SEC-002 -> Cerrado.'
} elseif ($t -match [regex]::Escape($filaNueva)) {
    Write-Host '  INFO: SEC-002 ya estaba en Cerrado (idempotente).'
} else {
    Write-Host '  ADVERTENCIA: no se encontro la fila de SEC-002 en el tracking.' -ForegroundColor Yellow
    Write-Host '  Revisar manualmente antes de commitear.' -ForegroundColor Yellow
}

# 4.2 Agregar SEC-014..017 si no existen
$marcaSec014 = '| SEC-014 | VAPID key hardcodeada en src/app/admin/page.js |'
if ($t -notmatch [regex]::Escape($marcaSec014)) {
    # Insertar 4 filas nuevas despues de la fila de BUG-003 en la seccion Baja
    $marcaBug003 = '| BUG-003 | diptico/[codigo] usa .eq(''activo'') en vez de is_active | F3 | P3 | Abierto | - |'
    $filasNuevas = @(
        '| SEC-014 | VAPID key hardcodeada en src/app/admin/page.js | F3 | P3 | Abierto | - |',
        '| SEC-015 | URL Supabase hardcodeada en notificar-estado/route.js y notificaciones.js | F3 | P3 | Abierto | - |',
        '| SEC-016 | Cloudinary cloud name hardcodeado en 4 lugares | F3 | P3 | Abierto | - |',
        '| SEC-017 | GA4 Measurement ID hardcodeado en ga4/measurement/route.js | F3 | P3 | Abierto | - |'
    ) -join "`r`n"

    if ($t -match [regex]::Escape($marcaBug003)) {
        $t = $t -replace [regex]::Escape($marcaBug003), ($marcaBug003 + "`r`n" + $filasNuevas)
        $tCambios++
        Write-Host '  OK: SEC-014..017 agregados.'
    } else {
        Write-Host '  ADVERTENCIA: no se encontro la fila BUG-003 para insertar SEC-014..017.' -ForegroundColor Yellow
    }
} else {
    Write-Host '  INFO: SEC-014..017 ya estaban en el tracking (idempotente).'
}

# 4.3 Actualizar contadores del resumen (Abierto 12 -> 14, Cerrado 18 -> 19; Total 31 -> 34)
$t = $t -replace '\| Abierto \| 12 \|', '| Abierto | 14 |'
$t = $t -replace '\| Cerrado \| 18 \|', '| Cerrado | 19 |'
$t = $t -replace '\*\*Total de hallazgos:\*\* 31', '**Total de hallazgos:** 34'

[System.IO.File]::WriteAllText($tracking, $t, $utf8NoBom)
Write-Host '  OK: tracking actualizado.'

# --- [5/8] STATUS.md ---------------------------------------------------------
Write-Host ''
Write-Host '[5/8] Actualizando STATUS.md...'

$s = [System.IO.File]::ReadAllText($status)

# 5.1 Fase 3: 1/9 -> 2/9  (asumiendo que el STATUS actual dice 1/9)
$s = $s -replace '\| F3 - Codigo \| 9 \| 1 \| 0 \| 8 \| 11% \|', '| F3 - Codigo | 9 | 2 | 0 | 7 | 22% |'

# 5.2 Total: OK 18 -> 19, Pendiente 29 -> 28, % 38 -> 40
$s = $s -replace '\| \*\*Total\*\* \| \*\*47\*\* \| \*\*18\*\* \| \*\*0\*\* \| \*\*29\*\* \| \*\*38%\*\* \|', '| **Total** | **47** | **19** | **0** | **28** | **40%** |'

# 5.3 Progreso global
$s = $s -replace '\*\*Progreso global:\*\* 38% \(18 de 47 tareas\)', '**Progreso global:** 40% (19 de 47 tareas)'

# 5.4 Hallazgos cerrados: 22 -> 23
$s = $s -replace '\| Hallazgos cerrados \| 22 / 34 \| 34 / 34 \|', '| Hallazgos cerrados | 23 / 34 | 34 / 34 |'

# 5.5 Proximos 3 pasos
$s = $s -replace '1\. \*\*F3-02\*\* - SEC-002: quitar claves hardcodeadas \(P1\)', '1. **F3-04** - AUTH-001: contrasenas debiles (P1)'
$s = $s -replace '2\. \*\*chore\(docs\)\*\* - Limpiar BITACORA.md y STATUS.md \(duplicados\)', '2. **chore(docs)** - Limpiar BITACORA.md y STATUS.md (duplicados)'
$s = $s -replace '3\. \*\*F3-04\*\* - AUTH-001: contrasenas debiles \(P1\)', '3. **F3-05** - AUTH-002: registro sin validar duplicados (P1)'

[System.IO.File]::WriteAllText($status, $s, $utf8NoBom)
Write-Host '  OK: STATUS.md actualizado.'

# --- [6/8] Verificar links ---------------------------------------------------
Write-Host ''
Write-Host '[6/8] Verificando links de la documentacion...'
& powershell -ExecutionPolicy Bypass -File $verLinks

# --- [7/8] Resumen de cambios ------------------------------------------------
Write-Host ''
Write-Host '[7/8] Cambios a commitear (commit 1):'
git status --short

# --- [8/8] Commits -----------------------------------------------------------
Write-Host ''
if (-not $Commit) {
    Write-Host 'Modo DRY RUN. No se commiteo nada.' -ForegroundColor Yellow
    Write-Host 'Revisa los archivos creados/modificados y despues corre:'
    Write-Host '  .\scripts\docs\20b-documentar-f3-02.ps1 -Commit' -ForegroundColor Cyan
} else {
    Write-Host 'Modo -Commit activado. Preparando commit 1 (fix)...' -ForegroundColor Yellow

    Push-Location $repoRoot
    try {
        # --- Commit 1: fix ---
        git add 'src/lib/supabase.js'
        git add 'src/middleware.js'
        git add 'src/app/api/send-email/route.js'
        git add 'src/app/api/send-whatsapp-team/route.js'
        git add 'src/app/api/resumen-diario/route.js'
        git add 'src/app/api/dipticos/canjear/route.js'
        git add 'src/app/api/admin/marketing/programar-publicacion/route.js'
        git add 'src/app/api/admin/marketing/publish-instagram/route.js'
        git add $docAudit
        git add $tracking
        git add $status
        git add $script20a

        $msg1 = 'security(src): eliminar claves hardcodeadas en src/lib/supabase.js (SEC-002, F3-02)'
        git commit -m $msg1
        if ($LASTEXITCODE -ne 0) {
            Write-Host '  ERROR: git commit 1 fallo.' -ForegroundColor Red
            exit 1
        }
        Write-Host '  OK: commit 1 creado.' -ForegroundColor Green

        git push origin main
        if ($LASTEXITCODE -ne 0) {
            Write-Host '  ERROR: git push 1 fallo.' -ForegroundColor Red
            exit 1
        }
        Write-Host '  OK: push 1 completado.' -ForegroundColor Green

        # --- Commit 2: script 20b ---
        Write-Host ''
        Write-Host '  Preparando commit 2 (script 20b)...' -ForegroundColor Yellow

        git add $script20b
        $msg2 = 'chore(scripts): agregar script 20b-documentar-f3-02'
        git commit -m $msg2
        if ($LASTEXITCODE -ne 0) {
            Write-Host '  ERROR: git commit 2 fallo.' -ForegroundColor Red
            exit 1
        }
        Write-Host '  OK: commit 2 creado.' -ForegroundColor Green

        git push origin main
        if ($LASTEXITCODE -ne 0) {
            Write-Host '  ERROR: git push 2 fallo.' -ForegroundColor Red
            exit 1
        }
        Write-Host '  OK: push 2 completado.' -ForegroundColor Green
    } finally {
        Pop-Location
    }

    # --- Verificacion final ---
    Write-Host ''
    Write-Host '  git log --oneline -5:' -ForegroundColor Cyan
    git log --oneline -5

    Write-Host ''
    Write-Host '  git status --short:' -ForegroundColor Cyan
    git status --short
}

Write-Host ''
Write-Host ('=' * 60) -ForegroundColor Cyan
Write-Host '  Script 20b finalizado' -ForegroundColor Cyan
Write-Host ('=' * 60) -ForegroundColor Cyan
Write-Host ''