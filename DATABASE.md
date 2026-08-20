# Base de Datos (Supabase) — Panfree System

**Última revisión:** 2026-08-18

**⚠️ ATENCIÓN:** Esta documentación combina columnas inferidas desde el código con recomendaciones. Donde la definición real no está disponible, marco **"Pendiente de revisar en Supabase"**.

---

## Tablas

### clientes

| Columna | Tipo | Nulabilidad | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | `uuid` | **NO** | `gen_random_uuid()` | PK |
| `nombre_completo` | `text` | **NO** | - | Nombre del cliente |
| `email` | `text` | **NO** | - | Email (único) |
| `telefono` | `text` | SÍ | - | Teléfono |
| `direccion_calle` | `text` | SÍ | - | Calle |
| `direccion_numero` | `text` | SÍ | - | Número |
| `direccion_ciudad` | `text` | SÍ | `'Encarnación'` | Ciudad por defecto |
| `direccion_provincia` | `text` | SÍ | `'Itapúa'` | Provincia por defecto |
| `user_id` | `uuid` | SÍ | - | FK → `auth.users.id` |
| `is_active` | `boolean` | **NO** | `true` | Cliente activo |
| `created_at` | `timestamptz` | **NO** | `now()` | Registro creado |
| `updated_at` | `timestamptz` | SÍ | `now()` | Última modificación |

**Nota:** El código en checkout hace `select/update/insert` sobre esta tabla.

---

### pedidos

| Columna | Tipo | Nulabilidad | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | `uuid` | **NO** | `gen_random_uuid()` | PK |
| `numero_pedido` | `text` | **NO** | - | Formato `PF-YYYY-XXXX` (generado) |
| `cliente_id` | `uuid` | **NO** | - | FK → `clientes.id` |
| `estado` | `text` | **NO** | `'pendiente'` | `pendiente`, `confirmado`, `en_produccion`, `listo`, `entregado`, `cancelado` |
| `metodo_entrega` | `text` | **NO** | `'retiro'` | `'delivery'` o `'retiro'` |
| `entrega_direccion` | `text` | SÍ | - | Dirección completa |
| `entrega_costo` | `numeric` | **NO** | `0` | Costo de envío |
| `entrega_distancia_km` | `numeric` | SÍ | - | Distancia en km |
| `entrega_lat` | `numeric` | SÍ | - | Latitud |
| `entrega_lng` | `numeric` | SÍ | - | Longitud |
| `subtotal` | `numeric` | **NO** | `0` | Subtotal del pedido |
| `total_final` | `numeric` | **NO** | `0` | Total final |
| `estado_pago` | `text` | **NO** | `'pendiente'` | `pendiente`, `confirmado`, `rechazado` |
| `metodo_pago` | `text` | **NO** | `'efectivo'` | `'efectivo'` o `'transferencia'` |
| `creado_por` | `uuid` | SÍ | `null` | `user_id` del admin o cliente |
| `created_at` | `timestamptz` | **NO** | `now()` | Fecha de creación |
| `updated_at` | `timestamptz` | SÍ | `now()` | Última modificación |

**Observación:** Checkout inserta con `estado='pendiente'` y `estado_pago='pendiente'`.

---

### detalle_pedido

| Columna | Tipo | Nulabilidad | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | `uuid` | **NO** | `gen_random_uuid()` | PK |
| `pedido_id` | `uuid` | **NO** | - | FK → `pedidos.id` |
| `producto_id` | `uuid` | **NO** | - | FK → `productos.id` |
| `cantidad` | `integer` | **NO** | `1` | Cantidad |
| `precio_unitario` | `numeric` | **NO** | `0` | Precio unitario |

---

### productos

| Columna | Tipo | Nulabilidad | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | `uuid` | **NO** | `gen_random_uuid()` | PK |
| `slug` | `text` | **NO** | - | URL amigable |
| `nombre` | `text` | **NO** | - | Nombre del producto |
| `descripcion` | `text` | SÍ | - | Descripción |
| `precio_venta` | `numeric` | **NO** | `0` | Precio de venta |
| `is_active` | `boolean` | **NO** | `true` | Producto activo |
| `is_featured` | `boolean` | **NO** | `false` | Producto destacado |
| `imagen_url` | `text` | SÍ | - | URL de imagen |
| `categoria` | `text` | SÍ | - | Categoría |
| `unidad_medida` | `text` | SÍ | - | Unidad de medida |
| `stock` | `integer` | SÍ | `null` | Stock físico (si se maneja) |
| `created_at` | `timestamptz` | **NO** | `now()` | Fecha de creación |

---

### vista_disponibilidad_productos (VIEW)

**Columnas:**
- `producto_id` (uuid)
- `disponible` (boolean)
- `tandas_posibles` (integer)
- `ingredientes_faltantes` (text[] o json)
- `requiere_anticipacion` (boolean)

**Definición:** Pendiente de revisar en Supabase.

**SQL Sugerido:**
```sql
CREATE VIEW vista_disponibilidad_productos AS
SELECT 
  p.id AS producto_id,
  (p.stock IS NULL OR p.stock > 0) AS disponible,
  CASE WHEN p.stock IS NULL THEN 0 ELSE FLOOR(p.stock / p.rendimiento) END AS tandas_posibles,
  ARRAY[]::text[] AS ingredientes_faltantes,
  false AS requiere_anticipacion
FROM productos p;

Relaciones (Foreign Keys)
Relación	Tabla Origen	Tabla Destino
pedidos.cliente_id → clientes.id	pedidos	clientes
detalle_pedido.pedido_id → pedidos.id	detalle_pedido	pedidos
detalle_pedido.producto_id → productos.id	detalle_pedido	productos
clientes.user_id → auth.users.id	clientes	auth.users
Diagrama ER (ASCII)
text
┌─────────────┐         ┌─────────────┐         ┌──────────────────┐
│  clientes   │─────────│   pedidos   │─────────│  detalle_pedido  │
│─────────────│   1:N    │─────────────│   1:N    │──────────────────│
│ id (PK)     │         │ id (PK)     │         │ id (PK)          │
│ nombre      │         │ numero      │         │ pedido_id (FK)   │
│ email       │         │ cliente_id  │         │ producto_id (FK) │
│ telefono    │         │ estado      │         │ cantidad         │
│ user_id     │         │ metodo      │         │ precio_unitario  │
│ ...         │         │ ...         │         │ ...              │
└─────────────┘         └─────────────┘         └──────────────────┘
                              │                           │
                              │                           │
                              ▼                           ▼
                         ┌────────────────────────────────────┐
                         │            productos              │
                         │────────────────────────────────────│
                         │ id (PK)                           │
                         │ slug                             │
                         │ nombre                           │
                         │ precio_venta                     │
                         │ is_active                        │
                         │ ...                              │
                         └────────────────────────────────────┘
Triggers y Funciones (Sugeridas)
generar_numero_pedido()
Descripción: Asigna numero_pedido en formato PF-YYYY-XXXX incremental por año.

sql
CREATE FUNCTION generar_numero_pedido() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  seq int;
  year text := to_char(NEW.created_at, 'YYYY');
BEGIN
  SELECT nextval('seq_numero_pedido') INTO seq;
  NEW.numero_pedido := format('PF-%s-%04s', year, seq);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generar_numero_pedido
BEFORE INSERT ON pedidos
FOR EACH ROW
EXECUTE FUNCTION generar_numero_pedido();
crear_notificacion_pedido()
Descripción: Crea registro en notificaciones_admin al insertar pedido.

sql
CREATE FUNCTION crear_notificacion_pedido() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO notificaciones_admin(pedido_id, mensaje, created_at)
  VALUES (NEW.id, 'Nuevo pedido ' || NEW.numero_pedido, now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notificar_nuevo_pedido
AFTER INSERT ON pedidos
FOR EACH ROW
EXECUTE FUNCTION crear_notificacion_pedido();
### Políticas RLS (Recomendadas)
Roles: `anon`, `authenticated`, `admin` (en `raw_user_meta_data.role` o `user_metadata.role`)

#### Función Helper
```sql
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin' OR
    coalesce(auth.jwt() -> 'raw_user_meta_data' ->> 'role', '') = 'admin' OR
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### productos
```sql
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_publico_productos" ON productos
FOR SELECT USING (true);

CREATE POLICY "admin_all_productos" ON productos
FOR ALL TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin());
```

#### clientes
```sql
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_insert_publico" ON clientes
FOR INSERT WITH CHECK (true);

CREATE POLICY "clientes_select_own_or_admin" ON clientes
FOR SELECT USING (auth.is_admin() OR user_id = auth.uid());

CREATE POLICY "clientes_update_own_or_admin" ON clientes
FOR UPDATE USING (auth.is_admin() OR user_id = auth.uid())
WITH CHECK (auth.is_admin() OR user_id = auth.uid());
```

#### pedidos
```sql
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedidos_insert_web" ON pedidos
FOR INSERT WITH CHECK (true);

CREATE POLICY "pedidos_admin_all" ON pedidos
FOR ALL TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin());

CREATE POLICY "pedidos_select_own" ON pedidos
FOR SELECT USING (
  cliente_id IN (SELECT id FROM clientes WHERE user_id = auth.uid())
);
```

#### detalle_pedido
```sql
ALTER TABLE detalle_pedido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "detalle_pedido_insert_web" ON detalle_pedido
FOR INSERT WITH CHECK (true);

CREATE POLICY "detalle_pedido_admin_all" ON detalle_pedido
FOR ALL TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin());
```

---

## Módulo de Marketing Inteligente

### reglas_promocion

| Columna | Tipo | Nulabilidad | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | `uuid` | **NO** | `gen_random_uuid()` | PK |
| `nombre` | `text` | **NO** | - | Nombre identificador de la regla |
| `descripcion` | `text` | SÍ | - | Detalle o propósito de la regla |
| `condicion` | `jsonb` | **NO** | `'{}'` | Criterios de activación (tipo, stock, evento, etc.) |
| `tipo_costo` | `text` | SÍ | `'competitivo'` | `competitivo`, `objetivo`, `premium` |
| `descuento_min` | `integer` | **NO** | `5` | Porcentaje mínimo de descuento |
| `descuento_max` | `integer` | **NO** | `20` | Porcentaje máximo de descuento |
| `prioridad` | `integer` | **NO** | `1` | Nivel de precedencia ante múltiples reglas |
| `activo` | `boolean` | **NO** | `true` | Estado de la regla |
| `created_at` | `timestamptz` | **NO** | `now()` | Fecha de creación |
| `updated_at` | `timestamptz` | **NO** | `now()` | Última actualización |

### eventos_calendario

| Columna | Tipo | Nulabilidad | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | `uuid` | **NO** | `gen_random_uuid()` | PK |
| `nombre` | `text` | **NO** | - | Nombre de la festividad o evento |
| `fecha_inicio` | `date` | **NO** | - | Fecha de inicio del evento |
| `fecha_fin` | `date` | **NO** | - | Fecha de finalización |
| `categoria` | `text` | SÍ | `'festividad'` | Categoría (`festividad`, `salud`, `familiar`, etc.) |
| `productos_relacionados` | `text[]` | SÍ | `'{}'` | Lista de nombres o categorías de productos |
| `activo` | `boolean` | **NO** | `true` | Evento habilitado |
| `created_at` | `timestamptz` | **NO** | `now()` | Fecha de registro |

### promociones_historico

| Columna | Tipo | Nulabilidad | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | `uuid` | **NO** | `gen_random_uuid()` | PK |
| `producto_id` | `uuid` | SÍ | `null` | FK → `productos.id` |
| `regla_id` | `uuid` | SÍ | `null` | FK → `reglas_promocion.id` |
| `descuento_aplicado` | `integer` | **NO** | `0` | Porcentaje de descuento aplicado |
| `precio_final` | `numeric` | **NO** | `0` | Precio en Guaraníes con descuento |
| `captions_generados` | `jsonb` | SÍ | `'{}'` | Objeto con hook, caption, hashtags y CTA |
| `imagen_url` | `text` | SÍ | - | URL pública o referencia de la creatividad |
| `post_id` | `text` | SÍ | - | ID retornado por Instagram Graph API |
| `publicada` | `boolean` | **NO** | `false` | Indica si fue publicada o solo programada |
| `fecha_programada` | `timestamptz` | SÍ | - | Fecha y hora de programación |
| `fecha_publicacion` | `timestamptz` | SÍ | - | Fecha y hora efectiva de publicación |
| `engagement` | `integer` | **NO** | `0` | Métrica de interacciones / clics |
| `created_at` | `timestamptz` | **NO** | `now()` | Registro de la promoción |

### instagram_posts

| Columna | Tipo | Nulabilidad | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | `uuid` | **NO** | `gen_random_uuid()` | PK |
| `product_id` | `uuid` | SÍ | `null` | FK → `productos.id` |
| `product_name` | `text` | **NO** | - | Nombre del producto |
| `caption` | `text` | **NO** | - | Copy publicado en Instagram |
| `post_id` | `text` | SÍ | - | ID del post en Instagram |
| `post_url` | `text` | SÍ | - | Enlace directo a la publicación |
| `format` | `text` | SÍ | `'feed_4_5'` | Formato visual empleado |
| `status` | `text` | SÍ | `'publicado'` | Estado del post |
| `created_at` | `timestamptz` | **NO** | `now()` | Fecha y hora |

---

Pendiente de Revisar en Supabase
✅ Exportar schema completo (pg_dump)

✅ Listar RLS policies reales

✅ Revisar triggers existentes

✅ Confirmar tablas auxiliares (notificaciones_admin, zonas delivery)
