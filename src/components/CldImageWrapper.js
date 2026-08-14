'use client'

/**
 * Archivo: src/components/CldImageWrapper.js
 * Mejoras:
 * - Añade lazy loading
 * - Añade placeholder blur (basado en un pequeño SVG en dataURL cuando no hay blurDataURL)
 * - Optimiza sizes responsive por defecto
 *
 * Uso: <CldImageWrapper src={...} alt="..." fill={true} priority={false} className="..." sizes="(max-width:600px) 100vw, 300px" />
 */

import Image from 'next/image'
import PropTypes from 'prop-types'

/**
 * Genera un SVG tiny blur como dataURL (para usar en blurDataURL)
 * color: color de fondo aproximado para el placeholder
 */
function svgPlaceholderDataURL(color = '#f5f5f5', width = 20, height = 12) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'><rect width='100%' height='100%' fill='${color}'/></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

/**
 * Intenta inferir un color base simple desde la URL (si es local), si no devuelve color neutro.
 * Esto es una heurística suave; no intenta descargar la imagen.
 */
function inferPlaceholderColorFromSrc(src) {
  if (!src) return '#f5f5f5'
  try {
    // Si es ruta local con nombres que sugieran color (no es fiable, heurístico)
    const low = src.toLowerCase()
    if (low.includes('bread') || low.includes('pan')) return '#f5e9da'
    if (low.includes('green') || low.includes('leaf')) return '#eaf6ec'
    return '#f5f5f5'
  } catch {
    return '#f5f5f5'
  }
}

export default function CldImageWrapper({
  src,
  alt = '',
  className = '',
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 900px) 50vw, 300px',
  fill = false,
  quality = 75,
  blurDataURL = null,
  style = {},
  ...rest
}) {
  // Generar blurDataURL si no se pasa uno explícito
  const placeholderColor = inferPlaceholderColorFromSrc(src)
  const computedBlur = blurDataURL || svgPlaceholderDataURL(placeholderColor)

  // Defaults for Next/Image props:
  // - loading: 'lazy' para mejorar LCP excepto si priority=true
  // - placeholder: 'blur' si tenemos blurDataURL
  const loading = priority ? 'eager' : 'lazy'
  const placeholderMode = computedBlur ? 'blur' : 'empty'

  return (
    <Image
      src={src}
      alt={alt || ''}
      className={className}
      priority={priority}
      sizes={sizes}
      quality={quality}
      loading={loading}
      placeholder={placeholderMode}
      blurDataURL={computedBlur}
      {...(fill ? { fill: true } : {})}
      style={style}
      {...rest}
    />
  )
}

CldImageWrapper.propTypes = {
  src: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  alt: PropTypes.string,
  className: PropTypes.string,
  priority: PropTypes.bool,
  sizes: PropTypes.string,
  fill: PropTypes.bool,
  quality: PropTypes.number,
  blurDataURL: PropTypes.string,
  style: PropTypes.object,
}