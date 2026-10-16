# 54-auditar-secrets.ps1
# Auditoria previa F2-13: ver donde se usan CRON_SECRET y WEBHOOK_SECRET.
# SOLO LECTURA. No modifica nada del repo.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root

Write-Host ""
Write-Host "=== AUDITORIA secrets internos (F2-13) ===" -ForegroundColor Cyan
Write-Host "Solo lectura. No se modifica nada." -ForegroundColor DarkGray
Write-Host ""

$patterns = @('CRON_SECRET', 'WEBHOOK_SECRET', 'REVALIDATE_SECRET')
$srcPath = Join-Path $root 'src'

if (-not (Test-Path -LiteralPath $srcPath)) {
    Write-Host "ERROR: no existe $srcPath" -ForegroundColor Red
    exit 1
}

$allMatches = @()

foreach ($p in $patterns) {
    Write-Host "--- Patron: $p ---" -ForegroundColor Yellow

    $matches = Get-ChildItem -Path $srcPath -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx,*.mjs `
        | Select-String -Pattern $p -SimpleMatch -CaseSensitive:$false

    if ($matches) {
        foreach ($m in $matches) {
            $rel = $m.Path.Replace($root + '\', '')
            $line = $m.Line.Trim()
            if ($line.Length -gt 120) { $line = $line.Substring(0, 120) + '...' }
            Write-Host ("  {0}:{1}" -f $rel, $m.LineNumber) -ForegroundColor White
            Write-Host ("    {0}" -f $line) -ForegroundColor DarkGray
            $allMatches += [PSCustomObject]@{
                Patron = $p
                Archivo = $rel
                Linea = $m.LineNumber
                Texto = $line
            }
        }
    } else {
        Write-Host "  (sin coincidencias)" -ForegroundColor DarkGray
    }
    Write-Host ""
}

Write-Host "=== RESUMEN ===" -ForegroundColor Cyan
Write-Host ("Total coincidencias: {0}" -f $allMatches.Count) -ForegroundColor White
$archivosUnicos = @($allMatches | Select-Object -ExpandProperty Archivo -Unique)
Write-Host ("Archivos unicos: {0}" -f $archivosUnicos.Count) -ForegroundColor White
foreach ($a in $archivosUnicos) {
    Write-Host ("  - {0}" -f $a) -ForegroundColor White
}
Write-Host ""
Write-Host "PROXIMO PASO: pegame la salida." -ForegroundColor Cyan