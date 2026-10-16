# 56-auditar-apis-ia.ps1
# Auditoria previa F2-13: ver donde se usan las APIs IA secundarias.
# SOLO LECTURA. No modifica nada del repo.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root

Write-Host ""
Write-Host "=== AUDITORIA APIs IA secundarias (F2-13) ===" -ForegroundColor Cyan
Write-Host "Solo lectura. No se modifica nada." -ForegroundColor DarkGray
Write-Host ""

$patterns = @(
    'ANTHROPIC_API_KEY',
    'MISTRAL_API_KEY',
    'DEEPSEEK_API_KEY',
    'COHERE_API_KEY',
    'GROQ_API_KEY',
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_API_KEY',
    'POLLINATIONS_API_KEY',
    'HF_API_KEY',
    'AIHUBMIX_API_KEY',
    'LEONARDO_API_KEY',
    'AGNES_API_KEY',
    'REPLICATE_API_TOKEN',
    'NEXA_API_KEY'
)

$srcPath = Join-Path $root 'src'

if (-not (Test-Path -LiteralPath $srcPath)) {
    Write-Host "ERROR: no existe $srcPath" -ForegroundColor Red
    exit 1
}

$allMatches = @()

foreach ($p in $patterns) {
    $matches = Get-ChildItem -Path $srcPath -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx,*.mjs `
        | Select-String -Pattern $p -SimpleMatch -CaseSensitive:$false

    if ($matches) {
        Write-Host ("--- {0}: {1} coincidencias ---" -f $p, $matches.Count) -ForegroundColor Yellow
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
        Write-Host ("--- {0}: (sin coincidencias) ---" -f $p) -ForegroundColor DarkGray
    }
    Write-Host ""
}

Write-Host "=== RESUMEN ===" -ForegroundColor Cyan
Write-Host ("Total coincidencias: {0}" -f $allMatches.Count) -ForegroundColor White

$patronesUsados = @($allMatches | Select-Object -ExpandProperty Patron -Unique)
$patronesNoUsados = $patterns | Where-Object { $_ -notin $patronesUsados }

Write-Host ""
Write-Host ("APIs USADAS en codigo ({0}):" -f $patronesUsados.Count) -ForegroundColor Green
foreach ($p in $patronesUsados) { Write-Host ("  - {0}" -f $p) -ForegroundColor Green }

Write-Host ""
Write-Host ("APIs NO USADAS ({0}):" -f $patronesNoUsados.Count) -ForegroundColor Red
foreach ($p in $patronesNoUsados) { Write-Host ("  - {0}" -f $p) -ForegroundColor Red }

Write-Host ""
Write-Host "PROXIMO PASO: pegame la salida." -ForegroundColor Cyan