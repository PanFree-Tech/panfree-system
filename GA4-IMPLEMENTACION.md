# Google Analytics 4 - Implementación en Panfree System

**Fecha:** 2026-08-18
**ID de Medición:** `G-QE8GQS3MSR`
**Estado:** ✅ Implementado y funcionando en producción

---

## 📋 Resumen

Google Analytics 4 ha sido implementado en Panfree System para rastrear el comportamiento de los usuarios y los eventos de comercio electrónico.

---

## 📁 Archivos de Implementación

### 1. `src/hooks/useAnalytics.js`

**Ubicación:** `src/hooks/useAnalytics.js`

**Descripción:** Hook personalizado con todos los eventos de GA4.

#### Funciones Exportadas

| Función | Evento GA4 | Descripción |
|---------|------------|-------------|
| `pageview(url)` | `page_view` | Registra vista de página |
| `viewItem(producto)` | `view_item` | Vista de producto individual |
| `viewItemList(productos)` | `view_item_list` | Vista de catálogo |
| `selectItem(producto)` | `select_item` | Clic en producto desde lista |
| `addToCart(producto)` | `add_to_cart` | Agregar al carrito |
| `removeFromCart(producto)` | `remove_from_cart` | Eliminar del carrito |
| `beginCheckout(items)` | `begin_checkout` | Inicio de checkout |
| `purchase(pedido)` | `purchase` | Compra completada |

#### Sistema de Consentimiento

```javascript
// Clave en localStorage
const CONSENT_KEY = 'panfree_ga_consent'

// Valores posibles
'granted'  // ✅ Activado
'denied'   // ❌ Desactivado