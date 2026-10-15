# ============================================================================
# 33-doc-bugs-s14.ps1
# ----------------------------------------------------------------------------
# Crea el doc de auditoria 24-bugs-s14-gemini-y-otros.md con el detalle
# de los 10 hallazgos nuevos detectados en la Sesion 14.
# NO commitea (se hace despues, junto con el tracking).
# Fecha: 2026-10-14
# ----------------------------------------------------------------------------
# Uso:
#   Dry run:  .\33-doc-bugs-s14.ps1
#   Aplicar:  .\33-doc-bugs-s14.ps1 -Commit
# ============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BackupDir = Join-Path $PSScriptRoot '.backup-s14'
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

# ============================================================================
# 1. Construir el contenido del doc
# ============================================================================

$docPath = Join-Path $RepoRoot 'docs\audits\2026-10-13-inicial\24-bugs-s14-gemini-y-otros.md'

$docContent = @(
    '# Hallazgos S14 - Gemini, marketing y otros',
    '',
    '**Fecha:** 2026-10-14',
    '**Sesion:** 14',
    '**Hallazgos cubiertos:** BUG-006, BUG-007, BUG-008, BUG-009, BUG-011, SEC-018, SEC-019, DOC-002, DOC-003',
    '**Relacionado:** BUG-010 (documentado aparte en 23-bug-010-logger-regresion.md)',
    '',
    '---',
    '',
    '## 1. Contexto',
    '',
    'Durante la Sesion 14 se detectaron 10 hallazgos nuevos, en su mayoria',
    'relacionados con el sistema de marketing IA (Gemini) y con keys de',
    'terceros que quedaron sin trazabilidad al migrar cuentas a system.panfree.',
    '',
    'Ninguno es critico de seguridad. Se registran para no perder trazabilidad',
    'y para agendar los fixes en sesiones futuras (F3-07 / chores P3).',
    '',
    '---',
    '',
    '## 2. Familia Gemini / marketing IA (P2, Abiertos)',
    '',
    '### BUG-006 - .env.example desactualizado',
    '',
    '- **Severidad:** Media (P2)',
    '- **Estado:** Abierto',
    '- **Archivo:** `.env.example`',
    '- **Descripcion:** `.env.example` documenta `GEMINI_MODEL=gemini-2.5-flash`',
    '  pero el codigo usa `gemini-3.1-flash-image` (con cascada a fallback).',
    '  Un desarrollador nuevo que clone el repo y copie `.env.example` a',
    '  `.env.local` va a arrancar con un modelo distinto al de produccion.',
    '- **Impacto:** Confusion en onboarding. Posible disparidad de comportamiento',
    '  entre dev y prod (modelos distintos = costos y latencia distintos).',
    '- **Fix propuesto:** actualizar `.env.example` para reflejar el modelo real',
    '  y documentar la cascada de fallback en ENVIRONMENT.md.',
    '<!-- verificar: confirmar la cascada exacta (que modelos, en que orden) -->',
    '',
    '### BUG-007 - IDs de modelo hardcodeados en marketing/page.js',
    '',
    '- **Severidad:** Media (P2)',
    '- **Estado:** Abierto',
    '- **Archivo:** `src/app/admin/marketing/page.js:51-52`',
    '- **Descripcion:** IDs de modelo Gemini hardcodeados en el frontend.',
    '  Deberian venir de constantes o env vars.',
    '- **Impacto:** Dificulta rotar modelos, cambia el frontend cada vez que',
    '  Gemini publica una version nueva.',
    '- **Fix propuesto:** extraer los IDs a constantes en un modulo `src/lib/gemini-modelos.js`.',
    '<!-- verificar: confirmar los IDs exactos hardcodeados en esas lineas -->',
    '',
    '### BUG-008 - Endpoint frontend/backend desalineado',
    '',
    '- **Severidad:** Media (P2)',
    '- **Estado:** Abierto',
    '- **Archivos:** `src/lib/geminiService.js` vs endpoint en `src/app/api/admin/marketing/`',
    '- **Descripcion:** `geminiService.js` llama a `/api/admin/marketing/generate-caption`',
    '  pero el endpoint real es `/generar-contenido`.',
    '- **Impacto:** Si el path incorrecto se ejecuta, la llamada falla (404).',
    '  Puede estar enmascarado por un fallback silencioso o por no ejecutarse',
    '  en el flujo principal.',
    '- **Fix propuesto:** alinear el path en `geminiService.js` con el endpoint real.',
    '<!-- verificar: confirmar si hay fallback y si la ruta ya se corrigio -->',
    '',
    '### BUG-009 - Modelo inexistente en endpoint',
    '',
    '- **Severidad:** Media (P2)',
    '- **Estado:** Abierto',
    '- **Archivo:** endpoint de marketing (mismo del BUG-008)',
    '- **Descripcion:** el endpoint usa `gemini-3.7-flash` que no existe en AI Studio.',
    '- **Impacto:** si ese codigo path se ejecuta, la API de Gemini devuelve error.',
    '- **Fix propuesto:** reemplazar por un modelo valido y mover el ID a constante.',
    '<!-- verificar: confirmar nombre exacto del modelo usado y disponibilidad -->',
    '',
    '---',
    '',
    '## 3. Trazabilidad de keys de terceros (P2, Abiertos)',
    '',
    '### SEC-018 - 3 API keys activas en Cloudinary sin trazabilidad',
    '',
    '- **Severidad:** Media (P2)',
    '- **Estado:** Abierto',
    '- **Servicio:** Cloudinary',
    '- **Descripcion:** el dashboard de Cloudinary muestra 3 API keys activas',
    '  pero no hay registro de que aplicacion/entorno usa cada una.',
    '- **Impacto:** al rotar (F2-04) no se sabe si alguna esta huerfana. Riesgo',
    '  de romper un cliente no documentado, o de dejar una key activa sin uso.',
    '- **Fix propuesto:** identificar cada key (por IP permitida, por nombre,',
    '  por uso reciente), documentar en Bitwarden y revocar las huerfanas.',
    '- **Bloquea:** F2-04 (rotacion Cloudinary API secret).',
    '',
    '### SEC-019 - 4 API keys activas en Gemini sin trazabilidad',
    '',
    '- **Severidad:** Media (P2)',
    '- **Estado:** Abierto',
    '- **Servicio:** Google AI Studio (Gemini)',
    '- **Descripcion:** el dashboard de AI Studio muestra 4 API keys activas',
    '  sin trazabilidad de uso.',
    '- **Impacto:** idem SEC-018.',
    '- **Fix propuesto:** idem SEC-018 (identificar, documentar, revocar huerfanas).',
    '- **Bloquea:** F2-06 (rotacion Gemini API key).',
    '',
    '---',
    '',
    '## 4. Documentacion desactualizada (P3, Abiertos)',
    '',
    '### DOC-002 - MARKETING_INTELLIGENT_SYSTEM.md menciona modelos inexistentes',
    '',
    '- **Severidad:** Baja (P3)',
    '- **Estado:** Abierto',
    '- **Archivo:** `MARKETING_INTELLIGENT_SYSTEM.md` (raiz o docs/)',
    '- **Descripcion:** menciona modelos `gemini-3.5-flash` que no existen en',
    '  el codigo ni en AI Studio.',
    '- **Fix propuesto:** actualizar el doc o marcarlo como historico.',
    '<!-- verificar: ubicacion exacta del archivo -->',
    '',
    '### DOC-003 - Discrepancia endpoint frontend vs backend',
    '',
    '- **Severidad:** Baja (P3)',
    '- **Estado:** Abierto',
    '- **Relacionado:** BUG-008',
    '- **Descripcion:** la documentacion (y el codigo) mezclan dos nombres',
    '  distintos para el mismo endpoint. Falta una fuente unica.',
    '- **Fix propuesto:** al cerrar BUG-008, actualizar la doc relacionada.',
    '',
    '---',
    '',
    '## 5. Hallazgo colateral del fix del logger (P3, Abierto)',
    '',
    '### BUG-011 - Bug en script 29-fix-logger-import.ps1',
    '',
    '- **Severidad:** Baja (P3)',
    '- **Estado:** Abierto',
    '- **Archivo:** `scripts/docs/29-fix-logger-import.ps1`',
    '- **Descripcion:** linea final usa `Write-Ok ($modified + '' archivos modificados'')`.',
    '  PowerShell interpreta `int + string` como suma aritmetica cuando',
    '  `$modified` es int, y rompe el script al final. El fix del logger',
    '  se aplico igual (el error fue solo en el log final y en el commit',
    '  automatico que no se ejecuto).',
    '- **Fix propuesto:** usar `"$modified archivos modificados"` (interpolacion).',
    '- **Detalle completo:** ver `23-bug-010-logger-regresion.md`, seccion',
    '  "Hallazgo colateral".',
    '',
    '---',
    '',
    '## 6. Resumen',
    '',
    '| ID | Severidad | Estado | Bloquea |',
    '|---|---|---|---|',
    '| BUG-006 | P2 | Abierto | - |',
    '| BUG-007 | P2 | Abierto | - |',
    '| BUG-008 | P2 | Abierto | - |',
    '| BUG-009 | P2 | Abierto | - |',
    '| BUG-011 | P3 | Abierto | - |',
    '| SEC-018 | P2 | Abierto | F2-04 |',
    '| SEC-019 | P2 | Abierto | F2-06 |',
    '| DOC-002 | P3 | Abierto | - |',
    '| DOC-003 | P3 | Abierto | - |',
    '',
    '**Nota:** BUG-010 (regresion del logger, Critica) fue cerrado en esta',
    'misma sesion y esta documentado en `23-bug-010-logger-regresion.md`.',
    '',
    '---',
    '',
    '## 7. Proximos pasos',
    '',
    '1. **F3-07 / chores P2:** resolver BUG-006..009 (familia Gemini).',
    '2. **S15 (pre-rotacion):** resolver SEC-018 y SEC-019 antes de tocar',
    '   Cloudinary y Gemini en Fase 2.',
    '3. **chore(docs):** resolver DOC-002 y DOC-003 al tocar los archivos.',
    '4. **chore(scripts):** resolver BUG-011 cuando se toque el script 29.',
    '',
    '---',
    '',
    '## 8. Referencias',
    '',
    '- [Tracking de hallazgos](./06-hallazgos-tracking.md)',
    '- [BUG-010 logger](./23-bug-010-logger-regresion.md)',
    '- [F3-06 DBG-001 logger](./22-f3-06-dbg-001-logger.md)',
    '- [Plan de Trabajo](../../operations/PLAN-DE-TRABAJO.md)',
    '- [Rotacion de claves](../../operations/ROTACION-CLAVES.md)',
    ''
) -join "`r`n"

# ============================================================================
# 2. Escribir (dry run o real)
# ============================================================================

Write-Step ('Crear ' + $docPath.Substring($RepoRoot.Length).TrimStart('\'))

if (Test-Path -LiteralPath $docPath) {
    Write-Skip '24-bugs-s14-gemini-y-otros.md ya existe'
} else {
    if ($Commit) {
        Write-FileRaw $docPath $docContent
        Write-Ok '24-bugs-s14-gemini-y-otros.md creado'
    } else {
        Write-Host '   (dry run: doc NO escrito)' -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 3. Verificacion post (solo si Commit)
# ============================================================================

if ($Commit) {
    Write-Step 'Verificacion post'
    $post = Read-FileRaw $docPath
    $checks = @(
        @{ n = 'BUG-006'; ok = $post.Contains('BUG-006') },
        @{ n = 'BUG-007'; ok = $post.Contains('BUG-007') },
        @{ n = 'BUG-008'; ok = $post.Contains('BUG-008') },
        @{ n = 'BUG-009'; ok = $post.Contains('BUG-009') },
        @{ n = 'BUG-011'; ok = $post.Contains('BUG-011') },
        @{ n = 'SEC-018'; ok = $post.Contains('SEC-018') },
        @{ n = 'SEC-019'; ok = $post.Contains('SEC-019') },
        @{ n = 'DOC-002'; ok = $post.Contains('DOC-002') },
        @{ n = 'DOC-003'; ok = $post.Contains('DOC-003') },
        @{ n = 'ref a 23-bug-010'; ok = $post.Contains('23-bug-010-logger-regresion.md') },
        @{ n = 'ref a tracking';   ok = $post.Contains('06-hallazgos-tracking.md') }
    )
    $fails = @($checks | Where-Object { -not $_.ok })
    if ($fails.Count -eq 0) {
        Write-Ok ('11/11 checks OK')
    } else {
        Write-Err ($fails.Count.ToString() + ' checks fallaron:')
        $fails | ForEach-Object { Write-Err ('  - ' + $_.n) }
        Pop-Location
        exit 1
    }
}

Write-Step 'Fin'
if (-not $Commit) {
    Write-Host '   Dry run OK. Nada escrito.' -ForegroundColor DarkYellow
    Write-Host '   Para aplicar: .\33-doc-bugs-s14.ps1 -Commit' -ForegroundColor DarkYellow
} else {
    Write-Host '   Doc creado. NO commiteado (se hace despues).' -ForegroundColor Cyan
    Write-Host '   Proximo paso: commit del Bloque A.' -ForegroundColor Cyan
}

Pop-Location