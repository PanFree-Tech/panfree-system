# DOC-008 - Seccion Marketing sin uso real

**Fecha:** 2026-10-15 (S17)
**Autor:** Pedro J. Pirovani
**Estado:** Abierto
**Severidad:** Baja (deuda de limpieza, no bug ni seguridad)
**Tipo:** Auditoria + plan de revision

---

## 1. Resumen ejecutivo

La seccion **Marketing** (`/admin/marketing`) es la seccion mas grande del panel admin en terminos de codigo: **~8.100 lineas** entre frontend y endpoints. Fue construida entre agosto y octubre de 2026 como un "asistente de marketing con IA".

**Nadie la usa.** Confirmado por el responsable del proyecto. El motivo principal es que **no hace lo que el usuario esperaba**: no crea contenido de forma usable, no publica, y su flujo no coincide con el flujo real de marketing de PanFree.

Adicionalmente, **duplica funcionalidad ya existente** en otras partes del sistema (promociones por producto, cupones de descuento).

**Decision S17:** documentar, no tocar codigo. Plan de revision futura con criterio ya definido: **retirar todo lo que no sirve.**

---

## 2. Inventario de la seccion

### 2.1 Frontend (`src/app/admin/marketing/`)

| Archivo | Lineas |
|---|---|
| `page.js` | 1406 |
| `components/DecisionPanel.jsx` | 555 |
| `styles/marketing.module.css` | 486 |
| `utils/canvasUtils.js` | 463 |
| `components/RulesManager.jsx` | 453 |
| `components/EventCalendar.jsx` | 444 |
| `components/AutomationPanel.jsx` | 323 |
| `components/ScheduledPosts.jsx` | 188 |
| `hooks/useCanvasRenderer.js` | 159 |
| `services/instagramService.js` | 116 |
| `hooks/useMarketingState.js` | 100 |
| `services/geminiService.js` | 78 |
| `utils/colorSchemes.js` | 59 |
| `hooks/useSupabaseProducts.js` | 50 |
| `utils/templates.js` | 46 |
| `utils/formats.js` | 31 |
| **Total frontend** | **~4.955** |

### 2.2 Backend (`src/app/api/admin/marketing/`)

| Archivo | Lineas |
|---|---|
| `generar-imagen-cloudinary/route.js` | 964 |
| `generar-contenido/route.js` | 788 |
| `decidir-promocion/route.js` | 352 |
| `programar-publicacion/route.js` | 247 |
| `actualizar-capacidad/route.js` | 146 |
| `analizar-resultados/route.js` | 145 |
| `consultar-disponibilidad/route.js` | 142 |
| `publish-instagram/route.js` | 138 |
| `test-email/route.js` | 81 |
| `generate-caption/route.js` | 77 |
| `upload-image/route.js` | 54 |
| **Total backend** | **~3.134** |

**Total seccion Marketing: ~8.100 lineas.**

---

## 3. Por que no se usa

Confirmado por el responsable:

1. **No crea contenido util.** El usuario esperaba que la seccion generara contenido publicable. No lo hace de forma usable.
2. **No hace nada.** Mas alla de la generacion (que no sirve), no cumple con ninguna funcion operativa.
3. **Nadie la usa.** Ni el responsable, ni el equipo.

### Contexto historico

- **2026-08-19** (`dd83cbf0`): primer commit "add AI-powered marketing tool".
- **2026-08-20** (`f0c543cd`): "Sistema de Marketing Inteligente implementado".
- **2026-09 / 2026-10**: commits de mantenimiento, sin features nuevas.
- **Total de uso real:** practicamente nulo.

---

## 4. Duplicacion de funcionalidad

La seccion Marketing **duplica** funcionalidad ya existente en otras partes del sistema:

### 4.1 Promociones por producto (`/admin/productos`)

- Tabla productos con campos: `en_promocion`, `precio_promocion`, `fecha_inicio_promo`, `fecha_fin_promo`.
- Boton dedicado "Gestionar Promociones" en `/admin/productos/page.js`.
- Componente `PromocionForm.jsx` para crear/editar.
- Producto destacado con temporizador en tiempo real (`ProductCard.js:95`, `ProductoCliente.js:7`).

**Esto funciona y se usa.** Cubre el caso de "producto X en promo con precio especial".

### 4.2 Cupones de descuento (`/admin/cupones`)

- Tabla `cupones_descuento`.
- CRUD completo en `/admin/cupones/page.js`.
- Aplicacion en el checkout (`checkout/page.js:299`).
- Campos: `tipo_descuento` (porcentaje / fijo), `valor_descuento`.

**Esto funciona.** Cubre el caso de "cupon de descuento aplicable en checkout".

### 4.3 Conclusion

La seccion Marketing intento ser un "sistema inteligente" que decidiera que promocionar y generara contenido. **Pero las dos funcionalidades utiles ya existen por separado** en `/admin/productos` y `/admin/cupones`.

Lo que queda en la seccion Marketing es:

- Generacion de imagenes (canvas + Cloudinary) â€” sin uso.
- Generacion de contenido IA (Gemini + cascada) â€” sin uso.
- Decision de promocion (`decidir-promocion`) â€” sin uso.
- Reglas (`reglas_promocion`) â€” sin uso.
- Eventos (`EventCalendar`) â€” sin uso.
- Instagram API (ya roto, ver DOC-006).

---

## 5. Candidatos a retiro (verificacion pendiente)

**Criterio del responsable:** retirar todo lo que no sirve. Caso concreto ya definido: **retirar la parte de imagenes.**

| # | Componente | Archivos principales | Lineas aprox | Uso | Propuesta |
|---|---|---|---|---|---|
| 1 | Generacion de imagenes | `canvasUtils.js`, `useCanvasRenderer.js`, `colorSchemes.js`, `templates.js`, `generar-imagen-cloudinary/route.js`, `upload-image/route.js` | ~1.700 | No | **RETIRAR** |
| 2 | Publicacion en Instagram | `publish-instagram/route.js`, `programar-publicacion/route.js`, `instagramService.js`, `ScheduledPosts.jsx` | ~690 | No (roto) | **RETIRAR** (DOC-006) |
| 3 | Generacion de contenido IA | `geminiService.js`, `generate-caption/route.js`, `generar-contenido/route.js` | ~940 | No | **REVISAR** |
| 4 | Cascada de 8 motores IA | Fragmentos en `generar-contenido/route.js` | ~300 | No | **REVISAR** |
| 5 | Decision de promocion | `DecisionPanel.jsx`, `decidir-promocion/route.js`, `analizar-resultados/route.js` | ~1.050 | No | **REVISAR** (duplica promos por producto) |
| 6 | Calendario de eventos | `EventCalendar.jsx` | ~445 | No | **RETIRAR** |
| 7 | Reglas de automatizacion | `RulesManager.jsx` | ~455 | No | **RETIRAR** |
| 8 | Panel de automatizacion | `AutomationPanel.jsx` | ~325 | No | **RETIRAR** |
| 9 | Pagina principal | `page.js` | ~1.405 | No | **REVISAR** |
| 10 | Endpoints auxiliares | `test-email/route.js`, `actualizar-capacidad/route.js`, `consultar-disponibilidad/route.js` | ~370 | Parcial | **REVISAR** |

**Candidato total a retiro: ~5.500-6.500 lineas.**

---

## 6. Bloqueantes previos al retiro

1. **Imports cruzados.** Verificar si otros archivos importan `canvasUtils`, `geminiService`, etc.
2. **Referencias desde `/admin/ayuda/marketing/page.js`.** Hoy tiene 2 botones que redirigen a `/admin/marketing` (lineas 649 y 674).
3. **Referencias desde el menu admin.**
   - `src/app/admin/layout.js:197`
   - `src/app/admin/page.js:575`
4. **Tablas Supabase asociadas:**
   - `reglas_promocion` (RulesManager + decidir-promocion)
   - `promociones_historico` (analizar-resultados + programar-publicacion)
   - `instagram_posts` (publish-instagram + programar-publicacion)
   - `cupones_descuento` â€” NO se toca (activo)
5. **Migraciones SQL.** Quedan (no se revierten).
6. **`/admin/ayuda/marketing/page.js`.** Decidir si se retira o se reescribe.

---

## 7. Decision S17

**No se toca codigo en S17.**

1. **Documentar** (este archivo).
2. **Ocultar** la seccion del menu admin (S17-B, commit separado).
3. **Revisar** en 6 meses (ver seccion 10).

**No se borra nada en S17.**

---

## 8. Propuesta de tratamiento (backlog)

Sesion dedicada "Limpieza seccion Marketing", dividida en pasos verificables:

1. **Paso 0:** auditar imports cruzados con script de analisis.
2. **Paso 1:** retirar bloque de generacion de imagenes (decision ya tomada).
3. **Paso 2:** retirar bloque de Instagram (ya roto, DOC-006).
4. **Paso 3:** decidir sobre generacion de contenido IA (Gemini + cascada).
5. **Paso 4:** decidir sobre DecisionPanel + decidir-promocion.
6. **Paso 5:** retirar EventCalendar, RulesManager, AutomationPanel.
7. **Paso 6:** limpiar `/admin/marketing/page.js`.
8. **Paso 7:** limpiar menu admin (`layout.js`, `admin/page.js`) y `/admin/ayuda/marketing/page.js`.

**Cada paso, un commit.** Verificacion: `npm run build` + smoke test del admin.

---

## 9. Backlog futuro (nota al pie)

**Idea registrada por el responsable (S17):** promociones de descuento simples visibles en el `CartSidebar`.

**Contexto:**

- Hoy las promos por producto se ven en `ProductCard` y `ProductoCliente`.
- El `CartSidebar` usa `useCart()` y muestra el `total` sin aplicar descuentos.
- Idea: sistema simple de promociones que muestre descuento en el carrito.

**Estado:** idea registrada, sin diseno. No es prioridad S17. Requiere sesion dedicada (S18+).

**Nota:** puede construirse sobre el sistema existente de promos por producto, o como sistema nuevo chico (~400-600 lineas). Decision pendiente.

---

## 10. Condicion de revision

Si al **2027-04-15** (6 meses) no se ha ejecutado la sesion de limpieza, revisar este documento y decidir:

- **Ejecutar la limpieza** (retirar codigo segun seccion 8).
- **Mantener el codigo inerte** y actualizar la fecha de revision.
- **Eliminar todo** de una sola vez.

---

## 11. Referencias

- [Tracking de hallazgos](./06-hallazgos-tracking.md)
- [DOC-005/006/007 - Meta plomeria inerte](./30-doc-meta-plomeria-inerte.md)
- [ROTACION-CLAVES](../../operations/ROTACION-CLAVES.md)
- [PLAN-DE-TRABAJO](../../operations/PLAN-DE-TRABAJO.md)
