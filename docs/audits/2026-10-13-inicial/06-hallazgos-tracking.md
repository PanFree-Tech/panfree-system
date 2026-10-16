# Tracking de Hallazgos - Auditoria 2026-10-13

**Ultima actualizacion:** 2026-10-16 (fin Sesion 22)
**Total de hallazgos:** 72

---

## 1. Resumen

| Estado | Cantidad |
|---|---|
| Abierto | 25 |
| En curso | 0 |
| Cerrado | 44 |
| Aceptado | 3 |

---

## 2. Hallazgos por severidad

| Severidad | Cantidad | Cerrados |
|---|---|---|
| Critica | 9 | 7 |
| Alta | 11 | 7 |
| Media | 23 | 11 |
| Baja | 9 | 2 |

---

## 3. Tabla completa de hallazgos

### Hallazgos criticos

| ID | Titulo | Fase | Prioridad | Estado | Commit |
|---|---|---|---|---|---|
| SEC-001 | .env en historial Git | F4 | P0 | Abierto | - |
| SEC-003 | Admin por user_metadata | F3 | P0 | Cerrado | e5bed103 |
| DB-001 | 250+ advisors Supabase | F1 | P0 | Abierto | - |
| DB-001a | Vistas SECURITY DEFINER | F1 | P0 | Cerrado | 8c5b311a |
| DB-001b | Politicas RLS Always True | F1 | P0 | Cerrado | fea87bb2 |
| DB-001c | Funciones SECURITY DEFINER publicas | F1 | P0 | Cerrado | 542e3a2e |
| SEC-004 | UPDATE clientes.role desde cliente | F3 | P0 | Cerrado | 4d5bd9c2 |
| SEC-005 | anon con DDL sobre clientes | F3 | P0 | Cerrado | 4d5bd9c2 |
| BUG-010 | Regresion del logger (S13): import erroneo en 88 archivos | F3 | P1 | Cerrado | 757938c2 |

### Hallazgos altos

| ID | Titulo | Fase | Prioridad | Estado | Commit |
|---|---|---|---|---|---|
| SEC-002 | DEFAULT_SUPABASE_ANON_KEY hardcodeada | F3 | P1 | Cerrado | 4a17c7d5 |
| SEC-006 | redirectTo hardcodeado | F3 | P1 | Cerrado | 4d5bd9c2 |
| SEC-007 | INSERT clientes.role desde frontend | F3 | P1 | Cerrado | 4d5bd9c2 |
| SEC-011 | email_logs SELECT true para authenticated | F1/F3 | P1 | Cerrado | (Sesion 8) |
| SEC-013 | email_logs INSERT permisiva para authenticated | F1/F3 | P2 | Cerrado | (Sesion 8) |
| AUTH-001 | Contrasenas debiles | F3 | P1 | Cerrado | ccee0c88 |
| AUTH-002 | Registro sin validar duplicados | F3 | P1 | Cerrado | 7b014cc4 + f47b9417 |
| DBG-001 | console.log con datos sensibles | F3 | P1 | Cerrado | a031ba2e |
| DB-001d | Bucket Storage listable | F1 | P1 | Cerrado | 326d4edd |
| DB-001g | Funciones con search_path mutable | F1 | P1 | Cerrado | 3e500e77 |
| DB-001h | Leaked Password Protection | F1 | P1 | Aceptado | (plan Free) |
| P7 | 3 politicas con auth.jwt() raiz | F3 | P1 | Cerrado | 4d5bd9c2 |

### Hallazgos medios

| ID | Titulo | Fase | Prioridad | Estado | Commit |
|---|---|---|---|---|---|
| BUG-001 | NEXT_PUBLIC_VAPID_KEY inconsistente | F3 | P2 | Cerrado (S20) | 5923f3a6 |
| BUG-002 | route.js inserta avatar (columna avatar_url) | F3 | P2 | Cerrado | 4d5bd9c2 |
| CONF-001 | ESLint ignorado en build | F3 | P2 | Cerrado (S22) | a9fa9a7b |
| CONF-002 | Sin headers de seguridad | F3 | P2 | Cerrado (S22) | ce7cdd70 |
| DB-001e | ~60 politicas RLS sin optimizar | F1 | P2 | Cerrado | 02311b72 |
| DB-001f | ~150 politicas duplicadas | F1 | P2 | Cerrado | e40d9244 |
| SEC-010 | select_publico_productos exponia inactivos (leak) | F1 | P2 | Cerrado | e40d9244 |
| SEC-012 | canjes_premios usa clientes.role en vez de is_admin() | F3 | P2 | Cerrado | (Sesion 9) |
| BUG-006 | .env.example dice gemini-2.5-flash pero codigo usa gemini-3.1-flash-image | F3 | P2 | Abierto | - |
| BUG-007 | IDs de modelo Gemini hardcodeados en marketing/page.js:51-52 | F3 | P2 | Abierto | - |
| BUG-008 | geminiService llama a /generate-caption pero endpoint real es /generar-contenido | F3 | P2 | Abierto | - |
| BUG-009 | endpoint usa gemini-3.7-flash que no existe en AI Studio | F3 | P2 | Abierto | - |
| SEC-018 | 3 API keys activas en Cloudinary sin trazabilidad | F2 | P2 | Cerrado | (S15) |
| SEC-019 | 4 API keys activas en Gemini sin trazabilidad | F2 | P2 | Cerrado | (S15) |
| SEC-020 | 9 items Bitwarden pendientes (se completan durante rotacion S15) | F2 | P2 | Cerrado (S20: VAPID era el ultimo) | (S20) |
| SEC-021 | Resend: 2 keys huerfanas revocadas + migracion [C]->[S] | F2 | P2 | Cerrado | (S16) |
| DOC-004 | Resend documentado bajo [C] cuando era [S] | F2 | P2 | Cerrado | (S16) |
| SEC-008 | crear_usuario_admin sin chequeo de caller (eliminada) | F3 | P2 | Cerrado | (S15) |
| DOC-005 | Meta WhatsApp + Twilio: plomeria inerte | F2 | P2 | Cerrado | (S17) |
| DOC-006 | Instagram Graph API: endpoints rotos con UI visible | F2 | P2 | Abierto | - |
| DOC-007 | Bloqueante externo: Meta Business Verification requiere RUC | F2 | P2 | Aceptado | (S17) |
| DOC-008 | Seccion Marketing sin uso real (~8.100 lineas) - plan de retiro | F3 | P3 | Abierto | - |
| DOC-009 | n8n: plomeria inerte, tokens nunca creados | F2 | P2 | Cerrado | (S18) |
| SEC-022 | Variable basura NEXT_PUBLIC_UPLOAD_PRESETNEXT_PUBLIC_UPLOAD_PRESET en Vercel | F2 | P2 | Cerrado | (S18) |
| SEC-023 | GA4 con dos juegos de credenciales coexistiendo en Vercel | F2 | P2 | Cerrado (S19) | No era duplicado: coexistencia legitima (Service Account + Measurement Protocol) |
| SEC-024 | NEXT_PUBLIC_VAPID_EMAIL con valor sospechoso (?JWT?) | F2 | P2 | No aplica (S20: artefacto del CLI de Vercel) | (S20) |
| DOC-012 | Secrets internos (CRON_SECRET, WEBHOOK_SECRET, REVALIDATE_SECRET) plomeria inerte, eliminados de Vercel | F2 | P2 | Cerrado | (S18) |
| DOC-013 | APIs IA secundarias (13 keys) plomeria inerte en Marketing, eliminadas de Vercel | F2 | P2 | Cerrado | (S18) |
| DOC-014 | GA4 Service Account plomeria inerte (cargado en ga-metrics/route.js pero no usado) | F2 | P2 | Abierto (revision 2027-04-16) | (S19) |

### Hallazgos bajos

| ID | Titulo | Fase | Prioridad | Estado | Commit |
|---|---|---|---|---|---|
| BUG-003 | diptico/[codigo] usa .eq('activo') en vez de is_active | F3 | P3 | Abierto | - |
| SEC-014 | VAPID key hardcodeada en src/app/admin/page.js | F3 | P3 | Cerrado (S20) | 5923f3a6 |
| SEC-015 | URL Supabase hardcodeada en notificar-estado/route.js y notificaciones.js | F3 | P3 | Abierto | - |
| SEC-016 | Cloudinary cloud name hardcodeado en 4 lugares | F3 | P3 | Abierto | - |
| SEC-017 | GA4 Measurement ID hardcodeado en ga4/measurement/route.js | F3 | P3 | Abierto | - |
| BUG-004 | test-email y resend-webhook usaban cliente sin privilegios | F3 | P2 | Cerrado | (Sesion 8) |
| DB-001i | Indices duplicados | F1 | P3 | Cerrado | d6957a61 |
| TST-001 | Cobertura de tests baja | F4 | P3 | Abierto | - |
| DOC-001 | Falta PropTypes/JSDoc | F4 | P3 | Abierto | - |
| BUG-005 | AuthModal inserta columnas sin GRANT post-F3-01 | F3 | P2 | Cerrado | 7b014cc4 |
| BUG-011 | bug en script 29-fix-logger-import.ps1 (Write-Ok con $modified + string) | F3 | P3 | Cerrado | (S15) |
| DOC-002 | MARKETING_INTELLIGENT_SYSTEM.md menciona modelos gemini-3.5-flash inexistentes | F3 | P3 | Abierto | - |
| DOC-003 | discrepancia endpoint frontend vs backend (geminiService) | F3 | P3 | Abierto | - |
| DOC-010 | Variables en Vercel sin documentar en .env.example (GA4 service account, REVALIDATE_SECRET) | F2 | P3 | Abierto | - |
| DOC-011 | Variables en .env.example sin equivalente en Vercel (CLARITY, EMAIL_FROM, BASE_URL, GEMINI_MODEL, NEXA) | F2 | P3 | Abierto | - |
| DOC-015 | Alias Vercel apuntaba a deployment viejo | F4 | P2 | No aplica (falsa alarma S21) | (S21) |
| BUG-012 | PWAInstallPrompt.js leia NEXT_PUBLIC_VAPID_KEY (variable inexistente) | F3 | P2 | Cerrado (S20) | 5923f3a6 |
| DOC-017 | Service Worker cacheaba HTML viejo (SW servia 5 chunks en vez de 16) | F3 | P2 | Cerrado (S21) | 16ea5eec |
| DOC-018 | meta apple-mobile-web-app-capable deprecado | F4 | P3 | Abierto | - |
| DOC-019 | Icono icon-144x144.png faltante en manifest PWA | F4 | P3 | Abierto | - |
| CONF-003 | ~30 warnings de ESLint en build (mayoria <img> sin <Image />) | F3 | P3 | Abierto | - |
| CONF-004 | typescript.ignoreBuildErrors: true en next.config.js | F3 | P2 | Abierto | - |
| CONF-005 | Content-Security-Policy (CSP) pendiente | F3 | P3 | Abierto | - |
---

## 4. Como cerrar un hallazgo

1. **Fix aplicado** en codigo o DB.
2. **DoD cumplido.**
3. **Commit pusheado** con prefijo `security:`/`fix:`/`refactor:`.
4. **Actualizar este archivo:** Estado -> Cerrado + hash del commit.
5. **Actualizar STATUS.md** (contador de hallazgos cerrados).

---

## 5. Estados posibles

| Estado | Significado |
|---|---|
| Abierto | Identificado, sin fix |
| En curso | Fix en desarrollo |
| Cerrado | Fix aplicado, verificado, documentado |
| Aceptado | Riesgo aceptado, no se fixea |

---

## 6. Referencias

- [Resumen ejecutivo](./00-resumen-ejecutivo.md)
- [Criterios de aceptacion](./05-criterios-aceptacion.md)
- [Plan de remediacion](./99-plan-remediacion.md)
- [Advisors de Supabase](./02-supabase-advisors.md)
- [F1-07 InitPlan](./13-f1-07-rls-initplan.md)
- [F1-08 Consolidacion](./15-f1-08-consolidacion-rls.md)






