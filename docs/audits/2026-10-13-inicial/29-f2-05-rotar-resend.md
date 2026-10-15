# F2-05 + SEC-021 + DOC-004 - Migracion y rotacion de Resend

**Fecha:** 2026-10-15
**Tareas:** F2-05 (rotar Resend API key) + SEC-021 (keys huerfanas) + DOC-004 (cuenta incorrecta)
**Estado:** Cerrado
**Sesion:** 16

---

## 1. Contexto

Al iniciar S16, Resend era el proximo servicio a rotar (F2-05).
Durante la revision previa se detectaron dos hallazgos adicionales:

### SEC-021: 2 API keys activas sin trazabilidad

El dashboard de Resend (cuenta `contacto.panfree@gmail.com`) mostraba
2 API keys activas, sin saber cual estaba en uso:

| # | Nombre | Permiso | Ultimo uso | Creada |
|---|---|---|---|---|
| 1 | Contacto - Panfree - Key Resend | Sending access | hace ~2 meses | 2mo ago |
| 2 | panfree-system-2026-08-14 | Full access | No activity | 2mo ago |

La key #2 era huerfana (sin uso desde su creacion) con permiso Full access.
Mismo patron que SEC-018 (Cloudinary) y SEC-019 (Gemini) en S15.

### DOC-004: cuenta incorrecta

El `.env.example` y `ROTACION-CLAVES.md` documentaban Resend bajo
cuenta [S] (`system.panfree`), pero la cuenta real era [C]
(`contacto.panfree`). Inconsistencia con la convencion de cuentas
del proyecto.

---

## 2. Decision

Migrar Resend completamente a `system.panfree` [S] (misma politica que
Supabase en F2-02 y Cloudinary en F2-03), rotar la key, y limpiar las
keys huerfanas. El dominio `panfree.fit` se mantiene registrado en
Spaceship (bajo `contacto.panfree`), pero la cuenta de Resend que
puede enviar emails pasa a ser `system.panfree`.

---

## 3. Plan de ejecucion

### 3.1 Creacion de cuenta nueva

- Cuenta nueva: `system.panfree@gmail.com` [S]
- Region: `sa-east-1` (Sao Paulo)
- Plan: Free

### 3.2 Transferencia del dominio (Claim)

Resend detecto que `panfree.fit` ya estaba activo en otra cuenta, y
ofrecio transferirlo via **Domain Claim**:

1. Resend genero un TXT de verificacion de propiedad:
   `resend-domain-verification=b8c4b698e797b697905b538bbd515d46`
2. Se agrego como TXT en `@` en Spaceship.
3. Resend verifico la propiedad y transfirio el dominio.

**Nota:** el registro TXT de verificacion debe ir en `@` (raiz),
no en un subdominio. El primer intento en `_resend` fallo.

### 3.3 Registros DNS actualizados en Spaceship

Resend cambio su infraestructura de envio (de Amazon SES a `forge.rmta.net`),
lo que requirio actualizar varios registros:

| Host | Tipo | Valor | Accion |
|---|---|---|---|
| `resend._domainkey` | TXT | `p=MIGf...Q4anf...` | Editado (DKIM nuevo) |
| `send` | MX | `feedback-smtp.sa-east-1.amazonses.com` | **Borrado** (obsoleto) |
| `send` | TXT | `v=spf1 include:amazonses.com ~all` | **Borrado** (obsoleto) |
| `rsend` | CNAME | `rsend-sae1.forge.rmta.net` | **Nuevo** |
| `send` | CNAME | `send.forge.rmta.net` | **Nuevo** |
| `@` | TXT | `resend-domain-verification=...` | Temporal (Claim) |

El DKIM nuevo cambio de formato: el anterior incluia `v=DKIM1; k=rsa;`,
el nuevo empieza directo con `p=`.

### 3.4 Verificacion del dominio

Resend verifico los 3 registros:

| Registro | Estado |
|---|---|
| DKIM (`resend._domainkey`) | verified |
| CNAME `rsend` | verified |
| CNAME `send` | verified |

El dominio `panfree.fit` quedo **fully verified** en `system.panfree`.

### 3.5 Creacion de la API key nueva

- Nombre: `panfree-production-2026-10-16`
- Permiso: `Sending access` (no Full access)
- Dominio: restringido a `panfree.fit`
- Guardada en Bitwarden: item `Resend - Produccion`

### 3.6 Actualizacion de Vercel

Variable `RESEND_API_KEY` actualizada en:
- Production
- Preview

Redeploy manual ejecutado. Deploy en estado Ready.

### 3.7 Verificacion end-to-end

**Test de mail real** ejecutado desde el endpoint
`/api/admin/marketing/test-email`:

```json
{
  "success": true,
  "mensaje": "Correo de prueba enviado exitosamente a system.panfree@gmail.com",
  "id": "01a13fbf-2256-79ea-8209-cd91b9767647",
  "simulated": false,
  "from": "PanFree <contacto@panfree.fit>"
}
```

**Verificacion en Resend Logs** (cuenta `system.panfree`):

- Endpoint: `POST /emails`
- Status: `200`
- API key usada: `panfree-production-2026-10-16`
- Status de entrega: `delivered`

**Verificacion en Gmail:** el mail llego a la bandeja de
`system.panfree@gmail.com` con el diseÃ±o correcto de PanFree.

### 3.8 Limpieza de keys viejas

En la cuenta `contacto.panfree` se revocaron:

- `Contacto - Panfree - Key Resend` (Sending access) - **revocada**
- `panfree-system-2026-08-14` (Full access) - **revocada**

La lista de API keys en `contacto.panfree` quedo vacia.

---

## 4. Resultado

### 4.1 Resend

| Aspecto | Antes | Despues |
|---|---|---|
| Cuenta | contacto.panfree [C] | system.panfree [S] |
| API keys activas | 2 (1 activa, 1 huerfana) | 1 (activa) |
| Key activa | Contacto - Panfree - Key Resend | panfree-production-2026-10-16 |
| Permiso | Sending access | Sending access |
| Dominio | verificado | verificado |

### 4.2 DNS (Spaceship)

| Registro | Antes | Despues |
|---|---|---|
| DKIM | clave vieja (formato `v=DKIM1; k=rsa; p=...`) | clave nueva (`p=...`) |
| SPF MX | `feedback-smtp.sa-east-1.amazonses.com` | **eliminado** |
| SPF TXT | `v=spf1 include:amazonses.com ~all` | **eliminado** |
| CNAME `rsend` | no existia | `rsend-sae1.forge.rmta.net` |
| CNAME `send` | no existia | `send.forge.rmta.net` |

### 4.3 Bitwarden

Item `Resend - Produccion` creado con:
- Campo Password: valor de la API key activa.
- Nota completa con estado de rotacion y detalle de migracion.

### 4.4 Documentacion

- `.env.example`: Supabase, Cloudinary y Resend reflejan cuenta [S].
- `ROTACION-CLAVES.md`: item Resend marcado como completado.
- `PLAN-DE-TRABAJO.md`: F2-05, F2-02 y F2-06 marcados como OK.
- Tracking de hallazgos: SEC-021 y DOC-004 cerrados.

---

## 5. DoD

### F2-05 (rotacion)
- [x] Cuenta nueva creada en system.panfree [S].
- [x] Dominio transferido via Claim.
- [x] Registros DNS actualizados en Spaceship.
- [x] Dominio verificado por Resend.
- [x] API key nueva creada con scope minimo (Sending access, scoped).
- [x] Key guardada en Bitwarden.
- [x] Vercel actualizado (Production + Preview).
- [x] Redeploy ejecutado.
- [x] Test de mail real: OK (delivered).
- [x] Verificacion en Resend Logs: key nueva confirmada.

### SEC-021 (keys huerfanas)
- [x] Diagnostico completo (2 keys identificadas).
- [x] Revocacion de las 2 keys viejas.
- [x] Verificacion: lista vacia en contacto.panfree.

### DOC-004 (cuenta incorrecta)
- [x] Migracion completa de [C] a [S].
- [x] `.env.example` actualizado.
- [x] Bitwarden actualizado.

---

## 6. Deuda tecnica derivada

- F2-04 (rotar Cloudinary API secret): pendiente. El hallazgo SEC-018
  (keys huerfanas) ya se cerro en S15, pero la rotacion de la key
  activa sigue pendiente.
- La cuenta `contacto.panfree` en Resend queda activa pero sin keys,
  sin dominio. Se puede borrar definitivamente (opcional).

---

## 7. Referencias

- [SEC-021 en tracking](./06-hallazgos-tracking.md)
- [DOC-004 en tracking](./06-hallazgos-tracking.md)
- [F2-05 en Plan de Trabajo](../../operations/PLAN-DE-TRABAJO.md)
- [ROTACION-CLAVES](../../operations/ROTACION-CLAVES.md)
- [Runbook general de rotacion](../../operations/ROTACION-CLAVES.md)
- [Politica de rotacion sin legacy](../../operations/SISTEMA-DE-TRABAJO.md)

---

## 8. Aprendizajes

- **Resend ya no usa Amazon SES.** Migro a `forge.rmta.net`. Los
  registros DNS cambiaron respecto a la documentacion vieja.
- **Domain Claim vs Domain Add.** Cuando el dominio esta en otra
  cuenta Resend, no se puede agregar directo: hay que hacer Claim
  con un TXT en `@`.
- **El TXT de Claim va en `@`**, no en un subdominio. El primer
  intento en `_resend` fallo.
- **DKIM cambio de formato.** Antes: `v=DKIM1; k=rsa; p=...`.
  Ahora: solo `p=...`.
- **Verificar en Logs de Resend por API key** es la forma mas
  confiable de confirmar que la app usa la key nueva.

---

**Fin del documento.**
