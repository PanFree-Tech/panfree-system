---
title: "Quick wins: logging, error banner, Sin TACC badge, security headers, robots, sitemap, revalidate"
body: |
  Cambios incluidos (quick wins de alto impacto):
  
  - `page.js`: manejo de errores y logs cuando falla la consulta a Supabase; evita fallos silenciosos y pasa `fetchErrors` al cliente.
  - `TiendaCliente.js`: muestra un banner visible si el servidor reporta problemas al obtener productos.
  - `ProductCard.js`: muestra badge "✅ Sin TACC" cuando `producto.certificado_tacc` está marcado; añade `console.log` para debug de render.
  - `next.config.js`: headers de seguridad básicos (CSP, HSTS, X-Frame-Options, Referrer-Policy, etc).
  - `public/robots.txt`: robots básico apuntando al sitemap.
  - `app/api/sitemap/route.js`: sitemap dinámico simple (usa `SUPABASE_SERVICE_ROLE_KEY`).
  - `app/api/revalidate/route.js`: endpoint POST protegido para forzar revalidación (usa `REVALIDATE_SECRET`).
  
  Pasos para probar local / en staging:
  1. Preparar env vars (ver lista abajo) en el entorno (local/.env, Vercel Preview o Production):
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (solo en server env; necesario para sitemap)
     - `NEXT_PUBLIC_SITE_URL` (opcional, por defecto https://www.panfree.fit)
     - `REVALIDATE_SECRET` (para POST en /api/revalidate)
  2. Build local
     - `npm install`
     - `npm run build`
     - `npm run start` (o `next start`)
     - Verificar en consola del servidor los logs: deberías ver mensajes como "[Supabase] productos: N items" o errores en caso de fallo.
  3. Probar UI:
     - Abrir `/` en app: si hay error en carga de productos verás banner rojo con mensaje y botón "Reintentar (recargar)".
     - Verificar que ProductCard muestre badge "✅ Sin TACC" para productos con `certificado_tacc = true`.
  4. Probar sitemap:
     - `GET /api/sitemap` → devuelve `sitemap.xml` con URLs de productos públicos.
  5. Probar revalidate:
     - `POST /api/revalidate` con body `{ "secret": "<REVALIDATE_SECRET>" }` → espera JSON `{ revalidated: true }`.
  6. Verificar headers:
     - Hacer una petición `GET /` y comprobar en la respuesta los headers agregados (Content-Security-Policy, Strict-Transport-Security, X-Frame-Options, etc).

  Variables de entorno necesarias (añadir en Vercel → Environment Variables):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - `NEXT_PUBLIC_SITE_URL` (opcional)
  - `REVALIDATE_SECRET`

  NOTAS:
  - `SUPABASE_SERVICE_ROLE_KEY` es sensible: guardarla SOLO en entornos server y no exponerla en el cliente.
  - CSP incluido es minimal y puede necesitar ajustes según scripts/analytics usados.
  - El endpoint de sitemap usa keys server-only; podemos cambiarlo si preferís sitemap estático en build.

  Próximos pasos sugeridos tras merge:
  - Ver logs de servidor en Vercel para validar que las queries a Supabase funcionan y eliminar el banner si todo OK.
  - Implementar ProductStructuredData y mejorar la metadata por producto (SEO).

---
