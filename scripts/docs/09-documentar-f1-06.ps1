# 09-documentar-f1-06.ps1
# Documenta F1-06 (Leaked Password Protection) como ACEPTADO por limitacion de plan Free.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\09-documentar-f1-06.ps1 -NoCommit
#   powershell -ExecutionPolicy Bypass -File scripts\docs\09-documentar-f1-06.ps1

param(
    [switch]$NoCommit
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $RepoRoot

Write-Host "=== Documentando F1-06: Leaked Password Protection (Aceptado) ===" -ForegroundColor Cyan
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
# 1. Documento de auditoria (variante Aceptado)
# ============================================================
$lines = @(
    '# F1-06 - Leaked Password Protection (Aceptado por limitacion de plan)',
    '',
    '**Fecha:** 2026-10-13',
    '**Hallazgo:** DB-001h',
    '**Severidad:** Alta',
    '**Estado:** Aceptado (riesgo aceptado)',
    '**Plan del proyecto:** Supabase Free',
    '',
    '---',
    '',
    '## Contexto',
    '',
    'Leaked Password Protection es una funcion de Supabase Auth que rechaza',
    'contrasenas al registrarse si aparecen en la base de datos publica de',
    'contrasenas filtradas de HaveIBeenPwned (HIBP), consultada via',
    'k-anonymity (solo se envian los primeros 5 caracteres del hash SHA-1,',
    'el resto se compara localmente).',
    '',
    'Es una proteccion recomendada por OWASP ASVS (V2.1.7) y por el propio',
    'Supabase Security Advisor, que la reporta como hallazgo de severidad',
    'Alta cuando esta deshabilitada.',
    '',
    '---',
    '',
    '## Causa raiz',
    '',
    'No es un bug ni un fix tecnico pendiente: es una **limitacion del plan',
    'de Supabase**.',
    '',
    'Segun la documentacion oficial de Supabase, Leaked Password Protection',
    'esta disponible **unicamente en el plan Pro y superiores**. En el plan',
    'Free el toggle no es habilitable desde el Dashboard ni por SQL.',
    '',
    'El proyecto PanFree System opera actualmente en **plan Free**. La',
    'migracion a plan Pro **no esta planificada** en el roadmap del proyecto.',
    '',
    '---',
    '',
    '## Evidencia',
    '',
    '### Fuente 1: Documentacion oficial Supabase',
    '',
    'La documentacion de Supabase (Authentication - Password Security)',
    'indica que la deteccion de contrasenas filtradas requiere plan Pro.',
    'La funcion no aparece disponible en el panel de configuracion de',
    'proyectos Free.',
    '',
    '### Fuente 2: Reportes publicos de la comunidad',
    '',
    'Usuarios de Supabase en GitHub y foros comunitarios reportan el mismo',
    'caso: en plan Free el toggle no se puede activar, y el Security Advisor',
    'mantiene la advertencia de severidad Alta sin posibilidad de resolverla',
    'sin upgrade.',
    '',
    '### Intento de verificacion por SQL (descartado)',
    '',
    'Se intento consultar la configuracion de Auth via SQL:',
    '',
    '```sql',
    'SELECT * FROM auth.config',
    'WHERE name LIKE ''%password%'' OR name LIKE ''%leak%'' OR name LIKE ''%hibp%'';',
    '```',
    '',
    '**Resultado:** `ERROR: 42P01: relation "auth.config" does not exist`.',
    '',
    'Conclusion: la configuracion de Auth en Supabase **no es consultable',
    'por SQL**. Se gestiona internamente por el servicio GoTrue y se expone',
    'unicamente a traves del Dashboard. Esta via queda descartada.',
    '',
    '---',
    '',
    '## Decision',
    '',
    '**Aceptar el riesgo.**',
    '',
    'Justificacion:',
    '- La funcion no es habilitable en el plan actual.',
    '- La migracion a Pro no esta planificada.',
    '- Existen mitigaciones alternativas activas o planificadas (ver abajo).',
    '- El riesgo residual es de severidad Alta pero acotado: solo afecta',
    '  la eleccion de contrasena por parte del usuario al registrarse.',
    '',
    'Estado del hallazgo DB-001h: **Aceptado** (no Cerrado).',
    '',
    '---',
    '',
    '## Mitigaciones alternativas',
    '',
    'Aunque no se puede habilitar la proteccion nativa de HIBP, hay',
    'mitigaciones compensatorias:',
    '',
    '1. **AUTH-001 (F3-04, planificado):** subir el minimo de longitud de',
    '   contrasena en el cliente. Hoy `AuthModal.js` usa `minLength={6}`;',
    '   la tarea F3-04 lo llevara a 10+ caracteres con requisitos de',
    '   complejidad. Esto reduce drasticamente la probabilidad de',
    '   contrasenas triviales tipo `password123`.',
    '',
    '2. **Confirmacion de email:** ya activa. Un atacante no puede crear',
    '   cuentas masivas con emails desechables sin verificar.',
    '',
    '3. **Rate limit de Supabase Auth:** activo por defecto. Limita',
    '   intentos de registro/login por IP en ventana de tiempo.',
    '',
    '4. **Monitoreo:** revisar periodicamente intentos de login fallidos',
    '   desde `auth.audit_log_entries`.',
    '',
    '---',
    '',
    '## Remediacion futura (no planificada)',
    '',
    'Si en el futuro el proyecto migra a plan Pro, el cierre completo de',
    'DB-001h se hace asi:',
    '',
    '1. Ir a **Authentication -> Sign In / Providers -> Email ->',
    '   Password Strength and Protection**.',
    '2. Activar el toggle **"Prevent use of leaked passwords"**.',
    '3. Verificar funcionalmente con:',
    '',
    '   ```javascript',
    '   const { data, error } = await supabase.auth.signUp({',
    '     email: ''test@example.com'',',
    '     password: ''password123'',',
    '   });',
    '   // Esperado: error.message contiene',
    '   // "Password is known to be weak and easy to guess"',
    '   ```',
    '',
    '4. Cambiar DB-001h de Aceptado a Cerrado en el tracking.',
    '',
    '---',
    '',
    '## Definition of Done (variante Aceptado)',
    '',
    '- [x] Causa raiz identificada (limitacion de plan Free)',
    '- [x] Evidencia de documentacion oficial citada',
    '- [x] Intento de verificacion por SQL documentado (y descartado)',
    '- [x] Decision de aceptacion justificada',
    '- [x] Mitigaciones alternativas identificadas',
    '- [x] Ruta de remediacion futura documentada',
    '- [ ] Commit pusheado con prefijo `security(auth):`',
    '',
    '---',
    '',
    '## Referencias',
    '',
    '- [DB-001h en tracking](./06-hallazgos-tracking.md)',
    '- [Advisors de Supabase](./02-supabase-advisors.md)',
    '- [ADR-002: seguridad en capas](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)',
    '- [Supabase - Password Security](https://supabase.com/docs/guides/auth/password-security)',
    '- [HaveIBeenPwned - Pwned Passwords](https://haveibeenpwned.com/Passwords)',
    '- [OWASP ASVS v4.0](https://owasp.org/www-project-application-security-verification-standard/) - V2.1.7'
)
Write-FileNoBom -Path "docs/audits/2026-10-13-inicial/12-f1-06-leaked-password.md" -Content ($lines -join "`n")

# ============================================================
# 2. Actualizar tracking
# ============================================================
Write-Host ""
Write-Host "--- Actualizando tracking ---" -ForegroundColor Yellow

$trackingPath = "docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md"
$tracking = Get-Content $trackingPath -Raw -Encoding UTF8

# DB-001h: Abierto -> Aceptado (con nota)
$oldRow = "| DB-001h | Leaked Password Protection | F1 | P1 | Abierto | - |"
$newRow = "| DB-001h | Leaked Password Protection | F1 | P1 | Aceptado | (aceptado: plan Free) |"
if ($tracking.Contains($oldRow)) {
    $tracking = $tracking.Replace($oldRow, $newRow)
} else {
    Write-Host "ADVERTENCIA: no se encontro la fila DB-001h con el formato esperado." -ForegroundColor Red
    Write-Host "Revisar manualmente $trackingPath" -ForegroundColor Red
}

# Contadores del resumen
$tracking = $tracking.Replace("| Abierto | 17 |", "| Abierto | 16 |")
$tracking = $tracking.Replace("| Aceptado | 0 |", "| Aceptado | 1 |")

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
    Write-Host "  git add docs/audits/2026-10-13-inicial/12-f1-06-leaked-password.md"
    Write-Host "  git add docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md"
    Write-Host "  git add scripts/docs/09-documentar-f1-06.ps1"
    Write-Host "  git commit -m `"security(auth): aceptar leaked password protection por limitacion de plan Free`""
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

git add docs/audits/2026-10-13-inicial/12-f1-06-leaked-password.md
git add docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md
git add scripts/docs/09-documentar-f1-06.ps1

git commit -m "security(auth): aceptar leaked password protection por limitacion de plan Free"
git push origin main

Write-Host ""
Write-Host "=== Listo ===" -ForegroundColor Green
git log --oneline -3