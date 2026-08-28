# 📊 Google Analytics 4 (GA4) — Implementación en PanFree System

**Versión:** 2.0.0  
**ID de Medición (Client-Side):** `G-QE8GQS3MSR`  
**Última actualización:** 2026-08-28  
**Estado:** ✅ Implementado, verificado y activo en producción  

---

## 📋 1. Resumen de la Implementación

PanFree System integra una arquitectura híbrida de **Google Analytics 4** que combina:
1. **Tracking en Cliente (SPA):** Captura de navegación y eventos de comercio electrónico mejorado mediante el hook personalizado `useAnalytics` y el componente `GAScript`.
2. **Measurement Protocol (Server-Side):** Despacho de transacciones seguras y eventos de conversión desde el backend vía `/api/ga4/measurement`.
3. **Gestión de Consentimiento (Consent Mode):** Control de privacidad respetando la preferencia del usuario en `localStorage`.
4. **Dashboard de Métricas ERP:** Visualización de métricas de adquisición y conversiones en `/api/admin/ga-metrics`.

---

## 📁 2. Archivos y Componentes de Implementación

| Archivo | Ubicación | Función |
|---|---|---|
| `GAScript.jsx` | `src/components/GAScript.jsx` | Carga asíncrona de `gtag.js` mediante `next/script` respetando el consentimiento. |
| `useAnalytics.js` | `src/hooks/useAnalytics.js` | Hook de React que expone los métodos estándar de e-commerce GA4. |
| `layout-client.js` | `src/app/layout-client.js` | Inyección del script global y escucha de rutas SPA. |
| `measurement/route.js` | `src/app/api/ga4/measurement/route.js` | API server-side para Measurement Protocol. |
| `ga-metrics/route.js` | `src/app/api/admin/ga-metrics/route.js` | API administrativa para consultar métricas agregadas. |

---

## 🛒 3. Matriz de Eventos de E-commerce Implementados

| Evento GA4 | Función en `useAnalytics.js` | Ubicación del Disparo | Parámetros Enviados |
|---|---|---|---|
| `page_view` | `pageview(url)` | `layout-client.js` (en cada cambio de ruta) | `page_path`, `page_title` |
| `view_item_list` | `viewItemList(productos)` | `TiendaCliente.js` (catálogo y filtros) | `item_list_id`, `item_list_name`, `items[]` |
| `select_item` | `selectItem(producto)` | `ProductCard.js` (clic en tarjeta) | `item_id`, `item_name`, `price`, `item_category` |
| `view_item` | `viewItem(producto)` | `app/producto/[slug]/page.js` | `currency: 'PYG'`, `value`, `items[]` |
| `add_to_cart` | `addToCart(producto, cantidad)` | `ProductCard.js`, `ProductoCliente.js` | `currency: 'PYG'`, `value`, `items[]` |
| `remove_from_cart` | `removeFromCart(producto)` | `CartSidebar.js` (al reducir/eliminar) | `currency: 'PYG'`, `value`, `items[]` |
| `begin_checkout` | `beginCheckout(items, total)` | `app/checkout/page.js` (al montar checkout) | `currency: 'PYG'`, `value`, `coupon`, `items[]` |
| `purchase` | `purchase(pedido)` | `app/checkout/page.js` (orden confirmada) | `transaction_id`, `value`, `shipping`, `items[]` |

---

## 🔒 4. Modo de Consentimiento (Consent Mode)

El sistema valida el consentimiento del usuario antes de emitir eventos:

```javascript
// Clave en almacenamiento local
const CONSENT_KEY = 'panfree_ga_consent'

// Estado:
localStorage.setItem('panfree_ga_consent', 'granted') // ✅ Tracking activo
localStorage.setItem('panfree_ga_consent', 'denied')  // ❌ Tracking deshabilitado
```

Cuando el estado es `denied`, las llamadas a `gtag()` se abortan silenciosamente sin afectar la experiencia de compra.

---

## 🔑 5. Variables de Entorno

```env
# Client-Side Measurement ID
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-QE8GQS3MSR

# Server-Side Measurement Protocol
GA4_API_SECRET=tu_api_secret_ga4
GA_PROPERTY_ID=tu_property_id
```
