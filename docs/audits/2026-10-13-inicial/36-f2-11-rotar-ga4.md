# F2-11: Rotacion de GA4

**Fecha:** 2026-10-16 (S19)
**Estado:** Cerrado
**Tarea:** F2-11
**Hallazgos:** SEC-023 (cerrado), DOC-014 (nuevo)

---

## 1. Contexto

SEC-023 reportaba "GA4 con dos juegos de credenciales coexistiendo en
Vercel". Antes de rotar habia que auditar cual de los dos grupos
estaba realmente en uso.

Auditoria (scripts 59 y 60):

- Script 59: 18 coincidencias de variables GA4 en src/.
- Script 60: lectura de los 3 archivos consumidores.

**Resultado: no era duplicado.** Los dos grupos sirven propositos
distintos:

| Grupo | Variables | Consumidor | Uso real |
|---|---|---|---|
| A - Service Account | GA4_PROJECT_ID, GA4_PRIVATE_KEY, GA4_CLIENT_EMAIL, GA_PROPERTY_ID | admin/ga-metrics/route.js | **Plomeria inerte** (solo logger.log, no llama a Data API) |
| B - Measurement Protocol | GA4_API_SECRET | ga4/measurement/route.js | **Activo** (envia eventos server-side) |
| Contexto | NEXT_PUBLIC_GA_MEASUREMENT_ID | ga4/measurement/route.js + GAScript.jsx | Publico, no es secreto |

Conclusion: SEC-023 no era un hallazgo de seguridad real. Ambos
grupos se conservan (el Grupo A por decision del responsable, ver
DOC-014). Solo el Grupo B requeria rotacion.

---

## 2. Inventario de secretos

| Variable | Tipo | Se rota | Valor legacy recuperable |
|---|---|---|---|
| GA4_PROJECT_ID | Identificador | No | N/A |
| GA4_CLIENT_EMAIL | Identificador | No | N/A |
| GA_PROPERTY_ID | Identificador | No | N/A |
| NEXT_PUBLIC_GA_MEASUREMENT_ID | Identificador publico | No | N/A |
| GA4_API_SECRET | Secreto | **Si** | Si |
| GA4_PRIVATE_KEY | Secreto | **Si** | **No** (Google no lo expone post-creacion) |

---

## 3. Rotacion 1: GA4_API_SECRET

**Motivo:** rotacion periodica pendiente desde S18 + exposicion
accidental en chat durante la auditoria de S19.

**Procedimiento:**

1. GA4 Admin -> Recogida y modificacion de datos -> Flujos de datos
   -> panfree.fit -> Secretos de la API de Measurement Protocol -> Crear.
2. Apodo: panfree-system-2026-10-16.
3. Actualizar GA4_API_SECRET en Vercel (Production + Preview).
4. Actualizar .env.local.
5. Redeploy.
6. Verificar con POST a /api/ga4/measurement (debug: true).
7. Revocar el secret viejo en GA4 Admin.

**Verificacion:**

```
{
  "success": true,
  "status": 200,
  "debug_validation": { "validationMessages": [] },
  "events_sent": 1
}
```

Sin errores de validacion de Google. El secret nuevo esta activo.

**Secret saliente (registrado en Bitwarden):**

- Valor: 9kBxpoPjR_aBo1H0-QyE8w
- Apodo GA4 Admin: panfree-measurement-protocol
- Creado: 2026-08-22 22:48:48
- Revocado: 2026-10-16

---

## 4. Rotacion 2: GA4_PRIVATE_KEY

**Motivo:** rotacion periodica obligatoria. El valor legacy es
irrecuperable (Google no lo expone post-creacion, Vercel no lo
muestra por estar marcado como Sensitive).

**Procedimiento:**

1. Google Cloud Console -> IAM y administracion -> Cuentas de servicio
   -> panfree-ga4-analytics-675@gen-lang-client-0840688115.iam.gserviceaccount.com
   -> Claves -> Agregar clave -> Crear clave nueva -> JSON.
2. Guardar el campo private_key del JSON en Bitwarden (GA4_PRIVATE_KEY).
3. Actualizar GA4_PRIVATE_KEY en Vercel (Production + Preview).
4. Actualizar .env.local.
5. Redeploy.
6. Revocar la key vieja en Google Cloud (identificar por Key ID).

**Verificacion:** no hay test empirico (el codigo actual no usa la
Data API). Verificado indirectamente: el build de Vercel paso
Ready y el endpoint /api/ga4/measurement sigue funcionando.

**Key saliente (registrado en Bitwarden):**

- Valor: IRRECUPERABLE
- Key ID: 45522eb71b92a80fcdb49c5ff073786d9b02496b
- Creada: 2026-08-31
- Revocada: 2026-10-16

**Key nueva (registrado en Bitwarden):**

- Nombre en Google Cloud: panfree-system-2026-10-16
- Activa desde: 2026-10-16

---

## 5. Estado de Bitwarden

Item: Bitwarden -> Organizacion PanFree -> Produccion -> "GA4 - Produccion"

| Campo personalizado | Tipo | Valor |
|---|---|---|
| GA4_PROJECT_ID | Texto | gen-lang-client-0840688115 |
| GA4_CLIENT_EMAIL | Texto | panfree-ga4-analytics-675@gen-lang-client-0840688115.iam.gserviceaccount.com |
| GA4_PRIVATE_KEY | Oculto | (nueva key activa) |
| GA_PROPERTY_ID | Texto | 550437019 |
| GA4_API_SECRET | Oculto | (nuevo secret activo) |

Nota: incluye el historial de las 2 rotaciones con los valores
salientes (uno recuperable, uno no).

---

## 6. Hallazgos

**SEC-023** (Abierto desde S18):

Cerrado en S19. **No era un duplicado.** Ambos grupos coexisten
legitimamente: Service Account para lectura (inerte hoy) y
Measurement Protocol para envio (activo).

**DOC-014** (nuevo en S19):

"GA4 Service Account es plomeria inerte". El endpoint
admin/ga-metrics/route.js carga las 4 variables del Service Account
pero no las usa: calcula metricas unicamente desde la tabla
pedidos de Supabase. Decision: conservar el Service Account por
si se implementa la Data API en el futuro. Revision futura:
2027-04-16.

---

## 7. Referencias

- Script 59: scripts/docs/59-auditar-ga4.ps1
- Script 60: scripts/docs/60-leer-endpoints-ga4.ps1
- Script 61a: scripts/docs/61a-documentar-f2-11.ps1
- Tracking: docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md
- Bitwarden: item "GA4 - Produccion"
- Endpoint: src/app/api/ga4/measurement/route.js
- Endpoint que NO la usa: src/app/api/admin/ga-metrics/route.js

