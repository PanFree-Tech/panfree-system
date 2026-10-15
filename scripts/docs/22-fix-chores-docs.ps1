# PowerShell
# =============================================================================
# Script 22 - Plan B (chores de docs)
# Limpia duplicados, actualiza rutas viejas, sincroniza contadores.
# Dry run por defecto. Usar -Commit para commitear y pushear.
# Idempotente: correr multiples veces no rompe nada.
# =============================================================================

param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $repo

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-Section($t) {
    Write-Host ''
    Write-Host ('=' * 70) -ForegroundColor Magenta
    Write-Host ("  $t") -ForegroundColor Magenta
    Write-Host ('=' * 70) -ForegroundColor Magenta
}

function Write-Step($n, $t) {
    Write-Host ''
    Write-Host ("[$n] $t") -ForegroundColor Cyan
}

function Write-OK($m)   { Write-Host ("  OK: $m") -ForegroundColor Green }
function Write-INFO($m) { Write-Host ("  INFO: $m") -ForegroundColor Yellow }
function Write-ERR($m)  { Write-Host ("  ERROR: $m") -ForegroundColor Red }

function Read-File($p) {
    return [System.IO.File]::ReadAllText((Join-Path $repo $p))
}

function Write-File($p, $content) {
    $full = Join-Path $repo $p
    [System.IO.File]::WriteAllText($full, $content, $utf8NoBom)
}

# -----------------------------------------------------------------------------
Write-Section "Script 22 - Plan B (chores de docs)"
Write-Host "  Repo:   $repo"
if ($Commit) {
    Write-Host "  Modo:   COMMIT + PUSH" -ForegroundColor Yellow
} else {
    Write-Host "  Modo:   DRY RUN (sin commit)" -ForegroundColor Yellow
}

# -----------------------------------------------------------------------------
Write-Step "1/9" "Verificando prerequisitos..."

$requiredFiles = @(
    'docs\STATUS.md',
    'docs\BITACORA.md',
    'docs\README.md',
    'docs\operations\GUIA-RAPIDA.md',
    'docs\operations\WORKFLOW-DIARIO.md',
    'docs\operations\PLAN-DE-TRABAJO.md',
    'docs\audits\2026-10-13-inicial\19-f3-02-sec-002-anon-key.md'
)

$missing = @()
foreach ($f in $requiredFiles) {
    if (-not (Test-Path (Join-Path $repo $f))) { $missing += $f }
}
if ($missing.Count -gt 0) {
    Write-ERR "faltan archivos:"
    $missing | ForEach-Object { Write-Host "    - $_" }
    exit 1
}
Write-OK "todos los archivos existen."

# Backup
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupRoot = Join-Path $env:TEMP "panfree-chores-docs-backup\$stamp"
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

foreach ($f in $requiredFiles) {
    $dest = Join-Path $backupRoot ($f -replace '\\', '__')
    Copy-Item -Path (Join-Path $repo $f) -Destination $dest -Force
}
Write-OK "backup en $backupRoot"

# -----------------------------------------------------------------------------
Write-Step "2/9" "Fix STATUS.md - tabla y seccion 5..."

$statusPath = 'docs\STATUS.md'
$s = Read-File $statusPath
$antes = $s

# --- 2a. Tabla: corregir fila Total ---
$s = $s -replace '\| \*\*Total\*\* \| \*\*47\*\* \| \*\*16\*\* \| \*\*0\*\* \| \*\*31\*\* \| \*\*34%\*\* \|',
                '| **Total** | **47** | **19** | **0** | **28** | **40%** |'

# --- 2b. Seccion 5: reemplazo completo ---
$nuevaSeccion5 = @(
    '## 5. Ultima actividad',
    '',
    '**2026-10-13 - Sesion 2 (COMPLETA)**',
    '- 8 commits de remediacion pusheados',
    '- 5 tareas de Fase 1 cerradas (F1-01 a F1-05)',
    '- 5 hallazgos cerrados (DB-001a/b/c/d/g)',
    '- Estructura supabase/schemas/ creada (declarativa)',
    '- Estructura docs/ reorganizada (sin numeros)',
    '- 3 ADRs creados (Supabase, seguridad, Next.js)',
    '- Backup estructural en Bitwarden + local',
    '',
    '**2026-10-13 - Sesion 3 (COMPLETA)**',
    '- F1-07: 79 politicas RLS optimizadas con InitPlan',
    '- 0 politicas DIRECTAS en pg_policies (antes: 79)',
    '- 81 politicas OPTIMIZADAS (antes: 0)',
    '- Hallazgo DB-001e cerrado (hash 02311b72)',
    '- SQL versionado en supabase/migrations/',
    '- Script 10-documentar-f1-07.ps1 agregado',
    '',
    '**2026-10-13 - Sesion 5 (COMPLETA)**',
    '- F3-01: SEC-003 cerrado (middleware lee solo app_metadata)',
    '- F3-01: is_admin() reescrita para leer de app_metadata',
    '- F3-01: 3 politicas P7 migradas a app_metadata',
    '- SEC-004/005/006/007 cerrados (grants por columna en clientes)',
    '- BUG-002 cerrado: avatar -> avatar_url',
    '- Doc: docs/audits/2026-10-13-inicial/14-f3-01-admin-app-metadata.md',
    '- Migracion: supabase/migrations/2026-10-13-f3-01-admin-app-metadata.sql',
    '- Commit middleware: e5bed103',
    '',
    '**2026-10-13 - Sesion 6 (COMPLETA)**',
    '- F1-08: 20 politicas RLS consolidadas/eliminadas',
    '- Hallazgos cerrados: DB-001f, SEC-010',
    '- Hallazgos nuevos: SEC-011, SEC-012, BUG-003',
    '- Doc: docs/audits/2026-10-13-inicial/15-f1-08-consolidacion-rls.md',
    '- Commit: e40d9244',
    '',
    '**2026-10-13 - Sesion 7 (COMPLETA)**',
    '- F1-09: 9 indices duplicados eliminados',
    '- Hallazgo DB-001i cerrado',
    '- Doc: docs/audits/2026-10-13-inicial/16-f1-09-indices-duplicados.md',
    '- Commit: d6957a61',
    '',
    '**2026-10-14 - Sesion 8 (COMPLETA)**',
    '- SEC-011 cerrado: email_logs SELECT qual=true removida',
    '- SEC-013 cerrado: email_logs INSERT permisiva removida',
    '- BUG-004 cerrado: endpoints migrados a SERVICE_ROLE_KEY',
    '- Doc: docs/audits/2026-10-13-inicial/17-f1-10-sec-011-email-logs.md',
    '- Commit: 5ded4ff6',
    '',
    '**2026-10-14 - Sesion 9 (COMPLETA)**',
    '- SEC-012 cerrado: canjes_premios alineado con ADR-002',
    '- Fase 1 al 100% (9/9, con F1-06 aceptada por plan Free)',
    '- Doc: docs/audits/2026-10-13-inicial/18-f1-11-sec-012-canjes-premios.md',
    '- Commit: ca21e7cc',
    '',
    '**2026-10-14 - Sesion 10 (COMPLETA)**',
    '- SEC-002 cerrado: claves hardcodeadas eliminadas de src/lib/supabase.js',
    '- 7 consumidores migrados a fail-fast',
    '- 4 hallazgos nuevos: SEC-014..017 (P3, chores futuros)',
    '- Fase 3 al 33% (3/9 tras reconocer F3-03 cerrada en S5)',
    '- Doc: docs/audits/2026-10-13-inicial/19-f3-02-sec-002-anon-key.md',
    '- Commits: 4a17c7d5, 9f427ef6',
    '',
    '---'
) -join "`r`n"

# Reemplaza todo desde "## 5. Ultima actividad" hasta el cierre de la seccion (antes de "## 6. Comandos utiles")
$patronSeccion5 = '(?s)## 5\. Ultima actividad.*?(?=## 6\. Comandos utiles)'
$s = [regex]::Replace($s, $patronSeccion5, $nuevaSeccion5 + "`r`n`r`n")

if ($s -ne $antes) {
    Write-File $statusPath $s
    Write-OK "STATUS.md actualizado."
} else {
    Write-INFO "STATUS.md sin cambios (idempotente o ya aplicado)."
}

# -----------------------------------------------------------------------------
Write-Step "3/9" "Fix BITACORA.md - dedupe + hash F1-08..."

$bitacoraPath = 'docs\BITACORA.md'
$b = Read-File $bitacoraPath
$antes = $b

# --- 3a. Corregir hash de F1-08 en Sesion 6 ---
$b = $b -replace '- \(pendiente\) security\(db\): consolidar politicas RLS duplicadas \(F1-08\)',
                '- e40d9244 security(db): consolidar politicas RLS duplicadas (F1-08)'

# --- 3b. Dedupe ---
function Remove-DuplicateSessions {
    param([string]$text)

    $pattern = '(?m)^## \d{4}-\d{2}-\d{2} \(Sesion (\d+).*'
    $matches = [regex]::Matches($text, $pattern)

    if ($matches.Count -eq 0) { return $text }

    $seen = @{}
    $toRemove = @()

    for ($i = 0; $i -lt $matches.Count; $i++) {
        $m = $matches[$i]
        $headerLine = $m.Value
        $isCierre = $headerLine -match 'CIERRE'
        $num = $m.Groups[1].Value
        $key = "$num|$isCierre"

        if ($seen.ContainsKey($key)) {
            $start = $m.Index
            if ($i + 1 -lt $matches.Count) {
                $end = $matches[$i + 1].Index
            } else {
                $end = $text.Length
            }
            $toRemove += ,@($start, $end)
        } else {
            $seen[$key] = $true
        }
    }

    if ($toRemove.Count -eq 0) { return $text }

    $toRemoveSorted = $toRemove | Sort-Object { $_[0] } -Descending
    $result = $text
    foreach ($range in $toRemoveSorted) {
        $start = $range[0]
        $end   = $range[1]
        $result = $result.Substring(0, $start) + $result.Substring($end)
    }
    return $result
}

$b = Remove-DuplicateSessions $b

if ($b -ne $antes) {
    Write-File $bitacoraPath $b
    Write-OK "BITACORA.md actualizado."
} else {
    Write-INFO "BITACORA.md sin cambios."
}

# -----------------------------------------------------------------------------
Write-Step "4/9" "Fix README.md - reescritura completa..."

$readmeNuevo = @(
    '# Documentacion - PanFree System',
    '',
    'Indice maestro de la documentacion del proyecto.',
    '',
    '## Estructura',
    '',
    '| Carpeta | Proposito |',
    '|---|---|',
    '| architecture/ | Como esta construido el sistema (ARCHITECTURE, DATABASE, API, ADRs) |',
    '| operations/ | Como se opera y despliega (PLAN, SISTEMA, WORKFLOW, CI/CD, riesgos) |',
    '| integrations/ | Como se conecta con servicios externos |',
    '| audits/ | Historial de auditorias tecnicas |',
    '| runbooks/ | Procedimientos de emergencia |',
    '| reference/ | Material de consulta general |',
    '',
    '## Archivos raiz',
    '',
    '| Archivo | Proposito |',
    '|---|---|',
    '| STATUS.md | Estado actual del proyecto, proximos 3 pasos |',
    '| BITACORA.md | Registro cronologico de sesiones de trabajo |',
    '| README.md | Este archivo |',
    '',
    '## Indice rapido',
    '',
    '- [Arquitectura](./architecture/ARCHITECTURE.md)',
    '- [Base de datos](./architecture/DATABASE.md)',
    '- [API](./architecture/API.md)',
    '- [Deployment](./operations/DEPLOYMENT.md)',
    '- [Contributing](./operations/CONTRIBUTING.md)',
    '- [Auditorias](./audits/README.md)',
    '- [Plan de Trabajo](./operations/PLAN-DE-TRABAJO.md)',
    '- [Sistema de Trabajo](./operations/SISTEMA-DE-TRABAJO.md)',
    '- [Workflow Diario](./operations/WORKFLOW-DIARIO.md)',
    '- [Guia Rapida](./operations/GUIA-RAPIDA.md)',
    '- [Politica CI/CD](./operations/POLITICA-CI-CD.md)',
    '- [Gestion de Riesgos](./operations/GESTION-DE-RIESGOS.md)',
    '- [Tracking de hallazgos](./audits/2026-10-13-inicial/06-hallazgos-tracking.md)',
    '',
    '## Decisiones arquitectonicas (ADRs)',
    '',
    '- [ADR-001 - Supabase como backend unico](./architecture/decisiones/ADR-001-supabase-backend-unico.md)',
    '- [ADR-002 - Seguridad en capas y app_metadata](./architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)',
    ''
) -join "`r`n"

Write-File 'docs\README.md' $readmeNuevo
Write-OK "README.md reescrito."

# -----------------------------------------------------------------------------
Write-Step "5/9" "Fix GUIA-RAPIDA.md - rutas + comentario shells..."

$guiaPath = 'docs\operations\GUIA-RAPIDA.md'
if (Test-Path (Join-Path $repo $guiaPath)) {
    $g = Read-File $guiaPath
    $antes = $g

    $g = $g -replace 'docs\\04-auditorias\\', 'docs\audits\'
    $g = $g -replace 'docs\\02-operaciones\\', 'docs\operations\'
    $g = $g -replace 'docs/04-auditorias/', 'docs/audits/'
    $g = $g -replace 'docs/02-operaciones/', 'docs/operations/'

    # Solo agregar el comentario si no existe ya
    if ($g -notmatch 'Los comandos de abajo funcionan tanto en cmd como en PowerShell') {
        $g = $g -replace '(?m)^## 5\. Comandos frecuentes\s*$',
                        "## 5. Comandos frecuentes`r`n`r`n    # Los comandos de abajo funcionan tanto en cmd como en PowerShell."
    }

    if ($g -ne $antes) {
        Write-File $guiaPath $g
        Write-OK "GUIA-RAPIDA.md actualizado."
    } else {
        Write-INFO "GUIA-RAPIDA.md sin cambios."
    }
} else {
    Write-INFO "GUIA-RAPIDA.md no existe, se omite."
}

# -----------------------------------------------------------------------------
Write-Step "6/9" "Fix WORKFLOW-DIARIO.md - rutas + findstr -> Select-String..."

$wfPath = 'docs\operations\WORKFLOW-DIARIO.md'
$w = Read-File $wfPath
$antes = $w

# --- 6a. Rutas viejas -> nuevas ---
$w = $w -replace 'docs\\04-auditorias\\', 'docs\audits\'
$w = $w -replace 'docs\\02-operaciones\\', 'docs\operations\'
$w = $w -replace 'docs/04-auditorias/', 'docs/audits/'
$w = $w -replace 'docs/02-operaciones/', 'docs/operations/'

# --- 6b. findstr -> Select-String ---
# Construir el replacement como UN SOLO string (fix del bug anterior)
$replacement = @(
    '# Cuenta aperturas y cierres de here-string (deben coincidir)',
    "(Select-String -Path script.ps1 -Pattern '@""').Count",
    "(Select-String -Path script.ps1 -Pattern '""@').Count"
) -join "`r`n"

# Patron tolerante: matchea la linea findstr con cualquier espaciado
$pattern = '(?m)^\s*findstr /N "\\"@" scripts\\\.\.\.\\script\.ps1\s*$'
$w = [regex]::Replace($w, $pattern, $replacement)

if ($w -ne $antes) {
    Write-File $wfPath $w
    Write-OK "WORKFLOW-DIARIO.md actualizado."
} else {
    Write-INFO "WORKFLOW-DIARIO.md sin cambios."
}

# -----------------------------------------------------------------------------
Write-Step "7/9" "Fix PLAN-DE-TRABAJO.md - F3-01/02/03 -> OK..."

$planPath = 'docs\operations\PLAN-DE-TRABAJO.md'
$p = Read-File $planPath
$antes = $p

$p = $p -replace '\| F3-01 \| SEC-003: admin por app_metadata \| P0 \| S \| Pendiente \|',
                '| F3-01 | SEC-003: admin por app_metadata | P0 | S | OK |'
$p = $p -replace '\| F3-02 \| SEC-002: quitar claves hardcodeadas \| P1 \| S \| Pendiente \|',
                '| F3-02 | SEC-002: quitar claves hardcodeadas | P1 | S | OK |'
$p = $p -replace '\| F3-03 \| SEC-006: redirectTo por env var \| P1 \| S \| Pendiente \|',
                '| F3-03 | SEC-006: redirectTo por env var | P1 | S | OK |'

if ($p -ne $antes) {
    Write-File $planPath $p
    Write-OK "PLAN-DE-TRABAJO.md actualizado."
} else {
    Write-INFO "PLAN-DE-TRABAJO.md sin cambios."
}

# -----------------------------------------------------------------------------
Write-Step "8/9" "Fix DoD en 19-f3-02-sec-002-anon-key.md..."

$docPath = 'docs\audits\2026-10-13-inicial\19-f3-02-sec-002-anon-key.md'
$d = Read-File $docPath
$antes = $d

$d = $d -replace '(?m)^- \[ \] Commit pusheado con `security\(src\):`\.\s*$',
                '- [x] Commit pusheado con `security(src):`.'

if ($d -ne $antes) {
    Write-File $docPath $d
    Write-OK "DoD actualizado."
} else {
    Write-INFO "DoD sin cambios (idempotente)."
}

# -----------------------------------------------------------------------------
Write-Step "9/9" "Verificacion final..."

Write-Host ''
Write-Host '  --- Conteo de entradas duplicadas en BITACORA.md ---'
$bFinal = Read-File 'docs\BITACORA.md'
$c2 = ([regex]::Matches($bFinal, '(?m)^## \d{4}-\d{2}-\d{2} \(Sesion 2 - CIERRE')).Count
$c3 = ([regex]::Matches($bFinal, '(?m)^## \d{4}-\d{2}-\d{2} \(Sesion 3 - CIERRE')).Count
$c5 = ([regex]::Matches($bFinal, '(?m)^## \d{4}-\d{2}-\d{2} \(Sesion 5 - CIERRE')).Count
Write-Host ("    Sesion 2: {0} (esperado: 1)" -f $c2)
Write-Host ("    Sesion 3: {0} (esperado: 1)" -f $c3)
Write-Host ("    Sesion 5: {0} (esperado: 1)" -f $c5)

Write-Host ''
Write-Host '  --- Total en STATUS.md ---'
Select-String -Path 'docs\STATUS.md' -Pattern '\*\*Total\*\*' | ForEach-Object { Write-Host "    $($_.Line)" }

Write-Host ''
Write-Host '  --- F3 en PLAN-DE-TRABAJO.md ---'
Select-String -Path 'docs\operations\PLAN-DE-TRABAJO.md' -Pattern '\| F3-0[123] \|' | ForEach-Object { Write-Host "    $($_.Line)" }

Write-Host ''
Write-Host '  --- F1-08 hash en BITACORA.md ---'
Select-String -Path 'docs\BITACORA.md' -Pattern 'e40d9244' | ForEach-Object { Write-Host "    $($_.Line)" }

Write-Host ''
Write-Host '  --- WORKFLOW-DIARIO.md: findstr debe dar 0, Select-String debe dar 2 ---'
$wfCheck = Read-File 'docs\operations\WORKFLOW-DIARIO.md'
Write-Host ("    findstr:      {0}" -f ([regex]::Matches($wfCheck, 'findstr')).Count)
Write-Host ("    Select-String: {0}" -f ([regex]::Matches($wfCheck, 'Select-String')).Count)

Write-Host ''
Write-Host '  --- git status ---'
git status --short

Write-Host ''
Write-Host '  --- git diff --stat ---'
git diff --stat

# -----------------------------------------------------------------------------
if ($Commit) {
    Write-Section "Commit + push"

    Write-Host '  Preparando commit...'
    git add docs/STATUS.md
    git add docs/BITACORA.md
    git add docs/README.md
    git add docs/operations/GUIA-RAPIDA.md
    git add docs/operations/WORKFLOW-DIARIO.md
    git add docs/operations/PLAN-DE-TRABAJO.md
    git add 'docs/audits/2026-10-13-inicial/19-f3-02-sec-002-anon-key.md'

    git commit -m "docs(chores): limpiar duplicados y actualizar rutas (B-01)"
    Write-OK "commit creado."

    git push origin main
    Write-OK "push completado."

    Write-Host ''
    Write-Host '  git log --oneline -3:'
    git log --oneline -3
} else {
    Write-Section "FIN (DRY RUN)"
    Write-Host '  Revisa los cambios con:' -ForegroundColor Yellow
    Write-Host '    git diff' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '  Si todo OK:' -ForegroundColor Yellow
    Write-Host '    .\scripts\docs\22-fix-chores-docs.ps1 -Commit' -ForegroundColor Yellow
    Write-Host ''
    Write-Host "  Backup en: $backupRoot" -ForegroundColor Yellow
}

Write-Host ''