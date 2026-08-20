# 🤖 Sistema de Marketing Inteligente y Automatización para PanFree

Documentación técnica y operativa completa del **Sistema de Marketing Inteligente** implementado para PanFree (panadería 100% libre de gluten en Encarnación, Paraguay).

---

## 📌 Tabla de Contenidos
1. [Arquitectura General](#1-arquitectura-general)
2. [Estructura de Base de Datos (Supabase)](#2-estructura-de-base-de-datos-supabase)
3. [Motor de Automatización (n8n Workflow)](#3-motor-de-automatización-n8n-workflow)
4. [Endpoints de la API (Next.js App Router)](#4-endpoints-de-la-api-nextjs-app-router)
5. [Módulos y Componentes Frontend](#5-módulos-y-componentes-frontend)
6. [Flujo de Trabajo Operativo](#6-flujo-de-trabajo-operativo)
7. [Variables de Entorno y Configuración](#7-variables-de-entorno-y-configuración)

---

## 1. Arquitectura General

El sistema automatiza el ciclo completo de decisión comercial, generación creativa y publicación en redes sociales mediante el siguiente flujo:

```
[Cron n8n / Admin UI]
         │
         ▼
[1. Motor de Decisión] ─── Consulta: Calendario Festivo + Inventario + Reglas de Negocio
         │
         ▼
[2. Copywriting & Prompt Multimodal] ─── Gemini AI (gemini-2.5-flash / gemini-3.5-flash)
         │
         ▼
[3. Diseñador Canvas / Composición Visual] ─── HTML5 Canvas + Plantillas PanFree
         │
         ▼
[4. Publicación & Auditoría] ─── Instagram Graph API + Supabase Audit Logs
```

---

## 2. Estructura de Base de Datos (Supabase)

Archivo DDL: `/migrations/create_marketing_smart_tables.sql`

### 2.1. `reglas_promocion`
Configura las políticas dinámicas de descuento y márgenes.
- `id` (UUID, PK)
- `nombre` (TEXT)
- `descripcion` (TEXT)
- `condicion` (JSONB) - Ej: `{"tipo": "evento_calendario", "dias_antelacion": 7}`
- `tipo_costo` (TEXT) - `competitivo` | `objetivo` | `premium`
- `descuento_min` (INTEGER)
- `descuento_max` (INTEGER)
- `prioridad` (INTEGER, 1-10)
- `activo` (BOOLEAN)

### 2.2. `eventos_calendario`
Fechas gastronómicas y festividades de Paraguay / Encarnación.
- `id` (UUID, PK)
- `nombre` (TEXT) - Ej: Semana Santa, Día del Celíaco, San Juan
- `fecha_inicio` (DATE)
- `fecha_fin` (DATE)
- `categoria` (TEXT)
- `productos_relacionados` (TEXT[]) - Nombres de productos clave
- `activo` (BOOLEAN)

### 2.3. `promociones_historico`
Registro de todas las decisiones y publicaciones generadas.
- `id` (UUID, PK)
- `producto_id` (UUID, FK a `productos`)
- `regla_id` (UUID, FK a `reglas_promocion`)
- `descuento_aplicado` (INTEGER)
- `precio_original` (NUMERIC)
- `precio_promocion` (NUMERIC)
- `fecha_inicio` (TIMESTAMP)
- `fecha_fin` (TIMESTAMP)
- `estado` (TEXT) - `sugerido` | `aprobado` | `publicado` | `cancelado`
- `publicado_instagram` (BOOLEAN)
- `captions_generados` (JSONB)
- `engagement_score` (NUMERIC)

### 2.4. `instagram_posts`
Auditoría y trazabilidad directa de publicaciones en Meta Graph API.
- `id` (UUID, PK)
- `post_id` (TEXT)
- `caption` (TEXT)
- `image_url` (TEXT)
- `published_at` (TIMESTAMP)
- `status` (TEXT)

---

## 3. Motor de Automatización (n8n Workflow)

Archivo de Workflow: `/n8n/marketing_automation_workflow.json`

Nodos configurados:
1. **Schedule Trigger**: Ejecución periódica (Lunes, Miércoles y Viernes 08:00 AM).
2. **HTTP: Decidir Promoción**: Llama a `/api/admin/marketing/decidir-promocion`.
3. **HTTP: Generar Contenido**: Llama a `/api/admin/marketing/generar-contenido` con la recomendación del decisor.
4. **Switch: Aprobación**: Si requiere aprobación manual, envía notificación por Telegram/Email; si está en modo 100% automático, avanza directo.
5. **HTTP: Programar/Publicar**: Llama a `/api/admin/marketing/programar-publicacion` y publica en Instagram.
6. **Supabase: Audit Log**: Actualiza `promociones_historico` y `logs_auditoria`.

---

## 4. Endpoints de la API (Next.js App Router)

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/admin/marketing/decidir-promocion` | `GET` | Evalúa eventos, catálogo y reglas activas para devolver la promoción óptima y alternativas. |
| `/api/admin/marketing/generar-contenido` | `POST` | Genera hook, caption persuasivo, hashtags y prompt de diseño con Gemini AI. |
| `/api/admin/marketing/programar-publicacion` | `POST` | Publica inmediatamente a Instagram o agenda fecha en `promociones_historico`. |
| `/api/admin/marketing/analizar-resultados` | `GET` | Calcula KPIs de conversión, promociones publicadas y efectividad de reglas. |

---

## 5. Módulos y Componentes Frontend

Ubicación: `/src/app/admin/marketing/`

Pestañas disponibles en el Panel de Marketing:
1. 🤖 **Decisiones Inteligentes (IA)** (`DecisionPanel.jsx`):
   - Sugerencia principal y justificación algorítmica.
   - Ajuste interactivo de descuento con cálculo en tiempo real en Guaraníes (PYG).
   - Generación instantánea de copy con Gemini AI.
   - Botón *"Cargar en Diseñador"* para enviar textos y producto directamente al Canvas.
   - Publicación y programación con un clic.
2. 🎨 **Diseñador Visual (Canvas)**:
   - Renderizador HTML5 Canvas con descarga PNG/JPG en alta resolución (1080x1350, 1080x1080, 1080x1920).
   - Simulador de celular interactivo.
   - Panel de publicación manual asistido por IA.
3. 📋 **Reglas de Promoción** (`RulesManager.jsx`):
   - CRUD completo con activación/desactivación instantánea.
   - Configuración de prioridades, tipos de costo (`competitivo`, `objetivo`, `premium`) y rangos de descuento.
4. 📅 **Calendario de Eventos** (`EventCalendar.jsx`):
   - Fechas clave de Encarnación y festividades celíacas/gastronómicas.
   - Vinculación de productos estrella por evento.
5. 📊 **Métricas & Historial** (`AnalyticsView.jsx` y `ScheduledPosts.jsx`):
   - Tarjetas de KPIs (Total promociones, publicaciones activas, descuento medio).
   - Tabla de publicaciones con estado y enlaces a Instagram.

---

## 6. Variables de Entorno

Asegurar en el archivo `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Gemini AI
GEMINI_API_KEY=tu-gemini-api-key

# Instagram Graph API (Opcional para publicación directa)
INSTAGRAM_PAGE_ID=tu-instagram-page-id
INSTAGRAM_ACCESS_TOKEN=tu-access-token
```
