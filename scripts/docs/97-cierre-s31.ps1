$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Push-Location $root

Write-Host "== 97 - Cierre S31 ==" -ForegroundColor Cyan

# --- 1. Borrar buildMarketingImageTransformationUrl de cloudinary.js ---
$cPath = 'src\lib\cloudinary.js'
$ctxt = [System.IO.File]::ReadAllText((Resolve-Path $cPath), [System.Text.UTF8Encoding]::new($false))
$cOrig = $ctxt
# Regex: desde "export function buildMarketingImageTransformationUrl(" hasta el cierre de la funcion
$ctxt = $ctxt -replace '(?s)export function buildMarketingImageTransformationUrl\(\{.*?\n\}\r?\n', ''
if ($ctxt -ne $cOrig) {
    [System.IO.File]::WriteAllText((Resolve-Path $cPath), $ctxt, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  [OK] buildMarketingImageTransformationUrl borrada de cloudinary.js" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] buildMarketingImageTransformationUrl no encontrada" -ForegroundColor Yellow
}

# --- 2. Borrar templateNotificacionMarketing de email-templates.js ---
$ePath = 'src\lib\email-templates.js'
$etxt = [System.IO.File]::ReadAllText((Resolve-Path $ePath), [System.Text.UTF8Encoding]::new($false))
$eOrig = $etxt
$etxt = $etxt -replace '(?s)export function templateNotificacionMarketing\(\{.*?\n\}\r?\n', ''
if ($etxt -ne $eOrig) {
    [System.IO.File]::WriteAllText((Resolve-Path $ePath), $etxt, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  [OK] templateNotificacionMarketing borrada de email-templates.js" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] templateNotificacionMarketing no encontrada" -ForegroundColor Yellow
}

# --- 3. DOC-008: Estado -> CERRADO ---
$doc008 = 'docs\audits\2026-10-13-inicial\31-doc-008-seccion-marketing.md'
$d = [System.IO.File]::ReadAllText((Resolve-Path $doc008), [System.Text.UTF8Encoding]::new($false))
$d = $d.Replace('**Estado:** Abierto', '**Estado:** CERRADO (S31, 2026-10-19)')
if (-not $d.Contains('## 12. Cierre S31')) {
    $cierre = @"

---

## 12. Cierre S31 (2026-10-19)

**Estado:** CERRADO

**Ejecutado en S31:**
- PR #36: mover ``test-email`` fuera del módulo (desbloqueo técnico).
- PR #37: retiro atómico del módulo completo (~9.540 líneas borradas).
  - 25 archivos/dirs borrados (components, hooks, services, utils, styles, 10 endpoints).
  - ``/admin/marketing/page.js`` reescrita como página informativa (ASCII puro).
  - ``/admin/ayuda/marketing/page.js`` reescrita como página informativa.
  - Item "Marketing" quitado de ``layout.js`` y ``admin/page.js``.
- Borrado de código muerto:
  - ``buildMarketingImageTransformationUrl()`` en ``lib/cloudinary.js``.
  - ``templateNotificacionMarketing()`` en ``lib/email-templates.js``.

**Hallazgos cerrados:** DOC-002, DOC-003, DOC-006, DOC-008, BUG-006, BUG-007, BUG-008, BUG-009, SEC-016b.

**Pendiente para S32:** tablas huérfanas ``reglas_promocion``, ``promociones_historico``, ``instagram_posts`` (evaluar drop).

**Verificación:** smoke test en producción OK (``panfree.fit`` → redirect 308 → ``www.panfree.fit``, menú sin Marketing, promos y cupones funcionando).
"@
    $d = $d.TrimEnd() + $cierre
}
[System.IO.File]::WriteAllText((Resolve-Path $doc008), $d, [System.Text.UTF8Encoding]::new($false))
Write-Host "  [OK] DOC-008 cerrado" -ForegroundColor Green

# --- 4. Tracking: cerrar hallazgos ---
$track = 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$t = [System.IO.File]::ReadAllText((Resolve-Path $track), [System.Text.UTF8Encoding]::new($false))
$tOrig = $t

$cerrados = @('DOC-002','DOC-003','DOC-006','DOC-008','BUG-006','BUG-007','BUG-008','BUG-009','SEC-016b')
foreach ($id in $cerrados) {
    $pattern = "(?m)^\| $id \|(.*?)\|(.*?)\|(.*?)\|(.*?)\|"
    if ($t -match $pattern) {
        $t = $t -replace "(?m)^(\| $id \|.*?\|.*?\|.*?\|)\s*(Abierto|Aceptado[^|]*)\s*\|", '$1 Cerrado (S31) |'
    }
}

if (-not $t.Contains('DOC-020')) {
    $nuevas = @"

| DOC-020 | `panfree.fit` (apex) no redirigía a `www.panfree.fit` | Baja | Config | Cerrado (S31) | S31 | Vercel Domains: agregado `panfree.fit` con redirect 308 a `www`. |
| DB-003 | Tablas huérfanas tras retiro de Marketing: `reglas_promocion`, `promociones_historico`, `instagram_posts` | Baja | DB | Abierto | S32 | Evaluar drop con migración versionada y backup previo. |
"@
    $t = $t.TrimEnd() + $nuevas + "`r`n"
}
[System.IO.File]::WriteAllText((Resolve-Path $track), $t, [System.Text.UTF8Encoding]::new($false))
Write-Host "  [OK] Tracking actualizado" -ForegroundColor Green

# --- 5. STATUS.md ---
$status = 'docs\STATUS.md'
$s = [System.IO.File]::ReadAllText((Resolve-Path $status), [System.Text.UTF8Encoding]::new($false))
$s = $s.Replace('**Ultima actualizacion:** 2026-10-19 (fin Sesion 30 - trigger de stock eliminado + docs informativas)', '**Ultima actualizacion:** 2026-10-19 (fin Sesion 31 - retiro de Marketing + familia Gemini + fix DNS panfree.fit)')

$s = $s.Replace('1. **S31 (en curso): Retiro de Marketing (DOC-008) + Familia Gemini** - Cierra BUG-006..009, DOC-002/003/006, SEC-016b por eliminacion del modulo.', '1. **S32 (proximo): RLS pendiente (DB-002/DB-003) + docs desalineadas (DOC-010/011)** - Cierre de deuda post-auditoria.')
$s = $s.Replace('2. **S32: RLS pendiente (DB-002) + docs desalineadas (DOC-010/011)** - Cierre de deuda post-auditoria.', '2. **S33: Higiene tecnica (CONF-003/004/005, DOC-018/019) + TST-001 (tests reales)**')
$s = $s.Replace('3. **S33+: Higiene tecnica (CONF-003/004/005, DOC-018/019) + TST-001 (tests reales)**', '3. **S34+: Deuda restante (DOC-014, DB-003 drop, etc.)**')

if (-not $s.Contains('Sesion 31')) {
    $entryS31 = @"

**2026-10-19 - Sesion 31 (ENV) - Retiro de Marketing + fix DNS - COMPLETA**
- PR #35: sync docs (STATUS + BITACORA a realidad post-S30).
- PR #36: mover test-email fuera del modulo Marketing (desbloqueo).
- PR #37: retiro atomico del modulo Marketing (~9.540 lineas borradas).
  - 25 archivos/dirs borrados, 2 paginas informativas reescritas.
  - Menu admin limpiado (layout.js, admin/page.js).
- Codigo muerto borrado: buildMarketingImageTransformationUrl, templateNotificacionMarketing.
- Fix DNS: panfree.fit (apex) agregado a Vercel con redirect 308 -> www.panfree.fit.
- Hallazgos cerrados: DOC-002, DOC-003, DOC-006, DOC-008, BUG-006..009, SEC-016b, DOC-020 (nuevo).
- Pendiente S32: DB-003 (tablas huerfanas).
- Smoke test en produccion OK.
"@
    $s = $s.TrimEnd() + $entryS31 + "`r`n"
}
[System.IO.File]::WriteAllText((Resolve-Path $status), $s, [System.Text.UTF8Encoding]::new($false))
Write-Host "  [OK] STATUS.md actualizado" -ForegroundColor Green

# --- 6. BITACORA.md ---
$bit = 'docs\BITACORA.md'
$b = [System.IO.File]::ReadAllText((Resolve-Path $bit), [System.Text.UTF8Encoding]::new($false))
if (-not $b.Contains('(Sesion 31')) {
    $entryBit = @"

## 2026-10-19 (Sesion 31 - ENV) - COMPLETA

**Duracion:** ~8 horas
**Objetivo:** Retiro de Marketing (DOC-008) + familia Gemini + fix DNS.

**Completado:**
- PR #35: sync docs (STATUS + BITACORA a realidad post-S30).
- PR #36: mover test-email fuera del modulo Marketing (desbloqueo tecnico).
- PR #37: retiro atomico del modulo Marketing (~9.540 lineas borradas).
  - 25 archivos/dirs borrados (components, hooks, services, utils, styles, 10 endpoints).
  - /admin/marketing/page.js y /admin/ayuda/marketing/page.js reescritas como informativas (ASCII puro).
  - Item "Marketing" quitado de layout.js y admin/page.js.
- Codigo muerto borrado:
  - buildMarketingImageTransformationUrl() en lib/cloudinary.js (0 llamadas).
  - templateNotificacionMarketing() en lib/email-templates.js (0 llamadas).
- Fix DNS: panfree.fit (apex) agregado a Vercel con redirect 308 -> www.panfree.fit.
- Verificacion de promos y cupones: confirmados vivos en codigo real.
- Smoke test en produccion OK.

**Hallazgos cerrados:**
- DOC-002, DOC-003, DOC-006, DOC-008, BUG-006, BUG-007, BUG-008, BUG-009, SEC-016b, DOC-020 (nuevo).

**Hallazgos nuevos:**
- DOC-020: panfree.fit (apex) no redirigia a www. Cerrado en S31.
- DB-003: tablas huerfanas reglas_promocion, promociones_historico, instagram_posts. Abierto para S32.

**Aprendizajes:**
- Retiro atomico > retiro por partes: 1 PR, 1 revert, 0 estado intermedio roto.
- Paginas informativas (ASCII puro) > 404: mejor UX y documenta la decision in-situ.
- Grep de imports cruzados antes de borrar es obligatorio.
- Vercel CLI en PowerShell 5.1 rompe con NativeCommandError. Usar cmd /c.
- vercel inspect <dominio> no funciona: usar vercel domains inspect.
- Redirect apex -> www es la mejor practica.
"@
    $b = $b.TrimEnd() + $entryBit + "`r`n"
    [System.IO.File]::WriteAllText((Resolve-Path $bit), $b, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  [OK] BITACORA.md actualizado" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] S31 ya en BITACORA" -ForegroundColor Yellow
}

# --- 7. Verificacion final ---
Write-Host ""
Write-Host "Verificacion:" -ForegroundColor Magenta
$muertos = Get-ChildItem -Recurse src -Include *.js,*.jsx |
    Select-String -Pattern "buildMarketingImageTransformationUrl|templateNotificacionMarketing"
if ($muertos) {
    Write-Host "  [WARN] Quedan referencias a codigo muerto:" -ForegroundColor Yellow
    $muertos | Format-Table -AutoSize
} else {
    Write-Host "  [OK] 0 referencias a codigo muerto" -ForegroundColor Green
}

Write-Host ""
Write-Host "Siguiente: git status && git diff --stat" -ForegroundColor Cyan
Pop-Location
