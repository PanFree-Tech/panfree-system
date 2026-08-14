# Panfree — E-commerce + Panel Admin

Panfree es un e-commerce y panel administrativo para panificados sin gluten.

Stack principal
- Lenguajes: JavaScript (App Router), algo de TypeScript
- Framework: Next.js 14 (App Router)
- Backend: Supabase (auth, storage, Postgres)
- Deployment: Vercel (recomendado). Opcionales: Docker / Fly

Quickstart (desarrollo)
1. Clona el repositorio
   git clone https://github.com/PanFree-Tech/panfree-system.git
2. Cambia a la rama principal y a la rama de trabajo si procede
   git checkout main
3. Copia el ejemplo de variables y rellénalas localmente (NO commitear)
   cp .env.example .env.local
   # Rellena las variables en .env.local
4. Instala dependencias
   npm ci
5. Ejecuta localmente
   npm run dev

Variables de entorno importantes
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- RESEND_API_KEY
- NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
- CLOUDINARY_* (si usas Cloudinary)

Seguridad
- NO subas .env.local ni ninguna credencial al repositorio.
- Si alguna clave fue expuesta, roteala inmediatamente en el servicio correspondiente (Supabase, Cloudinary, Resend).

Limpieza propuesta en esta rama (cleanup/remove-generated-and-secrets)
- .env.local fue sanitizado para eliminar secrets.
- .next/ y node_modules/ deben quitarse del control de versiones (no se hace en este commit para evitar romper historial sin coordinación).
- .gitignore ha sido actualizado para ignorar artefactos de build y dependencias.

Cómo proceder para purgar historial (opcional y destructivo)
- Si quieres eliminar secretos del historial, usar git-filter-repo o BFG. Esto reescribe el historial y requiere que todos los colaboradores vuelvan a clonar.

