# ============================================================================
# 31-cierre-s14.ps1
# ----------------------------------------------------------------------------
# Cierre de la Sesion 14 (ENV) - parte 1
# Crea doc del incidente BUG-010, actualiza STATUS, BITACORA y tracking.
# Fecha: 2026-10-14
# ----------------------------------------------------------------------------
# Uso:
#   Dry run (default):  .\31-cierre-s14.ps1
#   Aplicar + commit:   .\31-cierre-s14.ps1 -Commit
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

$head = (git rev-parse HEAD).Trim()
Write-Ok ('HEAD: ' + $head)

# ============================================================================
# 1. Crear doc BUG-010
# ============================================================================

Write-Step 'Crear docs/audits/2026-10-13-inicial/23-bug-010-logger-regresion.md'

$docPath = Join-Path $RepoRoot 'docs\audits\2026-10-13-inicial\23-bug-010-logger-regresion.md'

$docContent = @(
    '# BUG-010 - Regresion del logger (S13)',
    '',
    '**Fecha:** 2026-10-14',
    '**Hallazgo:** BUG-010',
    '**Severidad:** Critica (produccion caida)',
    '**Estado:** Cerrado',
    '**Commit fix:** 757938c2',
    '',
    '---',
    '',
    '## Sintoma',
    '',
    'Application error: a client-side exception has occurred.',
    'Console: `ReferenceError: logger is not defined`.',
    '',
    '---',
    '',
    '## Causa raiz',
    '',
    'El commit `a031ba2e` (S13, F3-06) reemplazo 381 llamadas `console.*`',
    'por `logger.*` en 88 archivos, pero importo el logger con:',
    '',
    '    import { log, warn, error } from ''@/lib/logger''',
    '',
    'El modulo `src/lib/logger.js` exporta funciones sueltas (`log`, `warn`, `error`)',
    'Y un default `{ log, warn, error }`, pero NO un objeto `logger`.',
    '',
    'Los 88 archivos llamaban `logger.log(...)`, `logger.warn(...)`,',
    '`logger.error(...)`, pero `logger` nunca se definio. Resultado:',
    '`ReferenceError` en runtime (no en build — Next.js no falla por esto).',
    '',
    '---',
    '',
    '## Fix aplicado',
    '',
    'Reemplazo literal en los 88 archivos:',
    '',
    '    import { log, warn, error } from ''@/lib/logger''',
    '    ->',
    '    import logger from ''@/lib/logger''',
    '',
    'Los calls `logger.log/warn/error` quedan intactos.',
    '',
    '- Script: `scripts/docs/29-fix-logger-import.ps1`',
    '- Commit: `757938c2`',
    '',
    '---',
    '',
    '## Verificacion',
    '',
    '- Deploy Vercel `757938c2`: Ready',
    '- App en incognito: OK',
    '- Console: sin ReferenceError',
    '- React montado, DOM con contenido (2329 chars)',
    '- Script verificacion: 9 checks OK',
    '',
    '---',
    '',
    '## Hallazgo colateral',
    '',
    '**BUG-011:** bug en `scripts/docs/29-fix-logger-import.ps1`, linea final:',
    '',
    '    Write-Ok ($modified + '' archivos modificados'')',
    '',
    'PowerShell interpreta `$modified + '' string''` como suma aritmetica',
    'cuando `$modified` es int. Fix pendiente: usar `"$modified archivos',
    'modificados"`. No bloquea (el fix se aplico igual, solo fallo el log',
    'final y el commit automatico).',
    '',
    '---',
    '',
    '## Lecciones',
    '',
    '1. Los reemplazos masivos (381 calls en 88 archivos) requieren',
    '   verificacion post-fix en produccion. El build paso OK pero la',
    '   app crasheaba en runtime.',
    '2. Nunca asumir que un import "esta bien" solo porque el archivo',
    '   lo tiene. Verificar que el nombre importado matchee con el uso.',
    '3. En Next.js, un error de referencia en runtime no rompe el build.',
    '',
    '---',
    '',
    '## Referencias',
    '',
    '- Commit fix: 757938c2',
    '- Script: scripts/docs/29-fix-logger-import.ps1',
    '- Doc original S13: 22-f3-06-dbg-001-logger.md',
    '- [Tracking de hallazgos](./06-hallazgos-tracking.md)',
    ''
) -join "`r`n"

if (Test-Path -LiteralPath $docPath) {
    Write-Skip '23-bug-010-logger-regresion.md ya existe'
} else {
    if ($Commit) {
        Write-FileRaw $docPath $docContent
        Write-Ok '23-bug-010-logger-regresion.md creado'
    } else {
        Write-Host '   (dry run: doc NO escrito)' -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 2. Actualizar STATUS.md
# ============================================================================

Write-Step 'Actualizar STATUS.md'

$statusPath = Join-Path $RepoRoot 'docs\STATUS.md'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$statusChanged = $false

if (Test-Path -LiteralPath $statusPath) {
    $status = Read-FileRaw $statusPath

    $s14Block = @(
        '',
        '**2026-10-14 - Sesion 14 (ENV) - PARCIAL**',
        '- Bloque 0: sync docs S13 (commit fdcb6c70).',
        '- Chore gitignore: dejar de versionar .vercel/ + exceptuar .env.example',
        '  (commits 14ba0076 + a0cc5c8f).',
        '- F2-01: Supabase Owner a system.panfree (hecho).',
        '- F2-03: Cloudinary a system.panfree (hecho).',
        '- F2-14 Bitwarden: 3 de 13 items cargados (Supabase, Cloudinary, Gemini).',
        '- INCIDENTE: BUG-010 (regresion logger S13). App caida en produccion.',
        '  Fix en commit 757938c2. Deploy Ready. Verificado en incognito: OK.',
        '- Nuevos hallazgos pendientes de documentar en tracking:',
        '  BUG-010, BUG-011, SEC-018, SEC-019, BUG-006..009, DOC-002, DOC-003.',
        '- Continua en Sesion 15.',
        '',
        '---'
    ) -join "`r`n"

    $anchor = @(
        '- Doc: docs/audits/2026-10-13-inicial/22-f3-06-dbg-001-logger.md',
        '- Deuda detectada: build local no funciona sin .env.local',
        '  (preexistente desde S10, F3-02). Fase 2 lo resuelve.',
        '',
        '---'
    ) -join "`r`n"

    if ($status.Contains('Sesion 14 (ENV) - PARCIAL')) {
        Write-Skip 'Bloque Sesion 14 ya presente en STATUS.md'
    } elseif ($status.Contains($anchor)) {
        $status = $status.Replace($anchor, $anchor + "`r`n" + $s14Block)
        if ($Commit) {
            Backup-File $statusPath $stamp
            Write-FileRaw $statusPath $status
            Write-Ok 'STATUS.md actualizado'
        } else {
            Write-Host '   (dry run: STATUS.md NO escrito)' -ForegroundColor DarkYellow
        }
        $statusChanged = $true
    } else {
        Write-Skip 'Ancla de Sesion 13 no encontrada en STATUS.md'
    }
} else {
    Write-Err 'STATUS.md no existe'
}

# ============================================================================
# 3. Actualizar BITACORA.md
# ============================================================================

Write-Step 'Actualizar BITACORA.md'

$bitPath = Join-Path $RepoRoot 'docs\BITACORA.md'

$bitBlock = @(
    '',
    '## 2026-10-14 (Sesion 14 - PARCIAL, continua en S15)',
    '',
    '**Duracion:** ~5 horas',
    '**Objetivo:** Fase 2 (ENV) - Bitwarden + migraciones + incidente logger',
    '',
    '**Completado:**',
    '- Bloque 0: sinc docs S13 (commit fdcb6c70).',
    '- Chore gitignore: .vercel/ fuera del repo + !.env.example (14ba0076 + a0cc5c8f).',
    '- F2-01: Supabase Owner a system.panfree.',
    '- F2-03: Cloudinary a system.panfree.',
    '- F2-14 Bitwarden: 3 de 13 items (Supabase, Cloudinary, Gemini).',
    '- INCIDENTE CRITICO: app caida en produccion (BUG-010).',
    '  Regresion del logger en 88 archivos (import erroneo del S13).',
    '  Fix: 757938c2. Deploy Ready. Verificado en incognito.',
    '',
    '**Commits:**',
    '- fdcb6c70 docs(sync): alinear STATUS, tracking y README de audits con S13',
    '- 14ba0076 chore(git): dejar de versionar .vercel/ y exceptuar .env.example',
    '- a0cc5c8f chore(git): limpiar comentario duplicado en .gitignore',
    '- 757938c2 fix(logger): corregir import del logger en 88 archivos (regresion S13)',
    '',
    '**Hallazgos cerrados:**',
    '- BUG-010: regresion del logger (import erroneo, 88 archivos)',
    '',
    '**Hallazgos nuevos:**',
    '- BUG-010: regresion del logger (cerrado en esta sesion)',
    '- BUG-011: bug en script 29-fix-logger-import.ps1 (linea final)',
    '- SEC-018: 3 API keys activas en Cloudinary sin trazabilidad',
    '- SEC-019: 4 API keys activas en Gemini sin trazabilidad',
    '- BUG-006: .env.example dice gemini-2.5-flash pero codigo usa gemini-3.1-flash-image',
    '- BUG-007: IDs de modelo Gemini hardcodeados en marketing/page.js',
    '- BUG-008: geminiService llama a /generate-caption pero endpoint real es /generar-contenido',
    '- BUG-009: endpoint usa gemini-3.7-flash que no existe en AI Studio',
    '- DOC-002: MARKETING_INTELLIGENT_SYSTEM.md menciona modelos inexistentes',
    '- DOC-003: discrepancia endpoint frontend vs backend',
    '',
    '**Bloqueantes:**',
    '- Ninguno. App en produccion OK.',
    '',
    '**Aprendizajes:**',
    '- Reemplazos masivos (381 calls en 88 archivos) requieren verificacion',
    '  post-fix en produccion. Build OK no garantiza runtime OK.',
    '- Vercel env pull NO baja valores marcados como Secret.',
    '  Escribe [SENSITIVE] como placeholder.',
    '- NEXT_PUBLIC_* en Vercel suelen ser visibles con ojito.',
    '- Glob ** en Select-String -Path no funciona en PS 5.1.',
    '  Usar Get-ChildItem -Recurse | Select-String.',
    '- $var + '' string'' falla si $var es int (PS interpreta suma).',
    '  Usar "$var string".',
    '',
    '**Proxima sesion:**',
    '- Completar Bitwarden Tier 1 (10 items).',
    '- Documentar hallazgos nuevos en tracking.',
    '- Cerrar S14 oficialmente.',
    '- (S15+) Iniciar rotaciones (F2-02, F2-04..F2-13).',
    '- (S15+) Bloque B: SEC-014..017 (chores de hardcodes).',
    '',
    '---',
    ''
) -join "`r`n"

if (Test-Path -LiteralPath $bitPath) {
    $bit = Read-FileRaw $bitPath
    if ($bit.Contains('Sesion 14 - PARCIAL')) {
        Write-Skip 'Bloque Sesion 14 ya presente en BITACORA.md'
    } else {
        if ($Commit) {
            Backup-File $bitPath $stamp
            $bit = $bit.TrimEnd() + "`r`n" + $bitBlock
            Write-FileRaw $bitPath $bit
            Write-Ok 'BITACORA.md actualizada'
        } else {
            Write-Host '   (dry run: BITACORA.md NO escrita)' -ForegroundColor DarkYellow
        }
    }
} else {
    Write-Err 'BITACORA.md no existe'
}

# ============================================================================
# 4. Actualizar 06-hallazgos-tracking.md
# ============================================================================

Write-Step 'Actualizar tracking (agregar fila BUG-010)'

$trackPath = Join-Path $RepoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'

if (Test-Path -LiteralPath $trackPath) {
    $track = Read-FileRaw $trackPath
    if ($track.Contains('BUG-010')) {
        Write-Skip 'BUG-010 ya en tracking'
    } else {
        Write-Skip 'Tracking: agregado manual recomendado (muchos hallazgos nuevos)'
    }
} else {
    Write-Err '06-hallazgos-tracking.md no existe'
}

# ============================================================================
# 5. Commit
# ============================================================================

Write-Step 'Commit'

if (-not $Commit) {
    Write-Host '   Dry run. Nada escrito, nada commiteado.' -ForegroundColor DarkYellow
    Write-Host '   Para aplicar: .\31-cierre-s14.ps1 -Commit' -ForegroundColor DarkYellow
    Pop-Location
    exit 0
}

git add -- docs/STATUS.md docs/BITACORA.md
git add -- docs/audits/2026-10-13-inicial/23-bug-010-logger-regresion.md

$staged = @(git diff --cached --name-only)
if ($staged.Count -eq 0) {
    Write-Skip 'Nada staged. No hay commit.'
    Pop-Location
    exit 0
}
Write-Ok ('Archivos staged: ' + $staged.Count)

$msg = 'docs(session): cerrar sesion 14 parcial (ENV) - incidente BUG-010'
git commit -m $msg
if ($LASTEXITCODE -ne 0) { Write-Err 'git commit fallo'; Pop-Location; exit 1 }

git push origin main
if ($LASTEXITCODE -ne 0) { Write-Err 'git push fallo'; Pop-Location; exit 1 }

Write-Ok ('Commit pusheado: ' + $msg)
Write-Host ''
Write-Host 'Sesion 14 parte 1 cerrada.' -ForegroundColor Cyan
Write-Host 'Proximo paso: nueva conversacion con dump + prompt.' -ForegroundColor Cyan

Pop-Location