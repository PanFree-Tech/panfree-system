# Architecture Decision Records (ADRs)

Registro de decisiones arquitectonicas de PanFree System.

## Que es un ADR

Un ADR (Architecture Decision Record) documenta una decision arquitectonica
importante junto con su contexto, consecuencias y alternativas consideradas.
El objetivo es que futuras auditorias y nuevos integrantes entiendan **por que**
el sistema esta construido como esta, no solo **como**.

Formato: [MADR](https://adr.github.io/madr/) simplificado.
Plantilla base: [TEMPLATE.md](./TEMPLATE.md)

## Indice

| ID | Titulo | Estado | Fecha |
|---|---|---|---|
| [ADR-001](./ADR-001-supabase-backend-unico.md) | Supabase como backend unico (Postgres + Auth + RLS + Storage) | Aceptado | 2026-10-13 |
| [ADR-002](./ADR-002-seguridad-en-capas-app-metadata.md) | Seguridad en capas y app_metadata como fuente unica de rol | Aceptado | 2026-10-13 |
| [ADR-003](./ADR-003-nextjs-app-router-rsc.md) | Next.js 14 App Router con Server Components por defecto | Aceptado | 2026-10-13 |

## Estados posibles

| Estado | Significado |
|---|---|
| Propuesto | En discusion, no aplicado aun |
| Aceptado | Decision vigente |
| Rechazado | Se considero pero no se aplico |
| Obsoleto | Fue valido, ya no aplica (reemplazado por otro ADR) |

## Como agregar un ADR nuevo

1. Copiar TEMPLATE.md a ADR-NNN-titulo-corto.md (NNN = siguiente numero).
2. Llenar contexto, decision, consecuencias y alternativas.
3. Agregarlo al indice de este README.
4. Commit: docs(adr): agregar ADR-NNN <titulo>

## Cuando crear un ADR

- Eleccion de tecnologia o framework.
- Cambio en el modelo de seguridad o autorizacion.
- Cambio en la topologia (server/client, monolito/servicios).
- Decision que afecta multiples fases del Plan de Trabajo.
- Cualquier decision que un auditor futuro preguntaria "por que asi?".

## Referencias

- [ARCHITECTURE.md](../../architecture/ARCHITECTURE.md)
- [Plan de Trabajo](../../operations/PLAN-DE-TRABAJO.md)
- [MADR â€” Markdown ADR](https://adr.github.io/madr/)