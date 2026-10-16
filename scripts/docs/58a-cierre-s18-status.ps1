# 58a-cierre-s18-status.ps1
# Marca S18 como completa en STATUS.md
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root
$utf8 = New-Object System.Text.UTF8Encoding($false)

$path = Join-Path $root 'docs\STATUS.md'
$t = [System.IO.File]::ReadAllText($path, $utf8)

# 1.1 Fecha + progreso global
$t = $t.Replace(
    '**Ultima actualizacion:** 2026-10-16 (Sesion 18 en curso)',
    '**Ultima actualizacion:** 2026-10-16 (fin Sesion 18)'
)
$t = $t.Replace(
    '**Progreso global:** 68% (32 de 47 tareas)',
    '**Progreso global:** 70% (33 de 47 tareas)'
)

# 1.2 Fila F2: 9 OK -> 10 OK
$t = $t.Replace(
    '| F2 - Rotacion claves | 14 | 9 | 0 | 5 | 64% |',
    '| F2 - Rotacion claves | 14 | 10 | 0 | 4 | 71% |'
)

# 1.3 Fila Total
$t = $t.Replace(
    '| **Total** | **47** | **32** | **0** | **15** | **68%** |',
    '| **Total** | **47** | **33** | **0** | **14** | **70%** |'
)

# 1.4 Proximos 3 pasos
$t = $t.Replace(
    '1. **F2-11** - Rotar GA4 API secret (auditar los 2 juegos primero, ver SEC-023)' + "`r`n" +
    '2. **F2-12** - Regenerar par VAPID (verificar SEC-024 antes)' + "`r`n" +
    '3. **F2-13** - Auditar APIs IA secundarias',
    '1. **F2-11** - Rotar GA4 API secret (auditar los 2 juegos primero, ver SEC-023)' + "`r`n" +
    '2. **F2-12** - Regenerar par VAPID (verificar SEC-024 antes)' + "`r`n" +
    '3. **F2-14** - Guardar .env consolidado en Bitwarden'
)

[System.IO.File]::WriteAllText($path, $t, $utf8)
Write-Host "OK: STATUS actualizado para cierre de S18." -ForegroundColor Green