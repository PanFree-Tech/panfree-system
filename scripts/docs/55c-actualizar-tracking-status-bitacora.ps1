# 55c-actualizar-tracking-status-bitacora.ps1
# Actualiza tracking (DOC-012) + STATUS + BITACORA con el cierre de secrets internos.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root
$utf8 = New-Object System.Text.UTF8Encoding($false)

# =====================================================================
# 1. TRACKING
# =====================================================================
$trackingPath = Join-Path $root 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
Write-Host "=== tracking ===" -ForegroundColor Cyan
$t = [System.IO.File]::ReadAllText($trackingPath, $utf8)

# 1.1 Total: 61 -> 62
$t = $t.Replace(
    '**Total de hallazgos:** 61',
    '**Total de hallazgos:** 62'
)

# 1.2 Contadores resumen
$t = $t.Replace(
    '| Abierto | 24 |' + "`r`n" + '| En curso | 0 |' + "`r`n" + '| Cerrado | 34 |' + "`r`n" + '| Aceptado | 2 |',
    '| Abierto | 24 |' + "`r`n" + '| En curso | 0 |' + "`r`n" + '| Cerrado | 35 |' + "`r`n" + '| Aceptado | 2 |'
)

# 1.3 Severidad: Media Cantidad 21->22, Media Cerrados 9->10
$t = $t.Replace('| Media | 21 | 9 |', '| Media | 22 | 10 |')

# 1.4 Insertar DOC-012 despues de SEC-024 en "medios"
$ancla = '| SEC-024 | NEXT_PUBLIC_VAPID_EMAIL con valor sospechoso'
$lineas = $t -split "`r`n"
$nuevas = @()
$insertado = $false
foreach ($l in $lineas) {
    $nuevas += $l
    if (-not $insertado -and $l.StartsWith($ancla)) {
        $nuevas += '| DOC-012 | Secrets internos (CRON_SECRET, WEBHOOK_SECRET, REVALIDATE_SECRET) plomeria inerte, eliminados de Vercel | F2 | P2 | Cerrado | (S18) |'
        $insertado = $true
    }
}
if ($insertado) {
    $t = $nuevas -join "`r`n"
    [System.IO.File]::WriteAllText($trackingPath, $t, $utf8)
    Write-Host "  OK: DOC-012 agregado." -ForegroundColor Green
} else {
    Write-Host "  AVISO: no se encontro el ancla. Revisar." -ForegroundColor Yellow
}

# =====================================================================
# 2. STATUS
# =====================================================================
$statusPath = Join-Path $root 'docs\STATUS.md'
Write-Host ""
Write-Host "=== STATUS ===" -ForegroundColor Cyan
$s = [System.IO.File]::ReadAllText($statusPath, $utf8)

# 2.1 Proximos pasos: F2-13 sigue como "secrets internos"? No: el PLAN real F2-13 es "APIs IA".
#     Los secrets internos ya no son paso. Actualizamos la lista:
$s = $s.Replace(
    '1. **F2-11** - Rotar GA4 API secret (auditar los 2 juegos primero, ver SEC-023)' + "`r`n" +
    '2. **F2-12** - Regenerar par VAPID (verificar SEC-024 antes)' + "`r`n" +
    '3. **F2-13** - Auditar APIs IA secundarias',
    '1. **F2-11** - Rotar GA4 API secret (auditar los 2 juegos primero, ver SEC-023)' + "`r`n" +
    '2. **F2-12** - Regenerar par VAPID (verificar SEC-024 antes)' + "`r`n" +
    '3. **F2-13** - Auditar APIs IA secundarias'
)
# (Sin cambios reales en proximos pasos: ya estaba actualizado.)

[System.IO.File]::WriteAllText($statusPath, $s, $utf8)
Write-Host "  STATUS revisado (sin cambios pendientes)." -ForegroundColor Green

# =====================================================================
# 3. BITACORA
# =====================================================================
$bitacoraPath = Join-Path $root 'docs\BITACORA.md'
Write-Host ""
Write-Host "=== BITACORA ===" -ForegroundColor Cyan
$b = [System.IO.File]::ReadAllText($bitacoraPath, $utf8)

# Agregar seccion nueva a la entrada S18 (que ya existe) despues del ultimo bloque de la S18
# Buscamos el cierre de la entrada S18 actual y agregamos antes del siguiente ##
$nuevoBloque = @(
    ''
    '**Bloque 4 (secrets internos - F2-14 subproducto):**'
    '- Auditoria de secrets internos (script 54).'
    '  - 0 coincidencias en src/ para CRON_SECRET, WEBHOOK_SECRET, REVALIDATE_SECRET.'
    '  - 0 coincidencias en todo el repo excepto docs.'
    '  - No hay vercel.json, ni /api/cron/*, ni /api/revalidate/*.'
    '  - REVALIDATE_SECRET no estaba documentado en .env.example.'
    '- Veredicto: los 3 secrets son plomeria inerte.'
    '- Eliminados de Vercel: CRON_SECRET, WEBHOOK_SECRET, REVALIDATE_SECRET (Production + Preview).'
    '- Doc nuevo: 34-doc-secrets-internos-plomeria-inerte.md (DOC-012).'
    '- .env.example: seccion SECRETS INTERNOS marcada como ELIMINADOS.'
    ''
    '**Hallazgos nuevos (bloque 4):**'
    '- DOC-012: Secrets internos plomeria inerte (Cerrado).'
) -join "`r`n"

if ($b.Contains('DOC-012')) {
    Write-Host "  AVISO: DOC-012 ya existe en BITACORA. Saltando." -ForegroundColor Yellow
} else {
    # Buscar la ultima linea "Pendiente: Reconsultar Cloudinary..." y agregar despues
    $ancla = '- Reconsultar Cloudinary #392411 (a partir del 2026-10-18).'
    if ($b.Contains($ancla)) {
        $b = $b.Replace($ancla, $ancla + "`r`n" + $nuevoBloque)
        [System.IO.File]::WriteAllText($bitacoraPath, $b, $utf8)
        Write-Host "  OK: bloque 4 agregado a la entrada S18." -ForegroundColor Green
    } else {
        Write-Host "  AVISO: no se encontro el ancla en BITACORA. Revisar." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "PROXIMO PASO: git diff y commit." -ForegroundColor Cyan