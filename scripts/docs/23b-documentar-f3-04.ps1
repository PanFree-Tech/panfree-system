# PowerShell
# =============================================================================
# 23b - Documentar cierre F3-04 / AUTH-001
# =============================================================================
# Fecha: 2026-10-14
# Sesion: 11
# Hallazgo: AUTH-001 (contrasenas debiles)
# Commit del fix: ccee0c88
# Commit correctivo: f1675f19 (linea pegada en AuthModal)
#
# Uso:
#   .\scripts\docs\23b-documentar-f3-04.ps1           # DRY RUN
#   .\scripts\docs\23b-documentar-f3-04.ps1 -Commit   # COMMIT + PUSH
#
# Reglas:
#   - Idempotente: correr multiples veces no rompe nada.
#   - ASCII puro en el .ps1.
#   - UTF-8 sin BOM en los archivos .md generados.
# =============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $repoRoot

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
    return [System.IO.File]::ReadAllText((Join-Path $repoRoot $p))
}
function Write-File($p, $content) {
    $full = Join-Path $repoRoot $p
    [System.IO.File]::WriteAllText($full, $content, $utf8NoBom)
}

# -----------------------------------------------------------------------------
Write-Section "23b - Documentar cierre F3-04 / AUTH-001"
Write-Host ("  Repo: " + $repoRoot)
if ($Commit) {
    Write-Host '  Modo: COMMIT + PUSH' -ForegroundColor Yellow
} else {
    Write-Host '  Modo: DRY RUN (sin commit)' -ForegroundColor Yellow
}

# -----------------------------------------------------------------------------
Write-Step "1/8" "Verificando prerequisitos..."

$trackingPath = 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$statusPath   = 'docs\STATUS.md'
$planPath     = 'docs\operations\PLAN-DE-TRABAJO.md'
$docPath      = 'docs\audits\2026-10-13-inicial\20-f3-04-auth-001-password.md'
$verLinksPath = 'scripts\docs\00-verificar-links.ps1'

$faltantes = @()
foreach ($p in @($trackingPath, $statusPath, $planPath)) {
    if (-not (Test-Path (Join-Path $repoRoot $p))) { $faltantes += $p }
}
if ($faltantes.Count -gt 0) {
    Write-ERR "faltan archivos:"
    $faltantes | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    exit 1
}
Write-OK "todos los archivos base existen."

# -----------------------------------------------------------------------------
Write-Step "2/8" "Creando doc de auditoria 20-f3-04-auth-001-password.md..."

$docNuevo = @'
# F3-04 / AUTH-001 - Validacion de fortaleza de password

**Fecha:** 2026-10-14
**Hallazgo:** AUTH-001
**Tarea:** F3-04
**Severidad:** Alta (contrasenas debiles permitidas)
**Estado:** Cerrado
**Esfuerzo:** S (Small)

---

## 1. Contexto

Durante la auditoria inicial (2026-10-13) se detecto que el sistema permitia
contrasenas debiles en 3 puntos de entrada:

- `src/app/register/page.js` - validacion de solo 6 caracteres.
- `src/components/AuthModal.js` - sin validacion previa al signUp.
- `src/app/perfil/page.js` (cambio de password) - validacion de solo 6 caracteres.

Se registro como **AUTH-001** (Alta). Una contrasena de 6 caracteres en
minusculas es trivial de romper por fuerza bruta o diccionario.

Referencia: [ADR-002](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)
establece que la validacion de entrada es responsabilidad de la capa de
aplicacion. La politica de complejidad de Supabase Auth es defensa en
profundidad adicional.

---

## 2. Diagnostico

### 2.1 Puntos de entrada con password

| # | Archivo | Funcion | Validacion previa |
|---|---|---|---|
| 1 | `src/app/register/page.js` | `handleRegister` | `password.length < 6` |
| 2 | `src/components/AuthModal.js` | `manejarRegistro` | ninguna |
| 3 | `src/app/perfil/page.js` | `cambiarPassword` | `passNueva.length < 6` |

### 2.2 Por que es Alta severidad

- **6 caracteres es insuficiente.** Una password de 6 minusculas tiene
  ~308 millones de combinaciones, rompible en minutos con hardware moderno.
- **Sin requisitos de complejidad.** No se exige mayuscula, numero ni simbolo.
- **Sin validacion previa en AuthModal.** Dependia exclusivamente de la
  politica de Supabase Auth (que en plan Free puede no estar endurecida).
- **Sin consistencia entre los 3 flujos.** Cada uno validaba distinto.

---

## 3. Fix aplicado

### 3.1 Modulo centralizado: src/lib/validar-password.js

Se creo un modulo con la logica de validacion en un solo lugar:

```js
export const PASSWORD_MIN_LENGTH = 10

export const PASSWORD_REGLAS = [
  { id: 'length',   test: (pwd) => pwd.length >= PASSWORD_MIN_LENGTH, mensaje: 'Al menos 10 caracteres' },
  { id: 'mayuscula', test: (pwd) => /[A-Z]/.test(pwd), mensaje: 'Al menos una letra mayuscula (A-Z)' },
  { id: 'minuscula', test: (pwd) => /[a-z]/.test(pwd), mensaje: 'Al menos una letra minuscula (a-z)' },
  { id: 'numero',    test: (pwd) => /[0-9]/.test(pwd), mensaje: 'Al menos un numero (0-9)' },
  { id: 'simbolo',   test: (pwd) => /[^A-Za-z0-9]/.test(pwd), mensaje: 'Al menos un simbolo (!@#$%^&*...)' },
]

export function validarPassword(pwd) {
  const texto = typeof pwd === 'string' ? pwd : ''
  const reglas = PASSWORD_REGLAS.map((r) => ({ id: r.id, ok: r.test(texto), mensaje: r.mensaje }))
  const errores = reglas.filter((r) => !r.ok).map((r) => r.mensaje)
  return { ok: errores.length === 0, errores, reglas }
}

export function passwordEsValida(pwd) {
  return validarPassword(pwd).ok
}