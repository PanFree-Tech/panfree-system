# 🍞 PanFree System — ERP & E-commerce Integral para Panadería Sin Gluten

[![Next.js](https://img.shields.io/badge/Next.js-14.1.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/powered%20by-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?style=for-the-badge&logo=cloudinary)](https://cloudinary.com)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20SDK-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)
[![Resend](https://img.shields.io/badge/Resend-Email-000000?style=for-the-badge&logo=resend)](https://resend.com)
[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://panfree.fit)

**PanFree System** es una plataforma tecnológica integral (ERP + E-commerce + Marketing con IA) diseñada a medida para la gestión operativa, productiva, financiera y comercial de **PanFree**, panadería y repostería artesanal 100% libre de gluten ubicada en Encarnación, Paraguay.

---

## 📖 Índice

1. [Descripción General](#-descripción-general)
2. [Arquitectura y Módulos](#-arquitectura-y-módulos)
3. [Tienda Online (E-commerce Cliente)](#-tienda-online-e-commerce-cliente)
4. [Panel de Administración (ERP)](#-panel-de-administración-erp)
5. [Tecnologías Utilizadas](#-tecnologías-utilizadas)
6. [Estructura del Proyecto](#-estructura-del-proyecto)
7. [Instalación y Configuración Local](#-instalación-y-configuración-local)
8. [Variables de Entorno](#-variables-de-entorno)
9. [Despliegue](#-despliegue)
10. [Documentación Técnica Detallada](#-documentación-técnica-detallada)
11. [Contribuir y Licencia](#-contribuir-y-licencia)

---

## 📝 Descripción General

El sistema unifica en una sola plataforma:
- **Tienda Pública de Alto Rendimiento:** Catálogo interactivo categorizado, fichas técnicas de productos aptos para celíacos, carrito reactivo sincronizado, checkout fluido de 1 solo paso, cálculo dinámico de delivery según zona/distancia, cupones de descuento, gamificación y seguimiento de pedidos en tiempo real.
- **Sistema ERP Backoffice Completo:** Control de inventario de insumos (materias primas), fichas de recetas con desglose de costos, cálculo del Precio Promedio Ponderado (PPP), compras a proveedores, órdenes de producción con mermas, costeo energético de maquinarias (kWh), análisis de márgenes reales (bruto + prorrateo de costos fijos) y reportes ejecutivos.
- **Motor de Marketing Inteligente:** Asistente generativo multimodal con **Google Gemini** para copies persuasivos y hashtags, **Diseñador Visual HTML5 Canvas** para banners y stories en múltiples formatos, calendario de festividades y eventos astronómicos/gastronómicos de Paraguay, y publicación programada a **Instagram Graph API**.
- **Fidelización y Gamificación:** Códigos QR en dípticos físicos para acumulación de puntos, sistema de niveles (Bronce, Plata, Oro, VIP) y catálogo de premios canjeables.
- **Comunicaciones Omnicanal:** Notificaciones automáticas y transaccionales vía WhatsApp (Meta Cloud API / Twilio), correos HTML con **Resend** y webhooks con **n8n**.

---

## 🏗️ Arquitectura y Módulos

```
                                  PANFREE SYSTEM
                                        │
           ┌────────────────────────────┴────────────────────────────┐
           ▼                                                         ▼
  TIENDA ONLINE (CLIENTE)                                  PANEL ERP (ADMIN)
  ├── Catálogo & Filtros                                   ├── Dashboard & Reportes
  ├── Ficha de Producto SEO                                ├── Gestión de Pedidos
  ├── Carrito & Checkout                                   ├── Catálogo & Promociones
  ├── Cálculo de Delivery                                  ├── Clientes & Puntos
  ├── Tracking de Pedidos                                  ├── Insumos & Proveedores
  ├── Portal de Puntos & Premios                           ├── Compras & PPP
  ├── Canje de QR Dípticos                                 ├── Recetas & Fichas Técnicas
  └── Perfil de Usuario                                    ├── Producción & Lotes
                                                           ├── Maquinarias & Energía
                                                           ├── Costos Fijos & Margen Real
                                                           ├── Marketing IA & Canvas
                                                           ├── Cupones & Dípticos
                                                           ├── Campañas de Email
                                                           └── Configuración & Branding
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
      POSTGRES / SUPABASE           CLOUDINARY                   IA & APIs
    (Auth, RLS, DB, Triggers)     (Media CDN, Logos)    (Gemini, Resend, Meta, GA4)
```

---

## 🛒 Tienda Online (E-commerce Cliente)

- **Home & Catálogo (`/` y `/catalogo`):** Filtros instantáneos por categoría (Panes, Dulces, Salados, Congelados), badges de destacados y ofertas, e información de aptitud celíaca certificada por DINAPI.
- **Detalle de Producto (`/producto/[slug]`):** Ficha técnica con descripción de ingredientes, advertencia de alérgenos, fotografías optimizadas en Cloudinary, selector de cantidad y disponibilidad de producción Made-To-Order.
- **Carrito Reactivo (`CartContext` / `CartSidebar`):** Estado persistente en almacenamiento local con sincronización en tiempo real.
- **Checkout Unificado (`/checkout`):**
  - Validación de datos de contacto y teléfono.
  - Selección de método de entrega: Retiro en local o Delivery a domicilio.
  - Cotizador de tarifa de envío según barrio/zona o cálculo de coordenadas.
  - Aplicador de cupones de descuento y canje de puntos de fidelidad.
  - Selección de método de pago (Efectivo o Transferencia bancaria).
  - Confirmación inmediata con envío a n8n, WhatsApp y registro en base de datos.
- **Tracking de Pedidos (`/pedido/[numero]`):** Vista pública para el cliente con barra de progreso del estado del pedido (`pendiente` ➔ `confirmado` ➔ `en_produccion` ➔ `listo` ➔ `entregado`).
- **Portal de Fidelidad (`/perfil/puntos` y `/canjear`):** Consulta de puntos acumulados, nivel de membresía, canje de códigos QR de dípticos y canje de premios (descuentos, delivery gratis, panes de regalo).

---

## ⚙️ Panel de Administración (ERP)

1. **Dashboard & Reportes (`/admin` y `/admin/reportes`):** Métricas clave de ventas del día, semana y mes, desglose de pedidos por estado, productos más vendidos, alertas de stock bajo y gráficos de rendimiento financiero.
2. **Gestión de Pedidos (`/admin/pedidos`):** Visualización en grilla y lista, filtros avanzados por estado y fecha, modal de edición detallada, asignación de costos de delivery, cambio de estados con disparo de notificaciones automáticas por WhatsApp y correo.
3. **Catálogo de Productos (`/admin/productos`):** Creación y edición con carga de imágenes a Cloudinary, fijación de precios, capacidad de producción diaria (Made-To-Order), tiempos de elaboración (lead time) y configuración de promociones con fechas de vigencia.
4. **Fichas Técnicas & Recetas (`/admin/recetas`):** Desglose de materias primas por producto, cálculo automático del costo de ingredientes, rendimiento en KG, porcentaje de incidencia por insumo y cálculo de precios sugeridos para márgenes del 20%, 40% y 60%.
5. **Inventario de Insumos (`/admin/insumos`):** Maestro de materias primas, control de stock actual vs. stock mínimo con alertas visuales, factores de conversión y Precio Promedio Ponderado (PPP).
6. **Compras & Proveedores (`/admin/compras` y `/admin/proveedores`):** Registro de órdenes de compra con detalle de insumos. Al recepcionar una compra, el sistema actualiza automáticamente el stock físico y recalcula el PPP ponderado.
7. **Control de Producción (`/admin/produccion`):** Apertura y seguimiento de lotes de elaboración (`PROD-YYYY-NNNN`), consumo de insumos, control de mermas y cálculo del costo real por tanda.
8. **Maquinarias & Costos Energéticos (`/admin/maquinarias`):** Registro de hornos, amasadoras, cámaras de fermentación y heladeras. Clasificación en consumo activo vs. permanente y cálculo del costo mensual en Guaraníes según tarifa kWh de la ANDE.
9. **Costos & Márgenes Reales (`/admin/costos`):** Módulo contable avanzado en 3 dimensiones:
   - **Margen Bruto:** Precio de venta vs. Costo directo de receta.
   - **Costos Fijos:** Registro mensual de alquiler, nómina laboral, servicios, depreciaciones y energía.
   - **Margen Real:** Prorrateo de costos fijos por unidad/kg producida para conocer la rentabilidad neta real.
10. **Marketing Inteligente con IA (`/admin/marketing`):** Generador de promociones con IA Gemini, diseñador gráfico interactivo en Canvas HTML5 para posts (4:5), historias (9:16) y banners (1:1), calendario de eventos comerciales y publicación directa en Instagram Graph API.
11. **Cupones & Dípticos QR (`/admin/cupones` y `/admin/dipticos`):** Generación de códigos promocionales y lotes de dípticos impresos con códigos alfanuméricos únicos para campañas de fidelización.
12. **Comunicaciones & Correos (`/admin/correos`):** Redacción y despacho de correos transaccionales y newsletters utilizando Resend con plantillas HTML responsivas y auditoría en `email_logs`.
13. **Configuración & Branding (`/admin/configuracion`):** Gestión de logotipo oficial, variantes temáticas (Octubre Rosa, Navidad, etc.), banners del Hero, datos de contacto, zonas de delivery y roles de usuarios (`admin`, `operador`, `repartidor`, `marketing`).

---

## 🛠️ Tecnologías Utilizadas

| Categoría | Tecnología | Propósito |
|---|---|---|
| **Framework** | Next.js 14.1.0 (App Router) | Renderizado híbrido (SSR, Server Actions, Client Components, API Routes) |
| **Frontend UI** | React 18.2.0 + CSS Modules + Tailwind CSS | Interfaz modular, responsiva y accesible |
| **Animaciones & Íconos** | Framer Motion + Lucide React | Transiciones fluidas e iconografía estandarizada |
| **Base de Datos & Auth** | Supabase (PostgreSQL 15 + RLS + GoTrue Auth) | Persistencia relacional, triggers, vistas SQL y autenticación segura |
| **Almacenamiento de Medios** | Cloudinary + Next-Cloudinary | Optimización, CDN, transformación y alojamiento de imágenes |
| **Inteligencia Artificial** | Google GenAI SDK (`@google/genai`) | Generación de copies publicitarios, prompts y análisis de marketing |
| **Email Transaccional** | Resend API | Envío de comprobantes, alertas operativas y campañas de marketing |
| **Mensajería & WhatsApp** | Meta Cloud API / Twilio WhatsApp | Notificaciones de confirmación de pedido y alertas de producción |
| **Automatización** | n8n Workflows | Orquestación de eventos de pedidos y campañas automatizadas |
| **Métricas & Analítica** | Google Analytics 4 (GA4) + Clarity | Medición de eventos de e-commerce y mapas de calor |
| **PWA & Notificaciones** | Next-PWA + Web-Push (VAPID) | Experiencia instalable móvil y notificaciones push web |
| **Validación de Datos** | Zod 3.x / 4.x | Validación de esquemas y payloads de API en el servidor |

---

## 📁 Estructura del Proyecto

```text
panfree-system/
├── .env.example                     # Plantilla de variables de entorno
├── package.json                     # Manifiesto de dependencias y scripts
├── next.config.js                   # Configuración de Next.js, PWA y dominios de imágenes
├── migrations/                      # Scripts SQL DDL de migraciones de Supabase
│   ├── add-client-columns.sql
│   ├── add-production-capacity.sql
│   ├── add_dipticos_y_gamificacion.sql
│   ├── add_logo_variantes_configuracion.sql
│   ├── add_promociones_y_fidelizacion.sql
│   ├── create-generaciones-imagen.sql
│   ├── create_configuracion_y_usuarios.sql
│   ├── create_email_logs.sql
│   ├── create_logs_auditoria.sql
│   └── create_marketing_smart_tables.sql
├── n8n/                             # Flujos de trabajo exportados para n8n
│   └── marketing_automation_workflow.json
├── public/                          # Recursos estáticos, íconos PWA, logos y manifiesto
├── src/
│   ├── app/
│   │   ├── layout.js                # Root layout con metadata y configuración base
│   │   ├── layout-client.js         # Wrapper de proveedores (Auth, Carrito, GA4)
│   │   ├── page.js                  # Home principal de la tienda online
│   │   ├── catalogo/page.js         # Catálogo completo de productos
│   │   ├── producto/[slug]/         # Ficha individual de producto
│   │   ├── checkout/page.js         # Checkout de 1 solo paso
│   │   ├── pedido/[numero]/page.js  # Tracking público de pedidos
│   │   ├── perfil/                  # Portal de cliente y puntos
│   │   ├── canjear/page.js          # Canje público de códigos QR de dípticos
│   │   ├── bio/page.js              # Página de enlaces para redes sociales
│   │   ├── sobre-nosotros/page.js   # Información de la marca e historia
│   │   ├── admin/                   # Módulos del Panel de Administración ERP
│   │   │   ├── layout.js            # Layout administrativo con barra de navegación lateral
│   │   │   ├── page.js              # Dashboard general
│   │   │   ├── pedidos/             # Gestión y cambio de estado de pedidos
│   │   │   ├── productos/           # CRUD de productos y promociones
│   │   │   ├── clientes/            # Directorio y niveles de fidelidad
│   │   │   ├── insumos/             # Inventario de materias primas
│   │   │   ├── compras/             # Órdenes de compra y actualización de PPP
│   │   │   ├── proveedores/         # Directorio de proveedores
│   │   │   ├── recetas/             # Fichas técnicas y costeo de recetas
│   │   │   ├── produccion/          # Control de lotes y mermas
│   │   │   ├── maquinarias/         # Registro de equipos y consumo eléctrico
│   │   │   ├── costos/              # Margen Bruto, Costos Fijos y Margen Real
│   │   │   ├── marketing/           # Marketing inteligente con IA y Canvas
│   │   │   ├── cupones/             # Gestión de cupones de descuento
│   │   │   ├── dipticos/            # Generación y control de códigos QR
│   │   │   ├── correos/             # Centro de envío de emails con Resend
│   │   │   ├── reportes/            # Informes estadísticos y ejecutivos
│   │   │   └── configuracion/       # Branding, logos dinámicos y usuarios
│   │   └── api/                     # Endpoints de API REST (App Router)
│   ├── components/                  # Componentes reutilizables de UI (Cards, Modals, Navs)
│   ├── context/                     # Contextos globales de React (AuthContext, CartContext)
│   ├── hooks/                       # Hooks personalizados (useAnalytics, useMobile, etc.)
│   ├── lib/                         # Clientes y utilitarios (Supabase, Resend, WhatsApp, Cloudinary)
│   ├── middleware.js                # Protección de rutas /admin con Supabase SSR
│   └── services/                    # Servicios de notificaciones y push web
└── ... documentación .md
```

---

## 🚀 Instalación y Configuración Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/PanFree-Tech/panfree-system.git
cd panfree-system
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env.local
# Editar .env.local con las claves correspondientes
```

### 4. Iniciar servidor de desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 🔑 Variables de Entorno

Consulta el archivo `.env.example` para la lista completa. Las variables principales son:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Google Gemini AI
GEMINI_API_KEY=tu_gemini_api_key

# Resend Email
RESEND_API_KEY=tu_resend_api_key

# WhatsApp / Twilio / Meta
WHATSAPP_ACCESS_TOKEN=tu_meta_token
WHATSAPP_PHONE_NUMBER_ID=tu_phone_id
WHATSAPP_TEAM_NUMBER=595984589845

# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-QE8GQS3MSR
GA4_API_SECRET=tu_ga4_api_secret
GA_PROPERTY_ID=tu_ga_property_id

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_vapid_public_key
VAPID_PRIVATE_KEY=tu_vapid_private_key
NEXT_PUBLIC_VAPID_EMAIL=contacto@panfree.fit

# n8n Webhook & Seguridad
N8N_WEBHOOK_URL=https://tu-instancia.n8n.cloud/webhook/pedido
N8N_WEBHOOK_TOKEN=tu_token_secreto
CRON_SECRET=tu_cron_secret
```

---

## 📦 Despliegue

El proyecto está optimizado para su despliegue en **Vercel** o **Cloud Run**:
- En Vercel: Se conecta el repositorio `PanFree-Tech/panfree-system`, se cargan las variables de entorno en el panel y se realiza el despliegue automático con cada push a la rama `main`.
- En contenedores Docker / Cloud Run: Se compila con `npm run build` y se inicia el servidor de producción con `npm start`.

Consulta la guía completa en [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 📚 Documentación Técnica Detallada

| Documento | Descripción |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitectura de software, flujos de datos, seguridad RLS, roles y patrones |
| [API.md](API.md) | Catálogo completo de endpoints REST (request, response, códigos de estado) |
| [DATABASE.md](DATABASE.md) | Esquema relacional de Supabase, tablas, claves foráneas, vistas y triggers |
| [MARKETING_INTELLIGENT_SYSTEM.md](MARKETING_INTELLIGENT_SYSTEM.md) | Manual operativo del sistema de marketing con IA, Canvas y automatizaciones |
| [GA4-IMPLEMENTACION.md](GA4-IMPLEMENTACION.md) | Especificación de eventos analíticos, consentimiento y Measurement Protocol |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Guía paso a paso de aprovisionamiento, migraciones y despliegue |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Estándares de desarrollo, convención de commits y pull requests |
| [CHANGELOG.md](CHANGELOG.md) | Registro cronológico de versiones y nuevas funcionalidades |

---

## 🤝 Contribuir y Licencia

Este proyecto es privado y de uso exclusivo de **PanFree**. Para contribuir, consulta las pautas detalladas en [CONTRIBUTING.md](CONTRIBUTING.md).

**Contacto:**
- Web: [panfree.fit](https://panfree.fit)
- WhatsApp: [+595 984 589845](https://wa.me/595984589845)
- Encarnación, Itapúa, Paraguay.
