# DOC-017: Service Worker cacheaba HTML viejo

**Fecha:** 2026-10-16 (S21)
**Severidad:** Alta (rompia la hidratacion del admin en clientes recurrentes)
**Estado:** Cerrado (commit `16ea5eec`)

---

## 1. Sintoma

En `www.panfree.fit/admin`, el HTML se renderizaba por SSR pero el JavaScript del admin no se hidrataba. Consecuencia:

- El boton "Activar notificaciones" no respondia.
- Los demas botones y modales quedaban inertes.
- La pagina se veia "cargada" pero no funcionaba.

En consola del navegador, `document.querySelectorAll('script[src]')` devolvia solo 5 scripts (el framework base):

```
chunks/2117-9878281027aa1bc7.js
chunks/fd9d1056-fc26ba6dd2679093.js
chunks/main-app-be3d940aef6bd3eb.js
chunks/polyfills-42372ed130431b0a.js
chunks/webpack-6b4bbaf8e8954304.js
```

Faltaban los chunks del admin:

```
chunks/app/admin/page-XXXX.js
chunks/app/admin/layout-XXXX.js
```

### Diagnostico

Comparacion clave:

| Metodo | Scripts en DOM | Que muestra |
|---|---|---|
| `view-source:www.panfree.fit/admin` | 13 | HTML del server (correcto) |
| `document` en Chrome normal | 5 | HTML servido por el SW (viejo) |
| `document` en Chrome incognito limpio | 16 | HTML del server (correcto) |

**Conclusion:** el Service Worker servia HTML viejo desde su cache. `view-source` bypassa el SW, por eso mostraba el HTML correcto.

---

## 2. Causa raiz

El `next.config.js` tenia:

```js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  customWorkerDir: 'worker',
  // NO habia runtimeCaching custom
})
```

**Problema:** sin `runtimeCaching` custom, `next-pwa` aplica el default, que cachea HTML (`request.destination === 'document'`) con estrategia `CacheFirst`. Consecuencia:

1. El usuario visita `/admin` por primera vez.
2. El SW guarda el HTML en cache.
3. Se hace un nuevo deploy con HTML distinto (chunks con hashes nuevos).
4. El usuario vuelve a `/admin`. El SW responde con el HTML viejo cacheado.
5. El HTML viejo referencia chunks viejos que ya no existen en el edge.
6. Los chunks devuelven 404.
7. La app no hidrata.

Ademas, faltaba `clientsClaim: true`. Sin eso, el SW nuevo no toma control de las pestañas ya abiertas hasta que se cierren todas.

---

## 3. Fix

Commit: `16ea5eec`

### 3.1 Agregar `clientsClaim: true`

```diff
 const withPWA = require('next-pwa')({
   dest: 'public',
   register: true,
   skipWaiting: true,
+  clientsClaim: true,
   customWorkerDir: 'worker',
```

### 3.2 Agregar `runtimeCaching` custom

```diff
   publicExcludes: ['!npl/**/*', '!api/**/*'],
+  runtimeCaching: [
+    {
+      // HTML: NetworkFirst para evitar servir HTML viejo cacheado
+      urlPattern: ({ request }) => request.destination === 'document',
+      handler: 'NetworkFirst',
+      options: {
+        cacheName: 'html-cache',
+        networkTimeoutSeconds: 3,
+        expiration: {
+          maxEntries: 50,
+          maxAgeSeconds: 24 * 60 * 60,
+        },
+      },
+    },
+    {
+      // Estaticos de Next.js (con hash): CacheFirst es seguro
+      urlPattern: /^\/_next\/static\/.*/i,
+      handler: 'CacheFirst',
+      options: {
+        cacheName: 'next-static',
+        expiration: {
+          maxEntries: 200,
+          maxAgeSeconds: 30 * 24 * 60 * 60,
+        },
+      },
+    },
+    {
+      // Imagenes Cloudinary: StaleWhileRevalidate
+      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
+      handler: 'StaleWhileRevalidate',
+      options: {
+        cacheName: 'cloudinary-images',
+        expiration: {
+          maxEntries: 100,
+          maxAgeSeconds: 7 * 24 * 60 * 60,
+        },
+      },
+    },
+  ],
 })
```

### Interpretacion de la estrategia

| Recurso | Estrategia | Por que |
|---|---|---|
| HTML (document) | NetworkFirst (timeout 3s) | Siempre intenta el server primero. Solo si tarda >3s, sirve cache. Evita HTML viejo. |
| `_next/static/*` | CacheFirst | Los assets tienen hash en el nombre. Cachear es seguro. |
| Imagenes Cloudinary | StaleWhileRevalidate | Sirve cache rapido + revalida en background. |

---

## 4. Verificacion

### Antes del fix

```
Scripts en el DOM: 5
Chunks admin: 0
```

### Despues del fix (commit 16ea5eec deployado)

```
Scripts en el DOM: 16
Chunks admin: (presentes)
```

**Procedimiento de verificacion:**

1. Chrome normal: `chrome://serviceworker-internals` → Unregister todo lo de panfree.fit.
2. Chrome normal: `www.panfree.fit` → F12 → Application → Clear site data.
3. Cerrar TODAS las pestañas de panfree.fit.
4. Cerrar Chrome completo.
5. Reabrir Chrome → `www.panfree.fit/admin` → F12 → Console → correr el script de conteo.
6. Resultado: 16 scripts (antes 5).

---

## 5. Lecciones

- **`view-source` bypassa el SW.** Usar siempre `view-source` para ver el HTML real del server, no el cacheado.
- **`next-pwa` default cachea HTML.** Si no configuras `runtimeCaching`, el SW sirve HTML viejo por meses.
- **`skipWaiting` no es suficiente.** Hace falta `clientsClaim` para que el SW nuevo tome control de pestañas abiertas inmediatamente.
- **`performance.getEntriesByType`** lista recursos que pueden estar servidos por el SW desde su cache, no necesariamente del server.

---

## 6. Referencias

- Commit: `16ea5eec`
- Archivo: `next.config.js`
- Doc relacionada: `40-recon-s21.md` (contexto de S21)