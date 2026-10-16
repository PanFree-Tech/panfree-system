# 52-auditar-n8n.ps1
# Auditoria previa F2-10: determinar si n8n esta activo o es plomeria inerte.
# SOLO LECTURA. No modifica nada del repo.

$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root

Write-Host ""
Write-Host "=== AUDITORIA n8n (F2-10) ===" -ForegroundColor Cyan
Write-Host "Solo lectura. No se modifica nada." -ForegroundColor DarkGray
Write-Host ""

# 1. Buscar referencias en src/
$patterns = @('N8N_WEBHOOK_TOKEN', 'N8N_INCOMING_TOKEN', 'N8N_WEBHOOK_URL', 'n8n')
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

# 2. Resumen
Write-Host "=== RESUMEN ===" -ForegroundColor Cyan
Write-Host ("Total coincidencias: {0}" -f $allMatches.Count) -ForegroundColor White
$archivosUnicos = @($allMatches | Select-Object -ExpandProperty Archivo -Unique)
Write-Host ("Archivos unicos: {0}" -f $archivosUnicos.Count) -ForegroundColor White
foreach ($a in $archivosUnicos) {
    Write-Host ("  - {0}" -f $a) -ForegroundColor White
}
Write-Host ""

# 3. Guardar reporte temporal (NO se commitea)
$reportPath = Join-Path $root 'docs\audits\2026-10-13-inicial\32-audit-n8n.txt'
$reportDir = Split-Path $reportPath -Parent
if (-not (Test-Path -LiteralPath $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("=== AUDITORIA n8n (F2-10) - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===")
[void]$sb.AppendLine("")
[void]$sb.AppendLine(("Total coincidencias: {0}" -f $allMatches.Count))
[void]$sb.AppendLine(("Archivos unicos: {0}" -f $archivosUnicos.Count))
foreach ($a in $archivosUnicos) {
    [void]$sb.AppendLine(("  - {0}" -f $a))
}
[void]$sb.AppendLine("")
foreach ($m in $allMatches) {
    [void]$sb.AppendLine(("[{0}] {1}:{2}" -f $m.Patron, $m.Archivo, $m.Linea))
    [void]$sb.AppendLine(("    {0}" -f $m.Texto))
}

[System.IO.File]::WriteAllText($reportPath, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))

Write-Host ("Reporte guardado en: {0}" -f $reportPath) -ForegroundColor Green
Write-Host ""
Write-Host "PROXIMO PASO: pegame la salida de este script." -ForegroundColor Cyan
Write-Host "Segun el resultado, decidimos si F2-10 rota o se reformula a 'No aplica'." -ForegroundColor Cyan