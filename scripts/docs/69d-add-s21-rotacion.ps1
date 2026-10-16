# ============================================================================
# 69d-add-s21-rotacion.ps1
# ----------------------------------------------------------------------------
# Agrega la seccion "Estado de Bitwarden al cierre de S21" al final de
# docs/operations/ROTACION-CLAVES.md.
#
# S21 no roto claves. La seccion documenta ese hecho + deudas pendientes.
#
# Idempotente: si la seccion S21 ya existe, no duplica.
# Dry run por defecto. -Aplicar escribe.
# Verificacion post-write obligatoria.
# ============================================================================

param(
    [switch]$Aplicar
)

$ErrorActionPreference = 'Stop'

$repoRoot  = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$rotFile   = Join-Path $repoRoot 'docs\operations\ROTACION-CLAVES.md'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 69d - Agregar seccion S21 a ROTACION-CLAVES (S22)' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

$modo = if ($Aplicar) { 'APLICAR' } else { 'DRY RUN' }
Write-Host "Modo: $modo" -ForegroundColor Yellow
Write-Host ''

if (-not (Test-Path -LiteralPath $rotFile)) {
    Write-Host "[ERROR] No existe: $rotFile" -ForegroundColor Red
    exit 1
}

$contenido = [System.IO.File]::ReadAllText($rotFile)

# --- Pre-condiciones --------------------------------------------------------

$tieneS20 = $contenido.Contains('## Estado de Bitwarden al cierre de S20')
$tieneS21 = $contenido.Contains('## Estado de Bitwarden al cierre de S21')

Write-Host '--- Pre-condiciones ---' -ForegroundColor Cyan
Write-Host "  Contiene S20?    $tieneS20"
Write-Host "  Contiene S21?    $tieneS21"
Write-Host ""

if (-not $tieneS20) {
    Write-Host '[ERROR] No se encontro la seccion S20. Abortando.' -ForegroundColor Red
    exit 1
}

if ($tieneS21) {
    Write-Host '[INFO] La seccion S21 ya existe. Nada que hacer.' -ForegroundColor Yellow
    exit 0
}

# --- Contenido a agregar ----------------------------------------------------

$contenidoNuevo = @'
---

## Estado de Bitwarden al cierre de S21 (2026-10-16)

**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion
**Carpeta:** PanFree System - Produccion

### Cambios respecto a S20

En S21 NO se roto ninguna clave. La sesion se dedico a:

- Fix del Service Worker (DOC-017, commit 16ea5eec).
- Recon S21 (doc 40-recon-s21.md).
- Descartar dos falsas alarmas: DOC-015 (alias Vercel apuntaba a
  deployment viejo) y DOC-016 (Supabase legacy en Vercel — era un
  artefacto visual del CLI de Vercel, no el valor real).

### Items completos (sin cambios respecto a S20, 6/12)

| # | Item | Estado | Fecha |
|---|---|---|---|
| 1 | Supabase - Produccion | OK | 2026-10-15 (S15) |
| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S16) |
| 3 | Gemini - Produccion | OK | 2026-10-15 (S15) |
| 4 | Resend - Produccion | OK | 2026-10-15 (S16) |
| 9 | GA4 - Produccion | OK | 2026-10-16 (S19) |
| 11 | VAPID - Produccion | OK | 2026-10-16 (S20) |

### Items "No aplica" o "Rotos" (sin cambios)

| # | Item | Estado |
|---|---|---|
| 5 | Meta WhatsApp - Produccion | NO APLICA (DOC-005) |
| 6 | Twilio - Produccion | NO APLICA (DOC-005) |
| 7 | Instagram - Produccion | ROTO (DOC-006) |
| 8 | n8n - Produccion | NO APLICA (DOC-009) |
| 10 | Clarity - Produccion | Pendiente (no bloqueante) |
| 12 | Secrets internos - Produccion | ELIMINADOS (DOC-012) |

### Hallazgo SEC-020

Cerrado en S20. Sin cambios en S21.

### Politica de env.local

Confirmada en S20, sin cambios en S21: el archivo .env.local NO se
mantiene en disco. Se reconstruye on-demand desde Bitwarden cuando
se necesita desarrollo local.

### Deuda tecnica al cierre de S21

Sin cambios respecto a S20:

- Rehacer 64b/64c en VS Code (diferido a S22).
- Reconciliar doc Bitwarden (3 carpetas reales vs 1 en doc).
- Auditar items sueltos: panfree.fit, supabase.com.
- Migrar @supabase/auth-helpers-nextjs -> @supabase/ssr.
- Sistema simple de promociones en CartSidebar (DOC-008 seccion 9).
- Ocultar la seccion Marketing del menu admin.
- Limpieza de la seccion Marketing (~5.500-6.500 lineas, DOC-008).
'@

# Asegurar que empieza con \r\n (append despues de un \r\n previo)
if (-not $contenidoNuevo.StartsWith("`r`n")) {
    $contenidoNuevo = "`r`n" + $contenidoNuevo
}

# --- Dry run ----------------------------------------------------------------

if (-not $Aplicar) {
    Write-Host '[DRY RUN] No se escribe nada. Agregar -Aplicar para aplicar.' -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'Acciones que se realizarian:' -ForegroundColor Yellow
    Write-Host '  - Append al final de docs/operations/ROTACION-CLAVES.md' -ForegroundColor Yellow
    Write-Host "  - Longitud a agregar: $($contenidoNuevo.Length) caracteres" -ForegroundColor Yellow
    Write-Host ''
    exit 0
}

# --- Aplicar ----------------------------------------------------------------

$contenidoFinal = $contenido.TrimEnd() + "`r`n" + $contenidoNuevo + "`r`n"

[System.IO.File]::WriteAllText($rotFile, $contenidoFinal, (New-Object System.Text.UTF8Encoding $false))

Write-Host '[OK] ROTACION-CLAVES.md escrito' -ForegroundColor Green
Write-Host "     Antes: $($contenido.Length) caracteres" -ForegroundColor Green
Write-Host "     Despues: $($contenidoFinal.Length) caracteres" -ForegroundColor Green
Write-Host ''

# --- Verificacion post-write ------------------------------------------------

Write-Host '--- Verificacion post-write ---' -ForegroundColor Cyan

$post = [System.IO.File]::ReadAllText($rotFile)

$checks = @(
    @{ Nombre = 'Contiene seccion S21';                    Match = $post.Contains('## Estado de Bitwarden al cierre de S21') },
    @{ Nombre = 'Contiene "NO se roto ninguna clave"';     Match = $post.Contains('En S21 NO se roto ninguna clave') },
    @{ Nombre = 'Contiene fecha 2026-10-16 (S21)';         Match = $post.Contains('## Estado de Bitwarden al cierre de S21 (2026-10-16)') },
    @{ Nombre = 'Contiene referencia a DOC-017';           Match = $post.Contains('Fix del Service Worker (DOC-017') },
    @{ Nombre = 'Contiene referencia a DOC-015/DOC-016';   Match = $post.Contains('DOC-015') -and $post.Contains('DOC-016') },
    @{ Nombre = 'S20 sigue presente (no se rompio)';       Match = $post.Contains('## Estado de Bitwarden al cierre de S20') },
    @{ Nombre = 'Solo 1 ocurrencia de S21';                Match = (($post -split '## Estado de Bitwarden al cierre de S21').Count -eq 2) }
)

$todoOk = $true
foreach ($c in $checks) {
    $symbol = if ($c.Match) { 'OK  ' } else { 'FAIL' }
    $color = if ($c.Match) { 'Green' } else { 'Red' }
    Write-Host "  [$symbol] $($c.Nombre)" -ForegroundColor $color
    if (-not $c.Match) { $todoOk = $false }
}

Write-Host ''
if (-not $todoOk) {
    Write-Host '[ERROR] Verificacion post-write FALLO.' -ForegroundColor Red
    exit 1
}

Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 69d COMPLETADO' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'PROXIMO PASO:' -ForegroundColor Yellow
Write-Host '  1. git diff docs/operations/ROTACION-CLAVES.md' -ForegroundColor Yellow
Write-Host '  2. Si OK, commit + push' -ForegroundColor Yellow
Write-Host ''