# PowerShell
# =============================================================================
# 23b3 - Commit + push: documentar cierre F3-04 / AUTH-001
# =============================================================================

[CmdletBinding()]
param(
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $repoRoot

Write-Host ''
Write-Host ('=' * 70) -ForegroundColor Magenta
Write-Host '  23b3 - Commit documentacion F3-04' -ForegroundColor Magenta
Write-Host ('=' * 70) -ForegroundColor Magenta

if (-not $Commit) {
    Write-Host '  Modo: DRY RUN' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '  git status --short actual:' -ForegroundColor Cyan
    git status --short
    Write-Host ''
    Write-Host '  Archivos que se commitearian:' -ForegroundColor Cyan
    Write-Host '    docs/STATUS.md'
    Write-Host '    docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md'
    Write-Host '    docs/operations/PLAN-DE-TRABAJO.md'
    Write-Host '    docs/audits/2026-10-13-inicial/20-f3-04-auth-001-password.md'
    Write-Host ''
    Write-Host '  Para commitear:' -ForegroundColor Yellow
    Write-Host '    .\scripts\docs\23b3-commit.ps1 -Commit' -ForegroundColor Yellow
    exit 0
}

Write-Host '  Modo: COMMIT + PUSH' -ForegroundColor Yellow
Write-Host ''

git add docs/STATUS.md
git add docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md
git add docs/operations/PLAN-DE-TRABAJO.md
git add docs/audits/2026-10-13-inicial/20-f3-04-auth-001-password.md

Write-Host '  git diff --cached --stat:' -ForegroundColor Cyan
git diff --cached --stat

git commit -m "docs(audit): documentar cierre F3-04 (AUTH-001)"
Write-Host '  OK: commit creado.' -ForegroundColor Green

git push origin main
Write-Host '  OK: push completado.' -ForegroundColor Green

Write-Host ''
Write-Host '  git log --oneline -4:' -ForegroundColor Cyan
git log --oneline -4

Write-Host ''
Write-Host '  git status --short:' -ForegroundColor Cyan
git status --short

Write-Host ''