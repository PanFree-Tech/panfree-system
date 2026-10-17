# scripts/docs/96-cierre-s27.ps1
# Cierre documental de la Sesion 27 (BUG-003)
# Generado: 2026-10-17
# Regla: Idempotente, UTF8 sin BOM, ASCII puro (no usar caracteres especiales).

$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path

# --- 1. Actualizar tracking (BUG-003) ---
# La tabla tiene 6 columnas: ID | Titulo | Fase | Prioridad | Estado | Commit
# Hay que respetar la estructura. Reemplazo la fila completa.
$trackingPath = Join-Path $root 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
if (Test-Path $trackingPath) {
    $content = [System.IO.File]::ReadAllText($trackingPath, [System.Text.UTF8Encoding]::new($false))
    $oldRow = "| BUG-003 | diptico/[codigo] usa .eq('activo') en vez de is_active | F3 | P3 | Abierto | - |"
    $newRow = "| BUG-003 | diptico/[codigo] usa .eq('activo') en vez de is_active | F3 | P3 | Cerrado (S27, PR #25) | 168d1d54 |"
    if ($content.Contains($oldRow)) {
        $content = $content.Replace($oldRow, $newRow)
        [System.IO.File]::WriteAllText($trackingPath, $content, [System.Text.UTF8Encoding]::new($false))
        Write-Host "[OK] Tracking actualizado (BUG-003 cerrado)."
    } else {
        Write-Host "[SKIP] Tracking no tiene la fila esperada de BUG-003 (ya actualizado o formato distinto)."
    }
} else {
    Write-Warning "[WARN] No se encontro tracking en $trackingPath"
}

# --- 2. Actualizar STATUS.md ---
$statusPath = Join-Path $root 'docs\STATUS.md'
if (Test-Path $statusPath) {
    $content = [System.IO.File]::ReadAllText($statusPath, [System.Text.UTF8Encoding]::new($false))

    if ($content -notmatch 'Sesion 27 \(BUG-003\)') {
        # Quitar linea de BUG-003 de "Proximos 3 pasos"
        $content = $content -replace '1\.\s*\*\*BUG-003\*\*.*\r?\n', ''

        # Insertar bloque S27 al inicio de "5. Ultima actividad"
        $s27Block = "**2026-10-17 - Sesion 27 (BUG-003) - COMPLETA**`r`n" +
                    "- BUG-003 cerrado end-to-end. Fix .eq(''activo'') -> .eq(''is_active'') en diptico/[codigo]/page.js:101 (PR #25, squash 168d1d54).`r`n" +
                    "- Validado en DB: columna is_active (boolean) existe, hay 12 productos activos.`r`n" +
                    "- Validado en Produccion: alias de Vercel apunta al deploy correcto.`r`n" +
                    "- Smoke test OK: 4 productos relacionados renderizados en /diptico/A7K3P9.`r`n" +
                    "- Primer PR mergeado con enforce_admins: true.`r`n" +
                    "- Hallazgos colaterales: SEC-025, BUG-0XX, BUG-0YY.`r`n`r`n"

        if ($content -match '(## 5\. Ultima actividad\r?\n)') {
            $content = $content -replace '(## 5\. Ultima actividad\r?\n)', ('$1' + "`r`n" + $s27Block)
            [System.IO.File]::WriteAllText($statusPath, $content, [System.Text.UTF8Encoding]::new($false))
            Write-Host "[OK] STATUS.md actualizado."
        } else {
            Write-Warning "[WARN] No se encontro seccion '5. Ultima actividad' en STATUS.md"
        }
    } else {
        Write-Host "[SKIP] STATUS.md ya tiene entrada de S27 (idempotente)."
    }
} else {
    Write-Warning "[WARN] No se encontro STATUS.md"
}

# --- 3. Actualizar BITACORA.md ---
$bitacoraPath = Join-Path $root 'docs\BITACORA.md'
if (Test-Path $bitacoraPath) {
    $content = [System.IO.File]::ReadAllText($bitacoraPath, [System.Text.UTF8Encoding]::new($false))

    if ($content -notmatch 'Sesion 27 \(BUG-003\)') {
        $bitacoraBlock = "`r`n" +
                         "**2026-10-17 - Sesion 27 (BUG-003) - COMPLETA**`r`n" +
                         "**Duracion:** ~2 horas`r`n" +
                         "**Objetivo:** Resolver BUG-003 y validar el flujo PR/CI post-auditoria.`r`n`r`n" +
                         "**Completado:**`r`n" +
                         "- Fix de 1 linea en page.js (.eq(''activo'') -> .eq(''is_active'')).`r`n" +
                         "- PR #25 creado y mergeado (squash 168d1d54) con CI 5/5 verde.`r`n" +
                         "- Base de datos validada: columna is_active existe y hay 12 productos activos.`r`n" +
                         "- Smoke test exitoso en produccion (/diptico/A7K3P9) con 4 productos renderizados.`r`n" +
                         "- Hallazgos colaterales: SEC-025 (permisos excesivos anon en productos), BUG-0XX (tipo_regalo inexistente), BUG-0YY (falta validar fecha_expiracion).`r`n`r`n" +
                         "**Hallazgos cerrados:**`r`n" +
                         "- BUG-003: Query de relacionados usa columna incorrecta.`r`n`r`n" +
                         "**Hallazgos nuevos (backlog):**`r`n" +
                         "- SEC-025: GRANT excesivo de anon en tabla productos.`r`n" +
                         "- BUG-0XX: page.js referencia codigoData.tipo_regalo (columna no existe).`r`n" +
                         "- BUG-0YY: page.js no chequea fecha_expiracion antes de canjear.`r`n`r`n" +
                         "**Proxima sesion (S28):**`r`n" +
                         "- Chore de hardcodes (SEC-015/016/017) y limpieza de GRANTs (SEC-025).`r`n`r`n" +
                         "---`r`n"

        $content = $content.TrimEnd() + $bitacoraBlock
        [System.IO.File]::WriteAllText($bitacoraPath, $content, [System.Text.UTF8Encoding]::new($false))
        Write-Host "[OK] BITACORA.md actualizado."
    } else {
        Write-Host "[SKIP] BITACORA.md ya tiene entrada de S27 (idempotente)."
    }
} else {
    Write-Warning "[WARN] No se encontro BITACORA.md"
}

Write-Host "[OK] Cierre documental S27 completado."