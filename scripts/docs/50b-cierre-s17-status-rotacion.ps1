# 50b-cierre-s17-status-rotacion.ps1
# Actualiza STATUS.md y ROTACION-CLAVES.md con el estado al cierre de S17.
# Uso:
#   .\50b-cierre-s17-status-rotacion.ps1            (dry run)
#   .\50b-cierre-s17-status-rotacion.ps1 -Commit    (aplica)

param([switch]$Commit)

$ErrorActionPreference = 'Stop'
$repoRoot = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $repoRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Write-Ok($m)   { Write-Host "  [OK] $m" -ForegroundColor Green }
function Write-Skip($m) { Write-Host "  [SKIP] $m" -ForegroundColor Yellow }
function Write-Warn($m) { Write-Host "  [WARN] $m" -ForegroundColor Yellow }

$cambios = 0

# ===========================================================================
# PARTE 1 - STATUS.md
# ===========================================================================

Write-Host ""
Write-Host "=== 1. STATUS.md ===" -ForegroundColor Cyan

$stPath = Join-Path $repoRoot 'docs\STATUS.md'
$st = [System.IO.File]::ReadAllText($stPath, $utf8)

# --- 1a. Header ---
$pares = @(
    @{ V = '**Ultima actualizacion:** 2026-10-15 (fin Sesion 16)'; N = '**Ultima actualizacion:** 2026-10-15 (fin Sesion 17)'; E = 'Header fecha' },
    @{ V = '**Progreso global:** 60% (28 de 47 tareas)';            N = '**Progreso global:** 66% (31 de 47 tareas)';            E = 'Header progreso' },
    @{ V = '| F2 - Rotacion claves | 14 | 5 | 1 | 8 | 36% |';     N = '| F2 - Rotacion claves | 14 | 8 | 0 | 6 | 57% |';     E = 'Fila F2' },
    @{ V = '| **Total** | **47** | **28** | **1** | **18** | **60%** |'; N = '| **Total** | **47** | **31** | **0** | **16** | **66%** |'; E = 'Fila Total' }
)

foreach ($p in $pares) {
    if ($st.Contains($p.V)) {
        $st = $st.Replace($p.V, $p.N)
        Write-Ok "Status: $($p.E)"
        $cambios++
    } elseif ($st.Contains($p.N)) {
        Write-Skip "Status: $($p.E) ya actualizado"
    } else {
        Write-Warn "Status: $($p.E) no matcheo"
    }
}

# --- 1b. Proximos 3 pasos ---
$pasosViejo = @(
    '1. **F2-05** - Rotar Resend API key (sin bloqueantes)',
    '2. **F2-04** - Rotacion completa de Cloudinary (crear key nueva + revocar actual)',
    '3. **F2-13** - Auditar 11 APIs IA secundarias (ANTHROPIC, MISTRAL, DEEPSEEK, etc.)'
) -join "`r`n"

$pasosNuevo = @(
    '1. **Ticket Cloudinary #392411** - Verificar respuesta de soporte (2-4 dias habiles)',
    '2. **F2-10** - Rotar n8n webhook token',
    '3. **F2-14** - Auditar 11 APIs IA secundarias (ANTHROPIC, MISTRAL, DEEPSEEK, etc.)'
) -join "`r`n"

if ($st.Contains($pasosViejo)) {
    $st = $st.Replace($pasosViejo, $pasosNuevo)
    Write-Ok "Status: Proximos 3 pasos"
    $cambios++
} elseif ($st.Contains($pasosNuevo)) {
    Write-Skip "Status: Proximos 3 pasos ya actualizados"
} else {
    Write-Warn "Status: Proximos 3 pasos no matcheo"
}

# --- 1c. Agregar entrada S17 al final (despues del bloque S16) ---
$anclaS16 = '  66a69d3d, b15e8b6f, 1f0420a5.'

$entradaS17 = @(
    '',
    '---',
    '',
    '**2026-10-15 - Sesion 17 (ENV) - COMPLETA**',
    '- Bloque 0: chore de arranque. .gitignore + package-lock.json + 30 scripts S14-S16 versionados.',
    '- Bloque 1: reconciliar docs post-S16 (tracking, ROTACION-CLAVES, .env.example).',
    '- Bloque 2: ticket Cloudinary #392411 - sin respuesta, se reconsulta en S18.',
    '- Bloque 3: auditoria ecosistema Meta (DOC-005/006/007).',
    '  - Confirmado: ninguna variable Meta/Twilio/Instagram en Vercel.',
    '  - Canal real WhatsApp: wa.me/595984589845 (link directo, 20+ lugares).',
    '  - F2-07/08/09 reformuladas a "No aplica" o "Roto" segun corresponda.',
    '  - Bloqueante raiz: Meta Business Verification requiere RUC.',
    '- Bloque 4: auditoria seccion Marketing (DOC-008).',
    '  - ~8.100 lineas, no se usa. Duplica promos por producto y cupones existentes.',
    '  - Plan de retiro futuro documentado. No se toca codigo en S17.',
    '- 4 hallazgos nuevos: DOC-005 (cerrado), DOC-006 (abierto), DOC-007 (aceptado), DOC-008 (abierto).',
    '- F2: 5->8 OK (F2-07/08/09 cerradas como no aplica/roto).',
    '- Commits clave: d51245f7..f02937cf, a835c615.'
) -join "`r`n"

if ($st.Contains('**2026-10-15 - Sesion 17 (ENV) - COMPLETA**')) {
    Write-Skip "Status: entrada S17 ya existe"
} elseif ($st.Contains($anclaS16)) {
    $st = $st.TrimEnd() + "`r`n" + $entradaS17 + "`r`n"
    Write-Ok "Status: entrada S17 agregada"
    $cambios++
} else {
    Write-Warn "Status: no matcheo la ultima linea de la entrada S16"
}

if ($Commit -and $cambios -gt 0) {
    [System.IO.File]::WriteAllText($stPath, $st, $utf8)
    Write-Ok "STATUS.md escrito en disco"
}

# ===========================================================================
# PARTE 2 - ROTACION-CLAVES.md
# ===========================================================================

Write-Host ""
Write-Host "=== 2. ROTACION-CLAVES.md ===" -ForegroundColor Cyan

$rotPath = Join-Path $repoRoot 'docs\operations\ROTACION-CLAVES.md'
$rot = [System.IO.File]::ReadAllText($rotPath, $utf8)

if ($rot.Contains('## Estado de Bitwarden al cierre de S17')) {
    Write-Skip "ROTACION-CLAVES: seccion S17 ya existe"
} else {
    $seccionS17 = @(
        '',
        '---',
        '',
        '## Estado de Bitwarden al cierre de S17 (2026-10-15)',
        '',
        '**Coleccion:** Bitwarden -> Organizacion PanFree -> Produccion',
        '',
        '### Cambios respecto a S16',
        '',
        'En S17 no se roto ninguna key nueva. Se reformularon 3 tareas:',
        '',
        '| # | Item | Estado S17 | Motivo |',
        '|---|---|---|---|',
        '| 5 | Meta WhatsApp - Produccion | NO APLICA | Plomeria inerte (DOC-005). Canal real es wa.me |',
        '| 6 | Twilio - Produccion | NO APLICA | Plomeria inerte (DOC-005). Tokens nunca creados |',
        '| 7 | Instagram - Produccion | ROTO | Endpoints activos, tokens ausentes (DOC-006). Publicar manual |',
        '',
        'Ver docs/audits/2026-10-13-inicial/30-doc-meta-plomeria-inerte.md para el detalle completo.',
        '',
        '### Items completos (4/12)',
        '',
        '| # | Item | Estado | Fecha | Notas |',
        '|---|---|---|---|---|',
        '| 1 | Supabase - Produccion | OK | 2026-10-15 (S15) | sb_publishable_/sb_secret_ + JWT rotada |',
        '| 2 | Cloudinary - Produccion | OK | 2026-10-15 (S16) | 1 key rotada + 3 huerfanas revocadas. Ticket #392411 abierto |',
        '| 3 | Gemini - Produccion | OK | 2026-10-15 (S15) | Key rotada + 3 huerfanas eliminadas |',
        '| 4 | Resend - Produccion | OK | 2026-10-15 (S16) | Migrado [C]->[S], dominio via Claim, key con scope minimo |',
        '',
        '### Items pendientes (8/12)',
        '',
        '| # | Item | Cuenta | Bloquea rotacion |',
        '|---|---|---|---|',
        '| 5 | Meta WhatsApp - Produccion | NO APLICA | - (DOC-005) |',
        '| 6 | Twilio - Produccion | NO APLICA | - (DOC-005) |',
        '| 7 | Instagram - Produccion | ROTO | - (DOC-006) |',
        '| 8 | n8n - Produccion | [S] | F2-10 |',
        '| 9 | GA4 - Produccion | [S] | F2-11 |',
        '| 10 | Clarity - Produccion | [S] | (no bloquea rotacion) |',
        '| 11 | VAPID - Produccion | [S] | F2-12 |',
        '| 12 | Secrets internos - Produccion | [S] | F2-13 / F4-06 |',
        '',
        '### Hallazgo SEC-020',
        '',
        'Sigue abierto. Se cierra cuando los items realmente rotables esten completos:',
        'n8n, GA4, Clarity, VAPID, Secrets internos. Los items 5-6-7 se consideran cerrados',
        'por decision (no aplica / roto documentado).',
        '',
        '### Deuda tecnica al cierre de S17',
        '',
        '- Migrar @supabase/auth-helpers-nextjs -> @supabase/ssr.',
        '- Auditar 11 APIs IA secundarias (F2-14).',
        '- Sistema simple de promociones en CartSidebar (backlog, ver DOC-008 seccion 9).',
        '- Ocultar la seccion Marketing del menu admin (S17-B diferido).',
        '- Limpieza de la seccion Marketing (~5.500-6.500 lineas candidatas a retiro, ver DOC-008).'
    ) -join "`r`n"

    $rot = $rot.TrimEnd() + "`r`n" + $seccionS17 + "`r`n"
    Write-Ok "ROTACION-CLAVES: seccion S17 agregada"
    $cambios++

    if ($Commit) {
        [System.IO.File]::WriteAllText($rotPath, $rot, $utf8)
        Write-Ok "ROTACION-CLAVES.md escrito en disco"
    }
}

# ===========================================================================
# Resumen
# ===========================================================================

Write-Host ""
Write-Host "=== Resumen ===" -ForegroundColor Cyan
Write-Host "  Cambios totales: $cambios" -ForegroundColor Gray

if (-not $Commit) {
    Write-Host ""
    Write-Host "  [DRY RUN] Nada se modifico." -ForegroundColor Yellow
    Write-Host "  Para aplicar:" -ForegroundColor Yellow
    Write-Host "    .\50b-cierre-s17-status-rotacion.ps1 -Commit" -ForegroundColor Yellow
} elseif ($cambios -eq 0) {
    Write-Host ""
    Write-Host "  Nada para commitear." -ForegroundColor Yellow
}

Write-Host ""