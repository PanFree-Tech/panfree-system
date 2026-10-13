# 09-handoff-package.ps1
# Genera el Handoff Package de la sesion actual.
# Consolida STATUS + BITACORA + tracking + plan + sistema en un solo .md
# listo para pegar en una nueva conversacion con la IA.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\09-handoff-package.ps1
#
# Salida:
#   docs/HANDOFF-YYYY-MM-DD.md

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $RepoRoot

Write-Host "=== Generando Handoff Package ===" -ForegroundColor Cyan
Write-Host ""

$today = Get-Date -Format "yyyy-MM-dd"
$outFile = "docs/HANDOFF-$today.md"

# Funcion auxiliar
function Read-DocSafe {
    param([string]$Path)
    if (Test-Path $Path) {
        return (Get-Content $Path -Raw -Encoding UTF8)
    } else {
        return "[ARCHIVO NO ENCONTRADO: $Path]"
    }
}

$sb = New-Object System.Text.StringBuilder
function Add-Line { param([string]$t = "") [void]$sb.AppendLine($t) }

# ============================================================
# HEADER
# ============================================================
Add-Line "# HANDOFF PACKAGE - PanFree System"
Add-Line "**Generado:** $today"
Add-Line "**Repo:** PanFree-Tech/panfree-system"
Add-Line "**Local:** C:\Users\Admin\proyectos\panfree-system"
Add-Line "**Uso:** pegar este archivo al inicio de la nueva conversacion con la IA"
Add-Line ""
Add-Line "---"
Add-Line ""
Add-Line "## INSTRUCCIONES PARA LA IA"
Add-Line ""
Add-Line "1. Lee completo este documento antes de responder."
Add-Line "2. Confirma el contexto en el primer mensaje."
Add-Line "3. Lee los 5 documentos embebidos a continuacion."
Add-Line "4. Espera a que el usuario confirme el primer paso antes de generar scripts."
Add-Line ""
Add-Line "**Idioma:** espanol siempre. Nunca chino."
Add-Line ""
Add-Line "**Reglas de trabajo:**"
Add-Line "- Scripts PowerShell en scripts/docs/ con numeracion secuencial"
Add-Line "- Scripts menores a 400 lineas: 1 bloque completo"
Add-Line "- Usar VS Code, no Notepad"
Add-Line "- Conventional Commits"
Add-Line "- Actualizar STATUS.md y BITACORA.md al cerrar sesion"
Add-Line "- Verificar links con 00-verificar-links.ps1"
Add-Line "- No usar here-strings para bloques Markdown grandes (usar arrays)"
Add-Line ""
Add-Line "---"
Add-Line ""

# ============================================================
# DOC 1: STATUS.md
# ============================================================
Add-Line "## DOCUMENTO 1: STATUS.md"
Add-Line ""
Add-Line '```markdown'
Add-Line (Read-DocSafe "docs/STATUS.md")
Add-Line '```'
Add-Line ""
Add-Line "---"
Add-Line ""

# ============================================================
# DOC 2: BITACORA.md (ultimas 2 entradas)
# ============================================================
Add-Line "## DOCUMENTO 2: BITACORA.md (resumen)"
Add-Line ""
Add-Line '```markdown'
$bitacoraContent = Read-DocSafe "docs/BITACORA.md"
$parts = $bitacoraContent -split "`n## 2026-"
if ($parts.Length -ge 3) {
    $last2 = "## 2026-" + $parts[-2] + "`n## 2026-" + $parts[-1]
    Add-Line $last2
} else {
    Add-Line $bitacoraContent
}
Add-Line '```'
Add-Line ""
Add-Line "---"
Add-Line ""

# ============================================================
# DOC 3: Hallazgos tracking
# ============================================================
Add-Line "## DOCUMENTO 3: 06-hallazgos-tracking.md"
Add-Line ""
Add-Line '```markdown'
Add-Line (Read-DocSafe "docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md")
Add-Line '```'
Add-Line ""
Add-Line "---"
Add-Line ""

# ============================================================
# DOC 4: PLAN-DE-TRABAJO.md
# ============================================================
Add-Line "## DOCUMENTO 4: PLAN-DE-TRABAJO.md"
Add-Line ""
Add-Line '```markdown'
Add-Line (Read-DocSafe "docs/operations/PLAN-DE-TRABAJO.md")
Add-Line '```'
Add-Line ""
Add-Line "---"
Add-Line ""

# ============================================================
# DOC 5: SISTEMA-DE-TRABAJO.md
# ============================================================
Add-Line "## DOCUMENTO 5: SISTEMA-DE-TRABAJO.md"
Add-Line ""
Add-Line '```markdown'
Add-Line (Read-DocSafe "docs/operations/SISTEMA-DE-TRABAJO.md")
Add-Line '```'
Add-Line ""
Add-Line "---"
Add-Line ""

# ============================================================
# CIERRE
# ============================================================
Add-Line "## PROXIMO PASO"
Add-Line ""
Add-Line "Confirmar contexto con la IA y arrancar la proxima tarea segun STATUS.md."
Add-Line ""
Add-Line "---"
Add-Line ""
Add-Line "*Handoff Package generado automaticamente por scripts/docs/09-handoff-package.ps1*"

# Escribir
$content = $sb.ToString()
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $outFile), $content, $utf8NoBom)

Write-Host "[OK] Handoff Package generado:" -ForegroundColor Green
Write-Host "     $outFile" -ForegroundColor Green
Write-Host ""
Write-Host "Tamano: $((Get-Item $outFile).Length) bytes" -ForegroundColor Yellow
Write-Host ""
Write-Host "=== Proximos pasos ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Abrir el archivo con VS Code:"
Write-Host "   code $outFile"
Write-Host ""
Write-Host '2. Copiar todo el contenido con Ctrl+A, luego Ctrl+C'
Write-Host ""
Write-Host "3. Pegar en la nueva conversacion con la IA"
Write-Host ""
Write-Host "4. Compartir tambien estos archivos (opcional, si el contexto lo permite):"
Write-Host "   - supabase/schemas/README.md"
Write-Host "   - docs/architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md"
Write-Host "   - docs/audits/2026-10-13-inicial/02-supabase-advisors.md"
Write-Host ""
Write-Host '5. NO incluir credenciales (anon key, passwords, connection strings)'
Write-Host ""