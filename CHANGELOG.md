# 📜 Changelog — PanFree System

Todos los cambios notables, mejoras y correcciones realizadas en el sistema PanFree se documentan cronológicamente en este archivo.

---

## [2.0.0] - 2026-08-28

### 🚀 Módulos ERP & Backoffice Añadidos
- **Gestión Integral de Insumos (`/admin/insumos`):** Maestro de materias primas con control de stock actual vs. mínimo, alertas visuales automáticas, factor de conversión y cálculo de Precio Promedio Ponderado (PPP).
- **Fichas Técnicas & Recetas (`/admin/recetas`):** Desglose detallado de ingredientes por producto, cálculo automático de costo directo de materia prima, rendimiento en kilogramos y matriz de precios sugeridos con márgenes del 20%, 40% y 60%.
- **Control de Lotes de Producción (`/admin/produccion`):** Generación de lotes correlativos `PROD-YYYY-NNNN`, seguimiento de tiempos y temperaturas de horneado, registro de responsables y control de porcentaje de mermas.
- **Inventario de Maquinarias & Costo Energético (`/admin/maquinarias`):** Clasificación de equipos en consumo activo vs. permanente y cálculo mensual automatizado de costo eléctrico según tarifa kWh de la ANDE.
- **Análisis Financiero de Costos & Margen Real (`/admin/costos`):** Estructura contable en 3 dimensiones: Margen Bruto, Costos Fijos mensuales (alquiler, salarios, servicios) y Margen Real prorrateado por unidad/kg producida.
- **Directorio de Proveedores & Órdenes de Compra (`/admin/proveedores` y `/admin/compras`):** Recepción de órdenes con incremento automático de stock físico y recálculo ponderado del PPP.
- **Reportes & Estadísticas Ejecutivas (`/admin/reportes`):** Visualización de ventas en Guaraníes por periodo, pedidos por estado, ranking de productos más vendidos y alertas operativas.

### 🤖 Marketing Inteligente & Redes Sociales
- **Motor de Decisión Comercial con IA:** Endpoint `/api/admin/marketing/decidir-promocion` que evalúa el calendario comercial de Paraguay y reglas comerciales dinámicas.
- **Generador de Contenido Gemini AI (`@google/genai`):** Redacción automática de hooks persuasivos, captions optimizados para el público celíaco, hashtags estratégicos y llamados a la acción.
- **Diseñador Visual HTML5 Canvas:** Renderizador interactivo en el navegador con soporte para formatos Feed Vertical (4:5), Story (9:16) y Cuadrado (1:1), descarga en alta resolución y publicación asistida.
- **Integración con Meta Instagram Graph API:** Publicación directa de piezas publicitarias en el feed y stories oficiales de PanFree.

### 🎁 Gamificación, Fidelización & Dípticos QR
- **Sistema de Códigos de Dípticos QR (`/admin/dipticos` y `/canjear`):** Generador de lotes de códigos alfanuméricos de 6 caracteres únicos para folletos impresos con canje instantáneo de puntos.
- **Programa de Fidelidad Multinivel:** Categorización de clientes en niveles Bronce, Plata, Oro y VIP con catálogo de recompensas canjeables (`/perfil/puntos` y `/api/premios/canjear`).
- **Módulo de Cupones de Descuento (`/admin/cupones` y `/api/cupones/validar`):** Cupones por porcentaje o monto fijo con validación de mínimos y límites de uso.

### 🎨 Branding Dinámico & Configuración
- **Configuración Global del Negocio (`/admin/configuracion`):** Gestión de logotipo oficial, variantes temáticas de logo (Octubre Rosa, Navidad, etc.), banners del Hero y favicon.
- **Gestión de Usuarios y Roles (RBAC):** Administración de credenciales y roles para administradores, operadores, repartidores y equipo de marketing.

### 📧 Comunicaciones & Auditoría
- **Integración con Resend Email API:** Envío confiable de correos transaccionales y de marketing con registro persistente en `email_logs`.
- **Logs de Auditoría Administrativa:** Registro de acciones sensibles en la tabla `logs_auditoria`.
- **Capacidad Made-To-Order:** Control dinámico de capacidad diaria de elaboración por producto y actualización automática de estados (`DISPONIBLE`, `CAPACIDAD LIMITADA`, `CERRADO`).

---

## [1.2.0] - 2026-08-22

### Añadido
- Control de capacidad de producción diaria (Fase 2 Made-To-Order).
- Cálculo automático de `availability_status` mediante triggers en PostgreSQL.
- Auditoría de correos enviados en `email_logs`.

---

## [1.1.0] - 2026-08-19

### Añadido
- Tabla y módulo de `logs_auditoria` con Row Level Security (RLS).
- Endpoint server-side `/api/notificar-pedido` para integración segura con n8n.
- Endpoints de notificaciones push web con claves VAPID (`/api/push-suscribir`, `/api/push-notificar`).

---

## [1.0.0] - 2026-08-18

### Añadido
- **Implementación de Google Analytics 4 (GA4):** Hook `useAnalytics`, componente `GAScript`, modo de consentimiento y eventos de e-commerce estándar (`view_item`, `add_to_cart`, `begin_checkout`, `purchase`).
- **Módulo de Checkout:** Validación de teléfonos locales, selección de retiro o delivery y cotizador de tarifas de envío.
- **Carrito Persistente:** Contexto reactivo `CartContext` sincronizado con almacenamiento local.
- **Seguimiento de Pedidos:** Página pública `/pedido/[numero]` con seguimiento en vivo.
- **Protección de Rutas:** Middleware de seguridad con Supabase SSR para `/admin/*`.
