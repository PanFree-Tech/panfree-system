# F2-12: Rotacion del par VAPID

**Fecha:** 2026-10-16 (S20)
**Estado:** Cerrado
**Tarea:** F2-12
**Hallazgos:** F2-12 (cerrado), F3-07 (cerrado), SEC-014 (cerrado), BUG-001 (cerrado), BUG-012 (cerrado), SEC-024 (no aplica), DOC-015 (nuevo)

---

## 1. Contexto

F2-12 era "regenerar par VAPID". Al auditar el codigo previo a la rotacion
se detectaron varios problemas colaterales:

- **BUG-001 / SEC-014:** la clave publica VAPID estaba hardcodeada en
  `src/app/admin/page.js` como constante, con un valor distinto al que el
  server usa en Vercel. La suscripcion push desde el dashboard admin
  firmaba con una clave, el server verificaba con otra -> push roto para
  admins.
- **BUG-012 (nuevo):** `src/components/PWAInstallPrompt.js` leia
  `NEXT_PUBLIC_VAPID_KEY` (variable que NO existe en Vercel). El correcto
  es `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. La PWA nunca podia suscribirse.
- **SEC-024:** `NEXT_PUBLIC_VAPID_EMAIL` mostraba un valor aparentemente
  JWT en `vercel env ls`. Al hacer `vercel env pull` se confirmo que era
  un artefacto visual del CLI. El valor real es correcto.

---

## 2. Rotacion del par VAPID

### 2.1 Generacion

```
npx web-push generate-vapid-keys 2>&1 | Out-File -FilePath "$env:USERPROFILE\Desktop\vapid-nuevo.txt" -Encoding UTF8
```

El uso de `Out-File` con `2>&1` evita que el par quede visible en la
consola (regla 7.5 del SISTEMA-DE-TRABAJO). Se verificaron los largos:
public=87 chars, private=43 chars.

**Incidente S20-01 (par descartado):** antes del metodo correcto se corrio
`npx web-push generate-vapid-keys` sin redireccion, dejando un par visible
en la consola que fue pegado en el chat de IA. Ese par se descarto sin
cargarlo en ningun servicio.

### 2.2 Carga

- **Bitwarden:** item "VAPID - Produccion" creado en
  Bitwarden -> Organizacion PanFree -> Produccion (via carpeta
  "PanFree System - Produccion"). 3 campos personalizados + nota con
  historial de rotacion.
- **Vercel (Production + Preview):**
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = nuevo publico
  - `VAPID_PRIVATE_KEY` = nuevo privado (marcado como Sensitive)
  - `NEXT_PUBLIC_VAPID_EMAIL` = contacto@panfree.fit (sin cambios)
- **`.env.local`:** no se creo. Se reconstruye on-demand desde Bitwarden
  cuando se necesita desarrollo local (politica del proyecto).

### 2.3 Verificacion

- `vercel env pull` confirmo los valores en Production.
- Redeploy de Vercel.
- Mini-chequeo en Chrome confirmo: solo 1 key VAPID en el bundle
  (`BOOuDcy9...`), la vieja (`BFja0jK4...`) ya no aparece.
- Test end-to-end: suscripcion desde `/admin` ->
  `POST /api/push-suscribir` con status 200 -> 1 fila en
  `push_subscriptions`.

### 2.4 Par saliente

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` viejo:
  `BP4NJPem9M8MzkaeGK4NzT3vUlQrDvalARl-_20xTfjyNtcdC0iC2CoSe2_sYp8TDqm6aCjbe62VLuMGwr4irTk`
- `VAPID_PRIVATE_KEY` viejo: IRRECUPERABLE (Vercel solo lo muestra como
  `[SENSITIVE]`). Excepcion justificada a la politica "guardar valor
  saliente completo".
- **Revocacion:** VAPID **no tiene panel de revocacion**. El unico
  mecanismo es rotar el par, lo cual ya se hizo. Los clientes suscritos
  con la clave publica vieja quedan invalidados.
- `push_subscriptions` fue vaciada en Supabase el 2026-10-16.

---

## 3. Fix de codigo (F3-07 + SEC-014 + BUG-001 + BUG-012)

### 3.1 Cambios

**`src/app/admin/page.js`:**

```diff
- // VAPID public key
- const VAPID_PUBLIC_KEY =
-   'BFja0jK4232iA8cec5oo9vaOguB9EKDyyyss7YWmYfsDv6cqEeZynD7Z9ozV82Yc1vgZmAIdw4mLWuXjn6jINKg'
+ // VAPID public key (desde env - fix SEC-014 / BUG-001 / F3-07)
+ const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
```

**`src/components/PWAInstallPrompt.js`:**

```diff
- // VAPID_PUBLIC_KEY debe inyectarse via env o meta tag
- const VAPID_PUBLIC_KEY = window.__VAPID_PUBLIC_KEY__ || process.env.NEXT_PUBLIC_VAPID_KEY
+ // VAPID public key (desde env - fix BUG-012)
+ const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
```

### 3.2 Commit

- `5923f3a6` fix(pwa,admin): unificar VAPID_PUBLIC_KEY desde env (F3-07, SEC-014, BUG-001, BUG-012)

---

## 4. Hallazgo colateral: DOC-015 (alias Vercel)

Al verificar el bundle servido por `www.panfree.fit` se detecto que el
alias apuntaba a un deployment viejo (`hyx06fts0`, 63 dias de antiguedad),
NO al ultimo deployment de `main`. Vercel no actualiza el alias
automaticamente en cada push.

**Fix aplicado:** `vercel --prod --force --yes`. Esto creo un deployment
de produccion nuevo (`jc4bivlqy`) y actualizo el alias.

**Implicancia (a auditar en S21):** si el alias estuvo apuntando a un
deployment viejo por mucho tiempo, es posible que algunos fixes de
bastidores (S1-S19) no hayan estado efectivamente en produccion hasta
ahora. Requiere revision.

---

## 5. Estado de Bitwarden

Item "VAPID - Produccion" en Bitwarden -> Organizacion PanFree ->
Produccion (carpeta "PanFree System - Produccion").

| Campo | Tipo | Valor |
|---|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Oculto | (par activo desde 2026-10-16) |
| `VAPID_PRIVATE_KEY` | Oculto | (par activo desde 2026-10-16) |
| `NEXT_PUBLIC_VAPID_EMAIL` | Texto | contacto@panfree.fit |

Nota con historial completo (incluye par saliente recuperable +
irrecuperable + incidente S20-01).

---

## 6. Lecciones

### 6.1 Here-strings anidados en PowerShell

Los here-strings `@'...'@` **NO se anidan**. Pegar un script que genera
otro script con here-strings internos rompe el parser. Alternativa: usar
arrays de strings + `-join`.

### 6.2 Regla 7.5 en la practica

Los comandos que generan secretos en stdout (`npx web-push
generate-vapid-keys`) deben redirigirse a archivo con `2>&1 | Out-File`.
No hacer copy-paste del output.

### 6.3 Service Worker y cache

El service worker puede servir chunks viejos desde su cache interno
**incluso despues de un redeploy**. Sintoma: `performance.getEntriesByType`
lista chunks con hashes viejos. Solucion: "Clear site data" + "Unregister"
+ Ctrl+Shift+R. A veces requiere cerrar TODAS las pestaÃ±as del origin.

### 6.4 `cache: 'no-store'` rompe fetch de chunks del SW

`fetch(url, { cache: 'no-store' })` **rompe la lectura de chunks** servidos
por el service worker. Para scripts de auditoria, usar `fetch(url)` sin
opciones.

### 6.5 `performance.getEntriesByType` tiene buffer limitado

El buffer se llena (150-250 entries). Los primeros recursos cargados
desaparecen. Para auditar chunks confiablemente, mejor leer el HTML
actual con `fetch` y parsear los `<script src>`.

### 6.6 Vercel alias no se actualiza solo

Cada push a `main` genera un deployment nuevo, pero el alias de
produccion (`www.panfree.fit`) **puede seguir apuntando al viejo**.
Verificar post-deploy con `vercel alias ls`.

---

## 7. Referencias

- Commit: `5923f3a6`
- Deployment Vercel: `panfree-system-jc4bivlqy-*`
- Bitwarden: item "VAPID - Produccion"
- Archivos: `src/app/admin/page.js`, `src/components/PWAInstallPrompt.js`
- Hallazgos: F2-12, F3-07, SEC-014, BUG-001, BUG-012 (cerrados);
  SEC-024 (no aplica); DOC-015 (nuevo)
