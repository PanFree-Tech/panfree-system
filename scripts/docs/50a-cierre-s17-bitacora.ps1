# 50a-cierre-s17-bitacora.ps1
# Agrega la entrada de la Sesion 17 al final de BITACORA.md
# Uso:
#   .\50a-cierre-s17-bitacora.ps1            (dry run)
#   .\50a-cierre-s17-bitacora.ps1 -Commit    (aplica)

param([switch]$Commit)

$ErrorActionPreference = 'Stop'
$repoRoot = 'C:\Users\Admin\proyectos\panfree-system'
Set-Location $repoRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)

$btPath = Join-Path $repoRoot 'docs\BITACORA.md'
$bt = [System.IO.File]::ReadAllText($btPath, $utf8)

if ($bt.Contains('Sesion 17 - COMPLETA')) {
    Write-Host "  [SKIP] La entrada de S17 ya existe en BITACORA.md" -ForegroundColor Yellow
    exit 0
}

# Ancla: ultima linea de la entrada de S16
$ancla = '- Cerrar SEC-020 cuando todos los items Bitwarden esten completos.'
if (-not $bt.Contains($ancla)) {
    Write-Host "  [ERROR] No matcheo la ultima linea de S16 en BITACORA.md" -ForegroundColor Red
    exit 1
}

$entrada = @(
    '',
    '---',
    '',
    '## 2026-10-15 (Sesion 17 - COMPLETA)',
    '',
    '**Duracion:** ~6 horas',
    '**Objetivo:** ENV - Meta plomeria inerte + seccion Marketing sin uso + cierre de F2-07/08/09',
    '',
    '**Completado:**',
    '',
    '### Bloque 0 - Chore de arranque',
    '- .gitignore: agregadas reglas dump-s*.txt y .backup-s*/',
    '- package-lock.json versionado (habilita npm ci en CI, F4-06)',
    '- 30 scripts de cierre S14-S16 versionados (deuda de working tree pagada)',
    '',
    '### Bloque 1 - Reconciliacion de documentacion',
    '- Tracking: Total 51->55 al final de S17. Corregida negrita en DB-001i.',
    '- Header del tracking recalculado automaticamente.',
    '- ROTACION-CLAVES: typo S16->S17 corregido (2 ocurrencias).',
    '- .env.example: Supabase y Cloudinary de [C]/MIG a [S]/OK.',
    '',
    '### Bloque 2 - Ticket Cloudinary #392411',
    '- Consulta al ticket: recien enviado, sin respuesta aun.',
    '- Se reconsulta en S18 (2-4 dias habiles).',
    '',
    '### Bloque 3 - Auditoria del ecosistema Meta (DOC-005/006/007)',
    '- Confirmado: NINGUNA variable Meta existe en Vercel.',
    '  - WHATSAPP_*: solo ADMIN_WHATSAPP (usado por notificaciones.js).',
    '  - TWILIO_*: no existe.',
    '  - INSTAGRAM_*: no existe.',
    '- Confirmado: todo el codigo Meta es plomeria inerte o rota.',
    '  - WhatsApp Cloud API + Twilio: plomeria inerte (tokens nunca creados).',
    '  - Instagram Graph API: endpoints ACTIVOS con UI visible, pero fallan',
    '    en runtime por falta de tokens.',
    '- Canal real de WhatsApp: wa.me/595984589845 (link directo, 20+ lugares).',
    '- Bloqueante raiz: Meta Business Verification requiere RUC.',
    '- DECISION: conservar plomeria (costo mantener nulo, costo reescribir alto).',
    '  Revision a 2027-04-15.',
    '- .env.example: secciones Meta WhatsApp, Twilio, Instagram marcadas con',
    '  estado real (NO USADO / ROTO).',
    '- F2-07, F2-08, F2-09 reformuladas como "No aplica" en PLAN-DE-TRABAJO.',
    '- Doc nuevo: docs/audits/2026-10-13-inicial/30-doc-meta-plomeria-inerte.md',
    '',
    '### Bloque 4 - Auditoria de la seccion Marketing (DOC-008)',
    '- Seccion /admin/marketing: ~8.100 lineas de codigo.',
    '- Confirmado por el responsable: no se usa, no crea contenido util, no publica.',
    '- Duplica funcionalidad existente:',
    '  - Promociones por producto ya existen en /admin/productos.',
    '  - Cupones de descuento ya existen en /admin/cupones y se aplican en checkout.',
    '- Criterio de retiro definido por el responsable:',
    '  - RETIRAR: generacion de imagenes, Instagram, EventCalendar, RulesManager, AutomationPanel.',
    '  - REVISAR: generacion de contenido IA, DecisionPanel, pagina principal.',
    '- Candidato total a retiro: ~5.500-6.500 lineas.',
    '- NO se toca codigo en S17. Plan de limpieza en sesion dedicada futura.',
    '- Doc nuevo: docs/audits/2026-10-13-inicial/31-doc-008-seccion-marketing.md',
    '- Backlog registrado: sistema simple de promociones en CartSidebar (S18+).',
    '',
    '**Hallazgos cerrados:**',
    '- Ninguno (los 4 nuevos quedaron Abiertos o Aceptados segun decision).',
    '',
    '**Hallazgos nuevos:**',
    '- DOC-005: Meta WhatsApp + Twilio - plomeria inerte (Cerrado).',
    '- DOC-006: Instagram Graph API - endpoints rotos con UI visible (Abierto).',
    '- DOC-007: Bloqueante externo - Meta Business Verification requiere RUC (Aceptado).',
    '- DOC-008: Seccion Marketing sin uso real, ~8.100 lineas (Abierto).',
    '',
    '**Bloqueantes:**',
    '- Cloudinary Root User (ticket #392411, 2-4 dias habiles, no bloqueante).',
    '',
    '**Aprendizajes:**',
    '- Regla nueva: los scripts PowerShell >150 lineas SIEMPRE se crean/editan en',
    '  VS Code. NUNCA se pegan en la consola interactiva.',
    '  Motivo: al pegar un script grande en la consola, PowerShell lo ejecuta como',
    '  comandos en vivo en lugar de escribir el archivo. Resultado: script vacio',
    '  (0 bytes) commiteado en git. Ocurrio con el script 49.',
    '- Los bloques de ejemplo tampoco se pegan en la consola.',
    '  Separar claramente: bloques de script -> VS Code; comandos -> consola.',
    '- Meta Business Verification es un bloqueante externo real (RUC).',
    '  No hay workaround tecnico. Se documenta como Aceptado.',
    '- Regla nueva: /admin/marketing ya no se debe reactivar sin una decision explicita.',
    '  El codigo se conserva inerte.',
    '- Al hacer scripts muy grandes, dividirlos en a/b (250 lineas maximo por archivo).',
    '',
    '**Proxima sesion (S18):**',
    '- Verificar respuesta del ticket Cloudinary #392411.',
    '- Considerar ocultar la seccion Marketing del menu admin (S17-B diferido).',
    '- F2-10: rotar n8n webhook token.',
    '- F2-11: rotar GA4 API secret.',
    '- F2-12: regenerar par VAPID.',
    '- F2-13: secrets internos (CRON_SECRET, WEBHOOK_SECRET).',
    '- F2-14: auditar APIs IA secundarias (11 pendientes).',
    '- Backlog: sistema simple de promociones en CartSidebar.'
) -join "`r`n"

$nuevo = $bt.TrimEnd() + "`r`n" + $entrada + "`r`n"

if ($Commit) {
    [System.IO.File]::WriteAllText($btPath, $nuevo, $utf8)
    Write-Host "  [OK] BITACORA.md actualizado" -ForegroundColor Green
} else {
    Write-Host "  [DRY RUN] Se agregarian $($entrada.Length) chars al final de BITACORA.md" -ForegroundColor Gray
    Write-Host "  [INFO] Ancla encontrada: '$ancla'" -ForegroundColor Gray
}

Write-Host ""