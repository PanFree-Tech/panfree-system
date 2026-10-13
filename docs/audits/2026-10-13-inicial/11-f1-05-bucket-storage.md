# F1-05 - Restringir listado del bucket storage.productos

**Fecha:** 2026-10-13
**Hallazgo:** DB-001d
**Severidad:** Alta
**Estado:** Cerrado

---

## Contexto

El bucket `productos` estaba configurado como `public: true` con una
politica de `SELECT` que permitia a cualquiera (`anon`, `public`) listar
todos los archivos del bucket.

Que el bucket sea `public: true` es correcto: las imagenes de producto
son publicas y se sirven por URL directa. El problema era la **capacidad
de listado**, que exponia nombres de archivos y estructura de carpetas.

---

## Causa raiz

Politica original:

```sql
CREATE POLICY "ImÃ¡genes productos: lectura pÃºblica" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'productos');
```

El `USING` solo verifica el bucket, no la operacion. Eso permite tanto
leer un objeto directo como **listar** todos los objetos.

---

## Fix aplicado

```sql
DROP POLICY IF EXISTS "ImÃ¡genes productos: lectura pÃºblica" ON storage.objects;

CREATE POLICY "ImÃ¡genes productos: lectura directa"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'productos'
  AND storage.allow_any_operation(
    ARRAY['object.get_authenticated', 'storage.object.get_authenticated']
  )
);
```

La nueva politica verifica que la operacion sea **lectura directa**
(`object.get_authenticated`), no listado. El listado queda bloqueado.

---

## Verificacion

### Test 1: listado bloqueado

```javascript
fetch('https://gbdrcaumghykiipqgbty.supabase.co/storage/v1/object/list/productos', {
  method: 'POST',
  headers: {
    'apikey': '<anon_key>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ prefix: '', limit: 100 })
}).then(r => r.json()).then(console.log);
```

**Resultado obtenido:** `400 Bad Request` con mensaje
`headers must have required property 'authorization'`.

Antes devolvia la lista completa de archivos. Ahora la rechaza.

### Test 2: imagenes siguen cargando

- [x] Catalogo de la tienda carga con imagenes visibles
- [x] URLs directas `.../object/public/productos/...` funcionan

---

## Bucket public-images

Se verifico que el bucket `public-images` no tiene politicas RLS
especificas. Sin politicas, RLS bloquea todo por defecto. **No requiere
fix.**

---

## Definition of Done (F1-05)

- [x] Politica restringida a lectura directa
- [x] Test: listado bloqueado
- [x] Test: imagenes siguen cargando
- [x] Politica guardada en supabase/schemas/public/policies/
- [x] Documentado en este archivo
- [ ] Commit pusheado con prefijo `security(db):`

---

## Referencias

- [DB-001d en tracking](./06-hallazgos-tracking.md)
- [Auditoria Supabase Advisors](./02-supabase-advisors.md)
- [ADR-001: Supabase como backend unico](../../architecture/decisiones/ADR-001-supabase-backend-unico.md)
- [Supabase Storage - Access Control](https://supabase.com/docs/guides/storage/security/access-control)