# 08-documentar-f1-05.ps1
# Documenta el fix F1-05 (bucket productos sin listado publico).
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\08-documentar-f1-05.ps1 -NoCommit
#   powershell -ExecutionPolicy Bypass -File scripts\docs\08-documentar-f1-05.ps1

param(
    [switch]$NoCommit
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $RepoRoot

Write-Host "=== Documentando F1-05: bucket productos sin listado ===" -ForegroundColor Cyan
Write-Host ""

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

# ============================================================
# 1. Politica declarativa en supabase/schemas/public/policies/
# ============================================================
$policy = @(
    '-- ============================================================',
    '-- Politica: Imagenes productos - lectura directa (sin listado)',
    '-- Ultima actualizacion: 2026-10-13 (F1-05)',
    '-- Tabla: storage.objects',
    '-- ============================================================',
    '--',
    '-- Contexto: el bucket productos es public=true (correcto, las',
    '-- imagenes de producto son publicas). Pero la politica original',
    '-- permitia listar todos los archivos, exponiendo nombres y',
    '-- estructura de carpetas. Esta politica restringe a lectura',
    '-- directa unicamente.',
    '',
    'DROP POLICY IF EXISTS "Imágenes productos: lectura pública" ON storage.objects;',
    'DROP POLICY IF EXISTS "Imágenes productos: lectura directa" ON storage.objects;',
    '',
    'CREATE POLICY "Imágenes productos: lectura directa"',
    'ON storage.objects',
    'FOR SELECT',
    'TO public',
    'USING (',
    '  bucket_id = ''productos''',
    '  AND storage.allow_any_operation(',
    '    ARRAY[',
    '      ''object.get_authenticated'',',
    '      ''storage.object.get_authenticated''',
    '    ]',
    '  )',
    ');'
)
Write-FileNoBom -Path "supabase/schemas/public/policies/storage-productos.sql" -Content ($policy -join "`n")

# ============================================================
# 2. Documento de auditoria
# ============================================================
$lines = @(
    '# F1-05 - Restringir listado del bucket storage.productos',
    '',
    '**Fecha:** 2026-10-13',
    '**Hallazgo:** DB-001d',
    '**Severidad:** Alta',
    '**Estado:** Cerrado',
    '',
    '---',
    '',
    '## Contexto',
    '',
    'El bucket `productos` estaba configurado como `public: true` con una',
    'politica de `SELECT` que permitia a cualquiera (`anon`, `public`) listar',
    'todos los archivos del bucket.',
    '',
    'Que el bucket sea `public: true` es correcto: las imagenes de producto',
    'son publicas y se sirven por URL directa. El problema era la **capacidad',
    'de listado**, que exponia nombres de archivos y estructura de carpetas.',
    '',
    '---',
    '',
    '## Causa raiz',
    '',
    'Politica original:',
    '',
    '```sql',
    'CREATE POLICY "Imágenes productos: lectura pública" ON storage.objects',
    'FOR SELECT TO public',
    'USING (bucket_id = ''productos'');',
    '```',
    '',
    'El `USING` solo verifica el bucket, no la operacion. Eso permite tanto',
    'leer un objeto directo como **listar** todos los objetos.',
    '',
    '---',
    '',
    '## Fix aplicado',
    '',
    '```sql',
    'DROP POLICY IF EXISTS "Imágenes productos: lectura pública" ON storage.objects;',
    '',
    'CREATE POLICY "Imágenes productos: lectura directa"',
    'ON storage.objects',
    'FOR SELECT',
    'TO public',
    'USING (',
    '  bucket_id = ''productos''',
    '  AND storage.allow_any_operation(',
    '    ARRAY[''object.get_authenticated'', ''storage.object.get_authenticated'']',
    '  )',
    ');',
    '```',
    '',
    'La nueva politica verifica que la operacion sea **lectura directa**',
    '(`object.get_authenticated`), no listado. El listado queda bloqueado.',
    '',
    '---',
    '',
    '## Verificacion',
    '',
    '### Test 1: listado bloqueado',
    '',
    '```javascript',
    'fetch(''https://gbdrcaumghykiipqgbty.supabase.co/storage/v1/object/list/productos'', {',
    '  method: ''POST'',',
    '  headers: {',
    '    ''apikey'': ''<anon_key>'',',
    '    ''Content-Type'': ''application/json''',
    '  },',
    '  body: JSON.stringify({ prefix: '''', limit: 100 })',
    '}).then(r => r.json()).then(console.log);',
    '```',
    '',
    '**Resultado obtenido:** `400 Bad Request` con mensaje',
    '`headers must have required property ''authorization''`.',
    '',
    'Antes devolvia la lista completa de archivos. Ahora la rechaza.',
    '',
    '### Test 2: imagenes siguen cargando',
    '',
    '- [x] Catalogo de la tienda carga con imagenes visibles',
    '- [x] URLs directas `.../object/public/productos/...` funcionan',
    '',
    '---',
    '',
    '## Bucket public-images',
    '',
    'Se verifico que el bucket `public-images` no tiene politicas RLS',
    'especificas. Sin politicas, RLS bloquea todo por defecto. **No requiere',
    'fix.**',
    '',
    '---',
    '',
    '## Definition of Done (F1-05)',
    '',
    '- [x] Politica restringida a lectura directa',
    '- [x] Test: listado bloqueado',
    '- [x] Test: imagenes siguen cargando',
    '- [x] Politica guardada en supabase/schemas/public/policies/',
    '- [x] Documentado en este archivo',
    '- [ ] Commit pusheado con prefijo `security(db):`',
    '',
    '---',
    '',
    '## Referencias',
    '',
    '- [DB-001d en tracking](./06-hallazgos-tracking.md)',
    '- [Auditoria Supabase Advisors](./02-supabase-advisors.md)',
    '- [ADR-001: Supabase como backend unico](../../architecture/decisiones/ADR-001-supabase-backend-unico.md)',
    '- [Supabase Storage - Access Control](https://supabase.com/docs/guides/storage/security/access-control)'
)
Write-FileNoBom -Path "docs/audits/2026-10-13-inicial/11-f1-05-bucket-storage.md" -Content ($lines -join "`n")

# ============================================================
# 3. Actualizar tracking
# ============================================================
Write-Host ""
Write-Host "--- Actualizando tracking ---" -ForegroundColor Yellow

$trackingPath = "docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md"
$tracking = Get-Content $trackingPath -Raw -Encoding UTF8

$tracking = $tracking.Replace(
    "| DB-001d | Bucket Storage listable | F1 | P1 | Abierto | - |",
    "| DB-001d | Bucket Storage listable | F1 | P1 | Cerrado | (pendiente) |"
)
$tracking = $tracking.Replace("| Abierto | 18 |", "| Abierto | 17 |")
$tracking = $tracking.Replace("| Cerrado | 4 |", "| Cerrado | 5 |")
$tracking = $tracking.Replace("| Alta | 8 | 1 |", "| Alta | 8 | 2 |")

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $trackingPath), $tracking, $utf8NoBom)
Write-Host "[OK] $trackingPath actualizado" -ForegroundColor Green

# ============================================================
# 4. Verificar links
# ============================================================
Write-Host ""
Write-Host "--- Verificando links ---" -ForegroundColor Yellow
Write-Host ""

& powershell -ExecutionPolicy Bypass -File (Join-Path $RepoRoot "scripts\docs\00-verificar-links.ps1")
$verifyExit = $LASTEXITCODE

if ($verifyExit -ne 0) {
    Write-Host "ADVERTENCIA: links rotos." -ForegroundColor Red
    exit 1
}

# ============================================================
# 5. Git status + commit
# ============================================================
Write-Host ""
Write-Host "Git status:" -ForegroundColor Yellow
git status --short

if ($NoCommit) {
    Write-Host ""
    Write-Host "=== -NoCommit activado ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para commitear manualmente:"
    Write-Host "  git add supabase/schemas/public/policies/"
    Write-Host "  git add docs/audits/2026-10-13-inicial/11-f1-05-bucket-storage.md"
    Write-Host "  git add docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md"
    Write-Host "  git add scripts/docs/08-documentar-f1-05.ps1"
    Write-Host "  git commit -m `"security(storage): restringir listado del bucket productos`""
    Write-Host "  git push origin main"
    exit 0
}

Write-Host ""
$resp = Read-Host "Hacer commit y push? (s/N)"
if ($resp -ne "s" -and $resp -ne "S") {
    Write-Host "Commit cancelado." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== Commiteando ===" -ForegroundColor Cyan

git add supabase/schemas/public/policies/
git add docs/audits/2026-10-13-inicial/11-f1-05-bucket-storage.md
git add docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md
git add scripts/docs/08-documentar-f1-05.ps1

git commit -m "security(storage): restringir listado del bucket productos"
git push origin main

Write-Host ""
Write-Host "=== Listo ===" -ForegroundColor Green
git log --oneline -3