# ============================================================================
# 48-bloque3-meta-plomeria-inerte-s17.ps1
# Bloque 3 de S17: documentar ecosistema Meta/Twilio/Instagram como
# plomeria inerte (no rotaciones pendientes).
#
# 2 commits:
#   1. docs(env)   - .env.example + ROTACION-CLAVES + PLAN-DE-TRABAJO
#   2. docs(audit) - tracking + doc nuevo 30-doc-meta-plomeria-inerte.md
#
# Uso:
#   .\48-bloque3-meta-plomeria-inerte-s17.ps1            (dry run)
#   .\48-bloque3-meta-plomeria-inerte-s17.ps1 -Commit    (aplica + push)
# ============================================================================

param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$repoRoot = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $repoRoot

$utf8 = New-Object System.Text.UTF8Encoding($false)

function Write-Step($msg) {
    Write-Host ""
    Write-Host "=== $msg ===" -ForegroundColor Cyan
}
function Write-Ok($msg)   { Write-Host "  [OK] $msg"   -ForegroundColor Green }
function Write-Skip($msg) { Write-Host "  [SKIP] $msg" -ForegroundColor Yellow }
function Write-Info($msg) { Write-Host "  [INFO] $msg" -ForegroundColor Gray }
function Write-Warn($msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow }

# ---------------------------------------------------------------------------
# Pre-chequeo
# ---------------------------------------------------------------------------

Write-Step "Pre-chequeo"

$head = (git rev-parse --short HEAD).Trim()
Write-Info "HEAD actual: $head"

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') {
    Write-Host "  [ERROR] Rama actual '$branch' no es 'main'. Abortar." -ForegroundColor Red
    exit 1
}
Write-Ok "Rama: main"

$status = git status --porcelain
$noVacio = $status | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
if ($noVacio.Count -gt 0) {
    Write-Warn "Working tree NO esta limpio:"
    $noVacio | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkYellow }
}

$cambios1 = 0
$cambios2 = 0

# ===========================================================================
# PARTE 1 - .env.example
# ===========================================================================

Write-Step "1. .env.example - marcar secciones Meta/Twilio/Instagram"

$envPath = Join-Path $repoRoot '.env.example'
$envText = [System.IO.File]::ReadAllText($envPath, $utf8)

# Detectar separador dominante (probamos ambos)
$usaCRLF = $envText.Contains("`r`n")

function Join-Lines($arr) {
    if ($usaCRLF) { return ($arr -join "`r`n") } else { return ($arr -join "`n") }
}

# --- 1a. META WHATSAPP ---
$oldWa = Join-Lines @(
    '# --- META WHATSAPP -----------------------------------------------------------',
    '# Email:  [S] system.panfree@gmail.com',
    '# Estado: OK',
    '# Panel:  https://business.facebook.com/settings/system-users'
)
$newWa = Join-Lines @(
    '# --- META WHATSAPP -----------------------------------------------------------',
    '# Email:  [S] system.panfree@gmail.com',
    '# Estado: NO USADO - ver DOC-005 (plomeria inerte, nunca activada en produccion)',
    '# Nota: canal real de WhatsApp es https://wa.me/595984589845 (link directo a WhatsApp Business App)',
    '# Bloqueante: Meta Business Verification requiere RUC. Decision de conservar plomeria (ver DOC-007).',
    '# Panel:  https://business.facebook.com/settings/system-users'
)

if ($envText.Contains($oldWa)) {
    $envText = $envText.Replace($oldWa, $newWa)
    Write-Ok "META WHATSAPP: marcado como NO USADO"
    $cambios1++
} elseif ($envText.Contains('# Estado: NO USADO - ver DOC-005 (plomeria inerte, nunca activada en produccion)')) {
    Write-Skip "META WHATSAPP ya marcado"
} else {
    Write-Warn "META WHATSAPP: no matcheo el bloque esperado"
}

# --- 1b. TWILIO ---
$oldTw = Join-Lines @(
    '# --- TWILIO ------------------------------------------------------------------',
    '# Email:  [S] system.panfree@gmail.com',
    '# Estado: OK',
    '# Panel:  https://console.twilio.com'
)
$newTw = Join-Lines @(
    '# --- TWILIO ------------------------------------------------------------------',
    '# Email:  [S] system.panfree@gmail.com',
    '# Estado: NO USADO - ver DOC-005 (plomeria inerte, tokens nunca creados)',
    '# Nota: /api/send-whatsapp-team intenta importar twilio pero no esta configurado.',
    '# Bloqueante: no se uso Twilio como fallback de WhatsApp en produccion.',
    '# Panel:  https://console.twilio.com'
)

if ($envText.Contains($oldTw)) {
    $envText = $envText.Replace($oldTw, $newTw)
    Write-Ok "TWILIO: marcado como NO USADO"
    $cambios1++
} elseif ($envText.Contains('# Estado: NO USADO - ver DOC-005 (plomeria inerte, tokens nunca creados)')) {
    Write-Skip "TWILIO ya marcado"
} else {
    Write-Warn "TWILIO: no matcheo el bloque esperado"
}

# --- 1c. INSTAGRAM ---
$oldIg = Join-Lines @(
    '# --- INSTAGRAM ---------------------------------------------------------------',
    '# Email:  [S] system.panfree@gmail.com',
    '# Estado: OK',
    '# Panel:  https://developers.facebook.com/tools/explorer/'
)
$newIg = Join-Lines @(
    '# --- INSTAGRAM ---------------------------------------------------------------',
    '# Email:  [S] system.panfree@gmail.com',
    '# Estado: ROTO - ver DOC-006 (endpoints existen pero fallan en runtime)',
    '# ADVERTENCIA: /api/admin/marketing/publish-instagram y programar-publicacion',
    '#              intentan usar estos tokens sin validarlos. Sin tokens, la llamada',
    '#              a graph.facebook.com falla. Los botones del panel de admin estan',
    '#              visibles pero no funcionan. Publicar manualmente desde el celular.',
    '# Bloqueante: Meta Business Verification requiere RUC.',
    '# Panel:  https://developers.facebook.com/tools/explorer/'
)

if ($envText.Contains($oldIg)) {
    $envText = $envText.Replace($oldIg, $newIg)
    Write-Ok "INSTAGRAM: marcado como ROTO"
    $cambios1++
} elseif ($envText.Contains('# Estado: ROTO - ver DOC-006 (endpoints existen pero fallan en runtime)')) {
    Write-Skip "INSTAGRAM ya marcado"
} else {
    Write-Warn "INSTAGRAM: no matcheo el bloque esperado"
}

if ($Commit -and $cambios1 -gt 0) {
    [System.IO.File]::WriteAllText($envPath, $envText, $utf8)
    Write-Ok ".env.example escrito en disco"
}

# ===========================================================================
# PARTE 2 - ROTACION-CLAVES.md
# ===========================================================================

Write-Step "2. ROTACION-CLAVES.md - marcar Meta/Twilio/Instagram como NO APLICA"

$rotPath = Join-Path $repoRoot 'docs\operations\ROTACION-CLAVES.md'
$rotText = [System.IO.File]::ReadAllText($rotPath, $utf8)

# Ancla 1: listado orden
$oldOrden = Join-Lines @(
    '5. Meta WhatsApp',
    '6. Twilio',
    '7. Instagram'
)
$newOrden = Join-Lines @(
    '5. Meta WhatsApp  [NO APLICA - ver DOC-005]',
    '6. Twilio        [NO APLICA - ver DOC-005]',
    '7. Instagram     [NO APLICA - ver DOC-006]'
)

if ($rotText.Contains($oldOrden)) {
    $rotText = $rotText.Replace($oldOrden, $newOrden)
    Write-Ok "Listado orden: marcado"
    $cambios1++
} else {
    Write-Skip "Listado orden: ya marcado o no matchea"
}

# Ancla 2: filas en tablas (3 bloques identicos)
$oldFilaWa = '| 5 | Meta WhatsApp - Produccion | [S] | F2-07 |'
$newFilaWa = '| 5 | Meta WhatsApp - Produccion | NO APLICA - DOC-005 | 2026-10-15 (S17) | Plomeria inerte. Canal real es wa.me. Ver 30-doc-meta-plomeria-inerte.md |'

if ($rotText.Contains($oldFilaWa)) {
    $ocurrencias = ([regex]::Matches($rotText, [regex]::Escape($oldFilaWa))).Count
    $rotText = $rotText.Replace($oldFilaWa, $newFilaWa)
    Write-Ok "Fila Meta WhatsApp: $ocurrencias ocurrencias actualizadas"
    $cambios1++
} else {
    Write-Skip "Fila Meta WhatsApp: ya actualizada"
}

$oldFilaTw = '| 6 | Twilio - Produccion | [S] | F2-08 |'
$newFilaTw = '| 6 | Twilio - Produccion | NO APLICA - DOC-005 | 2026-10-15 (S17) | Plomeria inerte. Tokens nunca creados. Ver 30-doc-meta-plomeria-inerte.md |'

if ($rotText.Contains($oldFilaTw)) {
    $ocurrencias = ([regex]::Matches($rotText, [regex]::Escape($oldFilaTw))).Count
    $rotText = $rotText.Replace($oldFilaTw, $newFilaTw)
    Write-Ok "Fila Twilio: $ocurrencias ocurrencias actualizadas"
    $cambios1++
} else {
    Write-Skip "Fila Twilio: ya actualizada"
}

$oldFilaIg = '| 7 | Instagram - Produccion | [S] | F2-09 |'
$newFilaIg = '| 7 | Instagram - Produccion | ROTO - DOC-006 | 2026-10-15 (S17) | Endpoints activos, tokens ausentes. Publicar manual. Ver 30-doc-meta-plomeria-inerte.md |'

if ($rotText.Contains($oldFilaIg)) {
    $ocurrencias = ([regex]::Matches($rotText, [regex]::Escape($oldFilaIg))).Count
    $rotText = $rotText.Replace($oldFilaIg, $newFilaIg)
    Write-Ok "Fila Instagram: $ocurrencias ocurrencias actualizadas"
    $cambios1++
} else {
    Write-Skip "Fila Instagram: ya actualizada"
}

if ($Commit -and $cambios1 -gt 0) {
    [System.IO.File]::WriteAllText($rotPath, $rotText, $utf8)
    Write-Ok "ROTACION-CLAVES.md escrito en disco"
}

# ===========================================================================
# PARTE 3 - PLAN-DE-TRABAJO.md
# ===========================================================================

Write-Step "3. PLAN-DE-TRABAJO.md - marcar F2-07/08/09 como No aplica"

$planPath = Join-Path $repoRoot 'docs\operations\PLAN-DE-TRABAJO.md'
$planText = [System.IO.File]::ReadAllText($planPath, $utf8)

$planReemplazos = @(
    @{
        Viejo = '| F2-07 | Migrar Meta WhatsApp a system.panfree | P2 | M | Pendiente | WABA responde |'
        Nuevo = '| F2-07 | Migrar Meta WhatsApp a system.panfree | P2 | M | No aplica | Plomeria inerte (DOC-005). Canal real: wa.me |'
        Etiqueta = 'F2-07'
    },
    @{
        Viejo = '| F2-08 | Rotar Twilio auth token | P2 | S | Pendiente | WhatsApp fallback OK |'
        Nuevo = '| F2-08 | Rotar Twilio auth token | P2 | S | No aplica | Plomeria inerte (DOC-005). Tokens nunca creados |'
        Etiqueta = 'F2-08'
    },
    @{
        Viejo = '| F2-09 | Rotar Instagram access token | P2 | S | Pendiente | Publicacion funciona |'
        Nuevo = '| F2-09 | Rotar Instagram access token | P2 | S | No aplica | Endpoints rotos sin tokens (DOC-006). Publicar manual |'
        Etiqueta = 'F2-09'
    }
)

foreach ($r in $planReemplazos) {
    if ($planText.Contains($r.Viejo)) {
        $planText = $planText.Replace($r.Viejo, $r.Nuevo)
        Write-Ok "$($r.Etiqueta) actualizado"
        $cambios1++
    } elseif ($planText.Contains($r.Nuevo)) {
        Write-Skip "$($r.Etiqueta) ya actualizado"
    } else {
        Write-Warn "$($r.Etiqueta) no matcheo"
    }
}

if ($Commit -and $cambios1 -gt 0) {
    [System.IO.File]::WriteAllText($planPath, $planText, $utf8)
    Write-Ok "PLAN-DE-TRABAJO.md escrito en disco"
}

# ===========================================================================
# COMMIT 1
# ===========================================================================

if ($Commit -and $cambios1 -gt 0) {
    Write-Step "Commit 1 - docs(env)"
    git add .env.example
    git add docs/operations/ROTACION-CLAVES.md
    git add docs/operations/PLAN-DE-TRABAJO.md
    git commit -m "docs(env): documentar ecosistema Meta/Twilio/Instagram como plomeria inerte (DOC-005/006)" | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "git commit 1 fallo" }
    Write-Ok "Commit 1 aplicado"
} elseif (-not $Commit) {
    Write-Info "[DRY RUN] Commit 1 se aplicaria si -Commit"
}

# ===========================================================================
# PARTE 4 - Doc nuevo 30-doc-meta-plomeria-inerte.md
# ===========================================================================

Write-Step "4. Crear doc 30-doc-meta-plomeria-inerte.md"

$docNuevoPath = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial\30-doc-meta-plomeria-inerte.md'

$docContenido = @'
# DOC-005 / DOC-006 / DOC-007 - Meta: Plomeria inerte

**Fecha:** 2026-10-15 (S17)
**Autor:** Pedro J. Pirovani
**Estado:** Documentado
**Severidad:** Media (DOC-006 con impacto visible al admin) / Baja (DOC-005 y DOC-007)

---

## 1. Resumen ejecutivo

Durante S17 se audito el estado real del ecosistema Meta en el proyecto PanFree System. El resultado fue inesperado: **hay mucha plomeria en el codigo, pero nada activo en produccion**.

Tres servicios estan afectados:

| Servicio | Vercel | Codigo | Canal real | Hallazgo |
|---|---|---|---|---|
| Meta WhatsApp Cloud API | Sin tokens | Plomeria inerte | `wa.me/` link | DOC-005 |
| Twilio WhatsApp | Sin tokens | Plomeria inerte | Ninguno | DOC-005 |
| Instagram Graph API | Sin tokens | Endpoints ACTIVOS | Publicacion manual | DOC-006 |

**Bloqueante raiz (DOC-007):** Meta Business Verification requiere RUC / documentacion fiscal. Sin eso, ninguno de estos servicios se puede activar en modo produccion.

---

## 2. Evidencia recolectada

### 2.1 Vercel - Environment Variables

Busqueda en el proyecto `panfree-system` (Vercel Settings → Environment Variables):

| Filtro | Resultado |
|---|---|
| `WHATSAPP` | Solo `ADMIN_WHATSAPP` (usado por notificaciones.js) |
| `TWILIO` | **No Results Found** |
| `INSTAGRAM` | **No Results Found** |

**Conclusion:** las 3 integraciones Meta estan ausentes de Vercel.

### 2.2 Codigo - uso real

**WhatsApp Cloud API:**
- `src/lib/whatsapp.js` (122 lineas) - cliente HTTP
- `src/lib/whatsapp-templates.js` (125 lineas) - templates `jaspers_market_*` (nombre de otro proyecto)
- `src/app/api/send-whatsapp/route.js` (64 lineas)
- `src/app/api/send-whatsapp-team/route.js` (112 lineas)

Todas creadas en el commit `b68d3563 feat(whatsapp): implement template-based messaging system`. En runtime, `whatsapp.js:56` emite `logger.warn("WhatsApp API no configurado")` y no falla.

**Twilio:**
- `send-whatsapp-team/route.js:69-87` intenta `import('twilio')` y llamar `twilioClient.messages.create`.
- Sin tokens en Vercel, falla con error de autenticacion si alguien invoca el endpoint.
- **Ningun frontend visible llama a `/api/send-whatsapp-team`.** Es codigo muerto accesible solo por URL directa.

**Instagram Graph API:**
- `src/app/api/admin/marketing/publish-instagram/route.js`
- `src/app/api/admin/marketing/programar-publicacion/route.js`
- Ambos leen `INSTAGRAM_ACCESS_TOKEN` e `INSTAGRAM_BUSINESS_ID` sin validar y llaman a `graph.facebook.com/v19.0/.../media`.
- **Los endpoints SI tienen UI que los llama:**
  - `src/app/admin/marketing/components/AutomationPanel.jsx:11`
  - `src/app/admin/marketing/components/DecisionPanel.jsx:215`
  - `src/app/admin/marketing/page.js:384`
  - `src/app/admin/marketing/services/instagramService.js:23,94`
- **Este es el unico servicio con impacto visible al admin.** Los botones existen, el admin los puede clickear, la llamada falla.

### 2.3 Canal real de WhatsApp

El canal productivo es `wa.me/595984589845` - link directo que abre WhatsApp Web/App apuntando al WhatsApp Business App de Luciana (esposa del responsable). Se usa en **mas de 20 lugares** del codigo, todos funcionando.

### 2.4 `.env.local` local

Solo contiene `VERCEL_OIDC_TOKEN`. Ni el entorno local tiene los tokens Meta.

---

## 3. Hallazgos

### DOC-005 - Meta WhatsApp + Twilio: plomeria inerte

**Descripcion:** el codigo tiene cliente HTTP, templates, endpoints, y logs preparados para enviar WhatsApps via Meta Cloud API y Twilio. Nunca se activo en produccion.

**Causa:** los tokens nunca se crearon en Vercel. En parte por falta de necesidad (el canal `wa.me/` funciona) y en parte por bloqueante externo (Meta Business Verification requiere RUC).

**Impacto:** ninguno. El codigo hace `logger.warn` si faltan tokens. No rompe build ni runtime.

**Decision:** conservar la plomeria. Costo de mantener: nulo. Costo de reescribir: alto. Si PanFree obtiene RUC y activa Meta Business API, el codigo ya esta.

### DOC-006 - Instagram Graph API: endpoints rotos con UI visible

**Descripcion:** los endpoints `publish-instagram` y `programar-publicacion` intentan publicar en Instagram via Graph API, pero sin tokens en Vercel fallan. Los botones del panel admin siguen visibles.

**Causa:** mismo bloqueante externo (Meta Business Verification). El codigo no valida tokens antes de llamar, entonces el error surge en runtime.

**Impacto:** medio. El admin ve un error critico si intenta usar el boton. No afecta clientes.

**Mitigacion S17-B (opcional):** deshabilitar los botones del panel admin con mensaje informativo. Fix de UI, no de backend.

**Decision:** conservar los endpoints. Deshabilitar la UI (si se decide hacerlo, en commit aparte).

### DOC-007 (padre) - Bloqueante: Meta Business Verification requiere RUC

**Descripcion:** Meta (Facebook/Instagram/WhatsApp Business) requiere verificacion de empresa con documentacion fiscal para activar APIs en modo produccion. PanFree no tiene RUC.

**Impacto:** bloquea Meta WhatsApp Cloud API, Instagram Graph API, Meta Ads API, Messenger, y cualquier futura integracion Meta.

**Causa:** externa. No hay fix tecnico posible.

**Mitigacion:** ninguna por ahora. Los servicios Meta quedan sin activar hasta que PanFree obtenga RUC.

**Condicion de revision:** si al **2027-04-15** (6 meses) no se ha obtenido RUC ni iniciado la verificacion Meta Business, revisar si vale la pena eliminar la plomeria para simplificar el codigo.

---

## 4. Decision arquitectonica (S17)

**La plomeria de Meta se conserva.** Motivos:

1. Costo de mantenimiento: nulo.
2. Costo de reescritura: alto (~500 lineas de codigo + templates + endpoints).
3. La decision de activar Meta Business API esta diferida indefinidamente. No hay apuro.

**Excepcion (si aplica):** la UI de Instagram (`AutomationPanel.jsx`, `DecisionPanel.jsx`, `page.js`) puede ocultarse con un mensaje "Pendiente verificacion Meta Business". Es un fix de UX, no un cambio de arquitectura.

---

## 5. Plan futuro

### Corto plazo (S17-S18)

- [ ] (Opcional, S17-B) Ocultar botones de Instagram en el panel admin.
- [ ] Registrar el numero de WhatsApp `595984589845` como constante centralizada (F3, deuda de mantenibilidad).

### Mediano plazo (S18+)

- [ ] Auditar `supabase/functions/send-whatsapp/index.ts` (Edge Function).
- [ ] Revisar si la tabla `instagram_posts` tiene filas (evidencia de uso historico).
- [ ] Documentar el canal de WhatsApp en docs/operations/ENVIRONMENT.md.

### Largo plazo (si hay RUC)

- [ ] Activar Meta Business Verification.
- [ ] Crear app en developers.facebook.com.
- [ ] Crear System User + tokens permanentes.
- [ ] Activar WhatsApp Cloud API + Instagram Graph API.
- [ ] Migrar todo a cuenta [S] system.panfree.
- [ ] Actualizar `.env.example`, Vercel, y documentar en Bitwarden.

### Condicion de revision

Si al **2027-04-15** no hay RUC:
- Evaluar si eliminar la plomeria Meta.
- Simplificar el codigo: borrar `whatsapp.js`, `whatsapp-templates.js`, endpoints, y el env vars asociado.

---

## 6. Archivos afectados

**Backend:**
- `src/lib/whatsapp.js`
- `src/lib/whatsapp-templates.js`
- `src/app/api/send-whatsapp/route.js`
- `src/app/api/send-whatsapp-team/route.js`
- `src/app/api/admin/marketing/publish-instagram/route.js`
- `src/app/api/admin/marketing/programar-publicacion/route.js`

**Frontend:**
- `src/app/admin/marketing/components/AutomationPanel.jsx`
- `src/app/admin/marketing/components/DecisionPanel.jsx`
- `src/app/admin/marketing/page.js`
- `src/app/admin/marketing/services/instagramService.js`

**Config:**
- `.env.example` (secciones Meta WhatsApp, Twilio, Instagram)
- `docs/operations/ROTACION-CLAVES.md`
- `docs/operations/PLAN-DE-TRABAJO.md`
- `docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md`

---

## 7. Referencias

- [Tracking de hallazgos](./06-hallazgos-tracking.md)
- [ROTACION-CLAVES](../../operations/ROTACION-CLAVES.md)
- [PLAN-DE-TRABAJO](../../operations/PLAN-DE-TRABAJO.md)
- [ENVIRONMENT](../../operations/ENVIRONMENT.md)
'@

if (Test-Path $docNuevoPath) {
    Write-Skip "El doc 30-doc-meta-plomeria-inerte.md ya existe"
} else {
    if ($Commit) {
        [System.IO.File]::WriteAllText($docNuevoPath, $docContenido, $utf8)
        Write-Ok "Doc creado: 30-doc-meta-plomeria-inerte.md"
    } else {
        Write-Info "[DRY RUN] Se crearia 30-doc-meta-plomeria-inerte.md ($($docContenido.Length) chars)"
    }
    $cambios2++
}

# ===========================================================================
# PARTE 5 - tracking
# ===========================================================================

Write-Step "5. Tracking - agregar DOC-005/006/007 + recalcular header"

$tkPath = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$tkText = [System.IO.File]::ReadAllText($tkPath, $utf8)

# Ancla 1: agregar DOC-005 en "Hallazgos medios" despues de la ultima fila de esa seccion
$anchorMedios = '| SEC-008 | crear_usuario_admin sin chequeo de caller (eliminada) | F3 | P2 | Cerrado | (S15) |'
$nuevosMedios = @(
    '| SEC-008 | crear_usuario_admin sin chequeo de caller (eliminada) | F3 | P2 | Cerrado | (S15) |',
    '| DOC-005 | Meta WhatsApp + Twilio: plomeria inerte | F2 | P2 | Cerrado | (S17) |',
    '| DOC-006 | Instagram Graph API: endpoints rotos con UI visible | F2 | P2 | Abierto | - |',
    '| DOC-007 | Bloqueante externo: Meta Business Verification requiere RUC | F2 | P2 | Aceptado | (S17) |'
)

if ($tkText.Contains($anchorMedios)) {
    $tkText = $tkText.Replace($anchorMedios, ($nuevosMedios -join "`r`n"))
    Write-Ok "DOC-005/006/007 agregados a Hallazgos medios"
    $cambios2++
} else {
    Write-Warn "No matcheo la fila SEC-008 (ancla de Hallazgos medios)"
}

# Ancla 2: recalcular header
# Detectar filas actualizadas
$filas = $tkText -split "`r`n" | Where-Object { $_ -match '^\| [A-Z]+-[0-9]' }
if ($filas.Count -le 1) {
    $filas = $tkText -split "`n" | Where-Object { $_ -match '^\| [A-Z]+-[0-9]' }
}
$totalFilas = $filas.Count
$nAbierto   = ($filas | Where-Object { $_ -match '\|\s*\*{0,2}Abierto\*{0,2}\s*\|' }).Count
$nEnCurso   = ($filas | Where-Object { $_ -match '\|\s*\*{0,2}En curso\*{0,2}\s*\|' }).Count
$nCerrado   = ($filas | Where-Object { $_ -match '\|\s*\*{0,2}Cerrado\*{0,2}\s*\|' }).Count
$nAceptado  = ($filas | Where-Object { $_ -match '\|\s*\*{0,2}Aceptado\*{0,2}\s*\|' }).Count

Write-Info "Conteo real post-add: Total=$totalFilas Abierto=$nAbierto En curso=$nEnCurso Cerrado=$nCerrado Aceptado=$nAceptado"

$tkReemplazos = @(
    @{ Viejo = '**Ultima actualizacion:** 2026-10-15 (fin Sesion 16)'; Nuevo = '**Ultima actualizacion:** 2026-10-15 (fin Sesion 17)'; Etiqueta = 'Ultima actualizacion' },
    @{ Viejo = '**Total de hallazgos:** 51';                           Nuevo = "**Total de hallazgos:** $totalFilas";          Etiqueta = 'Total' },
    @{ Viejo = '| Abierto | 19 |';                                     Nuevo = "| Abierto | $nAbierto |";                     Etiqueta = 'Abierto' },
    @{ Viejo = '| En curso | 0 |';                                     Nuevo = "| En curso | $nEnCurso |";                    Etiqueta = 'En curso' },
    @{ Viejo = '| Cerrado | 31 |';                                     Nuevo = "| Cerrado | $nCerrado |";                     Etiqueta = 'Cerrado' },
    @{ Viejo = '| Aceptado | 1 |';                                     Nuevo = "| Aceptado | $nAceptado |";                   Etiqueta = 'Aceptado' }
)

foreach ($r in $tkReemplazos) {
    if ($tkText.Contains($r.Viejo)) {
        $tkText = $tkText.Replace($r.Viejo, $r.Nuevo)
        Write-Ok "Header: $($r.Etiqueta) actualizado"
        $cambios2++
    } elseif ($tkText.Contains($r.Nuevo)) {
        Write-Skip "Header: $($r.Etiqueta) ya actualizado"
    } else {
        Write-Warn "Header: $($r.Etiqueta) no matcheo"
    }
}

if ($Commit -and $cambios2 -gt 0) {
    [System.IO.File]::WriteAllText($tkPath, $tkText, $utf8)
    Write-Ok "Tracking escrito en disco"
}

# ===========================================================================
# COMMIT 2
# ===========================================================================

if ($Commit -and $cambios2 -gt 0) {
    Write-Step "Commit 2 - docs(audit)"
    git add docs/audits/2026-10-13-inicial/30-doc-meta-plomeria-inerte.md
    git add docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md
    git commit -m "docs(audit): registrar DOC-005/006/007 (Meta plomeria inerte)" | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "git commit 2 fallo" }
    Write-Ok "Commit 2 aplicado"
} elseif (-not $Commit) {
    Write-Info "[DRY RUN] Commit 2 se aplicaria si -Commit"
}

# ===========================================================================
# PUSH + verificacion
# ===========================================================================

Write-Step "Resumen"

if ($cambios1 -eq 0 -and $cambios2 -eq 0) {
    Write-Skip "No hay cambios para commitear"
    exit 0
}

Write-Info "Cambios commit 1 (docs/ops/env): $cambios1"
Write-Info "Cambios commit 2 (audit): $cambios2"

if ($Commit) {
    Write-Step "Push a origin/main"
    git push origin main | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "git push fallo" }
    Write-Ok "Push OK"

    Write-Step "Verificacion final"
    git log --oneline -5 | Out-Host
    Write-Host ""
    git status --short | Out-Host
} else {
    Write-Step "DRY RUN completado - nada se modifico"
    Write-Host ""
    Write-Host "  Para aplicar + commit + push:" -ForegroundColor Yellow
    Write-Host "    .\48-bloque3-meta-plomeria-inerte-s17.ps1 -Commit" -ForegroundColor Yellow
}

Write-Host ""