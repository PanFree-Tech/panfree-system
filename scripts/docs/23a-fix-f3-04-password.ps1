# PowerShell
# =============================================================================
# 23a - FIX F3-04 / AUTH-001: validar fortaleza de password
# =============================================================================
# Fecha: 2026-10-14
# Sesion: 11
# Hallazgo: AUTH-001
#
# Aplica validacion fuerte de password en 3 archivos consumidores:
#   - src/app/register/page.js       (registro principal, alias @/)
#   - src/components/AuthModal.js    (modal de registro, path ../lib/)
#   - src/app/perfil/page.js         (cambio de password, path ../../lib/)
#
# El modulo src/lib/validar-password.js YA EXISTE (creado aparte).
#
# Uso:
#   .\scripts\docs\23a-fix-f3-04-password.ps1           # DRY RUN
#   .\scripts\docs\23a-fix-f3-04-password.ps1 -Commit   # COMMIT + PUSH
# =============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $repoRoot

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

Write-Host ''
Write-Host ('=' * 70) -ForegroundColor Magenta
Write-Host '  23a - FIX F3-04 / AUTH-001: validar fortaleza de password' -ForegroundColor Magenta
Write-Host ('=' * 70) -ForegroundColor Magenta
Write-Host ("  Repo: " + $repoRoot)
if ($Commit) {
    Write-Host '  Modo: COMMIT + PUSH' -ForegroundColor Yellow
} else {
    Write-Host '  Modo: DRY RUN (sin commit)' -ForegroundColor Yellow
}
Write-Host ''

# -----------------------------------------------------------------------------
Write-Host '[1/6] Verificando prerequisitos...' -ForegroundColor Cyan

$modulo     = Join-Path $repoRoot 'src\lib\validar-password.js'
$registerJs = Join-Path $repoRoot 'src\app\register\page.js'
$authModal  = Join-Path $repoRoot 'src\components\AuthModal.js'
$perfilJs   = Join-Path $repoRoot 'src\app\perfil\page.js'

$faltantes = @()
foreach ($p in @($modulo, $registerJs, $authModal, $perfilJs)) {
    if (-not (Test-Path $p)) { $faltantes += $p }
}
if ($faltantes.Count -gt 0) {
    Write-Host '  ERROR: faltan archivos:' -ForegroundColor Red
    $faltantes | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    exit 1
}
Write-Host '  OK: todos los archivos existen.'

# -----------------------------------------------------------------------------
Write-Host ''
Write-Host '[2/6] Creando backup...' -ForegroundColor Cyan

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupRoot = Join-Path $env:TEMP "panfree-f3-04-backup\$stamp"
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

foreach ($p in @($registerJs, $authModal, $perfilJs)) {
    $rel = $p.Substring($repoRoot.Length).TrimStart('\')
    $dst = Join-Path $backupRoot ($rel -replace '\\', '__')
    Copy-Item -Path $p -Destination $dst -Force
}
Write-Host ("  OK: backup en " + $backupRoot)

# -----------------------------------------------------------------------------
Write-Host ''
Write-Host '[3/6] Aplicando cambios en src/app/register/page.js...' -ForegroundColor Cyan

$src = [System.IO.File]::ReadAllText($registerJs)
$orig = $src
$cambios = 0

# 3.1 Import del modulo (register usa alias @/)
if ($src -notmatch "validar-password") {
    $antesReemplazo = $src
    $src = $src -replace "(import \{ supabase \} from '@/lib/supabase')",
                         "`$1`r`nimport { validarPassword, PASSWORD_MIN_LENGTH } from '@/lib/validar-password'"
    if ($src -ne $antesReemplazo) { $cambios++ }
}

# 3.2 Reemplazar validacion vieja (length < 6) por la nueva
$patronRegex = '(?s)    if \(password\.length < 6\) \{\s*\r?\n      setError\(''La contrase[^'']*a debe tener al menos 6 caracteres''\)\s*\r?\n      return\s*\r?\n    \}'
$nuevo = @'
    const validacion = validarPassword(password)
    if (!validacion.ok) {
      setError('La contraseña no es suficientemente fuerte. Faltan: ' + validacion.errores.join(', ') + '.')
      return
    }
'@ -replace "`r`n", "`n"

$antesReemplazo = $src
$src = [regex]::Replace($src, $patronRegex, $nuevo)
if ($src -ne $antesReemplazo) { $cambios++ }

# 3.3 minLength={6} -> minLength={PASSWORD_MIN_LENGTH}
$antesReemplazo = $src
$src = $src -replace 'minLength=\{6\}', 'minLength={PASSWORD_MIN_LENGTH}'
if ($src -ne $antesReemplazo) { $cambios++ }

# 3.4 placeholder "minimo 6 caracteres" -> "minimo 10"
$antesReemplazo = $src
$src = $src -replace '\(m[^)]*nimo 6 caracteres\)', '(minimo 10 chars, mayuscula, numero, simbolo)'
if ($src -ne $antesReemplazo) { $cambios++ }

if ($src -ne $orig) {
    if (-not $Commit) {
        Write-Host ("  [DRY] se aplicarian {0} cambios" -f $cambios)
    } else {
        [System.IO.File]::WriteAllText($registerJs, $src, $utf8NoBom)
        Write-Host ("  OK: {0} cambios aplicados." -f $cambios)
    }
} else {
    Write-Host '  INFO: sin cambios (idempotente).'
}

# -----------------------------------------------------------------------------
Write-Host ''
Write-Host '[4/6] Aplicando cambios en src/components/AuthModal.js...' -ForegroundColor Cyan

$src = [System.IO.File]::ReadAllText($authModal)
$orig = $src
$cambios = 0

# 4.1 Import del modulo (AuthModal usa path relativo '../lib/')
if ($src -notmatch "validar-password") {
    $antesReemplazo = $src
    $src = $src -replace "(import \{ supabase \} from '\.\./lib/supabase-client')",
                         "`$1`r`nimport { validarPassword } from '../lib/validar-password'"
    if ($src -ne $antesReemplazo) { $cambios++ }
}

# 4.2 Insertar validacion al inicio de manejarRegistro
$patronManejarRegistro = '(?s)(async function manejarRegistro\(e\) \{\s*\r?\n    e\.preventDefault\(\)\s*\r?\n)'
$reemplazoManejarRegistro = @'
$1    const validacion = validarPassword(password)
    if (!validacion.ok) {
      setError('La contraseña no es suficientemente fuerte. Faltan: ' + validacion.errores.join(', ') + '.')
      return
    }
'@ -replace "`r`n", "`n"

$antesReemplazo = $src
$src = [regex]::Replace($src, $patronManejarRegistro, $reemplazoManejarRegistro, 1)
if ($src -ne $antesReemplazo) { $cambios++ }

# 4.3 Actualizar mensaje en traducirError
$antesReemplazo = $src
$src = $src -replace "La contrase[^']*a debe tener al menos 6 caracteres\.", "La contraseña no cumple los requisitos minimos de seguridad."
if ($src -ne $antesReemplazo) { $cambios++ }

if ($src -ne $orig) {
    if (-not $Commit) {
        Write-Host ("  [DRY] se aplicarian {0} cambios" -f $cambios)
    } else {
        [System.IO.File]::WriteAllText($authModal, $src, $utf8NoBom)
        Write-Host ("  OK: {0} cambios aplicados." -f $cambios)
    }
} else {
    Write-Host '  INFO: sin cambios (idempotente).'
}

# -----------------------------------------------------------------------------
Write-Host ''
Write-Host '[5/6] Aplicando cambios en src/app/perfil/page.js...' -ForegroundColor Cyan

$src = [System.IO.File]::ReadAllText($perfilJs)
$orig = $src
$cambios = 0

# 5.1 Import del modulo (perfil usa path relativo '../../lib/')
if ($src -notmatch "validar-password") {
    $antesReemplazo = $src
    $src = $src -replace "(import \{ supabase \} from '\.\./\.\./lib/supabase')",
                         "`$1`r`nimport { validarPassword } from '../../lib/validar-password'"
    if ($src -ne $antesReemplazo) { $cambios++ }
}

# 5.2 Reemplazar la validacion de cambiarPassword
$antesReemplazo = $src
$src = $src -replace "if \(passNueva\.length < 6\) return setMensajePass\(\{ tipo: 'err', texto: 'M[^']*nimo 6 caracteres\.' \}\)",
                     "const validacion = validarPassword(passNueva)`r`n    if (!validacion.ok) return setMensajePass({ tipo: 'err', texto: 'La contraseña no es suficientemente fuerte. Faltan: ' + validacion.errores.join(', ') + '.' })"
if ($src -ne $antesReemplazo) { $cambios++ }

if ($src -ne $orig) {
    if (-not $Commit) {
        Write-Host ("  [DRY] se aplicarian {0} cambios" -f $cambios)
    } else {
        [System.IO.File]::WriteAllText($perfilJs, $src, $utf8NoBom)
        Write-Host ("  OK: {0} cambios aplicados." -f $cambios)
    }
} else {
    Write-Host '  INFO: sin cambios (idempotente).'
}

# -----------------------------------------------------------------------------
Write-Host ''
Write-Host '[6/6] Verificacion final...' -ForegroundColor Cyan

Write-Host ''
Write-Host '  --- grep de validar-password en src/ ---' -ForegroundColor Cyan
$grep = Get-ChildItem -Path 'src' -Recurse -File -Include *.js,*.jsx |
    Select-String -Pattern 'validar-password'
if ($grep) {
    $grep | ForEach-Object {
        Write-Host ("    " + $_.Path.Replace($repoRoot, '') + ":" + $_.LineNumber)
    }
}

Write-Host ''
Write-Host '  --- git diff --stat ---' -ForegroundColor Cyan
git diff --stat

Write-Host ''
Write-Host '  --- git status --short ---' -ForegroundColor Cyan
git status --short

# -----------------------------------------------------------------------------
if ($Commit) {
    Write-Host ''
    Write-Host ('=' * 70) -ForegroundColor Magenta
    Write-Host '  Commit + push' -ForegroundColor Magenta
    Write-Host ('=' * 70) -ForegroundColor Magenta

    git add 'src/lib/validar-password.js'
    git add 'src/app/register/page.js'
    git add 'src/components/AuthModal.js'
    git add 'src/app/perfil/page.js'

    git commit -m "security(auth): validar fortaleza de password en registro y cambio (AUTH-001, F3-04)"
    Write-Host '  OK: commit creado.' -ForegroundColor Green

    git push origin main
    Write-Host '  OK: push completado.' -ForegroundColor Green

    Write-Host ''
    Write-Host '  git log --oneline -3:'
    git log --oneline -3
} else {
    Write-Host ''
    Write-Host ('=' * 70) -ForegroundColor Magenta
    Write-Host '  FIN (DRY RUN)' -ForegroundColor Magenta
    Write-Host ('=' * 70) -ForegroundColor Magenta
    Write-Host ''
    Write-Host '  Si todo OK:' -ForegroundColor Yellow
    Write-Host '    .\scripts\docs\23a-fix-f3-04-password.ps1 -Commit' -ForegroundColor Yellow
    Write-Host ''
    Write-Host ("  Backup en: " + $backupRoot) -ForegroundColor Yellow
}

Write-Host ''