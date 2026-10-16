# Gestion de Riesgos - PanFree System

**Fecha:** 2026-10-13
**Metodologia:** impacto x probabilidad = severidad

---

## 1. Riesgos identificados

### R-01: Rotacion de claves rompe autenticacion

| Campo | Valor |
|---|---|
| **Impacto** | Alto |
| **Probabilidad** | Media |
| **Severidad** | ALTA |
| **Fase afectada** | 2 |

**Descripcion:** al rotar el JWT secret de Supabase, todas las sesiones activas se invalidan. Si Vercel no se actualiza inmediatamente, el sitio queda caido.

**Mitigacion:**
- Rotar en horario de bajo trafico
- Verificar la key nueva ANTES de revocar la vieja (test empirico + Logs)
- La key vieja se revoca recien cuando la nueva esta confirmada en produccion
- Tener Vercel abierto en otra pestana
- Hacerlo en horario de bajo trafico
- Documentar en runbook: docs/05-runbooks/rotar-claves-supabase.md

**Plan de contingencia:**
1. Rotacion de emergencia: crear key nueva en el dashboard
2. Actualizar Vercel
3. Redeploy
4. Investigar con calma (la key comprometida ya fue revocada)

---

### R-02: Migracion de Supabase pierde datos

| Campo | Valor |
|---|---|
| **Impacto** | Critico |
| **Probabilidad** | Baja |
| **Severidad** | CRITICA |
| **Fase afectada** | 2 |

**Descripcion:** al migrar entre cuentas de Supabase, riesgo de perder tablas, usuarios o archivos.

**Mitigacion:**
- NO migrar datos, solo agregar system.panfree como Owner
- Si se necesita migracion real: pg_dump completo antes
- Probar en proyecto de staging primero

**Plan de contingencia:**
1. Restaurar desde backup
2. Documentar en docs/05-runbooks/restaurar-supabase.md

---

### R-03: CI bloquea deploys legitimos

| Campo | Valor |
|---|---|
| **Impacto** | Medio |
| **Probabilidad** | Alta |
| **Severidad** | MEDIA |
| **Fase afectada** | 4 |

**Descripcion:** al pasar a CI estricto, algun PR puede fallar por razones no relacionadas con el cambio.

**Mitigacion:**
- Probar 1 semana en modo tolerante antes
- Ver docs/02-operaciones/POLITICA-CI-CD.md
- Documentar excepciones

**Plan de contingencia:**
1. Revertir a modo tolerante temporalmente
2. Investigar el fallo
3. Corregir y volver a estricto

---

### R-04: Gitleaks detecta falsos positivos

| Campo | Valor |
|---|---|
| **Impacto** | Bajo |
| **Probabilidad** | Alta |
| **Severidad** | BAJA |
| **Fase afectada** | 0-4 |

**Descripcion:** gitleaks puede marcar strings largos aleatorios como secretos (ej: hashes de commits).

**Mitigacion:**
- Crear .gitleaksignore si aparecen falsos positivos
- Configurar .gitleaks.toml con reglas especificas

**Plan de contingencia:**
- Agregar el patron a .gitleaksignore con un comentario explicando por que

---

### R-05: Bitwarden pierde claves

| Campo | Valor |
|---|---|
| **Impacto** | Critico |
| **Probabilidad** | Muy baja |
| **Severidad** | CRITICA |
| **Fase afectada** | 2+ |

**Descripcion:** perdida de la contrasena maestra de Bitwarden, o corrupcion de la boveda.

**Mitigacion:**
- Contrasena maestra guardada OFFLINE (papel en caja fuerte)
- 2FA activado
- Codigos de recuperacion descargados
- Exportar la boveda periodicamente en JSON encriptado

**Plan de contingencia:**
1. Usar el JSON exportado
2. Si no: recuperar desde los dashboards de cada servicio
3. Ultimo recurso: rotar TODO desde cero

Nota S16+S22: no existe carpeta "Legado". El historial de rotaciones
vive en la nota de cada item (key saliente completa + fecha + motivo).
Un export de la boveda (JSON encriptado) ya incluye esas notas; no hay
una carpeta separada que respaldar.

Nota S22: Bitwarden -> Organizacion PanFree tiene 3 carpetas
(Claves Personales, Desarrollo, Produccion). Un export de la boveda
las incluye todas.

---

### R-06: Vercel se desconecta del repo al migrar

| Campo | Valor |
|---|---|
| **Impacto** | Alto |
| **Probabilidad** | Media |
| **Severidad** | ALTA |
| **Fase afectada** | 2+ |

**Descripcion:** Vercel puede perder la conexion con el repo si se transfiere a otra cuenta.

**Mitigacion:**
- Hacer el cambio de repo fuera de horario critico
- Tener el dominio y DNS a mano
- Documentar la configuracion actual de Vercel

**Plan de contingencia:**
1. Reconectar manualmente
2. Re-deployar desde el ultimo commit
3. Si falla: usar el runbook deploy-rollback.md

---

### R-07: Servicio externo cambia su API

| Campo | Valor |
|---|---|
| **Impacto** | Medio |
| **Probabilidad** | Baja |
| **Severidad** | MEDIA |
| **Fase afectada** | Cualquiera |

**Descripcion:** Meta, Cloudinary, Gemini, etc. pueden cambiar su API y romper integraciones.

**Mitigacion:**
- Mantener las integraciones aisladas en /lib
- Tests de integracion en cada servicio
- Monitoreo de status pages

**Plan de contingencia:**
- Adaptar el codigo en /lib
- Actualizar versiones del SDK

---

### R-08: El proyecto crece y no escala

| Campo | Valor |
|---|---|
| **Impacto** | Medio |
| **Probabilidad** | Media |
| **Severidad** | MEDIA |
| **Fase afectada** | Futuro |

**Descripcion:** la base de Supabase en plan Free (500MB) puede quedar chica.

**Mitigacion:**
- Monitorear uso mensualmente
- Plan de upgrade a Pro (/mes) cuando sea necesario
- Optimizar queries y datos historicos

---

## 2. Matriz de riesgos

| ID | Impacto | Probabilidad | Severidad | Estado |
|---|---|---|---|---|
| R-01 | Alto | Media | ALTA | Mitigado |
| R-02 | Critico | Baja | CRITICA | Mitigado |
| R-03 | Medio | Alta | MEDIA | Aceptado |
| R-04 | Bajo | Alta | BAJA | Aceptado |
| R-05 | Critico | Muy baja | CRITICA | Mitigado |
| R-06 | Alto | Media | ALTA | Mitigado |
| R-07 | Medio | Baja | MEDIA | Aceptado |
| R-08 | Medio | Media | MEDIA | Monitoreado |

---

## 3. Revision

- **Frecuencia:** mensual, o cuando aparezca un riesgo nuevo
- **Responsable:** Pedro J. Pirovani
- **Fuente de nuevos riesgos:** incidentes, auditorias, cambios de servicio