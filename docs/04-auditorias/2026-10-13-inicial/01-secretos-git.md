# SEC-001 - Archivos .env en historial de Git

**Severidad:** Critica
**Estado:** Abierto
**Fecha:** 2026-10-13

## Evidencia

    .env.production.backup
    .env.local

Aparecen en el historial del repo publico PanFree-Tech/panfree-system.

## Impacto

- Repo publico: cualquier clon tiene copia
- 0 forks, 0 stars: riesgo bajo de explotacion
- Se recomienda rotar todas las claves

## Remediacion

1. Rotar todas las claves (en curso)
2. Purgar historial con git filter-repo
3. Abrir ticket a GitHub Support
