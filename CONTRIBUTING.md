Contenido de CONTRIBUTING.md:
# Contribuir a Panfree System

Gracias por querer contribuir. Este archivo contiene guía práctica para colaborar de forma ordenada y segura.

---

## Código de Conducta

- Tratar a todos con respeto
- Discutir decisiones técnicas con fundamento y empatía
- En caso de conflicto, llevarlo a maintainers o crear issue para mediar

---

## Cómo Contribuir

### Flujo Recomendado

1. **Fork** del repositorio o crear rama desde el repo principal

2. **Crear una rama** con nombre claro:
   - `feature/nombre-descriptivo`
   - `fix/descripcion-bug`
   - `docs/update-readme`

3. **Hacer cambios localmente** y usar **commits atómicos y descriptivos**:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   # cambios...
   git add .
   git commit -m "feat: agregar validación de email en checkout"
   git push origin feature/nueva-funcionalidad
   Abrir Pull Request contra main (o rama de integración definida)

Incluir descripción del cambio

Capturas si aplica

Checklist de qué se probó

Revisión:

Maintainers revisan y solicitan cambios si hace falta

Una vez aprobado, mergear según política (Squash o Merge commit)

Comandos Rápidos

# 1. Crear rama
git checkout -b feature/nueva-funcionalidad

# 2. Hacer cambios
# ... editar archivos ...

# 3. Commit
git add .
git commit -m "feat: descripción clara"

# 4. Subir y crear PR
git push origin feature/nueva-funcionalidad
Estándares de Código
ESLint
Usar npm run lint para verificar

Seguir reglas de eslint-config-next

Convenciones Next.js/React
Componentes que usan DOM o localStorage → 'use client'

Lógica de fetch → Server Components (cuando sea posible)
Convenciones de Nombres
Elemento	Convención	Ejemplo
Ramas	feature/, fix/, chore/	feature/checkout-validacion
Commits	Conventional Commits	feat: agregar validación
Archivos	camelCase o kebab-case	CartSidebar.js

Server vs Client Components
Componente	Uso	Ejemplos
Server Components	Data fetching, render estático, SEO	page.js (home), layout.js
Client Components	Interactividad, eventos, localStorage	Checkout, CartSidebar
Estilos y UI
Paleta de Colores
Color	Hex	Uso
Verde oscuro	#334c2b	Primario
Naranja	#f46e15	CTA, acentos
Marfil	#b7996b	Secundario
Beige	#eee6d9	Fondo
Estilos
globals.css para tokens y estilos base

Componentes pueden usar estilos inline (patrón actual)

Para nuevas features: considerar CSS Modules o Tailwind

Testing (Recomendado)
Unit Tests
Añadir tests para utilidades (Jest/React Testing Library)

E2E Tests
Cypress / Playwright para flujo crítico (checkout)

Pull Request Template (Sugerido)

## Descripción
[Qué cambió y por qué]

## Screenshots
[Si aplica]

## Checklist
- [ ] `npm run lint` pasó
- [ ] Pruebas locales pasaron
- [ ] Variables de entorno actualizadas (si aplica)
- [ ] Documentación actualizada (si aplica)

Seguridad y Manejo de Secretos
❌ No subir .env.local ni secretos a git

❌ No hardcodear keys

✅ Si detectás claves en el repo → avisar inmediatamente y rotarlas

Subir Documentación Nueva
Documentación técnica en root: ARCHITECTURE.md, DATABASE.md, API.md, DEPLOYMENT.md

Mantener README.md actualizado con enlaces

Contacto
Abrir issue para dudas o mejoras

Para cambios grandes: abrir discusión/issue antes de implementar

---
