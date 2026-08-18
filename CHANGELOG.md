# Changelog - Panfree System

Todos los cambios notables serán documentados aquí.

---

## [2026-08-18] - Google Analytics 4

### Añadido
- **GA4 Implementation**: Google Analytics 4 completo
  - `src/hooks/useAnalytics.js`: Hook con eventos de e-commerce
  - `src/components/GAScript.jsx`: Carga de gtag.js con next/script
  - Sistema de consentimiento con localStorage
  - Eventos: view_item, view_item_list, select_item, add_to_cart, remove_from_cart, begin_checkout, purchase
  - Tracking de páginas en SPA

### Modificado
- `src/app/layout-client.js`: Integración de GA4
- `src/components/ProductCard.js`: view_item y add_to_cart
- `src/components/CartSidebar.js`: remove_from_cart
- `src/app/TiendaCliente.js`: view_item_list y select_item
- `src/app/checkout/page.js`: begin_checkout y purchase

### Configuración
- ID de medición: `G-QE8GQS3MSR`
- Variable: `NEXT_PUBLIC_GA_MEASUREMENT_ID`

---

## [2026-08-18] - Correcciones del Checkout

### Corregido
- Carrito persistente entre páginas
- Duplicación de cantidades en carrito
- Validación de teléfono simplificada
- Navegación SPA con router.push()

### Modificado
- `src/context/CartContext.js`: Bandera 'cargado'
- `src/components/CartSidebar.js`: router.push()
- `src/app/checkout/page.js`: Validación de teléfono

---

## [2026-08-18] - Íconos

### Cambiado
- Wheat → Croissant (Panes)
- Wheat → ChefHat (Artesanal)

### Modificado
- `src/app/TiendaCliente.js`: Íconos actualizados
- `src/app/pedido/[numero]/page.js`: Íconos actualizados