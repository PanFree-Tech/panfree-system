# 🗄️ PanFree System — Esquema de Base de Datos (Supabase / PostgreSQL)

**Motor:** PostgreSQL 15 (Supabase)  
**Versión del Esquema:** 2.0.0  
**Última actualización:** 2026-08-28  

---

## 📑 Diagrama Entidad-Relación (ERD) Conceptual

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   proveedores   │◄──────│     insumos     │◄──────│ recetas_lineas  │
└─────────────────┘  1:N  └────────┬────────┘  1:N  └────────┬────────┘
                                   │                         │ N:1
                                   │ 1:N                     ▼
                                   │                ┌─────────────────┐
                                   ▼                │    productos    │◄─────┐
                          ┌─────────────────┐       └────────┬────────┘      │
                          │ detalle_compra  │                │ 1:N           │ 1:N
                          └────────┬────────┘                ▼               │
                                   │ N:1            ┌─────────────────┐      │
                                   ▼                │ detalle_pedido  │      │
                          ┌─────────────────┐       └────────┬────────┘      │
                          │     compras     │                │ N:1           │
                          └─────────────────┘                ▼               │
                                                    ┌─────────────────┐      │
                                                    │     pedidos     │      │
                                                    └────────┬────────┘      │
                                                             │ N:1           │
                                                             ▼               │
                                                    ┌─────────────────┐      │
                                                    │    clientes     │      │
                                                    └────────┬────────┘      │
                                                             │ 1:N           │
                                   ┌─────────────────────────┴─────────┐     │
                                   ▼                                   ▼     │
                          ┌─────────────────┐                 ┌────────┴─────┴──┐
                          │ canjes_dipticos │                 │   produccion    │
                          └────────┬────────┘                 └─────────────────┘
                                   │ N:1
                                   ▼
                          ┌─────────────────┐
                          │ codigos_dipticos│
                          └─────────────────┘
```

---

## 1. Módulo Comercial & E-commerce

### 1.1. `productos`
Almacena el catálogo de panificados y dulces artesanales sin gluten, con soporte para promociones, costos y capacidad Made-To-Order.

| Columna | Tipo | Nulable | Por Defecto | Descripción |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Clave primaria |
| `slug` | `text` | NO | - | Identificador único en URL amigable |
| `nombre` | `text` | NO | - | Nombre comercial del producto |
| `descripcion` | `text` | SÍ | - | Descripción detallada e ingredientes |
| `precio_venta` | `numeric(12,2)` | NO | `0` | Precio de venta al público en PYG (₲) |
| `categoria` | `text` | SÍ | `'panes'` | Categoría (`panes`, `dulces`, `salados`, `congelados`) |
| `unidad_medida` | `text` | SÍ | `'unidad'` | Unidad de venta (`unidad`, `kg`, `pack`) |
| `imagen_url` | `text` | SÍ | - | URL pública de la imagen en Cloudinary |
| `is_active` | `boolean` | NO | `true` | Habilitado para la venta |
| `is_featured` | `boolean` | NO | `false` | Destacado en la portada de la tienda |
| `stock` | `integer` | SÍ | `null` | Stock físico disponible |
| `production_capacity` | `integer` | NO | `10` | Capacidad máxima de producción diaria |
| `current_orders` | `integer` | NO | `0` | Órdenes activas recibidas en el día |
| `lead_time` | `integer` | NO | `24` | Tiempo estimado de elaboración en horas |
| `order_available` | `boolean` | NO | `true` | Disponibilidad para recibir nuevos pedidos |
| `availability_status` | `text` | NO | `'DISPONIBLE'` | Estado (`DISPONIBLE`, `CAPACIDAD LIMITADA`, `CERRADO`) |
| `en_promocion` | `boolean` | NO | `false` | Indica si el producto tiene oferta activa |
| `precio_promocion` | `numeric(12,2)` | SÍ | `null` | Precio con descuento en PYG (₲) |
| `fecha_inicio_promo` | `timestamptz` | SÍ | `null` | Inicio de vigencia de la oferta |
| `fecha_fin_promo` | `timestamptz` | SÍ | `null` | Fin de vigencia de la oferta |
| `rendimiento_kg` | `numeric(10,3)` | SÍ | `1` | Rendimiento en peso de la tanda |
| `peso_promedio_unidad`| `numeric(10,3)` | SÍ | `null` | Peso promedio por unidad (kg) |
| `tiempo_prep_min` | `integer` | SÍ | `0` | Tiempo de preparación (minutos) |
| `tiempo_coccion_min` | `integer` | SÍ | `0` | Tiempo de horneado (minutos) |
| `tiempo_reposo_min` | `integer` | SÍ | `0` | Tiempo de fermentación/enfriado |
| `temperatura_horno_c` | `integer` | SÍ | `null` | Temperatura del horno en °C |
| `notas_produccion` | `text` | SÍ | - | Instrucciones técnicas para operarios |
| `dificultad` | `text` | SÍ | `'media'` | Complejidad de elaboración |
| `created_at` | `timestamptz` | NO | `now()` | Fecha de creación del registro |

---

### 1.2. `clientes`
Registro de compradores y clientes registrados en el programa de fidelización.

| Columna | Tipo | Nulable | Por Defecto | Descripción |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Clave primaria |
| `user_id` | `uuid` | SÍ | `null` | FK a `auth.users.id` si está registrado |
| `nombre_completo` | `text` | NO | - | Nombre y apellido del cliente |
| `email` | `text` | NO | - | Correo electrónico de contacto |
| `telefono` | `text` | SÍ | - | Teléfono / WhatsApp |
| `direccion_calle` | `text` | SÍ | - | Dirección de entrega (calle principal) |
| `direccion_numero` | `text` | SÍ | - | Número de casa o departamento |
| `direccion_ciudad` | `text` | SÍ | `'Encarnación'` | Ciudad |
| `direccion_provincia`| `text` | SÍ | `'Itapúa'` | Departamento / Provincia |
| `puntos_fidelidad` | `integer` | NO | `0` | Balance actual de puntos acumulados |
| `nivel_cliente` | `text` | NO | `'bronce'` | Nivel (`bronce`, `plata`, `oro`, `vip`) |
| `role` | `text` | NO | `'cliente'` | Rol en la aplicación |
| `avatar_url` | `text` | SÍ | - | URL de avatar en Cloudinary |
| `is_active` | `boolean` | NO | `true` | Estado activo |
| `created_at` | `timestamptz` | NO | `now()` | Fecha de registro |
| `updated_at` | `timestamptz` | SÍ | `now()` | Última actualización |

---

### 1.3. `pedidos`
Órdenes de compra generadas desde la tienda online o cargadas manualmente por administración.

| Columna | Tipo | Nulable | Por Defecto | Descripción |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Clave primaria |
| `numero_pedido` | `text` | NO | - | Identificador único (Ej: `PF-2026-0042`) |
| `cliente_id` | `uuid` | NO | - | FK a `clientes.id` |
| `estado` | `text` | NO | `'pendiente'` | `pendiente`, `confirmado`, `en_produccion`, `listo`, `entregado`, `cancelado` |
| `metodo_entrega` | `text` | NO | `'retiro'` | `'retiro'` o `'delivery'` |
| `entrega_direccion` | `text` | SÍ | - | Dirección completa de destino |
| `entrega_costo` | `numeric(12,2)`| NO | `0` | Tarifa de envío en PYG (₲) |
| `entrega_distancia_km`| `numeric(8,2)`| SÍ | - | Distancia calculada en kilómetros |
| `entrega_lat` | `numeric(10,6)`| SÍ | - | Latitud geográfica de destino |
| `entrega_lng` | `numeric(10,6)`| SÍ | - | Longitud geográfica de destino |
| `subtotal` | `numeric(12,2)`| NO | `0` | Subtotal de productos en PYG (₲) |
| `descuento_monto` | `numeric(12,2)`| NO | `0` | Descuento total aplicado |
| `cupon_codigo` | `text` | SÍ | - | Código de cupón utilizado |
| `puntos_ganados` | `integer` | NO | `0` | Puntos otorgados por esta compra |
| `puntos_usados` | `integer` | NO | `0` | Puntos canjeados en esta compra |
| `total_final` | `numeric(12,2)`| NO | `0` | Total a pagar en PYG (₲) |
| `metodo_pago` | `text` | NO | `'efectivo'` | `'efectivo'` o `'transferencia'` |
| `estado_pago` | `text` | NO | `'pendiente'` | `pendiente`, `confirmado`, `rechazado` |
| `creado_por` | `uuid` | SÍ | `null` | ID del usuario creador |
| `created_at` | `timestamptz` | NO | `now()` | Fecha de creación de la orden |
| `updated_at` | `timestamptz` | SÍ | `now()` | Última actualización de estado |

---

### 1.4. `detalle_pedido`
Líneas de productos que integran cada pedido.

| Columna | Tipo | Nulable | Por Defecto | Descripción |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Clave primaria |
| `pedido_id` | `uuid` | NO | - | FK a `pedidos.id` (ON DELETE CASCADE) |
| `producto_id` | `uuid` | NO | - | FK a `productos.id` |
| `cantidad` | `integer` | NO | `1` | Cantidad de unidades |
| `precio_unitario` | `numeric(12,2)`| NO | `0` | Precio unitario congelado en la venta |

---

## 2. Módulo de Inventario, Insumos & Proveedores

### 2.1. `proveedores`
Directorio de proveedores de materias primas sin gluten certificadas.

| Columna | Tipo | Nulable | Por Defecto | Descripción |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Clave primaria |
| `nombre_empresa` | `text` | NO | - | Razón social o nombre comercial |
| `contacto_nombre` | `text` | SÍ | - | Nombre de la persona de contacto |
| `telefono` | `text` | SÍ | - | Teléfono de ventas |
| `email` | `text` | SÍ | - | Correo de pedidos |
| `ruc` | `text` | SÍ | - | Registro Único del Contribuyente |
| `direccion` | `text` | SÍ | - | Dirección física o ciudad |
| `condiciones_pago`| `text` | SÍ | `'contado'` | Contado, 30 días, etc. |
| `is_active` | `boolean` | NO | `true` | Proveedor activo |
| `created_at` | `timestamptz` | NO | `now()` | Fecha de registro |

---

### 2.2. `insumos`
Maestro de materias primas (harinas sin gluten, féculas, levaduras, endulzantes, etc.).

| Columna | Tipo | Nulable | Por Defecto | Descripción |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Clave primaria |
| `nombre` | `text` | NO | - | Nombre del insumo (Ej: Fécula de Mandioca) |
| `categoria` | `text` | NO | `'harinas'` | `harinas`, `féculas`, `levaduras`, `grasas`, `endulzantes`, `aditivos`, `envases` |
| `unidad_medida` | `text` | NO | `'kg'` | `kg`, `g`, `lt`, `ml`, `unidad` |
| `stock_actual` | `numeric(12,3)`| NO | `0` | Existencia física actual en depósito |
| `stock_minimo` | `numeric(12,3)`| NO | `1` | Nivel mínimo de alerta de reposición |
| `stock_maximo` | `numeric(12,3)`| SÍ | `null` | Capacidad máxima de almacenamiento |
| `precio_compra_actual`| `numeric(12,2)`| NO | `0` | Precio de la última compra |
| `ppp_actual` | `numeric(12,2)`| NO | `0` | Precio Promedio Ponderado contable |
| `factor_conversion`| `numeric(8,4)` | NO | `1` | Factor de ajuste de unidad |
| `proveedor_id` | `uuid` | SÍ | `null` | FK a `proveedores.id` |
| `requiere_control_lote`| `boolean` | NO | `false` | Exige número de lote por vencimiento |
| `is_active` | `boolean` | NO | `true` | Insumo activo |
| `created_at` | `timestamptz` | NO | `now()` | Fecha de registro |
| `updated_at` | `timestamptz` | SÍ | `now()` | Última actualización |

---

### 2.3. `compras` & `detalle_compra`
Registro de órdenes de compra a proveedores.

**Tabla `compras`:**
- `id` (UUID, PK)
- `numero_compra` (TEXT, Ej: `COMP-20260828-102`)
- `proveedor_id` (UUID, FK a `proveedores.id`)
- `total` (NUMERIC)
- `descuento` (NUMERIC)
- `estado` (`pendiente`, `confirmada`, `recepcionada`, `cancelada`)
- `estado_pago` (`pendiente`, `parcial`, `pagado`)
- `metodo_pago` (TEXT)
- `fecha_compra` (TIMESTAMPTZ)
- `fecha_recepcion` (TIMESTAMPTZ)

**Tabla `detalle_compra`:**
- `id` (UUID, PK)
- `compra_id` (UUID, FK a `compras.id`)
- `insumo_id` (UUID, FK a `insumos.id`)
- `cantidad` (NUMERIC)
- `precio_unitario` (NUMERIC)
- `subtotal` (NUMERIC)

---

## 3. Módulo de Recetas, Producción y Maquinarias

### 3.1. `recetas_lineas`
Composición técnica de ingredientes requeridos por cada producto.

| Columna | Tipo | Nulable | Por Defecto | Descripción |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Clave primaria |
| `producto_id` | `uuid` | NO | - | FK a `productos.id` (ON DELETE CASCADE) |
| `insumo_id` | `uuid` | NO | - | FK a `insumos.id` |
| `cantidad` | `numeric(10,4)`| NO | - | Cantidad requerida para la receta |
| `unidad_medida` | `text` | NO | `'kg'` | Unidad de la receta |
| `es_opcional` | `boolean` | NO | `false` | Ingrediente secundario/opcional |
| `notas` | `text` | SÍ | - | Instrucciones específicas de incorporación |

---

### 3.2. `produccion`
Registro de lotes de horneado y control de mermas.

| Columna | Tipo | Nulable | Por Defecto | Descripción |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Clave primaria |
| `numero_lote` | `text` | NO | - | Identificador de lote (Ej: `PROD-2026-0015`) |
| `producto_id` | `uuid` | NO | - | FK a `productos.id` |
| `cantidad_producida` | `numeric(10,2)`| NO | - | Unidades o KG terminados |
| `unidad_medida` | `text` | NO | `'unidad'` | Unidad de producción |
| `costo_materia_prima`| `numeric(12,2)`| NO | `0` | Costo calculado de insumos consumidos |
| `costo_mano_obra` | `numeric(12,2)`| NO | `0` | Costo laboral asignado |
| `costo_indirectos` | `numeric(12,2)`| NO | `0` | Costo de energía/servicios |
| `merma_porcentaje` | `numeric(5,2)` | NO | `0` | Porcentaje de merma o descarte |
| `merma_observaciones`| `text` | SÍ | - | Motivo de la merma |
| `responsable_nombre` | `text` | SÍ | - | Maestro panadero / Operario a cargo |
| `estado` | `text` | NO | `'en_proceso'` | `en_proceso`, `finalizado`, `mermado`, `cancelado` |
| `fecha_inicio` | `timestamptz` | NO | `now()` | Inicio de tanda |
| `fecha_fin` | `timestamptz` | SÍ | `null` | Finalización de tanda |

---

### 3.3. `maquinarias` & `costos_fijos_mensuales`
Control de equipamiento, consumo eléctrico y estructura contable.

**Tabla `maquinarias`:**
- `id` (UUID, PK)
- `nombre` (TEXT, Ej: Horno Convector Rotativo)
- `tipo_uso` (`activa` [consume solo en horneado] | `permanente` [24/7 heladera/freezer])
- `potencia_kw` (NUMERIC)
- `horas_uso_por_tanda` (NUMERIC)
- `tandas_por_mes` (NUMERIC)
- `precio_kwh` (NUMERIC, Tarifa eléctrica ANDE en PYG)
- `is_active` (BOOLEAN)

**Tabla `costos_fijos_mensuales`:**
- `id` (UUID, PK)
- `periodo` (DATE, Ej: `2026-08-01`)
- `alquiler` (NUMERIC)
- `salarios` (NUMERIC)
- `electricidad` (NUMERIC)
- `agua_internet` (NUMERIC)
- `mantenimiento` (NUMERIC)
- `marketing` (NUMERIC)
- `otros` (NUMERIC)
- `total_costos_fijos` (NUMERIC, Suma calculada)

---

## 4. Módulo de Gamificación, Fidelización & Dípticos

- **`codigos_dipticos`:** Lotes de códigos alfanuméricos de 6 caracteres impresos en folletos (`codigo`, `lote_id`, `canjeado`, `canjeado_por`, `canjeado_en`).
- **`canjes_dipticos`:** Registro de puntos otorgados al escanear QR (`codigo_id`, `cliente_id`, `puntos_ganados`).
- **`premios`:** Catálogo de recompensas canjeables (`nombre`, `costo_puntos`, `tipo`, `valor`, `activo`).
- **`canjes_premios`:** Registro de recompensas reclamadas por clientes (`premio_id`, `cliente_id`, `cupon_generado`).
- **`cupones_descuento`:** Códigos de promoción online (`codigo`, `tipo_descuento`, `valor_descuento`, `monto_minimo_compra`, `activo`).
- **`cupones_canjeados`:** Auditoría de cupones usados en checkout (`cupon_id`, `cliente_id`, `pedido_id`).

---

## 5. Módulo de Marketing Inteligente & Auditoría

- **`reglas_promocion`:** Políticas comerciales automáticas (`condicion` en JSONB, `descuento_min`, `descuento_max`, `prioridad`).
- **`eventos_calendario`:** Fechas clave de Encarnación y gastronomía celíaca (`nombre`, `fecha_inicio`, `fecha_fin`, `productos_relacionados`).
- **`promociones_historico`:** Registro de promociones generadas por IA (`producto_id`, `regla_id`, `captions_generados`, `estado`).
- **`instagram_posts`:** Trazabilidad de publicaciones en Meta Graph API (`post_id`, `caption`, `image_url`, `status`).
- **`email_logs`:** Registro auditado de correos enviados vía Resend (`to_email`, `subject`, `status`, `resend_id`, `error_message`).
- **`logs_auditoria`:** Registro de eventos de seguridad y cambios administrativos (`accion`, `detalle`, `usuario_id`, `ip`).
- **`configuracion_sitio`:** Identidad de marca (`nombre_tienda`, `logo_url`, `logo_rosa_url`, `logo_variantes` en JSONB, `banner_titulo`).
- **`usuarios`:** Personal administrativo (`email`, `nombre`, `rol`: `admin`, `operador`, `repartidor`, `marketing`).

---

## 6. Vistas SQL Principales

1. **`vista_costo_receta`:** Agrupa los ingredientes por producto, suma el costo total de materias primas basado en el PPP actual, calcula el costo por KG y genera los precios sugeridos para márgenes del 20%, 40% y 60%.
2. **`vista_energia_mensual`:** Calcula el costo mensual acumulado de energía eléctrica de todas las maquinarias activas y permanentes.
3. **`vista_disponibilidad_productos`:** Evalúa si cada producto tiene stock o capacidad de producción suficiente según las órdenes activas en el modelo Made-To-Order.
4. **`vista_resumen_produccion`:** Totaliza lotes del mes, cantidades producidas y costos acumulados de producción.
