<#
.SYNOPSIS
    Fix BUG-013: createClient en top-level rompe build en CI.
.DESCRIPTION
    test-email/route.js y resend-webhook/route.js instancian createClient()
    en top-level. Next.js, al "Collecting page data", importa los modulos y
    ejecuta createClient() con process.env.SUPABASE_SERVICE_ROLE_KEY undefined
    (no esta en CI). Resultado: "supabaseKey is required" y Build falla.

    Fix: mover createClient() dentro de getSupabaseAdmin(), que se ejecuta
    solo en runtime, no en build.

    Estrategia robusta:
    1. Reemplazar el bloque top-level "const supabaseAdmin = createClient(...)"
       por "function getSupabaseAdmin() { return createClient(...) }".
    2. Agregar "const supabaseAdmin = getSupabaseAdmin()" al inicio del handler.

    El doc de auditoria se construye con array de strings + -join
    (NO here-string) para evitar el bug de PowerShell 5.1 con Markdown grande.

    Archivos afectados:
    - src/app/api/admin/marketing/test-email/route.js
    - src/app/api/resend-webhook/route.js

    No toca send-email/route.js (ya tiene el patron correcto con fallback).
.NOTES
    Sesion: 25
    Fecha: 2026-10-17
    Hallazgo: BUG-013 (nuevo)
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

$archivos = @(
    @{
        Path = 'src\app\api\admin\marketing\test-email\route.js'
        Nombre = 'test-email'
        HandlerStart = 'async function handleTestEmail(req) {'
    },
    @{
        Path = 'src\app\api\resend-webhook\route.js'
        Nombre = 'resend-webhook'
        HandlerStart = 'export async function POST(req) {'
    }
)

$totalModificados = 0

foreach ($a in $archivos) {
    Write-Host "`n=== $($a.Nombre) ===" -ForegroundColor Cyan
    $path = $a.Path
    if (-not (Test-Path $path)) {
        Write-Warn "No existe $path"
        continue
    }

    $contenido = Get-Content $path -Raw -Encoding UTF8
    $original = $contenido

    # Detectar si ya esta el fix (idempotente)
    if ($contenido -match 'function getSupabaseAdmin\(\)') {
        Write-Info "Ya tiene getSupabaseAdmin() (idempotente)"
        continue
    }

    # Patron 1: bloque top-level con createClient (sin auth)
    $patronTopLevel = @'
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
'@

    # Patron 2: bloque top-level con createClient (con auth)
    $patronTopLevelConAuth = @'
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)
'@

    # Reemplazo: funcion getSupabaseAdmin()
    $reemplazo = @'
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
'@

    # Normalizar line endings para el match
    $contNorm = $contenido -replace "`r`n", "`n"
    $patronNorm = $patronTopLevel -replace "`r`n", "`n"
    $patronAuthNorm = $patronTopLevelConAuth -replace "`r`n", "`n"
    $reemplazoNorm = $reemplazo -replace "`r`n", "`n"

    $reemplazoOk = $false
    if ($contNorm.Contains($patronAuthNorm)) {
        $contNorm = $contNorm.Replace($patronAuthNorm, $reemplazoNorm)
        Write-Ok "Bloque top-level reemplazado (patron con auth) -> getSupabaseAdmin()"
        $reemplazoOk = $true
    } elseif ($contNorm.Contains($patronNorm)) {
        $contNorm = $contNorm.Replace($patronNorm, $reemplazoNorm)
        Write-Ok "Bloque top-level reemplazado (patron sin auth) -> getSupabaseAdmin()"
        $reemplazoOk = $true
    } else {
        Write-Warn "No matcheo el bloque top-level. Revisar $path manualmente."
        continue
    }

    # Agregar const supabaseAdmin = getSupabaseAdmin() al inicio del handler
    if ($reemplazoOk) {
        $handlerNorm = $a.HandlerStart -replace "`r`n", "`n"
        if ($contNorm.Contains($handlerNorm)) {
            $nuevoHandler = $handlerNorm + "`n  const supabaseAdmin = getSupabaseAdmin()"
            $contNorm = $contNorm.Replace($handlerNorm, $nuevoHandler)
            Write-Ok "Agregado 'const supabaseAdmin = getSupabaseAdmin()' al inicio del handler"
        } else {
            Write-Warn "No matcheo el inicio del handler: $($a.HandlerStart)"
        }
    }

    # Volver a line ending original
    $contenido = $contNorm -replace "`n", "`r`n"

    if ($contenido -ne $original) {
        [System.IO.File]::WriteAllText(
            (Resolve-Path $path).Path,
            $contenido,
            [System.Text.UTF8Encoding]::new($false)
        )
        Write-Ok "Modificado"
        $totalModificados++
    } else {
        Write-Info "Sin cambios"
    }
}

# ------------------------------------------------------------
# Verificacion
# ------------------------------------------------------------
Write-Host "`n=== Verificacion ===" -ForegroundColor Cyan
foreach ($a in $archivos) {
    $path = $a.Path
    if (Test-Path $path) {
        $c = Get-Content $path -Raw -Encoding UTF8
        if ($c -match 'function getSupabaseAdmin\(\)') {
            Write-Ok "$($a.Nombre): getSupabaseAdmin() presente"
        } else {
            Write-Warn "$($a.Nombre): FALTA getSupabaseAdmin()"
        }
        $matches = [regex]::Matches($c, '(?m)^const supabaseAdmin = createClient')
        if ($matches.Count -gt 0) {
            Write-Warn "$($a.Nombre): AUN hay createClient top-level ($($matches.Count))"
        } else {
            Write-Ok "$($a.Nombre): sin createClient top-level"
        }
        if ($c -match 'const supabaseAdmin = getSupabaseAdmin\(\)') {
            Write-Ok "$($a.Nombre): const supabaseAdmin = getSupabaseAdmin() presente en handler"
        } else {
            Write-Warn "$($a.Nombre): FALTA const supabaseAdmin = getSupabaseAdmin() en handler"
        }
    }
}

# ------------------------------------------------------------
# Crear doc de auditoria (con array de strings, NO here-string)
# ------------------------------------------------------------
Write-Host "`n=== Doc de auditoria ===" -ForegroundColor Cyan
$docDir = 'docs\audits\2026-10-13-inicial'
$docPath = "$docDir\42-bug-013-supabase-toplevel.md"

if (-not (Test-Path $docDir)) {
    Write-Warn "No existe $docDir"
} elseif (Test-Path $docPath) {
    Write-Info "Doc ya existe: $docPath"
} else {
    $lineas = @(
        '# BUG-013 - createClient en top-level rompe build en CI',
        '',
        '**Fecha:** 2026-10-17 (S25)',
        '**Hallazgo:** BUG-013 (nuevo)',
        '**Severidad:** Media (P2) - rompe CI, no produccion',
        '**Estado:** Cerrado',
        '**Sesion:** 25',
        '',
        '---',
        '',
        '## 1. Sintoma',
        '',
        'El CI de GitHub Actions fallaba en el step `Build` con:',
        '',
        '```',
        'Error: supabaseKey is required.',
        '    at new sg (.../chunks/7495.js:24:62616)',
        '    at 19621 (.../.next/server/app/api/admin/marketing/test-email/route.js:1:571)',
        '> Build error occurred',
        'Error: Failed to collect page data for /api/admin/marketing/test-email',
        '```',
        '',
        '**Detectado en:** S25, al activar el build en CI por primera vez',
        '(antes fallaba en `Test` por TST-001).',
        '',
        '## 2. Causa raiz',
        '',
        '`src/app/api/admin/marketing/test-email/route.js` y',
        '`src/app/api/resend-webhook/route.js` instancian `createClient()`',
        'en **top-level** (al importar el modulo):',
        '',
        '```js',
        'const supabaseAdmin = createClient(',
        '  process.env.NEXT_PUBLIC_SUPABASE_URL,',
        '  process.env.SUPABASE_SERVICE_ROLE_KEY',
        ')',
        '```',
        '',
        'En **build time**, Next.js "Collecting page data" importa los modulos',
        'para analizarlos. Eso ejecuta `createClient()` con',
        '`process.env.SUPABASE_SERVICE_ROLE_KEY` **undefined** (no esta en CI,',
        'porque `SUPABASE_SERVICE_ROLE_KEY` es secreta y no debe estar en',
        'GitHub Secrets). Resultado: `supabaseKey is required` y el build falla.',
        '',
        'En **runtime** (Vercel), funciona porque `SUPABASE_SERVICE_ROLE_KEY`',
        'esta configurada en Vercel env vars.',
        '',
        '`send-email/route.js` no rompe porque tiene fallback a',
        '`NEXT_PUBLIC_SUPABASE_ANON_KEY`, que si esta en el `env:` del step',
        '`Build` en CI (placeholder).',
        '',
        '## 3. Fix aplicado',
        '',
        'Mover `createClient()` **dentro de una funcion** `getSupabaseAdmin()`,',
        'que se ejecuta **solo en runtime**, no en build:',
        '',
        '```js',
        'function getSupabaseAdmin() {',
        '  return createClient(',
        '    process.env.NEXT_PUBLIC_SUPABASE_URL,',
        '    process.env.SUPABASE_SERVICE_ROLE_KEY,',
        '    {',
        '      auth: {',
        '        persistSession: false,',
        '        autoRefreshToken: false,',
        '      },',
        '    }',
        '  )',
        '}',
        '',
        'export async function POST(req) {',
        '  const supabaseAdmin = getSupabaseAdmin()',
        '  // ...',
        '}',
        '```',
        '',
        '**Por que funciona:**',
        '- En build, Next.js solo importa el modulo (sin side effects).',
        '- En runtime, cuando llega el request, `getSupabaseAdmin()` se ejecuta',
        '  con las env vars reales de Vercel.',
        '- En CI, el build pasa porque `createClient` no se ejecuta.',
        '',
        '## 4. Archivos modificados',
        '',
        '- `src/app/api/admin/marketing/test-email/route.js`',
        '- `src/app/api/resend-webhook/route.js`',
        '',
        '`send-email/route.js` **no se toca** (ya tiene el patron correcto',
        'con fallback).',
        '',
        '## 5. Verificacion',
        '',
        '- [ ] `npm run build` pasa localmente (sin `.env.local`)',
        '- [ ] CI pasa en GitHub Actions (step `Build`)',
        '- [ ] `test-email` funciona en produccion (Vercel)',
        '- [ ] `resend-webhook` funciona en produccion (Vercel)',
        '',
        '## 6. Relacion con F4-06',
        '',
        '**F4-06 (placeholders en ci.yml) sigue OK.** Los placeholders',
        '`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estan',
        'bien puestos en el step `Build`. El error **no es por los placeholders**,',
        'es por `test-email` y `resend-webhook` que instancian el cliente en',
        'top-level.',
        '',
        'BUG-013 se detecto al activar el build en CI. Se cierra con este fix.',
        '',
        '## 7. Referencias',
        '',
        '- Commit: (se agrega al commitear)',
        '- CI run: https://github.com/PanFree-Tech/panfree-system/actions/runs/39029347656',
        '- F4-06: docs/operations/PLAN-DE-TRABAJO.md',
        '- `src/lib/supabase.js` (fail-fast de F3-02)'
    )
    $doc = $lineas -join "`r`n"
    [System.IO.File]::WriteAllText(
        (Join-Path $repoRoot $docPath),
        $doc,
        [System.Text.UTF8Encoding]::new($false)
    )
    Write-Ok "Doc creado: $docPath"
}

# ------------------------------------------------------------
# Diff y commit
# ------------------------------------------------------------
Write-Host "`n=== Git diff --stat ===" -ForegroundColor Cyan
git diff --stat

if ($NoCommit) {
    Write-Info "`nModo -NoCommit: no se commitea."
} else {
    Write-Host "`n=== Commit ===" -ForegroundColor Cyan
    foreach ($a in $archivos) { git add $a.Path }
    if (Test-Path $docPath) { git add $docPath }
    git commit -m "fix(ci): mover createClient a runtime en test-email y resend-webhook (BUG-013)"
    if ($LASTEXITCODE -eq 0) { Write-Ok "Commit creado." } else { Write-Warn "Commit fallo." }
}

Write-Host "`n[FIN] Script 90 completado." -ForegroundColor Green