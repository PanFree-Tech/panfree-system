# Modelo de Negocio: Made-To-Order Puro

**Fecha:** 2026-10-19 (S29)
**Estado:** Definido

## 1. Contexto

PanFree no maneja stock físico. Todos los productos se producen bajo pedido con 24h de anticipación.
El negocio está en crecimiento y los productos son artesanales (sin gluten), por lo que no tiene sentido tener stock.

**Consecuencia:** el catálogo NO debe bloquear productos por falta de stock.
Todos los productos activos se pueden comprar (con 24h de anticipación).

## 2. Reglas de negocio

1. **No hay stock físico.** `productos.stock_actual` es informativo (para el admin, no para el cliente).
2. **El catálogo muestra "Pedido con 24h" siempre** (excepto si `is_active = false`).
3. **El checkout NO valida stock.** No bloquea la compra.
4. **El pago es efectivo o transferencia** (ambos).
5. **`production_capacity` y `current_orders`** son informativas (para el admin).

## 3. Flujo de compra (real, post-S29)

Cliente → carrito → checkout → `POST /api/checkout/crear-pedido` (service_role) → pedido creado (trigger `pedidos_numero_automatico` genera `PF-YYYY-XXXX`) → pantalla de éxito.

## 4. Qué NO hace el sistema

- No bloquea la compra por stock.
- No descuenta stock al confirmar.
- No muestra "Sin stock" en el catálogo.

## 5. Deuda técnica pendiente (S30+)

- Trigger `on_pedido_confirmado` → `actualizar_stock_pedido()`: revisar si existe. Si solo descuenta stock, quitarlo.
- `stock_actual`: dejar como informativa (no borrar).
- `current_orders`: si no se usa, evaluar eliminar.
- Vista `vista_disponibilidad_productos`: ya arreglada en S29 (migración `2026-10-19-s29-fix-vista-disponibilidad.sql`).

## 7. Trigger de stock (eliminado en S30)

El trigger `on_pedido_confirmado` -> `actualizar_stock_pedido()` fue eliminado en S30.
Descontaba stock al confirmar/entregar pedidos, lo cual:
- Bloqueaba pedidos si no habia stock fisico (contradice Made-To-Order).
- Causaba doble descuento al cambiar de 'confirmado' a 'entregado'.

En S30 se elimino el trigger y la funcion. La tabla `stock_movimientos` se mantiene (por si el admin la consulta), pero no se insertan filas nuevas desde pedidos.

---
## 6. Referencias

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
- [API.md](./API.md)
- [Migración S29](../../../supabase/migrations/2026-10-19-s29-fix-vista-disponibilidad.sql)