# 57c-actualizar-tracking-status-bitacora.ps1
# Actualiza tracking (DOC-013) + STATUS + BITACORA.
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

# 1.1 Total: 62 -> 63
$t = $t.Replace(
    '**Total de hallazgos:** 62',
    '**Total de hallazgos:** 63'
)

# 1.2 Cerrado: 35 -> 36
$t = $t.Replace(
    '| Cerrado | 35 |',
    '| Cerrado | 36 |'
)

# 1.3 Media: 22 | 10 -> 23 | 11
$t = $t.Replace('| Media | 22 | 10 |', '| Media | 23 | 11 |')

# 1.4 Insertar DOC-013 despues de DOC-012
$ancla = '| DOC-012 | Secrets internos (CRON_SECRET, WEBHOOK_SECRET, REVALIDATE_SECRET) plomeria inerte, eliminados de Vercel | F2 | P2 | Cerrado | (S18) |'
$nuevo = $ancla + "`r`n" + '| DOC-013 | APIs IA secundarias (13 keys) plomeria inerte en Marketing, eliminadas de Vercel | F2 | P2 | Cerrado | (S18) |'

if ($t.Contains('| DOC-013 |')) {
    Write-Host "  AVISO: DOC-013 ya existe. Saltando." -ForegroundColor Yellow
} elseif (-not $t.Contains($ancla)) {
    Write-Host "  AVISO: no se encontro el ancla DOC-012. Revisar." -ForegroundColor Red
} else {
    $t = $t.Replace($ancla, $nuevo)
    [System.IO.File]::WriteAllText($trackingPath, $t, $utf8)
    Write-Host "  OK: DOC-013 agregado." -ForegroundColor Green
}

# =====================================================================
# 2. BITACORA
# =====================================================================
$bitacoraPath = Join-Path $root 'docs\BITACORA.md'
Write-Host ""
Write-Host "=== BITACORA ===" -ForegroundColor Cyan
$b = [System.IO.File]::ReadAllText($bitacoraPath, $utf8)

$nuevoBloque = @(
    ''
    '**Bloque 5 (APIs IA - F2-13):**'
    '- Auditoria de APIs IA secundarias (script 56).'
    '  - 45 coincidencias en 2 archivos de Marketing.'
    '  - 12 APIs usadas en codigo Marketing (generar-contenido + generar-imagen-cloudinary).'
    '  - 2 APIs sin uso en codigo (POLLINATIONS, REPLICATE).'
    '  - NEXA_API_KEY en codigo pero nunca en Vercel.'
    '- Veredicto: las 13 APIs IA son plomeria inerte dentro del modulo Marketing inerte.'
    '- Eliminadas de Vercel (Production + Preview): 13 variables.'
    '- Doc nuevo: 35-doc-apis-ia-eliminadas.md (DOC-013).'
    '- .env.example: seccion APIS IA marcada como ELIMINADAS.'
    '- PLAN: F2-13 reformulada a "No aplica".'
    '- Pendiente futuro: retirar el codigo de Marketing (referencias a estas APIs)'
    '  junto con el resto del modulo segun DOC-008. No se crea tarea nueva.'
    ''
    '**Hallazgos nuevos (bloque 5):**'
    '- DOC-013: APIs IA secundarias plomeria inerte (Cerrado).'
) -join "`r`n"

if ($b.Contains('DOC-013')) {
    Write-Host "  AVISO: DOC-013 ya existe en BITACORA. Saltando." -ForegroundColor Yellow
} else {
    $ancla = '- DOC-012: Secrets internos plomeria inerte (Cerrado).'
    if ($b.Contains($ancla)) {
        $b = $b.Replace($ancla, $ancla + "`r`n" + $nuevoBloque)
        [System.IO.File]::WriteAllText($bitacoraPath, $b, $utf8)
        Write-Host "  OK: bloque 5 agregado a la entrada S18." -ForegroundColor Green
    } else {
        Write-Host "  AVISO: no se encontro el ancla en BITACORA. Revisar." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "PROXIMO PASO: git diff y commit." -ForegroundColor Cyan