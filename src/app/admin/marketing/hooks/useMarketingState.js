/**
 * 📁 UBICACIÓN: src/app/admin/marketing/hooks/useMarketingState.js
 * 📌 Hook central para gestionar el estado del generador de creatividades de marketing.
 */

'use client'

import { useState, useEffect } from 'react'
import { HASHTAGS_DEFAULT, PLANTILLAS } from '../utils/templates'

/**
 * Hook para estado centralizado del creador de contenido
 * @param {Array<Object>} productos - Lista de productos disponibles
 */
export function useMarketingState(productos = []) {
  const [productoId, setProductoId] = useState('')
  const [formato, setFormato] = useState('feed_4_5')
  const [plantilla, setPlantilla] = useState('catalogo')
  const [esquema, setEsquema] = useState('oscuro')
  const [textoPrincipal, setTextoPrincipal] = useState('El placer de\nvolver a\nCOMER\nlibremente.')
  const [subtitulo, setSubtitulo] = useState('')
  const [textoCTA, setTextoCTA] = useState('Pedi en panfree.fit')
  const [textoPromo, setTextoPromo] = useState('★  OFERTA ESPECIAL  ★')
  const [mostrarPrecio, setMostrarPrecio] = useState(true)
  const [mostrarSlogan, setMostrarSlogan] = useState(true)
  const [mostrarDelivery, setMostrarDelivery] = useState(true)
  const [mostrarHashtags, setMostrarHashtags] = useState(false)
  const [hashtags, setHashtags] = useState(HASHTAGS_DEFAULT)
  const [vistaPreview, setVistaPreview] = useState('celular')
  const [logoAltura, setLogoAltura] = useState(120)
  const [logoPaddingV, setLogoPaddingV] = useState(20)

  // Producto actualmente seleccionado
  const selectedProduct = productos.find((p) => p.id === productoId) || null

  // Auto-ajuste de textos al cambiar de plantilla
  useEffect(() => {
    if (plantilla === 'hero') {
      setTextoPrincipal(PLANTILLAS.hero.defaults.textoPrincipal)
      setSubtitulo(PLANTILLAS.hero.defaults.subtitulo)
    } else if (plantilla === 'catalogo') {
      setTextoPrincipal(PLANTILLAS.catalogo.defaults.textoPrincipal)
      setSubtitulo(PLANTILLAS.catalogo.defaults.subtitulo)
    } else if (plantilla === 'promo') {
      setTextoPrincipal(PLANTILLAS.promo.defaults.textoPrincipal)
      setSubtitulo(PLANTILLAS.promo.defaults.subtitulo)
      setTextoPromo(PLANTILLAS.promo.defaults.textoPromo)
    }
  }, [plantilla])

  const resetLogoConfig = () => {
    setLogoAltura(120)
    setLogoPaddingV(20)
  }

  return {
    productoId,
    setProductoId,
    selectedProduct,
    formato,
    setFormato,
    plantilla,
    setPlantilla,
    esquema,
    setEsquema,
    textoPrincipal,
    setTextoPrincipal,
    subtitulo,
    setSubtitulo,
    textoCTA,
    setTextoCTA,
    textoPromo,
    setTextoPromo,
    mostrarPrecio,
    setMostrarPrecio,
    mostrarSlogan,
    setMostrarSlogan,
    mostrarDelivery,
    setMostrarDelivery,
    mostrarHashtags,
    setMostrarHashtags,
    hashtags,
    setHashtags,
    vistaPreview,
    setVistaPreview,
    logoAltura,
    setLogoAltura,
    logoPaddingV,
    setLogoPaddingV,
    resetLogoConfig,
  }
}
