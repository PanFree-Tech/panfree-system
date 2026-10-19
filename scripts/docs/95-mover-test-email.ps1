# =============================================================
# 95 - Mover test-email fuera del modulo Marketing (PR-1, S31)
# =============================================================

param(
    [string]$RepoRoot = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
)

$ErrorActionPreference = 'Stop'
$oldPath = Join-Path $RepoRoot 'src\app\api\admin\marketing\test-email\route.js'
$newDir  = Join-Path $RepoRoot 'src\app\api\admin\test-email'
$newPath = Join-Path $newDir 'route.js'
$caller  = Join-Path $RepoRoot 'src\app\admin\correos\page.js'

Write-Host "== 95 - Mover test-email ==" -ForegroundColor Cyan

if (Test-Path -LiteralPath $oldPath) {
    New-Item -ItemType Directory -Force -Path $newDir | Out-Null
    Push-Location $RepoRoot
    git mv 'src/app/api/admin/marketing/test-email/route.js' 'src/app/api/admin/test-email/route.js'
    $mvExit = $LASTEXITCODE
    Pop-Location
    if ($mvExit -ne 0) { Write-Error "git mv fallo (exit $mvExit)"; exit 1 }
    Write-Host "  [OK] git mv ejecutado" -ForegroundColor Green
} elseif (Test-Path -LiteralPath $newPath) {
    Write-Host "  [SKIP] Ya movido (idempotente)" -ForegroundColor Yellow
} else {
    Write-Error "No existe ni el origen ni el destino"
    exit 1
}

$txt = Get-Content -LiteralPath $newPath -Raw -Encoding UTF8
$orig = $txt
$txt = $txt.Replace('UBICACIÃ"N: src/app/api/admin/marketing/test-email/route.js', 'UBICACIÃ"N: src/app/api/admin/test-email/route.js')
$txt = $txt.Replace('UBICACIÓN: src/app/api/admin/marketing/test-email/route.js', 'UBICACIÓN: src/app/api/admin/test-email/route.js')
$txt = $txt.Replace('ENDPOINT: GET & POST /api/admin/marketing/test-email', 'ENDPOINT: GET & POST /api/admin/test-email')
if ($txt -ne $orig) {
    [System.IO.File]::WriteAllText($newPath, $txt, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  [OK] Header actualizado en route.js" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] Header ya actualizado" -ForegroundColor Yellow
}

$ctxt = Get-Content -LiteralPath $caller -Raw -Encoding UTF8
$corig = $ctxt
$ctxt = $ctxt.Replace("'/api/admin/marketing/test-email'", "'/api/admin/test-email'")
if ($ctxt -ne $corig) {
    [System.IO.File]::WriteAllText($caller, $ctxt, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  [OK] Caller actualizado en correos/page.js" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] Caller ya actualizado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Verificacion:" -ForegroundColor Magenta
$hits = Get-ChildItem -Recurse (Join-Path $RepoRoot 'src') -Include *.js,*.jsx |
    Select-String -Pattern "marketing/test-email" |
    Select-Object Path, LineNumber, Line
if ($hits) {
    Write-Host "  [WARN] Quedan referencias a marketing/test-email:" -ForegroundColor Yellow
    $hits | Format-Table -AutoSize -Wrap
} else {
    Write-Host "  [OK] 0 referencias a marketing/test-email" -ForegroundColor Green
}

$newRefs = Get-ChildItem -Recurse (Join-Path $RepoRoot 'src') -Include *.js,*.jsx |
    Select-String -Pattern "/api/admin/test-email" |
    Select-Object Path, LineNumber, Line
Write-Host "  Referencias a /api/admin/test-email: $($newRefs.Count)"
$newRefs | Format-Table -AutoSize -Wrap

Write-Host ""
Write-Host "Siguiente: git status && git diff --stat" -ForegroundColor Cyan
