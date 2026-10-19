param([string]$RepoRoot = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
$ErrorActionPreference = 'Stop'
$StatusPath = Join-Path $RepoRoot 'docs\STATUS.md'
if (-not (Test-Path -LiteralPath $StatusPath)) { Write-Error "No existe: $StatusPath"; exit 1 }
Write-Host "== 94a - Fix STATUS.md ==" -ForegroundColor Cyan
Write-Host "Archivo: $StatusPath"
$txt = Get-Content -LiteralPath $StatusPath -Raw -Encoding UTF8
$orig = $txt

$oldHeader = '**Ultima actualizacion:** 2026-10-17 (fin Sesion 28 - cierre de hardcodes + BUG-0XX)'
$newHeader = '**Ultima actualizacion:** 2026-10-19 (fin Sesion 30 - trigger de stock eliminado + docs informativas)'
if ($txt.Contains($oldHeader)) { $txt = $txt.Replace($oldHeader, $newHeader); Write-Host "  [OK] Header a S30" -ForegroundColor Green } else { Write-Host "  [SKIP] Header" -ForegroundColor Yellow }

$oldPasos = @"
1. **S29: Familia Gemini + retiro de Marketing (DOC-008)** - Cierra BUG-006..009 + DOC-002/003 por eliminacion.
2. **S30: RLS pendiente (DB-002) + docs desalineadas (DOC-010/011)** - Cierre de deuda post-auditoria.
3. **S31+: Higiene tecnica (CONF-003/004/005, DOC-018/019, SEC-016b)**
"@
$newPasos = @"
1. **S31 (en curso): Retiro de Marketing (DOC-008) + Familia Gemini** - Cierra BUG-006..009, DOC-002/003/006, SEC-016b por eliminacion del modulo.
2. **S32: RLS pendiente (DB-002) + docs desalineadas (DOC-010/011)** - Cierre de deuda post-auditoria.
3. **S33+: Higiene tecnica (CONF-003/004/005, DOC-018/019) + TST-001 (tests reales)**
"@
if ($txt.Contains($oldPasos.Trim())) { $txt = $txt.Replace($oldPasos.Trim(), $newPasos.Trim()); Write-Host "  [OK] Seccion 3 actualizada" -ForegroundColor Green } else { Write-Host "  [SKIP] Seccion 3" -ForegroundColor Yellow }

$anchor6 = '## 6. Comandos utiles'
$newEntries = @"
**2026-10-18 - PR #32 (P0) - Checkout de invitados - COMPLETA**
- Fix P0: checkout roto para usuarios no autenticados (ventas perdidas).
- PR #32 mergeado (squash 3e5dfede).
- Hallazgo: no figuraba en sesiones previas; detectado y corregido en el mismo PR.

**2026-10-18 - Sesion 29 - Fix vista disponibilidad + BUSINESS-LOGIC - COMPLETA**
- Fix vista_disponibilidad_productos (migracion 2026-10-19-s29-fix-vista-disponibilidad.sql).
- BUSINESS-LOGIC.md documentado: modelo Made-To-Order puro (no stock fisico).
- Doc: docs/architecture/BUSINESS-LOGIC.md.
- PR #33 mergeado (squash 76609dbe).

**2026-10-19 - Sesion 30 - Trigger de stock eliminado - COMPLETA**
- Trigger on_pedido_confirmado -> actualizar_stock_pedido() ELIMINADO.
  Motivo: bloqueaba pedidos sin stock fisico (contradice Made-To-Order)
  y causaba doble descuento al pasar de confirmado a entregado.
- Tabla stock_movimientos se mantiene (consulta admin), pero sin inserciones desde pedidos.
- Columnas stock_actual, production_capacity, current_orders documentadas como informativas.
- PR #34 mergeado (squash 0061bf47).

"@
if ($txt.Contains($anchor6) -and -not $txt.Contains('PR #34 mergeado')) { $txt = $txt.Replace($anchor6, $newEntries + $anchor6); Write-Host "  [OK] Entradas S29/S30 + PR#32" -ForegroundColor Green } else { Write-Host "  [SKIP] Entradas S29/S30" -ForegroundColor Yellow }

$s25encurso = @"
**2026-10-17 - Sesion 25 (ENV) - EN CURSO**
- Recon S25: HEAD 4845a99e, tree limpio salvo script 84.
- F4-01 verificado: 0 .env en historial, .env.example intacto.
- F4-05 formalizado: package-lock.json trackeado desde S17 (f9b1f7ba).
- F4-06 reformulado a "No aplica": workflows solo usan GITHUB_TOKEN.
- F4-07 formalizado: ci.yml y security-scan.yml sin continue-on-error.
- F4-02: ticket #4869059 sigue esperando respuesta de soporte.
- Progreso: 81% -> 89% (42/47). F4: 0/8 -> 4/8 (+ 1 en curso).

"@
if ($txt.Contains($s25encurso.Trim())) { $txt = $txt.Replace($s25encurso.Trim(), ''); Write-Host "  [OK] S25 EN CURSO eliminada" -ForegroundColor Green } else { Write-Host "  [SKIP] S25 EN CURSO" -ForegroundColor Yellow }

$oldNota = '- Retiro de Marketing (DOC-008): sesion dedicada'
$newNota = '- Retiro de Marketing (DOC-008): **EN CURSO en S31** (2026-10-19)'
if ($txt.Contains($oldNota) -and -not $txt.Contains('EN CURSO en S31')) { $txt = $txt.Replace($oldNota, $newNota); Write-Host "  [OK] Nota S31 seccion 8" -ForegroundColor Green } else { Write-Host "  [SKIP] Nota S31" -ForegroundColor Yellow }

if ($txt -ne $orig) {
    [System.IO.File]::WriteAllText($StatusPath, $txt, [System.Text.UTF8Encoding]::new($false))
    Write-Host "STATUS.md actualizado." -ForegroundColor Cyan
} else { Write-Host "Sin cambios (idempotente)." -ForegroundColor Yellow }
