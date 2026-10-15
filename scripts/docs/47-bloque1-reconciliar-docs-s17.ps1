# ============================================================================
# 47-bloque1-reconciliar-docs-s17.ps1
# Bloque 1 de S17: reconciliar documentacion con estado real post-S16.
#
# 4 modificaciones en un solo commit docs(sync):
#   1. Tracking: quitar negrita de DB-001i + recalcular header
#   2. ROTACION-CLAVES: typo S16 -> S17 (2 ocurrencias)
#   3. .env.example: Supabase y Cloudinary de [C]/MIG -> [S]/OK
#   4. .env.example: comentario de deuda en GEMINI_MODEL (BUG-006/007)
#
# Uso:
#   .\47-bloque1-reconciliar-docs-s17.ps1            (dry run)
#   .\47-bloque1-reconciliar-docs-s17.ps1 -Commit    (aplica + push)
# ============================================================================

param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$repoRoot = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $repoRoot

$utf8 = New-Object System.Text.UTF8Encoding($false)

function Write-Step($msg) {
    Write-Host ""
    Write-Host "=== $msg ===" -ForegroundColor Cyan
}
function Write-Ok($msg)   { Write-Host "  [OK] $msg"   -ForegroundColor Green }
function Write-Skip($msg) { Write-Host "  [SKIP] $msg" -ForegroundColor Yellow }
function Write-Info($msg) { Write-Host "  [INFO] $msg" -ForegroundColor Gray }
function Write-Warn($msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow }

# ---------------------------------------------------------------------------
# Pre-chequeo
# ---------------------------------------------------------------------------

Write-Step "Pre-chequeo"

$head = (git rev-parse --short HEAD).Trim()
Write-Info "HEAD actual: $head"

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') {
    Write-Host "  [ERROR] Rama actual '$branch' no es 'main'. Abortar." -ForegroundColor Red
    exit 1
}
Write-Ok "Rama: main"

$status = git status --porcelain
$noVacio = $status | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
$soloScript = $true
if ($noVacio.Count -gt 0) {
    foreach ($linea in $noVacio) {
        if ($linea -notmatch 'scripts/docs/47-bloque1-reconciliar-docs-s17\.ps1') {
            $soloScript = $false
        }
    }
    if (-not $soloScript) {
        Write-Warn "Working tree tiene cambios que no son el script 47:"
        $noVacio | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkYellow }
    } else {
        Write-Info "Working tree: solo el script 47 sin versionar (OK)"
    }
}

$cambiosTotales = 0

# ===========================================================================
# 1. TRACKING
# ===========================================================================

Write-Step "1. Tracking - quitar negrita + recalcular header"

$tkPath = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$tkText = [System.IO.File]::ReadAllText($tkPath, $utf8)

$anchorNegrita = '| DB-001i | Indices duplicados | F1 | P3 | **Cerrado** | d6957a61 |'
$anchorNegritaFix = '| DB-001i | Indices duplicados | F1 | P3 | Cerrado | d6957a61 |'

if ($tkText.Contains($anchorNegrita)) {
    $tkText = $tkText.Replace($anchorNegrita, $anchorNegritaFix)
    Write-Ok "Quitada negrita en DB-001i"
    $cambiosTotales++
} elseif ($tkText.Contains($anchorNegritaFix)) {
    Write-Skip "DB-001i ya sin negrita"
} else {
    Write-Warn "No se encontro la fila DB-001i (revisar manualmente)"
}

# Recalcular conteos con regex tolerante a **
$filas = $tkText -split "`r`n" | Where-Object { $_ -match '^\| [A-Z]+-[0-9]' }
# Fallback: si el archivo tiene LF puro, el split por CRLF no divide nada util
if ($filas.Count -le 1) {
    $filas = $tkText -split "`n" | Where-Object { $_ -match '^\| [A-Z]+-[0-9]' }
}
$totalFilas   = $filas.Count
$nAbierto     = ($filas | Where-Object { $_ -match '\|\s*\*{0,2}Abierto\*{0,2}\s*\|' }).Count
$nEnCurso     = ($filas | Where-Object { $_ -match '\|\s*\*{0,2}En curso\*{0,2}\s*\|' }).Count
$nCerrado     = ($filas | Where-Object { $_ -match '\|\s*\*{0,2}Cerrado\*{0,2}\s*\|' }).Count
$nAceptado    = ($filas | Where-Object { $_ -match '\|\s*\*{0,2}Aceptado\*{0,2}\s*\|' }).Count

Write-Info "Conteo real: Total=$totalFilas Abierto=$nAbierto En curso=$nEnCurso Cerrado=$nCerrado Aceptado=$nAceptado"

if (($nAbierto + $nEnCurso + $nCerrado + $nAceptado) -ne $totalFilas) {
    Write-Warn "Los conteos NO suman el total ($($nAbierto + $nEnCurso + $nCerrado + $nAceptado) vs $totalFilas). Revisar filas huerfanas."
}

# Reemplazos LINEA POR LINEA (no dependen del separador CRLF/LF)
$reemplazos = @(
    @{ Viejo = '**Ultima actualizacion:** 2026-10-14 (fin Sesion 15)'; Nuevo = '**Ultima actualizacion:** 2026-10-15 (fin Sesion 16)'; Etiqueta = 'Ultima actualizacion' },
    @{ Viejo = '**Total de hallazgos:** 46';                           Nuevo = "**Total de hallazgos:** $totalFilas";         Etiqueta = 'Total' },
    @{ Viejo = '| Abierto | 14 |';                                     Nuevo = "| Abierto | $nAbierto |";                    Etiqueta = 'Abierto' },
    @{ Viejo = '| En curso | 0 |';                                     Nuevo = "| En curso | $nEnCurso |";                   Etiqueta = 'En curso' },
    @{ Viejo = '| Cerrado | 32 |';                                     Nuevo = "| Cerrado | $nCerrado |";                    Etiqueta = 'Cerrado' },
    @{ Viejo = '| Aceptado | 1 |';                                     Nuevo = "| Aceptado | $nAceptado |";                  Etiqueta = 'Aceptado' }
)

$reemplazosAplicados = 0
foreach ($r in $reemplazos) {
    if ($tkText.Contains($r.Viejo)) {
        $tkText = $tkText.Replace($r.Viejo, $r.Nuevo)
        Write-Ok "Header: $($r.Etiqueta) actualizado"
        $reemplazosAplicados++
    } elseif ($tkText.Contains($r.Nuevo)) {
        Write-Skip "Header: $($r.Etiqueta) ya actualizado"
    } else {
        Write-Warn "Header: '$($r.Viejo)' no encontrado"
    }
}

if ($reemplazosAplicados -gt 0) {
    $cambiosTotales += $reemplazosAplicados
}

if ($Commit -and ($reemplazosAplicados -gt 0 -or $tkText.Contains($anchorNegritaFix))) {
    [System.IO.File]::WriteAllText($tkPath, $tkText, $utf8)
    Write-Ok "Tracking escrito en disco"
} elseif (-not $Commit) {
    Write-Info "[DRY RUN] Se aplicarian cambios al tracking"
}

# ===========================================================================
# 2. ROTACION-CLAVES
# ===========================================================================

Write-Step "2. ROTACION-CLAVES - typo S16 -> S17"

$rotPath = Join-Path $repoRoot 'docs\operations\ROTACION-CLAVES.md'
$rotText = [System.IO.File]::ReadAllText($rotPath, $utf8)

$anchorRot = 'durante la rotacion en S16'
$fixRot    = 'durante la rotacion en S17'

$ocurrencias = ([regex]::Matches($rotText, [regex]::Escape($anchorRot))).Count
Write-Info "Ocurrencias de '$anchorRot': $ocurrencias"

if ($ocurrencias -gt 0) {
    $rotText = $rotText.Replace($anchorRot, $fixRot)
    Write-Ok "Reemplazadas $ocurrencias ocurrencias"
    $cambiosTotales++
    if ($Commit) {
        [System.IO.File]::WriteAllText($rotPath, $rotText, $utf8)
        Write-Ok "ROTACION-CLAVES escrito en disco"
    } else {
        Write-Info "[DRY RUN] Se aplicaria el reemplazo"
    }
} else {
    Write-Skip "No hay ocurrencias (ya corregido)"
}

# ===========================================================================
# 3. .env.example - Supabase y Cloudinary
# ===========================================================================

Write-Step "3. .env.example - Supabase y Cloudinary [C]/MIG -> [S]/OK"

$envPath = Join-Path $repoRoot '.env.example'
$envText = [System.IO.File]::ReadAllText($envPath, $utf8)

# Reemplazos linea por linea (independientes del separador)
$cambiosEnv = 0

# Supabase - detectar por panel URL como discriminador
if ($envText.Contains('# Panel:  https://supabase.com/dashboard/project/gbdrcaumghykiipqgbty')) {
    # Bloque Supabase
    $oldSupEmail  = @(
        '# --- SUPABASE ----------------------------------------------------------------',
        '# Email:  [C] contacto.panfree@gmail.com'
    ) -join "`n"
    # El archivo puede tener CRLF o LF. Probamos las dos variantes.
    $okSup1 = $false
    $oldSupCRLF = "# --- SUPABASE ----------------------------------------------------------------`r`n# Email:  [C] contacto.panfree@gmail.com`r`n# Estado: MIG`r`n# Panel:  https://supabase.com/dashboard/project/gbdrcaumghykiipqgbty"
    $oldSupLF   = "# --- SUPABASE ----------------------------------------------------------------`n# Email:  [C] contacto.panfree@gmail.com`n# Estado: MIG`n# Panel:  https://supabase.com/dashboard/project/gbdrcaumghykiipqgbty"
    $newSupCRLF = "# --- SUPABASE ----------------------------------------------------------------`r`n# Email:  [S] system.panfree@gmail.com`r`n# Estado: OK`r`n# Rotado: 2026-10-15 (S15) - sb_publishable_/sb_secret_ + JWT Signing Key`r`n# Panel:  https://supabase.com/dashboard/project/gbdrcaumghykiipqgbty"
    $newSupLF   = "# --- SUPABASE ----------------------------------------------------------------`n# Email:  [S] system.panfree@gmail.com`n# Estado: OK`n# Rotado: 2026-10-15 (S15) - sb_publishable_/sb_secret_ + JWT Signing Key`n# Panel:  https://supabase.com/dashboard/project/gbdrcaumghykiipqgbty"

    if ($envText.Contains($oldSupCRLF)) {
        $envText = $envText.Replace($oldSupCRLF, $newSupCRLF); $okSup1 = $true
    } elseif ($envText.Contains($oldSupLF)) {
        $envText = $envText.Replace($oldSupLF, $newSupLF); $okSup1 = $true
    }

    if ($okSup1) {
        Write-Ok "Supabase: [C]/MIG -> [S]/OK"
        $cambiosEnv++
    } elseif ($envText.Contains('# Rotado: 2026-10-15 (S15) - sb_publishable_/sb_secret_ + JWT Signing Key')) {
        Write-Skip "Supabase ya esta [S]/OK"
    } else {
        Write-Warn "No matcheo el bloque de Supabase"
    }
}

# Cloudinary
if ($envText.Contains('# Panel:  https://console.cloudinary.com')) {
    $oldCloudCRLF = "# --- CLOUDINARY --------------------------------------------------------------`r`n# Email:  [C] contacto.panfree@gmail.com`r`n# Estado: MIG`r`n# Panel:  https://console.cloudinary.com"
    $oldCloudLF   = "# --- CLOUDINARY --------------------------------------------------------------`n# Email:  [C] contacto.panfree@gmail.com`n# Estado: MIG`n# Panel:  https://console.cloudinary.com"
    $newCloudCRLF = "# --- CLOUDINARY --------------------------------------------------------------`r`n# Email:  [S] system.panfree@gmail.com`r`n# Estado: OK`r`n# Rotado: 2026-10-15 (S16) - Root User pendiente (ticket #392411)`r`n# Panel:  https://console.cloudinary.com"
    $newCloudLF   = "# --- CLOUDINARY --------------------------------------------------------------`n# Email:  [S] system.panfree@gmail.com`n# Estado: OK`n# Rotado: 2026-10-15 (S16) - Root User pendiente (ticket #392411)`n# Panel:  https://console.cloudinary.com"

    $okCloud = $false
    if ($envText.Contains($oldCloudCRLF)) {
        $envText = $envText.Replace($oldCloudCRLF, $newCloudCRLF); $okCloud = $true
    } elseif ($envText.Contains($oldCloudLF)) {
        $envText = $envText.Replace($oldCloudLF, $newCloudLF); $okCloud = $true
    }

    if ($okCloud) {
        Write-Ok "Cloudinary: [C]/MIG -> [S]/OK"
        $cambiosEnv++
    } elseif ($envText.Contains('# Rotado: 2026-10-15 (S16) - Root User pendiente (ticket #392411)')) {
        Write-Skip "Cloudinary ya esta [S]/OK"
    } else {
        Write-Warn "No matcheo el bloque de Cloudinary"
    }
}

# ===========================================================================
# 4. .env.example - comentario en GEMINI_MODEL
# ===========================================================================

Write-Step "4. .env.example - comentario de deuda en GEMINI_MODEL"

$anchorGemini = 'GEMINI_MODEL=gemini-2.5-flash'
$marcaDeuda   = '# PENDIENTE: valor contradice codigo real (ver BUG-006/BUG-007 en tracking).'

if ($envText.Contains($marcaDeuda)) {
    Write-Skip "Comentario de deuda ya presente en GEMINI_MODEL"
} elseif ($envText.Contains($anchorGemini)) {
    $fixGeminiCRLF = "# PENDIENTE: valor contradice codigo real (ver BUG-006/BUG-007 en tracking).`r`n# NO cambiar sin auditar src/app/admin/marketing/page.js y el endpoint backend.`r`nGEMINI_MODEL=gemini-2.5-flash"
    $fixGeminiLF   = "# PENDIENTE: valor contradice codigo real (ver BUG-006/BUG-007 en tracking).`n# NO cambiar sin auditar src/app/admin/marketing/page.js y el endpoint backend.`nGEMINI_MODEL=gemini-2.5-flash"

    if ($envText.Contains("`r`n$anchorGemini")) {
        $envText = $envText.Replace($anchorGemini, $fixGeminiCRLF.Replace("`r`n", "`r`n"))
    } else {
        $envText = $envText.Replace($anchorGemini, $fixGeminiLF)
    }
    Write-Ok "Agregado comentario de deuda arriba de GEMINI_MODEL"
    $cambiosEnv++
} else {
    Write-Warn "No matcheo la linea GEMINI_MODEL=gemini-2.5-flash"
}

if ($cambiosEnv -gt 0) {
    $cambiosTotales += $cambiosEnv
    if ($Commit) {
        [System.IO.File]::WriteAllText($envPath, $envText, $utf8)
        Write-Ok ".env.example escrito en disco ($cambiosEnv cambios)"
    } else {
        Write-Info "[DRY RUN] Se aplicarian $cambiosEnv cambios en .env.example"
    }
}

# ===========================================================================
# Commit
# ===========================================================================

Write-Step "Resumen"

if ($cambiosTotales -eq 0) {
    Write-Skip "No hay cambios para commitear"
    exit 0
}

Write-Info "Cambios totales: $cambiosTotales"

if ($Commit) {
    Write-Step "Commit y push"
    git add docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md
    git add docs/operations/ROTACION-CLAVES.md
    git add .env.example

    git commit -m "docs(sync): reconciliar tracking, ROTACION-CLAVES y .env.example con estado S16" | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "git commit fallo" }

    git push origin main | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "git push fallo" }
    Write-Ok "Commit y push OK"

    Write-Step "Verificacion final"
    git log --oneline -3 | Out-Host
    Write-Host ""
    git status --short | Out-Host
} else {
    Write-Step "DRY RUN completado - nada se modifico"
    Write-Host ""
    Write-Host "  Para aplicar + commit + push:" -ForegroundColor Yellow
    Write-Host "    .\47-bloque1-reconciliar-docs-s17.ps1 -Commit" -ForegroundColor Yellow
}

Write-Host ""