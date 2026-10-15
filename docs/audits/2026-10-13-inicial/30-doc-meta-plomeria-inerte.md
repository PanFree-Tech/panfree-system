# DOC-005 / DOC-006 / DOC-007 - Meta: Plomeria inerte

**Fecha:** 2026-10-15 (S17)
**Autor:** Pedro J. Pirovani
**Estado:** Documentado
**Severidad:** Media (DOC-006 con impacto visible al admin) / Baja (DOC-005 y DOC-007)

---

## 1. Resumen ejecutivo

Durante S17 se audito el estado real del ecosistema Meta en el proyecto PanFree System. El resultado fue inesperado: **hay mucha plomeria en el codigo, pero nada activo en produccion**.

Tres servicios estan afectados:

| Servicio | Vercel | Codigo | Canal real | Hallazgo |
|---|---|---|---|---|
| Meta WhatsApp Cloud API | Sin tokens | Plomeria inerte | `wa.me/` link | DOC-005 |
| Twilio WhatsApp | Sin tokens | Plomeria inerte | Ninguno | DOC-005 |
| Instagram Graph API | Sin tokens | Endpoints ACTIVOS | Publicacion manual | DOC-006 |

**Bloqueante raiz (DOC-007):** Meta Business Verification requiere RUC / documentacion fiscal. Sin eso, ninguno de estos servicios se puede activar en modo produccion.

---

## 2. Evidencia recolectada

### 2.1 Vercel - Environment Variables

Busqueda en el proyecto `panfree-system` (Vercel Settings â†’ Environment Variables):

| Filtro | Resultado |
|---|---|
| `WHATSAPP` | Solo `ADMIN_WHATSAPP` (usado por notificaciones.js) |
| `TWILIO` | **No Results Found** |
| `INSTAGRAM` | **No Results Found** |

**Conclusion:** las 3 integraciones Meta estan ausentes de Vercel.

### 2.2 Codigo - uso real

**WhatsApp Cloud API:**
- `src/lib/whatsapp.js` (122 lineas) - cliente HTTP
- `src/lib/whatsapp-templates.js` (125 lineas) - templates `jaspers_market_*` (nombre de otro proyecto)
- `src/app/api/send-whatsapp/route.js` (64 lineas)
- `src/app/api/send-whatsapp-team/route.js` (112 lineas)

Todas creadas en el commit `b68d3563 feat(whatsapp): implement template-based messaging system`. En runtime, `whatsapp.js:56` emite `logger.warn("WhatsApp API no configurado")` y no falla.

**Twilio:**
- `send-whatsapp-team/route.js:69-87` intenta `import('twilio')` y llamar `twilioClient.messages.create`.
- Sin tokens en Vercel, falla con error de autenticacion si alguien invoca el endpoint.
- **Ningun frontend visible llama a `/api/send-whatsapp-team`.** Es codigo muerto accesible solo por URL directa.

**Instagram Graph API:**
- `src/app/api/admin/marketing/publish-instagram/route.js`
- `src/app/api/admin/marketing/programar-publicacion/route.js`
- Ambos leen `INSTAGRAM_ACCESS_TOKEN` e `INSTAGRAM_BUSINESS_ID` sin validar y llaman a `graph.facebook.com/v19.0/.../media`.
- **Los endpoints SI tienen UI que los llama:**
  - `src/app/admin/marketing/components/AutomationPanel.jsx:11`
  - `src/app/admin/marketing/components/DecisionPanel.jsx:215`
  - `src/app/admin/marketing/page.js:384`
  - `src/app/admin/marketing/services/instagramService.js:23,94`
- **Este es el unico servicio con impacto visible al admin.** Los botones existen, el admin los puede clickear, la llamada falla.

### 2.3 Canal real de WhatsApp

El canal productivo es `wa.me/595984589845` - link directo que abre WhatsApp Web/App apuntando al WhatsApp Business App de Luciana (esposa del responsable). Se usa en **mas de 20 lugares** del codigo, todos funcionando.

### 2.4 `.env.local` local

Solo contiene `VERCEL_OIDC_TOKEN`. Ni el entorno local tiene los tokens Meta.

---

## 3. Hallazgos

### DOC-005 - Meta WhatsApp + Twilio: plomeria inerte

**Descripcion:** el codigo tiene cliente HTTP, templates, endpoints, y logs preparados para enviar WhatsApps via Meta Cloud API y Twilio. Nunca se activo en produccion.

**Causa:** los tokens nunca se crearon en Vercel. En parte por falta de necesidad (el canal `wa.me/` funciona) y en parte por bloqueante externo (Meta Business Verification requiere RUC).

**Impacto:** ninguno. El codigo hace `logger.warn` si faltan tokens. No rompe build ni runtime.

**Decision:** conservar la plomeria. Costo de mantener: nulo. Costo de reescribir: alto. Si PanFree obtiene RUC y activa Meta Business API, el codigo ya esta.

### DOC-006 - Instagram Graph API: endpoints rotos con UI visible

**Descripcion:** los endpoints `publish-instagram` y `programar-publicacion` intentan publicar en Instagram via Graph API, pero sin tokens en Vercel fallan. Los botones del panel admin siguen visibles.

**Causa:** mismo bloqueante externo (Meta Business Verification). El codigo no valida tokens antes de llamar, entonces el error surge en runtime.

**Impacto:** medio. El admin ve un error critico si intenta usar el boton. No afecta clientes.

**Mitigacion S17-B (opcional):** deshabilitar los botones del panel admin con mensaje informativo. Fix de UI, no de backend.

**Decision:** conservar los endpoints. Deshabilitar la UI (si se decide hacerlo, en commit aparte).

### DOC-007 (padre) - Bloqueante: Meta Business Verification requiere RUC

**Descripcion:** Meta (Facebook/Instagram/WhatsApp Business) requiere verificacion de empresa con documentacion fiscal para activar APIs en modo produccion. PanFree no tiene RUC.

**Impacto:** bloquea Meta WhatsApp Cloud API, Instagram Graph API, Meta Ads API, Messenger, y cualquier futura integracion Meta.

**Causa:** externa. No hay fix tecnico posible.

**Mitigacion:** ninguna por ahora. Los servicios Meta quedan sin activar hasta que PanFree obtenga RUC.

**Condicion de revision:** si al **2027-04-15** (6 meses) no se ha obtenido RUC ni iniciado la verificacion Meta Business, revisar si vale la pena eliminar la plomeria para simplificar el codigo.

---

## 4. Decision arquitectonica (S17)

**La plomeria de Meta se conserva.** Motivos:

1. Costo de mantenimiento: nulo.
2. Costo de reescritura: alto (~500 lineas de codigo + templates + endpoints).
3. La decision de activar Meta Business API esta diferida indefinidamente. No hay apuro.

**Excepcion (si aplica):** la UI de Instagram (`AutomationPanel.jsx`, `DecisionPanel.jsx`, `page.js`) puede ocultarse con un mensaje "Pendiente verificacion Meta Business". Es un fix de UX, no un cambio de arquitectura.

---

## 5. Plan futuro

### Corto plazo (S17-S18)

- [ ] (Opcional, S17-B) Ocultar botones de Instagram en el panel admin.
- [ ] Registrar el numero de WhatsApp `595984589845` como constante centralizada (F3, deuda de mantenibilidad).

### Mediano plazo (S18+)

- [ ] Auditar `supabase/functions/send-whatsapp/index.ts` (Edge Function).
- [ ] Revisar si la tabla `instagram_posts` tiene filas (evidencia de uso historico).
- [ ] Documentar el canal de WhatsApp en docs/operations/ENVIRONMENT.md.

### Largo plazo (si hay RUC)

- [ ] Activar Meta Business Verification.
- [ ] Crear app en developers.facebook.com.
- [ ] Crear System User + tokens permanentes.
- [ ] Activar WhatsApp Cloud API + Instagram Graph API.
- [ ] Migrar todo a cuenta [S] system.panfree.
- [ ] Actualizar `.env.example`, Vercel, y documentar en Bitwarden.

### Condicion de revision

Si al **2027-04-15** no hay RUC:
- Evaluar si eliminar la plomeria Meta.
- Simplificar el codigo: borrar `whatsapp.js`, `whatsapp-templates.js`, endpoints, y el env vars asociado.

---

## 6. Archivos afectados

**Backend:**
- `src/lib/whatsapp.js`
- `src/lib/whatsapp-templates.js`
- `src/app/api/send-whatsapp/route.js`
- `src/app/api/send-whatsapp-team/route.js`
- `src/app/api/admin/marketing/publish-instagram/route.js`
- `src/app/api/admin/marketing/programar-publicacion/route.js`

**Frontend:**
- `src/app/admin/marketing/components/AutomationPanel.jsx`
- `src/app/admin/marketing/components/DecisionPanel.jsx`
- `src/app/admin/marketing/page.js`
- `src/app/admin/marketing/services/instagramService.js`

**Config:**
- `.env.example` (secciones Meta WhatsApp, Twilio, Instagram)
- `docs/operations/ROTACION-CLAVES.md`
- `docs/operations/PLAN-DE-TRABAJO.md`
- `docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md`

---

## 7. Referencias

- [Tracking de hallazgos](./06-hallazgos-tracking.md)
- [ROTACION-CLAVES](../../operations/ROTACION-CLAVES.md)
- [PLAN-DE-TRABAJO](../../operations/PLAN-DE-TRABAJO.md)
- [ENVIRONMENT](../../operations/ENVIRONMENT.md)