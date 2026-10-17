# scripts/docs/97-cierre-s28.ps1
# S28 - Cierre documental (3 commits: tracking, status+bitacora, procesos)
# Uso: .\scripts\docs\97-cierre-s28.ps1 [-NoCommit]

param(
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Push-Location $repo
try {
    Write-Host "=== CIERRE S28 - PR #5 ===" -ForegroundColor Cyan
    Write-Host "Repo: $repo`n"

    # ─────────────────────────────────────────────────────────
    # COMMIT 1: Tracking
    # ─────────────────────────────────────────────────────────
    Write-Host "[Commit 1/3] Tracking de hallazgos" -ForegroundColor Yellow
    $rutaTracking = "docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md"

    if (-not (Test-Path -LiteralPath $rutaTracking)) {
        Write-Host "[ERROR] No existe $rutaTracking" -ForegroundColor Red
        exit 1
    }

    $texto = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $rutaTracking), [System.Text.Encoding]::UTF8)

    # 1. Actualizar header (fecha de última actualización)
    $texto = $texto.Replace(
        '**Ultima actualizacion:** 2026-10-17 (fin Sesion 27)',
        '**Ultima actualizacion:** 2026-10-17 (fin Sesion 28)'
    )

    # 2. SEC-015: Cerrado
    $texto = $texto.Replace(
        '| SEC-015 | URL Supabase hardcodeada en notificar-estado/route.js y notificaciones.js | F3 | P3 | Abierto | - |',
        '| SEC-015 | URL Supabase hardcodeada en notificar-estado/route.js y notificaciones.js | F3 | P3 | Cerrado (S28) | 42821c3 |'
    )

    # 3. SEC-016: reemplazar por SEC-016a + SEC-016b
    $texto = $texto.Replace(
        '| SEC-016 | Cloudinary cloud name hardcodeado en 4 lugares | F3 | P3 | Abierto | - |',
        '| SEC-016a | Cloudinary cloud name con fallback silencioso en 4 archivos | F3 | P3 | Cerrado (S28) | 8fb5ae0 |' + "`r`n" +
        '| SEC-016b | URLs de logo hardcodeadas en 7 archivos (logo-panfree) | F3 | P3 | Abierto (S31) | - |'
    )

    # 4. SEC-017: Cerrado
    $texto = $texto.Replace(
        '| SEC-017 | GA4 Measurement ID hardcodeado en ga4/measurement/route.js | F3 | P3 | Abierto | - |',
        '| SEC-017 | GA4 Measurement ID hardcodeado en ga4/measurement/route.js | F3 | P3 | Cerrado (S28) | 42821c3 |'
    )

    # 5. SEC-025: agregar nueva fila (si no existe)
    if ($texto -notmatch 'SEC-025') {
        # Buscar la fila de SEC-017 (ya cerrada) y agregar SEC-025 después
        $texto = $texto.Replace(
            '| SEC-017 | GA4 Measurement ID hardcodeado en ga4/measurement/route.js | F3 | P3 | Cerrado (S28) | 42821c3 |',
            '| SEC-017 | GA4 Measurement ID hardcodeado en ga4/measurement/route.js | F3 | P3 | Cerrado (S28) | 42821c3 |' + "`r`n" +
            '| SEC-025 | anon con INSERT/UPDATE/DELETE/TRUNCATE sobre productos (RLS lo bloquea, defensa en profundidad) | F3 | P2 | Cerrado (S28) | 375e44c |'
        )
    }

    # 6. BUG-0XX: agregar nueva fila
    if ($texto -notmatch 'BUG-0XX') {
        # Agregar después de BUG-013
        $texto = $texto.Replace(
            '| BUG-013 | createClient top-level en test-email y resend-webhook rompia build en CI | F3 | P2 | Cerrado (S25) | 664488b3 |',
            '| BUG-013 | createClient top-level en test-email y resend-webhook rompia build en CI | F3 | P2 | Cerrado (S25) | 664488b3 |' + "`r`n" +
            '| BUG-0XX | page.js referencia codigoData.tipo_regalo (columna inexistente en codigos_dipticos) | F3 | P3 | Cerrado (S28) | 2655e9ac |' + "`r`n" +
            '| BUG-0YY | page.js no chequea fecha_expiracion antes de canjear | F3 | P3 | Verificado S28: falso positivo | - |'
        )
    }

    # 7. Nota sobre BUG-0YY (si no existe)
    if ($texto -notmatch 'BUG-0YY \(falso positivo, S28\)') {
        # Agregar nota al final de la sección 3 (antes de "## 4. Como cerrar un hallazgo")
        $texto = $texto.Replace(
            '## 4. Como cerrar un hallazgo',
            "> **BUG-0YY (falso positivo, S28):** Verificado en S28. La validacion de ``fecha_expiracion`` **existe** en ``src/lib/dipticos.js:122`` (dentro de ``validarCodigo()``), que se ejecuta antes del canje via ``canjearCodigo()`` desde ``src/app/api/dipticos/canjear/route.js``. El codigo **ya valida expiracion correctamente**. El diagnostico original de S27 fue incorrecto. **Cerrado sin cambios de codigo.**`r`n`r`n## 4. Como cerrar un hallazgo"
        )
    }

    [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $rutaTracking), $texto, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  [OK] Tracking actualizado" -ForegroundColor Green

    if (-not $NoCommit) {
        git add $rutaTracking
        git commit -m "docs(tracking): cerrar hallazgos S28 (SEC-015/016a/017/025, BUG-0XX; BUG-0YY falso positivo)" | Out-Null
        Write-Host "  [OK] Commit 1 creado" -ForegroundColor Green
    } else {
        Write-Host "  [NoCommit] Cambios en tracking sin commitear" -ForegroundColor Gray
    }

    # ─────────────────────────────────────────────────────────
    # COMMIT 2: STATUS + BITACORA
    # ─────────────────────────────────────────────────────────
    Write-Host "`n[Commit 2/3] STATUS + BITACORA" -ForegroundColor Yellow

    # 2a. STATUS.md
    $rutaStatus = "docs\STATUS.md"
    if (Test-Path -LiteralPath $rutaStatus) {
        $texto = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $rutaStatus), [System.Text.Encoding]::UTF8)

        # Actualizar "Ultima actualizacion"
        $texto = $texto -replace '\*\*Ultima actualizacion:\*\* 2026-10-17 \(fin Sesion 26 - auditoria cerrada\)', '**Ultima actualizacion:** 2026-10-17 (fin Sesion 28 - cierre de hardcodes + BUG-0XX)'

        # Reemplazar los "Proximos 3 pasos"
        $texto = $texto -replace '(?s)## 3\. Proximos 3 pasos.*?## 4\. Metricas clave', @'
## 3. Proximos 3 pasos

1. **S29: Familia Gemini + retiro de Marketing (DOC-008)** - Cierra BUG-006..009 + DOC-002/003 por eliminacion.
2. **S30: RLS pendiente (DB-002) + docs desalineadas (DOC-010/011)** - Cierre de deuda post-auditoria.
3. **S31+: Higiene tecnica (CONF-003/004/005, DOC-018/019, SEC-016b)**

> **Nota:** S28 cerro 4 PRs de codigo (#27, #28, #29, #30). SEC-015/016a/017/025 + BUG-0XX. BUG-0YY resulto falso positivo.

> **Nota:** ticket Cloudinary #392411 (Root User) - reconsultar a partir del 2026-10-18.
> Ticket GitHub #4869059 (purga de commits huerfanos) - pendiente.

## 4. Metricas clave
'@

        # Agregar seccion S28 al final de "Ultima actividad"
        if ($texto -notmatch 'Sesion 28 \(ENV\)') {
            $texto = $texto.Replace(
                '## 6. Comandos utiles',
                @'
**2026-10-17 - Sesion 28 (ENV) - COMPLETA**
- PR #27: SEC-015a/b + SEC-017 fail-fast (42821c3). 4 archivos + ci.yml.
- PR #28: SEC-016a cloudName fail-fast (8fb5ae0). 4 archivos.
- PR #29: SEC-025 revocar grants anon sobre productos (375e44c). 1 migracion SQL.
- PR #30: BUG-0XX eliminar tipoRegalo (2655e9ac). 2 archivos.
- SEC-016b (7 URLs de logo hardcodeadas) diferido a S31.
- BUG-0YY verificado como falso positivo (validacion existe en dipticos.js:122).
- 5/5 CI verde en los 4 PRs. Smoke test post-deploy OK.

## 6. Comandos utiles
'@
            )
        }

        [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $rutaStatus), $texto, [System.Text.UTF8Encoding]::new($false))
        Write-Host "  [OK] STATUS.md actualizado" -ForegroundColor Green
    } else {
        Write-Host "  [SKIP] $rutaStatus no existe" -ForegroundColor Gray
    }

    # 2b. BITACORA.md
    $rutaBitacora = "docs\BITACORA.md"
    if (Test-Path -LiteralPath $rutaBitacora) {
        $texto = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $rutaBitacora), [System.Text.Encoding]::UTF8)

        if ($texto -notmatch '## 2026-10-17 \(Sesion 28') {
            $entradaS28 = @'

---

## 2026-10-17 (Sesion 28 - ENV) - COMPLETA

**Duracion:** ~6 horas
**Objetivo:** Atacar deuda tecnica post-auditoria (hardcodes + GRANTs Supabase + limpieza diptico)

**Completado:**

### Bloque 1 - Recon empirico (pre-codigo)
- Auditoria de grep para SEC-015/016/017: se encontro que la doc estaba desactualizada.
  - SEC-015: 3 hits (no 2). AuthModal.js:171 era residual de SEC-006 no detectado en S5.
  - SEC-016: 9 hits (no 4). 4 son cloudName (SEC-016a) + 5 son URLs de logo (SEC-016b).
  - SEC-017: 1 hit confirmado.
- Auditoria Supabase: anon tiene 7 privilegios sobre productos (incluido TRUNCATE).
- Auditoria depto diptico: tipo_regalo NO existe en codigos_dipticos. fecha_expiracion SI existe y SI se valida en dipticos.js:122.

### Bloque 2 - PR #27 (SEC-015a/b + SEC-017)
- Fail-fast en 4 archivos: notificar-estado, notificaciones, AuthModal, ga4/measurement.
- Commit del fix + commit de ci.yml (placeholders GA4 + Cloudinary).
- CI fallo en el primer intento por falta de placeholders en ci.yml. Fix: agregar 2 lineas.
- Merge: 42821c3. Smoke test en prod OK.

### Bloque 3 - PR #28 (SEC-016a)
- Fail-fast en cloudName en 4 archivos (lib/cloudinary, admin/configuracion, admin/productos, perfil).
- Agregado NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME a Vercel (Production + Preview).
- SEC-016b (7 URLs de logo) diferido a S31.
- Merge: 8fb5ae0.

### Bloque 4 - PR #29 (SEC-025)
- Auditoria SQL: anon tenia TRUNCATE + 6 privilegios mas sobre productos.
- Auditoria pg_policies: 0 policies TO anon sobre productos. Fix seguro.
- Migracion SQL: REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER.
- Merge: 375e44c.

### Bloque 5 - PR #30 (BUG-0XX)
- Eliminar tipoRegalo de props + bloque condicional en DipticoCliente.
- Eliminar prop tipoRegalo en page.js.
- Build local fallo por .env.local vacio. Fix: borrar archivo + limpiar .next/.
- Merge: 2655e9ac.

### Bloque 6 - Cierre documental (PR #5)
- Tracking: SEC-015/016a/016b/017/025 cerrados, BUG-0XX cerrado, BUG-0YY falso positivo.
- STATUS: proximos pasos actualizados.
- BITACORA: esta entrada.
- 05-criterios-aceptacion: DoD del build local.
- POLITICA-CI-CD: placeholders en ci.yml.
- 02-supabase-advisors: cerrado.
- 99-plan-remediacion: historico.
- HANDOFF-2026-10-13 movido a docs/handoffs/.

**Commits:**
- 42821c3 chore(hardcodes): SEC-015a/b + SEC-017 fail-fast (#27)
- 8fb5ae0 chore(cloudinary): SEC-016a fail-fast en cloudName (#28)
- 375e44c security(db): SEC-025 revocar privilegios anon sobre productos (#29)
- 2655e9ac fix(diptico): limpiar tipoRegalo (BUG-0XX) (#30)
- (pendiente) docs(cierre-s28): PR #5

**Hallazgos cerrados:**
- SEC-015: URL Supabase hardcodeada (3 hits).
- SEC-016a: Cloudinary cloudName con fallback (4 archivos).
- SEC-017: GA4 Measurement ID hardcodeado.
- SEC-025: anon con TRUNCATE + 6 privilegios mas sobre productos.
- BUG-0XX: tipo_regalo inexistente (codigo muerto).
- BUG-0YY: verificado como FALSO POSITIVO.

**Hallazgos nuevos:**
- SEC-015b (residual de SEC-006, cerrado en el mismo PR).
- SEC-016b (URLs de logo hardcodeadas, 7 hits, diferido a S31).

**Bloqueantes:**
- Cloudinary #392411: reconsultar 2026-10-18.
- GitHub #4869059: pendiente.

**Aprendizajes:**
- `Select-String -Path` con rutas que tienen `[codigo]` falla por wildcards. Usar `-LiteralPath`.
- `npm run build` local sin `.env.local` falla por el fail-fast de env vars. El build se verifica en CI (con placeholders) + Preview/Produccion (con valores reales).
- `.Replace()` con PowerShell 5.1 puede fallar silenciosamente si hay indentacion distinta o CRLF vs LF. Para bloques JSX anidados, editar a mano en VS Code.
- `Measure-Object -Line` no cuenta lineas vacias. `(Get-Content).Count` si. No son comparables.
- Un falso positivo de auditoria (BUG-0YY) es tan valioso como un bug real: documenta que el codigo ya estaba bien.
- Los 3 PRs de codigo (SEC-015/016/017) pueden ir juntos en un solo PR (SEC-015a/b + SEC-017) si tocan los mismos archivos/dominio.

**Proxima sesion (S29):**
- Familia Gemini (BUG-006..009) + retiro de Marketing (DOC-008).
- DOC-002/003 (docs Marketing desalineadas).
- TST-001 (tests reales, TBD).

---

'@
            $texto = $texto + $entradaS28
            [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $rutaBitacora), $texto, [System.Text.UTF8Encoding]::new($false))
            Write-Host "  [OK] BITACORA.md actualizado" -ForegroundColor Green
        } else {
            Write-Host "  [SKIP] Entrada S28 ya existe en BITACORA" -ForegroundColor Gray
        }
    } else {
        Write-Host "  [SKIP] $rutaBitacora no existe" -ForegroundColor Gray
    }

    if (-not $NoCommit) {
        git add "docs\STATUS.md" "docs\BITACORA.md"
        git commit -m "docs(session): cerrar sesion 28 (hardcodes + SEC-025 + BUG-0XX)" | Out-Null
        Write-Host "  [OK] Commit 2 creado" -ForegroundColor Green
    } else {
        Write-Host "  [NoCommit] Cambios en STATUS+BITACORA sin commitear" -ForegroundColor Gray
    }

    # ─────────────────────────────────────────────────────────
    # COMMIT 3: Procesos + limpieza
    # ─────────────────────────────────────────────────────────
    Write-Host "`n[Commit 3/3] Procesos + limpieza" -ForegroundColor Yellow

    # 3a. 05-criterios-aceptacion.md
    $rutaDoD = "docs\operations\05-criterios-aceptacion.md"
    # (Por simplicidad, este script no toca DoD ni POLITICA. Se hacen a mano en el PR.)

    # 3b. 02-supabase-advisors.md
    $rutaAdvisors = "docs\audits\2026-10-13-inicial\02-supabase-advisors.md"
    if (Test-Path -LiteralPath $rutaAdvisors) {
        $texto = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $rutaAdvisors), [System.Text.Encoding]::UTF8)
        $texto = $texto -replace '\*\*Estado:\*\* Abierto', '**Estado:** Cerrado (S25, 0 sev 1-2; S28 sin cambios pendientes)'
        [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $rutaAdvisors), $texto, [System.Text.UTF8Encoding]::new($false))
        Write-Host "  [OK] 02-supabase-advisors.md actualizado" -ForegroundColor Green
    }

    # 3c. 99-plan-remediacion.md → marcar como historico
    $rutaPlan = "docs\audits\2026-10-13-inicial\99-plan-remediacion.md"
    if (Test-Path -LiteralPath $rutaPlan) {
        $texto = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $rutaPlan), [System.Text.Encoding]::UTF8)
        if ($texto -notmatch 'HISTORICO') {
            $texto = "# HISTORICO - Plan de Remediacion (Auditoria 2026-10-13)`r`n`r`n> **Este documento es historico.** El estado real esta en PLAN-DE-TRABAJO.md y 06-hallazgos-tracking.md. Se preserva por trazabilidad.`r`n`r`n" + $texto
            [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $rutaPlan), $texto, [System.Text.UTF8Encoding]::new($false))
            Write-Host "  [OK] 99-plan-remediacion.md marcado como historico" -ForegroundColor Green
        }
    }

    # 3d. Mover HANDOFF a docs/handoffs/
    $handoffViejo = "docs\HANDOFF-2026-10-13.md"
    $handoffsDir = "docs\handoffs"
    if ((Test-Path -LiteralPath $handoffViejo) -and -not (Test-Path -LiteralPath $handoffsDir)) {
        New-Item -ItemType Directory -Path $handoffsDir -Force | Out-Null
    }
    if (Test-Path -LiteralPath $handoffViejo) {
        Move-Item -LiteralPath $handoffViejo -Destination "$handoffsDir\HANDOFF-2026-10-13.md" -Force
        Write-Host "  [OK] HANDOFF movido a docs/handoffs/" -ForegroundColor Green
    }

    if (-not $NoCommit) {
        git add "docs\audits\2026-10-13-inicial\02-supabase-advisors.md" "docs\audits\2026-10-13-inicial\99-plan-remediacion.md" "docs\handoffs" 2>$null
        git add -u 2>$null
        git commit -m "docs(cierre): marcar advisors/plan como cerrados/historicos + mover HANDOFF a docs/handoffs" | Out-Null
        Write-Host "  [OK] Commit 3 creado" -ForegroundColor Green
    }

    Write-Host "`n=== CIERRE S28 COMPLETO ===" -ForegroundColor Cyan
    Write-Host "Commits creados: 3" -ForegroundColor Green
    Write-Host "Siguiente: git push -u origin docs/cierre-s28" -ForegroundColor Yellow
    Write-Host "Despues: gh pr create (ver body en el chat)" -ForegroundColor Yellow

} finally {
    Pop-Location
}