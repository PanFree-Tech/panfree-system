# ============================================================================
# 40-f2-02-migrar-supabase.ps1
# ----------------------------------------------------------------------------
# Cierra F2-02: Migración de Supabase a Publishable/Secret keys.
#
# Contexto:
#   - Supabase deprecó las keys legacy (anon/service_role JWT).
#   - Se migró a las nuevas keys: panfree_public_2026_10_15 y panfree_server_2026_10_15.
#   - Se actualizó Vercel y se aplicó fix en src/lib/supabase.js (commit e17110f6).
#   - Legacy keys deshabilitadas. App funcionando. Advisors en 0 issues.
#
# Actualiza:
#   - docs/audits/2026-10-13-inicial/28-f2-02-migrar-supabase.md (crea)
#   - docs/STATUS.md (Fase 2: 3/14 -> 4/14, Total: 25/22/53% -> 26/21/55%)
#
# Fecha: 2026-10-15
# Sesion: 15
# ----------------------------------------------------------------------------
# Uso:
#   Dry run:  .\40-f2-02-migrar-supabase.ps1
#   Aplicar:  .\40-f2-02-migrar-supabase.ps1 -Commit
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
# 1. Crear doc de auditoría
# ============================================================================
Write-Step 'Crear docs/audits/2026-10-13-inicial/28-f2-02-migrar-supabase.md'
$docPath = Join-Path $RepoRoot 'docs\audits\2026-10-13-inicial\28-f2-02-migrar-supabase.md'
$docContent = @(
    '# F2-02 - Migración de Supabase a Publishable/Secret keys',
    '',
    '**Fecha:** 2026-10-15',
    '**Tarea:** F2-02 (Fase 2: Rotación de claves)',
    '**Estado:** Cerrado',
    '**Sesion:** 15',
    '',
    '---',
    '',
    '## 1. Contexto',
    '',
    'Supabase está deprecando las claves legacy (`anon` y `service_role` en formato JWT)',
    'a favor del nuevo sistema de claves asimétricas (`sb_publishable_...` y `sb_secret_...`).',
    'Estas nuevas claves permiten rotación individual sin invalidar sesiones de usuarios.',
    '',
    '## 2. Decisión',
    '',
    'Migrar completamente al nuevo sistema de claves, deshabilitando las legacy.',
    'Esto requiere:',
    '1. Crear nuevas claves Publishable y Secret.',
    '2. Actualizar las variables de entorno en Vercel.',
    '3. Ajustar el código si existía validación estricta del formato JWT legacy.',
    '4. Deshabilitar las claves legacy una vez verificada la migración.',
    '',
    '## 3. Ejecución',
    '',
    '### 3.1 Creación de claves nuevas',
    '- Publishable: `panfree_public_2026_10_15`',
    '- Secret: `panfree_server_2026_10_15`',
    '',
    '### 3.2 Actualización de Vercel',
    '- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> nuevo valor `sb_publishable_...`',
    '- `SUPABASE_SERVICE_ROLE_KEY` -> nuevo valor `sb_secret_...`',
    '',
    '### 3.3 Fix en el código (Hallazgo colateral)',
    'El archivo `src/lib/supabase.js` tenía una función `sanitizeSupabaseKey` que',
    'validaba estrictamente el formato JWT (`eyJ...`). Se modificó para aceptar',
    'ambos formatos durante la transición:',
    '',
    '```javascript',
    'const esJWT = clean.split(''.'').length === 3 && clean.length >= 50',
    'const esPublishable = clean.startsWith(''sb_publishable_'')',
    'if (!esJWT && !esPublishable) { throw new Error(...) }',
    '```',
    '',
    '**Commit del fix:** `e17110f6`',
    '',
    '### 3.4 Deshabilitación de Legacy',
    'Una vez verificado el funcionamiento en producción, se deshabilitaron las',
    'claves legacy `anon` y `service_role` desde el dashboard de Supabase.',
    '',
    '## 4. Verificación',
    '',
    '- ✅ Build de Vercel exitoso.',
    '- ✅ Home, Login, Admin y operaciones de escritura funcionando.',
    '- ✅ Supabase Advisors: 0 issues de seguridad o performance.',
    '- ✅ Bitwarden actualizado con las nuevas claves y región `sa-east-1`.',
    '',
    '## 5. DoD',
    '',
    '- [x] Claves nuevas creadas y nombradas con convención.',
    '- [x] Vercel actualizado con las nuevas claves.',
    '- [x] Código adaptado para aceptar formato `sb_publishable_`.',
    '- [x] Redeploy exitoso y verificación end-to-end.',
    '- [x] Claves legacy deshabilitadas en Supabase.',
    '- [x] Bitwarden actualizado.',
    '- [x] Documentación de auditoría generada.',
    '',
    '---',
    '',
    '## 6. Referencias',
    '',
    '- [Commit del fix](https://github.com/PanFree-Tech/panfree-system/commit/e17110f6)',
    '- [Guía de migración de Supabase](https://supabase.com/docs/guides/getting-started/api-keys)',
    ''
) -join "`r`n"

if (Test-Path -LiteralPath $docPath) {
    Write-Skip '28-f2-02-migrar-supabase.md ya existe'
} else {
    if ($Commit) {
        Write-FileRaw $docPath $docContent
        Write-Ok '28-f2-02-migrar-supabase.md creado'
    } else {
        Write-Host '   (dry run: doc NO escrito)' -ForegroundColor DarkYellow
    }
}

# ============================================================================
# 2. Actualizar STATUS.md
# ============================================================================
Write-Step 'Actualizar docs/STATUS.md'
$statusPath = Join-Path $RepoRoot 'docs\STATUS.md'
if (-not (Test-Path -LiteralPath $statusPath)) {
    Write-Err 'STATUS.md no existe'
    Pop-Location
    exit 1
}
$status = Read-FileRaw $statusPath

# 2a. Fase 2: 3/14 -> 4/14
$fase2Viejo = '| F2 - Rotacion claves | 14 | 3 | 0 | 11 | 21% |'
$fase2Nuevo = '| F2 - Rotacion claves | 14 | 4 | 0 | 10 | 29% |'
if ($status.Contains($fase2Viejo)) {
    $status = $status.Replace($fase2Viejo, $fase2Nuevo)
    Write-Ok 'Fase 2 actualizada: 3/14 -> 4/14 (29%)'
} else {
    Write-Skip 'Fila Fase 2 no matcheo (posible cambio previo)'
}

# 2b. Total: 25/22/53% -> 26/21/55%
$totalViejo = '| **Total** | **47** | **25** | **0** | **22** | **53%** |'
$totalNuevo = '| **Total** | **47** | **26** | **0** | **21** | **55%** |'
if ($status.Contains($totalViejo)) {
    $status = $status.Replace($totalViejo, $totalNuevo)
    Write-Ok 'Total actualizado: 25/22/53% -> 26/21/55%'
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
# 3. Verificación post (solo si Commit)
# ============================================================================
if ($Commit) {
    Write-Step 'Verificacion post'
    $docPost = Read-FileRaw $docPath
    $staPost = Read-FileRaw $statusPath
    $checks = @(
        @{ n = 'Doc 28: F2-02';                  ok = $docPost.Contains('F2-02') },
        @{ n = 'Doc 28: Migracion';              ok = $docPost.Contains('Publishable/Secret keys') },
        @{ n = 'Doc 28: Fix supabase.js';        ok = $docPost.Contains('sanitizeSupabaseKey') },
        @{ n = 'Doc 28: DoD';                    ok = $docPost.Contains('## 5. DoD') },
        @{ n = 'STATUS: Fase 2 4/14';            ok = $staPost.Contains('| F2 - Rotacion claves | 14 | 4 | 0 | 10 | 29% |') },
        @{ n = 'STATUS: Total 26/21/55%';        ok = $staPost.Contains('| **Total** | **47** | **26** | **0** | **21** | **55%** |') }
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
# 4. Commit + push
# ============================================================================
Write-Step 'Commit'
if (-not $Commit) {
    Write-Host '   Dry run. Nada escrito, nada commiteado.' -ForegroundColor DarkYellow
    Write-Host '   Para aplicar: .\40-f2-02-migrar-supabase.ps1 -Commit' -ForegroundColor DarkYellow
    Pop-Location
    exit 0
}

git add -- docs/audits/2026-10-13-inicial/28-f2-02-migrar-supabase.md
git add -- docs/STATUS.md
$staged = @(git diff --cached --name-only)
if ($staged.Count -eq 0) {
    Write-Skip 'Nada staged. No hay commit.'
    Pop-Location
    exit 0
}
Write-Ok ('Archivos staged: ' + $staged.Count)
$staged | ForEach-Object { Write-Host ('     - ' + $_) -ForegroundColor DarkGray }

$msg = 'security(env): migrar Supabase a Publishable/Secret keys (F2-02)'
git commit -m $msg
if ($LASTEXITCODE -ne 0) { Write-Err 'git commit fallo'; Pop-Location; exit 1 }

git push origin main
if ($LASTEXITCODE -ne 0) { Write-Err 'git push fallo'; Pop-Location; exit 1 }

Write-Ok ('Commit pusheado: ' + $msg)
Write-Host ''
Write-Host 'F2-02 cerrado COMPLETO.' -ForegroundColor Cyan
Write-Host 'Proximo paso: Cierre formal de la Sesion 15 o continuar con F2-05 (Resend).' -ForegroundColor Cyan
Pop-Location