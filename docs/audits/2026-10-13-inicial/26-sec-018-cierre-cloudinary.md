# SEC-018 - Trazabilidad y revocacion de keys huerfanas de Cloudinary

**Fecha:** 2026-10-14
**Hallazgo:** SEC-018
**Severidad:** Media (P2)
**Estado:** Cerrado
**Sesion:** 15
**Origen:** Detectado en Sesion 14 (24-bugs-s14-gemini-y-otros.md).

---

## 1. Contexto

Durante la Sesion 14 se detecto que el dashboard de Cloudinary
mostraba **3 API keys activas** sin trazabilidad de uso:

| # | Nombre | API Key | Fecha |
|---|---|---|---|
| 1 | panfree-production-2026 | 485388826873525 | 2026-08-23 |
| 2 | mediaflows_acf69227-... | 838151274948889 | 2026-08-23 |
| 3 | panfree-system-2026 | 171796417645162 | 2026-08-14 |

Sin saber cual estaba en uso, rotar la key (F2-04) era riesgoso:
podriamos romper produccion o dejar una key activa sin proposito.

---

## 2. Analisis

### 2.1 El dashboard de Cloudinary no expone "Last used"

Se intento identificar la key activa por 3 vias:

1. **Columna "Last used" en Settings > API Keys.** NO EXISTE en el plan Free.
2. **Seccion "Usage" / "Reports"** en el sidebar. NO disponible.
3. **Webhook Notifications.** No aplica (es para recibir eventos, no para ver uso).

Conclusion: Cloudinary (plan Free) no ofrece visibilidad de uso por
API key en su UI.

### 2.2 Permisos por key (hallazgo clave)

Se revisaron los roles asignados a cada key:

| Key | Roles asignados |
|---|---|
| panfree-production-2026 | Lista completa (Management, Settings, Reports, Image, Video, MediaFlows, AI Agents) |
| mediaflows_acf69227-... | Lista completa (identica) |
| panfree-system-2026 | **NINGUNO** ("Does not have any Product Environment Roles yet") |

La key #3 no tenia permisos asignados. Efectivamente no podia hacer nada.

### 2.3 Analisis del contexto del proyecto

- **mediaflows_...**: autogenerada por MediaFlows (feature de pago de
  Cloudinary). No aparece en ARCHITECTURE.md seccion 7 (Integraciones
  Externas) ni en DEPLOYMENT.md.
- **panfree-system-2026**: creada 9 dias antes de las otras, sin roles.
  Residuo de un setup inicial fallido.
- **panfree-production-2026**: nombre explicito de produccion + fecha de
  setup del proyecto (2026-08-23). Candidata mas fuerte a estar activa.

---

## 3. Test empirico

### 3.1 Objetivo

Confirmar cual key esta en uso ejecutando un upload real via el
endpoint `/api/admin/marketing/upload-image` (que usa
`getCloudinaryClient()` = la key activa de env vars).

### 3.2 Procedimiento

1. Login como admin en https://panfree.fit/admin/marketing.
2. Abrir DevTools (F12) > Console.
3. Ejecutar script que envia un PNG 1x1 a
   `/api/admin/marketing/upload-image`.
4. Verificar la respuesta (200 OK + URL de Cloudinary).

### 3.3 Resultado del test (pre-revocacion)

```
Status HTTP: 200
URL: https://res.cloudinary.com/d7simx38/image/upload/v1791989188/marketing/sec018-test-1791989190860.png
public_id: marketing/sec018-test-1791989190860
```

Upload exitoso. Confirma que la key activa funciona.

### 3.4 Limitacion del test

El test confirma que hay una key activa funcionando, pero NO identifica
cual de las 3 es (Cloudinary no expone "Last used"). Se necesita un
enfoque por eliminacion.

---

## 4. Plan de eliminacion progresiva

### 4.1 Orden de eliminacion

| Orden | Key | Razon |
|---|---|---|
| 1ro | panfree-system-2026 | Sin roles asignados. Cero riesgo. |
| 2do | mediaflows_acf69227-... | Autogenerada por MediaFlows. No en el stack. |
| MANTENER | panfree-production-2026 | Activa probable. |

### 4.2 Eliminacion #1: panfree-system-2026

```
Fecha: 2026-10-14
Accion: Revoke API key panfree-system-2026 (171796417645162)
Razon: Sin roles asignados. No puede hacer nada.
```

Verificacion: upload de prueba despues de la revocacion.
Resultado: no se ejecuto test especifico (la key no tenia permisos).

### 4.3 Eliminacion #2: mediaflows_acf69227-...

```
Fecha: 2026-10-14
Accion: Revoke API key mediaflows_acf69227-e7a8-4836-93c6-fb762ae0df3e (838151274948889)
Razon: Autogenerada por MediaFlows. No en el stack del proyecto.
```

Verificacion: upload de prueba despues de la revocacion.
Resultado: OK (ver seccion 5).

---

## 5. Verificacion post-revocacion

### 5.1 Test empirico final

Ejecutado el 2026-10-14T20:08:55.796Z:

```
Status HTTP: 200
URL: https://res.cloudinary.com/d7simx38/image/upload/v1792008535/marketing/sec018-verify-1792008535796.png
public_id: marketing/sec018-verify-1792008535796
bytes: 70
```

**Resultado:** la app sigue subiendo a Cloudinary con normalidad
despues de eliminar las 2 keys huerfanas.

### 5.2 Estado final de keys

| # | Nombre | API Key | Estado |
|---|---|---|---|
| 1 | panfree-production-2026 | 485388826873525 | Active |

De 3 keys -> 1 key activa. Trazabilidad completa.

---

## 6. Conclusion

**SEC-018 cerrado.**

- 3 keys identificadas.
- 2 huerfanas eliminadas sin impacto en produccion.
- 1 key activa confirmada por test empirico.
- Trazabilidad documentada.

### Deuda derivada

- **F2-04** (rotacion de Cloudinary API secret) **sigue pendiente.**
  La limpieza de keys huerfanas NO es la rotacion. F2-04 requiere:
  crear key nueva + actualizar Vercel + revocar la vieja.

---

## 7. DoD (SEC-018)

- [x] Diagnostico completo (3 keys identificadas).
- [x] Analisis de roles por key.
- [x] Plan de eliminacion progresiva definido.
- [x] Test empirico pre-revocacion ejecutado.
- [x] Eliminacion #1 (panfree-system-2026): OK.
- [x] Eliminacion #2 (mediaflows_...): OK.
- [x] Test empirico post-revocacion: OK.
- [x] Estado final documentado (1 key activa).
- [x] Doc de cierre generado (este archivo).
- [x] Tracking actualizado (SEC-018 -> Cerrado).
- [ ] Commit pusheado con security(env):

---

## 8. Referencias

- [SEC-018 en tracking](./06-hallazgos-tracking.md)
- [Hallazgo original en S14](./24-bugs-s14-gemini-y-otros.md)
- [Rotacion de claves](../../operations/ROTACION-CLAVES.md)
- [Plan de Trabajo](../../operations/PLAN-DE-TRABAJO.md) - F2-04
