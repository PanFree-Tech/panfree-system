/**
 * 📁 UBICACIÓN: src/app/admin/marketing/utils/formats.js
 * 📌 Formatos de imagen soportados para redes sociales (Instagram).
 */

export const FORMATOS = {
  feed_4_5: {
    label: 'Feed Vertical 4:5',
    w: 1080,
    h: 1350,
    tag: '📱',
    desc: 'Mayor alcance · recomendado',
  },
  feed_1_1: {
    label: 'Feed Cuadrado 1:1',
    w: 1080,
    h: 1080,
    tag: '⬛',
    desc: 'Clásico · grid uniforme',
  },
  stories: {
    label: 'Stories / Reels 9:16',
    w: 1080,
    h: 1920,
    tag: '📲',
    desc: 'Sticker de link disponible',
  },
}

export const FORMATOS_LISTA = Object.entries(FORMATOS).map(([key, value]) => ({
  id: key,
  ...value,
}))
