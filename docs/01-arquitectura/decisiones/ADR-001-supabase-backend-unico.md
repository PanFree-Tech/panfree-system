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

La integracion se realiza via @supabase/ssr y @supabase/supabase-js
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
- **Migraciones SQL versionables** en /migrations, lo cual permite auditoria
  del esquema.

### Negativas / Riesgos asumidos

- **Vendor lock-in moderado**: la logica en RLS y funciones SQL es portables
  a Postgres puro, pero Auth y Storage no lo son.
- **Dependencia de advisors de seguridad**: como toda la autorizacion vive en
  la DB, un error en RLS es una vulnerabilidad directa. Esto motivo la
  auditoria 2026-10-13 y el hallazgo DB-001.
- **Curva de aprendizaje de RLS**: escribir politicas correctas y performantes
  (evitar uth.uid() en cada fila, evitar SECURITY DEFINER innecesario)
  requiere disciplina. Ver ADR-002.
- **Plan Free con limites** (500MB DB, 1GB Storage): a futuro puede requerir
  upgrade a Pro (~/mes).

### Consecuencias para auditoria y gestion

- **Fuente de verdad de autorizacion:** RLS en Postgres. Toda auditoria de
  acceso debe empezar por revisar politicas RLS y advisors de Supabase.
- **Checklist obligatorio al agregar tabla nueva:**
  1. Crear la tabla con ENABLE ROW LEVEL SECURITY.
  2. Definir politicas para non, uthenticated y roles de staff.
  3. Verificar en Supabase Advisors que no aparezcan warnings.
- **Prohibido:** usar SECURITY DEFINER en vistas o funciones sin justificacion
  documentada y SET search_path. Ver DB-001a/DB-001c.
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

- [ARCHITECTURE.md](../../01-arquitectura/ARCHITECTURE.md) â€” seccion 5 (Seguridad y Roles)
- [DATABASE.md](../../01-arquitectura/DATABASE.md) â€” esquema completo
- [Auditoria DB-001](../../04-auditorias/2026-10-13-inicial/02-supabase-advisors.md)
- [Plan de Trabajo](../../02-operaciones/PLAN-DE-TRABAJO.md) â€” Fase 1