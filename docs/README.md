# Documentacion - PanFree System

Indice maestro de la documentacion del proyecto.

## Estructura

| Carpeta | Proposito |
|---|---|
| architecture/ | Como esta construido el sistema (ARCHITECTURE, DATABASE, API, ADRs) |
| operations/ | Como se opera y despliega (PLAN, SISTEMA, WORKFLOW, CI/CD, riesgos) |
| integrations/ | Como se conecta con servicios externos |
| audits/ | Historial de auditorias tecnicas |
| runbooks/ | Procedimientos de emergencia |
| reference/ | Material de consulta general |

## Archivos raiz

| Archivo | Proposito |
|---|---|
| STATUS.md | Estado actual del proyecto, proximos 3 pasos |
| BITACORA.md | Registro cronologico de sesiones de trabajo |
| README.md | Este archivo |

## Indice rapido

- [Arquitectura](./architecture/ARCHITECTURE.md)
- [Base de datos](./architecture/DATABASE.md)
- [API](./architecture/API.md)
- [Deployment](./operations/DEPLOYMENT.md)
- [Contributing](./operations/CONTRIBUTING.md)
- [Auditorias](./audits/README.md)
- [Plan de Trabajo](./operations/PLAN-DE-TRABAJO.md)
- [Sistema de Trabajo](./operations/SISTEMA-DE-TRABAJO.md)
- [Workflow Diario](./operations/WORKFLOW-DIARIO.md)
- [Guia Rapida](./operations/GUIA-RAPIDA.md)
- [Politica CI/CD](./operations/POLITICA-CI-CD.md)
- [Gestion de Riesgos](./operations/GESTION-DE-RIESGOS.md)
- [Tracking de hallazgos](./audits/2026-10-13-inicial/06-hallazgos-tracking.md)

## Decisiones arquitectonicas (ADRs)

- [ADR-001 - Supabase como backend unico](./architecture/decisiones/ADR-001-supabase-backend-unico.md)
- [ADR-002 - Seguridad en capas y app_metadata](./architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)
