# ============================================================================
# 61a-documentar-f2-11.ps1
# ----------------------------------------------------------------------------
# Documenta el cierre de F2-11 (rotacion completa de GA4).
# Parte A: crea el doc de auditoria + actualiza ROTACION-CLAVES.md.
#
# Idempotente. No commitea. Solo aplica cambios al working tree.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/docs/61a-documentar-f2-11.ps1
# ============================================================================

$ErrorActionPreference = 'Stop'

$repoRoot    = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$docPath     = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial\36-f2-11-rotar-ga4.md'
$rotPath     = Join-Path $repoRoot 'docs\operations\ROTACION-CLAVES.md'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 61a - Documentar F2-11 (rotacion GA4) - Parte A' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

# ---------------------------------------------------------------------------
# 1. Crear doc 36-f2-11-rotar-ga4.md
# ---------------------------------------------------------------------------

if (Test-Path -LiteralPath $docPath) {
    Write-Host "[SKIP] Ya existe: $docPath" -ForegroundColor Yellow
} else {

    Write-Host "[1/2] Creando doc de auditoria..." -ForegroundColor Green

    $lineas = New-Object System.Collections.Generic.List[string]

    $lineas.Add('# F2-11: Rotacion de GA4') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('**Fecha:** 2026-10-16 (S19)') | Out-Null
    $lineas.Add('**Estado:** Cerrado') | Out-Null
    $lineas.Add('**Tarea:** F2-11') | Out-Null
    $lineas.Add('**Hallazgos:** SEC-023 (cerrado), DOC-014 (nuevo)') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('---') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('## 1. Contexto') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('SEC-023 reportaba "GA4 con dos juegos de credenciales coexistiendo en') | Out-Null
    $lineas.Add('Vercel". Antes de rotar habia que auditar cual de los dos grupos') | Out-Null
    $lineas.Add('estaba realmente en uso.') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('Auditoria (scripts 59 y 60):') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('- Script 59: 18 coincidencias de variables GA4 en src/.') | Out-Null
    $lineas.Add('- Script 60: lectura de los 3 archivos consumidores.') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('**Resultado: no era duplicado.** Los dos grupos sirven propositos') | Out-Null
    $lineas.Add('distintos:') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('| Grupo | Variables | Consumidor | Uso real |') | Out-Null
    $lineas.Add('|---|---|---|---|') | Out-Null
    $lineas.Add('| A - Service Account | GA4_PROJECT_ID, GA4_PRIVATE_KEY, GA4_CLIENT_EMAIL, GA_PROPERTY_ID | admin/ga-metrics/route.js | **Plomeria inerte** (solo logger.log, no llama a Data API) |') | Out-Null
    $lineas.Add('| B - Measurement Protocol | GA4_API_SECRET | ga4/measurement/route.js | **Activo** (envia eventos server-side) |') | Out-Null
    $lineas.Add('| Contexto | NEXT_PUBLIC_GA_MEASUREMENT_ID | ga4/measurement/route.js + GAScript.jsx | Publico, no es secreto |') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('Conclusion: SEC-023 no era un hallazgo de seguridad real. Ambos') | Out-Null
    $lineas.Add('grupos se conservan (el Grupo A por decision del responsable, ver') | Out-Null
    $lineas.Add('DOC-014). Solo el Grupo B requeria rotacion.') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('---') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('## 2. Inventario de secretos') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('| Variable | Tipo | Se rota | Valor legacy recuperable |') | Out-Null
    $lineas.Add('|---|---|---|---|') | Out-Null
    $lineas.Add('| GA4_PROJECT_ID | Identificador | No | N/A |') | Out-Null
    $lineas.Add('| GA4_CLIENT_EMAIL | Identificador | No | N/A |') | Out-Null
    $lineas.Add('| GA_PROPERTY_ID | Identificador | No | N/A |') | Out-Null
    $lineas.Add('| NEXT_PUBLIC_GA_MEASUREMENT_ID | Identificador publico | No | N/A |') | Out-Null
    $lineas.Add('| GA4_API_SECRET | Secreto | **Si** | Si |') | Out-Null
    $lineas.Add('| GA4_PRIVATE_KEY | Secreto | **Si** | **No** (Google no lo expone post-creacion) |') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('---') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('## 3. Rotacion 1: GA4_API_SECRET') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('**Motivo:** rotacion periodica pendiente desde S18 + exposicion') | Out-Null
    $lineas.Add('accidental en chat durante la auditoria de S19.') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('**Procedimiento:**') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('1. GA4 Admin -> Recogida y modificacion de datos -> Flujos de datos') | Out-Null
    $lineas.Add('   -> panfree.fit -> Secretos de la API de Measurement Protocol -> Crear.') | Out-Null
    $lineas.Add('2. Apodo: panfree-system-2026-10-16.') | Out-Null
    $lineas.Add('3. Actualizar GA4_API_SECRET en Vercel (Production + Preview).') | Out-Null
    $lineas.Add('4. Actualizar .env.local.') | Out-Null
    $lineas.Add('5. Redeploy.') | Out-Null
    $lineas.Add('6. Verificar con POST a /api/ga4/measurement (debug: true).') | Out-Null
    $lineas.Add('7. Revocar el secret viejo en GA4 Admin.') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('**Verificacion:**') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('```') | Out-Null
    $lineas.Add('{') | Out-Null
    $lineas.Add('  "success": true,') | Out-Null
    $lineas.Add('  "status": 200,') | Out-Null
    $lineas.Add('  "debug_validation": { "validationMessages": [] },') | Out-Null
    $lineas.Add('  "events_sent": 1') | Out-Null
    $lineas.Add('}') | Out-Null
    $lineas.Add('```') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('Sin errores de validacion de Google. El secret nuevo esta activo.') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('**Secret saliente (registrado en Bitwarden):**') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('- Valor: 9kBxpoPjR_aBo1H0-QyE8w') | Out-Null
    $lineas.Add('- Apodo GA4 Admin: panfree-measurement-protocol') | Out-Null
    $lineas.Add('- Creado: 2026-08-22 22:48:48') | Out-Null
    $lineas.Add('- Revocado: 2026-10-16') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('---') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('## 4. Rotacion 2: GA4_PRIVATE_KEY') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('**Motivo:** rotacion periodica obligatoria. El valor legacy es') | Out-Null
    $lineas.Add('irrecuperable (Google no lo expone post-creacion, Vercel no lo') | Out-Null
    $lineas.Add('muestra por estar marcado como Sensitive).') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('**Procedimiento:**') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('1. Google Cloud Console -> IAM y administracion -> Cuentas de servicio') | Out-Null
    $lineas.Add('   -> panfree-ga4-analytics-675@gen-lang-client-0840688115.iam.gserviceaccount.com') | Out-Null
    $lineas.Add('   -> Claves -> Agregar clave -> Crear clave nueva -> JSON.') | Out-Null
    $lineas.Add('2. Guardar el campo private_key del JSON en Bitwarden (GA4_PRIVATE_KEY).') | Out-Null
    $lineas.Add('3. Actualizar GA4_PRIVATE_KEY en Vercel (Production + Preview).') | Out-Null
    $lineas.Add('4. Actualizar .env.local.') | Out-Null
    $lineas.Add('5. Redeploy.') | Out-Null
    $lineas.Add('6. Revocar la key vieja en Google Cloud (identificar por Key ID).') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('**Verificacion:** no hay test empirico (el codigo actual no usa la') | Out-Null
    $lineas.Add('Data API). Verificado indirectamente: el build de Vercel paso') | Out-Null
    $lineas.Add('Ready y el endpoint /api/ga4/measurement sigue funcionando.') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('**Key saliente (registrado en Bitwarden):**') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('- Valor: IRRECUPERABLE') | Out-Null
    $lineas.Add('- Key ID: 45522eb71b92a80fcdb49c5ff073786d9b02496b') | Out-Null
    $lineas.Add('- Creada: 2026-08-31') | Out-Null
    $lineas.Add('- Revocada: 2026-10-16') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('**Key nueva (registrado en Bitwarden):**') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('- Nombre en Google Cloud: panfree-system-2026-10-16') | Out-Null
    $lineas.Add('- Activa desde: 2026-10-16') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('---') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('## 5. Estado de Bitwarden') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('Item: Bitwarden -> Organizacion PanFree -> Produccion -> "GA4 - Produccion"') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('| Campo personalizado | Tipo | Valor |') | Out-Null
    $lineas.Add('|---|---|---|') | Out-Null
    $lineas.Add('| GA4_PROJECT_ID | Texto | gen-lang-client-0840688115 |') | Out-Null
    $lineas.Add('| GA4_CLIENT_EMAIL | Texto | panfree-ga4-analytics-675@gen-lang-client-0840688115.iam.gserviceaccount.com |') | Out-Null
    $lineas.Add('| GA4_PRIVATE_KEY | Oculto | (nueva key activa) |') | Out-Null
    $lineas.Add('| GA_PROPERTY_ID | Texto | 550437019 |') | Out-Null
    $lineas.Add('| GA4_API_SECRET | Oculto | (nuevo secret activo) |') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('Nota: incluye el historial de las 2 rotaciones con los valores') | Out-Null
    $lineas.Add('salientes (uno recuperable, uno no).') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('---') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('## 6. Hallazgos') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('**SEC-023** (Abierto desde S18):') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('Cerrado en S19. **No era un duplicado.** Ambos grupos coexisten') | Out-Null
    $lineas.Add('legitimamente: Service Account para lectura (inerte hoy) y') | Out-Null
    $lineas.Add('Measurement Protocol para envio (activo).') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('**DOC-014** (nuevo en S19):') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('"GA4 Service Account es plomeria inerte". El endpoint') | Out-Null
    $lineas.Add('admin/ga-metrics/route.js carga las 4 variables del Service Account') | Out-Null
    $lineas.Add('pero no las usa: calcula metricas unicamente desde la tabla') | Out-Null
    $lineas.Add('pedidos de Supabase. Decision: conservar el Service Account por') | Out-Null
    $lineas.Add('si se implementa la Data API en el futuro. Revision futura:') | Out-Null
    $lineas.Add('2027-04-16.') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('---') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('## 7. Referencias') | Out-Null
    $lineas.Add('') | Out-Null
    $lineas.Add('- Script 59: scripts/docs/59-auditar-ga4.ps1') | Out-Null
    $lineas.Add('- Script 60: scripts/docs/60-leer-endpoints-ga4.ps1') | Out-Null
    $lineas.Add('- Script 61a: scripts/docs/61a-documentar-f2-11.ps1') | Out-Null
    $lineas.Add('- Tracking: docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md') | Out-Null
    $lineas.Add('- Bitwarden: item "GA4 - Produccion"') | Out-Null
    $lineas.Add('- Endpoint: src/app/api/ga4/measurement/route.js') | Out-Null
    $lineas.Add('- Endpoint que NO la usa: src/app/api/admin/ga-metrics/route.js') | Out-Null
    $lineas.Add('') | Out-Null

    $contenidoFinal = ($lineas -join "`r`n") + "`r`n"
    [System.IO.File]::WriteAllText($docPath, $contenidoFinal, (New-Object System.Text.UTF8Encoding $false))

    Write-Host "      OK: $docPath" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# 2. Actualizar ROTACION-CLAVES.md (agregar secciones S18 + S19)
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '[2/2] Actualizando ROTACION-CLAVES.md...' -ForegroundColor Green

if (-not (Test-Path -LiteralPath $rotPath)) {
    Write-Host "[ERROR] No existe: $rotPath" -ForegroundColor Red
    exit 1
}

$rot = [System.IO.File]::ReadAllText($rotPath)

# Verificar idempotencia: si ya tiene S19, no hacer nada
if ($rot.Contains('Estado de Bitwarden al cierre de S19')) {
    Write-Host "[SKIP] ROTACION-CLAVES.md ya tiene la seccion S19" -ForegroundColor Yellow
} else {

    # Contenido a agregar al final (S18 + S19)
    $appendLineas = New-Object System.Collections.Generic.List[string]

    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('---') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('## Estado de Bitwarden al cierre de S18 (2026-10-16)') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('### Cambios respecto a S17') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('En S18 no se roto ninguna key nueva. Se auditoron y eliminaron:') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('- 13 APIs IA secundarias (DOC-013).') | Out-Null
    $appendLineas.Add('- 3 secrets internos: CRON_SECRET, WEBHOOK_SECRET, REVALIDATE_SECRET (DOC-012).') | Out-Null
    $appendLineas.Add('- 1 variable basura: NEXT_PUBLIC_UPLOAD_PRESETNEXT_PUBLIC_UPLOAD_PRESET (SEC-022).') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('### Items completos (4/12)') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('| # | Item | Estado | Fecha | Notas |') | Out-Null
    $appendLineas.Add('|---|---|---|---|---|') | Out-Null
    $appendLineas.Add('| 1 | Supabase - Produccion | OK | 2026-10-15 (S15) | sb_publishable_/sb_secret_ + JWT rotada |') | Out-Null
    $appendLineas.Add('| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S16) | 1 key rotada + 3 huerfanas revocadas. Ticket #392411 abierto |') | Out-Null
    $appendLineas.Add('| 3 | Gemini - Produccion | OK | 2026-10-15 (S15) | Key rotada + 3 huerfanas eliminadas |') | Out-Null
    $appendLineas.Add('| 4 | Resend - Produccion | OK | 2026-10-15 (S16) | Migrado [C]->[S], dominio via Claim, key con scope minimo |') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('### Items pendientes (8/12)') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('| # | Item | Estado | Bloquea rotacion |') | Out-Null
    $appendLineas.Add('|---|---|---|---|') | Out-Null
    $appendLineas.Add('| 5 | Meta WhatsApp - Produccion | NO APLICA | DOC-005 |') | Out-Null
    $appendLineas.Add('| 6 | Twilio - Produccion | NO APLICA | DOC-005 |') | Out-Null
    $appendLineas.Add('| 7 | Instagram - Produccion | ROTO | DOC-006 |') | Out-Null
    $appendLineas.Add('| 8 | n8n - Produccion | NO APLICA | DOC-009 (plomeria inerte) |') | Out-Null
    $appendLineas.Add('| 9 | GA4 - Produccion | Pendiente | F2-11 |') | Out-Null
    $appendLineas.Add('| 10 | Clarity - Produccion | Pendiente | (no bloquea rotacion) |') | Out-Null
    $appendLineas.Add('| 11 | VAPID - Produccion | Pendiente | F2-12 |') | Out-Null
    $appendLineas.Add('| 12 | Secrets internos - Produccion | ELIMINADOS | DOC-012 (S18) |') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('---') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('## Estado de Bitwarden al cierre de S19 (2026-10-16)') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('### Cambios respecto a S18') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('En S19 se completo la rotacion de GA4 (F2-11), con 2 sub-rotaciones:') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('- GA4_API_SECRET: rotado (exposicion accidental + pendiente desde S18).') | Out-Null
    $appendLineas.Add('- GA4_PRIVATE_KEY: rotado (obligatorio; valor legacy irrecuperable).') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('Se creo el item "GA4 - Produccion" con 5 campos personalizados y nota') | Out-Null
    $appendLineas.Add('con historial completo de rotaciones.') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('### Items completos (5/12)') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('| # | Item | Estado | Fecha | Notas |') | Out-Null
    $appendLineas.Add('|---|---|---|---|---|') | Out-Null
    $appendLineas.Add('| 1 | Supabase - Produccion | OK | 2026-10-15 (S15) | sb_publishable_/sb_secret_ + JWT rotada |') | Out-Null
    $appendLineas.Add('| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S16) | 1 key rotada + 3 huerfanas revocadas. Ticket #392411 abierto |') | Out-Null
    $appendLineas.Add('| 3 | Gemini - Produccion | OK | 2026-10-15 (S15) | Key rotada + 3 huerfanas eliminadas |') | Out-Null
    $appendLineas.Add('| 4 | Resend - Produccion | OK | 2026-10-15 (S16) | Migrado [C]->[S], dominio via Claim, key con scope minimo |') | Out-Null
    $appendLineas.Add('| 9 | **GA4 - Produccion** | **OK** | **2026-10-16 (S19)** | **2 rotaciones (API secret + private key). Legacy recuperable + irrecuperable documentados** |') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('### Items pendientes (7/12)') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('| # | Item | Estado | Bloquea rotacion |') | Out-Null
    $appendLineas.Add('|---|---|---|---|') | Out-Null
    $appendLineas.Add('| 5 | Meta WhatsApp - Produccion | NO APLICA | DOC-005 |') | Out-Null
    $appendLineas.Add('| 6 | Twilio - Produccion | NO APLICA | DOC-005 |') | Out-Null
    $appendLineas.Add('| 7 | Instagram - Produccion | ROTO | DOC-006 |') | Out-Null
    $appendLineas.Add('| 8 | n8n - Produccion | NO APLICA | DOC-009 |') | Out-Null
    $appendLineas.Add('| 10 | Clarity - Produccion | Pendiente | (no bloquea rotacion) |') | Out-Null
    $appendLineas.Add('| 11 | VAPID - Produccion | Pendiente | F2-12 |') | Out-Null
    $appendLineas.Add('| 12 | Secrets internos - Produccion | ELIMINADOS | DOC-012 (S18) |') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('### Hallazgo SEC-020') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('Sigue abierto. Se cierra cuando los items realmente rotables') | Out-Null
    $appendLineas.Add('estan completos: GA4, Clarity, VAPID.') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('### Deuda tecnica al cierre de S19') | Out-Null
    $appendLineas.Add('') | Out-Null
    $appendLineas.Add('- Migrar @supabase/auth-helpers-nextjs -> @supabase/ssr.') | Out-Null
    $appendLineas.Add('- Sistema simple de promociones en CartSidebar (DOC-008 seccion 9).') | Out-Null
    $appendLineas.Add('- Ocultar la seccion Marketing del menu admin.') | Out-Null
    $appendLineas.Add('- Limpieza de la seccion Marketing (~5.500-6.500 lineas, DOC-008).') | Out-Null

    $appendTexto = ($appendLineas -join "`r`n")

    # Asegurar newline al final del archivo actual antes de concatenar
    if (-not $rot.EndsWith("`n")) {
        $rot = $rot + "`r`n"
    }

    $rotNuevo = $rot + $appendTexto
    [System.IO.File]::WriteAllText($rotPath, $rotNuevo, (New-Object System.Text.UTF8Encoding $false))

    Write-Host "      OK: se agregaron las secciones S18 + S19" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Verificacion
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '--- Verificacion ---' -ForegroundColor Cyan

if (Test-Path -LiteralPath $docPath) {
    $tam = (Get-Item $docPath).Length
    Write-Host "  [OK] $docPath ($tam bytes)" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] $docPath no existe" -ForegroundColor Red
}

$rotCheck = [System.IO.File]::ReadAllText($rotPath)
if ($rotCheck.Contains('Estado de Bitwarden al cierre de S18')) {
    Write-Host "  [OK] ROTACION-CLAVES.md contiene seccion S18" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] ROTACION-CLAVES.md no contiene seccion S18" -ForegroundColor Red
}

if ($rotCheck.Contains('Estado de Bitwarden al cierre de S19')) {
    Write-Host "  [OK] ROTACION-CLAVES.md contiene seccion S19" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] ROTACION-CLAVES.md no contiene seccion S19" -ForegroundColor Red
}

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 61a COMPLETADO' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Siguiente: ejecutar 61b (tracking + PLAN + STATUS + .env.example).' -ForegroundColor Yellow
Write-Host ''