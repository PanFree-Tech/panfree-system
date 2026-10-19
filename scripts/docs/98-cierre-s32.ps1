$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Push-Location $root
$trackPath = 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$t = [System.IO.File]::ReadAllText((Resolve-Path $trackPath), [System.Text.UTF8Encoding]::new($false))
$t = $t -replace '(?m)^\| DB-002 \|.*$', '| DB-002 | `stock_movimientos` RLS sin politicas | INFO | DB | Cerrado (S32) | S32 | RLS habilitado, 0 politicas. Solo accesible via service_role/dashboard. 0 referencias en frontend. Estado seguro. |'
$t = $t -replace '(?m)^\| DB-003 \|.*$', '| DB-003 | Tablas huerfanas tras retiro de Marketing: `reglas_promocion`, `promociones_historico`, `instagram_posts` | Baja | DB | Cerrado (S32) | S32 | Tablas dropeadas con migracion `2026-10-19-s32-drop-tablas-marketing.sql`. Backup de `reglas_promocion` (4 filas) en `docs/audits/2026-10-13-inicial/48-s32-backup-reglas-promocion.json`. |'
[System.IO.File]::WriteAllText((Resolve-Path $trackPath), $t, [System.Text.UTF8Encoding]::new($false))
$envPath = '.env.example'
$e = [System.IO.File]::ReadAllText((Resolve-Path $envPath), [System.Text.UTF8Encoding]::new($false))
$e = $e -replace '(?m)^.*INSTAGRAM_ACCESS_TOKEN.*\r?\n', ''
$e = $e -replace '(?m)^.*INSTAGRAM_BUSINESS_ID.*\r?\n', ''
if ($e -notmatch 'CLOUDINARY_CLOUD_NAME') { $e = $e -replace '(?m)^(CLOUDINARY_API_KEY=)', "CLOUDINARY_CLOUD_NAME=`r`n`$1" }
if ($e -notmatch 'GA4_PROJECT_ID') { $e = $e.TrimEnd() + "`r`n`r`n# --- GA4 Service Account (plomeria inerte, DOC-014) ---`r`n# GA4_PROJECT_ID=`r`n# GA4_PRIVATE_KEY=`r`n# GA4_CLIENT_EMAIL=`r`n" }
[System.IO.File]::WriteAllText((Resolve-Path $envPath), $e, [System.Text.UTF8Encoding]::new($false))
Write-Host "OK: tracking y .env.example actualizados" -ForegroundColor Green
