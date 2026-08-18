# 🍞 Panfree System

[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://panfree.fit)
[![Supabase](https://img.shields.io/badge/powered%20by-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

**E-commerce de panificados sin gluten** con tienda pública y panel de administración.

---

## 📖 Índice

- [Descripción](#descripción)
- [Tecnologías](#tecnologías)
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

## 📁 Estructura del Proyecto
panfree-system/
├── src/
│ ├── app/
│ │ ├── checkout/ # Página de checkout
│ │ ├── pedido/[numero]/ # Seguimiento de pedido
│ │ ├── admin/ # Panel de administración
│ │ ├── api/ # API routes
│ │ └── page.js # Home
│ ├── components/ # Componentes reutilizables
│ ├── context/
│ │ ├── CartContext.js # Carrito de compras
│ │ └── AuthContext.js # Autenticación
│ ├── lib/
│ │ └── supabase.js # Cliente Supabase
│ └── middleware.js # Protección de rutas
├── public/ # Archivos estáticos
├── README.md # Este archivo
├── ARCHITECTURE.md # Arquitectura del sistema
├── API.md # Documentación de API
├── DATABASE.md # Esquema de base de datos
├── DEPLOYMENT.md # Guía de despliegue
└── CONTRIBUTING.md # Guía para contribuir


---

## ⚙️ Requisitos

| Requisito | Versión |
|-----------|---------|
| Node.js | 18.x o 20.x (LTS) |
| npm | >= 9 |
| Cuenta en Supabase | - |
| Cuenta en Vercel | - |

---

## 🚀 Instalación

```bash
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

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# Cloudinary (opcional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name

# n8n Webhook (opcional)
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://tu-webhook.n8n.cloud/webhook/pedido

# WhatsApp (opcional)
NEXT_PUBLIC_WHATSAPP_NUMBER=595984589845

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