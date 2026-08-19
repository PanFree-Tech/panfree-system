/**
 * 📁 UBICACIÓN: src/app/admin/marketing/hooks/useCanvasRenderer.js
 * 📌 Hook para orquestar el ciclo de vida del canvas, carga de imágenes y exportación de archivos.
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { render } from '../utils/canvasUtils'
import { FORMATOS } from '../utils/formats'

/**
 * Hook para orquestar el renderizado en canvas y la exportación de imágenes
 * @param {Object} state - Estado devuelto por useMarketingState
 * @param {boolean} loadingProd - Indicador de carga de productos
 * @returns {{
 *   canvasRef: import('react').MutableRefObject<HTMLCanvasElement|null>,
 *   dataUrl: string,
 *   exportando: boolean,
 *   logoListo: boolean,
 *   imgProdLista: boolean,
 *   exportar: (tipo: 'png'|'jpg') => void,
 *   redibujar: () => void
 * }}
 */
export function useCanvasRenderer(state, loadingProd) {
  const canvasRef = useRef(null)
  const logoRef = useRef(null)
  const prodImgRef = useRef(null)

  const [logoListo, setLogoListo] = useState(false)
  const [imgProdLista, setImgProdLista] = useState(false)
  const [dataUrl, setDataUrl] = useState('')
  const [exportando, setExportando] = useState(false)

  // 1. Cargar el logo institucional de Panfree
  useEffect(() => {
    const img = new window.Image()
    img.onload = () => {
      logoRef.current = img
      setLogoListo(true)
    }
    img.onerror = () => {
      logoRef.current = null
      setLogoListo(true)
    }
    img.src = '/images/logo-panfree.png'
  }, [])

  // 2. Cargar imagen del producto seleccionado
  useEffect(() => {
    const imagenUrl = state?.selectedProduct?.imagen_url
    if (!imagenUrl) {
      prodImgRef.current = null
      setImgProdLista(false)
      return
    }

    setImgProdLista(false)
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      prodImgRef.current = img
      setImgProdLista(true)
    }
    img.onerror = () => {
      prodImgRef.current = null
      setImgProdLista(false)
    }
    img.src = imagenUrl
  }, [state?.selectedProduct?.imagen_url])

  // 3. Redibujar canvas y actualizar el snapshot dataURL
  const redibujar = useCallback(() => {
    if (!canvasRef.current || loadingProd) return

    // Garantizar que use las imágenes cargadas en los estados
    const currentLogo = logoListo ? logoRef.current : logoRef.current
    const currentProdImg = imgProdLista ? prodImgRef.current : prodImgRef.current

    render(
      canvasRef.current,
      {
        formato: state.formato,
        plantilla: state.plantilla,
        esquema: state.esquema,
        producto: state.selectedProduct,
        textoPrincipal: state.textoPrincipal,
        subtitulo: state.subtitulo,
        textoCTA: state.textoCTA,
        textoPromo: state.textoPromo,
        mostrarPrecio: state.mostrarPrecio,
        mostrarSlogan: state.mostrarSlogan,
        mostrarDelivery: state.mostrarDelivery,
        mostrarHashtags: state.mostrarHashtags,
        hashtags: state.hashtags,
        logoAltura: state.logoAltura,
        logoPaddingV: state.logoPaddingV,
      },
      currentLogo,
      currentProdImg
    )

    try {
      setDataUrl(canvasRef.current.toDataURL('image/jpeg', 0.92))
    } catch {
      setDataUrl(canvasRef.current.toDataURL('image/png'))
    }
  }, [
    state.formato,
    state.plantilla,
    state.esquema,
    state.selectedProduct,
    state.textoPrincipal,
    state.subtitulo,
    state.textoCTA,
    state.textoPromo,
    state.mostrarPrecio,
    state.mostrarSlogan,
    state.mostrarDelivery,
    state.mostrarHashtags,
    state.hashtags,
    state.logoAltura,
    state.logoPaddingV,
    loadingProd,
    logoListo,
    imgProdLista,
  ])

  useEffect(() => {
    redibujar()
  }, [redibujar])

  // 4. Exportar a archivo local
  const exportar = (tipo = 'png') => {
    if (!canvasRef.current) return
    setExportando(true)
    const F = FORMATOS[state.formato] || FORMATOS.feed_4_5
    const slug = state.selectedProduct?.slug || 'panfree'
    const name = `panfree_${slug}_${F.w}x${F.h}`
    const mime = tipo === 'png' ? 'image/png' : 'image/jpeg'
    const q = tipo === 'png' ? undefined : 0.97

    canvasRef.current.toBlob(
      (blob) => {
        if (!blob) {
          setExportando(false)
          return
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${name}.${tipo}`
        link.click()
        URL.revokeObjectURL(url)
        setExportando(false)
      },
      mime,
      q
    )
  }

  return {
    canvasRef,
    logoRef,
    prodImgRef,
    dataUrl,
    exportando,
    logoListo,
    imgProdLista,
    exportar,
    redibujar,
  }
}
