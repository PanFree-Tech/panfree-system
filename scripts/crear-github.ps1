# crear-github.ps1
# Crea los archivos base de .github

$ErrorActionPreference = "Stop"

Write-Host "=== Creando archivos de .github ===" -ForegroundColor Cyan

# Funcion auxiliar para escribir sin BOM
function Write-FileNoBom {
    param(
        [string]$Path,
        [string]$Content
    )
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText((Join-Path (Get-Location) $Path), $Content, $utf8NoBom)
    Write-Host "[OK] $Path" -ForegroundColor Green
}

# --- .github/PULL_REQUEST_TEMPLATE.md ---
$content = @"
## Descripcion

Describi brevemente que cambios trae este PR.

## Tipo de cambio

- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Refactor
- [ ] Documentacion
- [ ] Seguridad
- [ ] Performance

## Checklist

- [ ] npm run lint pasa
- [ ] npm run build compila
- [ ] No hay secretos en el codigo
- [ ] Actualice documentacion
- [ ] Tests pasan

## Capturas (si aplica)

## Referencias
"@
Write-FileNoBom -Path ".github/PULL_REQUEST_TEMPLATE.md" -Content $content

# --- .github/ISSUE_TEMPLATE/bug_report.md ---
$content = @"
---
name: Bug report
about: Reportar un comportamiento incorrecto
title: '[BUG] '
labels: bug
---

## Descripcion

Describi claramente el bug.

## Pasos para reproducir

1.
2.
3.

## Comportamiento esperado

## Comportamiento actual

## Screenshots

## Entorno

- OS:
- Navegador:
- Version:

## Contexto adicional
"@
Write-FileNoBom -Path ".github/ISSUE_TEMPLATE/bug_report.md" -Content $content

# --- .github/ISSUE_TEMPLATE/feature_request.md ---
$content = @"
---
name: Feature request
about: Sugerir una nueva funcionalidad
title: '[FEAT] '
labels: enhancement
---

## Problema a resolver

## Solucion propuesta

## Alternativas consideradas

## Contexto adicional
"@
Write-FileNoBom -Path ".github/ISSUE_TEMPLATE/feature_request.md" -Content $content

# --- .github/workflows/ci.yml ---
$content = @"
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test -- --passWithNoTests

      - name: Build
        run: npm run build
"@
Write-FileNoBom -Path ".github/workflows/ci.yml" -Content $content

# --- .github/workflows/security-scan.yml ---
$content = @"
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: `${{ secrets.GITHUB_TOKEN }}

  npm-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Audit
        run: npm audit --audit-level=high || true
"@
Write-FileNoBom -Path ".github/workflows/security-scan.yml" -Content $content

Write-Host ""
Write-Host "=== Archivos creados ===" -ForegroundColor Cyan
Get-ChildItem -Path .github -Recurse -File | ForEach-Object { Write-Host "  $($_.FullName.Replace($PWD.Path + '\', ''))" }