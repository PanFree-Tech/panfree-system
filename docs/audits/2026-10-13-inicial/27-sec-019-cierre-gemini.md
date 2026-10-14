# SEC-019 + F2-06 - Rotacion y limpieza de keys de Gemini

**Fecha:** 2026-10-14
**Hallazgos:** SEC-019 (P2, Media) + F2-06 (rotacion)
**Estado:** Cerrado
**Sesion:** 15
**Origen:** Detectado en Sesion 14 (24-bugs-s14-gemini-y-otros.md).

---

## 1. Contexto

Durante la Sesion 14 se detecto que Google AI Studio mostraba
**4 API keys activas** sin trazabilidad de uso:

| # | Nombre | Proyecto | Creada |
|---|---|---|---|
| 1 | Default Gemini Key | gen-lang-client-0055191436 | 28 ago 2026 |
| 2 | Gemini API - Pagada | gen-lang-client-0840688115 | 23 ago 2026 |
| 3 | Gemini API Key | gen-lang-client-0840688115 | 22 ago 2026 |
| 4 | Default Gemini API Key | gen-lang-client-0840688115 | 14 ago 2026 |

Sin saber cual estaba en uso, rotar la key (F2-06) era riesgoso.

---

## 2. Analisis

### 2.1 Dos proyectos diferentes

- **gen-lang-client-0055191436:** 1 key (`Default Gemini Key`).
  Proyecto "nuevo" (28 ago 2026). Numero de proyecto: 7263344746.
- **gen-lang-client-0840688115:** 3 keys. Proyecto "viejo" (14-23 ago 2026).

### 2.2 Analisis de contexto

- El proyecto `...0055191436` tenia solo 1 key y la mas reciente.
  Sugiere que es el proyecto "curado" para produccion.
- El proyecto `...0840688115` tenia 3 keys (probablemente experimentos
  del setup inicial). La key `Gemini API - Pagada` sugiere una intencion
  de migrar al plan pago, pero las 3 seguian en Free tier.

### 2.3 Limitacion de la UI

AI Studio no muestra "Last used" ni usage por key en el plan Free.
Se decidio por inferencia (proyecto nuevo + key mas reciente +
nombre explicito).

---

## 3. Plan de limpieza + rotacion

### 3.1 Decision

**Limpieza (SEC-019):**
- Eliminar las 3 keys del proyecto `...0840688115` (huerfanas).
- Mantener `Default Gemini Key` como activa provisional.

**Rotacion (F2-06):**
- Crear key nueva `panfree-production-2026-rotated` en el proyecto
  `...0055191436`.
- Actualizar Vercel.
- Verificar.
- Eliminar la key vieja.

### 3.2 Orden de ejecucion

1. Eliminar 3 keys huerfanas (proyecto viejo).
2. Crear key nueva en el proyecto nuevo.
3. Guardar en Bitwarden (Produccion).
4. Actualizar Vercel `GEMINI_API_KEY`.
5. Redeploy.
6. Verificar con test empirico.
7. Eliminar key vieja.

---

## 4. Test empirico

### 4.1 Objetivo

Confirmar que el endpoint `/api/admin/marketing/generar-contenido`
(que usa Gemini + cascada multi-motor) funciona con la key nueva.

### 4.2 Procedimiento

1. Login como admin en https://panfree.fit/admin/marketing.
2. Abrir DevTools (F12) > Console.
3. Ejecutar script con POST a `/api/admin/marketing/generar-contenido`.
4. Verificar la respuesta.

### 4.3 Resultado (2026-10-14T21:03:15Z)

Se ejecutaron 3 requests casi simultaneos:

| # | Status | Resultado |
|---|---|---|
| 1 | 200 | OK con hook/caption |
| 2 | 200 | OK con hook/caption |
| 3 | 503 | Rate limit / motores saturados |

**Respuesta 1:**
```json
{
  "success": true,
  "content": {
    "hook": "El verdadero placer del pan artesanal, 100% libre de gluten...",
    "caption": "En Panfree redefinimos la experiencia..."
  }
}
```

**Interpretacion:** la key nueva funciona. El 503 del 3er request
es rate limit esperado en plan Free (3 requests en 3 ms).

---

## 5. Resultado final

### 5.1 AI Studio

| Proyecto | Keys antes | Keys despues |
|---|---|---|
| gen-lang-client-0055191436 | 1 | 1 (key nueva) |
| gen-lang-client-0840688115 | 3 | 0 (eliminadas) |
| **Total** | **4** | **1** |

La unica key activa es `panfree-production-2026-rotated`.

### 5.2 Bitwarden

Item `Gemini â€” Produccion` actualizado con la key nueva.

### 5.3 Vercel

Variable `GEMINI_API_KEY` actualizada + redeploy aplicado.

### 5.4 Produccion

Marketing IA funciona con la key nueva.

---

## 6. Conclusion

**SEC-019 + F2-06 cerrados.**

- 4 keys -> 1 key activa.
- Rotacion completa: key nueva operativa.
- Keys huerfanas eliminadas.
- Trazabilidad documentada.

---

## 7. DoD

### SEC-019 (trazabilidad)
- [x] Diagnostico completo (4 keys identificadas).
- [x] Analisis de proyectos.
- [x] Plan de limpieza definido.
- [x] Eliminacion de 3 keys huerfanas: OK.
- [x] Estado final documentado (1 key activa).
- [x] Tracking actualizado.

### F2-06 (rotacion)
- [x] Key nueva creada en proyecto correcto.
- [x] Guardada en Bitwarden (Produccion).
- [x] Vercel actualizado con key nueva.
- [x] Redeploy completado.
- [x] Verificacion end-to-end: marketing IA funciona.
- [x] Key vieja eliminada.
- [x] Documentacion completa (este archivo).

---

## 8. Referencias

- [SEC-019 en tracking](./06-hallazgos-tracking.md)
- [Hallazgo original en S14](./24-bugs-s14-gemini-y-otros.md)
- [Rotacion de claves](../../operations/ROTACION-CLAVES.md)
- [Plan de Trabajo](../../operations/PLAN-DE-TRABAJO.md) - F2-06
