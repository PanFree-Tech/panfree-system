# 57b-fix-env-apis-ia.ps1
# Fix del bloque APIS IA SECUNDARIAS: usa regex en vez de Contains con no-ASCII.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root
$utf8 = New-Object System.Text.UTF8Encoding($false)

$envPath = Join-Path $root '.env.example'
$envTxt = [System.IO.File]::ReadAllText($envPath, $utf8)

# Reemplazo linea-por-linea usando regex robusto
$lineas = $envTxt -split "`r`n"
$nuevas = @()
$reemplazado = $false
$enBloque = $false
$contadorLineas = 0

foreach ($l in $lineas) {
    if (-not $reemplazado -and $l -match '^# --- APIS IA SECUNDARIAS') {
        # Empezamos el bloque: reemplazamos el header completo
        $nuevas += '# --- APIS IA SECUNDARIAS (ELIMINADAS en S18) --------------------------------'
        $nuevas += '# Email:  [S] system.panfree@gmail.com'
        $nuevas += '# Estado: ELIMINADAS - ver DOC-013 (35-doc-apis-ia-eliminadas.md)'
        $nuevas += '# Nota: las 13 APIs IA eran plomeria inerte dentro del modulo Marketing (DOC-008).'
        $nuevas += '#       Se eliminaron de Vercel (Production + Preview) en S18.'
        $nuevas += '#       El codigo de Marketing que las referencia se retira junto con el modulo'
        $nuevas += '#       segun el plan de DOC-008. No se crea tarea nueva.'
        $nuevas += '# Si en el futuro se reactiva Marketing, se crean keys nuevas con el flujo estandar.'
        $nuevas += '# ANTHROPIC_API_KEY=      <-- eliminada de Vercel (S18)'
        $nuevas += '# MISTRAL_API_KEY=        <-- eliminada de Vercel (S18)'
        $nuevas += '# GROQ_API_KEY=           <-- eliminada de Vercel (S18)'
        $nuevas += '# DEEPSEEK_API_KEY=       <-- eliminada de Vercel (S18)'
        $nuevas += '# COHERE_API_KEY=         <-- eliminada de Vercel (S18)'
        $nuevas += '# HF_API_KEY=             <-- eliminada de Vercel (S18)'
        $nuevas += '# REPLICATE_API_TOKEN=    <-- eliminada de Vercel (S18)'
        $nuevas += '# LEONARDO_API_KEY=       <-- eliminada de Vercel (S18)'
        $nuevas += '# POLLINATIONS_API_KEY=   <-- eliminada de Vercel (S18)'
        $nuevas += '# CLOUDFLARE_ACCOUNT_ID=  <-- eliminada de Vercel (S18)'
        $nuevas += '# CLOUDFLARE_API_KEY=     <-- eliminada de Vercel (S18)'
        $nuevas += '# AIHUBMIX_API_KEY=       <-- eliminada de Vercel (S18)'
        $nuevas += '# NEXA_API_KEY=           <-- no estaba en Vercel, limpiada de .env.example'
        $nuevas += '# AGNES_API_KEY=          <-- eliminada de Vercel (S18)'
        $enBloque = $true
        $reemplazado = $true
        continue
    }
    if ($enBloque) {
        # Saltamos las lineas del bloque viejo (header ya reemplazado)
        if ($l -match '^# Email:' -or $l -match '^# Estado:' -or `
            $l -match '^# Si no se usan' -or `
            $l -match '^ANTHROPIC_API_KEY=' -or $l -match '^MISTRAL_API_KEY=' -or `
            $l -match '^GROQ_API_KEY=' -or $l -match '^DEEPSEEK_API_KEY=' -or `
            $l -match '^COHERE_API_KEY=' -or $l -match '^HF_API_KEY=' -or `
            $l -match '^REPLICATE_API_TOKEN=' -or $l -match '^LEONARDO_API_KEY=' -or `
            $l -match '^POLLINATIONS_API_KEY=' -or $l -match '^CLOUDFLARE_ACCOUNT_ID=' -or `
            $l -match '^CLOUDFLARE_API_KEY=' -or $l -match '^AIHUBMIX_API_KEY=' -or `
            $l -match '^NEXA_API_KEY=' -or $l -match '^AGNES_API_KEY=') {
            continue
        }
        $enBloque = $false
    }
    $nuevas += $l
}

if ($reemplazado) {
    $nuevoTexto = $nuevas -join "`r`n"
    [System.IO.File]::WriteAllText($envPath, $nuevoTexto, $utf8)
    Write-Host "OK: seccion APIS IA reemplazada (regex robusto)." -ForegroundColor Green
} else {
    Write-Host "AVISO: no se encontro el header. Revisar manualmente." -ForegroundColor Red
}