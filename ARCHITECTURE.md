
## 📄 `ARCHITECTURE.md` - COMPLETO

**COPIA TODO ESTO (desde el inicio hasta el final):**

```markdown
# Panfree System — Arquitectura

**Última revisión:** 2026-08-18
**Autor:** Auditoría automática (basado en archivos del repositorio)

---

## 1. ¿Qué es Panfree System?

Panfree System es una aplicación web de **e‑commerce (tienda pública)** con **panel de administración**. 

- **Frontend:** Next.js App Router (Next 14) con Server y Client Components
- **Backend:** Supabase (Auth + Postgres)
- **Integraciones:** Cloudinary, n8n (webhooks), WhatsApp, PWA, notificaciones push
- **Analytics:** Google Analytics 4 (GA4) para tracking de usuarios y eventos de e-commerce

---

## 2. Estructura del Proyecto
panfree-system/
├── package.json # Dependencias y scripts
├── next.config.js # (Pendiente de revisar) Configuración Next.js y next-pwa
├── .env.example # (Si existe) Variables de entorno de ejemplo
├── src/
│ ├── app/
│ │ ├── layout.js # Root layout (Server Component) — metadata, viewport
│ │ ├── layout-client.js # (Client) Provider wrapper, CartInitializer, GA4
│ │ ├── page.js # Home (Server Component) — carga productos y disponibilidad
│ │ ├── checkout/
│ │ │ └── page.js # Checkout (Client Component) — lógica completa de compra
│ │ ├── pedido/
│ │ │ └── [numero]/
│ │ │ └── page.js # Seguimiento de pedido (público)
│ │ ├── api/ # API routes (App Router)
│ │ └── TiendaCliente.js # Componente cliente usado por la home
│ ├── components/ # Componentes reutilizables
│ │ ├── ProductCard.js
│ │ ├── CartSidebar.js
│ │ ├── GAScript.jsx # Carga de Google Analytics 4
│ │ └── ...
│ ├── context/
│ │ ├── CartContext.js # Carrito: localStorage, API legacy
│ │ └── AuthContext.js # Autenticación con Supabase
│ ├── hooks/ # Hooks personalizados
│ │ └── useAnalytics.js # Hook de Google Analytics 4
│ ├── lib/
│ │ └── supabase.js # Cliente Supabase + helper
│ ├── middleware.js # Protege rutas /admin/* (Supabase SSR)
│ └── globals.css # Estilos globales
├── scripts/
│ └── migrar-imagenes-cloudinary.js # Script migración imágenes
├── public/
│ ├── icons/ # Íconos de la app
│ ├── manifest.json # PWA manifest
│ └── og-image.jpg # Open Graph image
└── README.md # Documentación del repo

text

---

## 3. Patrones de Diseño y Decisiones

### 3.1 Context API

- **CartContext:** Única fuente de verdad del carrito.
- **AuthContext:** Gestión de autenticación con Supabase.
- **Razón:** Estado limitado (carrito, auth), Redux no justificado.

### 3.2 Server vs Client Components (Next.js App Router)

| Tipo | Uso | Ejemplos |
|------|-----|----------|
| **Server Components** | Fetch inicial, SEO, render estático | Home (`/`), Layout |
| **Client Components** | Interactividad, eventos, localStorage, hooks | Checkout, CartSidebar, Providers, useAnalytics |

### 3.3 Arquitectura "Backend-Lite"

La app escribe directamente a Supabase desde el cliente usando la **anon key**. Esto requiere **políticas RLS seguras** o migrar a server-side para mayor control.

### 3.4 Event-Driven Legacy

`window.__PANFREE_CART` con `EventTarget` listeners para compatibilidad con código antiguo.

---

## 4. Flujo de Datos
┌─────────────────────────────────────────────────────────────────┐
│ BROWSER │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────────────┐ ┌───────────────────┐ │
│ │ CartContext │ │ AuthContext │ │
│ │ (localStorage) │ │ (Supabase Client) │ │
│ └────────┬──────────┘ └────────┬──────────┘ │
│ │ │ │
│ └──────────┬─────────────┘ │
│ ▼ │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Client Components (UI) │ │
│ │ - Checkout - CartSidebar - TiendaCliente │ │
│ │ - useAnalytics (GA4 eventos) - GAScript │ │
│ └──────────────────────┬───────────────────────────────┘ │
│ │ │
│ ▼ │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Server Components (Fetch) │ │
│ │ - Home (productos + disponibilidad) │ │
│ └──────────────────────┬───────────────────────────────┘ │
│ │ │
├─────────────────────────┼──────────────────────────────────────┤
│ ▼ │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ SUPABASE (Auth + Postgres) │ │
│ │ - productos - clientes - pedidos - detalle_pedido│ │
│ │ - vista_disponibilidad_productos │ │
│ └──────────────────────┬───────────────────────────────┘ │
│ │ │
│ ▼ │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ INTEGRACIONES EXTERNAS │ │
│ │ - n8n (webhooks) - WhatsApp (wa.me) - Cloudinary │ │
│ │ - Google Analytics 4 (gtag.js) │ │
│ └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

text

---

## 5. Seguridad

### 5.1 Middleware

`src/middleware.js` usa `createServerClient` (@supabase/ssr):

- **Capa 1:** Verifica sesión válida (`supabase.auth.getUser()`)
- **Capa 2:** Verifica rol `admin` en `user.app_metadata.role` o `user.user_metadata.role`
- **Protege:** Rutas `/admin/*` (excepto `/admin/login`)
- **Redirección:** Sin sesión → `/admin/login`; Sin admin → `/`

### 5.2 Autenticación

- **Cliente:** Supabase Auth (email + password)
- **AuthContext:** Gestiona sesión en cliente
- **Roles:** `admin` (panel), `authenticated` (usuarios), `anon` (invitados)

### 5.3 Políticas RLS (Recomendadas)

| Tabla | Política | Descripción |
|-------|----------|-------------|
| `productos` | SELECT público | Solo lectura pública |
| `clientes` | INSERT/UPDATE propio | Solo user_id = auth.uid() o admin |
| `pedidos` | INSERT validado | Solo con validaciones (subtotal > 0, etc.) |
| `detalle_pedido` | INSERT con FK válido | Validar integridad de precios |

### 5.4 Google Analytics 4 (GA4)

**Integración:** GA4 está implementado para tracking de usuarios y eventos de e-commerce.

#### Componentes GA4

| Componente | Ubicación | Función |
|------------|-----------|---------|
| `GAScript.jsx` | `src/components/` | Carga gtag.js con `next/script` |
| `useAnalytics.js` | `src/hooks/` | Hook con eventos GA4 |

#### Eventos Implementados

```javascript
// Eventos de e-commerce estándar
pageview(url)           // Vista de página
viewItem(producto)      // Vista de producto
viewItemList(productos) // Vista de catálogo
selectItem(producto)    // Selección de producto
addToCart(producto)     // Agregar al carrito
removeFromCart(producto)// Eliminar del carrito
beginCheckout(items)    // Inicio de checkout
purchase(pedido)        // Compra completada
Consentimiento
javascript
// Activar
localStorage.setItem('panfree_ga_consent', 'granted');

// Desactivar
localStorage.setItem('panfree_ga_consent', 'denied');
Variables de entorno
env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-QE8GQS3MSR
Documentación completa: GA4-IMPLEMENTACION.md

5.5 ⚠️ Advertencias Críticas
Credenciales en código: Revisar src/lib/supabase.js (fallback con JWT parcial)

Writes desde cliente: El checkout escribe directamente en Supabase desde el cliente → requiere RLS estrictas

Webhook expuesto: NEXT_PUBLIC_N8N_WEBHOOK_URL visible en cliente → mover a server-side

window.* expuestos: window.confirmarPedido y window.__PANFREE_CART → remover en producción

6. Recomendaciones Inmediatas
✅ Revisar políticas RLS en Supabase (prioritario)

✅ Mover llamadas sensibles a API server-side

✅ Remover window.confirmarPedido en producción

✅ Rotar cualquier secreto expuesto en repo

✅ Añadir tests e2e para flujo de checkout

✅ Implementar rate limiting en endpoints públicos

✅ Activar Google Analytics 4 DebugView para verificar eventos

✅ Configurar conversiones en GA4 (purchase como objetivo)