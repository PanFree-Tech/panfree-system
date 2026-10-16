# 56b-eliminar-apis-ia.ps1
# Elimina las 13 APIs IA de Vercel (Production + Preview).
# Usa echo y | para auto-confirmar cada prompt de vercel env rm.

$ErrorActionPreference = 'Continue'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root

$vars = @(
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
    'REPLICATE_API_TOKEN'
)

$entornos = @('production', 'preview')

foreach ($v in $vars) {
    foreach ($e in $entornos) {
        Write-Host ("--- {0} ({1}) ---" -f $v, $e) -ForegroundColor Cyan
        Write-Host "y" | vercel env rm $v $e
    }
    Write-Host ""
}

Write-Host "=== Verificacion final ===" -ForegroundColor Green
Write-Host "Buscando las 13 vars eliminadas (esperado: sin coincidencias)..." -ForegroundColor Cyan
$patrones = 'ANTHROPIC_API_KEY|MISTRAL_API_KEY|DEEPSEEK_API_KEY|COHERE_API_KEY|GROQ_API_KEY|CLOUDFLARE_ACCOUNT_ID|CLOUDFLARE_API_KEY|POLLINATIONS_API_KEY|HF_API_KEY|AIHUBMIX_API_KEY|LEONARDO_API_KEY|AGNES_API_KEY|REPLICATE_API_TOKEN'
vercel env ls | Select-String -Pattern $patrones -CaseSensitive:$false

Write-Host ""
Write-Host "PROXIMO PASO: pegame la salida." -ForegroundColor Cyan