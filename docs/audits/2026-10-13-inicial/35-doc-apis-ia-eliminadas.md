# DOC-013: APIs IA secundarias - eliminadas de Vercel

**Fecha:** 2026-10-16 (S18)
**Estado:** Cerrado
**Tarea:** F2-13
**Relacionado:** DOC-008 (seccion Marketing), DOC-012 (secrets internos)

---

## 1. Contexto

F2-13 "Auditar APIs IA secundarias" asumia que era necesario auditar
las 11-13 APIs IA que existian en Vercel desde hace 53 dias.

En Vercel existian 13 variables de APIs IA:

- ANTHROPIC_API_KEY
- MISTRAL_API_KEY
- DEEPSEEK_API_KEY
- COHERE_API_KEY
- GROQ_API_KEY
- CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_KEY
- POLLINATIONS_API_KEY
- HF_API_KEY
- AIHUBMIX_API_KEY
- LEONARDO_API_KEY
- AGNES_API_KEY
- REPLICATE_API_TOKEN

Tambien existia NEXA_API_KEY en `.env.example` y en codigo,
pero nunca se configuro en Vercel.

---

## 2. Evidencia

### 2.1 Auditoria de codigo (script 56)

Se encontraron 45 coincidencias en 2 archivos:

- src/app/api/admin/marketing/generar-contenido/route.js
- src/app/api/admin/marketing/generar-imagen-cloudinary/route.js

**Todos** los usos estan dentro de la seccion Marketing.

APIs con referencias en codigo (12):
ANTHROPIC, MISTRAL, DEEPSEEK, COHERE, GROQ, CLOUDFLARE_ACCOUNT_ID,
CLOUDFLARE_API_KEY, HF, AIHUBMIX, LEONARDO, AGNES, NEXA.

APIs sin referencias en codigo (2):
POLLINATIONS, REPLICATE.

### 2.2 Contexto de la seccion Marketing

DOC-008 (auditoria S17) concluyo que la seccion Marketing:

- No se usa en produccion.
- No crea contenido util.
- No publica.
- Duplica funcionalidad existente (promos por producto, cupones).
- Tiene ~8.100 lineas, con ~5.500-6.500 candidatas a retiro.

Las 12 APIs "usadas en codigo" estan dentro de ese modulo inerte.
No hay ningun consumidor real de esas APIs.

---

## 3. Analisis

Los 3 grupos de APIs IA son todos plomeria inerte:

1. **12 APIs en codigo de Marketing**: referenciadas unicamente en el
   modulo Marketing que no se usa. Mismo patron que DOC-008.
2. **2 APIs sin referencias**: POLLINATIONS y REPLICATE. Cero uso.
3. **NEXA_API_KEY**: referenciada en codigo Marketing pero nunca
   configurada en Vercel.

Conclusion: ninguna de las 13 APIs IA tiene un consumidor real en
produccion. Todas son residuo del setup inicial de Marketing.

---

## 4. Decision

F2-13 se reformula a **No aplica** (no hay APIs activas que rotar).

Se eliminan las 13 APIs IA de Vercel (Production + Preview).

Razon:

- No aporta rotarlas (no hay quien las use).
- No aporta conservarlas (son keys de pago en su mayoria, sin uso).
- Coherencia con DOC-008: si Marketing se retira, sus keys se van con el.

**NO se toca el codigo de Marketing en S18.** El retiro del modulo
(incluyendo las referencias a APIs IA) queda pendiente segun DOC-008.

---

## 5. Acciones ejecutadas

- [x] Auditoria de codigo (script 56).
- [x] Eliminado ANTHROPIC_API_KEY de Vercel (prod + preview).
- [x] Eliminado MISTRAL_API_KEY de Vercel (prod + preview).
- [x] Eliminado DEEPSEEK_API_KEY de Vercel (prod + preview).
- [x] Eliminado COHERE_API_KEY de Vercel (prod + preview).
- [x] Eliminado GROQ_API_KEY de Vercel (prod + preview).
- [x] Eliminado CLOUDFLARE_ACCOUNT_ID de Vercel (prod + preview).
- [x] Eliminado CLOUDFLARE_API_KEY de Vercel (prod + preview).
- [x] Eliminado POLLINATIONS_API_KEY de Vercel (prod + preview).
- [x] Eliminado HF_API_KEY de Vercel (prod + preview).
- [x] Eliminado AIHUBMIX_API_KEY de Vercel (prod + preview).
- [x] Eliminado LEONARDO_API_KEY de Vercel (prod + preview).
- [x] Eliminado AGNES_API_KEY de Vercel (prod + preview).
- [x] Eliminado REPLICATE_API_TOKEN de Vercel (prod + preview).
- [x] .env.example: seccion APIS IA marcada como ELIMINADAS.
- [x] Tracking: DOC-013 registrado.

---

## 6. Pendiente futuro (no S18)

Las referencias a estas APIs siguen en el codigo de Marketing:

- src/app/api/admin/marketing/generar-contenido/route.js
- src/app/api/admin/marketing/generar-imagen-cloudinary/route.js

**Plan:** se retiran junto con el resto del modulo Marketing segun
DOC-008 (31-doc-008-seccion-marketing.md).

**NO se crea tarea nueva en el PLAN.** DOC-008 ya cubre el retiro
completo de Marketing.

---

## 7. Referencias

- Script: scripts/docs/56-auditar-apis-ia.ps1
- Doc relacionado: 31-doc-008-seccion-marketing.md (DOC-008)
- Doc relacionado: 34-doc-secrets-internos-plomeria-inerte.md (DOC-012)
- Tracking: 06-hallazgos-tracking.md
- PLAN: docs/operations/PLAN-DE-TRABAJO.md (F2-13)