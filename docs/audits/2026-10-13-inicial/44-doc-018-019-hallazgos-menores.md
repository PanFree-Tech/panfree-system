# DOC-018 y DOC-019: Hallazgos menores de S21

**Fecha:** 2026-10-16 (S21)
**Severidad:** Baja
**Estado:** Abiertos (F4, P3)

---

## DOC-018: meta `apple-mobile-web-app-capable` deprecado

### Sintoma

En consola del navegador:

```
(index):1 <meta name="apple-mobile-web-app-capable" content="yes"> is deprecated.
Please include <meta name="mobile-web-app-capable" content="yes">
```

### Causa

Apple depreco el meta `apple-mobile-web-app-capable` en favor del estandar `mobile-web-app-capable`. El meta viejo sigue funcionando pero emite warning en consola.

### Impacto

- Ninguno funcional.
- Solo ruido en consola del navegador.

### Fix propuesto

En `src/app/layout.js` (o donde este el `<head>` del layout raiz), agregar:

```html
<meta name="mobile-web-app-capable" content="yes" />
```

Ademas del existente `apple-mobile-web-app-capable`.

---

## DOC-019: icono 144x144 faltante en manifest PWA

### Sintoma

En consola del navegador:

```
Error while trying to use the following icon from the Manifest:
https://www.panfree.fit/icons/icon-144x144.png
(Download error or resource isn't a valid image)
```

### Causa

El `manifest.json` referencia un icono `icon-144x144.png` que no existe en `/public/icons/`. La carpeta `/icons/` tiene otros tamaños (192, 512, favicon) pero no 144.

### Impacto

- El navegador no puede instalar la PWA con ese icono especifico.
- Puede causar que la PWA use un icono por defecto.
- Warning en consola.

### Fix propuesto

**Opcion A (recomendada):** crear `public/icons/icon-144x144.png` a partir del icono existente (redimensionar 192x192 a 144x144).

**Opcion B:** quitar la referencia de `manifest.json` si no es necesaria.

**Razon de Opcion A:** Apple y algunos navegadores usan 144x144 para el icono de la PWA en el home screen. Conviene tenerlo.

---

## Referencias

- Detectados en consola durante S21 (verificacion de DOC-017).
- No bloqueantes. Se resuelven en F4 (limpieza).