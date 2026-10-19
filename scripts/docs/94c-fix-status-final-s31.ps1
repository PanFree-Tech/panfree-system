param([string]$RepoRoot = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
$ErrorActionPreference = 'Stop'
$StatusPath = Join-Path $RepoRoot 'docs\STATUS.md'
if (-not (Test-Path -LiteralPath $StatusPath)) { Write-Error "No existe: $StatusPath"; exit 1 }
Write-Host "== 94c - Fix STATUS.md (final) ==" -ForegroundColor Cyan
Write-Host "Archivo: $StatusPath"
$lines = Get-Content -LiteralPath $StatusPath -Encoding UTF8
$orig = $lines -join "`n"

$n1 = 0; $n2 = 0; $n3 = 0
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -like '1. **S29: Familia Gemini*') { $lines[$i] = '1. **S31 (en curso): Retiro de Marketing (DOC-008) + Familia Gemini** - Cierra BUG-006..009, DOC-002/003/006, SEC-016b por eliminacion del modulo.'; $n1++ }
    elseif ($lines[$i] -like '2. **S30: RLS pendiente*') { $lines[$i] = '2. **S32: RLS pendiente (DB-002) + docs desalineadas (DOC-010/011)** - Cierre de deuda post-auditoria.'; $n2++ }
    elseif ($lines[$i] -like '3. **S31+: Higiene tecnica*') { $lines[$i] = '3. **S33+: Higiene tecnica (CONF-003/004/005, DOC-018/019) + TST-001 (tests reales)**'; $n3++ }
}
Write-Host "  Seccion 3: $n1 + $n2 + $n3 reemplazos (esperado 1/1/1)" -ForegroundColor $(if ($n1 -eq 1 -and $n2 -eq 1 -and $n3 -eq 1) { 'Green' } else { 'Yellow' })

$idxStart = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\*\*2026-10-17 - Sesion 25 \(ENV\) - EN CURSO\*\*$') { $idxStart = $i; break }
}
if ($idxStart -ge 0) {
    $idxEnd = $lines.Count
    for ($j = $idxStart + 1; $j -lt $lines.Count; $j++) {
        if ($lines[$j] -match '^\*\*2026-10-\d{2} - Sesion' -or $lines[$j] -match '^## ') { $idxEnd = $j; break }
    }
    $cutEnd = $idxEnd
    while ($cutEnd -gt $idxStart -and $lines[$cutEnd - 1].Trim() -eq '') { $cutEnd-- }
    $removed = $cutEnd - $idxStart
    $before = if ($idxStart -gt 0) { $lines[0..($idxStart - 1)] } else { @() }
    $after  = if ($cutEnd -lt $lines.Count) { $lines[$cutEnd..($lines.Count - 1)] } else { @() }
    $lines = @($before) + @($after)
    Write-Host "  [OK] Bloque S25 EN CURSO eliminado ($removed lineas)" -ForegroundColor Green
} else { Write-Host "  [SKIP] S25 EN CURSO no encontrada" -ForegroundColor Yellow }

$n8a = 0; $n8b = 0; $n8c = 0
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -like '1. BUG-003:*') { $lines[$i] = '1. S31: Retiro de Marketing (DOC-008) + Familia Gemini (cierra BUG-006..009, DOC-002/003/006, SEC-016b)'; $n8a++ }
    elseif ($lines[$i] -like '2. SEC-015/016/017:*') { $lines[$i] = '2. S32: RLS pendiente (DB-002) + docs desalineadas (DOC-010/011)'; $n8b++ }
    elseif ($lines[$i] -like '3. Familia Gemini*') { $lines[$i] = '3. S33+: Higiene tecnica (CONF-003/004/005, DOC-018/019) + TST-001'; $n8c++ }
}
Write-Host "  Seccion 8: $n8a + $n8b + $n8c reemplazos (esperado 1/1/1)" -ForegroundColor $(if ($n8a -eq 1 -and $n8b -eq 1 -and $n8c -eq 1) { 'Green' } else { 'Yellow' })

$new = $lines -join "`n"
if ($new -ne $orig) {
    $out = ($new -split "`n") -join "`r`n"
    [System.IO.File]::WriteAllText($StatusPath, $out, [System.Text.UTF8Encoding]::new($false))
    Write-Host "STATUS.md actualizado." -ForegroundColor Cyan
} else { Write-Host "Sin cambios (idempotente)." -ForegroundColor Yellow }
