/**
 * 📁 UBICACIÓN: src/app/admin/marketing/utils/canvasUtils.js
 * 📌 Motor de renderizado en Canvas HTML5 para piezas gráficas de marketing.
 */

import { FORMATOS } from './formats'
import { P, ESQUEMAS, rgb } from './colorSchemes'
import { CATEGORIAS_CATALOGO, BADGES_CONFIANZA, INFO_DELIVERY_ITEMS } from './templates'

/**
 * Formatea un número como moneda Guaraníes (PYG)
 * @param {number|string} n - Cantidad a formatear
 * @returns {string} Texto formateado (ej: "G/ 25.000")
 */
export const fmt2PYG = (n) => `G/ ${Number(n || 0).toLocaleString('es-PY')}`

/**
 * Dibuja un degradado vertical
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D del Canvas
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {number} w - Ancho
 * @param {number} h - Alto
 * @param {string} cT - Color superior
 * @param {string} cB - Color inferior
 */
export function gradV(ctx, x, y, w, h, cT, cB) {
  const g = ctx.createLinearGradient(x, y, x, y + h)
  g.addColorStop(0, cT)
  g.addColorStop(1, cB)
  ctx.fillStyle = g
  ctx.fillRect(x, y, w, h)
}

/**
 * Centra un texto horizontalmente en el canvas
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D del Canvas
 * @param {string} text - Texto a dibujar
 * @param {number} y - Posición Y de la línea base
 * @param {number} W - Ancho total del canvas
 */
export function cTxt(ctx, text, y, W) {
  const m = ctx.measureText(text)
  ctx.fillText(text, (W - m.width) / 2, y)
}

/**
 * Dibuja un ornamento decorativo dorado centrado
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D del Canvas
 * @param {number} y - Posición Y
 * @param {number} W - Ancho total del canvas
 * @param {string} col - Color del ornamento
 */
export function orn(ctx, y, W, col) {
  const cx = W / 2
  ctx.globalAlpha = 0.6
  ctx.strokeStyle = col
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(cx - 155, y)
  ctx.lineTo(cx - 30, y)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx + 30, y)
  ctx.lineTo(cx + 155, y)
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.fillStyle = col
  ctx.beginPath()
  ctx.moveTo(cx, y - 9)
  ctx.lineTo(cx + 12, y)
  ctx.lineTo(cx, y + 9)
  ctx.lineTo(cx - 12, y)
  ctx.closePath()
  ctx.fill()
}

/**
 * Dibuja un rectángulo con esquinas redondeadas
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D del Canvas
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {number} w - Ancho
 * @param {number} h - Alto
 * @param {number|number[]} r - Radio de curvatura
 * @param {string|null} fill - Color de relleno
 * @param {string|null} stroke - Color de borde
 * @param {number} sw - Ancho de borde
 */
export function rr(ctx, x, y, w, h, r, fill, stroke, sw = 1) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = sw
    ctx.stroke()
  }
}

/**
 * Función principal que renderiza el diseño sobre el canvas HTML5
 * @param {HTMLCanvasElement} canvas - Elemento canvas HTML5
 * @param {Object} params - Parámetros de renderizado
 * @param {HTMLImageElement|null} logoImg - Imagen del logo cargada
 * @param {HTMLImageElement|null} prodImg - Imagen del producto cargada
 */
export function render(canvas, params, logoImg, prodImg) {
  if (!canvas) return

  const {
    formato = 'feed_4_5',
    plantilla = 'catalogo',
    esquema = 'oscuro',
    producto = null,
    textoPrincipal = '',
    subtitulo = '',
    textoCTA = 'Pedi en panfree.fit',
    textoPromo = '★  OFERTA ESPECIAL  ★',
    mostrarPrecio = true,
    mostrarSlogan = true,
    mostrarDelivery = true,
    mostrarHashtags = false,
    hashtags = '',
    logoAltura = 120,
    logoPaddingV = 20,
  } = params

  const F = FORMATOS[formato] || FORMATOS.feed_4_5
  const sq = ESQUEMAS[esquema] || ESQUEMAS.oscuro
  const W = F.w
  const H = F.h

  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, W, H)

  const { r: tr, g: tg, b: tb } = rgb(sq.txt)
  const { r: dr, g: dg, b: db } = rgb(P.dorado)

  // ── Fondo degradado ────────────────────────────────────────────────────────
  gradV(ctx, 0, 0, W, H, sq.bg, sq.bgBot)
  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.012)`
  for (let i = 0; i < H; i += 5) ctx.fillRect(0, i, W, 2)

  // Círculos decorativos de fondo
  ctx.lineWidth = 2
  ;[
    [W + 90, -90, 330],
    [W + 150, -40, 460],
    [-70, H + 80, 290],
  ].forEach(([cx, cy, r]) => {
    ctx.strokeStyle = `rgba(${dr},${dg},${db},0.10)`
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  })

  // Línea dorada superior
  ctx.fillStyle = P.dorado
  ctx.fillRect(0, 0, W, 8)
  ctx.fillStyle = P.doradoClaro
  ctx.globalAlpha = 0.4
  ctx.fillRect(0, 8, W, 3)
  ctx.globalAlpha = 1

  // ── Header dinámico según tamaño de logo ─────────────────────────────────
  const lh = logoAltura || 120
  const lPad = logoPaddingV || 20
  const headerH = lh + lPad * 2 + 28
  const headerTop = 14

  ctx.fillStyle = `rgba(${tr},${tg},${tb},0.06)`
  ctx.beginPath()
  ctx.roundRect(48, headerTop, W - 96, headerH, 8)
  ctx.fill()
  ctx.strokeStyle = P.dorado
  ctx.lineWidth = 1.2
  ctx.globalAlpha = 0.7
  ctx.beginPath()
  ctx.roundRect(48, headerTop, W - 96, headerH, 8)
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.fillStyle = P.dorado
  ctx.globalAlpha = 0.8
  ctx.fillRect(48, headerTop, 4, headerH)
  ctx.fillRect(W - 52, headerTop, 4, headerH)
  ctx.globalAlpha = 1

  // Logo centrado verticalmente en el header
  const logoTop = headerTop + lPad
  if (logoImg?.complete && logoImg?.naturalWidth > 0) {
    const lw = (logoImg.naturalWidth / logoImg.naturalHeight) * lh
    ctx.drawImage(logoImg, (W - lw) / 2, logoTop, lw, lh)
  } else {
    const fsFallback = Math.round(lh * 0.65)
    ctx.font = `bold ${fsFallback}px "Segoe UI",Arial,sans-serif`
    ctx.fillStyle = sq.txt
    cTxt(ctx, 'PanFree', logoTop + lh * 0.75, W)
  }

  // Sub-texto bajo el logo
  const subTextoY = headerTop + headerH - 10
  ctx.font = `14px "Segoe UI",Arial,sans-serif`
  ctx.fillStyle = P.doradoClaro
  ctx.globalAlpha = 0.8
  cTxt(ctx, 'PANIFICADOS SIN GLUTEN  ·  ENCARNACION, PARAGUAY', subTextoY, W)
  ctx.globalAlpha = 1

  // Ornamento separador
  const ornY = headerTop + headerH + 18
  orn(ctx, ornY, W, P.dorado)

  // ══════════════════════════════════════════════════════════════════════════
  // PLANTILLA: HERO
  // ══════════════════════════════════════════════════════════════════════════
  if (plantilla === 'hero') {
    const hasImg = prodImg?.complete && prodImg?.naturalWidth > 0
    const iY = ornY + 24
    const iH = formato === 'feed_1_1' ? 320 : formato === 'stories' ? 580 : 420
    const iX = 50
    const iW = W - 100

    if (hasImg) {
      rr(ctx, iX - 3, iY - 3, iW + 6, iH + 6, 12, null, P.dorado, 2)
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(iX, iY, iW, iH, 10)
      ctx.clip()
      const sc = Math.max(iW / prodImg.naturalWidth, iH / prodImg.naturalHeight)
      const dw = prodImg.naturalWidth * sc
      const dh = prodImg.naturalHeight * sc
      ctx.drawImage(prodImg, iX + (iW - dw) / 2, iY + (iH - dh) / 2, dw, dh)
      const vg = ctx.createLinearGradient(0, iY + iH * 0.52, 0, iY + iH)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(0,0,0,0.55)')
      ctx.fillStyle = vg
      ctx.fillRect(iX, iY, iW, iH)
      ctx.restore()
    } else {
      rr(ctx, iX, iY, iW, iH, 10, `rgba(${tr},${tg},${tb},0.06)`, P.dorado + '55', 1.5)
      ctx.font = `96px Arial`
      ctx.fillStyle = `rgba(${tr},${tg},${tb},0.10)`
      cTxt(ctx, '🍞', iY + iH / 2 + 32, W)
    }

    const base = iY + iH + 30
    const nom = producto?.nombre || 'Producto PanFree'
    let fs = 70
    ctx.font = `bold ${fs}px "Segoe UI",Arial,sans-serif`
    while (ctx.measureText(nom).width > W - 80 && fs > 26) {
      fs -= 3
      ctx.font = `bold ${fs}px "Segoe UI",Arial,sans-serif`
    }
    ctx.fillStyle = sq.txt
    cTxt(ctx, nom, base + fs, W)

    if (subtitulo) {
      ctx.font = `22px "Segoe UI",Arial,sans-serif`
      ctx.fillStyle = P.doradoClaro
      cTxt(ctx, subtitulo, base + fs + 34, W)
    }
    orn(ctx, base + fs + (subtitulo ? 58 : 26), W, P.dorado)

    if (textoPrincipal) {
      const lines = textoPrincipal.split('\n')
      let cy = base + fs + (subtitulo ? 86 : 54)
      ;[52, 66, 38].forEach((sz, i) => {
        if (!lines[i]) return
        ctx.font = `bold ${sz}px "Segoe UI",Arial,sans-serif`
        ctx.fillStyle = [sq.txt, sq.aA, P.dorado][i] || sq.txt
        cTxt(ctx, lines[i], cy, W)
        cy += sz + 10
      })
    }

    if (mostrarPrecio && producto?.precio_venta) {
      const py = H - (formato === 'feed_1_1' ? 295 : 375)
      rr(ctx, W / 2 - 165, py - 52, 330, 72, 36, `rgba(${tr},${tg},${tb},0.08)`, sq.aB + '80', 1.5)
      ctx.font = `bold 48px "Segoe UI",Arial,sans-serif`
      ctx.fillStyle = sq.aA
      cTxt(ctx, fmt2PYG(producto.precio_venta), py, W)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLANTILLA: CATÁLOGO
  // ══════════════════════════════════════════════════════════════════════════
  if (plantilla === 'catalogo') {
    ctx.font = `34px "Segoe UI",Arial,sans-serif`
    ctx.fillStyle = `rgba(${tr},${tg},${tb},0.6)`
    cTxt(ctx, '¿Celiaco? ¿Intolerante al gluten?', ornY + 36, W)

    const lines = (textoPrincipal || 'El placer de\nvolver a\nCOMER\nlibremente.').split('\n')
    const sz = [62, 80, 108, 78]
    const cl = [sq.txt, sq.aA, sq.txt, P.dorado]
    let ty = ornY + 86
    lines.forEach((l, i) => {
      ctx.font = `bold ${sz[Math.min(i, 3)]}px "Segoe UI",Arial,sans-serif`
      ctx.fillStyle = cl[Math.min(i, 3)]
      cTxt(ctx, l, ty, W)
      ty += sz[Math.min(i, 3)] + 8
    })
    orn(ctx, ty + 16, W, P.dorado)

    const cats = CATEGORIAS_CATALOGO
    const cw = 468
    const ch = 115
    const mx = (W - cw * 2 - 20) / 2
    const sy = ty + 42

    cats.forEach(({ cat, desc, p }, i) => {
      const cx2 = mx + (i % 2) * (cw + 20)
      const cy2 = sy + Math.floor(i / 2) * (ch + 14)
      rr(ctx, cx2, cy2, cw, ch, 8, `rgba(${tr},${tg},${tb},0.07)`)
      ctx.strokeStyle = P.dorado + '50'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(cx2, cy2, cw, ch, 8)
      ctx.stroke()
      rr(ctx, cx2, cy2, 5, ch, [8, 0, 0, 8], sq.aA)
      ctx.font = `bold 26px "Segoe UI",Arial,sans-serif`
      ctx.fillStyle = sq.txt
      ctx.fillText(cat, cx2 + 22, cy2 + 34)
      ctx.font = `18px "Segoe UI",Arial,sans-serif`
      ctx.fillStyle = P.doradoClaro
      ctx.fillText(desc, cx2 + 22, cy2 + 60)
      ctx.font = `bold 21px "Segoe UI",Arial,sans-serif`
      ctx.fillStyle = sq.aA
      ctx.fillText(p, cx2 + 22, cy2 + 88)
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLANTILLA: PROMO
  // ══════════════════════════════════════════════════════════════════════════
  if (plantilla === 'promo') {
    const pY = ornY + 24
    rr(ctx, (W - 320) / 2, pY, 320, 52, 26, sq.aA)
    ctx.font = `bold 26px "Segoe UI",Arial,sans-serif`
    ctx.fillStyle = P.blanco
    cTxt(ctx, textoPromo || '★  OFERTA ESPECIAL  ★', pY + 36, W)
    orn(ctx, pY + 74, W, P.dorado)

    const nom = producto?.nombre || 'Producto Especial'
    let fs2 = 72
    ctx.font = `bold ${fs2}px "Segoe UI",Arial,sans-serif`
    while (ctx.measureText(nom).width > W - 80 && fs2 > 28) {
      fs2 -= 3
      ctx.font = `bold ${fs2}px "Segoe UI",Arial,sans-serif`
    }
    ctx.fillStyle = sq.txt
    cTxt(ctx, nom, pY + 154, W)

    if (textoPrincipal) {
      ctx.font = `34px "Segoe UI",Arial,sans-serif`
      ctx.fillStyle = P.doradoClaro
      cTxt(ctx, textoPrincipal, pY + 204, W)
    }
    orn(ctx, pY + 236, W, P.dorado)

    if (mostrarPrecio && producto?.precio_venta) {
      ctx.font = `bold 30px "Segoe UI",Arial,sans-serif`
      ctx.fillStyle = `rgba(${tr},${tg},${tb},0.5)`
      cTxt(ctx, 'Solo por tiempo limitado', pY + 282, W)
      ctx.font = `bold 96px "Segoe UI",Arial,sans-serif`
      ctx.fillStyle = sq.aA
      cTxt(ctx, fmt2PYG(producto.precio_venta), pY + 388, W)
    }

    // Badges de confianza
    const badges = BADGES_CONFIANZA
    ctx.font = `bold 20px "Segoe UI",Arial,sans-serif`
    const { r: vr, g: vg2, b: vb } = rgb(P.verde)
    const tot = badges.reduce((s, b) => s + ctx.measureText(b).width + 36 + 26, 0) + 14 * 3
    let sx = (W - tot) / 2
    const bY = mostrarPrecio && producto?.precio_venta ? pY + 420 : pY + 308

    badges.forEach((label, i) => {
      const tw = ctx.measureText(label).width
      const bw = tw + 36 + 26
      ctx.fillStyle = i === 3 ? sq.aA : `rgba(${vr},${vg2},${vb},0.82)`
      ctx.beginPath()
      ctx.roundRect(sx, bY, bw, 40, 20)
      ctx.fill()
      ctx.fillStyle = P.dorado
      ctx.beginPath()
      ctx.arc(sx + 14, bY + 20, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = sq.bg
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.moveTo(sx + 9.5, bY + 20)
      ctx.lineTo(sx + 13, bY + 24)
      ctx.lineTo(sx + 19, bY + 16)
      ctx.stroke()
      ctx.font = `bold 20px "Segoe UI",Arial,sans-serif`
      ctx.fillStyle = P.crema
      ctx.fillText(label, sx + 28, bY + 27)
      sx += bw + 14
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ZONA INFERIOR COMPARTIDA
  // ══════════════════════════════════════════════════════════════════════════

  // Stories: zona guía del sticker de link
  if (formato === 'stories') {
    const sY = Math.round(H * 0.78)
    const sH = Math.round(H * 0.11)
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.fillRect(0, sY, W, sH)
    ctx.strokeStyle = 'rgba(255,255,255,0.13)'
    ctx.lineWidth = 1
    ctx.setLineDash([12, 8])
    ctx.strokeRect(2, sY, W - 4, sH)
    ctx.setLineDash([])
    ctx.font = `italic 18px "Segoe UI",Arial,sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.28)'
    cTxt(ctx, 'zona sticker de link · Instagram', sY + sH / 2 + 7, W)
  }

  const ctaTop =
    formato === 'stories'
      ? Math.round(H * 0.78) - 235
      : H - (formato === 'feed_1_1' ? 222 : 290)

  orn(ctx, ctaTop, W, P.dorado)

  let infoY = ctaTop + 28
  if (mostrarSlogan) {
    ctx.font = `italic 21px "Segoe UI",Arial,sans-serif`
    ctx.fillStyle = P.doradoClaro
    ctx.globalAlpha = 0.82
    cTxt(ctx, '"El placer de volver a comer libremente"', ctaTop + 26, W)
    ctx.globalAlpha = 1
    infoY = ctaTop + 62
  }

  if (mostrarDelivery) {
    const infos = INFO_DELIVERY_ITEMS
    ctx.font = `18px "Segoe UI",Arial,sans-serif`
    infos.forEach((t, i) => {
      ctx.fillStyle = P.dorado
      ctx.beginPath()
      ctx.arc(W / 2 - 153, infoY + i * 30 + 10, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `rgba(${tr},${tg},${tb},0.72)`
      ctx.fillText(t, W / 2 - 141, infoY + i * 30 + 16)
    })
    infoY += 100
  }

  // Franja CTA naranja
  const ctaH = 110
  gradV(ctx, 0, infoY, W, ctaH, P.naranja, P.naranjaOsc)
  ctx.fillStyle = P.dorado
  ctx.fillRect(0, infoY, W, 3)
  ctx.fillRect(0, infoY + ctaH - 3, W, 3)
  ctx.font = `bold 44px "Segoe UI",Arial,sans-serif`
  ctx.fillStyle = P.blanco
  ctx.globalAlpha = 0.12
  ctx.fillText(textoCTA || 'Pedi en panfree.fit', W / 2 - 200 + 3, infoY + 64 + 3)
  ctx.globalAlpha = 1
  cTxt(ctx, textoCTA || 'Pedi en panfree.fit', infoY + 64, W)
  ctx.font = `19px "Segoe UI",Arial,sans-serif`
  ctx.fillStyle = P.crema
  ctx.globalAlpha = 0.8
  cTxt(ctx, 'WhatsApp: +595 984 589845', infoY + 92, W)
  ctx.globalAlpha = 1

  // Footer
  const footY = infoY + ctaH
  ctx.fillStyle = P.verdeOsc
  ctx.fillRect(0, footY, W, H - footY)
  ctx.fillStyle = P.dorado
  ctx.fillRect(0, footY, W, 2)

  if (mostrarHashtags && hashtags?.trim()) {
    ctx.font = `19px "Segoe UI",Arial,sans-serif`
    ctx.fillStyle = P.doradoClaro
    ctx.globalAlpha = 0.8
    const words = hashtags.trim().split(/\s+/)
    let line = ''
    const lines = []
    words.forEach((w) => {
      const test = line + (line ? '  ' : '') + w
      if (ctx.measureText(test).width > W - 100 && line) {
        lines.push(line)
        line = w
      } else {
        line = test
      }
    })
    if (line) lines.push(line)
    lines.slice(0, 2).forEach((l, i) => cTxt(ctx, l, footY + 28 + i * 26, W))
    ctx.globalAlpha = 1
  }

  ctx.fillStyle = P.dorado
  ctx.fillRect(0, H - 6, W, 6)
}
