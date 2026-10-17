# scripts/docs/83-cierre-final-s24.ps1
# S24 - Actualizar BITACORA y doc 41 con el numero de ticket de GitHub Support
# Preserva line endings. Idempotente.

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$ticket = '#4869059'

# --- 1. Actualizar Doc 41 ---
$doc41 = "docs\audits\2026-10-13-inicial\41-f4-01-purga-historial.md"
if (Test-Path $doc41) {
    $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $doc41).Path)
    $contenido = [System.Text.Encoding]::UTF8.GetString($bytes)
    
    if (-not $contenido.Contains($ticket)) {
        $contenido = $contenido.Replace(
            '- [ ] F4-02: ticket a GitHub Support.',
            "- [x] F4-02: ticket a GitHub Support creado ($ticket)."
        )
        $contenido = $contenido.Replace(
            '- [F4-02 - Ticket GitHub Support](../../operations/PLAN-DE-TRABAJO.md)',
            "- [F4-02 - Ticket GitHub Support](../../operations/PLAN-DE-TRABAJO.md)`n- Ticket de GitHub Support: $ticket"
        )
        $utf8SinBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText((Resolve-Path $doc41).Path, $contenido, $utf8SinBom)
        Write-Host "[OK] Doc 41 actualizado con ticket $ticket" -ForegroundColor Green
    }
}

# --- 2. Actualizar BITACORA ---
$bitacora = "docs\BITACORA.md"
$bytesB = [System.IO.File]::ReadAllBytes((Resolve-Path $bitacora).Path)
$contenidoB = [System.Text.Encoding]::UTF8.GetString($bytesB)

if (-not $contenidoB.Contains($ticket)) {
    $contenidoB = $contenidoB.Replace(
        '- Redactado y enviado a https://support.github.com/contact.',
        "- Redactado y enviado a https://support.github.com/contact. Ticket: $ticket"
    )
    $utf8SinBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText((Resolve-Path $bitacora).Path, $contenidoB, $utf8SinBom)
    Write-Host "[OK] BITACORA actualizada con ticket $ticket" -ForegroundColor Green
}