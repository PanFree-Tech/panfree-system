# Fase 4 - Deuda Técnica Pendiente

**Fecha de creación:** 2026-10-19
**Estado:** Pendiente (no urgente, no crítico)
**Origen:** ítems de deuda técnica detectados en Fase 2 y Fase 3 que no se resolvieron.

---

## Ítems pendientes

| # | Problema | Prioridad | Esfuerzo | Archivos |
|---|---|---|---|---|
| 1 | `middleware.js` lee `user.app_metadata.role` pero el rol real está en `clientes.role` (ADR-002) | Media | 1-2 h | `src/middleware.js` |
| 2 | Íconos PWA `icon-144x144.png` no se cargan (rediseño gráfico) | Baja | 30 min | `public/icons/` |
| 3 | `/api/admin/ga-metrics` devuelve 500 desde consola (funciona en admin panel) | Media | 30 min | `src/app/api/admin/ga-metrics/route.js` |
| 4 | Warnings de ESLint `react-hooks/exhaustive-deps` en `/perfil/page.js` y `/perfil/puntos/page.js` | Baja | 15 min | `src/app/perfil/` |
| 5 | `Error cargando productos` en build estático (fetch a `/api/productos` sin servidor) | Baja | 30 min | `src/app/page.js` (o similar) |

---

## Detalle

### 1. middleware.js lee user.app_metadata.role

**Problema:** El middleware lee `user.app_metadata.role` para verificar si es admin. Pero el rol real vive en `clientes.role` (tabla de Supabase). El `app_metadata` solo se actualiza si el admin lo setea manualmente en Supabase Auth.

**Riesgo:** Si un admin es degradado en `clientes.role`, el middleware sigue dejándolo pasar hasta que se re-loguee (porque el JWT sigue teniendo `role: 'admin'` en `app_metadata`).

**Fix:** En el middleware, después de `getUser()`, hacer una query a `clientes.role` con `service_role` o con el JWT del usuario, y verificar el rol real.

**Esfuerzo:** 1-2 h (toca `middleware.js`, que es sensible).

---

### 2. Íconos PWA icon-144x144.png

**Problema:** El manifest referencia `/icons/icon-144x144.png`, pero el archivo no existe o está corrupto. Chrome muestra warning en consola.

**Fix:** Crear el archivo `public/icons/icon-144x144.png` con el logo de PanFree en 144x144 px.

**Esfuerzo:** 30 min (requiere diseño gráfico o resize del logo existente).

---

### 3. /api/admin/ga-metrics 500 desde consola

**Problema:** El endpoint devuelve 500 cuando se llama desde la consola del navegador sin el header `Authorization`. Pero funciona desde el admin panel (que sí manda el JWT).

**Fix:** No es un bug real (es el fail-closed de `requireAuth`). Documentar que el endpoint solo se llama desde el admin panel, no desde consola.

**Esfuerzo:** 30 min (solo documentación).

---

### 4. Warnings de ESLint react-hooks/exhaustive-deps

**Problema:** `useEffect` en `/perfil/page.js` y `/perfil/puntos/page.js` tiene dependencias faltantes (`abrirModal`, `cargarPedidos`, `cargarDatos`).

**Fix:** Agregar las dependencias o usar `useCallback` para estabilizarlas.

**Esfuerzo:** 15 min.

---

### 5. Error cargando productos en build estático

**Problema:** Durante `npm run build`, Next.js intenta hacer fetch a `/api/productos` para generar páginas estáticas, pero como no hay servidor corriendo, devuelve 404 → HTML. El error no rompe el build, pero ensucia el output.

**Fix:** Usar `generateStaticParams` o `dynamic = 'force-dynamic'` en la página que hace el fetch, o mover el fetch a `useEffect` (client-side).

**Esfuerzo:** 30 min.

---

## Estado

**Ninguno de estos ítems es crítico.** **Ninguno bloquea producción.** **Se pueden resolver en cualquier momento.**

**Cuando se decida hacer Fase 4, empezar por los de prioridad Media (#1 y #3), después los de prioridad Baja (#2, #4, #5).**