# 05-documentar-f1-02.ps1
# Documenta el fix F1-02 (4 politicas RLS Always True) y actualiza tracking.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\05-documentar-f1-02.ps1 -NoCommit
#   powershell -ExecutionPolicy Bypass -File scripts\docs\05-documentar-f1-02.ps1

param(
    [switch]$NoCommit
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $RepoRoot

Write-Host "=== Documentando F1-02: fix 4 politicas RLS Always True ===" -ForegroundColor Cyan
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
# 1. Crear el documento de fix
# ============================================================
$lines = @(
    '# F1-02 - Fix 4 politicas RLS Always True',
    '',
    '**Fecha:** 2026-10-13',
    '**Hallazgo:** DB-001b',
    '**Severidad:** Critica',
    '**Estado:** Cerrado',
    '',
    '---',
    '',
    '## Politicas corregidas',
    '',
    '| # | Tabla | Politica | Comando | Antes | Despues |',
    '|---|---|---|---|---|---|',
    '| 1 | canjes_premios | Admin puede eliminar canjes | DELETE | USING (true) | USING (is_admin()) |',
    '| 2 | canjes_premios | Admin puede actualizar canjes | UPDATE | USING (true) | USING (is_admin()) |',
    '| 3 | pedidos | pedidos_public_insert | INSERT | WITH CHECK (true) | ELIMINADA |',
    '| 4 | detalle_pedido | detalle_public_insert | INSERT | WITH CHECK (true) | ELIMINADA |',
    '',
    '---',
    '',
    '## Causa raiz',
    '',
    'Cuatro politicas RLS usaban `USING (true)` o `WITH CHECK (true)`, lo cual',
    'permitia a cualquier rol (incluido `anon`) operar sin restriccion:',
    '',
    '- **canjes_premios (DELETE):** cualquier usuario podia borrar canjes.',
    '- **canjes_premios (UPDATE):** cualquier usuario podia modificar canjes.',
    '- **pedidos (INSERT):** cualquiera podia insertar pedidos falsificando cliente_id.',
    '- **detalle_pedido (INSERT):** cualquiera podia insertar lineas de pedido.',
    '',
    'Las politicas 1 y 2 decian "Admin puede..." en el nombre pero no verificaban',
    'el rol. Las politicas 3 y 4 eran redundantes: ya existian politicas mas',
    'especificas que cubren los casos legitimos (cliente autenticado o invitado).',
    '',
    '---',
    '',
    '## Fix aplicado',
    '',
    '### Politicas 1 y 2 (canjes_premios)',
    '',
    'Reemplazadas por politicas que exigen `is_admin()`. La funcion `is_admin()`',
    'verifica que el usuario este autenticado y tenga `role = admin` en la tabla',
    '`clientes`.',
    '',
    '```sql',
    'DROP POLICY IF EXISTS "Admin puede eliminar canjes" ON public.canjes_premios;',
    'CREATE POLICY "Admin puede eliminar canjes" ON public.canjes_premios',
    '    FOR DELETE TO authenticated USING (is_admin());',
    '',
    'DROP POLICY IF EXISTS "Admin puede actualizar canjes" ON public.canjes_premios;',
    'CREATE POLICY "Admin puede actualizar canjes" ON public.canjes_premios',
    '    FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());',
    '```',
    '',
    '### Politicas 3 y 4 (pedidos y detalle_pedido)',
    '',
    'Eliminadas. Cubiertas por las politicas existentes:',
    '',
    '- `pedidos_insertar_cliente` (authenticated, valida cliente_id)',
    '- `pedidos_invitado_insert` (anon, valida user_id IS NULL)',
    '- `detalle_pedido_insertar` (authenticated, valida pedido del cliente)',
    '- `detalle_pedido_invitado_insert` (anon, valida pedido de invitado)',
    '',
    '```sql',
    'DROP POLICY IF EXISTS "pedidos_public_insert" ON public.pedidos;',
    'DROP POLICY IF EXISTS "detalle_public_insert" ON public.detalle_pedido;',
    '```',
    '',
    '---',
    '',
    '## Verificacion',
    '',
    '### Verificacion 1: query de chequeo',
    '',
    '```sql',
    'SELECT tablename, policyname, cmd, qual, with_check',
    'FROM pg_policies',
    'WHERE schemaname = ''public''',
    '  AND tablename IN (''canjes_premios'', ''pedidos'', ''detalle_pedido'')',
    '  AND (qual = ''true'' OR with_check = ''true'')',
    'ORDER BY tablename, cmd, policyname;',
    '```',
    '',
    '**Resultado obtenido:** `Success. No rows returned` (0 politicas con true).',
    '',
    '### Verificacion 2: funcional',
    '',
    '- [ ] Admin entra a /admin/canjes y puede borrar/actualizar',
    '- [ ] Checkout funciona (logueado)',
    '- [ ] Checkout funciona (invitado)',
    '',
    '---',
    '',
    '## Definition of Done (F1-02)',
    '',
    '- [x] Cambio implementado en la DB',
    '- [x] Query de verificacion: 0 politicas con true',
    '- [ ] Test funcional admin',
    '- [ ] Test funcional checkout (logueado)',
    '- [ ] Test funcional checkout (invitado)',
    '- [x] Documentado en este archivo',
    '- [x] Schema declarativo actualizado en supabase/schemas/',
    '- [ ] Commit pusheado con prefijo `security(db):`',
    '',
    '---',
    '',
    '## Referencias',
    '',
    '- [DB-001b en tracking](./06-hallazgos-tracking.md)',
    '- [Auditoria Supabase Advisors](./02-supabase-advisors.md)',
    '- [Schema declarativo canjes_premios](../../../supabase/schemas/public/tables/canjes_premios.sql)',
    '- [Schema declarativo pedidos](../../../supabase/schemas/public/tables/pedidos.sql)',
    '- [Schema declarativo detalle_pedido](../../../supabase/schemas/public/tables/detalle_pedido.sql)',
    '- [ADR-002: Seguridad en capas y app_metadata](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)'
)

$content = $lines -join "`n"
Write-FileNoBom -Path "docs/audits/2026-10-13-inicial/08-f1-02-fix-rls-always-true.md" -Content $content

# ============================================================
# 2. Actualizar tracking
# ============================================================
Write-Host ""
Write-Host "--- Actualizando tracking ---" -ForegroundColor Yellow

$trackingPath = "docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md"
$tracking = Get-Content $trackingPath -Raw -Encoding UTF8

$tracking = $tracking.Replace(
    "| DB-001b | Politicas RLS Always True | F1 | P0 | Abierto | - |",
    "| DB-001b | Politicas RLS Always True | F1 | P0 | Cerrado | e2bdd7cf |"
)

$tracking = $tracking.Replace("| Abierto | 21 |", "| Abierto | 20 |")
$tracking = $tracking.Replace("| Cerrado | 1 |", "| Cerrado | 2 |")
$tracking = $tracking.Replace("| Critica | 6 | 1 |", "| Critica | 6 | 2 |")

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $trackingPath), $tracking, $utf8NoBom)
Write-Host "[OK] $trackingPath actualizado" -ForegroundColor Green

# ============================================================
# 3. Verificar links
# ============================================================
Write-Host ""
Write-Host "--- Verificando links ---" -ForegroundColor Yellow
Write-Host ""

& powershell -ExecutionPolicy Bypass -File (Join-Path $RepoRoot "scripts\docs\00-verificar-links.ps1")
$verifyExit = $LASTEXITCODE

if ($verifyExit -ne 0) {
    Write-Host ""
    Write-Host "ADVERTENCIA: links rotos." -ForegroundColor Red
    exit 1
}

# ============================================================
# 4. Git status + commit
# ============================================================
Write-Host ""
Write-Host "Git status:" -ForegroundColor Yellow
git status --short

if ($NoCommit) {
    Write-Host ""
    Write-Host "=== -NoCommit activado ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para commitear manualmente:"
    Write-Host "  git add docs/audits/2026-10-13-inicial/08-f1-02-fix-rls-always-true.md"
    Write-Host "  git add docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md"
    Write-Host "  git add scripts/docs/05-documentar-f1-02.ps1"
    Write-Host "  git commit -m `"security(db): fix 4 politicas RLS Always True`""
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

git add docs/audits/2026-10-13-inicial/08-f1-02-fix-rls-always-true.md
git add docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md
git add scripts/docs/05-documentar-f1-02.ps1

git commit -m "security(db): fix 4 politicas RLS Always True"
git push origin main

Write-Host ""
Write-Host "=== Listo ===" -ForegroundColor Green
git log --oneline -3