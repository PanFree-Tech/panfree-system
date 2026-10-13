# 02-crear-adrs.ps1
# Crea los 3 ADRs (Architecture Decision Records) del proyecto PanFree System
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\02-crear-adrs.ps1 -NoCommit
#   powershell -ExecutionPolicy Bypass -File scripts\docs\02-crear-adrs.ps1

param(
    [switch]$NoCommit
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $RepoRoot

Write-Host "=== [2/3] Creando ADRs (Architecture Decision Records) ===" -ForegroundColor Cyan

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

# ============================================================================
# ADR-001: Supabase como backend unico
# ============================================================================
$content = @"
# ADR-001: Supabase como backend unico (Postgres + Auth + RLS + Storage)

**Fecha:** 2026-10-13
**Estado:** Aceptado
**Decisores:** Pedro J. Pirovani (PanFree)

---

## Contexto

PanFree System necesita una plataforma de backend para un ERP + e-commerce
B2C con las siguientes restricciones:

- **Equipo muy chico** (1 desarrollador + IA). No hay equipo de DevOps.
- **Presupuesto limitado** (plan Free de servicios mientras el volumen lo permita).
- **Requisitos funcionales:** PostgreSQL relacional, autenticacion de usuarios
  cliente y staff, control de acceso por rol, almacenamiento de archivos
  (imagenes de producto, logos, avatares) y API REST.
- **Requisitos no funcionales:** SSR desde Next.js, latencia baja, RLS para
  multi-tenant logico (cliente solo ve lo suyo, admin ve todo).
- **Operacion en Paraguay:** los datos y el trafico no requieren residencia
  especifica, pero se busca baja latencia en Sudamerica.

Las alternativas tipicas serian: backend Node/Express propio + Postgres
gestionado (Railway/Render), Firebase, o Supabase.

---

## Decision

Se adopta **Supabase** como backend unico para PanFree System, cubriendo:

1. **PostgreSQL 15** como base de datos relacional principal.
2. **Supabase Auth (GoTrue)** para autenticacion de clientes y staff.
3. **Row Level Security (RLS)** como mecanismo primario de autorizacion a
   nivel de dato.
4. **Supabase Storage** para archivos no-imagen de bajo volumen (la mayoria
   de imagenes van a Cloudinary, ver ADR pendiente de media).
5. **API autogenerada (PostgREST)** accedida desde Server Components y
   API Routes de Next.js, nunca directamente desde el browser salvo casos
   explicitamente auditados.

La integracion se realiza via `@supabase/ssr` y `@supabase/supabase-js`
desde Next.js, con dos clientes:

- **Cliente anon** (browser + SSR): limitado por RLS, es el cliente por defecto.
- **Cliente service_role** (solo server-side): bypassa RLS, se usa exclusivamente
  para operaciones privilegiadas y auditadas (logs, notificaciones masivas).

---

## Consecuencias

### Positivas

- **Cero mantenimiento de infraestructura**: no hay servidores de DB que
  administrar, backups automaticos incluidos en el plan.
- **RLS como ciudadano de primera clase**: la autorizacion vive cerca del
  dato, no en cada endpoint. Reduce superficie de error humano.
- **Auth integrado**: no hay que construir gestion de sesiones, OAuth,
  refresh tokens ni recuperacion de contrasenas.
- **Compatible con Vercel serverless**: Next.js en Vercel + Supabase es una
  combinacion estandar y bien soportada.
- **Migraciones SQL versionables** en `/migrations`, lo cual permite auditoria
  del esquema.

### Negativas / Riesgos asumidos

- **Vendor lock-in moderado**: la logica en RLS y funciones SQL es portables
  a Postgres puro, pero Auth y Storage no lo son.
- **Dependencia de advisors de seguridad**: como toda la autorizacion vive en
  la DB, un error en RLS es una vulnerabilidad directa. Esto motivo la
  auditoria 2026-10-13 y el hallazgo DB-001.
- **Curva de aprendizaje de RLS**: escribir politicas correctas y performantes
  (evitar `auth.uid()` en cada fila, evitar `SECURITY DEFINER` innecesario)
  requiere disciplina. Ver ADR-002.
- **Plan Free con limites** (500MB DB, 1GB Storage): a futuro puede requerir
  upgrade a Pro (~$25/mes).

### Consecuencias para auditoria y gestion

- **Fuente de verdad de autorizacion:** RLS en Postgres. Toda auditoria de
  acceso debe empezar por revisar politicas RLS y advisors de Supabase.
- **Checklist obligatorio al agregar tabla nueva:**
  1. Crear la tabla con `ENABLE ROW LEVEL SECURITY`.
  2. Definir politicas para `anon`, `authenticated` y roles de staff.
  3. Verificar en Supabase Advisors que no aparezcan warnings.
- **Prohibido:** usar `SECURITY DEFINER` en vistas o funciones sin justificacion
  documentada y `SET search_path`. Ver DB-001a/DB-001c.
- **Monitoreo:** revisar Supabase Advisors al menos una vez por semana.

---

## Alternativas consideradas

- **Backend Node/Express propio + Postgres gestionado (Railway):** rechazada
  por mayor carga operativa sin equipo DevOps. La autenticacion y RLS
  habria que construirlas a mano.
- **Firebase (Firestore + Auth):** rechazada por ser NoSQL, incompatible con
  el modelo relacional del ERP (PPP, recetas, costos requieren joins).
- **Backend propio + Supabase solo como DB:** rechazada por duplicar la capa
  de auth y perder la ventaja de RLS como fuente unica de autorizacion.

---

## Referencias

- [ARCHITECTURE.md](../../01-arquitectura/ARCHITECTURE.md) — seccion 5 (Seguridad y Roles)
- [DATABASE.md](../../01-arquitectura/DATABASE.md) — esquema completo
- [Auditoria DB-001](../../04-auditorias/2026-10-13-inicial/02-supabase-advisors.md)
- [Plan de Trabajo](../../02-operaciones/PLAN-DE-TRABAJO.md) — Fase 1
"@
Write-FileNoBom -Path "docs/01-arquitectura/decisiones/ADR-001-supabase-backend-unico.md" -Content $content

# ============================================================================
# ADR-002: Seguridad en capas con app_metadata como fuente de rol
# ============================================================================
$content = @"
# ADR-002: Seguridad en capas y app_metadata como fuente unica de rol

**Fecha:** 2026-10-13
**Estado:** Aceptado
**Decisores:** Pedro J. Pirovani (PanFree)

---

## Contexto

PanFree System tiene dos tipos de usuarios bien diferenciados:

- **Clientes B2C:** se registran solos, compran, acumulan puntos. No deben
  acceder a nada administrativo.
- **Staff administrativo:** roles `admin`, `operador`, `marketing`,
  `repartidor`. Acceden al ERP en `/admin` y a las APIs `/api/admin/*`.

Durante la auditoria inicial (2026-10-13) se detectaron dos hallazgos criticos
relacionados:

- **SEC-003 (Critico):** el middleware verifica el rol del usuario leyendo
  `user_metadata.role`. `user_metadata` es **editable por el propio usuario**
  desde el cliente, por lo tanto cualquier cliente podia auto-asignarse
  `role: "admin"` y acceder al panel.
- **DB-001b (Critico):** varias politicas RLS usan `USING (true)`, lo cual
  permite a `anon` leer tablas sensibles (`pedidos`, `detalle_pedido`,
  `canjes_premios`).

Adicionalmente, se identifico que existe logica de autorizacion en tres
lugares potenciales (middleware Next.js, RLS en Postgres, chequeos ad-hoc en
API Routes), lo cual es una fuente clasica de vulnerabilidades por
inconsistencia.

---

## Decision

Se adopta un modelo de **seguridad en capas** con **una unica fuente de
verdad por capa**, siguiendo las recomendaciones OWASP ASVS y las buenas
practicas de Supabase:

### Capa 1 — Autenticacion (quien sos)

- **Supabase Auth** emite la sesion via cookie HttpOnly gestionada por
  `@supabase/ssr`.
- **Fuente de verdad:** `auth.users` + sesion firmada por Supabase.

### Capa 2 — Rol (que podes hacer como identidad)

- **Fuente de verdad unica:** `auth.users.app_metadata.role`.
- **`user_metadata` NO se usa nunca para autorizacion.** Se usa solo para
  preferencias cosmeticas editables por el usuario (avatar, nombre visible).
- Los roles validos se restringen a un enum documentado:
  `cliente`, `operador`, `marketing`, `repartidor`, `admin`.
- El middleware de Next.js (`src/middleware.js`) debe leer **solo**
  `user.app_metadata?.role`. Los fallbacks a `user_metadata` se eliminan
  (fix de F3-01).

### Capa 3 — Autorizacion a nivel de dato (que filas podes ver)

- **Fuente de verdad:** politicas RLS en Postgres.
- Toda tabla con datos sensibles tiene `ENABLE ROW LEVEL SECURITY` y
  politicas explicitas para `anon` y `authenticated`.
- **Prohibido `USING (true)`** en tablas con datos de cliente o de negocio.
- Las politicas usan `auth.uid()` y `auth.jwt() -> 'app_metadata' ->> 'role'`
  para discriminar por rol.

### Capa 4 — Operaciones privilegiadas (service_role)

- `SUPABASE_SERVICE_ROLE_KEY` se usa **exclusivamente server-side**.
- Se prohibe importarla en cualquier archivo que pueda ejecutarse en el
  browser (`use client`, hooks, componentes).
- Cada uso debe estar justificado por operacion (logs de auditoria,
  notificaciones masivas) y auditado.

### Capa 5 — Rutas administrativas

- `/admin/*` y `/api/admin/*` pasan obligatoriamente por el middleware.
- Respuestas estandar:
  - Sin sesion -> `401` JSON (API) / redirect a `/admin/login` (web).
  - Sesion sin rol suficiente -> `403` JSON (API) / redirect a `/unauthorized` (web).

---

## Consecuencias

### Positivas

- **SEC-003 queda cerrado por diseno**, no por parche. Un cliente no puede
  elevar privilegios aunque modifique su propio `user_metadata`.
- **Consistencia:** una sola fuente de verdad por capa elimina la clase de
  bugs "el middleware dice que si pero RLS dice que no" (o al reves).
- **Auditable:** para verificar autorizacion alcanza con revisar
  `app_metadata` (auth), politicas RLS (datos) y el middleware (rutas).
- **Alineado con Supabase:** `app_metadata` es la recomendacion oficial de
  Supabase para roles de autorizacion.

### Negativas / Trade-offs

- **Cambiar el rol de un usuario requiere acceso administrativo** (Admin API
  de Supabase o dashboard). No puede hacerse desde el propio usuario. Esto es
  intencional.
- **Duplicacion controlada:** el rol se chequea en middleware y en RLS. Es
  duplicacion necesaria porque middleware protege rutas y RLS protege datos
  ante acceso directo a la API de Supabase.
- **Migrar usuarios existentes:** si algun usuario tenia el rol solo en
  `user_metadata`, hay que migrarlo a `app_metadata` antes de activar el
  fix de F3-01.

### Consecuencias para auditoria y gestion

- **Alta de usuario staff:** siempre por Supabase Dashboard o Admin API,
  seteando `app_metadata.role`. Nunca desde el frontend.
- **Alta de nueva ruta admin:** debe matchear `/admin/*` o `/api/admin/*`
  para pasar por el middleware. Si la ruta no matchea, hay que agregarla
  explicitamente al `matcher`.
- **Checklist obligatorio al agregar politica RLS:**
  1. `ENABLE ROW LEVEL SECURITY` en la tabla.
  2. Politica explicita por rol (no `USING (true)` en tablas con PII).
  3. Test negativo: `anon` no puede leer; `cliente` no puede leer datos de otro cliente.
- **Auditoria de SEC-003:** el fix se considera cerrado cuando un usuario
  con `user_metadata.role = 'admin'` pero sin `app_metadata.role` **no** puede
  acceder a `/admin`.

---

## Alternativas consideradas

- **Rol solo en `user_metadata`:** rechazada. Es editable por el usuario
  (SEC-003). Inaceptable para autorizacion.
- **Rol en tabla `usuarios` custom + lookup en cada request:** rechazada por
  latencia (una query extra por request) y por perder la integracion nativa
  con `auth.jwt()` en RLS.
- **Rol hardcodeado en el JWT custom claim via Auth Hook:** considerada pero
  postergada. Requiere plan pago de Supabase. `app_metadata` cubre el caso
  actual.
- **Solo middleware, sin RLS:** rechazada. No protege ante acceso directo a
  la API de Supabase (que es publica por diseno con la anon key).

---

## Referencias

- [SEC-003](../../04-auditorias/2026-10-13-inicial/03-codigo-fuente.md)
- [DB-001b](../../04-auditorias/2026-10-13-inicial/02-supabase-advisors.md)
- [ADR-001](./ADR-001-supabase-backend-unico.md)
- [ARCHITECTURE.md](../../01-arquitectura/ARCHITECTURE.md) — seccion 5
- [middleware.js](../../../src/middleware.js) — implementacion a corregir en F3-01
- [OWASP ASVS v4.0](https://owasp.org/www-project-application-security-verification-standard/) — V4 Access Control
"@
Write-FileNoBom -Path "docs/01-arquitectura/decisiones/ADR-002-seguridad-en-capas-app-metadata.md" -Content $content

# ============================================================================
# ADR-003: Next.js 14 App Router con RSC por defecto
# ============================================================================
$content = @"
# ADR-003: Next.js 14 App Router con Server Components por defecto

**Fecha:** 2026-10-13
**Estado:** Aceptado
**Decisores:** Pedro J. Pirovani (PanFree)

---

## Contexto

PanFree System combina dos aplicaciones con necesidades muy distintas:

- **Tienda B2C publica:** SEO critico, catalogos, fichas de producto,
  checkout. Necesita SSR/ISR para indexacion y velocidad percibida.
- **ERP administrativo en `/admin`:** altamente interactivo (tablas, filtros,
  formularios, canvas para marketing). No necesita SEO, si interactividad.

El proyecto se inicio como Next.js con Pages Router y migro a **App Router**
(Next.js 13+, adoptado en 14). La pregunta de arquitectura que este ADR
formaliza es:

- Cuanto del sistema debe ser Server Component vs Client Component.
- Donde vive la logica de negocio.
- Como se comunican frontend y backend.

Durante la auditoria inicial se detectaron hallazgos relacionados con esta
decision:

- **CONF-001:** `eslint.ignoreDuringBuilds: true` permite que errores de
  RSC vs Client Component pasen a produccion.
- **SEC-002:** claves hardcodeadas en `src/lib/supabase.js` por querer
  "facilitar" el fallback cuando faltan env vars (patron peligroso).

---

## Decision

Se adopta **Next.js 14 con App Router** y las siguientes reglas de diseno:

### Regla 1 — Server Components por defecto

- Toda pagina y layout en `src/app/**` es **Server Component** por defecto.
- `'use client'` se agrega **solo** cuando el componente necesita:
  - React hooks (`useState`, `useEffect`, `useContext`, etc.)
  - APIs del browser (`localStorage`, `window`, `navigator`)
  - Librerias que solo corren en cliente (canvas, framer-motion runtime)
- La regla se aplica de abajo hacia arriba: el `'use client'` lo mas cerca
  posible de la hoja del arbol de componentes.

### Regla 2 — Logica de negocio en API Routes, no en el cliente

- Toda operacion que toque service_role, servicios externos (Resend, Meta,
  Gemini, Twilio), o que requiera validar con Zod, vive en `src/app/api/**`.
- El cliente **nunca** habla directamente con service_role ni con servicios
  que requieran secrets.
- El cliente puede hablar con Supabase directamente **solo** para operaciones
  cubiertas por RLS (lecturas publicas, inserciones validadas).

### Regla 3 — Separacion explicita cliente/servidor en componentes

- Componentes con interactividad van en `src/components/**` con `'use client'`.
- Componentes puros (presentacionales sin estado) pueden ser Server Components.
- Los **Context Providers** (`CartContext`, `AuthContext`) viven en
  `layout-client.js` (Client Component) que envuelve el arbol.
- La comunicacion entre Server y Client Components se hace via **props
  serializables** (JSON-safe). Nunca pasar funciones ni clases.

### Regla 4 — Middleware para proteccion perimetral

- `src/middleware.js` intercepta `/admin/*` y `/api/admin/*`.
- El middleware no hace queries a la DB; solo valida sesion y rol (ver ADR-002).
- La logica de autorizacion fina vive en RLS.

### Regla 5 — Build estricto

- `eslint.ignoreDuringBuilds` debe estar en `false` (fix CONF-001).
- El build de CI debe fallar si hay errores de lint, tipos o RSC mal formados.

---

## Consecuencias

### Positivas

- **SEO nativo** para la tienda (Server Components + metadata API).
- **Bundle de cliente minimo**: menos JS enviado al browser, mejor
  rendimiento percibido, mejor Core Web Vitals.
- **Seguridad por defecto**: los secrets quedan server-side; el cliente
  no puede importarlos por error si el componente esta bien marcado.
- **Co-locacion de datos y UI**: las paginas pueden hacer fetch de datos
  directamente en el servidor, sin `useEffect` + estado de loading.
- **Compatible con Vercel serverless**: es el target optimo de Next.js.

### Negativas / Trade-offs

- **Confusion Server vs Client**: es la principal fuente de bugs en App
  Router. Requiere disciplina y revisiones de PR.
- **Serializacion obligatoria**: no se pueden pasar funciones ni contextos
  a traves del boundary server/client.
- **Debugging mas complejo**: errores de boundary son a veces cripticos.
- **Migracion desde Pages Router**: los patrones de `getServerSideProps` /
  `getStaticProps` no aplican directamente.
- **Middleware en Edge Runtime**: limitaciones de APIs disponibles en
  `middleware.js` (no Node APIs completas).

### Consecuencias para auditoria y gestion

- **Al agregar una pagina nueva:**
  1. Crear como Server Component por defecto.
  2. Si necesita interactividad, aislar en un componente hijo con `'use client'`.
  3. Si necesita datos privilegiados, mover a API Route.
- **Al agregar un componente nuevo:**
  - Si va en `src/components/**` y usa hooks -> `'use client'` obligatorio.
  - Si no usa hooks ni APIs browser -> dejarlo Server Component.
- **Checklist de PR (reforzar):**
  - [ ] `npm run build` pasa.
  - [ ] `npm run lint` pasa sin warnings.
  - [ ] No hay secrets ni `process.env.SUPABASE_SERVICE_ROLE_KEY` importados
    en archivos con `'use client'`.
  - [ ] No hay `console.log` de objetos con datos de cliente.
- **Auditoria de CONF-001:** se considera cerrado cuando
  `next.config.js` tiene `eslint.ignoreDuringBuilds: false` y el build
  pasa en CI.

---

## Alternativas consideradas

- **Next.js Pages Router (quedarse):** rechazada. Menos ergonomia para
  Server Components, peor integracion con streaming y suspenso, camino
  a deprecacion.
- **Remix / React Router 7:** considerada por su modelo de datos. Rechazada
  por menor ecosistema en el contexto PanFree (Vercel + Supabase +
  componentes existentes estan en Next).
- **SPA pura (Vite + React + API separada):** rechazada. Perderia SSR
  (SEO critico para tienda) y requeriria infraestructura separada.
- **Astro + islas:** considerada por performance. Rechazada por friccion
  con la parte ERP (que es muy interactiva) y por no estar alineado con
  la base de codigo actual.

---

## Referencias

- [ARCHITECTURE.md](../../01-arquitectura/ARCHITECTURE.md) — seccion 3 (topologia)
- [CONF-001](../../04-auditorias/2026-10-13-inicial/03-codigo-fuente.md)
- [SEC-002](../../04-auditorias/2026-10-13-inicial/03-codigo-fuente.md)
- [ADR-001](./ADR-001-supabase-backend-unico.md)
- [ADR-002](./ADR-002-seguridad-en-capas-app-metadata.md)
- [CONTRIBUTING.md](../../02-operaciones/CONTRIBUTING.md) — estandares tecnicos
- [Next.js App Router — docs oficiales](https://nextjs.org/docs/app)
"@
Write-FileNoBom -Path "docs/01-arquitectura/decisiones/ADR-003-nextjs-app-router-rsc.md" -Content $content

# ============================================================================
# INDICE DE ADRs
# ============================================================================
$content = @"
# Architecture Decision Records (ADRs)

Registro de decisiones arquitectonicas de PanFree System.

## Que es un ADR

Un ADR (Architecture Decision Record) documenta una decision arquitectonica
importante junto con su contexto, consecuencias y alternativas consideradas.
El objetivo es que futuras auditorias y nuevos integrantes entiendan **por que**
el sistema esta construido como esta, no solo **como**.

Formato: [MADR](https://adr.github.io/madr/) simplificado.
Plantilla base: [TEMPLATE.md](./TEMPLATE.md)

## Indice

| ID | Titulo | Estado | Fecha |
|---|---|---|---|
| [ADR-001](./ADR-001-supabase-backend-unico.md) | Supabase como backend unico (Postgres + Auth + RLS + Storage) | Aceptado | 2026-10-13 |
| [ADR-002](./ADR-002-seguridad-en-capas-app-metadata.md) | Seguridad en capas y app_metadata como fuente unica de rol | Aceptado | 2026-10-13 |
| [ADR-003](./ADR-003-nextjs-app-router-rsc.md) | Next.js 14 App Router con Server Components por defecto | Aceptado | 2026-10-13 |

## Estados posibles

| Estado | Significado |
|---|---|
| Propuesto | En discusion, no aplicado aun |
| Aceptado | Decision vigente |
| Rechazado | Se considero pero no se aplico |
| Obsoleto | Fue valido, ya no aplica (reemplazado por otro ADR) |

## Como agregar un ADR nuevo

1. Copiar `TEMPLATE.md` a `ADR-NNN-titulo-corto.md` (NNN = siguiente numero).
2. Llenar contexto, decision, consecuencias y alternativas.
3. Agregarlo al indice de este README.
4. Commit: `docs(adr): agregar ADR-NNN <titulo>`

## Cuando crear un ADR

- Eleccion de tecnologia o framework.
- Cambio en el modelo de seguridad o autorizacion.
- Cambio en la topologia (server/client, monolito/servicios).
- Decision que afecta multiples fases del Plan de Trabajo.
- Cualquier decision que un auditor futuro preguntaria "por que asi?".

## Referencias

- [ARCHITECTURE.md](../../01-arquitectura/ARCHITECTURE.md)
- [Plan de Trabajo](../../02-operaciones/PLAN-DE-TRABAJO.md)
- [MADR — Markdown ADR](https://adr.github.io/madr/)
"@
Write-FileNoBom -Path "docs/01-arquitectura/decisiones/README.md" -Content $content

# ============================================================================
# VERIFICACION
# ============================================================================
Write-Host ""
Write-Host "=== [2/3] Completado ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Archivos creados:" -ForegroundColor Yellow
Write-Host "  docs/01-arquitectura/decisiones/README.md"
Write-Host "  docs/01-arquitectura/decisiones/ADR-001-supabase-backend-unico.md"
Write-Host "  docs/01-arquitectura/decisiones/ADR-002-seguridad-en-capas-app-metadata.md"
Write-Host "  docs/01-arquitectura/decisiones/ADR-003-nextjs-app-router-rsc.md"
Write-Host ""

Write-Host "=== Verificando here-strings ===" -ForegroundColor Cyan
$scriptPath = $PSCommandPath
$openCount = (Select-String -Path $scriptPath -Pattern '^@"$' -AllMatches).Count
$closeCount = (Select-String -Path $scriptPath -Pattern '^"@$' -AllMatches).Count
Write-Host "  Aperturas (@`" al inicio de linea): $openCount" -ForegroundColor Yellow
Write-Host "  Cierres   (`"@ al inicio de linea): $closeCount" -ForegroundColor Yellow
if ($openCount -ne $closeCount) {
    Write-Host "  ADVERTENCIA: no coinciden. Revisar el archivo antes de commitear." -ForegroundColor Red
} else {
    Write-Host "  OK: coinciden." -ForegroundColor Green
}
Write-Host ""

Write-Host "Git status:" -ForegroundColor Yellow
git status --short

if ($NoCommit) {
    Write-Host ""
    Write-Host "=== -NoCommit activado ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Continua con el script 03:"
    Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\docs\03-crear-referencias.ps1 -NoCommit"
    exit 0
}

Write-Host ""
$resp = Read-Host "Hacer commit de los ADRs? (s/N)"
if ($resp -ne "s" -and $resp -ne "S") {
    Write-Host "Commit cancelado." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== Commiteando ===" -ForegroundColor Cyan

git add docs/01-arquitectura/decisiones/README.md
git add docs/01-arquitectura/decisiones/ADR-001-supabase-backend-unico.md
git add docs/01-arquitectura/decisiones/ADR-002-seguridad-en-capas-app-metadata.md
git add docs/01-arquitectura/decisiones/ADR-003-nextjs-app-router-rsc.md

git commit -m "docs(adr): agregar 3 ADRs de arquitectura (Supabase, seguridad, Next.js)"
git push origin main

Write-Host ""
Write-Host "=== [2/3] Listo ===" -ForegroundColor Green
git log --oneline -3