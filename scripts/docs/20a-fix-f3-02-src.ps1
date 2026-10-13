# PowerShell
# =============================================================================
# 20a - FIX F3-02 / SEC-002: quitar claves hardcodeadas de src/
# =============================================================================
# Fecha: 2026-10-14
# Sesion: 10
# Hallazgo: SEC-002 (DEFAULT_SUPABASE_ANON_KEY + DEFAULT_SUPABASE_URL)
#
# Este script APLICA los cambios en src/ pero NO commitea.
# El commit lo hace el 20b junto con la documentacion.
#
# Uso:
#   .\scripts\docs\20a-fix-f3-02-src.ps1
#
# Reglas:
#   - Idempotente: si ya esta aplicado, [INFO] y sale limpio.
#   - Backup en $env:TEMP\panfree-f3-02-backup\ (fuera del repo).
#   - UTF-8 sin BOM (via [System.IO.File]::WriteAllText).
#   - Si algun archivo no coincide con el estado esperado: ABORTA.
#   - No toca git (ni add, ni commit, ni stash).
#   - ASCII puro en el .ps1 y en el .js generado (sin emojis).
# =============================================================================

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

# --- Rutas base --------------------------------------------------------------
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $repoRoot

$supabaseJs   = Join-Path $repoRoot 'src\lib\supabase.js'
$backupDir    = Join-Path $env:TEMP 'panfree-f3-02-backup'
$utf8NoBom    = New-Object System.Text.UTF8Encoding($false)

$consumidores = @(
    'src\middleware.js',
    'src\app\api\send-email\route.js',
    'src\app\api\send-whatsapp-team\route.js',
    'src\app\api\resumen-diario\route.js',
    'src\app\api\dipticos\canjear\route.js',
    'src\app\api\admin\marketing\programar-publicacion\route.js',
    'src\app\api\admin\marketing\publish-instagram\route.js'
)

Write-Host ''
Write-Host ('=' * 70) -ForegroundColor Magenta
Write-Host '  20a - FIX F3-02 / SEC-002: quitar claves hardcodeadas' -ForegroundColor Magenta
Write-Host ('=' * 70) -ForegroundColor Magenta
Write-Host ("  Repo:   " + $repoRoot)
Write-Host ("  Backup: " + $backupDir)
Write-Host ''

# --- [1/7] Prerequisitos -----------------------------------------------------
Write-Host '[1/7] Verificando prerequisitos...'

if (-not (Test-Path $supabaseJs)) {
    Write-Host ("  ERROR: no existe " + $supabaseJs) -ForegroundColor Red
    exit 1
}

foreach ($c in $consumidores) {
    $p = Join-Path $repoRoot $c
    if (-not (Test-Path $p)) {
        Write-Host ("  ERROR: no existe " + $p) -ForegroundColor Red
        exit 1
    }
}

Write-Host '  OK: todos los archivos existen.'

# --- [2/7] Deteccion de idempotencia -----------------------------------------
Write-Host ''
Write-Host '[2/7] Detectando si el fix ya esta aplicado...'

$contenidoSupabase = [System.IO.File]::ReadAllText($supabaseJs)

if ($contenidoSupabase -notmatch 'DEFAULT_SUPABASE_ANON_KEY' -and
    $contenidoSupabase -notmatch 'DEFAULT_SUPABASE_URL') {
    Write-Host '  [INFO] El fix ya esta aplicado en src/lib/supabase.js.'
    Write-Host '  [INFO] Nada que hacer. Saliendo limpio.' -ForegroundColor Yellow
    exit 0
}

Write-Host '  OK: fix pendiente, procediendo.'

# --- [3/7] Verificacion de estado esperado (fail-fast) -----------------------
Write-Host ''
Write-Host '[3/7] Verificando que los archivos coinciden con el estado esperado...'

$errores = @()

# 3.1 supabase.js: lineas 9 y 10
$lineasSupabase = [System.IO.File]::ReadAllLines($supabaseJs)
if ($lineasSupabase.Length -lt 10) {
    $errores += 'supabase.js tiene menos de 10 lineas'
} else {
    if ($lineasSupabase[8]  -notmatch "DEFAULT_SUPABASE_URL\s*=\s*'https://") {
        $errores += 'supabase.js:9 no coincide con DEFAULT_SUPABASE_URL esperada'
    }
    if ($lineasSupabase[9]  -notmatch "DEFAULT_SUPABASE_ANON_KEY\s*=\s*'eyJ") {
        $errores += 'supabase.js:10 no coincide con DEFAULT_SUPABASE_ANON_KEY esperada'
    }
}

# 3.2 consumidores: cada archivo debe tener DEFAULT_SUPABASE_ANON_KEY
foreach ($c in $consumidores) {
    $p = Join-Path $repoRoot $c
    $txt = [System.IO.File]::ReadAllText($p)
    if ($txt -notmatch 'DEFAULT_SUPABASE_ANON_KEY') {
        $errores += ($c + ': no contiene DEFAULT_SUPABASE_ANON_KEY (ya modificado a mano?)')
    }
}

# 3.3 dipticos/canjear: debe tener DEFAULT_SUPABASE_URL
$canjearPath = Join-Path $repoRoot 'src\app\api\dipticos\canjear\route.js'
$canjearTxt  = [System.IO.File]::ReadAllText($canjearPath)
if ($canjearTxt -notmatch 'DEFAULT_SUPABASE_URL') {
    $errores += 'dipticos/canjear/route.js: no contiene DEFAULT_SUPABASE_URL (ya modificado a mano?)'
}

if ($errores.Count -gt 0) {
    Write-Host '  ABORTADO. Los siguientes archivos no coinciden con el estado esperado:' -ForegroundColor Red
    foreach ($e in $errores) { Write-Host ('    - ' + $e) -ForegroundColor Red }
    Write-Host '  No se toco ningun archivo.' -ForegroundColor Yellow
    exit 1
}

Write-Host '  OK: todos los archivos coinciden con el estado esperado.'

# --- [4/7] Backup ------------------------------------------------------------
Write-Host ''
Write-Host '[4/7] Creando backup...'

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupSub = Join-Path $backupDir $timestamp
New-Item -ItemType Directory -Path $backupSub -Force | Out-Null

$archivosATocar = @($supabaseJs) + ($consumidores | ForEach-Object { Join-Path $repoRoot $_ })

foreach ($src in $archivosATocar) {
    $rel = $src.Substring($repoRoot.Length).TrimStart('\')
    $dst = Join-Path $backupSub $rel
    $dstDir = Split-Path $dst -Parent
    if (-not (Test-Path $dstDir)) {
        New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
    }
    Copy-Item -Path $src -Destination $dst -Force
}

Write-Host ('  OK: backup en ' + $backupSub)
Write-Host '  (Fuera del repo. No afecta git.)'

# --- [5/7] Aplicar fix en src/lib/supabase.js --------------------------------
Write-Host ''
Write-Host '[5/7] Aplicando fix en src/lib/supabase.js...'

# NOTA: archivo en ASCII puro para evitar problemas de encoding.
$nuevoSupabase = @(
    '/**',
    'src/lib/supabase.js',
    'ACTUALIZADO: 2026-10-14',
    'DESCRIPCION: Cliente de Supabase - VERSION COMPATIBLE SSR Y NAVEGADOR',
    'SEGURIDAD (SEC-002): sin claves ni URLs hardcodeadas.',
    '  Las env vars son obligatorias. Si faltan, fail-fast en runtime.',
    '*/',
    "import { createBrowserClient } from '@supabase/ssr'",
    "import { createClient as createSupabaseClient } from '@supabase/supabase-js'",
    '',
    '/**',
    ' * Sanitiza y asegura que supabaseUrl sea una URL HTTP/HTTPS valida.',
    ' * Fail-fast: si no hay URL, tira error explicito (SEC-002).',
    ' */',
    'export function sanitizeSupabaseUrl(url) {',
    '  if (!url || typeof url !== ''string'' || !url.trim()) {',
    '    throw new Error(',
    "      'NEXT_PUBLIC_SUPABASE_URL no esta configurada. ' +",
    "      'Agregala en .env.local (dev) o en las env vars del hosting (prod).'",
    '    )',
    '  }',
    '  let clean = url.trim()',
    "  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {",
    '    clean = "https://" + clean',
    '  }',
    '  try {',
    '    new URL(clean)',
    '    return clean',
    '  } catch {',
    '    throw new Error("NEXT_PUBLIC_SUPABASE_URL no es una URL valida: " + url)',
    '  }',
    '}',
    '',
    '/**',
    ' * Sanitiza la anon key de Supabase.',
    ' * Fail-fast: si no hay key valida, tira error explicito (SEC-002).',
    ' */',
    'export function sanitizeSupabaseKey(key) {',
    '  if (!key || typeof key !== ''string'' || !key.trim()) {',
    '    throw new Error(',
    "      'NEXT_PUBLIC_SUPABASE_ANON_KEY no esta configurada. ' +",
    "      'Agregala en .env.local (dev) o en las env vars del hosting (prod).'",
    '    )',
    '  }',
    '  const clean = key.trim()',
    "  const parts = clean.split('.')",
    '  // A valid Supabase JWT token MUST have 3 parts (header.payload.signature)',
    '  if (parts.length !== 3 || clean.length < 50) {',
    "    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no tiene formato JWT valido.')",
    '  }',
    '  return clean',
    '}',
    '',
    '// Usar valores sanitizados (fail-fast si faltan env vars)',
    'const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL',
    'const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY',
    '',
    'const supabaseUrl = sanitizeSupabaseUrl(rawUrl)',
    'const supabaseAnonKey = sanitizeSupabaseKey(rawKey)',
    '',
    'export const createClient = () => {',
    "  if (typeof window !== 'undefined') {",
    '    return createBrowserClient(supabaseUrl, supabaseAnonKey)',
    '  }',
    '  return createSupabaseClient(supabaseUrl, supabaseAnonKey)',
    '}',
    '',
    '// Crear cliente SIEMPRE - NUNCA retornar null',
    "export const supabase = typeof window !== 'undefined'",
    '  ? createBrowserClient(supabaseUrl, supabaseAnonKey)',
    '  : createSupabaseClient(supabaseUrl, supabaseAnonKey)',
    '',
    '// Funcion helper para verificar conexion real',
    'export async function checkSupabaseConnection() {',
    '  try {',
    "    const { data, error } = await supabase.from('productos').select('id').limit(1)",
    '    if (error) throw error',
    '    return { connected: true, data }',
    '  } catch (err) {',
    "    console.error('Error de conexion Supabase:', err.message)",
    '    return { connected: false, error: err.message }',
    '  }',
    '}'
) -join "`r`n"

[System.IO.File]::WriteAllText($supabaseJs, $nuevoSupabase + "`r`n", $utf8NoBom)
Write-Host '  OK: src/lib/supabase.js reescrito.'

# --- [6/7] Aplicar fix en los 7 consumidores ---------------------------------
Write-Host ''
Write-Host '[6/7] Aplicando fix en los 7 consumidores...'

$msgThrow = "(() => { throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no configurada') })()"
$totalReemplazos = 0

foreach ($c in $consumidores) {
    $p = Join-Path $repoRoot $c
    $txt = [System.IO.File]::ReadAllText($p)
    $original = $txt
    $reemplazos = 0

    # 6.1 Quitar DEFAULT_SUPABASE_ANON_KEY del import
    if ($txt -match "DEFAULT_SUPABASE_ANON_KEY") {
        $antes = $txt
        $txt = $txt -replace ',\s*DEFAULT_SUPABASE_ANON_KEY(\s*\})', '$1'
        if ($txt -ne $antes) { $reemplazos++ }

        $antes = $txt
        $txt = $txt -replace '(\{\s*)DEFAULT_SUPABASE_ANON_KEY,\s*', '$1'
        if ($txt -ne $antes) { $reemplazos++ }
    }

    # 6.2 Quitar DEFAULT_SUPABASE_URL del import (solo dipticos/canjear)
    if ($txt -match "DEFAULT_SUPABASE_URL") {
        $antes = $txt
        $txt = $txt -replace ',\s*DEFAULT_SUPABASE_URL(\s*,|\s*\})', '$1'
        if ($txt -ne $antes) { $reemplazos++ }
        $antes = $txt
        $txt = $txt -replace '(\{\s*)DEFAULT_SUPABASE_URL,\s*', '$1'
        if ($txt -ne $antes) { $reemplazos++ }
    }

    # 6.3 Reemplazar el fallback final "|| DEFAULT_SUPABASE_ANON_KEY" por IIFE throw
    if ($txt -match '\|\|\s*DEFAULT_SUPABASE_ANON_KEY') {
        $antes = $txt
        $txt = $txt -replace '\|\|\s*DEFAULT_SUPABASE_ANON_KEY', ('|| ' + $msgThrow)
        if ($txt -ne $antes) { $reemplazos++ }
    }

    # 6.4 Reemplazar fallback ternario "? rawKey.trim() : DEFAULT_SUPABASE_ANON_KEY"
    if ($txt -match ':\s*DEFAULT_SUPABASE_ANON_KEY') {
        $antes = $txt
        $txt = $txt -replace ':\s*DEFAULT_SUPABASE_ANON_KEY', (': ' + $msgThrow)
        if ($txt -ne $antes) { $reemplazos++ }
    }

    # 6.5 Linea suelta "DEFAULT_SUPABASE_ANON_KEY" (ya cubierto por 6.3)
    if ($txt -match '(?m)^\s*DEFAULT_SUPABASE_ANON_KEY\s*$') {
        $txt = $txt -replace '(?m)^\s*DEFAULT_SUPABASE_ANON_KEY\s*\r?\n', ''
        $reemplazos++
    }

    if ($txt -ne $original) {
        [System.IO.File]::WriteAllText($p, $txt, $utf8NoBom)
        Write-Host ("  OK: " + $c + " (" + $reemplazos + " reemplazos)")
        $totalReemplazos += $reemplazos
    } else {
        Write-Host ("  SKIP: " + $c + " (sin cambios)")
    }
}

Write-Host ("  Total de reemplazos: " + $totalReemplazos)

# --- [7/7] Verificacion final ------------------------------------------------
Write-Host ''
Write-Host '[7/7] Verificacion final...'
Write-Host ''

Write-Host '  grep de constantes hardcodeadas en src/ (debe dar 0):' -ForegroundColor Cyan
$restantes = Get-ChildItem -Path 'src' -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx |
    Select-String -Pattern 'DEFAULT_SUPABASE_ANON_KEY|DEFAULT_SUPABASE_URL'

if ($restantes) {
    $restantes | ForEach-Object {
        Write-Host ("    " + $_.Path + ":" + $_.LineNumber + ": " + $_.Line.Trim()) -ForegroundColor Red
    }
    Write-Host '  ERROR: quedan referencias. Revisar manualmente.' -ForegroundColor Red
} else {
    Write-Host '  OK: 0 referencias.' -ForegroundColor Green
}

Write-Host ''
Write-Host '  git diff --stat:' -ForegroundColor Cyan
git diff --stat

Write-Host ''
Write-Host '  git status --short:' -ForegroundColor Cyan
git status --short

Write-Host ''
Write-Host ('=' * 70) -ForegroundColor Magenta
Write-Host '  Script 20a finalizado' -ForegroundColor Magenta
Write-Host ('=' * 70) -ForegroundColor Magenta
Write-Host ''
Write-Host '  Revisa el diff con:' -ForegroundColor Yellow
Write-Host '    git diff' -ForegroundColor Yellow
Write-Host ''
Write-Host '  Si todo OK, corremos el 20b (documentar + commit).' -ForegroundColor Yellow
Write-Host '  Backup en: ' -NoNewline -ForegroundColor Yellow
Write-Host $backupSub -ForegroundColor Yellow
Write-Host ''