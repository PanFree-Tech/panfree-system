# 🤝 Guía de Contribución — PanFree System

¡Gracias por tu interés en contribuir al desarrollo de **PanFree System**! Este documento establece los estándares de código, flujos de trabajo con Git, normas de seguridad y convenciones arquitectónicas del proyecto.

---

## 1. Código de Conducta y Principios

- **Calidad y Claridad:** Escribe código limpio, autodocumentado y con responsabilidades bien delimitadas.
- **Seguridad Primero:** Nunca agregues credenciales, tokens o secretos en el código fuente ni en commits de Git.
- **Rendimiento y Accesibilidad:** Mantén tiempos de carga rápidos, optimización de imágenes con Cloudinary y contraste adecuado en la interfaz.

---

## 2. Flujo de Trabajo con Git

### 2.1. Ramas de Trabajo
Crea siempre una rama descriptiva a partir de la rama principal (`main` o `develop`):
- `feat/nombre-de-la-funcionalidad` (para nuevas características)
- `fix/descripcion-del-bug` (para corrección de errores)
- `docs/actualizacion-documentacion` (para mejoras en documentación)
- `refactor/modulo-optimizado` (para reestructuraciones de código)

### 2.2. Convención de Commits (Conventional Commits)
Utiliza mensajes de commit claros en español o inglés siguiendo el estándar:
```bash
git commit -m "feat(pedidos): agregar filtro por rango de fechas en panel admin"
git commit -m "fix(checkout): corregir redondeo de delivery en zonas periféricas"
git commit -m "docs(api): documentar endpoint de canje de premios"
```

---

## 3. Estándares Técnicos y Arquitectura

### 3.1. Next.js App Router & Componentes
- **Server Components por Defecto:** Mantén las páginas y layouts como Server Components (`layout.js`, `page.js`) a menos que requieran interactividad del usuario.
- **Uso de `'use client'`:** Agrégalo al inicio del archivo únicamente cuando utilices React hooks (`useState`, `useEffect`, `useContext`), listeners del DOM o APIs del navegador (`localStorage`).
- **Rutas de API (`src/app/api/*`):** Valida siempre los payloads de entrada utilizando **Zod**. Nunca expongas la `SUPABASE_SERVICE_ROLE_KEY` ni claves secretas al navegador.

### 3.2. Estilos y Diseño Visual
- **Paleta Cromática Oficial de PanFree:**
  - **Verde Principal (Brand):** `#334c2b`
  - **Naranja Acento (CTA / Alertas):** `#f46e15`
  - **Dorado / Marfil Secundario:** `#b7996b`
  - **Fondo Suave / Neutro:** `#fcfaf7` / `#eee6d9`
- **Iconografía:** Emplea exclusivamente íconos de la librería `lucide-react`. No crees SVGs inline salvo que sea estrictamente necesario.
- **Animaciones:** Utiliza `framer-motion` para transiciones fluidas de entrada, salida y modales.

### 3.3. Base de Datos y Supabase
- Si tu cambio requiere nuevas tablas, columnas o vistas, agrega un archivo SQL con numeración/nombre claro dentro del directorio `/migrations/`.
- Configura siempre las correspondientes **Políticas de Seguridad a Nivel de Fila (Row Level Security - RLS)** para proteger los datos.

---

## 4. Comandos de Desarrollo y Verificación

```bash
# Iniciar servidor de desarrollo en puerto 3000
npm run dev

# Ejecutar el linter para comprobar sintaxis y reglas
npm run lint

# Construir la versión de producción y verificar tipos/rutas
npm run build

# Iniciar servidor de producción local
npm start
```

---

## 5. Checklist para Pull Requests

Antes de enviar un Pull Request, verifica los siguientes puntos:

- [ ] `npm run lint` pasa sin advertencias ni errores críticos.
- [ ] `npm run build` compila con éxito localmente.
- [ ] No hay archivos `.env`, `.env.local` ni claves secretas en el commit.
- [ ] Las consultas a base de datos respetan los tipos y las políticas RLS.
- [ ] La documentación relevante (`API.md`, `DATABASE.md`, `README.md`) ha sido actualizada si se crearon o modificaron endpoints o tablas.
