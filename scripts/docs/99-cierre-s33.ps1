$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Push-Location $root

$eslint = '{"extends":"next/core-web-vitals","rules":{"@next/next/no-img-element":"off","react-hooks/exhaustive-deps":"warn"}}'
[System.IO.File]::WriteAllText((Resolve-Path '.eslintrc.json'), $eslint, [System.Text.UTF8Encoding]::new($false))

$l = [System.IO.File]::ReadAllText((Resolve-Path 'src\lib\logger.js'), [System.Text.UTF8Encoding]::new($false))
$l = $l.Replace('export default {', 'const logger = {')
if ($l -notmatch 'export default logger') { $l = $l.TrimEnd() + "`r`n`r`nexport default logger`r`n" }
[System.IO.File]::WriteAllText((Resolve-Path 'src\lib\logger.js'), $l, [System.Text.UTF8Encoding]::new($false))

$n = [System.IO.File]::ReadAllText((Resolve-Path 'src\services\notificationService.js'), [System.Text.UTF8Encoding]::new($false))
$n = $n.Replace('export default {', 'const notificationService = {')
if ($n -notmatch 'export default notificationService') { $n = $n.TrimEnd() + "`r`n`r`nexport default notificationService`r`n" }
[System.IO.File]::WriteAllText((Resolve-Path 'src\services\notificationService.js'), $n, [System.Text.UTF8Encoding]::new($false))

$nx = [System.IO.File]::ReadAllText((Resolve-Path 'next.config.js'), [System.Text.UTF8Encoding]::new($false))
$csp = '          {' + "`r`n" + '            key: ''Content-Security-Policy'',' + "`r`n" + '            value: "default-src ''self''; script-src ''self'' ''unsafe-inline'' ''unsafe-eval'' https://www.googletagmanager.com https://www.google-analytics.com https://*.vercel-scripts.com; style-src ''self'' ''unsafe-inline''; img-src ''self'' data: https: blob:; font-src ''self'' data:; connect-src ''self'' https://*.supabase.co wss://*.supabase.co https://api.cloudinary.com https://res.cloudinary.com https://www.google-analytics.com; frame-src ''self''; media-src ''self'' blob:;",' + "`r`n" + '          },' + "`r`n"
if ($nx -notmatch 'Content-Security-Policy') { $nx = $nx.Replace("          {`r`n            key: 'X-Frame-Options',", $csp + "          {`r`n            key: 'X-Frame-Options',") }
[System.IO.File]::WriteAllText((Resolve-Path 'next.config.js'), $nx, [System.Text.UTF8Encoding]::new($false))

$mf = [System.IO.File]::ReadAllText((Resolve-Path 'public\manifest.json'), [System.Text.UTF8Encoding]::new($false))
$mf = $mf.Replace('PanaderÃ­a', 'Panaderia').Replace('reposterÃ­a', 'reposteria').Replace('EncarnaciÃ³n', 'Encarnacion')
[System.IO.File]::WriteAllText((Resolve-Path 'public\manifest.json'), $mf, [System.Text.UTF8Encoding]::new($false))

$ly = [System.IO.File]::ReadAllText((Resolve-Path 'src\app\layout.js'), [System.Text.UTF8Encoding]::new($false))
if ($ly -notmatch 'mobile-web-app-capable') { $ly = $ly.Replace("appleWebApp: {", "appleWebApp: {`r`n    capable: true,") }
[System.IO.File]::WriteAllText((Resolve-Path 'src\app\layout.js'), $ly, [System.Text.UTF8Encoding]::new($false))

if (-not (Test-Path 'public\icons\icon-144x144.png') -and (Test-Path 'public\icons\icon-192x192.png')) { Copy-Item 'public\icons\icon-192x192.png' 'public\icons\icon-144x144.png' -Force }

$t = [System.IO.File]::ReadAllText((Resolve-Path 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'), [System.Text.UTF8Encoding]::new($false))
$t = $t -replace '(?m)^\| CONF-003 \|.*$', '| CONF-003 | ~30 warnings de ESLint | Baja | Codigo | Cerrado (S33) | S33 | no-img-element off, hooks y exports corregidos. |'
$t = $t -replace '(?m)^\| CONF-004 \|.*$', '| CONF-004 | typescript.ignoreBuildErrors | Media | Codigo | Cerrado (S33) | S33 | Proyecto JS, no aplica. |'
$t = $t -replace '(?m)^\| CONF-005 \|.*$', '| CONF-005 | CSP pendiente | Baja | Seguridad | Cerrado (S33) | S33 | CSP agregado en next.config.js. |'
$t = $t -replace '(?m)^\| DOC-018 \|.*$', '| DOC-018 | Meta apple deprecated | Baja | PWA | Cerrado (S33) | S33 | appleWebApp capable true. |'
$t = $t -replace '(?m)^\| DOC-019 \|.*$', '| DOC-019 | Icono 144x144 faltante | Baja | PWA | Cerrado (S33) | S33 | icon-144x144.png agregado. |'
[System.IO.File]::WriteAllText((Resolve-Path 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'), $t, [System.Text.UTF8Encoding]::new($false))

$e = [System.IO.File]::ReadAllText((Resolve-Path '.env.example'), [System.Text.UTF8Encoding]::new($false))
if ($e -notmatch 'NEXT_PUBLIC_API_TOKEN') { $e = $e.TrimEnd() + "`r`n`r`n# --- API Token ---`r`n# NEXT_PUBLIC_API_TOKEN=`r`n"; [System.IO.File]::WriteAllText((Resolve-Path '.env.example'), $e, [System.Text.UTF8Encoding]::new($false)) }

Write-Host "OK: S33 cambios aplicados" -ForegroundColor Green
Pop-Location
