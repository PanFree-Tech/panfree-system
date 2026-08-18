# 🍞 Panfree System

[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://panfree.fit)
[![Supabase](https://img.shields.io/badge/powered%20by-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

**E-commerce de panificados sin gluten** con tienda pública y panel de administración.

---

## 📖 Índice

- [Descripción](#descripción)
- [Tecnologías](#tecnologías)
- [Google Analytics 4](#google-analytics-4)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Variables de Entorno](#variables-de-entorno)
- [Despliegue](#despliegue)
- [Documentación](#documentación)
- [Contribuir](#contribuir)

---

## 📝 Descripción

Panfree System es una plataforma de e-commerce para **panificados sin gluten**, con enfoque en:

- **Tienda pública** con catálogo de productos
- **Checkout** con validación de teléfono y dirección
- **Panel de administración** para gestionar productos, pedidos y clientes
- **Seguimiento de pedidos** en tiempo real
- **Notificaciones automáticas** vía n8n y WhatsApp

---

## 🛠️ Tecnologías

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| **Framework** | Next.js (App Router) | 14.1.0 |
| **Lenguaje** | JavaScript / React | 18.2.0 |
| **Backend** | Supabase (Auth + Postgres) | - |
| **Imágenes** | Cloudinary | 2.10.0 |
| **Íconos** | Lucide React | 1.31.0 |
| **PWA** | next-pwa | 5.6.0 |
| **Notificaciones** | web-push | 3.6.7 |
| **Animaciones** | Framer Motion | 13.1.0 |

---

## 📊 Google Analytics 4

Panfree System utiliza **Google Analytics 4** para rastrear el comportamiento de los usuarios y eventos de comercio electrónico.

### Eventos Implementados

| Evento | Descripción | Disparo |
|--------|-------------|---------|
| `page_view` | Vista de página | Navegación SPA |
| `view_item_list` | Vista de catálogo | Carga de productos / cambio de categoría |
| `select_item` | Selección de producto | Clic en tarjeta de producto |
| `view_item` | Vista de producto | Montaje de tarjeta de producto |
| `add_to_cart` | Agregar al carrito | Clic en "Agregar" |
| `remove_from_cart` | Eliminar del carrito | Reducir cantidad o eliminar |
| `begin_checkout` | Inicio de checkout | Entrar a `/checkout` con productos |
| `purchase` | Compra completada | Confirmación de pedido |

### Configuración

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-QE8GQS3MSR
Archivos de Implementación
Archivo	Descripción
src/hooks/useAnalytics.js	Hook con eventos GA4
src/components/GAScript.jsx	Carga de gtag.js con next/script
📖 Documentación completa: GA4-IMPLEMENTACION.md

📁 Estructura del Proyecto
text
panfree-system/
├── src/
│   ├── app/
│   │   ├── checkout/         # Página de checkout
│   │   ├── pedido/[numero]/  # Seguimiento de pedido
│   │   ├── admin/            # Panel de administración
│   │   ├── api/              # API routes
│   │   └── page.js           # Home
│   ├── components/           # Componentes reutilizables
│   ├── context/
│   │   ├── CartContext.js    # Carrito de compras
│   │   └── AuthContext.js    # Autenticación
│   ├── hooks/                # Hooks personalizados
│   │   └── useAnalytics.js   # Hook de GA4
│   ├── lib/
│   │   └── supabase.js       # Cliente Supabase
│   └── middleware.js         # Protección de rutas
├── public/                   # Archivos estáticos
├── README.md                 # Este archivo
├── ARCHITECTURE.md           # Arquitectura del sistema
├── API.md                    # Documentación de API
├── DATABASE.md               # Esquema de base de datos
├── DEPLOYMENT.md             # Guía de despliegue
├── CONTRIBUTING.md           # Guía para contribuir
├── GA4-IMPLEMENTACION.md     # Documentación de GA4
└── CHANGELOG.md              # Registro de cambios
⚙️ Requisitos
Requisito	Versión
Node.js	18.x o 20.x (LTS)
npm	>= 9
Cuenta en Supabase	-
Cuenta en Vercel	-
🚀 Instalación
bash
# 1. Clonar repositorio
git clone https://github.com/PanFree-Tech/panfree-system.git
cd panfree-system

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus variables

# 4. Ejecutar en desarrollo
npm run dev

# 5. Abrir http://localhost:3000
🔑 Variables de Entorno
env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# Cloudinary (opcional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name

# n8n Webhook (opcional)
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://tu-webhook.n8n.cloud/webhook/pedido

# WhatsApp (opcional)
NEXT_PUBLIC_WHATSAPP_NUMBER=595984589845

# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-QE8GQS3MSR
📦 Despliegue
En Vercel (recomendado)
bash
# 1. Conectar repositorio a Vercel
# 2. Configurar variables de entorno
# 3. Desplegar automáticamente en push a main
En local (producción)
bash
npm run build
npm start
Más detalles: DEPLOYMENT.md

📚 Documentación
Archivo	Descripción
ARCHITECTURE.md	Arquitectura del sistema, patrones y decisiones
API.md	Documentación de endpoints
DATABASE.md	Esquema de base de datos y RLS
DEPLOYMENT.md	Guía de despliegue
CONTRIBUTING.md	Guía para contribuir
GA4-IMPLEMENTACION.md	Documentación de Google Analytics 4
CHANGELOG.md	Registro de cambios
🤝 Contribuir
Fork del repositorio

Crear rama (feature/nueva-funcionalidad)

Hacer cambios y commit

Push y Pull Request

Ver: CONTRIBUTING.md

📄 Licencia
Este proyecto es privado y de uso exclusivo de PanFree.

📬 Contacto
Web: panfree.fit

WhatsApp: +595 984 589845

Última actualización: 2026-08-18

text