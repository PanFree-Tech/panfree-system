# ADR-003: Next.js 14 App Router con Server Components por defecto

**Fecha:** 2026-10-13
**Estado:** Aceptado
**Decisores:** Pedro J. Pirovani (PanFree)

---

## Contexto

PanFree System combina dos aplicaciones con necesidades muy distintas:

- **Tienda B2C publica:** SEO critico, catalogos, fichas de producto,
  checkout. Necesita SSR/ISR para indexacion y velocidad percibida.
- **ERP administrativo en /admin:** altamente interactivo (tablas, filtros,
  formularios, canvas para marketing). No necesita SEO, si interactividad.

El proyecto se inicio como Next.js con Pages Router y migro a **App Router**
(Next.js 13+, adoptado en 14). La pregunta de arquitectura que este ADR
formaliza es:

- Cuanto del sistema debe ser Server Component vs Client Component.
- Donde vive la logica de negocio.
- Como se comunican frontend y backend.

Durante la auditoria inicial se detectaron hallazgos relacionados con esta
decision:

- **CONF-001:** eslint.ignoreDuringBuilds: true permite que errores de
  RSC vs Client Component pasen a produccion.
- **SEC-002:** claves hardcodeadas en src/lib/supabase.js por querer
  "facilitar" el fallback cuando faltan env vars (patron peligroso).

---

## Decision

Se adopta **Next.js 14 con App Router** y las siguientes reglas de diseno:

### Regla 1 â€” Server Components por defecto

- Toda pagina y layout en src/app/** es **Server Component** por defecto.
- 'use client' se agrega **solo** cuando el componente necesita:
  - React hooks (useState, useEffect, useContext, etc.)
  - APIs del browser (localStorage, window, 
avigator)
  - Librerias que solo corren en cliente (canvas, framer-motion runtime)
- La regla se aplica de abajo hacia arriba: el 'use client' lo mas cerca
  posible de la hoja del arbol de componentes.

### Regla 2 â€” Logica de negocio en API Routes, no en el cliente

- Toda operacion que toque service_role, servicios externos (Resend, Meta,
  Gemini, Twilio), o que requiera validar con Zod, vive en src/app/api/**.
- El cliente **nunca** habla directamente con service_role ni con servicios
  que requieran secrets.
- El cliente puede hablar con Supabase directamente **solo** para operaciones
  cubiertas por RLS (lecturas publicas, inserciones validadas).

### Regla 3 â€” Separacion explicita cliente/servidor en componentes

- Componentes con interactividad van en src/components/** con 'use client'.
- Componentes puros (presentacionales sin estado) pueden ser Server Components.
- Los **Context Providers** (CartContext, AuthContext) viven en
  layout-client.js (Client Component) que envuelve el arbol.
- La comunicacion entre Server y Client Components se hace via **props
  serializables** (JSON-safe). Nunca pasar funciones ni clases.

### Regla 4 â€” Middleware para proteccion perimetral

- src/middleware.js intercepta /admin/* y /api/admin/*.
- El middleware no hace queries a la DB; solo valida sesion y rol (ver ADR-002).
- La logica de autorizacion fina vive en RLS.

### Regla 5 â€” Build estricto

- eslint.ignoreDuringBuilds debe estar en alse (fix CONF-001).
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
  directamente en el servidor, sin useEffect + estado de loading.
- **Compatible con Vercel serverless**: es el target optimo de Next.js.

### Negativas / Trade-offs

- **Confusion Server vs Client**: es la principal fuente de bugs en App
  Router. Requiere disciplina y revisiones de PR.
- **Serializacion obligatoria**: no se pueden pasar funciones ni contextos
  a traves del boundary server/client.
- **Debugging mas complejo**: errores de boundary son a veces cripticos.
- **Migracion desde Pages Router**: los patrones de getServerSideProps /
  getStaticProps no aplican directamente.
- **Middleware en Edge Runtime**: limitaciones de APIs disponibles en
  middleware.js (no Node APIs completas).

### Consecuencias para auditoria y gestion

- **Al agregar una pagina nueva:**
  1. Crear como Server Component por defecto.
  2. Si necesita interactividad, aislar en un componente hijo con 'use client'.
  3. Si necesita datos privilegiados, mover a API Route.
- **Al agregar un componente nuevo:**
  - Si va en src/components/** y usa hooks -> 'use client' obligatorio.
  - Si no usa hooks ni APIs browser -> dejarlo Server Component.
- **Checklist de PR (reforzar):**
  - [ ] 
pm run build pasa.
  - [ ] 
pm run lint pasa sin warnings.
  - [ ] No hay secrets ni process.env.SUPABASE_SERVICE_ROLE_KEY importados
    en archivos con 'use client'.
  - [ ] No hay console.log de objetos con datos de cliente.
- **Auditoria de CONF-001:** se considera cerrado cuando
  
ext.config.js tiene eslint.ignoreDuringBuilds: false y el build
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

- [ARCHITECTURE.md](../../01-arquitectura/ARCHITECTURE.md) â€” seccion 3 (topologia)
- [CONF-001](../../04-auditorias/2026-10-13-inicial/03-codigo-fuente.md)
- [SEC-002](../../04-auditorias/2026-10-13-inicial/03-codigo-fuente.md)
- [ADR-001](./ADR-001-supabase-backend-unico.md)
- [ADR-002](./ADR-002-seguridad-en-capas-app-metadata.md)
- [CONTRIBUTING.md](../../02-operaciones/CONTRIBUTING.md) â€” estandares tecnicos
- [Next.js App Router â€” docs oficiales](https://nextjs.org/docs/app)