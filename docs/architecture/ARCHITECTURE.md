# 🏛️ PanFree System — Arquitectura del Sistema

**Versión:** 2.0.0  
**Última revisión:** 2026-08-28  
**Tipo de Sistema:** ERP Integral de Producción y Costos + E-commerce B2C para Panadería Sin Gluten  

---

## 1. Visión General del Sistema

PanFree System es una solución de software empresarial híbrida que integra en un único ecosistema:
1. **Tienda Online (Storefront B2C):** Aplicación web progresiva (PWA) optimizada para conversión, catálogo de panificados y dulces sin gluten, cálculo geográfico de delivery, checkout en un paso, seguimiento de pedidos en tiempo real y gamificación mediante códigos QR.
2. **Panel de Gestión ERP (Backoffice):** Sistema administrativo modular que cubre la cadena de valor completa: gestión de proveedores, compras con cálculo automatizado de Precio Promedio Ponderado (PPP), inventario de insumos, fichas técnicas de recetas, control de lotes de producción (Made-To-Order), cálculo de costos energéticos por maquinaria (kWh), análisis de margen real (bruto + costos fijos prorrateados), mercadotecnia automatizada con IA y gestión de usuarios.

---

## 2. Diagrama de Arquitectura General

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER                                         │
│  ┌──────────────────────────────────────────┐  ┌────────────────────────────────────┐  │
│  │       Tienda Online (Clientes B2C)       │  │        Panel ERP (Staff/Admin)     │  │
│  │  - Catálogo & Ficha de Producto          │  │  - Dashboard & Reportes            │  │
│  │  - Carrito Reactivo (CartContext)        │  │  - Pedidos, Clientes & Cupones     │  │
│  │  - Checkout & Cálculo de Delivery        │  │  - Insumos, Compras & Recetas      │  │
│  │  - Tracking de Pedidos en Vivo           │  │  - Producción, Maquinarias & Costos│  │
│  │  - Portal de Puntos & Canje de Dípticos  │  │  - Marketing Inteligente & Canvas  │  │
│  │  - PWA Service Worker & Push             │  │  - Configuración & Branding        │  │
│  └──────────────────────────────────────────┘  └────────────────────────────────────┘  │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │ HTTPS (JSON / FormData / SSE)
┌──────────────────────────────────────────▼─────────────────────────────────────────────┐
│                               NEXT.JS APPLICATION LAYER                                │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Edge Middleware (src/middleware.js): Supabase SSR Auth, RBAC Route Protection   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌──────────────────────────────────────┐    ┌──────────────────────────────────────┐  │
│  │  React Server Components (RSC)       │    │  Next.js Server API Routes (/api/*)  │  │
│  │  - SSR initial data fetching         │    │  - Delivery Calculation Engine       │  │
│  │  - Static metadata & SEO generation  │    │  - Coupon & Diptico Validation       │  │
│  │  - Layouts & Root Providers          │    │  - Notification Dispatcher (WA/Mail) │  │
│  │                                      │    │  - Gemini AI Marketing Decision Engine│ │
│  │                                      │    │  - Webhook Handlers (Resend, n8n)    │  │
│  │                                      │    │  - Analytics & Audit Logger (Service)│  │
│  └──────────────────────────────────────┘    └──────────────────────────────────────┘  │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │                                 │                                 │
┌────────▼──────────────┐       ┌──────────▼───────────┐         ┌───────────▼───────────┐
│   PERSISTENCIA & AUTH │       │    MEDIA STORAGE     │         │ SERVICIOS EXTERNOS    │
│   (Supabase / Postgres)│      │    (Cloudinary CDN)  │         │                       │
│ - PostgreSQL 15 Engine │      │ - Catálogo Productos │         │ - Google Gemini SDK   │
│ - Row Level Security  │       │ - Variantes de Logos │         │ - Resend Email API    │
│ - Triggers & Functions│       │ - Banners & Favicon  │         │ - Meta WhatsApp Cloud │
│ - Views & Calculators │       │ - Avatares Usuarios  │         │ - n8n Webhook Engine  │
│ - Supabase Auth       │       │ - Diseños Canvas     │         │ - Google Analytics 4  │
└───────────────────────┘       └──────────────────────┘         └───────────────────────┘
```

---

## 3. Topología de Módulos y Directorios

```text
src/
├── app/
│   ├── layout.js                     # Root layout del sistema con metadatos globales
│   ├── layout-client.js              # Proveedor cliente (AuthContext, CartContext, GA4, Clarity)
│   ├── page.js                       # Home interactiva de la tienda online
│   ├── TiendaCliente.js              # Vista de catálogo con filtrado por categoría y buscador
│   ├── catalogo/                     # Catálogo extendido de productos
│   ├── producto/[slug]/              # Ficha técnica individual y alérgenos
│   ├── checkout/                     # Checkout interactivo con cotización de delivery
│   ├── pedido/[numero]/              # Tracking en tiempo real del pedido
│   ├── perfil/                       # Historial de compras y fidelización
│   │   └── puntos/                   # Consulta de puntos y canje de premios
│   ├── canjear/                      # Landing pública para canje de códigos QR de dípticos
│   ├── bio/                          # Enlaces rápidos para biografía de Instagram
│   ├── sobre-nosotros/               # Historia y certificaciones celíacas
│   ├── admin/                        # Núcleo del ERP Administrativo
│   │   ├── layout.js                 # Layout con barra de navegación lateral y verificación de rol
│   │   ├── page.js                   # Dashboard ejecutivo con métricas de ventas y pedidos
│   │   ├── pedidos/                  # Gestión operativa de órdenes, estados y envíos
│   │   ├── productos/                # Catálogo maestro, fotos, promociones y Made-To-Order
│   │   ├── clientes/                 # CRM de clientes, nivel de fidelidad (Bronce/Plata/Oro/VIP)
│   │   ├── insumos/                  # Inventario de materia prima y alertas de stock mínimo
│   │   ├── compras/                  # Órdenes de compra a proveedores y actualización de PPP
│   │   ├── proveedores/              # Directorio de proveedores de materias primas
│   │   ├── recetas/                  # Fichas técnicas, ingredientes, rendimientos y mermas
│   │   ├── produccion/               # Lotes de elaboración diaria (PROD-YYYY-NNNN)
│   │   ├── maquinarias/              # Inventario de equipamiento y consumo eléctrico (kWh)
│   │   ├── costos/                   # Análisis financiero: Margen Bruto, Costos Fijos y Margen Real
│   │   ├── marketing/                # Motor de marketing inteligente con IA y diseñador Canvas
│   │   ├── cupones/                  # Administración de cupones de descuento
│   │   ├── dipticos/                 # Control de lotes de dípticos impresos y códigos QR
│   │   ├── correos/                  # Centro de despacho de correos con Resend y plantillas HTML
│   │   ├── reportes/                 # Estadísticas avanzadas, productos top y horas pico
│   │   ├── configuracion/            # Configuración de tienda, logos temáticos y usuarios
│   │   └── ayuda/                    # Manuales y guías operativas integradas
│   └── api/                          # Endpoints REST del backend de Next.js
├── components/                       # Componentes visuales desacoplados
├── context/                          # Context API de React para estado global
├── hooks/                            # Custom hooks (analítica, responsive, estado)
├── lib/                              # Clientes SDK, conectores y utilitarios
└── services/                         # Capas de servicio (notificaciones, web push, recordatorios)
```

---

## 4. Flujos de Trabajo Operativos Clave

### 4.1. Flujo de Compra y Ciclo de Vida del Pedido (E-commerce)

```
[Cliente en Tienda] ──> Agrega productos al Carrito (CartContext)
        │
        ▼
[Checkout /checkout] ──> Ingresa datos + Selecciona Entrega (Retiro / Delivery)
        │
        ├──> Cotiza costo de delivery (/api/calcular-delivery)
        ├──> Valida cupón de descuento si aplica (/api/cupones/validar)
        │
        ▼
[Confirmación de Compra]
        │
        ├──> INSERT en tabla `clientes` (o actualización si existe)
        ├──> INSERT en tabla `pedidos` (estado: 'pendiente', estado_pago: 'pendiente')
        ├──> INSERT en tabla `detalle_pedido` (productos y cantidades)
        ├──> UPDATE `productos` (incrementa `current_orders` para cálculo Made-To-Order)
        ├──> POST /api/notificar-pedido (dispara webhook a n8n y alerta admin)
        ├──> POST /api/send-email (envía comprobante al cliente y alerta a la panadería)
        └──> Abre enlace de WhatsApp con mensaje preformateado hacia la tienda
        │
        ▼
[Seguimiento /pedido/[numero]] ──> Cliente consulta el estado en tiempo real
        │
        ▼
[Admin ERP /admin/pedidos] ──> Actualiza estado: pendiente ➔ confirmado ➔ en_produccion ➔ listo ➔ entregado
        └──> Dispara notificaciones automáticas por WhatsApp / Correo según el estado
```

### 4.2. Flujo de Compras, Inventario y Recálculo del PPP

```
[Admin crea Orden de Compra] ──> Estado: 'pendiente' (registra proveedor e insumos)
        │
        ▼
[Recepción de Mercadería] ──> Admin marca estado: 'recepcionada'
        │
        ├──> 1. Aumenta stock físico: stock_actual = stock_actual + cantidad_comprada
        ├──> 2. Recalcula Precio Promedio Ponderado (PPP):
        │       nuevo_ppp = ((stock_anterior * ppp_anterior) + (cantidad * precio_unitario)) / nuevo_stock
        ├──> 3. Actualiza `precio_compra_actual` del insumo
        └──> 4. Registra evento en `logs_auditoria`
        │
        ▼
[Impacto en Recetas y Costos] ──> Las vistas `vista_costo_receta` y `vista_costo_por_producto`
                                   se recalculan automáticamente reflejando el costo actualizado
```

### 4.3. Flujo de Producción y Control de Mermas

```
[Planificación de Tanda] ──> Admin selecciona receta y cantidad a producir
        │
        ├──> Sistema consulta costo de materia prima desde la ficha de la receta
        ├──> Asigna número de lote correlativo: PROD-YYYY-NNNN
        │
        ▼
[Elaboración en Horno] ──> Estado: 'en_proceso' (registra tiempos y temperaturas)
        │
        ▼
[Cierre de Lote] ──> Estado: 'finalizado' o 'mermado'
        ├──> Registra unidades finales obtenidas y porcentaje de merma
        ├──> Registra responsable de producción y notas técnicas
        └──> Actualiza disponibilidad y stock de producto terminado
```

### 4.4. Flujo del Sistema de Marketing Inteligente (IA + Canvas)

```
[Cron n8n / Solicitud Admin]
        │
        ▼
[Motor de Decisión (/api/admin/marketing/decidir-promocion)]
        ├── Consulta: Eventos del calendario comercial de Paraguay
        ├── Consulta: Disponibilidad y capacidad de productos
        └── Evalúa: Reglas de promoción dinámicas activas
        │
        ▼
[Generador de Contenido Gemini AI (/api/admin/marketing/generar-contenido)]
        ├── Genera: Gancho de atención (Hook)
        ├── Genera: Copy persuasivo optimizado para público sin gluten
        ├── Genera: Hashtags estratégicos locales (#Encarnacion #SinGluten)
        └── Genera: Llamado a la acción (CTA) con enlace al producto
        │
        ▼
[Diseñador Visual HTML5 Canvas]
        ├── Compone diseño con foto en alta calidad desde Cloudinary
        ├── Inserta badges de descuento, logo temático de PanFree y sellos celíacos
        └── Exporta en formato Story (9:16), Post (4:5) o Cuadrado (1:1)
        │
        ▼
[Publicación & Auditoría]
        ├── POST /api/admin/marketing/publish-instagram (Instagram Graph API)
        └── Registra en `promociones_historico` y `instagram_posts`
```

---

## 5. Arquitectura de Seguridad y Roles (RBAC)

### 5.1. Capas de Seguridad

1. **Middleware de Rutas (`src/middleware.js`):**
   - Intercepta todas las peticiones a `/admin/*` (excepto `/admin/login`).
   - Valida la sesión activa con `supabase.auth.getUser()`.
   - Verifica los roles administrativos autorizados en `user.app_metadata.role` o `user.user_metadata.role`.
   - Redirecciona usuarios sin sesión a `/admin/login` y usuarios sin privilegios a `/unauthorized`.
2. **Row Level Security (RLS) en PostgreSQL:**
   - La base de datos aplica reglas estrictas a nivel de fila.
   - Tablas públicas (`productos`, `configuracion_sitio`, `premios`) permiten `SELECT` libre.
   - Tablas transaccionales (`pedidos`, `clientes`, `cupones_canjeados`) permiten inserciones validadas desde el cliente.
   - Tablas operativas (`insumos`, `recetas`, `produccion`, `costos_fijos`, `logs_auditoria`) están restringidas exclusivamente a usuarios con rol administrativo autenticado.
3. **Aislamiento de Operaciones Sensibles (Service Role):**
   - Operaciones críticas (auditoría en `logs_auditoria`, logging de correos en `email_logs`, notificaciones masivas) se ejecutan del lado del servidor mediante `SUPABASE_SERVICE_ROLE_KEY`, evitando exponer credenciales maestras en el frontend.

### 5.2. Matriz de Roles y Permisos

| Módulo / Recurso | Cliente (`cliente`) | Operador (`operador`) | Marketing (`marketing`) | Repartidor (`repartidor`) | Administrador (`admin`) |
|---|---|---|---|---|---|
| Tienda & Checkout | ✅ Total | ✅ Total | ✅ Total | ✅ Total | ✅ Total |
| Ver Perfil & Puntos | ✅ Propios | ✅ Propios | ✅ Propios | ✅ Propios | ✅ Todos |
| Gestión de Pedidos | ❌ No | ✅ Ver / Cambiar Estado | ❌ No | ✅ Ver / Estado Entrega | ✅ Total |
| Productos & Precios | ❌ No | 👁️ Solo Lectura | 👁️ Solo Lectura | ❌ No | ✅ Total |
| Insumos & Recetas | ❌ No | 👁️ Solo Lectura | ❌ No | ❌ No | ✅ Total |
| Producción & Lotes | ❌ No | ✅ Registrar Lotes | ❌ No | ❌ No | ✅ Total |
| Compras & Proveedores | ❌ No | ✅ Registrar Recepción | ❌ No | ❌ No | ✅ Total |
| Costos & Finanzas | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Total |
| Marketing & Canvas | ❌ No | ❌ No | ✅ Total | ❌ No | ✅ Total |
| Configuración & Roles | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Total |

---

## 6. Estado y Almacenamiento en Cliente

- **`CartContext`:** Gestiona el estado reactivo del carrito de compras. Sincroniza con `localStorage` bajo la clave `panfree_cart` e implementa listeners con `EventTarget` para eventos concurrentes.
- **`AuthContext`:** Mantiene la sesión del usuario cliente o administrador, suscribiéndose a `supabase.auth.onAuthStateChange`.
- **Consentimiento de Analítica:** Almacena la preferencia de consentimiento de cookies/tracking en `localStorage` bajo la clave `panfree_ga_consent` (`granted` o `denied`).

---

## 7. Integraciones Externas

1. **Supabase (PostgreSQL 15):** Motor de base de datos relacional, autenticación GoTrue y políticas RLS.
2. **Cloudinary CDN:** Gestión y entrega optimizada de imágenes de catálogo, avatares de staff, banners promocionales y variantes temáticas del logo corporativo.
3. **Google Gemini AI (`@google/genai`):** Modelos `gemini-2.5-flash` y `gemini-3.5-flash` para redacción de contenido publicitario y análisis de reglas de marketing.
4. **Resend Email API:** Envío confiable de correos electrónicos transaccionales (confirmaciones de compra, avisos de despacho, alertas del sistema) y campañas de marketing.
5. **WhatsApp (Meta Cloud API / Twilio):** Notificaciones instantáneas al cliente y al equipo de panadería.
6. **n8n Automation Engine:** Orquestador de webhooks para flujos de trabajo asíncronos y automatizaciones programadas.
7. **Google Analytics 4 & Microsoft Clarity:** Monitoreo analítico de embudo de e-commerce y mapas de calor de navegación.
