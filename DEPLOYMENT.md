# 🚀 PanFree System — Guía de Despliegue y Puesta en Producción

**Versión:** 2.0.0  
**Última revisión:** 2026-08-28  
**Plataforma de Despliegue Principal:** Vercel / Cloud Run  
**Base de Datos & Auth:** Supabase (PostgreSQL)  
**CDN & Media:** Cloudinary  

---

## 1. Requisitos Previos

| Servicio / Herramienta | Versión / Tipo | Propósito |
|---|---|---|
| **Node.js** | 18.x o 20.x LTS | Entorno de ejecución de Next.js |
| **npm** | >= 9.x | Gestor de paquetes de dependencias |
| **Supabase Project** | PostgreSQL 15 | Base de datos, autenticación y políticas RLS |
| **Cloudinary Account** | Cloudinary Media API | Almacenamiento, transformación y CDN de imágenes |
| **Google Cloud / AI Studio** | Gemini API Key | Modelos generativos para marketing inteligente |
| **Resend Account** | Resend API Key | Envío de correos transaccionales y de marketing |
| **Meta for Developers** | Instagram Graph API / WhatsApp API | Publicación en Instagram y notificaciones WhatsApp |
| **Google Analytics 4** | GA4 Measurement ID | Medición de tráfico y eventos de e-commerce |
| **Vercel / Cloud Run** | Producción | Hosting de frontend y funciones de API |

---

## 2. Variables de Entorno Requeridas

Configura las siguientes variables de entorno en el panel de Vercel (**Project Settings ➔ Environment Variables**) o en tu archivo `.env.local`:

```env
# ==========================================
# 1. SUPABASE (Base de Datos y Autenticación)
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# ==========================================
# 2. CLOUDINARY (Media & CDN)
# ==========================================
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=d7simx38
CLOUDINARY_API_KEY=tu_cloudinary_api_key
CLOUDINARY_API_SECRET=tu_cloudinary_api_secret
NEXT_PUBLIC_UPLOAD_PRESET=panfree_upload

# ==========================================
# 3. INTELIGENCIA ARTIFICIAL (Google Gemini)
# ==========================================
GEMINI_API_KEY=tu_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# ==========================================
# 4. EMAIL TRANSACCIONAL (Resend)
# ==========================================
RESEND_API_KEY=re_tu_resend_api_key

# ==========================================
# 5. MENSAJERÍA & WHATSAPP (Meta / Twilio)
# ==========================================
NEXT_PUBLIC_WHATSAPP_NUMBER=595984589845
WHATSAPP_ACCESS_TOKEN=tu_meta_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_waba_id
WHATSAPP_TEAM_NUMBER=595984589845
TWILIO_ACCOUNT_SID=tu_twilio_sid
TWILIO_AUTH_TOKEN=tu_twilio_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# ==========================================
# 6. INSTAGRAM GRAPH API (Meta)
# ==========================================
INSTAGRAM_ACCESS_TOKEN=tu_meta_user_token
INSTAGRAM_BUSINESS_ID=tu_instagram_business_account_id

# ==========================================
# 7. AUTOMATIZACIÓN (n8n Webhook)
# ==========================================
N8N_WEBHOOK_URL=https://tu-instancia.n8n.cloud/webhook/pedido
N8N_WEBHOOK_TOKEN=tu_token_secreto_n8n
CRON_SECRET=tu_secreto_para_cron_jobs

# ==========================================
# 8. ANALÍTICA (Google Analytics 4)
# ==========================================
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-QE8GQS3MSR
GA4_API_SECRET=tu_ga4_measurement_api_secret
GA_PROPERTY_ID=tu_ga_property_id

# ==========================================
# 9. PWA & WEB PUSH (VAPID)
# ==========================================
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_vapid_public_key
VAPID_PRIVATE_KEY=tu_vapid_private_key
NEXT_PUBLIC_VAPID_EMAIL=contacto@panfree.fit

# ==========================================
# 10. APLICACIÓN
# ==========================================
NEXT_PUBLIC_BASE_URL=https://panfree.fit
```

---

## 3. Secuencia de Migraciones en Supabase

Ejecuta los scripts SQL ubicados en el directorio `/migrations/` en el **SQL Editor** de Supabase en el siguiente orden para garantizar la integridad referencial:

1. `create_configuracion_y_usuarios.sql` (Configuración global del negocio, roles de usuario).
2. `add-client-columns.sql` (Extensiones de clientes y roles).
3. `add_promociones_y_fidelizacion.sql` (Cupones de descuento, puntos de clientes y ofertas).
4. `add_dipticos_y_gamificacion.sql` (Códigos de dípticos QR, catálogo de premios y triggers).
5. `add-production-capacity.sql` (Capacidad Made-To-Order y cálculo de disponibilidad).
6. `create_marketing_smart_tables.sql` (Reglas comerciales, eventos de calendario y posts de Instagram).
7. `create_email_logs.sql` (Auditoría de despachos de correo con Resend).
8. `create_logs_auditoria.sql` (Auditoría de acciones administrativas del ERP).
9. `add_logo_variantes_configuracion.sql` (Variantes temáticas de logos en JSONB).
10. `add_ga4_consent.sql` (Gestión de consentimiento de analítica).

---

## 4. Despliegue en Vercel (Recomendado)

### Paso 1: Conectar el Repositorio
1. Ingresa a [Vercel Dashboard](https://vercel.com).
2. Haz clic en **"Add New Project"** e importa `PanFree-Tech/panfree-system`.

### Paso 2: Configurar Framework y Build
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Install Command:** `npm install`
- **Output Directory:** `.next`

### Paso 3: Cargar Variables de Entorno
Copia todas las variables de la sección 2 en la pestaña **Environment Variables** para los entornos *Production*, *Preview* y *Development*.

### Paso 4: Configurar Dominio Personalizado
1. En **Settings ➔ Domains**, agrega `panfree.fit` y `www.panfree.fit`.
2. En tu proveedor DNS, configura los registros CNAME o A según las instrucciones de Vercel.

---

## 5. Configuración de Servicios Externos

### 5.1. Cloudinary
- Crea un Upload Preset llamado `panfree_upload` con modo **Unsigned** o **Signed**.
- Asegúrate de permitir las carpetas `logos`, `banners`, `productos` y `usuarios`.

### 5.2. Resend
- Verifica tu dominio `panfree.fit` en Resend configurando los registros DKIM y SPF en tu proveedor DNS.
- El remitente configurado por defecto es `PanFree <contacto@panfree.fit>`.

### 5.3. n8n Workflow
- Importa el archivo `/n8n/marketing_automation_workflow.json` en tu instancia de n8n.
- Configura las credenciales HTTP con la URL de producción `https://panfree.fit/api/...` y el token secreto `N8N_WEBHOOK_TOKEN`.

---

## 6. Verificación Post-Despliegue (Checklist)

- [ ] **Home y Catálogo:** La tienda carga correctamente con productos y badges sin gluten.
- [ ] **Checkout:** Flujo de compra completo, cotización de delivery y generación de pedido `PF-YYYY-XXXX`.
- [ ] **Tracking:** `/pedido/[numero]` muestra el estado del pedido en tiempo real.
- [ ] **Panel ERP:** Acceso seguro a `/admin` mediante autenticación y redirección adecuada para no autorizados.
- [ ] **Recetas y Costos:** Visualización correcta del desglose de ingredientes y cálculo del Margen Real.
- [ ] **Marketing IA:** Generación de copies con Gemini AI y renderizado en Canvas funcional.
- [ ] **Canje Dípticos:** Endpoint `/api/dipticos/canjear` suma puntos correctamente al escanear QR.
- [ ] **Correos:** Recepción de comprobante en `email_logs` y bandeja de entrada.
