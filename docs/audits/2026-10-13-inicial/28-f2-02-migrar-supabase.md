# F2-02 - MigraciÃ³n de Supabase a Publishable/Secret keys

**Fecha:** 2026-10-15
**Tarea:** F2-02 (Fase 2: RotaciÃ³n de claves)
**Estado:** Cerrado
**Sesion:** 15

---

## 1. Contexto

Supabase estÃ¡ deprecando las claves legacy (`anon` y `service_role` en formato JWT)
a favor del nuevo sistema de claves asimÃ©tricas (`sb_publishable_...` y `sb_secret_...`).
Estas nuevas claves permiten rotaciÃ³n individual sin invalidar sesiones de usuarios.

## 2. DecisiÃ³n

Migrar completamente al nuevo sistema de claves, deshabilitando las legacy.
Esto requiere:
1. Crear nuevas claves Publishable y Secret.
2. Actualizar las variables de entorno en Vercel.
3. Ajustar el cÃ³digo si existÃ­a validaciÃ³n estricta del formato JWT legacy.
4. Deshabilitar las claves legacy una vez verificada la migraciÃ³n.

## 3. EjecuciÃ³n

### 3.1 CreaciÃ³n de claves nuevas
- Publishable: `panfree_public_2026_10_15`
- Secret: `panfree_server_2026_10_15`

### 3.2 ActualizaciÃ³n de Vercel
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> nuevo valor `sb_publishable_...`
- `SUPABASE_SERVICE_ROLE_KEY` -> nuevo valor `sb_secret_...`

### 3.3 Fix en el cÃ³digo (Hallazgo colateral)
El archivo `src/lib/supabase.js` tenÃ­a una funciÃ³n `sanitizeSupabaseKey` que
validaba estrictamente el formato JWT (`eyJ...`). Se modificÃ³ para aceptar
ambos formatos durante la transiciÃ³n:

```javascript
const esJWT = clean.split('.').length === 3 && clean.length >= 50
const esPublishable = clean.startsWith('sb_publishable_')
if (!esJWT && !esPublishable) { throw new Error(...) }
```

**Commit del fix:** `e17110f6`

### 3.4 DeshabilitaciÃ³n de Legacy
Una vez verificado el funcionamiento en producciÃ³n, se deshabilitaron las
claves legacy `anon` y `service_role` desde el dashboard de Supabase.

## 4. VerificaciÃ³n

- âœ… Build de Vercel exitoso.
- âœ… Home, Login, Admin y operaciones de escritura funcionando.
- âœ… Supabase Advisors: 0 issues de seguridad o performance.
- âœ… Bitwarden actualizado con las nuevas claves y regiÃ³n `sa-east-1`.

## 5. DoD

- [x] Claves nuevas creadas y nombradas con convenciÃ³n.
- [x] Vercel actualizado con las nuevas claves.
- [x] CÃ³digo adaptado para aceptar formato `sb_publishable_`.
- [x] Redeploy exitoso y verificaciÃ³n end-to-end.
- [x] Claves legacy deshabilitadas en Supabase.
- [x] Bitwarden actualizado.
- [x] DocumentaciÃ³n de auditorÃ­a generada.

---

## 6. Referencias

- [Commit del fix](https://github.com/PanFree-Tech/panfree-system/commit/e17110f6)
- [GuÃ­a de migraciÃ³n de Supabase](https://supabase.com/docs/guides/getting-started/api-keys)
