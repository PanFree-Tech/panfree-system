# Recon S21 - Estado del proyecto al inicio de S21

**Fecha:** 2026-10-16 18:53:48
**Sesion:** 21

---

## Git

```
HEAD:   16ea5eec4533bdba020c3959fd8ec8722c1144f9
Branch: main
Status: hay cambios
```

Ultimos 5 commits:

```
16ea5eec fix(pwa): evitar cacheo de HTML en service worker (DOC-017)
13f3cc96 docs(session): cerrar sesion 20 (ENV) - VAPID + cierre
5923f3a6 fix(pwa,admin): unificar VAPID_PUBLIC_KEY desde env (F3-07, SEC-014, BUG-001, BUG-012)
7d2bf3a8 chore(scripts): reescribir 59 con scope total (patron 54)
678ed7cd docs(session): cerrar sesion 19 (ENV) - rotacion GA4 + correccion de autoria
```

---

## Auditoria next.config.js (PWA / SW - DOC-017)

skipWaiting: SI
clientsClaim: SI
Cachea HTML (document): NO DETECTADO

Interpretacion:
- Si skipWaiting = NO DETECTADO -> causa probable del SW que no se actualiza.
- Si Cachea HTML = SI -> causa directa del HTML viejo servido por SW.

---

## Auditoria Supabase ANON KEY (DOC-016)

Pendiente: verificar manualmente en Vercel Dashboard.
Reportar prefijo: eyJ... (legacy) o sb_publishable_ (OK).

---

## Auditoria Vercel

Pendiente: correr manualmente

```
vercel ls --yes          # ultimos deployments
vercel alias ls          # www.panfree.fit -> deployment
```

---

## Fin del recon
