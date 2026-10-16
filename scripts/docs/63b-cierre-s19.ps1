# ============================================================================
# 63b-cierre-s19.ps1
# ----------------------------------------------------------------------------
# Cierre de S19 (ENV): documentar rotacion GA4 + correccion de autoria.
#   1. BITACORA.md   -> entrada completa de S19.
#   2. STATUS.md     -> ultima actividad + proximos 3 pasos.
#   3. SISTEMA-DE-TRABAJO.md -> nueva regla 7.5 (secretos en chat IA).
#
# Idempotente. NO commitea. Solo aplica cambios al working tree.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/docs/63b-cierre-s19.ps1
# ============================================================================

$ErrorActionPreference = 'Stop'

$repoRoot     = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$bitacoraPath = Join-Path $repoRoot 'docs\BITACORA.md'
$statusPath   = Join-Path $repoRoot 'docs\STATUS.md'
$sistemaPath  = Join-Path $repoRoot 'docs\operations\SISTEMA-DE-TRABAJO.md'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 63b - Cierre S19 (documentacion)' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

Set-Location $repoRoot

# ---------------------------------------------------------------------------
# 1. BITACORA.md
# ---------------------------------------------------------------------------

Write-Host '[1/3] Actualizando BITACORA.md...' -ForegroundColor Green

if (-not (Test-Path -LiteralPath $bitacoraPath)) {
    Write-Host "  [ERROR] No existe: $bitacoraPath" -ForegroundColor Red
    exit 1
}

$bit = [System.IO.File]::ReadAllText($bitacoraPath)
$marcaBit = '## 2026-10-16 (Sesion 19'

if ($bit.Contains($marcaBit)) {
    Write-Host '  [SKIP] BITACORA ya tiene la entrada de S19' -ForegroundColor Yellow
} else {

    $entrada = @'

---

## 2026-10-16 (Sesion 19 - COMPLETA)

**Duracion:** ~8 horas
**Objetivo:** ENV - Rotacion GA4 (F2-11) + correccion de autoria del historial

**Completado:**

### Bloque 1 - Auditoria GA4 (SEC-023)
- Script 59: auditar variables GA4 en src/ (18 coincidencias en 4 archivos).
- Script 60: leer endpoints que consumen credenciales GA4.
- Conclusion: SEC-023 NO era duplicado. Coexistencia legitima:
  - Grupo A (Service Account): plomeria inerte (ga-metrics/route.js
    solo lee de Supabase, no usa Data API de Google).
  - Grupo B (Measurement Protocol): activo (ga4/measurement/route.js).
- Decision: conservar Grupo A. Rotar solo Grupo B.
- Hallazgo nuevo: DOC-014 (Service Account plomeria inerte, revision 2027-04-16).

### Bloque 2 - Rotacion de GA4_API_SECRET
- Secret nuevo creado en GA4 Admin: panfree-system-2026-10-16.
- Actualizado en Vercel (Production + Preview) + .env.local + Bitwarden.
- Redeploy + verificacion empirica (debug_validation sin errores).
- Secret viejo revocado: panfree-measurement-protocol
  (9kBxpoPjR_aBo1H0-QyE8w, creado 2026-08-22).
- Motivo adicional: exposicion accidental del secret en chat durante la
  auditoria de S19.

### Bloque 3 - Rotacion de GA4_PRIVATE_KEY
- Key nueva creada en Google Cloud Console: panfree-system-2026-10-16.
- Actualizada en Vercel + .env.local + Bitwarden.
- Key vieja revocada (Key ID: 45522eb71b92a80fcdb49c5ff073786d9b02496b,
  creada 2026-08-31).
- Nota: el valor legacy fue IRRECUPERABLE (Google no lo expone post-creacion;
  Vercel no lo muestra por Sensitive). Se documento como excepcion justificada
  a la politica "guardar valor saliente completo".

### Bloque 4 - Correccion de autoria del historial de Git
- Descubierto: todos los commits de S1-S18 estaban firmados por
  "Piromaniaco <dagnershd@gmail.com>" (familiar propietario de la PC).
- Identificado: 4 autores distintos en el historial:
  - Luciana Noelia Da Silva <luzzdevictoria@gmail.com>
  - Panfree <contacto.panfree@gmail.com>
  - PanFree-Tech <system.panfree@gmail.com>
  - Piromaniaco <dagnershd@gmail.com>
- Script 62: reescritura completa del historial con git filter-repo.
  Todos los 333 commits ahora firmados por:
  Pedro J. Pirovani <pirovanipedrojose@gmail.com>
- Push force ejecutado: 88a54bcc -> 2ab9895e (historial reescrito).
- Verificado en GitHub: todos los commits atribuidos a pjpirovani-soft.
- Identidad local del repo configurada (no global).
- Credenciales de push en Windows: eliminadas las de Piromaniaco y
  paraguayffaametalstorm-debug. Solo queda gh:github.com:PanFree-Tech.

### Cierre
- Script 63a: chore .gitignore (reglas para *-audit-*.txt, *-endpoints-*.txt)
  + git rm --cached de 2 .txt versionados por error.
- Script 63b: documentacion de cierre (este).
- Progreso: 70% -> 72% (34 de 47 tareas).
- F2: 10/14 -> 11/14.

**Commits S19:**
- b87aadde security(env): rotar GA4 API secret y private key (F2-11, SEC-023)
- 2ab9895e chore(scripts): agregar script 62 de correccion de autoria
- (pendiente) chore(git): ignorar reportes de auditoria temporales
- (pendiente) docs(session): cerrar sesion 19 (ENV) - rotacion GA4 + correccion de autoria

**Hallazgos cerrados:**
- SEC-023: GA4 con dos juegos de credenciales coexistiendo
  -> Cerrado: no era duplicado, coexistencia legitima.

**Hallazgos nuevos:**
- DOC-014: GA4 Service Account plomeria inerte (Abierto, revision 2027-04-16).

**Hallazgos reabiertos/afectados:**
- SEC-001 (.env en historial Git): el filter-repo NO elimina los .env del
  historial. Sigue pendiente F4-01.

**Bloqueantes:**
- Ninguno. Cloudinary #392411 se reconsulta a partir del 2026-10-18.

**Aprendizajes:**
- Auditoria previa evita rotaciones inutiles. SEC-023 parecia duplicado y
  resulto coexistencia legitima. Mismo patron que S17/S18.
- git filter-repo es la herramienta correcta para reescribir autoria.
  `git filter-branch` es lento y deprecated.
- La credencial de push (Windows Credential Manager) y el autor del commit
  son cosas distintas. Corregir uno no corrige el otro.
- La politica "guardar el valor saliente COMPLETO" tiene una excepcion
  justificada: cuando el valor es tecnicamente irrecuperable (Google Cloud
  private keys). Se documenta como "irrecuperable + revocado".
- Los hashes de commits cambian tras filter-repo. Las referencias en docs
  quedan obsoletas. Se documenta la nota "hashes pre-reescritura".

**Nota S19 sobre hashes obsoletos:**
El historial de Git fue reescrito (correccion de autoria, script 62).
Los hashes de commits anteriores a S19 cambiaron. Las referencias a hashes
en BITACORA.md, 06-hallazgos-tracking.md y docs de auditoria corresponden
al historial pre-reescritura. Los mensajes de commit se preservan y son
la referencia valida.

**Proxima sesion (S20):**
- F2-12: regenerar par VAPID (verificar SEC-024 + BUG-001 antes).
- F2-14: guardar .env consolidado en Bitwarden.
- F3-07: fix BUG-001 (VAPID inconsistente en admin/page.js).
- Reconsultar Cloudinary #392411 (a partir del 2026-10-18).
- Backlog: sistema simple de promociones en CartSidebar (DOC-008 seccion 9).

'@

    if (-not $bit.EndsWith("`n")) {
        $bit = $bit + "`r`n"
    }
    $bit = $bit + $entrada
    [System.IO.File]::WriteAllText($bitacoraPath, $bit, (New-Object System.Text.UTF8Encoding $false))
    Write-Host '  [OK] Entrada de S19 agregada' -ForegroundColor Green
}

# Verificar
$bitChk = [System.IO.File]::ReadAllText($bitacoraPath)
if ($bitChk.Contains('## 2026-10-16 (Sesion 19')) {
    Write-Host '  [VERIFY OK] BITACORA contiene S19' -ForegroundColor Green
} else {
    Write-Host '  [VERIFY FAIL] BITACORA no contiene S19' -ForegroundColor Red
    exit 1
}

# ---------------------------------------------------------------------------
# 2. STATUS.md
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '[2/3] Actualizando STATUS.md...' -ForegroundColor Green

if (-not (Test-Path -LiteralPath $statusPath)) {
    Write-Host "  [ERROR] No existe: $statusPath" -ForegroundColor Red
    exit 1
}

$st = [System.IO.File]::ReadAllText($statusPath)

# 2a. Fecha de actualizacion (header)
$st = $st.Replace(
    '**Ultima actualizacion:** 2026-10-16 (fin Sesion 18)',
    '**Ultima actualizacion:** 2026-10-16 (fin Sesion 19)'
)
Write-Host '  [OK] Header actualizado' -ForegroundColor Green

# 2b. Proximos 3 pasos
$pasosOld = @'
1. **F2-12** - Regenerar par VAPID (verificar SEC-024 + BUG-001 antes)
2. **F2-14** - Guardar .env consolidado en Bitwarden
3. **F3-07** - Fix BUG-001 (VAPID inconsistente en admin/page.js)
'@

$pasosNew = @'
1. **F2-12** - Regenerar par VAPID (verificar SEC-024 + BUG-001 antes)
2. **F2-14** - Guardar .env consolidado en Bitwarden
3. **F3-07** - Fix BUG-001 (VAPID inconsistente en admin/page.js)

> **Nueva deuda S19:** los hashes de commits en docs son pre-reescritura.
> Ver nota en BITACORA (S19).
'@

# Normalizar para matchear
$stNorm  = $st.Replace("`r`n", "`n")
$oldNorm = $pasosOld.Replace("`r`n", "`n")

if ($stNorm.Contains($oldNorm)) {
    $stNorm = $stNorm.Replace($oldNorm, $pasosNew.Replace("`r`n", "`n"))
    $st = $stNorm.Replace("`n", "`r`n")
    Write-Host '  [OK] Proximos 3 pasos actualizados' -ForegroundColor Green
} else {
    Write-Host '  [WARN] No se encontro el bloque de proximos pasos' -ForegroundColor Yellow
}

# 2c. Agregar seccion al final de "Ultima actividad" (despues de S17)
$stChk = $st
if ($stChk.Contains('**2026-10-16 - Sesion 19 (ENV) - COMPLETA**')) {
    Write-Host '  [SKIP] S19 ya documentada en STATUS' -ForegroundColor Yellow
} else {
    $bloqueS19 = @'


---

**2026-10-16 - Sesion 19 (ENV) - COMPLETA**
- F2-11: rotacion completa de GA4 (2 sub-rotaciones).
  - GA4_API_SECRET: rotado + secret viejo revocado.
  - GA4_PRIVATE_KEY: rotado + key vieja revocada.
- SEC-023 cerrado: no era duplicado (coexistencia legitima).
- DOC-014 registrado: GA4 Service Account plomeria inerte.
- Correccion de autoria del historial Git: filter-repo (script 62).
  Todos los 333 commits firmados por Pedro J. Pirovani.
- Credenciales de push: eliminadas las ajenas. Solo gh:github.com:PanFree-Tech.
- Progress: F2 10/14 -> 11/14; global 70% -> 72%.
- Scripts 59, 60, 61a, 61b, 62, 63a, 63b agregados.
'@

    $st = $st + $bloqueS19
    [System.IO.File]::WriteAllText($statusPath, $st, (New-Object System.Text.UTF8Encoding $false))
    Write-Host '  [OK] Seccion S19 agregada al final' -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# 3. SISTEMA-DE-TRABAJO.md - regla 7.5
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '[3/3] Actualizando SISTEMA-DE-TRABAJO.md (regla 7.5)...' -ForegroundColor Green

if (-not (Test-Path -LiteralPath $sistemaPath)) {
    Write-Host "  [ERROR] No existe: $sistemaPath" -ForegroundColor Red
    exit 1
}

$sis = [System.IO.File]::ReadAllText($sistemaPath)

if ($sis.Contains('7.5 Manejo de secretos en el chat de IA')) {
    Write-Host '  [SKIP] Regla 7.5 ya existe' -ForegroundColor Yellow
} else {
    $marca = '## 8. Documentos de seguimiento'
    $regla = @'
### 7.5 Manejo de secretos en el chat de IA

- **Nunca pegar valores de secretos reales en el chat de la IA.**
  Aplica a: API keys, tokens, private keys, JWT secrets, contraseñas.
- Si se necesita validar que un valor esta bien cargado, verificar por
  **comportamiento** (que la app funcione), no por inspeccion directa del valor.
- Si se pega por error un secreto, **rotarlo inmediatamente** y documentar el
  incidente en la bitacora de la sesion.
- Motivo: los chats de IA quedan en logs de la plataforma (Anthropic, OpenAI,
  etc.), en el historial local, y en backups. Aunque se rote despues, la
  ventana de exposicion existe.

---

'@

    if ($sis.Contains($marca)) {
        $sis = $sis.Replace($marca, $regla + $marca)
        [System.IO.File]::WriteAllText($sistemaPath, $sis, (New-Object System.Text.UTF8Encoding $false))
        Write-Host '  [OK] Regla 7.5 agregada antes de seccion 8' -ForegroundColor Green
    } else {
        Write-Host '  [WARN] No se encontro la marca "## 8. Documentos de seguimiento"' -ForegroundColor Yellow
    }
}

# Verificar
$sisChk = [System.IO.File]::ReadAllText($sistemaPath)
if ($sisChk.Contains('7.5 Manejo de secretos en el chat de IA')) {
    Write-Host '  [VERIFY OK] Regla 7.5 presente' -ForegroundColor Green
} else {
    Write-Host '  [VERIFY FAIL] Regla 7.5 no aplicada' -ForegroundColor Red
    exit 1
}

# ---------------------------------------------------------------------------
# Resumen
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 63b COMPLETADO' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Estado del working tree:' -ForegroundColor Yellow
git status --short
Write-Host ''
Write-Host 'Siguiente paso: commitear todo el cierre con:' -ForegroundColor Yellow
Write-Host '  git add .' -ForegroundColor White
Write-Host '  git commit -m "docs(session): cerrar sesion 19 (ENV) - rotacion GA4 + correccion de autoria"' -ForegroundColor White
Write-Host '  git push origin main' -ForegroundColor White
Write-Host ''