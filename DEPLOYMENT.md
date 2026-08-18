# DEPLOYMENT — Panfree System

**Última revisión:** 2026-08-18

---

## Requisitos Previos

| Requisito | Versión |
|-----------|---------|
| Node.js | 18.x o 20.x (LTS) |
| npm | >= 9 |
| Cuenta en Supabase | - |
| Cuenta en Vercel | - |
| Cloudinary account | (para imágenes) |
| n8n / webhook receiver | (para automatizaciones) |

---

## Variables de Entorno

**⚠️ IMPORTANTE:** Nunca subir keys privadas o `service_role` a git.

```env
# ======================
# SUPABASE
# ======================
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# ======================
# CLOUDINARY (si aplica)
# ======================
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# ======================
# N8N WEBHOOK
# ======================
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://tu-webhook.n8n.cloud/webhook/pedido
# ⚠️ NO exponer token en cliente

# ======================
# WHATSAPP (opcional)
# ======================
NEXT_PUBLIC_WHATSAPP_NUMBER=595984589845

# ======================
# WEB PUSH (VAPID)
# ======================
VAPID_PUBLIC_KEY=tu_vapid_public_key
VAPID_PRIVATE_KEY=tu_vapid_private_key

# ======================
# APP
# ======================
NEXT_PUBLIC_VERCEL_URL=panfree.fit
NEXT_PUBLIC_APP_ENV=production

Despliegue en Vercel
1. Conectar repositorio
Ve a Vercel Dashboard

Importar repositorio PanFree-Tech/panfree-system

2. Configurar variables de entorno
Settings → Environment Variables

Agregar todas las variables listadas arriba

3. Configurar build
Vercel detecta Next.js automáticamente:

Build Command: npm run build

Install Command: npm install

Output Directory: .next

4. Configurar dominio
Añadir dominio custom (panfree.fit)
Configurar DNS (registros A/CNAME)

5. Verificar metadataBase
Asegurar que metadataBase en src/app/layout.js coincida con el dominio

6. Deploy automático
Push a main → deploy automático

Despliegue en Desarrollo Local
# Clonar repositorio
git clone https://github.com/PanFree-Tech/panfree-system.git
cd panfree-system

# Instalar dependencias
npm install

# Copiar y configurar .env.local
cp .env.example .env.local
# Editar .env.local con variables necesarias

# Desarrollar
npm run dev
# Abrir http://localhost:3000

# Construir para producción
npm run build
npm start

Scripts Disponibles
Script	Comando	Descripción
dev	next dev -p 3000 -H 0.0.0.0	Desarrollo local
build	next build	Construir para producción
start	next start	Servir producción
lint	next lint	Linter
migrar-imagenes	node scripts/migrar-imagenes-cloudinary.js	Migrar imágenes a Cloudinary

Configuración de Supabase
1. Crear proyecto
Ve a Supabase Dashboard

Crear nuevo proyecto

2. Ejecutar migraciones
Si existen migraciones SQL, ejecutarlas en SQL Editor

3. Configurar RLS
Aplicar políticas RLS según DATABASE.md

4. Crear triggers/funciones
Crear generar_numero_pedido() y trigger

Crear crear_notificacion_pedido() y trigger

5. Obtener keys
Settings → API → URL y anon key

Setear en Vercel como NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY

Migraciones / Seed
# Si usas supabase CLI
supabase start
supabase db dump
supabase db reset

# O exportar desde dashboard
# SQL Editor → Export Schema

Monitoreo y Logs
Herramienta	Descripción
Vercel	Deployments y logs en dashboard
Supabase	Logs → Realtime queries / inserts / auth events
n8n	Logs/ejecuciones del flujo
Sentry (recomendado)	Errores de runtime
Logflare (recomendado)	Logs avanzados
Canary / Staging
Crear proyecto Vercel staging

Usar rama develop o staging

No usar keys de producción

Checklist Antes de Desplegar
□ RLS policies revisadas y aplicadas
□ Secrets rotados (no hay keys en repo)
□ Webhooks protegidos o enviados desde server-side
□ Pruebas e2e básicas aprobadas (checkout, crear pedido)
□ Dominio y SEO (og-image/metadata) verificado
□ Variables de entorno configuradas
□ Build local exitoso (npm run build)


---
