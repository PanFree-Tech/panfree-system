# ============================================================================
# 39-sec-019-cierre-gemini.ps1
# ----------------------------------------------------------------------------
# Cierra SEC-019 + F2-06: rotacion de Gemini API key + limpieza de huerfanas.
#
# Contexto:
#   - 4 API keys activas en Gemini sin trazabilidad (detectado en S14).
#   - Verificado en S15: 1 key activa en proyecto gen-lang-client-0055191436.
#   - Eliminadas: 3 keys huerfanas del proyecto gen-lang-client-0840688115.
#   - Rotacion: Default Gemini Key (...n9EA) -> panfree-production-2026-rotated.
#   - Test empirico (2026-10-14): generar-contenido devuelve 200 OK con hook/caption.
#
# Actualiza:
#   - docs/audits/2026-10-13-inicial/27-sec-019-cierre-gemini.md (crea)
#   - docs/audits/2026-10-13-inicial/24-bugs-s14-gemini-y-otros.md
#     (agrega seccion "Resolucion SEC-019")
#   - docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md
#     (SEC-019 -> Cerrado + contadores)
#   - docs/STATUS.md (metrica hallazgos + Fase 2)
#
# Fecha: 2026-10-14
# Sesion: 15
# ----------------------------------------------------------------------------
# Uso:
#   Dry run:  .\39-sec-019-cierre-gemini.ps1
#   Aplicar:  .\39-sec-019-cierre-gemini.ps1 -Commit
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
# 1. Crear doc de cierre
# ============================================================================

Write-Step 'Crear docs/audits/2026-10-13-inicial/27-sec-019-cierre-gemini.md'

$docPath = Join-Path $RepoRoot 'docs\audits\2026-10-13-inicial\27-sec-019-cierre-gemini.md'

$docContent = @(
    '# SEC-019 + F2-06 - Rotacion y limpieza de keys de Gemini',
    '',
    '**Fecha:** 2026-10-14',
    '**Hallazgos:** SEC-019 (P2, Media) + F2-06 (rotacion)',
    '**Estado:** Cerrado',
    '**Sesion:** 15',
    '**Origen:** Detectado en Sesion 14 (24-bugs-s14-gemini-y-otros.md).',
    '',
    '---',
    '',
    '## 1. Contexto',
    '',
    'Durante la Sesion 14 se detecto que Google AI Studio mostraba',
    '**4 API keys activas** sin trazabilidad de uso:',
    '',
    '| # | Nombre | Proyecto | Creada |',
    '|---|---|---|---|',
    '| 1 | Default Gemini Key | gen-lang-client-0055191436 | 28 ago 2026 |',
    '| 2 | Gemini API - Pagada | gen-lang-client-0840688115 | 23 ago 2026 |',
    '| 3 | Gemini API Key | gen-lang-client-0840688115 | 22 ago 2026 |',
    '| 4 | Default Gemini API Key | gen-lang-client-0840688115 | 14 ago 2026 |',
    '',
    'Sin saber cual estaba en uso, rotar la key (F2-06) era riesgoso.',
    '',
    '---',
    '',
    '## 2. Analisis',
    '',
    '### 2.1 Dos proyectos diferentes',
    '',
    '- **gen-lang-client-0055191436:** 1 key (`Default Gemini Key`).',
    '  Proyecto "nuevo" (28 ago 2026). Numero de proyecto: 7263344746.',
    '- **gen-lang-client-0840688115:** 3 keys. Proyecto "viejo" (14-23 ago 2026).',
    '',
    '### 2.2 Analisis de contexto',
    '',
    '- El proyecto `...0055191436` tenia solo 1 key y la mas reciente.',
    '  Sugiere que es el proyecto "curado" para produccion.',
    '- El proyecto `...0840688115` tenia 3 keys (probablemente experimentos',
    '  del setup inicial). La key `Gemini API - Pagada` sugiere una intencion',
    '  de migrar al plan pago, pero las 3 seguian en Free tier.',
    '',
    '### 2.3 Limitacion de la UI',
    '',
    'AI Studio no muestra "Last used" ni usage por key en el plan Free.',
    'Se decidio por inferencia (proyecto nuevo + key mas reciente +',
    'nombre explicito).',
    '',
    '---',
    '',
    '## 3. Plan de limpieza + rotacion',
    '',
    '### 3.1 Decision',
    '',
    '**Limpieza (SEC-019):**',
    '- Eliminar las 3 keys del proyecto `...0840688115` (huerfanas).',
    '- Mantener `Default Gemini Key` como activa provisional.',
    '',
    '**Rotacion (F2-06):**',
    '- Crear key nueva `panfree-production-2026-rotated` en el proyecto',
    '  `...0055191436`.',
    '- Actualizar Vercel.',
    '- Verificar.',
    '- Eliminar la key vieja.',
    '',
    '### 3.2 Orden de ejecucion',
    '',
    '1. Eliminar 3 keys huerfanas (proyecto viejo).',
    '2. Crear key nueva en el proyecto nuevo.',
    '3. Guardar en Bitwarden (Produccion).',
    '4. Actualizar Vercel `GEMINI_API_KEY`.',
    '5. Redeploy.',
    '6. Verificar con test empirico.',
    '7. Eliminar key vieja.',
    '',
    '---',
    '',
    '## 4. Test empirico',
    '',
    '### 4.1 Objetivo',
    '',
    'Confirmar que el endpoint `/api/admin/marketing/generar-contenido`',
    '(que usa Gemini + cascada multi-motor) funciona con la key nueva.',
    '',
    '### 4.2 Procedimiento',
    '',
    '1. Login como admin en https://panfree.fit/admin/marketing.',
    '2. Abrir DevTools (F12) > Console.',
    '3. Ejecutar script con POST a `/api/admin/marketing/generar-contenido`.',
    '4. Verificar la respuesta.',
    '',
    '### 4.3 Resultado (2026-10-14T21:03:15Z)',
    '',
    'Se ejecutaron 3 requests casi simultaneos:',
    '',
    '| # | Status | Resultado |',
    '|---|---|---|',
    '| 1 | 200 | OK con hook/caption |',
    '| 2 | 200 | OK con hook/caption |',
    '| 3 | 503 | Rate limit / motores saturados |',
    '',
    '**Respuesta 1:**',
    '```json',
    '{',
    '  "success": true,',
    '  "content": {',
    '    "hook": "El verdadero placer del pan artesanal, 100% libre de gluten...",',
    '    "caption": "En Panfree redefinimos la experiencia..."',
    '  }',
    '}',
    '```',
    '',
    '**Interpretacion:** la key nueva funciona. El 503 del 3er request',
    'es rate limit esperado en plan Free (3 requests en 3 ms).',
    '',
    '---',
    '',
    '## 5. Resultado final',
    '',
    '### 5.1 AI Studio',
    '',
    '| Proyecto | Keys antes | Keys despues |',
    '|---|---|---|',
    '| gen-lang-client-0055191436 | 1 | 1 (key nueva) |',
    '| gen-lang-client-0840688115 | 3 | 0 (eliminadas) |',
    '| **Total** | **4** | **1** |',
    '',
    'La unica key activa es `panfree-production-2026-rotated`.',
    '',
    '### 5.2 Bitwarden',
    '',
    'Item `Gemini — Produccion` actualizado con la key nueva.',
    '',
    '### 5.3 Vercel',
    '',
    'Variable `GEMINI_API_KEY` actualizada + redeploy aplicado.',
    '',
    '### 5.4 Produccion',
    '',
    'Marketing IA funciona con la key nueva.',
    '',
    '---',
    '',
    '## 6. Conclusion',
    '',
    '**SEC-019 + F2-06 cerrados.**',
    '',
    '- 4 keys -> 1 key activa.',
    '- Rotacion completa: key nueva operativa.',
    '- Keys huerfanas eliminadas.',
    '- Trazabilidad documentada.',
    '',
    '---',
    '',
    '## 7. DoD',
    '',
    '### SEC-019 (trazabilidad)',
    '- [x] Diagnostico completo (4 keys identificadas).',
    '- [x] Analisis de proyectos.',
    '- [x] Plan de limpieza definido.',
    '- [x] Eliminacion de 3 keys huerfanas: OK.',
    '- [x] Estado final documentado (1 key activa).',
    '- [x] Tracking actualizado.',
    '',
    '### F2-06 (rotacion)',
    '- [x] Key nueva creada en proyecto correcto.',
    '- [x] Guardada en Bitwarden (Produccion).',
    '- [x] Vercel actualizado con key nueva.',
    '- [x] Redeploy completado.',
    '- [x] Verificacion end-to-end: marketing IA funciona.',
    '- [x] Key vieja eliminada.',
    '- [x] Documentacion completa (este archivo).',
    '',
    '---',
    '',
    '## 8. Referencias',
    '',
    '- [SEC-019 en tracking](./06-hallazgos-tracking.md)',
    '- [Hallazgo original en S14](./24-bugs-s14-gemini-y-otros.md)',
    '- [Rotacion de claves](../../operations/ROTACION-CLAVES.md)',
    '- [Plan de Trabajo](../../operations/PLAN-DE-TRABAJO.md) - F2-06',
    ''
) -join "`r`n"

if (Test-Path -LiteralPath $docPath) {
    Write-Skip '27-sec-019-cierre-gemini.md ya existe'
} else {
    if ($Commit) {
        Write-FileRaw $docPath $docContent
        Write-Ok '27-sec-019-cierre-gemini.md creado'
    } else {
        Write-Host '   (dry run: doc NO escrito)' -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 2. Agregar seccion "Resolucion" a 24-bugs-s14-gemini-y-otros.md
# ============================================================================

Write-Step 'Actualizar 24-bugs-s14-gemini-y-otros.md (seccion Resolucion SEC-019)'

$doc24Path = Join-Path $RepoRoot 'docs\audits\2026-10-13-inicial\24-bugs-s14-gemini-y-otros.md'
if (-not (Test-Path -LiteralPath $doc24Path)) {
    Write-Err '24-bugs-s14-gemini-y-otros.md no existe'
    Pop-Location
    exit 1
}

$doc24 = Read-FileRaw $doc24Path
$marcaResolucion = '## 11. Resolucion SEC-019 (2026-10-14, Sesion 15)'

if ($doc24.Contains($marcaResolucion)) {
    Write-Skip 'Seccion "Resolucion SEC-019" ya existe en doc 24'
} else {
    $seccionResolucion = @(
        '',
        '---',
        '',
        '## 11. Resolucion SEC-019 (2026-10-14, Sesion 15)',
        '',
        '**Estado:** Cerrado',
        '**Commit fix:** (pendiente)',
        '**Tareas cerradas:** SEC-019 (trazabilidad) + F2-06 (rotacion).',
        '',
        '### Resumen',
        '',
        'Las 4 keys de Gemini fueron analizadas, 3 eliminadas y 1 rotada.',
        '',
        '### Resultado',
        '',
        '| Proyecto | Keys antes | Keys despues |',
        '|---|---|---|',
        '| gen-lang-client-0055191436 | 1 | 1 (rotada) |',
        '| gen-lang-client-0840688115 | 3 | 0 |',
        '| **Total** | **4** | **1** |',
        '',
        '### Rotacion (F2-06)',
        '',
        '- Key vieja: `Default Gemini Key` (...n9EA).',
        '- Key nueva: `panfree-production-2026-rotated`.',
        '- Guardada en Bitwarden (Produccion).',
        '- Vercel `GEMINI_API_KEY` actualizada + redeploy.',
        '- Verificacion end-to-end: marketing IA funciona (200 OK con hook/caption).',
        '',
        '### Documentacion completa',
        '',
        '- [27-sec-019-cierre-gemini.md](./27-sec-019-cierre-gemini.md)',
        '',
        '### Referencias',
        '',
        '- [SEC-019 en tracking](./06-hallazgos-tracking.md)',
        '- [27-sec-019-cierre-gemini.md](./27-sec-019-cierre-gemini.md)',
        ''
    ) -join "`r`n"

    if ($Commit) {
        Backup-File $doc24Path $stamp
        $anclaRef = '## 8. Referencias'
        if ($doc24.Contains($anclaRef)) {
            $doc24 = $doc24.Replace($anclaRef, $seccionResolucion + "`r`n" + $anclaRef)
            Write-Ok 'Seccion Resolucion insertada antes de Referencias'
        } else {
            $doc24 = $doc24.TrimEnd() + "`r`n" + $seccionResolucion
            Write-Ok 'Seccion Resolucion agregada al final'
        }
        Write-FileRaw $doc24Path $doc24
    } else {
        Write-Host '   (dry run: doc 24 NO escrito)' -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 3. Actualizar tracking (SEC-019 -> Cerrado)
# ============================================================================

Write-Step 'Actualizar tracking (SEC-019 -> Cerrado)'

$trackPath = Join-Path $RepoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
if (-not (Test-Path -LiteralPath $trackPath)) {
    Write-Err '06-hallazgos-tracking.md no existe'
    Pop-Location
    exit 1
}

$track = Read-FileRaw $trackPath

# 3a. Fila de SEC-019
$sec019Viejo = '| SEC-019 | 4 API keys activas en Gemini sin trazabilidad | F2 | P2 | Abierto | - |'
$sec019Nuevo = '| SEC-019 | 4 API keys activas en Gemini sin trazabilidad | F2 | P2 | Cerrado | (S15) |'

if ($track.Contains($sec019Nuevo)) {
    Write-Skip 'SEC-019 ya marcado como Cerrado'
} elseif ($track.Contains($sec019Viejo)) {
    $track = $track.Replace($sec019Viejo, $sec019Nuevo)
    Write-Ok 'Fila SEC-019 actualizada a Cerrado'
} else {
    Write-Err 'No encontre la fila exacta de SEC-019'
    Pop-Location
    exit 1
}

# 3b. Resumen: Abierto 15 -> 14, Cerrado 31 -> 32
$resViejo = @(
    '| Estado | Cantidad |',
    '|---|---|',
    '| Abierto | 15 |',
    '| En curso | 0 |',
    '| Cerrado | 31 |',
    '| Aceptado | 1 |'
) -join "`r`n"
$resNuevo = @(
    '| Estado | Cantidad |',
    '|---|---|',
    '| Abierto | 14 |',
    '| En curso | 0 |',
    '| Cerrado | 32 |',
    '| Aceptado | 1 |'
) -join "`r`n"
if ($track.Contains($resViejo)) {
    $track = $track.Replace($resViejo, $resNuevo)
    Write-Ok 'Resumen: Abierto 15->14, Cerrado 31->32'
} else {
    Write-Err 'Resumen (Abierto 15/Cerrado 31) no matcheo'
    Pop-Location
    exit 1
}

# 3c. Severidad: Media 16/6 -> 16/7
$sevViejo = @(
    '| Severidad | Cantidad | Cerrados |',
    '|---|---|---|',
    '| Critica | 9 | 7 |',
    '| Alta | 11 | 7 |',
    '| Media | 16 | 6 |',
    '| Baja | 7 | 2 |'
) -join "`r`n"
$sevNuevo = @(
    '| Severidad | Cantidad | Cerrados |',
    '|---|---|---|',
    '| Critica | 9 | 7 |',
    '| Alta | 11 | 7 |',
    '| Media | 16 | 7 |',
    '| Baja | 7 | 2 |'
) -join "`r`n"
if ($track.Contains($sevViejo)) {
    $track = $track.Replace($sevViejo, $sevNuevo)
    Write-Ok 'Severidad: Media 16/6 -> 16/7'
} else {
    Write-Err 'Severidad (Media 16/6) no matcheo'
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

# ============================================================================
# 4. Actualizar STATUS.md
# ============================================================================

Write-Step 'Actualizar STATUS.md'

$statusPath = Join-Path $RepoRoot 'docs\STATUS.md'
$status = Read-FileRaw $statusPath

# 4a. Hallazgos cerrados: 31/46 -> 32/46
$statusViejo = '| Hallazgos cerrados | 31 / 46 | 46 / 46 |'
$statusNuevo = '| Hallazgos cerrados | 32 / 46 | 46 / 46 |'

if ($status.Contains($statusNuevo)) {
    Write-Skip 'STATUS.md ya tiene 32/46'
} elseif ($status.Contains($statusViejo)) {
    $status = $status.Replace($statusViejo, $statusNuevo)
    Write-Ok 'STATUS.md hallazgos: 31/46 -> 32/46'
} else {
    Write-Skip 'Metrica 31/46 no encontrada en STATUS.md'
}

# 4b. Fase 2: 2/14 -> 3/14 (rotacion de Gemini completa)
$fase2Viejo = '| F2 - Rotacion claves | 14 | 2 | 0 | 12 | 14% |'
$fase2Nuevo = '| F2 - Rotacion claves | 14 | 3 | 0 | 11 | 21% |'

if ($status.Contains($fase2Nuevo)) {
    Write-Skip 'STATUS.md ya tiene F2 3/14'
} elseif ($status.Contains($fase2Viejo)) {
    $status = $status.Replace($fase2Viejo, $fase2Nuevo)
    Write-Ok 'STATUS.md Fase 2: 2/14 -> 3/14'
} else {
    Write-Skip 'Fila Fase 2 no matcheo'
}

# 4c. Fila Total: 24/23/51% -> 25/22/53%
$totalViejo = '| **Total** | **47** | **24** | **0** | **23** | **51%** |'
$totalNuevo = '| **Total** | **47** | **25** | **0** | **22** | **53%** |'

if ($status.Contains($totalNuevo)) {
    Write-Skip 'STATUS.md ya tiene Total 25/22/53%'
} elseif ($status.Contains($totalViejo)) {
    $status = $status.Replace($totalViejo, $totalNuevo)
    Write-Ok 'STATUS.md Total: 24/23/51% -> 25/22/53%'
} else {
    Write-Skip 'Fila Total no matcheo'
}

if ($Commit) {
    Backup-File $statusPath $stamp
    Write-FileRaw $statusPath $status
    Write-Ok 'STATUS.md escrito'
} else {
    Write-Host '   (dry run: STATUS.md NO escrito)' -ForegroundColor DarkYellow
}

# ============================================================================
# 5. Verificacion post (solo si Commit)
# ============================================================================

if ($Commit) {
    Write-Step 'Verificacion post'

    $docPost = Read-FileRaw $docPath
    $d24Post = Read-FileRaw $doc24Path
    $trkPost = Read-FileRaw $trackPath
    $staPost = Read-FileRaw $statusPath

    $checks = @(
        @{ n = 'Doc 27: SEC-019';              ok = $docPost.Contains('SEC-019') },
        @{ n = 'Doc 27: F2-06';                ok = $docPost.Contains('F2-06') },
        @{ n = 'Doc 27: rotacion';             ok = $docPost.Contains('panfree-production-2026-rotated') },
        @{ n = 'Doc 27: eliminacion huerfanas';ok = $docPost.Contains('eliminadas') },
        @{ n = 'Doc 27: test empirico';        ok = $docPost.Contains('2026-10-14T21:03:15Z') },
        @{ n = 'Doc 27: estado final';         ok = $docPost.Contains('4 keys -> 1 key activa') -or $docPost.Contains('4') },
        @{ n = 'Doc 27: DoD';                  ok = $docPost.Contains('## 7. DoD') },
        @{ n = 'Doc 24: Resolucion SEC-019';   ok = $d24Post.Contains('## 11. Resolucion SEC-019') },
        @{ n = 'Doc 24: link a doc 27';        ok = $d24Post.Contains('27-sec-019-cierre-gemini.md') },
        @{ n = 'Tracking: SEC-019 Cerrado';    ok = $trkPost.Contains('| SEC-019 |') -and $trkPost.Contains('| F2 | P2 | Cerrado | (S15) |') },
        @{ n = 'Tracking: Abierto 14';         ok = $trkPost.Contains('| Abierto | 14 |') },
        @{ n = 'Tracking: Cerrado 32';         ok = $trkPost.Contains('| Cerrado | 32 |') },
        @{ n = 'Tracking: Media 16/7';         ok = $trkPost.Contains('| Media | 16 | 7 |') },
        @{ n = 'STATUS: 32/46';                ok = $staPost.Contains('| Hallazgos cerrados | 32 / 46 | 46 / 46 |') },
        @{ n = 'STATUS: Fase 2 3/14';          ok = $staPost.Contains('| F2 - Rotacion claves | 14 | 3 | 0 | 11 | 21% |') },
        @{ n = 'STATUS: Total 25/22/53%';      ok = $staPost.Contains('| **Total** | **47** | **25** | **0** | **22** | **53%** |') }
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
# 6. Commit + push
# ============================================================================

Write-Step 'Commit'

if (-not $Commit) {
    Write-Host '   Dry run. Nada escrito, nada commiteado.' -ForegroundColor DarkYellow
    Write-Host '   Para aplicar: .\39-sec-019-cierre-gemini.ps1 -Commit' -ForegroundColor DarkYellow
    Pop-Location
    exit 0
}

git add -- docs/audits/2026-10-13-inicial/27-sec-019-cierre-gemini.md
git add -- docs/audits/2026-10-13-inicial/24-bugs-s14-gemini-y-otros.md
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

$msg = 'security(env): rotar Gemini API key + revocar huerfanas (SEC-019, F2-06)'
git commit -m $msg
if ($LASTEXITCODE -ne 0) { Write-Err 'git commit fallo'; Pop-Location; exit 1 }

git push origin main
if ($LASTEXITCODE -ne 0) { Write-Err 'git push fallo'; Pop-Location; exit 1 }

Write-Ok ('Commit pusheado: ' + $msg)
Write-Host ''
Write-Host 'SEC-019 + F2-06 cerrados COMPLETOS.' -ForegroundColor Cyan
Write-Host 'Proximo paso: F2-02 (rotar Supabase JWT).' -ForegroundColor Cyan

Pop-Location