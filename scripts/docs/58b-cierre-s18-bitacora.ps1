# 58b-cierre-s18-bitacora.ps1
# Cambia "EN CURSO" a "COMPLETA" en la entrada S18 y agrega seccion de cierre.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root
$utf8 = New-Object System.Text.UTF8Encoding($false)

$path = Join-Path $root 'docs\BITACORA.md'
$b = [System.IO.File]::ReadAllText($path, $utf8)

# 1. Cambiar el header de S18
$b = $b.Replace(
    '## 2026-10-16 (Sesion 18 - EN CURSO)',
    '## 2026-10-16 (Sesion 18 - COMPLETA)'
)

# 2. Agregar seccion de cierre al final de la entrada S18
$ancla = '**Hallazgos nuevos (bloque 5):**' + "`r`n" + '- DOC-013: APIs IA secundarias plomeria inerte (Cerrado).'

$cierre = $ancla + "`r`n" + @(
    ''
    '**Cierre S18:**'
    '- 5 bloques completados, 3 commits pusheados.'
    '- 3 tareas F2 cerradas: F2-10 (n8n No aplica), F2-13 (APIs IA No aplica),'
    '  subproducto de F2-14 (secrets internos eliminados de Vercel).'
    '- 8 hallazgos registrados: DOC-009/010/011/012/013, SEC-022/023/024.'
    '- Limpieza masiva de Vercel: 16 variables eliminadas'
    '  (13 APIs IA + 3 secrets internos).'
    '- Progreso: 66% -> 70% (33 de 47 tareas).'
    '- F2: 8/14 -> 10/14.'
    ''
    '**Commits S18:**'
    '- 6ec46c30 docs(env): documentar n8n plomeria inerte y hallazgos de Vercel'
    '- 74486761 docs(env): documentar secrets internos como plomeria inerte'
    '- 9b99efe7 docs(env): auditar y eliminar 13 APIs IA secundarias'
    ''
    '**Proxima sesion (S19):**'
    '- F2-11: rotar GA4 API secret (auditar SEC-023 primero).'
    '- F2-12: regenerar par VAPID (verificar SEC-024 + BUG-001).'
    '- F2-14: guardar .env consolidado en Bitwarden.'
    '- Backlog: sistema simple de promociones en CartSidebar (DOC-008 seccion 9).'
    '- Pendiente futuro: retiro del modulo Marketing completo (DOC-008).'
    ''
    '**Bloqueantes:**'
    '- Ninguno. Cloudinary #392411 se reconsulta a partir del 2026-10-18.'
) -join "`r`n"

if ($b.Contains('**Cierre S18:**')) {
    Write-Host "AVISO: ya existe la seccion de cierre. Saltando." -ForegroundColor Yellow
} elseif (-not $b.Contains($ancla)) {
    Write-Host "AVISO: no se encontro el ancla. Revisar." -ForegroundColor Red
} else {
    $b = $b.Replace($ancla, $cierre)
    [System.IO.File]::WriteAllText($path, $b, $utf8)
    Write-Host "OK: BITACORA actualizada (S18 COMPLETA + seccion de cierre)." -ForegroundColor Green
}