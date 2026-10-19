param([string]$RepoRoot = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
$ErrorActionPreference = 'Stop'
$BitacoraPath = Join-Path $RepoRoot 'docs\BITACORA.md'
if (-not (Test-Path -LiteralPath $BitacoraPath)) { Write-Error "No existe: $BitacoraPath"; exit 1 }
Write-Host "== 94b - Fix BITACORA.md ==" -ForegroundColor Cyan
Write-Host "Archivo: $BitacoraPath"
$lines = Get-Content -LiteralPath $BitacoraPath -Encoding UTF8
$orig = $lines -join "`n"

$idxS25 = @()
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^## 2026-10-17 \(Sesion 25 - ENV\) - COMPLETA$') { $idxS25 += $i }
}
Write-Host "  S25 en lineas: $($idxS25 -join ', ') (base 0)"
if ($idxS25.Count -eq 2) {
    $start = $idxS25[1]; $end = $lines.Count
    for ($i = $start + 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^## 2026-10-') { $end = $i; break }
    }
    Write-Host "  Eliminando lineas $start..$($end-1) ($($end-$start) lineas)"
    $before = if ($start -gt 0) { $lines[0..($start-1)] } else { @() }
    $after  = if ($end -lt $lines.Count) { $lines[$end..($lines.Count-1)] } else { @() }
    $lines = @($before) + @($after)
    Write-Host "  [OK] S25 duplicada eliminada" -ForegroundColor Green
} elseif ($idxS25.Count -eq 0) { Write-Host "  [WARN] No se encontro S25" -ForegroundColor Yellow } else { Write-Host "  [OK] Solo una S25" -ForegroundColor Green }

$txt = $lines -join "`r`n"

$s27 = @"

## 2026-10-17 (Sesion 27 - BUG-003) - COMPLETA

**Duracion:** ~2 horas
**Objetivo:** Resolver BUG-003 y validar el flujo PR/CI post-auditoria.

**Completado:**
- Fix de 1 linea en page.js (.eq(''activo'') -> .eq(''is_active'')).
- PR #25 creado y mergeado (squash 168d1d54) con CI 5/5 verde.
- Base de datos validada: columna is_active existe y hay 12 productos activos.
- Smoke test exitoso en produccion (/diptico/A7K3P9) con 4 productos renderizados.
- Hallazgos colaterales: SEC-025, BUG-0XX, BUG-0YY.

**Hallazgos cerrados:**
- BUG-003: Query de relacionados usa columna incorrecta.

**Hallazgos nuevos (backlog):**
- SEC-025: GRANT excesivo de anon en tabla productos.
- BUG-0XX: page.js referencia codigoData.tipo_regalo (columna no existe).
- BUG-0YY: page.js no chequea fecha_expiracion antes de canjear.

**Proxima sesion (S28):**
- Chore de hardcodes (SEC-015/016/017) y limpieza de GRANTs (SEC-025).
"@

$s29 = @"

## 2026-10-18 (Sesion 29) - COMPLETA

**Objetivo:** Fix vista disponibilidad + documentar modelo Made-To-Order.

**Completado:**
- Fix vista_disponibilidad_productos (migracion 2026-10-19-s29-fix-vista-disponibilidad.sql).
- BUSINESS-LOGIC.md: modelo Made-To-Order puro documentado (no stock fisico,
  catalogo no bloquea por falta de stock, checkout no valida stock).
- PR #33 mergeado (squash 76609dbe).

**Hallazgos cerrados:**
- Vista disponibilidad corregida.
"@

$s30 = @"

## 2026-10-19 (Sesion 30) - COMPLETA

**Objetivo:** Eliminar trigger de stock + documentar columnas informativas.

**Completado:**
- Trigger on_pedido_confirmado -> actualizar_stock_pedido() ELIMINADO.
  Motivo: bloqueaba pedidos sin stock fisico (contradice Made-To-Order)
  y causaba doble descuento al pasar de confirmado a entregado.
- Tabla stock_movimientos se mantiene (consulta admin), sin inserciones desde pedidos.
- stock_actual, production_capacity, current_orders documentadas como informativas.
- PR #34 mergeado (squash 0061bf47).
"@

if (-not $txt.Contains('(Sesion 27 - BUG-003)')) {
    $s28Header = '## 2026-10-17 (Sesion 28 - ENV) - COMPLETA'
    if ($txt.Contains($s28Header)) { $txt = $txt.Replace($s28Header, $s27.Trim() + "`r`n`r`n" + $s28Header); Write-Host "  [OK] S27 insertada antes de S28" -ForegroundColor Green }
}
if (-not $txt.Contains('(Sesion 29)')) { $txt = $txt.TrimEnd() + "`r`n" + $s29; Write-Host "  [OK] S29 al final" -ForegroundColor Green }
if (-not $txt.Contains('(Sesion 30)')) { $txt = $txt.TrimEnd() + "`r`n" + $s30; Write-Host "  [OK] S30 al final" -ForegroundColor Green }

$new = $txt -replace "`r`n", "`n"
if ($new -ne $orig) {
    $out = ($new -split "`n") -join "`r`n"
    [System.IO.File]::WriteAllText($BitacoraPath, $out, [System.Text.UTF8Encoding]::new($false))
    Write-Host "BITACORA.md actualizado." -ForegroundColor Cyan
} else { Write-Host "Sin cambios (idempotente)." -ForegroundColor Yellow }
