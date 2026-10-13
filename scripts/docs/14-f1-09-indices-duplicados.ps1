<#
.SYNOPSIS
    F1-09 - Eliminar indices duplicados en public.
.DESCRIPTION
    Genera la migracion SQL, el doc de auditoria, actualiza tracking,
    STATUS.md y BITACORA.md. Por defecto NO commitea.
.PARAMETER Commit
    Si se especifica, hace git add + commit + push al final.
.PARAMETER NoCommit
    Modo explicito sin commit (default).
.EXAMPLE
    .\14-f1-09-indices-duplicados.ps1
    .\14-f1-09-indices-duplicados.ps1 -Commit
#>
param(
    [switch]$Commit,
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'

# ─────────────────────────────────────────────────────────────
# Configuracion
# ─────────────────────────────────────────────────────────────
$repoRoot   = (Get-Location).Path
$fecha      = '2026-10-13'
$docPath    = "docs\audits\$fecha-inicial\16-f1-09-indices-duplicados.md"
$trackPath  = "docs\audits\$fecha-inicial\06-hallazgos-tracking.md"
$statusPath = "docs\STATUS.md"
$bitacPath  = "docs\BITACORA.md"
$migPath    = "supabase\migrations\$fecha-f1-09-indices-duplicados.sql"

function Write-Seccion($titulo) {
    Write-Host ''
    Write-Host ('=' * 64) -ForegroundColor Cyan
    Write-Host "  $titulo" -ForegroundColor Cyan
    Write-Host ('=' * 64) -ForegroundColor Cyan
}

function New-FileSi($ruta, $contenido, $sobrescribir = $false) {
    if ((Test-Path $ruta) -and -not $sobrescribir) {
        Write-Host "[SKIP] Ya existe: $ruta" -ForegroundColor Yellow
        return
    }
    $dir = Split-Path $ruta -Parent
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    $contenido | Set-Content -Path $ruta -Encoding UTF8
    Write-Host "[OK] Escrito: $ruta" -ForegroundColor Green
}

function Add-BloqueSi($ruta, $marcador, $bloque) {
    $txt = Get-Content $ruta -Raw
    if ($txt -match [regex]::Escape($marcador)) {
        Write-Host "[SKIP] Marcador ya presente en $ruta" -ForegroundColor Yellow
        return
    }
    Add-Content -Path $ruta -Value $bloque -Encoding UTF8
    Write-Host "[OK] Append a: $ruta" -ForegroundColor Green
}

Write-Host ''
Write-Host "F1-09 - Eliminar indices duplicados" -ForegroundColor White
Write-Host "Repo: $repoRoot" -ForegroundColor Gray
if ($Commit) { Write-Host "Modo: CON COMMIT" -ForegroundColor Magenta }
else         { Write-Host "Modo: SIN COMMIT (dry run)" -ForegroundColor Gray }

# ─────────────────────────────────────────────────────────────
# 1. Doc de auditoria
# ─────────────────────────────────────────────────────────────
Write-Seccion '1. Generando doc de auditoria'

$docLineas = @(
    '# F1-09 - Eliminar indices duplicados',
    '',
    '**Fecha:** 2026-10-13',
    '**Hallazgo:** DB-001i',
    '**Severidad:** Baja (higiene + espacio)',
    '**Estado:** Cerrado',
    '**Esfuerzo:** S (Small)',
    '',
    '---',
    '',
    '## Contexto',
    '',
    'Supabase Security Advisor reportaba indices duplicados en el esquema',
    '`public`. Durante F1-09 se hizo el inventario real con `pg_index` +',
    '`pg_get_indexdef`, se verifico que ningun indice a dropear respaldara',
    'una constraint (PK/UNIQUE/FK), y se aplico la consolidacion.',
    '',
    '---',
    '',
    '## Inventario real (pg_index)',
    '',
    'Se detectaron **9 grupos de duplicados exactos** (misma firma:',
    'tabla + metodo + columnas/expresion + orden + where).',
    '',
    '---',
    '',
    '## Los 9 DROP aplicados',
    '',
    '### Grupo A - Indices `idx_*` redundantes respecto a un UNIQUE hermano (7)',
    '',
    '| Tabla | DROP | Conservar (UNIQUE) |',
    '|---|---|---|',
    '| clientes | `idx_clientes_email` | `clientes_email_key` |',
    '| codigos_dipticos | `idx_codigos_dipticos_codigo` | `codigos_dipticos_codigo_key` |',
    '| compras | `idx_compras_numero` | `compras_numero_compra_key` |',
    '| cupones_descuento | `idx_cupones_codigo` | `cupones_descuento_codigo_key` |',
    '| pedidos | `idx_pedidos_numero` | `pedidos_numero_pedido_key` |',
    '| produccion | `idx_produccion_lote` | `produccion_numero_lote_key` |',
    '| productos | `idx_productos_slug` | `productos_slug_key` |',
    '',
    '**Razon:** el UNIQUE ya sirve como indice B-tree para busquedas por',
    'igualdad. El `idx_*` no-UNIQUE con la misma firma es 100% redundante.',
    '',
    '### Grupo B - Indices no-UNIQUE duplicados entre si (2)',
    '',
    '| Tabla | DROP | Conservar |',
    '|---|---|---|',
    '| notificaciones_admin | `idx_notificaciones_created` | `idx_notificaciones_admin_created_at` |',
    '| notificaciones_admin | `idx_notificaciones_leida` | `idx_notificaciones_admin_leido` |',
    '',
    '**Razon:** mismo `btree (created_at DESC)` y `btree (leido)`. Se conserva',
    'el que sigue la convencion `idx_<tabla_completa>_<columna>`; se dropea',
    'el de nombre inconsistente (legacy).',
    '',
    '---',
    '',
    '## Verificaciones previas (output real)',
    '',
    '### Verificacion 1 - Los 9 indices NO respaldan constraints',
    '',
    'Query: `pg_constraint` + `pg_class` filtrando por los 9 nombres.',
    '',
    'Resultado: **0 filas**. Ningun `DROP` afecta una PK/UNIQUE/FK.',
    '',
    '### Verificacion 2 - UNIQUE hermano presente (Grupo A)',
    '',
    'Query: `LEFT JOIN` entre los 7 indices a dropear y sus UNIQUE hermanos.',
    '',
    'Resultado: **7 filas**, todas con `diagnostico = UNIQUE equivalente (OK)`.',
    '',
    '### Verificacion 2b - Pares no-UNIQUE (Grupo B)',
    '',
    'Query: `pg_index` filtrando `notificaciones_admin` por los 4 indices.',
    '',
    'Resultado: **4 filas**, todas con `es_unico = false`. Confirma que los',
    'pares `(created_at DESC)` y `(leido)` son duplicados exactos entre',
    'no-UNIQUE, sin constraint detras.',
    '',
    '---',
    '',
    '## Casi-duplicados NO tocados (documentados para futuras sesiones)',
    '',
    '### a) recetas: prefijo de UNIQUE compuesto',
    '',
    '- `idx_recetas_version` -> `(producto_id, version)`',
    '- `recetas_producto_id_insumo_id_version_key` -> `(producto_id, insumo_id, version)` UNIQUE',
    '',
    '`idx_recetas_version` es prefijo del UNIQUE compuesto. Postgres puede',
    'usar el UNIQUE para queries que filtran `(producto_id, version)`. Es',
    'candidato a drop en una limpieza fina futura, pero requiere validar',
    'planes de query reales antes. **Fuera de scope de F1-09.**',
    '',
    '### b) push_subscriptions: dos UNIQUE con semantica distinta',
    '',
    '- `push_subscriptions_endpoint_key` -> `(endpoint)` UNIQUE',
    '- `push_subscriptions_user_endpoint_unique` -> `(user_id, endpoint)` UNIQUE',
    '',
    'No son duplicados exactos. El segundo permite el mismo `endpoint` para',
    'distintos `user_id`; el primero lo restringe globalmente. Es una',
    'inconsistencia de diseno, no un duplicado. **Fuera de scope de F1-09.**',
    '',
    '---',
    '',
    '## Por que NO se uso DROP INDEX CONCURRENTLY',
    '',
    'El SQL Editor de Supabase envuelve el `RUN` en una transaccion',
    'implicita. `CONCURRENTLY` no puede correr dentro de una transaccion.',
    'Las tablas afectadas son chicas (~16 kB por indice), el lock es de',
    'milisegundos. Se prefirio `DROP INDEX IF EXISTS` (sin CONCURRENTLY)',
    'para que el script corra sin fragmentar en 9 ejecuciones separadas.',
    '',
    '---',
    '',
    '## Rollback',
    '',
    'Cada `CREATE INDEX` para revertir esta documentado en:',
    '',
    '- `supabase/migrations/2026-10-13-f1-09-indices-duplicados.sql`',
    '  (seccion ROLLBACK, comentada).',
    '',
    'No se recomienda rollback: los indices dropeados eran redundantes.',
    '',
    '---',
    '',
    '## DoD (F1-09)',
    '',
    '- [x] Inventario real de `pg_index` analizado (9 grupos).',
    '- [x] Verificacion 1: 0 constraints respaldadas por los indices a dropear.',
    '- [x] Verificacion 2: 7 UNIQUE hermanos confirmados.',
    '- [x] Verificacion 2b: 2 pares no-UNIQUE confirmados.',
    '- [x] 9 `DROP INDEX IF EXISTS` aplicados.',
    '- [x] Casi-duplicados documentados (recetas, push_subscriptions).',
    '- [x] SQL versionado en `supabase/migrations/`.',
    '- [x] Tracking actualizado (DB-001i -> Cerrado).',
    '- [x] Doc de auditoria generado (este archivo).',
    '- [ ] Commit pusheado con `chore(db):`.',
    '',
    '---',
    '',
    '## Referencias',
    '',
    '- [DB-001i en tracking](./06-hallazgos-tracking.md)',
    '- [Advisors de Supabase](./02-supabase-advisors.md)',
    '- [Migracion SQL](../../../supabase/migrations/2026-10-13-f1-09-indices-duplicados.sql)',
    '- [Postgres - DROP INDEX](https://www.postgresql.org/docs/current/sql-dropindex.html)',
    '- [Postgres - pg_index](https://www.postgresql.org/docs/current/catalog-pg-index.html)',
    ''
)

New-FileSi $docPath $docLineas $false

# ─────────────────────────────────────────────────────────────
# 2. Tracking de hallazgos (patch puntual: DB-001i -> Cerrado)
# ─────────────────────────────────────────────────────────────
Write-Seccion '2. Actualizando tracking de hallazgos'

$trackTxt = Get-Content $trackPath -Raw

# 2.1 DB-001i: Abierto -> Cerrado
$trackTxt = $trackTxt -replace '\| DB-001i \| Indices duplicados \| F1 \| P3 \| Abierto \| - \|', '| DB-001i | Indices duplicados | F1 | P3 | **Cerrado** | (pendiente commit) |'

# 2.2 Resumen: Abierto 13 -> 12, Cerrado 17 -> 18
$trackTxt = $trackTxt -replace '\| Abierto \| 13 \|', '| Abierto | 12 |'
$trackTxt = $trackTxt -replace '\| Cerrado \| 17 \|', '| Cerrado | 18 |'

# 2.3 Por severidad: Baja cerrados 0 -> 1
$trackTxt = $trackTxt -replace '\| Baja \| 4 \| 0 \|', '| Baja | 4 | 1 |'

# 2.4 Ultima actualizacion
$trackTxt = $trackTxt -replace '\*\*Ultima actualizacion:\*\* 2026-10-13 \(fin Sesion 6\)', '**Ultima actualizacion:** 2026-10-13 (fin Sesion 7)'

Set-Content -Path $trackPath -Value $trackTxt -Encoding UTF8
Write-Host "[OK] Tracking actualizado (DB-001i -> Cerrado)" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────
# 3. STATUS.md (Fase 1: 78% -> 89%; Total: 34% -> 36%)
# ─────────────────────────────────────────────────────────────
Write-Seccion '3. Actualizando STATUS.md'

$statusTxt = Get-Content $statusPath -Raw

# 3.1 Ultima actualizacion
$statusTxt = $statusTxt -replace '\*\*Ultima actualizacion:\*\* 2026-10-13 \(fin Sesion 6\)', '**Ultima actualizacion:** 2026-10-13 (fin Sesion 7)'

# 3.2 Progreso global (34% -> 36%, 16/47 -> 17/47)
$statusTxt = $statusTxt -replace '\*\*Progreso global:\*\* 34% \(16 de 47 tareas\)', '**Progreso global:** 36% (17 de 47 tareas)'

# 3.3 Tabla por fase: F1 78% -> 89% (7 -> 8), Total 14 -> 15 y 30% -> 32%
# Nota: el STATUS.md tenia un bug (tabla decia 30% cuando encabezado decia 34%).
# Corregimos ambos al valor real post-F1-09: Total 15 OK / 47 = 32%.
$statusTxt = $statusTxt -replace '\| F1 - Seguridad DB \| 9 \| 7 \| 0 \| 2 \| 78% \|', '| F1 - Seguridad DB | 9 | 8 | 0 | 1 | 89% |'
$statusTxt = $statusTxt -replace '\| \*\*Total\*\* \| \*\*47\*\* \| \*\*14\*\* \| \*\*0\*\* \| \*\*33\*\* \| \*\*30%\*\* \|', '| **Total** | **47** | **15** | **0** | **32** | **32%** |'

# 3.4 Proximos 3 pasos
$statusTxt = $statusTxt -replace '1\. \*\*F1-09\*\* - Eliminar indices duplicados \(P3, esfuerzo S\)', '1. **SEC-011** - email_logs SELECT true para authenticated (P1, Alta)'
$statusTxt = $statusTxt -replace '2\. \*\*F3-02\*\* - SEC-002: quitar claves hardcodeadas \(P1\)', '2. **F3-02** - SEC-002: quitar claves hardcodeadas (P1)'
$statusTxt = $statusTxt -replace '3\. \*\*chore\(docs\)\*\* - Limpiar entradas duplicadas en BITACORA\.md', '3. **chore(docs)** - Limpiar BITACORA.md y STATUS.md (duplicados)'

# 3.5 Metricas: hallazgos cerrados 14/31 -> 18/31
$statusTxt = $statusTxt -replace '\| Hallazgos cerrados \| 14 / 31 \| 31 / 31 \|', '| Hallazgos cerrados | 18 / 31 | 31 / 31 |'

# 3.6 Append de ultima actividad (bloque Sesion 7)
$bloqueStatus = @(
    '',
    '**2026-10-13 - Sesion 7 (EN CURSO)**',
    '- F1-09: 9 indices duplicados eliminados',
    '- Grupo A: 7 indices idx_* redundantes respecto a UNIQUE hermano',
    '- Grupo B: 2 indices no-UNIQUE duplicados en notificaciones_admin',
    '- Verificacion previa: 0 constraints afectadas, 9 duplicados confirmados',
    '- Hallazgo DB-001i cerrado',
    '- Doc: docs/audits/2026-10-13-inicial/16-f1-09-indices-duplicados.md',
    '- Migracion: supabase/migrations/2026-10-13-f1-09-indices-duplicados.sql',
    ''
) -join "`r`n"

$marcadorStatus = 'Sesion 7 (EN CURSO)'
if ($statusTxt -notmatch [regex]::Escape($marcadorStatus)) {
    Add-Content -Path $statusPath -Value $bloqueStatus -Encoding UTF8
}

Set-Content -Path $statusPath -Value $statusTxt -Encoding UTF8
Write-Host "[OK] STATUS.md actualizado" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────
# 4. BITACORA.md (append Sesion 7)
# ─────────────────────────────────────────────────────────────
Write-Seccion '4. Haciendo append a BITACORA.md'

$bloqueBitacora = @(
    '',
    '---',
    '---',
    '',
    '## 2026-10-13 (Sesion 7 - CIERRE)',
    '',
    '**Duracion:** ~1.5 horas',
    '**Objetivo:** Ejecutar F1-09 (eliminar indices duplicados)',
    '',
    '**Completado:**',
    '- F1-09: 9 indices duplicados eliminados en 2 grupos',
    '- Grupo A: 7 indices idx_* redundantes respecto a UNIQUE hermano',
    '  (clientes, codigos_dipticos, compras, cupones_descuento, pedidos,',
    '  produccion, productos)',
    '- Grupo B: 2 indices no-UNIQUE duplicados en notificaciones_admin',
    '  (idx_notificaciones_created, idx_notificaciones_leida)',
    '- Verificacion 1: 0 constraints respaldadas por los indices a dropear',
    '- Verificacion 2: 7 UNIQUE hermanos confirmados',
    '- Verificacion 2b: 2 pares no-UNIQUE confirmados',
    '- Casi-duplicados documentados para futuras sesiones (recetas,',
    '  push_subscriptions)',
    '- Doc de auditoria: docs/audits/2026-10-13-inicial/16-f1-09-indices-duplicados.md',
    '- Migracion SQL: supabase/migrations/2026-10-13-f1-09-indices-duplicados.sql',
    '',
    '**Commits de la sesion:**',
    '- (pendiente) chore(db): eliminar indices duplicados (F1-09)',
    '',
    '**Hallazgos cerrados:**',
    '- DB-001i: Indices duplicados',
    '',
    '**Hallazgos nuevos:**',
    '- Ninguno',
    '',
    '**Bloqueantes:**',
    '- Ninguno',
    '',
    '**Aprendizajes:**',
    '- Al dropear un indice idx_* que tiene un UNIQUE hermano con la misma',
    '  firma, siempre dropear el no-UNIQUE. El UNIQUE cubre igualdad y',
    '  ademas aporta la constraint.',
    '- Cuando hay dos no-UNIQUE con la misma firma, conservar el que sigue',
    '  la convencion idx_<tabla_completa>_<columna>.',
    '- DROP INDEX CONCURRENTLY no puede correr en el SQL Editor de Supabase',
    '  (transaccion implicita). Para tablas chicas, DROP INDEX simple es',
    '  seguro y no requiere fragmentar.',
    '- Verificar con pg_constraint ANTES del DROP evita el error',
    '  "cannot drop index because constraint requires it".',
    '',
    '**Proxima sesion:**',
    '- SEC-011: analizar email_logs SELECT true para authenticated (P1)',
    '- F3-02: SEC-002 quitar claves hardcodeadas (P1)',
    '- chore(docs): limpiar BITACORA.md y STATUS.md',
    ''
) -join "`r`n"

Add-BloqueSi $bitacPath 'Sesion 7 - CIERRE' $bloqueBitacora

# ─────────────────────────────────────────────────────────────
# 5. Migracion SQL
# ─────────────────────────────────────────────────────────────
Write-Seccion '5. Generando migracion SQL'

$sqlLineas = @(
    '-- =====================================================================',
    '-- F1-09 - Eliminar indices duplicados',
    '-- Fecha: 2026-10-13',
    '-- Hallazgo: DB-001i',
    '-- Resumen: 9 indices duplicados eliminados en 2 grupos.',
    '-- Verificacion previa: 0 constraints afectadas.',
    '-- =====================================================================',
    '',
    '-- ---------------------------------------------------------------------',
    '-- GRUPO A - idx_* redundantes respecto a UNIQUE hermano (7)',
    '-- ---------------------------------------------------------------------',
    '',
    'DROP INDEX IF EXISTS public.idx_clientes_email;',
    'DROP INDEX IF EXISTS public.idx_codigos_dipticos_codigo;',
    'DROP INDEX IF EXISTS public.idx_compras_numero;',
    'DROP INDEX IF EXISTS public.idx_cupones_codigo;',
    'DROP INDEX IF EXISTS public.idx_pedidos_numero;',
    'DROP INDEX IF EXISTS public.idx_produccion_lote;',
    'DROP INDEX IF EXISTS public.idx_productos_slug;',
    '',
    '-- ---------------------------------------------------------------------',
    '-- GRUPO B - no-UNIQUE duplicados entre si (2)',
    '-- ---------------------------------------------------------------------',
    '',
    'DROP INDEX IF EXISTS public.idx_notificaciones_created;',
    'DROP INDEX IF EXISTS public.idx_notificaciones_leida;',
    '',
    '-- =====================================================================',
    '-- ROLLBACK (solo si hay que revertir)',
    '-- =====================================================================',
    '',
    '-- Grupo A',
    '-- CREATE INDEX idx_clientes_email          ON public.clientes          USING btree (email);',
    '-- CREATE INDEX idx_codigos_dipticos_codigo ON public.codigos_dipticos USING btree (codigo);',
    '-- CREATE INDEX idx_compras_numero          ON public.compras          USING btree (numero_compra);',
    '-- CREATE INDEX idx_cupones_codigo          ON public.cupones_descuento USING btree (codigo);',
    '-- CREATE INDEX idx_pedidos_numero          ON public.pedidos          USING btree (numero_pedido);',
    '-- CREATE INDEX idx_produccion_lote         ON public.produccion       USING btree (numero_lote);',
    '-- CREATE INDEX idx_productos_slug          ON public.productos        USING btree (slug);',
    '',
    '-- Grupo B',
    '-- CREATE INDEX idx_notificaciones_created ON public.notificaciones_admin USING btree (created_at DESC);',
    '-- CREATE INDEX idx_notificaciones_leida   ON public.notificaciones_admin USING btree (leido);',
    ''
)

New-FileSi $migPath $sqlLineas $true

# ─────────────────────────────────────────────────────────────
# 6. Verificacion final
# ─────────────────────────────────────────────────────────────
Write-Seccion '6. Verificacion de archivos generados'

$archivos = @($docPath, $trackPath, $statusPath, $bitacPath, $migPath)
foreach ($a in $archivos) {
    if (Test-Path $a) {
        $size = (Get-Item $a).Length
        Write-Host ("[OK] {0} ({1} bytes)" -f $a, $size) -ForegroundColor Green
    } else {
        Write-Host "[FALTA] $a" -ForegroundColor Red
    }
}

# ─────────────────────────────────────────────────────────────
# 7. Commit (opcional)
# ─────────────────────────────────────────────────────────────
Write-Seccion '7. Git'

if ($Commit) {
    Write-Host 'Ejecutando git add + commit + push...' -ForegroundColor Magenta

    git add $docPath $trackPath $statusPath $bitacPath $migPath scripts\docs\14-f1-09-indices-duplicados.ps1

    git commit -m "chore(db): eliminar indices duplicados (F1-09)"

    git push origin main

    Write-Host '[OK] Commit y push completados' -ForegroundColor Green
} else {
    Write-Host 'Modo SIN COMMIT. Para commitear, correr con -Commit' -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'Sugerencia de commit:' -ForegroundColor Cyan
    Write-Host '  git add docs/ supabase/migrations/ scripts/docs/14-f1-09-indices-duplicados.ps1' -ForegroundColor White
    Write-Host '  git commit -m "chore(db): eliminar indices duplicados (F1-09)"' -ForegroundColor White
    Write-Host '  git push origin main' -ForegroundColor White
}

Write-Host ''
Write-Host 'F1-09 completado.' -ForegroundColor Green
Write-Host ''