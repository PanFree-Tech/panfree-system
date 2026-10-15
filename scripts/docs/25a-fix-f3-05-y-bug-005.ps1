# 25a-fix-f3-05-y-bug-005.ps1
# F3-05 (AUTH-002) + BUG-005: evitar duplicados en registro y alinear AuthModal.
# Uso:
#   .\25a-fix-f3-05-y-bug-005.ps1            -> dry run (muestra diff, no commitea)
#   .\25a-fix-f3-05-y-bug-005.ps1 -Commit    -> aplica + commit + push

param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $repoRoot
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

Write-Host ''
Write-Host ('=' * 70) -ForegroundColor Magenta
Write-Host '  25a - Fix F3-05 (AUTH-002) + BUG-005' -ForegroundColor Magenta
Write-Host '  Evitar duplicados en clientes + alinear INSERT de AuthModal' -ForegroundColor Magenta
Write-Host ('=' * 70) -ForegroundColor Magenta
Write-Host ''
Write-Host ("  Modo: " + $(if ($Commit) { 'APLICAR + COMMIT + PUSH' } else { 'DRY RUN' })) -ForegroundColor Yellow
Write-Host ''

# =============================================================================
# 1. Helpers
# =============================================================================

function Leer-Archivo($path) {
    return [System.IO.File]::ReadAllText((Join-Path $repoRoot $path))
}

function Guardar-Archivo($path, $contenido) {
    [System.IO.File]::WriteAllText((Join-Path $repoRoot $path), $contenido, $utf8NoBom)
}

function Replace-Literal($texto, $patron, $reemplazo) {
    # Reemplazo literal (no regex) para evitar problemas con ( ) [ ] en JS.
    return $texto.Replace($patron, $reemplazo)
}

# =============================================================================
# 2. Definicion de cambios
# =============================================================================

$archivoRegister  = 'src\app\register\page.js'
$archivoAuthModal = 'src\components\AuthModal.js'
$archivoCallback  = 'src\app\auth\callback\route.js'

# -----------------------------------------------------------------------------
# 2.1 register/page.js
# -----------------------------------------------------------------------------
$antesRegister = @(
    '        const { error: insertError } = await supabase.from(''clientes'').insert({',
    '          user_id: data.user.id,',
    '          email: email,',
    '          nombre_completo: nombre,',
    '        })'
) -join "`r`n"

$despuesRegister = @(
    '        const { error: insertError } = await supabase.from(''clientes'').upsert({',
    '          user_id: data.user.id,',
    '          email: email,',
    '          nombre_completo: nombre,',
    '        }, { onConflict: ''email'' })'
) -join "`r`n"

# -----------------------------------------------------------------------------
# 2.2 AuthModal.js (fix + BUG-005)
# -----------------------------------------------------------------------------
$antesAuthModal = @(
    '        await supabase.from(''clientes'').insert({',
    '          nombre_completo: nombre,',
    '          email,',
    '          user_id: data.user.id,',
    '          is_active: true,',
    '          role: ''cliente''',
    '        })'
) -join "`r`n"

$despuesAuthModal = @(
    '        await supabase.from(''clientes'').upsert({',
    '          nombre_completo: nombre,',
    '          email,',
    '          user_id: data.user.id,',
    '        }, { onConflict: ''email'' })'
) -join "`r`n"

# -----------------------------------------------------------------------------
# 2.3 callback/route.js (quitar SELECT previo + upsert)
# -----------------------------------------------------------------------------
$antesCallback = @(
    '      // \u2705 Crear o actualizar perfil en la tabla clientes',
    '      try {',
    '        const { data: existing } = await supabase',
    '          .from(''clientes'')',
    '          .select(''id'')',
    '          .eq(''user_id'', user.id)',
    '          .limit(1)',
    '',
    '        if (!existing || existing.length === 0) {',
    '          const nombre =',
    '            user.user_metadata?.full_name ||',
    '            user.user_metadata?.name ||',
    '            (user.email ? user.email.split(''@'')[0] : ''Cliente'')',
    '          const avatarUrl =',
    '            user.user_metadata?.avatar_url ||',
    '            user.user_metadata?.picture ||',
    '            null',
    '',
    '          // F3-01 fix: solo columnas permitidas por GRANT INSERT en public.clientes.',
    '          // role, is_active, puntos_fidelidad, nivel_cliente \u2192 DEFAULT (ver migraci\u00f3n',
    '          // supabase/migrations/2026-10-13-f3-01-admin-app-metadata.sql).',
    '          // BUG-002 fix: la columna real es avatar_url (no avatar).',
    '          await supabase.from(''clientes'').insert({',
    '            nombre_completo: nombre,',
    '            email: user.email,',
    '            user_id: user.id,',
    '            avatar_url: avatarUrl,',
    '          })',
    '        }',
    '      } catch (profileErr) {',
    '        console.error(''Error al registrar perfil de cliente:'', profileErr)',
    '      }'
) -join "`r`n"

$despuesCallback = @(
    '      // F3-05 fix: upsert con onConflict=email elimina el SELECT previo',
    '      // (una query menos por login OAuth) y es idempotente ante race conditions.',
    '      try {',
    '        const nombre =',
    '          user.user_metadata?.full_name ||',
    '          user.user_metadata?.name ||',
    '          (user.email ? user.email.split(''@'')[0] : ''Cliente'')',
    '        const avatarUrl =',
    '          user.user_metadata?.avatar_url ||',
    '          user.user_metadata?.picture ||',
    '          null',
    '',
    '        // F3-01 fix: solo columnas permitidas por GRANT INSERT en public.clientes.',
    '        // role, is_active, puntos_fidelidad, nivel_cliente \u2192 DEFAULT (ver migraci\u00f3n',
    '        // supabase/migrations/2026-10-13-f3-01-admin-app-metadata.sql).',
    '        // BUG-002 fix: la columna real es avatar_url (no avatar).',
    '        await supabase.from(''clientes'').upsert({',
    '          nombre_completo: nombre,',
    '          email: user.email,',
    '          user_id: user.id,',
    '          avatar_url: avatarUrl,',
    '        }, { onConflict: ''email'' })',
    '      } catch (profileErr) {',
    '        console.error(''Error al registrar perfil de cliente:'', profileErr)',
    '      }'
) -join "`r`n"

# =============================================================================
# 3. Aplicacion de cambios
# =============================================================================

$cambios = @(
    @{ Nombre = 'register/page.js';  Path = $archivoRegister;  Antes = $antesRegister;  Despues = $despuesRegister },
    @{ Nombre = 'AuthModal.js';      Path = $archivoAuthModal; Antes = $antesAuthModal; Despues = $despuesAuthModal },
    @{ Nombre = 'callback/route.js'; Path = $archivoCallback;  Antes = $antesCallback;  Despues = $despuesCallback }
)

$resultados = @()

foreach ($c in $cambios) {
    Write-Host ("  Procesando: " + $c.Nombre) -ForegroundColor Cyan
    $contenido = Leer-Archivo $c.Path

    if ($contenido.Contains($c.Despues)) {
        Write-Host '    INFO: ya aplicado (idempotente). Se omite.' -ForegroundColor Yellow
        $resultados += [PSCustomObject]@{ Archivo = $c.Nombre; Estado = 'ya aplicado' }
        continue
    }

    if (-not $contenido.Contains($c.Antes)) {
        Write-Host '    ERROR: no se encontro el patron esperado. Archivo sin cambios.' -ForegroundColor Red
        $resultados += [PSCustomObject]@{ Archivo = $c.Nombre; Estado = 'patron no encontrado' }
        continue
    }

    $nuevo = $contenido.Replace($c.Antes, $c.Despues)
    Guardar-Archivo $c.Path $nuevo
    Write-Host '    OK: cambio aplicado.' -ForegroundColor Green
    $resultados += [PSCustomObject]@{ Archivo = $c.Nombre; Estado = 'aplicado' }
}

Write-Host ''
Write-Host '  --- Resumen ---' -ForegroundColor Cyan
$resultados | Format-Table -AutoSize

# =============================================================================
# 4. Verificacion post-cambio
# =============================================================================

Write-Host '  --- Verificacion ---' -ForegroundColor Cyan

Write-Host '  upsert con onConflict en los 3 archivos:' -ForegroundColor Yellow
Get-ChildItem -Path src -Recurse -File -Include *.js |
    Select-String -Pattern "onConflict: 'email'" |
    Select-Object Path, LineNumber | Format-Table -AutoSize

Write-Host '  AuthModal ya no debe tener is_active: true ni role: cliente:' -ForegroundColor Yellow
$authModalContenido = Leer-Archivo $archivoAuthModal
$tieneIsActive = $authModalContenido.Contains('is_active: true')
$tieneRoleCliente = $authModalContenido.Contains("role: 'cliente'")
Write-Host ("    is_active: true presente? " + $tieneIsActive)
Write-Host ("    role: ''cliente'' presente? " + $tieneRoleCliente)

# =============================================================================
# 5. Git diff
# =============================================================================

Write-Host ''
Write-Host '  --- git diff --stat ---' -ForegroundColor Cyan
git diff --stat

# =============================================================================
# 6. Commit (opcional)
# =============================================================================

if ($Commit) {
    Write-Host ''
    Write-Host '  Aplicando commit...' -ForegroundColor Yellow

    $msg = @(
        'security(auth): evitar duplicados en registro y alinear AuthModal',
        '',
        "- AUTH-002 / F3-05: upsert con onConflict='email' en los 3 puntos.",
        '- BUG-005: quitar is_active y role del INSERT de AuthModal',
        '  (post-F3-01 authenticated no tiene GRANT para esas columnas).'
    ) -join "`n"

    git add $archivoRegister
    git add $archivoAuthModal
    git add $archivoCallback

    git commit -m $msg
    Write-Host '  OK: commit creado.' -ForegroundColor Green

    git push origin main
    Write-Host '  OK: push completado.' -ForegroundColor Green

    Write-Host ''
    Write-Host '  --- git log --oneline -3 ---' -ForegroundColor Cyan
    git log --oneline -3

    Write-Host ''
    Write-Host '  --- git status --short ---' -ForegroundColor Cyan
    git status --short
} else {
    Write-Host ''
    Write-Host '  DRY RUN: no se commiteo nada.' -ForegroundColor Yellow
    Write-Host '  Revisar el diff de arriba. Si esta OK, correr:' -ForegroundColor Yellow
    Write-Host '    .\scripts\docs\25a-fix-f3-05-y-bug-005.ps1 -Commit' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Siguiente: 25b-documentar-f3-05-bug-005.ps1' -ForegroundColor Yellow
Write-Host ''