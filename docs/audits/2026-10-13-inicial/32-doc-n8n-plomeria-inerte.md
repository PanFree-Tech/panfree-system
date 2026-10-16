# DOC-009: n8n - plomeria inerte

**Fecha:** 2026-10-16 (S18)
**Estado:** Cerrado
**Tarea:** F2-10
**Relacionado:** DOC-005 (Meta WhatsApp + Twilio)

---

## 1. Contexto

n8n aparecia en el PLAN-DE-TRABAJO como F2-10: "Rotar n8n webhook token".
Se asumia que n8n estaba activo en produccion, con 3 variables en Vercel
(N8N_WEBHOOK_URL, N8N_WEBHOOK_TOKEN, N8N_INCOMING_TOKEN).

Antes de rotar, se ejecuto una auditoria (script 52) para confirmar el uso real.

---

## 2. Evidencia

### 2.1 Auditoria de codigo (src/)

Se encontraron 20 coincidencias en 5 archivos. Los siguientes son los unicos
que usan las env vars de n8n:

| Archivo | Linea | Env var | Uso |
|---|---|---|---|
| src/app/api/notificar-pedido/route.js | 60 | N8N_WEBHOOK_TOKEN | Lee el token para autenticar el request saliente |
| src/app/api/notificar-pedido/route.js | 128 | N8N_WEBHOOK_URL | Lee la URL del webhook. Envuelto en if (n8nUrl) |
| src/app/api/webhook-pedido/route.js | 27 | N8N_INCOMING_TOKEN | Lee el token para validar requests entrantes de n8n |
| src/app/api/send-whatsapp-team/route.js | 44 | N8N_WEBHOOK_TOKEN | Dentro de validTokens (fallback) |

Los otros 2 archivos (PedidoModal.js y checkout/page.js) solo contienen
comentarios y logs que mencionan n8n. No hacen process.env.N8N_*.

### 2.2 Auditoria de Vercel (vercel env ls)

Las 3 variables n8n NO EXISTEN en Vercel (ni Production ni Preview):

- N8N_WEBHOOK_URL: no existe.
- N8N_WEBHOOK_TOKEN: no existe.
- N8N_INCOMING_TOKEN: no existe.

---

## 3. Analisis

La integracion con n8n es plomeria inerte, con el mismo patron que
Meta WhatsApp y Twilio (DOC-005):

1. **notificar-pedido**: tiene if (n8nUrl) { fetch(...) }. Sin N8N_WEBHOOK_URL,
   no llama a n8n. La ruta funciona igual (los demas canales siguen).
2. **webhook-pedido**: lee N8N_INCOMING_TOKEN, que es undefined. La ruta
   existe pero rechaza todas las requests entrantes de n8n.
3. **send-whatsapp-team**: N8N_WEBHOOK_TOKEN esta en un array de validTokens,
   pero sin la env var queda solo con NEXT_PUBLIC_API_TOKEN (si existe).

Conclusion: n8n nunca se activo en produccion. El codigo esta preparado
para usarlo, pero las credenciales nunca se crearon.

---

## 4. Decision

F2-10 se reformula a **No aplica**.

Razon: no hay tokens productivos que rotar. La rotacion solo aplica a
credenciales activas. Rotar tokens que no existen carece de sentido.

Se conserva el codigo inerte (mismo criterio que DOC-005). El costo de
mantener la plomeria es nulo; el costo de reescribir si se activa n8n
seria alto.

---

## 5. Acciones

- [x] Auditoria de codigo (script 52).
- [x] Auditoria de Vercel (vercel env ls).
- [ ] PLAN-DE-TRABAJO.md: F2-10 reformulada a "No aplica".
- [ ] .env.example: seccion n8n marcada como "NO USADO".
- [ ] Tracking: DOC-009 registrado.

---

## 6. Referencias

- Script: scripts/docs/52-auditar-n8n.ps1
- Reporte: docs/audits/2026-10-13-inicial/32-audit-n8n.txt (temporal)
- Doc relacionado: 30-doc-meta-plomeria-inerte.md (DOC-005)
- Tracking: 06-hallazgos-tracking.md