# ADR-002: Seguridad en capas y app_metadata como fuente unica de rol

**Fecha:** 2026-10-13
**Estado:** Aceptado
**Decisores:** Pedro J. Pirovani (PanFree)

---

## Contexto

PanFree System tiene dos tipos de usuarios bien diferenciados:

- **Clientes B2C:** se registran solos, compran, acumulan puntos. No deben
  acceder a nada administrativo.
- **Staff administrativo:** roles dmin, operador, marketing,
  epartidor. Acceden al ERP en /admin y a las APIs /api/admin/*.

Durante la auditoria inicial (2026-10-13) se detectaron dos hallazgos criticos
relacionados:

- **SEC-003 (Critico):** el middleware verifica el rol del usuario leyendo
  user_metadata.role. user_metadata es **editable por el propio usuario**
  desde el cliente, por lo tanto cualquier cliente podia auto-asignarse
  ole: "admin" y acceder al panel.
- **DB-001b (Critico):** varias politicas RLS usan USING (true), lo cual
  permite a non leer tablas sensibles (pedidos, detalle_pedido,
  canjes_premios).

Adicionalmente, se identifico que existe logica de autorizacion en tres
lugares potenciales (middleware Next.js, RLS en Postgres, chequeos ad-hoc en
API Routes), lo cual es una fuente clasica de vulnerabilidades por
inconsistencia.

---

## Decision

Se adopta un modelo de **seguridad en capas** con **una unica fuente de
verdad por capa**, siguiendo las recomendaciones OWASP ASVS y las buenas
practicas de Supabase:

### Capa 1 â€” Autenticacion (quien sos)

- **Supabase Auth** emite la sesion via cookie HttpOnly gestionada por
  @supabase/ssr.
- **Fuente de verdad:** uth.users + sesion firmada por Supabase.

### Capa 2 â€” Rol (que podes hacer como identidad)

- **Fuente de verdad unica:** uth.users.app_metadata.role.
- **user_metadata NO se usa nunca para autorizacion.** Se usa solo para
  preferencias cosmeticas editables por el usuario (avatar, nombre visible).
- Los roles validos se restringen a un enum documentado:
  cliente, operador, marketing, epartidor, dmin.
- El middleware de Next.js (src/middleware.js) debe leer **solo**
  user.app_metadata?.role. Los fallbacks a user_metadata se eliminan
  (fix de F3-01).

### Capa 3 â€” Autorizacion a nivel de dato (que filas podes ver)

- **Fuente de verdad:** politicas RLS en Postgres.
- Toda tabla con datos sensibles tiene ENABLE ROW LEVEL SECURITY y
  politicas explicitas para non y uthenticated.
- **Prohibido USING (true)** en tablas con datos de cliente o de negocio.
- Las politicas usan uth.uid() y uth.jwt() -> 'app_metadata' ->> 'role'
  para discriminar por rol.

### Capa 4 â€” Operaciones privilegiadas (service_role)

- SUPABASE_SERVICE_ROLE_KEY se usa **exclusivamente server-side**.
- Se prohibe importarla en cualquier archivo que pueda ejecutarse en el
  browser (use client, hooks, componentes).
- Cada uso debe estar justificado por operacion (logs de auditoria,
  notificaciones masivas) y auditado.

### Capa 5 â€” Rutas administrativas

- /admin/* y /api/admin/* pasan obligatoriamente por el middleware.
- Respuestas estandar:
  - Sin sesion -> 401 JSON (API) / redirect a /admin/login (web).
  - Sesion sin rol suficiente -> 403 JSON (API) / redirect a /unauthorized (web).

---

## Consecuencias

### Positivas

- **SEC-003 queda cerrado por diseno**, no por parche. Un cliente no puede
  elevar privilegios aunque modifique su propio user_metadata.
- **Consistencia:** una sola fuente de verdad por capa elimina la clase de
  bugs "el middleware dice que si pero RLS dice que no" (o al reves).
- **Auditable:** para verificar autorizacion alcanza con revisar
  pp_metadata (auth), politicas RLS (datos) y el middleware (rutas).
- **Alineado con Supabase:** pp_metadata es la recomendacion oficial de
  Supabase para roles de autorizacion.

### Negativas / Trade-offs

- **Cambiar el rol de un usuario requiere acceso administrativo** (Admin API
  de Supabase o dashboard). No puede hacerse desde el propio usuario. Esto es
  intencional.
- **Duplicacion controlada:** el rol se chequea en middleware y en RLS. Es
  duplicacion necesaria porque middleware protege rutas y RLS protege datos
  ante acceso directo a la API de Supabase.
- **Migrar usuarios existentes:** si algun usuario tenia el rol solo en
  user_metadata, hay que migrarlo a pp_metadata antes de activar el
  fix de F3-01.

### Consecuencias para auditoria y gestion

- **Alta de usuario staff:** siempre por Supabase Dashboard o Admin API,
  seteando pp_metadata.role. Nunca desde el frontend.
- **Alta de nueva ruta admin:** debe matchear /admin/* o /api/admin/*
  para pasar por el middleware. Si la ruta no matchea, hay que agregarla
  explicitamente al matcher.
- **Checklist obligatorio al agregar politica RLS:**
  1. ENABLE ROW LEVEL SECURITY en la tabla.
  2. Politica explicita por rol (no USING (true) en tablas con PII).
  3. Test negativo: non no puede leer; cliente no puede leer datos de otro cliente.
- **Auditoria de SEC-003:** el fix se considera cerrado cuando un usuario
  con user_metadata.role = 'admin' pero sin pp_metadata.role **no** puede
  acceder a /admin.

---

## Alternativas consideradas

- **Rol solo en user_metadata:** rechazada. Es editable por el usuario
  (SEC-003). Inaceptable para autorizacion.
- **Rol en tabla usuarios custom + lookup en cada request:** rechazada por
  latencia (una query extra por request) y por perder la integracion nativa
  con uth.jwt() en RLS.
- **Rol hardcodeado en el JWT custom claim via Auth Hook:** considerada pero
  postergada. Requiere plan pago de Supabase. pp_metadata cubre el caso
  actual.
- **Solo middleware, sin RLS:** rechazada. No protege ante acceso directo a
  la API de Supabase (que es publica por diseno con la anon key).

---

## Referencias

- [SEC-003](../../audits/2026-10-13-inicial/03-codigo-fuente.md)
- [DB-001b](../../audits/2026-10-13-inicial/02-supabase-advisors.md)
- [ADR-001](./ADR-001-supabase-backend-unico.md)
- [ARCHITECTURE.md](../../architecture/ARCHITECTURE.md) â€” seccion 5
- [middleware.js](../../../src/middleware.js) â€” implementacion a corregir en F3-01
- [OWASP ASVS v4.0](https://owasp.org/www-project-application-security-verification-standard/) â€” V4 Access Control