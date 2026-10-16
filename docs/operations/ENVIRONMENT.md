# Variables de Entorno

Guia completa de variables de entorno del proyecto.

## Convencion de cuentas

- [S] = system.panfree@gmail.com (tecnico)
- [C] = contacto.panfree@gmail.com (comercial)

## Referencia

Ver .env.example en la raiz del repositorio.

## Almacenamiento

Bitwarden - Organizacion PanFree tiene 3 carpetas:
- Claves Personales (n8n, admin, etc.)
- Desarrollo
- Produccion (fuente de verdad para claves productivas)

No existe carpeta "Legado". El historial de rotaciones vive en la
NOTA de cada item (key saliente completa + fecha + tarea + motivo).

Items sueltos: panfree.fit y supabase.com (sin sufijo - Produccion).
Son logins de los dashboards (no API keys).

## Rotacion

Ver ROTACION-CLAVES.md (procedimiento, rollback, modelo de Bitwarden).

## Estado de Bitwarden

Ver ROTACION-CLAVES.md, seccion "Estado de Bitwarden al cierre de S16".
