# PowerShell
# =============================================================================
# 21 - Cerrar Sesion 10 (2026-10-14)
# =============================================================================
# Sesion: 10
# Hallazgo cerrado: SEC-002 (F3-02)
# Commit de remediacion: 4a17c7d5
# Commit del script 20b: 9f427ef6
#
# Uso:
#   .\scripts\docs\21-cerrar-sesion-10.ps1            # DRY RUN
#   .\scripts\docs\21-cerrar-sesion-10.ps1 -Commit    # COMMIT + PUSH
# =============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'

# --- Rutas base --------------------------------------------------------------
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $repoRoot

$status     = Join-Path $repoRoot 'docs\STATUS.md'
$bitacora   = Join-Path $repoRoot 'docs\BITACORA.md'
$tracking   = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$verLinks   = Join-Path $repoRoot 'scripts\docs\00-verificar-links.ps1'
$utf8NoBom  = New-Object System.Text.UTF8Encoding($false)

Write-Host ''
Write-Host ('=' * 60) -ForegroundColor Cyan
Write-Host '  21 - Cerrar Sesion 10 (2026-10-14)' -ForegroundColor Cyan
Write-Host ('=' * 60) -ForegroundColor Cyan
Write-Host ("  Repo: " + $repoRoot)
if ($Commit) {
    Write-Host '  Modo: COMMIT + PUSH' -ForegroundColor Yellow
} else {
    Write-Host '  Modo: DRY RUN (sin commit)' -ForegroundColor Yellow
}
Write-Host ''

# --- [1/6] Prerequisitos -----------------------------------------------------
Write-Host '[1/6] Verificando prerequisitos...'
$faltantes = @()
foreach ($p in @($status, $bitacora, $tracking, $verLinks)) {
    if (-not (Test-Path $p)) { $faltantes += $p }
}
if ($faltantes.Count -gt 0) {
    Write-Host ('  ERROR: faltan rutas: ' + ($faltantes -join ', ')) -ForegroundColor Red
    exit 1
}
Write-Host '  OK: todas las rutas existen.'

# --- [2/6] STATUS.md ---------------------------------------------------------
Write-Host ''
Write-Host '[2/6] Actualizando STATUS.md...'

$s = [System.IO.File]::ReadAllText($status)
$sCambios = 0

# 2.1 Ultima actualizacion
$antes = $s
$s = $s -replace '\*\*Ultima actualizacion:\*\* 2026-10-14 \(fin Sesion 9\)', '**Ultima actualizacion:** 2026-10-14 (fin Sesion 10)'
if ($s -ne $antes) { $sCambios++ }

# 2.2 Proximos 3 pasos (S10 -> S11)
$antes = $s
$s = $s -replace '1\. \*\*F3-04\*\* - AUTH-001: contrasenas debiles \(P1\)', '1. **F3-04** - AUTH-001: contrasenas debiles (P1)'
if ($s -ne $antes) { $sCambios++ }

[System.IO.File]::WriteAllText($status, $s, $utf8NoBom)
if ($sCambios -gt 0) {
    Write-Host '  OK: STATUS.md actualizado.'
} else {
    Write-Host '  INFO: STATUS.md ya estaba actualizado (idempotente).'
}

# --- [3/6] Tracking: registrar hash del commit 4a17c7d5 ----------------------
Write-Host ''
Write-Host '[3/6] Actualizando 06-hallazgos-tracking.md (hash de SEC-002)...'

$t = [System.IO.File]::ReadAllText($tracking)
$antes = $t

# Reemplazar (Sesion 10) por el hash real del commit
$t = $t -replace '\| SEC-002 \| DEFAULT_SUPABASE_ANON_KEY hardcodeada \| F3 \| P1 \| Cerrado \| \(Sesion 10\) \|',
                '| SEC-002 | DEFAULT_SUPABASE_ANON_KEY hardcodeada | F3 | P1 | Cerrado | 4a17c7d5 |'

if ($t -ne $antes) {
    [System.IO.File]::WriteAllText($tracking, $t, $utf8NoBom)
    Write-Host '  OK: hash 4a17c7d5 registrado para SEC-002.'
} else {
    Write-Host '  INFO: hash ya registrado o fila no matcheo (idempotente).'
}

# --- [4/6] BITACORA.md -------------------------------------------------------
Write-Host ''
Write-Host '[4/6] Actualizando BITACORA.md...'

$b = [System.IO.File]::ReadAllText($bitacora)
$marca = '## 2026-10-14 (Sesion 10 - COMPLETA)'

if ($b -match [regex]::Escape($marca)) {
    Write-Host '  INFO: entrada Sesion 10 ya existe (idempotente).'
} else {
    $entrada = @(
        '',
        '---',
        '',
        '## 2026-10-14 (Sesion 10 - COMPLETA)',
        '',
        '**Duracion:** ~2 horas',
        '**Objetivo:** Cerrar SEC-002 (quitar claves hardcodeadas de src/lib/supabase.js)',
        '',
        '**Completado:**',
        '- SEC-002 cerrado: eliminadas las constantes DEFAULT_SUPABASE_URL y',
        '  DEFAULT_SUPABASE_ANON_KEY hardcodeadas en src/lib/supabase.js.',
        '- sanitizeSupabaseUrl() y sanitizeSupabaseKey() ahora fail-fast con',
        '  throw new Error() en lugar de fallback silencioso a valor hardcodeado.',
        '- Eliminado el console.warn residual de "valores por defecto".',
        '- 7 consumidores actualizados: import limpio + IIFE throw en el fallback.',
        '- 8 archivos src/ modificados (1 central + 7 consumidores).',
        '- Doc de auditoria: docs/audits/2026-10-13-inicial/19-f3-02-sec-002-anon-key.md',
        '- Scripts: scripts/docs/20a-fix-f3-02-src.ps1 + 20b-documentar-f3-02.ps1',
        '- 4 hallazgos nuevos registrados: SEC-014..017 (P3, chores futuros).',
        '- Fase 3 al 22% (2/9, F3-01 + F3-02 cerradas).',
        '',
        '**Commits de la sesion:**',
        '- 4a17c7d5 security(src): eliminar claves hardcodeadas en src/lib/supabase.js (SEC-002, F3-02)',
        '- 9f427ef6 chore(scripts): agregar script 20b-documentar-f3-02',
        '',
        '**Hallazgos cerrados:**',
        '- SEC-002: DEFAULT_SUPABASE_ANON_KEY hardcodeada en src/lib/supabase.js',
        '',
        '**Hallazgos nuevos:**',
        '- SEC-014: VAPID key hardcodeada en src/app/admin/page.js',
        '- SEC-015: URL Supabase hardcodeada en notificar-estado/route.js y notificaciones.js',
        '- SEC-016: Cloudinary cloud name hardcodeado en 4 lugares',
        '- SEC-017: GA4 Measurement ID hardcodeado en ga4/measurement/route.js',
        '',
        '**Bloqueantes:**',
        '- Ninguno',
        '',
        '**Aprendizajes:**',
        '- ENCODING EN POWERSHELL 5.1: los .ps1 con caracteres no-ASCII (emojis,',
        '  acentos) rompen si se guardan como UTF-8 sin BOM. PowerShell los lee',
        '  como CP-1252. [char]0xXXXX NO sirve para emojis (rango astral >0xFFFF).',
        '  Solucion: .ps1 en ASCII puro; archivos generados tambien ASCII puro',
        '  cuando sea posible.',
        '- VERIFICACION PREVIA: antes de hardcodear el "antes" en un -replace,',
        '  verificar el estado real del archivo. En S10 el script 20b asumio que',
        '  Fase 3 decia "1/9" pero el STATUS nunca se actualizo tras cerrar F3-01',
        '  (S5). El replace no matcheo. Regla: usar regex flexible o verificar el',
        '  estado real antes de escribir el script.',
        '- UN COMMIT POR TAREA: el script 20b NO se incluye en el commit del fix.',
        '  Va en un commit aparte (chore(scripts)). Mismo patron que S9 con el',
        '  script 19.',
        '- FIX CHICO Y VERIFICABLE: preferir fixes de 1-2 archivos a fixes que',
        '  tocan 12. La tentacion de "aprovechar y limpiar todo" rompe la',
        '  trazabilidad. Los hallazgos colaterales (SEC-014..017) quedaron',
        '  registrados como nuevos, no metidos en el mismo fix.',
        '',
        '**Proxima sesion:**',
        '- F3-04: AUTH-001 contrasenas debiles (P1)',
        '- chore(docs): limpiar entradas duplicadas en BITACORA.md y STATUS.md',
        '- F3-05: AUTH-002 registro sin validar duplicados (P1)'
    ) -join "`r`n"

    $b = $b.TrimEnd() + "`r`n" + $entrada + "`r`n"
    [System.IO.File]::WriteAllText($bitacora, $b, $utf8NoBom)
    Write-Host '  OK: entrada Sesion 10 agregada.'
}

# --- [5/6] Verificar links ---------------------------------------------------
Write-Host ''
Write-Host '[5/6] Verificando links de la documentacion...'
& powershell -ExecutionPolicy Bypass -File $verLinks

# --- [6/6] Commit opcional ---------------------------------------------------
Write-Host ''
if (-not $Commit) {
    Write-Host 'Modo DRY RUN. No se commiteo nada.' -ForegroundColor Yellow
    Write-Host 'Revisa los archivos modificados y despues corre:'
    Write-Host '  .\scripts\docs\21-cerrar-sesion-10.ps1 -Commit' -ForegroundColor Cyan
} else {
    Write-Host 'Modo -Commit activado. Preparando commit...' -ForegroundColor Yellow

    Push-Location $repoRoot
    try {
        Write-Host '  Archivos a commitear:' -ForegroundColor Cyan
        git status --short

        git add $status
        git add $bitacora
        git add $tracking
        git add $PSCommandPath

        $msg = 'docs(session): cerrar sesion 10 2026-10-14'
        git commit -m $msg
        if ($LASTEXITCODE -ne 0) {
            Write-Host '  ERROR: git commit fallo.' -ForegroundColor Red
            exit 1
        }
        Write-Host '  OK: commit creado.' -ForegroundColor Green

        git push origin main
        if ($LASTEXITCODE -ne 0) {
            Write-Host '  ERROR: git push fallo.' -ForegroundColor Red
            exit 1
        }
        Write-Host '  OK: push completado.' -ForegroundColor Green

        Write-Host ''
        Write-Host '  git log --oneline -5:' -ForegroundColor Cyan
        git log --oneline -5

        Write-Host ''
        Write-Host '  git status --short:' -ForegroundColor Cyan
        git status --short
    } finally {
        Pop-Location
    }
}

Write-Host ''
Write-Host ('=' * 60) -ForegroundColor Cyan
Write-Host '  Script 21 finalizado' -ForegroundColor Cyan
Write-Host ('=' * 60) -ForegroundColor Cyan
Write-Host ''