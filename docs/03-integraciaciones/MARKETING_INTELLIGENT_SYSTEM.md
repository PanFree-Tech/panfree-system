# 🤖 Sistema de Marketing Inteligente y Automatización para PanFree

**Versión:** 2.0.0  
**Última actualización:** 2026-08-28  
**Ubicación de Módulo:** `/src/app/admin/marketing/`  
**Objetivo:** Automatizar la toma de decisiones comerciales, la generación de creatividades publicitarias con IA y la publicación multiformato en Instagram para PanFree (Encarnación, Paraguay).

---

## 📌 1. Arquitectura General del Sistema

El módulo de Marketing Inteligente combina inteligencia artificial generativa, renderizado gráfico interactivo en cliente (HTML5 Canvas) y automatizaciones programadas para potenciar las ventas sin requerir intervención manual constante.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              DISPARADORES / TRIGGERS                              │
│         [Cron n8n (Lunes, Miércoles, Viernes)]  /  [Panel Manual de Admin]        │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         │
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                      1. MOTOR DE DECISIÓN COMERCIAL                               │
│              Endpoint: GET /api/admin/marketing/decidir-promocion                 │
│  - Consulta: Festividades y eventos en `eventos_calendario` (Semana Santa, etc.)  │
│  - Consulta: Disponibilidad y capacidad Made-To-Order en `productos`              │
│  - Evalúa: Prioridades, márgenes y tipos de costo en `reglas_promocion`            │
│  - Resultado: Promoción óptima calculada (producto, % de descuento, justificación) │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         │
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                      2. COPYWRITING PERSUASIVO CON IA                             │
│             Endpoint: POST /api/admin/marketing/generar-contenido                 │
│  - Modelo: Google Gemini (gemini-2.5-flash / gemini-3.5-flash vía @google/genai) │
│  - Genera: Hook de alto impacto, caption persuasivo, hashtags locales y CTA       │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         │
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                   3. COMPOSICIÓN VISUAL (DISEÑADOR CANVAS)                        │
│                 Componente: HTML5 Canvas + Cloudinary Media Engine                │
│  - Formatos: Feed Vertical (4:5 - 1080x1350), Story (9:16 - 1080x1920), Cuadrado │
│  - Overlays: Logos temáticos (Octubre Rosa/Base), badges de descuento, sellos     │
│  - Renderizado: Exportación directa en PNG/JPEG de alta resolución                │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         │
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                     4. PUBLICACIÓN DIRECTA & AUDITORÍA                            │
│             Endpoint: POST /api/admin/marketing/publish-instagram                 │
│  - Publica: Meta Instagram Graph API (Feed / Stories)                             │
│  - Registra: `promociones_historico`, `instagram_posts` y `logs_auditoria`        │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ 2. Estructura de Base de Datos (Supabase)

### 2.1. `reglas_promocion`
Define los parámetros de activación automática de ofertas.
- `id` (UUID, PK)
- `nombre` (TEXT)
- `descripcion` (TEXT)
- `condicion` (JSONB) — Criterios de activación (Ej: `{"tipo": "evento_calendario", "dias_antelacion": 7}`)
- `tipo_costo` (TEXT) — `competitivo`, `objetivo`, `premium`
- `descuento_min` (INTEGER) — Porcentaje mínimo
- `descuento_max` (INTEGER) — Porcentaje máximo
- `prioridad` (INTEGER, 1 al 10)
- `activo` (BOOLEAN)

### 2.2. `eventos_calendario`
Fechas clave, conmemoraciones celíacas y festividades tradicionales de Paraguay y Encarnación.
- `id` (UUID, PK)
- `nombre` (TEXT) — Ej: Día Nacional del Celíaco, San Juan Ára, Semana Santa, Navidad
- `fecha_inicio` (DATE)
- `fecha_fin` (DATE)
- `categoria` (TEXT) — `festividad`, `salud`, `gastronomia`, `estacional`
- `productos_relacionados` (TEXT[]) — Lista de productos estratégicos
- `activo` (BOOLEAN)

### 2.3. `promociones_historico`
Registro de todas las sugerencias, decisiones y publicaciones generadas.
- `id` (UUID, PK)
- `producto_id` (UUID, FK a `productos`)
- `regla_id` (UUID, FK a `reglas_promocion`)
- `descuento_aplicado` (INTEGER)
- `precio_final` (NUMERIC)
- `captions_generados` (JSONB) — Objeto con hook, caption, hashtags y CTA
- `imagen_url` (TEXT)
- `post_id` (TEXT)
- `publicada` (BOOLEAN)
- `fecha_programada` (TIMESTAMPTZ)
- `fecha_publicacion` (TIMESTAMPTZ)
- `engagement` (INTEGER)

### 2.4. `instagram_posts`
Auditoría y enlaces directos de las publicaciones en Instagram.
- `id` (UUID, PK)
- `product_id` (UUID, FK a `productos`)
- `product_name` (TEXT)
- `caption` (TEXT)
- `post_id` (TEXT)
- `post_url` (TEXT)
- `format` (TEXT) — `feed_4_5`, `story_9_16`, `feed_1_1`
- `status` (TEXT)

---

## 🔌 3. Endpoints de la API

| Endpoint | Método | Función |
|---|---|---|
| `/api/admin/marketing/decidir-promocion` | `GET` / `POST` | Evalúa reglas, calendario y catálogo para recomendar la promoción óptima. |
| `/api/admin/marketing/generar-contenido` | `POST` | Redacta copies, ganchos y hashtags con Google Gemini AI. |
| `/api/admin/marketing/publish-instagram` | `POST` | Publica la imagen y caption a la cuenta de Instagram Business. |
| `/api/admin/marketing/programar-publicacion` | `POST` | Agenda la fecha/hora de publicación en `promociones_historico`. |
| `/api/admin/marketing/analizar-resultados` | `GET` | Retorna KPIs de efectividad, publicaciones activas y engagement. |
| `/api/admin/marketing/consultar-disponibilidad` | `GET` | Consulta capacidad y stock de productos para promociones. |
| `/api/admin/marketing/actualizar-capacidad` | `POST` | Actualiza límites de producción diaria Made-To-Order. |
| `/api/admin/marketing/upload-image` | `POST` | Sube la imagen del Canvas a Cloudinary para obtener URL pública. |

---

## 🎨 4. Módulos y Pestañas de la Interfaz

Ubicación: `/src/app/admin/marketing/page.js`

1. **🤖 Decisiones Inteligentes (`DecisionPanel.jsx`):**
   - Muestra la promoción recomendada por el algoritmo y su justificación comercial.
   - Simulador de precios en Guaraníes con slider interactivo de descuento.
   - Generador instantáneo de copy con IA y botón *"Cargar en Diseñador"*.
2. **🎨 Diseñador Visual Canvas (`useCanvasRenderer.js` / `canvasUtils.js`):**
   - Lienzo HTML5 interactivo con soporte para fotos de Cloudinary en alta definición.
   - Selector de proporciones: 4:5 (Feed vertical), 9:16 (Stories/Reels) y 1:1 (Cuadrado).
   - Paletas cromáticas oficiales de PanFree (Verde PanFree, Dorado, Naranja artesanal).
   - Aplicación automática de logotipos temáticos (Octubre Rosa, Oficial Base).
   - Descarga directa en JPG/PNG o publicación con 1 clic en Instagram.
3. **📋 Gestor de Reglas (`RulesManager.jsx`):**
   - Creación y edición de reglas comerciales con activación/desactivación instantánea.
   - Configuración de prioridades y límites de descuento mínimo/máximo.
4. **📅 Calendario de Eventos (`EventCalendar.jsx`):**
   - Agenda anual con festividades de Encarnación y fechas del rubro celíaco.
   - Asociación de productos destacados por fecha.
5. **📊 Rendimiento & Publicaciones (`AnalyticsView.jsx` y `ScheduledPosts.jsx`):**
   - Tarjetas de métricas (promociones ejecutadas, descuento promedio, alcance estimado).
   - Historial de publicaciones en Instagram con enlace directo.

---

## ⚙️ 5. Variables de Entorno del Módulo

Asegurar en `.env.local` y Vercel:

```env
# Gemini AI
GEMINI_API_KEY=tu-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# Meta / Instagram Graph API
INSTAGRAM_ACCESS_TOKEN=tu-meta-user-access-token
INSTAGRAM_BUSINESS_ID=tu-instagram-business-account-id

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=d7simx38
CLOUDINARY_API_KEY=tu-cloudinary-api-key
CLOUDINARY_API_SECRET=tu-cloudinary-api-secret

# Automatización n8n
N8N_WEBHOOK_URL=https://tu-instancia.n8n.cloud/webhook/pedido
N8N_WEBHOOK_TOKEN=tu-token-secreto
```
