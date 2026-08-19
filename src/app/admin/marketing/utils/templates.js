/**
 * 📁 UBICACIÓN: src/app/admin/marketing/utils/templates.js
 * 📌 Plantillas publicitarias predefinidas y configuraciones por defecto.
 */

export const PLANTILLAS = {
  hero: {
    label: '✦ Producto estrella',
    desc: 'Un producto, impacto máximo',
    defaults: {
      textoPrincipal: '',
      subtitulo: 'Artesanal · Sin Gluten · Sin TACC',
      textoPromo: '★  OFERTA ESPECIAL  ★',
    },
  },
  catalogo: {
    label: '◈ Catálogo general',
    desc: 'Todas las categorías + precios',
    defaults: {
      textoPrincipal: 'El placer de\nvolver a\nCOMER\nlibremente.',
      subtitulo: '',
      textoPromo: '',
    },
  },
  promo: {
    label: '★ Promo / Oferta',
    desc: 'Descuento o urgencia de compra',
    defaults: {
      textoPrincipal: 'Solo por tiempo limitado',
      subtitulo: '',
      textoPromo: '★  OFERTA ESPECIAL  ★',
    },
  },
}

export const HASHTAGS_DEFAULT = '#PanFree #SinGluten #SinTACC #Encarnacion #Paraguay #PanificadosSinGluten'

export const CATEGORIAS_CATALOGO = [
  { cat: 'PANES',   desc: 'De miga, molde, integral',     p: 'desde G/ 25.000' },
  { cat: 'DULCES',  desc: 'Facturas, medialunas, budines', p: 'desde G/ 38.000' },
  { cat: 'SALADOS', desc: 'Galletas, tartas, empanadas',   p: 'desde G/ 20.000' },
  { cat: 'EVENTOS', desc: 'Mesas dulces, celebraciones',   p: 'desde G/ 60.000' },
]

export const BADGES_CONFIANZA = ['Sin Gluten', 'Sin TACC', 'Artesanal', 'Encarga Ya']

export const INFO_DELIVERY_ITEMS = [
  'Envio gratis desde G/ 50.000',
  'Retiro en Encarnacion',
  'Pedidos con 24hs anticipacion',
]
