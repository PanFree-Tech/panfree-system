# 99-generar-dump-s18.ps1
# Genera dump-s19-prep.txt con el estado completo al cierre de S18.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $root

$out = "dump-s19-prep.txt"
$files = @(
    'docs\STATUS.md',
    'docs\BITACORA.md',
    'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md',
    'docs\audits\2026-10-13-inicial\30-doc-meta-plomeria-inerte.md',
    'docs\audits\2026-10-13-inicial\31-doc-008-seccion-marketing.md',
    'docs\audits\2026-10-13-inicial\32-doc-n8n-plomeria-inerte.md',
    'docs\audits\2026-10-13-inicial\33-doc-vercel-hallazgos.md',
    'docs\audits\2026-10-13-inicial\34-doc-secrets-internos-plomeria-inerte.md',
    'docs\audits\2026-10-13-inicial\35-doc-apis-ia-eliminadas.md',
    'docs\operations\PLAN-DE-TRABAJO.md',
    'docs\operations\ROTACION-CLAVES.md',
    'docs\operations\ENVIRONMENT.md',
    'docs\operations\SISTEMA-DE-TRABAJO.md',
    'docs\operations\GESTION-DE-RIESGOS.md',
    '.env.example'
)

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("=== DUMP S19 PREP - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("=== GIT LOG (ultimos 20) ===")
[void]$sb.AppendLine((git log --oneline -20) -join "`r`n")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("=== GIT STATUS (branch + short) ===")
[void]$sb.AppendLine((git status --short --branch) -join "`r`n")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("=== HEAD ===")
[void]$sb.AppendLine((git rev-parse HEAD))
[void]$sb.AppendLine("")
[void]$sb.AppendLine("=== VERCEL ENV (nombres + entornos) ===")
[void]$sb.AppendLine((vercel env ls) -join "`r`n")

foreach ($f in $files) {
    [void]$sb.AppendLine("")
    if (Test-Path -LiteralPath $f) {
        [void]$sb.AppendLine("=== $f ===")
        [void]$sb.AppendLine([System.IO.File]::ReadAllText((Resolve-Path $f), (New-Object System.Text.UTF8Encoding($false))))
    } else {
        [void]$sb.AppendLine("=== $f (NO EXISTE) ===")
    }
}

$content = $sb.ToString()
[System.IO.File]::WriteAllText((Join-Path $root $out), $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "OK: $out generado ($($content.Length) chars)" -ForegroundColor Green
Write-Host "Path: $root\$out" -ForegroundColor Cyan