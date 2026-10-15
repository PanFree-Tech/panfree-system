# ============================================================================
# 36-sec-008-eliminar-crear-usuario-admin.ps1
# ----------------------------------------------------------------------------
# Cierra SEC-008: elimina funcion sin uso crear_usuario_admin.
#
# Contexto:
#   - Detectado en handoff S5, nunca formalizado en tracking.
#   - Verificado en S15: 0 referencias en src/, funcion ya eliminada en DB.
#
# Actualiza:
#   - docs/audits/2026-10-13-inicial/25-sec-008-crear-usuario-admin.md (crea)
#   - docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md (SEC-008 + contadores)
#   - docs/STATUS.md (corrige tabla + fecha + hallazgos cerrados)
#
# Fecha: 2026-10-14
# Sesion: 15
# ----------------------------------------------------------------------------
# Uso:
#   Dry run:  .\36-sec-008-eliminar-crear-usuario-admin.ps1
#   Aplicar:  .\36-sec-008-eliminar-crear-usuario-admin.ps1 -Commit
# ============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BackupDir = Join-Path $PSScriptRoot '.backup-s15'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-Step([string]$m) { Write-Host ''; Write-Host ('== ' + $m) -ForegroundColor Cyan }
function Write-Ok([string]$m)   { Write-Host ('   [OK]   ' + $m) -ForegroundColor Green }
function Write-Skip([string]$m) { Write-Host ('   [SKIP] ' + $m) -ForegroundColor Yellow }
function Write-Err([string]$m)  { Write-Host ('   [ERR]  ' + $m) -ForegroundColor Red }

function Read-FileRaw([string]$path) {
    return [System.IO.File]::ReadAllText($path, $Utf8NoBom)
}
function Write-FileRaw([string]$path, [string]$content) {
    [System.IO.File]::WriteAllText($path, $content, $Utf8NoBom)
}
function Backup-File([string]$path, [string]$stamp) {
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
    $rel = $path.Substring($RepoRoot.Length).TrimStart('\')
    $safe = $rel.Replace('\', '__')
    $dest = Join-Path $BackupDir ($stamp + '__' + $safe)
    Copy-Item -LiteralPath $path -Destination $dest -Force
}

Write-Step 'Precondiciones'
Push-Location $RepoRoot

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') { Write-Err ('Rama: ' + $branch); Pop-Location; exit 1 }
Write-Ok ('Rama: ' + $branch)
Write-Ok ('HEAD: ' + (git rev-parse HEAD).Trim())

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

# ============================================================================
# 1. Crear doc de auditoria
# ============================================================================

Write-Step 'Crear docs/audits/2026-10-13-inicial/25-sec-008-crear-usuario-admin.md'

$docPath = Join-Path $RepoRoot 'docs\audits\2026-10-13-inicial\25-sec-008-crear-usuario-admin.md'

$docContent = @(
    '# SEC-008 - Eliminar funcion sin uso crear_usuario_admin',
    '',
    '**Fecha:** 2026-10-14',
    '**Hallazgo:** SEC-008',
    '**Severidad:** Media (P2)',
    '**Estado:** Cerrado',
    '**Sesion:** 15',
    '**Origen:** Detectado en handoff de Sesion 5, nunca formalizado en tracking.',
    '',
    '---',
    '',
    '## 1. Contexto',
    '',
    'En el handoff de la Sesion 5 (script 12-handoff-sesion-5.ps1) se detecto',
    'la funcion `public.crear_usuario_admin(text, text)` como posible hallazgo',
    'critico (SEC-008), pero nunca se formalizo en el tracking. La tarea paso',
    'a "pendiente de verificar en Sesion 6" y quedo sin cerrar.',
    '',
    'En S15 se retomo el hallazgo y se verifico su estado real.',
    '',
    '---',
    '',
    '## 2. Diagnostico',
    '',
    '### 2.1 Definicion original',
    '',
    '```sql',
    'CREATE OR REPLACE FUNCTION public.crear_usuario_admin(p_email text, p_password text)',
    ' RETURNS uuid',
    ' LANGUAGE plpgsql',
    ' SECURITY DEFINER',
    " SET search_path TO 'public'",
    'AS $function$',
    'DECLARE',
    '  v_user_id UUID;',
    'BEGIN',
    '  INSERT INTO auth.users (...)',
    '  VALUES (...)',
    '  RETURNING id INTO v_user_id;',
    '  RETURN v_user_id;',
    'END;',
    '$function$',
    '```',
    '',
    '### 2.2 Estado de permisos (proacl)',
    '',
    '```',
    '{postgres=X/postgres,service_role=X/postgres}',
    '```',
    '',
    '**Interpretacion:** solo `postgres` y `service_role` tienen EXECUTE.',
    '`anon` y `authenticated` **NO** pueden invocarla via RPC (ya bloqueado',
    'por F1-03).',
    '',
    '### 2.3 Problemas detectados',
    '',
    '1. **No valida al caller.** Sin chequeo de quien la ejecuta.',
    '2. **No registra en logs_auditoria.** Viola ARCHITECTURE.md seccion 5.1.',
    '3. **Acepta password en texto plano** como parametro.',
    '4. **Marca email_confirmed_at = NOW()** sin verificacion.',
    '5. **No crea registro en public.clientes** (inconsistencia potencial).',
    '6. **Nunca estuvo en el tracking formal.** Trazabilidad perdida desde S5.',
    '',
    '### 2.4 Verificacion de uso (2026-10-14)',
    '',
    'Grep en el repositorio:',
    '',
    '```powershell',
    "Get-ChildItem -Path src -Recurse -File -Include *.js,*.jsx |",
    "    Select-String -Pattern 'crear_usuario_admin'",
    '```',
    '',
    '**Resultado:** 0 referencias en `src/`.',
    '',
    '```powershell',
    "Get-ChildItem -Path scripts,supabase -Recurse -File -Include *.ps1,*.sql |",
    "    Select-String -Pattern 'crear_usuario_admin'",
    '```',
    '',
    '**Resultado:** 4 referencias, todas dentro de',
    '`scripts/docs/12-handoff-sesion-5.ps1` (autorreferencias del handoff).',
    '',
    'Ninguna referencia en codigo de produccion ni en migraciones versionadas.',
    '',
    '### 2.5 Reclasificacion de severidad',
    '',
    'El handoff de S5 la marco como **Critica (P0)**, pero esa estimacion fue',
    'preliminar, sin verificar `proacl`. Con la evidencia real (2026-10-14):',
    '',
    '- **NO es explotable hoy** (proacl restringido a service_role).',
    '- **NO tiene uso** en codigo de produccion.',
    '- **Es inconsistente** con ADR-002 y ARCHITECTURE.md seccion 5.1.',
    '',
    '**Severidad real: Media (P2).**',
    '',
    '---',
    '',
    '## 3. Decision',
    '',
    '**Eliminar la funcion.**',
    '',
    'Justificacion:',
    '- No tiene uso en codigo de produccion (verificado).',
    '- Es SECURITY DEFINER sin defensa en profundidad.',
    '- Es superficie de ataque innecesaria.',
    '- Es la opcion mas limpia: menos codigo = menos superficie.',
    '- Si en el futuro se necesita crear usuarios admin, se hara desde el',
    '  Dashboard de Supabase o desde un endpoint server-side bien disenado.',
    '',
    '---',
    '',
    '## 4. Fix aplicado',
    '',
    '### 4.1 SQL',
    '',
    '```sql',
    'DROP FUNCTION IF EXISTS public.crear_usuario_admin(text, text);',
    '```',
    '',
    '### 4.2 Evidencia (SQL Editor, 2026-10-14)',
    '',
    '**Ejecucion del DROP:**',
    '```',
    'Success. No rows returned',
    '```',
    '',
    '**Verificacion 1 - La funcion no existe:**',
    '',
    '```sql',
    'SELECT proname, prosecdef, proacl',
    'FROM pg_proc p',
    'JOIN pg_namespace n ON n.oid = p.pronamespace',
    "WHERE n.nspname = 'public'",
    "  AND p.proname = 'crear_usuario_admin';",
    '```',
    '',
    'Resultado: `Success. No rows returned`',
    '',
    '**Verificacion 2 - Ninguna otra funcion la invoca:**',
    '',
    '```sql',
    'SELECT proname, prosrc',
    'FROM pg_proc p',
    'JOIN pg_namespace n ON n.oid = p.pronamespace',
    "WHERE n.nspname = 'public'",
    "  AND p.prosrc LIKE '%crear_usuario_admin%'",
    "  AND p.proname <> 'crear_usuario_admin';",
    '```',
    '',
    'Resultado: `Success. No rows returned`',
    '',
    '---',
    '',
    '## 5. Impacto',
    '',
    '### Seguridad',
    '',
    '- SEC-008 cerrado.',
    '- Reduccion de superficie de ataque (una funcion SECURITY DEFINER menos).',
    '- Consistencia con ADR-002: ninguna funcion privilegiada sin defensa.',
    '',
    '### Funcionalidad',
    '',
    '- Sin regresiones: la funcion no estaba en uso.',
    '- Sin dependencias ocultas (verificado por query).',
    '',
    '---',
    '',
    '## 6. Rollback',
    '',
    'Si en el futuro se necesita restaurar la funcion:',
    '',
    '```sql',
    'CREATE OR REPLACE FUNCTION public.crear_usuario_admin(p_email text, p_password text)',
    ' RETURNS uuid',
    ' LANGUAGE plpgsql',
    ' SECURITY DEFINER',
    " SET search_path TO 'public'",
    'AS $function$',
    'DECLARE',
    '  v_user_id UUID;',
    'BEGIN',
    '  INSERT INTO auth.users (...)',
    '  VALUES (...)',
    '  RETURNING id INTO v_user_id;',
    '  RETURN v_user_id;',
    'END;',
    '$function$;',
    'REVOKE EXECUTE ON FUNCTION public.crear_usuario_admin(text, text)',
    '  FROM anon, authenticated, public;',
    '```',
    '',
    '**NO RECOMENDADO:** reintroduce la superficie de ataque innecesaria.',
    '',
    '---',
    '',
    '## 7. DoD (SEC-008)',
    '',
    '- [x] Diagnostico completo (definicion, proacl, uso en codigo).',
    '- [x] Verificacion de uso: 0 referencias en src/.',
    '- [x] Reclasificacion de severidad (Critica -> Media, con evidencia).',
    '- [x] Decision justificada (eliminar).',
    '- [x] Fix aplicado en DB (DROP FUNCTION).',
    '- [x] Verificacion POST 1: funcion no existe.',
    '- [x] Verificacion POST 2: sin dependencias ocultas.',
    '- [x] Doc de auditoria generado (este archivo).',
    '- [x] Tracking actualizado (SEC-008 -> Cerrado).',
    '- [ ] Commit pusheado con security(db):',
    '',
    '---',
    '',
    '## 8. Referencias',
    '',
    '- [SEC-008 en tracking](./06-hallazgos-tracking.md)',
    '- [Handoff Sesion 5](../../../scripts/docs/12-handoff-sesion-5.ps1)',
    '- [ADR-002 - app_metadata](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)',
    '- [ARCHITECTURE.md seccion 5.1](../../architecture/ARCHITECTURE.md)',
    '- [F1-03 - Restringir funciones SECURITY DEFINER](./09-f1-03-fix-funciones-security-definer.md)',
    ''
) -join "`r`n"

if (Test-Path -LiteralPath $docPath) {
    Write-Skip '25-sec-008-crear-usuario-admin.md ya existe'
} else {
    if ($Commit) {
        Write-FileRaw $docPath $docContent
        Write-Ok '25-sec-008-crear-usuario-admin.md creado'
    } else {
        Write-Host '   (dry run: doc NO escrito)' -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 2. Actualizar tracking
# ============================================================================

Write-Step 'Actualizar 06-hallazgos-tracking.md'

$trackPath = Join-Path $RepoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
if (-not (Test-Path -LiteralPath $trackPath)) {
    Write-Err '06-hallazgos-tracking.md no existe'
    Pop-Location
    exit 1
}

$track = Read-FileRaw $trackPath

if ($track.Contains('SEC-008')) {
    Write-Skip 'SEC-008 ya presente en tracking'
} else {
    # 2a. Fecha
    $fechaVieja = '**Ultima actualizacion:** 2026-10-14 (fin Sesion 14)'
    $fechaNueva = '**Ultima actualizacion:** 2026-10-14 (fin Sesion 15)'
    if ($track.Contains($fechaVieja)) {
        $track = $track.Replace($fechaVieja, $fechaNueva)
        Write-Ok 'Fecha actualizada a fin Sesion 15'
    } else {
        Write-Skip 'Fecha vieja no encontrada'
    }

    # 2b. Total 45 -> 46
    $totalViejo = '**Total de hallazgos:** 45'
    $totalNuevo = '**Total de hallazgos:** 46'
    if ($track.Contains($totalViejo)) {
        $track = $track.Replace($totalViejo, $totalNuevo)
        Write-Ok 'Total actualizado: 45 -> 46'
    } else {
        Write-Err 'No encontre Total=45'
        Pop-Location
        exit 1
    }

    # 2c. Resumen: Cerrado 28 -> 29
    $resViejo = @(
        '| Estado | Cantidad |',
        '|---|---|',
        '| Abierto | 16 |',
        '| En curso | 0 |',
        '| Cerrado | 28 |',
        '| Aceptado | 1 |'
    ) -join "`r`n"
    $resNuevo = @(
        '| Estado | Cantidad |',
        '|---|---|',
        '| Abierto | 16 |',
        '| En curso | 0 |',
        '| Cerrado | 29 |',
        '| Aceptado | 1 |'
    ) -join "`r`n"
    if ($track.Contains($resViejo)) {
        $track = $track.Replace($resViejo, $resNuevo)
        Write-Ok 'Resumen actualizado: Cerrado 28 -> 29'
    } else {
        Write-Err 'No encontre resumen (Cerrado 28)'
        Pop-Location
        exit 1
    }

    # 2d. Severidad: Media 15/4 -> 16/5
    $sevViejo = @(
        '| Severidad | Cantidad | Cerrados |',
        '|---|---|---|',
        '| Critica | 9 | 7 |',
        '| Alta | 11 | 7 |',
        '| Media | 15 | 4 |',
        '| Baja | 7 | 1 |'
    ) -join "`r`n"
    $sevNuevo = @(
        '| Severidad | Cantidad | Cerrados |',
        '|---|---|---|',
        '| Critica | 9 | 7 |',
        '| Alta | 11 | 7 |',
        '| Media | 16 | 5 |',
        '| Baja | 7 | 1 |'
    ) -join "`r`n"
    if ($track.Contains($sevViejo)) {
        $track = $track.Replace($sevViejo, $sevNuevo)
        Write-Ok 'Severidad actualizada: Media 15/4 -> 16/5'
    } else {
        Write-Err 'No encontre severidad (Media 15/4)'
        Pop-Location
        exit 1
    }

    # 2e. Insertar fila SEC-008 al final de "Hallazgos medios"
    $anclaMedios = '| SEC-020 | 9 items Bitwarden pendientes (se completan durante rotacion S15) | F2 | P2 | Abierto | - |'
    $filaSEC008  = '| SEC-008 | crear_usuario_admin sin chequeo de caller (eliminada) | F3 | P2 | Cerrado | (S15) |'
    if ($track.Contains($anclaMedios)) {
        $track = $track.Replace($anclaMedios, $anclaMedios + "`r`n" + $filaSEC008)
        Write-Ok 'Fila SEC-008 insertada en medios'
    } else {
        Write-Err 'No encontre ancla de medios (SEC-020)'
        Pop-Location
        exit 1
    }

    if ($Commit) {
        Backup-File $trackPath $stamp
        Write-FileRaw $trackPath $track
        Write-Ok 'Tracking escrito'
    } else {
        Write-Host '   (dry run: tracking NO escrito)' -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 3. Actualizar STATUS.md
# ============================================================================

Write-Step 'Actualizar docs/STATUS.md'

$statusPath = Join-Path $RepoRoot 'docs\STATUS.md'
if (-not (Test-Path -LiteralPath $statusPath)) {
    Write-Err 'STATUS.md no existe'
    Pop-Location
    exit 1
}

$status = Read-FileRaw $statusPath

if ($status.Contains('fin Sesion 15')) {
    Write-Skip 'STATUS.md ya tiene S15'
} else {
    # 3a. Encabezado: fecha + progreso global
    $encViejo = @(
        '**Ultima actualizacion:** 2026-10-14 (fin Sesion 14)',
        '**Fase actual:** Fase 2 (EN CURSO)',
        '**Progreso global:** 49% (23 de 47 tareas)'
    ) -join "`r`n"
    $encNuevo = @(
        '**Ultima actualizacion:** 2026-10-14 (fin Sesion 15)',
        '**Fase actual:** Fase 2 (EN CURSO)',
        '**Progreso global:** 51% (24 de 47 tareas)'
    ) -join "`r`n"
    if ($status.Contains($encViejo)) {
        $status = $status.Replace($encViejo, $encNuevo)
        Write-Ok 'Encabezado actualizado'
    } else {
        Write-Skip 'Encabezado no matcheo (posible cambio previo)'
    }

    # 3b. Tabla resumen: fila Total 25/22/53% -> 24/23/51%
    $filaTotalVieja = '| **Total** | **47** | **25** | **0** | **22** | **53%** |'
    $filaTotalNueva = '| **Total** | **47** | **24** | **0** | **23** | **51%** |'
    if ($status.Contains($filaTotalVieja)) {
        $status = $status.Replace($filaTotalVieja, $filaTotalNueva)
        Write-Ok 'Fila Total corregida: 25/22/53% -> 24/23/51%'
    } else {
        Write-Skip 'Fila Total no matcheo'
    }

    # 3c. Metricas clave: Hallazgos cerrados 28/45 -> 29/46
    $metricaVieja = '| Hallazgos cerrados | 28 / 45 | 45 / 45 |'
    $metricaNueva = '| Hallazgos cerrados | 29 / 46 | 46 / 46 |'
    if ($status.Contains($metricaVieja)) {
        $status = $status.Replace($metricaVieja, $metricaNueva)
        Write-Ok 'Metrica hallazgos cerrados actualizada: 28/45 -> 29/46'
    } else {
        Write-Skip 'Metrica hallazgos cerrados no matcheo'
    }

    if ($Commit) {
        Backup-File $statusPath $stamp
        Write-FileRaw $statusPath $status
        Write-Ok 'STATUS.md escrito'
    } else {
        Write-Host '   (dry run: STATUS.md NO escrito)' -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 4. Verificacion post (solo si Commit)
# ============================================================================

if ($Commit) {
    Write-Step 'Verificacion post'

    $docPost    = Read-FileRaw $docPath
    $trkPost    = Read-FileRaw $trackPath
    $staPost    = Read-FileRaw $statusPath

    $checks = @(
        @{ n = 'Doc: SEC-008';              ok = $docPost.Contains('SEC-008') },
        @{ n = 'Doc: Media (P2)';           ok = $docPost.Contains('Media (P2)') },
        @{ n = 'Doc: DROP FUNCTION';        ok = $docPost.Contains('DROP FUNCTION IF EXISTS public.crear_usuario_admin') },
        @{ n = 'Doc: evidencia DROP';       ok = $docPost.Contains('Success. No rows returned') },
        @{ n = 'Doc: rollback doc';         ok = $docPost.Contains('## 6. Rollback') },
        @{ n = 'Doc: DoD';                  ok = $docPost.Contains('## 7. DoD') },
        @{ n = 'Tracking: SEC-008';         ok = $trkPost.Contains('SEC-008') },
        @{ n = 'Tracking: Total 46';        ok = $trkPost.Contains('**Total de hallazgos:** 46') },
        @{ n = 'Tracking: Cerrado 29';      ok = $trkPost.Contains('| Cerrado | 29 |') },
        @{ n = 'Tracking: Media 16/5';      ok = $trkPost.Contains('| Media | 16 | 5 |') },
        @{ n = 'Tracking: fin Sesion 15';   ok = $trkPost.Contains('fin Sesion 15') },
        @{ n = 'STATUS: fin Sesion 15';     ok = $staPost.Contains('fin Sesion 15') },
        @{ n = 'STATUS: 51%';               ok = $staPost.Contains('51% (24 de 47 tareas)') },
        @{ n = 'STATUS: Total 24/23/51%';   ok = $staPost.Contains('| **Total** | **47** | **24** | **0** | **23** | **51%** |') },
        @{ n = 'STATUS: 29/46';             ok = $staPost.Contains('| Hallazgos cerrados | 29 / 46 | 46 / 46 |') }
    )

    $fails = @($checks | Where-Object { -not $_.ok })
    if ($fails.Count -eq 0) {
        Write-Ok ($checks.Count.ToString() + '/' + $checks.Count.ToString() + ' checks OK')
    } else {
        Write-Err ($fails.Count.ToString() + ' checks fallaron:')
        $fails | ForEach-Object { Write-Err ('  - ' + $_.n) }
        Pop-Location
        exit 1
    }
}

# ============================================================================
# 5. Commit + push
# ============================================================================

Write-Step 'Commit'

if (-not $Commit) {
    Write-Host '   Dry run. Nada escrito, nada commiteado.' -ForegroundColor DarkYellow
    Write-Host '   Para aplicar: .\36-sec-008-eliminar-crear-usuario-admin.ps1 -Commit' -ForegroundColor DarkYellow
    Pop-Location
    exit 0
}

git add -- docs/audits/2026-10-13-inicial/25-sec-008-crear-usuario-admin.md
git add -- docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md
git add -- docs/STATUS.md

$staged = @(git diff --cached --name-only)
if ($staged.Count -eq 0) {
    Write-Skip 'Nada staged. No hay commit.'
    Pop-Location
    exit 0
}
Write-Ok ('Archivos staged: ' + $staged.Count)
$staged | ForEach-Object { Write-Host ('     - ' + $_) -ForegroundColor DarkGray }

$msg = 'security(db): eliminar funcion sin uso crear_usuario_admin (SEC-008)'
git commit -m $msg
if ($LASTEXITCODE -ne 0) { Write-Err 'git commit fallo'; Pop-Location; exit 1 }

git push origin main
if ($LASTEXITCODE -ne 0) { Write-Err 'git push fallo'; Pop-Location; exit 1 }

Write-Ok ('Commit pusheado: ' + $msg)
Write-Host ''
Write-Host 'SEC-008 cerrado COMPLETO.' -ForegroundColor Cyan
Write-Host 'Proximo paso: 37-fix-bug-011.ps1 (arreglar script 29).' -ForegroundColor Cyan

Pop-Location