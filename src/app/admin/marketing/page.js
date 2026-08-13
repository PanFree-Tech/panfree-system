/**
 * 📁 UBICACIÓN: src/app/admin/marketing/page.js
 * 📅 CREADO: 2026-03-07 v3
 * 📌 DESCRIPCIÓN: Generador de imágenes publicitarias para Instagram.
 *    Carga productos reales de Supabase. Canvas HTML5 client-side.
 *    Exporta PNG/JPG en resolución completa. Sin servicios externos.
 *
 *    FORMATOS:  Feed 4:5 (1080×1350) | Feed 1:1 (1080×1080) | Stories (1080×1920)
 *    PLANTILLAS: Producto Estrella | Catálogo General | Promo/Oferta
 *    ESQUEMAS:   Verde oscuro | Crema artesanal | Naranja impacto
 */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

// ─── PALETA OFICIAL PANFREE ───────────────────────────────────────────────────
const P = {
  crema:       '#eee6d9',
  verde:       '#334c2b',
  verdeMed:    '#2a3e23',
  verdeOsc:    '#1c2c17',
  naranja:     '#f46e15',
  naranjaOsc:  '#c8550a',
  dorado:      '#b7996b',
  doradoClaro: '#d2b991',
  blanco:      '#ffffff',
}

const FORMATOS = {
  feed_4_5: { label: 'Feed Vertical 4:5',    w: 1080, h: 1350, tag: '📱', desc: 'Mayor alcance · recomendado' },
  feed_1_1: { label: 'Feed Cuadrado 1:1',    w: 1080, h: 1080, tag: '⬛', desc: 'Clásico · grid uniforme' },
  stories:  { label: 'Stories / Reels 9:16', w: 1080, h: 1920, tag: '📲', desc: 'Sticker de link disponible' },
}

const PLANTILLAS = {
  hero:     { label: '✦ Producto estrella',  desc: 'Un producto, impacto máximo' },
  catalogo: { label: '◈ Catálogo general',   desc: 'Todas las categorías + precios' },
  promo:    { label: '★ Promo / Oferta',      desc: 'Descuento o urgencia de compra' },
}

const ESQUEMAS = {
  oscuro:  { label: 'Verde oscuro (clásico)', bg: P.verdeOsc,   bgBot: P.verde,      txt: P.crema,  aA: P.naranja, aB: P.dorado },
  claro:   { label: 'Crema artesanal',         bg: P.crema,      bgBot: '#d4c9b5',    txt: P.verde,  aA: P.naranja, aB: P.verde  },
  naranja: { label: 'Naranja impacto',          bg: P.naranjaOsc, bgBot: '#5a1e00',    txt: P.blanco, aA: P.crema,   aB: P.dorado },
}

const HASHTAGS_DEFAULT = '#PanFree #SinGluten #SinTACC #Encarnacion #Paraguay #PanificadosSinGluten'

const fmt2PYG = n => `G/ ${Number(n||0).toLocaleString('es-PY')}`

// ─── HELPERS CANVAS ───────────────────────────────────────────────────────────
const rgb = h => ({ r:parseInt(h.slice(1,3),16), g:parseInt(h.slice(3,5),16), b:parseInt(h.slice(5,7),16) })

function gradV(ctx, x, y, w, h, cT, cB) {
  const g = ctx.createLinearGradient(x,y,x,y+h)
  g.addColorStop(0,cT); g.addColorStop(1,cB)
  ctx.fillStyle=g; ctx.fillRect(x,y,w,h)
}

function cTxt(ctx, text, y, W) {
  const m = ctx.measureText(text)
  ctx.fillText(text,(W-m.width)/2,y)
}

function orn(ctx, y, W, col) {
  const cx=W/2
  ctx.globalAlpha=0.6; ctx.strokeStyle=col; ctx.lineWidth=1.5
  ctx.beginPath(); ctx.moveTo(cx-155,y); ctx.lineTo(cx-30,y); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx+30,y);  ctx.lineTo(cx+155,y); ctx.stroke()
  ctx.globalAlpha=1; ctx.fillStyle=col
  ctx.beginPath()
  ctx.moveTo(cx,y-9); ctx.lineTo(cx+12,y); ctx.lineTo(cx,y+9); ctx.lineTo(cx-12,y)
  ctx.closePath(); ctx.fill()
}

function rr(ctx, x, y, w, h, r, fill, stroke, sw=1) {
  ctx.beginPath(); ctx.roundRect(x,y,w,h,r)
  if(fill)  { ctx.fillStyle=fill;   ctx.fill() }
  if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=sw; ctx.stroke() }
}

// ─── MOTOR DE RENDER ─────────────────────────────────────────────────────────
function render(canvas, params, logoImg, prodImg) {
  const {
    formato, plantilla, esquema, producto,
    textoPrincipal, subtitulo, textoCTA, textoPromo,
    mostrarPrecio, mostrarSlogan, mostrarDelivery,
    mostrarHashtags, hashtags,
    logoAltura, logoPaddingV,
  } = params

  const F=FORMATOS[formato], sq=ESQUEMAS[esquema]
  const W=F.w, H=F.h
  canvas.width=W; canvas.height=H
  const ctx=canvas.getContext('2d')
  ctx.clearRect(0,0,W,H)

  const {r:tr,g:tg,b:tb}=rgb(sq.txt)
  const {r:dr,g:dg,b:db}=rgb(P.dorado)

  // ── Fondo degradado ────────────────────────────────────────────────────────
  gradV(ctx,0,0,W,H,sq.bg,sq.bgBot)
  ctx.fillStyle=`rgba(${tr},${tg},${tb},0.012)`
  for(let i=0;i<H;i+=5) ctx.fillRect(0,i,W,2)

  // Círculos decorativos
  ctx.lineWidth=2
  ;[[W+90,-90,330],[W+150,-40,460],[-70,H+80,290]].forEach(([cx,cy,r])=>{
    ctx.strokeStyle=`rgba(${dr},${dg},${db},0.10)`
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke()
  })

  // Línea dorada superior
  ctx.fillStyle=P.dorado; ctx.fillRect(0,0,W,8)
  ctx.fillStyle=P.doradoClaro; ctx.globalAlpha=0.4; ctx.fillRect(0,8,W,3); ctx.globalAlpha=1

  // ── Header dinámico según tamaño de logo ─────────────────────────────────
  const lh = logoAltura || 120          // altura logo en px (canvas coords)
  const lPad = logoPaddingV || 20       // padding vertical arriba y abajo del logo
  const headerH = lh + lPad * 2 + 28   // 28 = sub-texto + margen inferior
  const headerTop = 14

  ctx.fillStyle=`rgba(${tr},${tg},${tb},0.06)`
  ctx.beginPath(); ctx.roundRect(48, headerTop, W-96, headerH, 8); ctx.fill()
  ctx.strokeStyle=P.dorado; ctx.lineWidth=1.2; ctx.globalAlpha=0.7
  ctx.beginPath(); ctx.roundRect(48, headerTop, W-96, headerH, 8); ctx.stroke(); ctx.globalAlpha=1
  ctx.fillStyle=P.dorado; ctx.globalAlpha=0.8
  ctx.fillRect(48, headerTop, 4, headerH)
  ctx.fillRect(W-52, headerTop, 4, headerH)
  ctx.globalAlpha=1

  // Logo centrado verticalmente en el header
  const logoTop = headerTop + lPad
  if(logoImg?.complete && logoImg?.naturalWidth>0){
    const lw=(logoImg.naturalWidth/logoImg.naturalHeight)*lh
    ctx.drawImage(logoImg,(W-lw)/2, logoTop, lw, lh)
  } else {
    const fsFallback = Math.round(lh * 0.65)
    ctx.font=`bold ${fsFallback}px "Segoe UI",Arial,sans-serif`; ctx.fillStyle=sq.txt
    cTxt(ctx,'PanFree', logoTop + lh * 0.75, W)
  }

  // Sub-texto bajo el logo
  const subTextoY = headerTop + headerH - 10
  ctx.font=`14px "Segoe UI",Arial,sans-serif`
  ctx.fillStyle=P.doradoClaro; ctx.globalAlpha=0.8
  cTxt(ctx,'PANIFICADOS SIN GLUTEN  ·  ENCARNACION, PARAGUAY', subTextoY, W)
  ctx.globalAlpha=1

  // Ornamento separador
  const ornY = headerTop + headerH + 18
  orn(ctx, ornY, W, P.dorado)

  // ══════════════════════════════════════════════════════════════════════════
  // PLANTILLA: HERO
  // ══════════════════════════════════════════════════════════════════════════
  if(plantilla==='hero'){
    const hasImg=prodImg?.complete && prodImg?.naturalWidth>0
    const iY=ornY+24, iH=formato==='feed_1_1'?320:formato==='stories'?580:420, iX=50, iW=W-100

    if(hasImg){
      rr(ctx,iX-3,iY-3,iW+6,iH+6,12,null,P.dorado,2)
      ctx.save()
      ctx.beginPath(); ctx.roundRect(iX,iY,iW,iH,10); ctx.clip()
      const sc=Math.max(iW/prodImg.naturalWidth,iH/prodImg.naturalHeight)
      const dw=prodImg.naturalWidth*sc, dh=prodImg.naturalHeight*sc
      ctx.drawImage(prodImg,iX+(iW-dw)/2,iY+(iH-dh)/2,dw,dh)
      const vg=ctx.createLinearGradient(0,iY+iH*0.52,0,iY+iH)
      vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.55)')
      ctx.fillStyle=vg; ctx.fillRect(iX,iY,iW,iH)
      ctx.restore()
    } else {
      rr(ctx,iX,iY,iW,iH,10,`rgba(${tr},${tg},${tb},0.06)`,P.dorado+'55',1.5)
      ctx.font=`96px Arial`; ctx.fillStyle=`rgba(${tr},${tg},${tb},0.10)`
      cTxt(ctx,'🍞',iY+iH/2+32,W)
    }

    const base=iY+iH+30
    const nom=producto?.nombre||'Producto PanFree'
    let fs=70
    ctx.font=`bold ${fs}px "Segoe UI",Arial,sans-serif`
    while(ctx.measureText(nom).width>W-80&&fs>26){ fs-=3; ctx.font=`bold ${fs}px "Segoe UI",Arial,sans-serif` }
    ctx.fillStyle=sq.txt; cTxt(ctx,nom,base+fs,W)

    if(subtitulo){
      ctx.font=`22px "Segoe UI",Arial,sans-serif`; ctx.fillStyle=P.doradoClaro
      cTxt(ctx,subtitulo,base+fs+34,W)
    }
    orn(ctx,base+fs+(subtitulo?58:26),W,P.dorado)

    if(textoPrincipal){
      const lines=textoPrincipal.split('\n')
      let cy=base+fs+(subtitulo?86:54)
      ;[52,66,38].forEach((sz,i)=>{
        if(!lines[i]) return
        ctx.font=`bold ${sz}px "Segoe UI",Arial,sans-serif`
        ctx.fillStyle=[sq.txt,sq.aA,P.dorado][i]||sq.txt
        cTxt(ctx,lines[i],cy,W); cy+=sz+10
      })
    }

    if(mostrarPrecio&&producto?.precio_venta){
      const py=H-(formato==='feed_1_1'?295:375)
      rr(ctx,W/2-165,py-52,330,72,36,`rgba(${tr},${tg},${tb},0.08)`,sq.aB+'80',1.5)
      ctx.font=`bold 48px "Segoe UI",Arial,sans-serif`; ctx.fillStyle=sq.aA
      cTxt(ctx,fmt2PYG(producto.precio_venta),py,W)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLANTILLA: CATÁLOGO
  // ══════════════════════════════════════════════════════════════════════════
  if(plantilla==='catalogo'){
    ctx.font=`34px "Segoe UI",Arial,sans-serif`
    ctx.fillStyle=`rgba(${tr},${tg},${tb},0.6)`
    cTxt(ctx,'¿Celiaco? ¿Intolerante al gluten?',ornY+36,W)

    const lines=(textoPrincipal||'El placer de\nvolver a\nCOMER\nlibremente.').split('\n')
    const sz=[62,80,108,78], cl=[sq.txt,sq.aA,sq.txt,P.dorado]
    let ty=ornY+86
    lines.forEach((l,i)=>{
      ctx.font=`bold ${sz[Math.min(i,3)]}px "Segoe UI",Arial,sans-serif`
      ctx.fillStyle=cl[Math.min(i,3)]; cTxt(ctx,l,ty,W); ty+=sz[Math.min(i,3)]+8
    })
    orn(ctx,ty+16,W,P.dorado)

    const cats=[
      {cat:'PANES',   desc:'De miga, molde, integral',     p:'desde G/ 25.000'},
      {cat:'DULCES',  desc:'Facturas, medialunas, budines', p:'desde G/ 38.000'},
      {cat:'SALADOS', desc:'Galletas, tartas, empanadas',   p:'desde G/ 20.000'},
      {cat:'EVENTOS', desc:'Mesas dulces, celebraciones',   p:'desde G/ 60.000'},
    ]
    const cw=468, ch=115, mx=(W-cw*2-20)/2, sy=ty+42
    cats.forEach(({cat,desc,p},i)=>{
      const cx2=mx+(i%2)*(cw+20), cy2=sy+Math.floor(i/2)*(ch+14)
      rr(ctx,cx2,cy2,cw,ch,8,`rgba(${tr},${tg},${tb},0.07)`)
      ctx.strokeStyle=P.dorado+'50'; ctx.lineWidth=1
      ctx.beginPath(); ctx.roundRect(cx2,cy2,cw,ch,8); ctx.stroke()
      rr(ctx,cx2,cy2,5,ch,[8,0,0,8],sq.aA)
      ctx.font=`bold 26px "Segoe UI",Arial,sans-serif`; ctx.fillStyle=sq.txt; ctx.fillText(cat,cx2+22,cy2+34)
      ctx.font=`18px "Segoe UI",Arial,sans-serif`;      ctx.fillStyle=P.doradoClaro; ctx.fillText(desc,cx2+22,cy2+60)
      ctx.font=`bold 21px "Segoe UI",Arial,sans-serif`; ctx.fillStyle=sq.aA; ctx.fillText(p,cx2+22,cy2+88)
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLANTILLA: PROMO
  // ══════════════════════════════════════════════════════════════════════════
  if(plantilla==='promo'){
    const pY=ornY+24
    rr(ctx,(W-320)/2,pY,320,52,26,sq.aA)
    ctx.font=`bold 26px "Segoe UI",Arial,sans-serif`; ctx.fillStyle=P.blanco
    cTxt(ctx,textoPromo||'★  OFERTA ESPECIAL  ★',pY+36,W)
    orn(ctx,pY+74,W,P.dorado)
    const nom=producto?.nombre||'Producto Especial'
    let fs2=72
    ctx.font=`bold ${fs2}px "Segoe UI",Arial,sans-serif`
    while(ctx.measureText(nom).width>W-80&&fs2>28){fs2-=3;ctx.font=`bold ${fs2}px "Segoe UI",Arial,sans-serif`}
    ctx.fillStyle=sq.txt; cTxt(ctx,nom,pY+154,W)
    if(textoPrincipal){
      ctx.font=`34px "Segoe UI",Arial,sans-serif`; ctx.fillStyle=P.doradoClaro
      cTxt(ctx,textoPrincipal,pY+204,W)
    }
    orn(ctx,pY+236,W,P.dorado)
    if(mostrarPrecio&&producto?.precio_venta){
      ctx.font=`bold 30px "Segoe UI",Arial,sans-serif`; ctx.fillStyle=`rgba(${tr},${tg},${tb},0.5)`
      cTxt(ctx,'Solo por tiempo limitado',pY+282,W)
      ctx.font=`bold 96px "Segoe UI",Arial,sans-serif`; ctx.fillStyle=sq.aA
      cTxt(ctx,fmt2PYG(producto.precio_venta),pY+388,W)
    }
    // Badges de confianza
    const badges=['Sin Gluten','Sin TACC','Artesanal','Encarga Ya']
    ctx.font=`bold 20px "Segoe UI",Arial,sans-serif`
    const {r:vr,g:vg2,b:vb}=rgb(P.verde)
    const tot=badges.reduce((s,b)=>s+ctx.measureText(b).width+36+26,0)+14*3
    let sx=(W-tot)/2
    const bY=mostrarPrecio&&producto?.precio_venta?pY+420:pY+308
    badges.forEach((label,i)=>{
      const tw=ctx.measureText(label).width, bw=tw+36+26
      ctx.fillStyle=i===3?sq.aA:`rgba(${vr},${vg2},${vb},0.82)`
      ctx.beginPath(); ctx.roundRect(sx,bY,bw,40,20); ctx.fill()
      ctx.fillStyle=P.dorado; ctx.beginPath(); ctx.arc(sx+14,bY+20,8,0,Math.PI*2); ctx.fill()
      ctx.strokeStyle=sq.bg; ctx.lineWidth=1.8
      ctx.beginPath(); ctx.moveTo(sx+9.5,bY+20); ctx.lineTo(sx+13,bY+24); ctx.lineTo(sx+19,bY+16); ctx.stroke()
      ctx.font=`bold 20px "Segoe UI",Arial,sans-serif`; ctx.fillStyle=P.crema
      ctx.fillText(label,sx+28,bY+27); sx+=bw+14
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ZONA INFERIOR COMPARTIDA
  // ══════════════════════════════════════════════════════════════════════════

  // Stories: zona guía del sticker de link
  if(formato==='stories'){
    const sY=Math.round(H*0.78), sH=Math.round(H*0.11)
    ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(0,sY,W,sH)
    ctx.strokeStyle='rgba(255,255,255,0.13)'; ctx.lineWidth=1
    ctx.setLineDash([12,8]); ctx.strokeRect(2,sY,W-4,sH); ctx.setLineDash([])
    ctx.font=`italic 18px "Segoe UI",Arial,sans-serif`
    ctx.fillStyle='rgba(255,255,255,0.28)'
    cTxt(ctx,'zona sticker de link · Instagram',sY+sH/2+7,W)
  }

  const ctaTop = formato==='stories'
    ? Math.round(H*0.78)-235
    : H-(formato==='feed_1_1'?222:290)

  orn(ctx,ctaTop,W,P.dorado)

  let infoY=ctaTop+28
  if(mostrarSlogan){
    ctx.font=`italic 21px "Segoe UI",Arial,sans-serif`
    ctx.fillStyle=P.doradoClaro; ctx.globalAlpha=0.82
    cTxt(ctx,'"El placer de volver a comer libremente"',ctaTop+26,W)
    ctx.globalAlpha=1; infoY=ctaTop+62
  }
  if(mostrarDelivery){
    const infos=['Envio gratis desde G/ 50.000','Retiro en Encarnacion','Pedidos con 24hs anticipacion']
    ctx.font=`18px "Segoe UI",Arial,sans-serif`
    infos.forEach((t,i)=>{
      ctx.fillStyle=P.dorado
      ctx.beginPath(); ctx.arc(W/2-153,infoY+i*30+10,4,0,Math.PI*2); ctx.fill()
      ctx.fillStyle=`rgba(${tr},${tg},${tb},0.72)`
      ctx.fillText(t,W/2-141,infoY+i*30+16)
    })
    infoY+=100
  }

  // Franja CTA naranja
  const ctaH=110
  gradV(ctx,0,infoY,W,ctaH,P.naranja,P.naranjaOsc)
  ctx.fillStyle=P.dorado; ctx.fillRect(0,infoY,W,3); ctx.fillRect(0,infoY+ctaH-3,W,3)
  ctx.font=`bold 44px "Segoe UI",Arial,sans-serif`; ctx.fillStyle=P.blanco
  ctx.globalAlpha=0.12; ctx.fillText(textoCTA||'Pedi en panfree.fit',W/2-200+3,infoY+64+3); ctx.globalAlpha=1
  cTxt(ctx,textoCTA||'Pedi en panfree.fit',infoY+64,W)
  ctx.font=`19px "Segoe UI",Arial,sans-serif`; ctx.fillStyle=P.crema; ctx.globalAlpha=0.8
  cTxt(ctx,'WhatsApp: +595 984 589845',infoY+92,W); ctx.globalAlpha=1

  // Footer
  const footY=infoY+ctaH
  ctx.fillStyle=P.verdeOsc; ctx.fillRect(0,footY,W,H-footY)
  ctx.fillStyle=P.dorado;   ctx.fillRect(0,footY,W,2)

  if(mostrarHashtags&&hashtags?.trim()){
    ctx.font=`19px "Segoe UI",Arial,sans-serif`
    ctx.fillStyle=P.doradoClaro; ctx.globalAlpha=0.8
    const words=hashtags.trim().split(/\s+/)
    let line='', lines=[]
    words.forEach(w=>{
      const test=line+(line?'  ':'')+w
      if(ctx.measureText(test).width>W-100&&line){ lines.push(line); line=w }
      else line=test
    })
    if(line) lines.push(line)
    lines.slice(0,2).forEach((l,i)=>cTxt(ctx,l,footY+28+i*26,W))
    ctx.globalAlpha=1
  }

  ctx.fillStyle=P.dorado; ctx.fillRect(0,H-6,W,6)
}

// ─── SIMULADOR DE CELULAR ─────────────────────────────────────────────────────
// Recibe dataUrl (string) que el padre actualiza en cada redibujo del canvas.
// Usa <img> para mostrar la imagen — sin canvas secundario, sin problemas de CORS.
function SimuladorCelular({ dataUrl, formato, productoActual, P }) {
  const esStories = formato === 'stories'
  const dispW = esStories ? 248 : 290
  const dispH = esStories ? 440 : (formato === 'feed_1_1' ? 290 : 362)
  const hora = new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })
  const nombre = productoActual?.nombre || 'PanFree'

  const ImgPost = ({ style }) => dataUrl
    ? <img src={dataUrl} alt="preview" style={{ display:'block', width:'100%', height:'100%', objectFit:'cover', ...style }}/>
    : <div style={{ width:'100%', height:'100%', backgroundColor:'#111', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ color:'#333', fontSize:'0.7rem' }}>Generando…</span>
      </div>

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem' }}>
      <div style={{
        position: 'relative',
        width:  dispW + 44,
        height: dispH + (esStories ? 148 : 168),
        backgroundColor: '#1a1a1a',
        borderRadius: 44,
        boxShadow: `0 0 0 2px #333, 0 0 0 4px #111, 0 24px 64px rgba(0,0,0,0.8), inset 0 0 0 1px #333`,
        flexShrink: 0,
      }}>
        {/* Botones laterales */}
        <div style={{ position:'absolute', left:-3, top:90, width:3, height:32, backgroundColor:'#2a2a2a', borderRadius:'2px 0 0 2px' }}/>
        <div style={{ position:'absolute', left:-3, top:132, width:3, height:32, backgroundColor:'#2a2a2a', borderRadius:'2px 0 0 2px' }}/>
        <div style={{ position:'absolute', right:-3, top:110, width:3, height:48, backgroundColor:'#2a2a2a', borderRadius:'0 2px 2px 0' }}/>

        {/* Pantalla */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          width: dispW + 24,
          height: dispH + (esStories ? 128 : 148),
          backgroundColor: '#000', borderRadius: 36, overflow: 'hidden',
        }}>
          {/* Status bar */}
          <div style={{ height:28, backgroundColor:'#000', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px', flexShrink:0 }}>
            <span style={{ color:'#fff', fontSize:'0.65rem', fontWeight:700, letterSpacing:'-0.02em' }}>{hora}</span>
            <div style={{ display:'flex', gap:5, alignItems:'center' }}>
              {[3,5,7,9].map((h,i)=>(<div key={i} style={{width:3,height:h,backgroundColor:'#fff',borderRadius:1,opacity:i<3?1:0.35}}/>))}
              <svg width="14" height="10" viewBox="0 0 14 10" style={{marginLeft:2}}>
                <path d="M7 8.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" fill="white"/>
                <path d="M4.5 6.5a3.5 3.5 0 0 1 5 0" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                <path d="M2.2 4.2a6.5 6.5 0 0 1 9.6 0" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5"/>
              </svg>
              <div style={{display:'flex',alignItems:'center',gap:1}}>
                <div style={{width:18,height:9,border:'1.5px solid #fff',borderRadius:2,padding:'1.5px',display:'flex',alignItems:'center'}}>
                  <div style={{width:'75%',height:'100%',backgroundColor:'#fff',borderRadius:1}}/>
                </div>
                <div style={{width:2,height:5,backgroundColor:'#fff',borderRadius:1,opacity:0.6}}/>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div style={{ backgroundColor:'#000', height: dispH + (esStories ? 100 : 120), overflow:'hidden' }}>

            {/* STORIES */}
            {esStories && (
              <div style={{ position:'relative', width:'100%', height:'100%' }}>
                <ImgPost style={{ width:dispW+24, height:'100%' }}/>
                {/* Barras de progreso */}
                <div style={{ position:'absolute', top:8, left:8, right:8, display:'flex', gap:3, zIndex:2 }}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{ flex:1, height:2.5, borderRadius:2, backgroundColor: i===0?'#fff':'rgba(255,255,255,0.35)' }}/>
                  ))}
                </div>
                {/* Header stories */}
                <div style={{ position:'absolute', top:18, left:8, right:8, display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:2 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#f46e15,#334c2b)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700, color:'#fff', border:'1.5px solid #fff' }}>PF</div>
                    <div>
                      <div style={{ color:'#fff', fontSize:'0.6rem', fontWeight:700, lineHeight:1.2 }}>panfree.fit</div>
                      <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'0.52rem' }}>Hace 2 min</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <span style={{ color:'rgba(255,255,255,0.7)', fontSize:'1rem' }}>⋯</span>
                    <span style={{ color:'rgba(255,255,255,0.7)', fontSize:'1rem' }}>✕</span>
                  </div>
                </div>
                {/* Barra inferior */}
                <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'8px 10px', display:'flex', alignItems:'center', gap:8, background:'linear-gradient(to top, rgba(0,0,0,0.5), transparent)', zIndex:2 }}>
                  <div style={{ flex:1, height:28, border:'1.5px solid rgba(255,255,255,0.5)', borderRadius:20, display:'flex', alignItems:'center', paddingLeft:10 }}>
                    <span style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.55rem' }}>Enviar mensaje</span>
                  </div>
                  <span style={{ fontSize:'1.1rem' }}>❤️</span>
                  <span style={{ fontSize:'1rem' }}>↗</span>
                </div>
              </div>
            )}

            {/* FEED */}
            {!esStories && (
              <div style={{ backgroundColor:'#000' }}>
                {/* Barra superior Instagram */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 10px', height:36, borderBottom:'0.5px solid #222' }}>
                  <span style={{ color:'#fff', fontFamily:'serif', fontSize:'1rem', fontStyle:'italic', fontWeight:700 }}>Instagram</span>
                  <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                    <span style={{ fontSize:'0.9rem' }}>♡</span>
                    <span style={{ fontSize:'0.9rem' }}>✈</span>
                  </div>
                </div>
                {/* Header del post */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 10px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', padding:2, background:'linear-gradient(135deg,#f46e15,#c8007a)' }}>
                      <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'linear-gradient(135deg,#334c2b,#b7996b)', display:'flex', alignItems:'center', justifyContent:'center', border:'1.5px solid #000', fontSize:'0.55rem', fontWeight:700, color:'#eee6d9' }}>PF</div>
                    </div>
                    <div>
                      <div style={{ color:'#fff', fontSize:'0.6rem', fontWeight:700 }}>panfree.fit</div>
                      <div style={{ color:'#888', fontSize:'0.5rem' }}>Encarnación, Paraguay</div>
                    </div>
                  </div>
                  <span style={{ color:'#fff', fontSize:'1.1rem' }}>⋯</span>
                </div>
                {/* Imagen */}
                <div style={{ width:'100%', height:dispH, backgroundColor:'#111', overflow:'hidden' }}>
                  <ImgPost/>
                </div>
                {/* Acciones */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px 4px' }}>
                  <div style={{ display:'flex', gap:11, alignItems:'center' }}>
                    <span style={{ fontSize:'1rem' }}>🤍</span>
                    <span style={{ fontSize:'0.9rem', color:'#fff' }}>💬</span>
                    <span style={{ fontSize:'0.9rem', color:'#fff' }}>↗</span>
                  </div>
                  <span style={{ fontSize:'0.9rem', color:'#fff' }}>🔖</span>
                </div>
                <div style={{ padding:'0 10px 3px' }}>
                  <span style={{ color:'#fff', fontSize:'0.58rem', fontWeight:700 }}>A 247 personas les gusta esto</span>
                </div>
                <div style={{ padding:'0 10px 4px' }}>
                  <span style={{ color:'#fff', fontSize:'0.58rem' }}>
                    <strong>panfree.fit</strong>{' '}
                    {nombre.length > 22 ? nombre.slice(0,22)+'…' : nombre} 🍞 Sin gluten · Sin TACC
                  </span>
                </div>
                <div style={{ padding:'0 10px 8px' }}>
                  <span style={{ color:'#555', fontSize:'0.52rem' }}>HACE 2 HORAS</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic island */}
        <div style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', width:72, height:22, backgroundColor:'#000', borderRadius:12, zIndex:10 }}/>
      </div>

      <div style={{ color:'#444', fontSize:'0.68rem', textAlign:'center' }}>
        Vista simulada · {esStories ? 'Stories / Reels' : 'Feed'}
      </div>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function MarketingPage() {
  const router = useRouter()
  const canvasRef  = useRef(null)
  const logoRef    = useRef(null)
  const prodImgRef = useRef(null)

  const [loadingProd,    setLoadingProd]    = useState(true)
  const [logoListo,      setLogoListo]      = useState(false)
  const [imgProdLista,   setImgProdLista]   = useState(false)
  const [productos,      setProductos]      = useState([])
  const [exportando,     setExportando]     = useState(false)

  // Parámetros del generador
  const [productoId,      setProdId]         = useState('')
  const [formato,         setFormato]        = useState('feed_4_5')
  const [plantilla,       setPlantilla]      = useState('catalogo')
  const [esquema,         setEsquema]        = useState('oscuro')
  const [textoPrincipal,  setTxtPrincipal]   = useState('El placer de\nvolver a\nCOMER\nlibremente.')
  const [subtitulo,       setSubtitulo]      = useState('')
  const [textoCTA,        setTextoCTA]       = useState('Pedi en panfree.fit')
  const [textoPromo,      setTextoPromo]     = useState('★  OFERTA ESPECIAL  ★')
  const [mostrarPrecio,   setMostrarPrecio]  = useState(true)
  const [mostrarSlogan,   setMostrarSlogan]  = useState(true)
  const [mostrarDelivery, setMostrarDelivery]= useState(true)
  const [mostrarHashtags, setMostrarHashtags]= useState(false)
  const [hashtags,        setHashtags]       = useState(HASHTAGS_DEFAULT)
  const [vistaPreview,    setVistaPreview]   = useState('celular')
  const [dataUrl,         setDataUrl]        = useState('')
  const [logoAltura,      setLogoAltura]     = useState(120)
  const [logoPaddingV,    setLogoPaddingV]   = useState(20)

  // Cargar logo
  useEffect(()=>{
    const img=new window.Image()
    img.onload  = ()=>{ logoRef.current=img; setLogoListo(true) }
    img.onerror = ()=>{ logoRef.current=null; setLogoListo(true) }
    img.src='/images/logo-panfree.png'
  },[])

  // Cargar productos
  useEffect(()=>{
    supabase
      .from('productos')
      .select('id,nombre,categoria,precio_venta,imagen_url,slug,descripcion')
      .eq('is_active',true)
      .order('is_featured',{ascending:false})
      .order('nombre')
      .then(({data})=>{ setProductos(data||[]); setLoadingProd(false) })
  },[])

  const productoActual = productos.find(p=>p.id===productoId)||null

  // Cargar imagen del producto
  useEffect(()=>{
    if(!productoActual?.imagen_url){ prodImgRef.current=null; setImgProdLista(false); return }
    setImgProdLista(false)
    const img=new window.Image()
    img.crossOrigin='anonymous'
    img.onload  = ()=>{ prodImgRef.current=img; setImgProdLista(true) }
    img.onerror = ()=>{ prodImgRef.current=null; setImgProdLista(false) }
    img.src=productoActual.imagen_url
  },[productoActual?.imagen_url])

  // Redibujar canvas y actualizar dataUrl para el simulador
  const redibujar = useCallback(()=>{
    if(!canvasRef.current||loadingProd) return
    render(canvasRef.current,{
      formato, plantilla, esquema,
      producto: productoActual,
      textoPrincipal, subtitulo, textoCTA, textoPromo,
      mostrarPrecio, mostrarSlogan, mostrarDelivery,
      mostrarHashtags, hashtags,
      logoAltura, logoPaddingV,
    }, logoRef.current, prodImgRef.current)
    try {
      setDataUrl(canvasRef.current.toDataURL('image/jpeg', 0.92))
    } catch(e) {
      setDataUrl(canvasRef.current.toDataURL('image/png'))
    }
  },[formato, plantilla, esquema, productoActual,
     textoPrincipal, subtitulo, textoCTA, textoPromo,
     mostrarPrecio, mostrarSlogan, mostrarDelivery,
     mostrarHashtags, hashtags, loadingProd, logoListo, imgProdLista,
     logoAltura, logoPaddingV])

  useEffect(()=>{ redibujar() },[redibujar])

  // Auto-ajustar textos al cambiar plantilla
  useEffect(()=>{
    if(plantilla==='hero')     { setTxtPrincipal(''); setSubtitulo('Artesanal · Sin Gluten · Sin TACC') }
    if(plantilla==='catalogo') { setTxtPrincipal('El placer de\nvolver a\nCOMER\nlibremente.'); setSubtitulo('') }
    if(plantilla==='promo')    { setTxtPrincipal('Solo por tiempo limitado'); setSubtitulo('') }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[plantilla])

  function exportar(tipo){
    if(!canvasRef.current) return
    setExportando(true)
    const F=FORMATOS[formato]
    const slug=productoActual?.slug||'panfree'
    const name=`panfree_${slug}_${F.w}x${F.h}`
    const mime=tipo==='png'?'image/png':'image/jpeg'
    const q=tipo==='png'?undefined:0.97
    canvasRef.current.toBlob(blob=>{
      const url=URL.createObjectURL(blob)
      Object.assign(document.createElement('a'),{href:url,download:`${name}.${tipo}`}).click()
      URL.revokeObjectURL(url)
      setExportando(false)
    },mime,q)
  }

  const F=FORMATOS[formato]
  const preH=560, scale=preH/F.h, preW=F.w*scale

  // ── ESTILOS ───────────────────────────────────────────────────────────────
  const S = {
    page:    { minHeight:'100vh', backgroundColor:'#f0ebe3', fontFamily:'"Segoe UI",sans-serif' },
    header:  { backgroundColor:P.verde, color:P.crema, padding:'0.85rem 1.5rem',
                display:'flex', justifyContent:'space-between', alignItems:'center',
                borderBottom:`3px solid ${P.dorado}` },
    body:    { display:'grid', gridTemplateColumns:'355px 1fr', minHeight:'calc(100vh - 62px)' },
    panel:   { backgroundColor:'#fff', borderRight:`2px solid #e0d5c5`,
                overflowY:'auto', padding:'1.25rem' },
    preview: { backgroundColor:'#141414', display:'flex', flexDirection:'column',
                alignItems:'center', padding:'2rem', gap:'1.25rem', overflowY:'auto' },
    sec:     { marginBottom:'1.2rem', borderBottom:'1px solid #ede5d8', paddingBottom:'1rem' },
    secTit:  { fontSize:'0.74rem', fontWeight:700, color:P.dorado,
                textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.55rem' },
    label:   { display:'block', fontSize:'0.74rem', fontWeight:700, color:P.verde,
                textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.28rem' },
    select:  { width:'100%', padding:'0.44rem 0.7rem', borderRadius:6,
                border:`1.5px solid ${P.dorado}`, backgroundColor:'#faf7f2',
                fontFamily:'inherit', fontSize:'0.87rem', color:P.verde,
                cursor:'pointer', outline:'none' },
    input:   { width:'100%', padding:'0.44rem 0.7rem', borderRadius:6,
                border:'1.5px solid #d4c9b5', backgroundColor:'#faf7f2',
                fontFamily:'inherit', fontSize:'0.87rem', color:P.verde,
                outline:'none', boxSizing:'border-box' },
    textarea:{ width:'100%', padding:'0.44rem 0.7rem', borderRadius:6,
                border:'1.5px solid #d4c9b5', backgroundColor:'#faf7f2',
                fontFamily:'inherit', fontSize:'0.84rem', color:P.verde,
                outline:'none', resize:'vertical', boxSizing:'border-box' },
    radio:   { display:'flex', alignItems:'flex-start', gap:'0.5rem',
                marginBottom:'0.55rem', cursor:'pointer' },
    toggle:  { display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.86rem',
                color:'#444', cursor:'pointer', marginBottom:'0.32rem' },
    btnV:    { flex:1, padding:'0.68rem', backgroundColor:P.verde, color:P.crema,
                border:'none', borderRadius:7, fontWeight:700, fontSize:'0.9rem',
                cursor:'pointer', fontFamily:'inherit' },
    btnN:    { flex:1, padding:'0.68rem', backgroundColor:P.naranja, color:'#fff',
                border:'none', borderRadius:7, fontWeight:700, fontSize:'0.9rem',
                cursor:'pointer', fontFamily:'inherit' },
    hint:    { fontSize:'0.72rem', color:'#999', marginTop:'0.2rem', lineHeight:1.45 },
    badge:   { display:'inline-block', padding:'2px 8px', borderRadius:12,
                fontSize:'0.7rem', fontWeight:700 },
    backBtn: { background:'none', border:`1px solid ${P.dorado}50`, color:P.crema,
                padding:'0.3rem 0.75rem', borderRadius:6, cursor:'pointer',
                fontFamily:'inherit', fontSize:'0.82rem' },
    helpBtn: { background:'none', border:`1px solid ${P.dorado}50`, color:P.doradoClaro,
                padding:'0.3rem 0.75rem', borderRadius:6, cursor:'pointer',
                fontFamily:'inherit', fontSize:'0.82rem' },
  }

  if(loadingProd) return (
    <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',color:P.verde}}>
        <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>🍞</div>
        <p style={{fontWeight:700}}>Cargando productos...</p>
      </div>
    </div>
  )

  return (
    <div style={S.page}>

      {/* HEADER */}
      <div style={S.header}>
        <div style={{display:'flex',alignItems:'center',gap:'0.85rem'}}>
          <button onClick={()=>router.push('/admin')} style={S.backBtn}>← Admin</button>
          <div>
            <div style={{fontWeight:800,fontSize:'1rem'}}>📸 Generador Instagram</div>
            <div style={{fontSize:'0.73rem',color:P.dorado,opacity:0.85}}>Marketing · imágenes publicitarias</div>
          </div>
        </div>
        <button onClick={()=>router.push('/admin/ayuda/marketing')} style={S.helpBtn}>
          ❓ Guía de uso
        </button>
      </div>

      {/* BODY */}
      <div style={S.body}>

        {/* ── PANEL DE CONTROL ─────────────────────────────────────────── */}
        <div style={S.panel}>

          {/* FORMATO */}
          <div style={S.sec}>
            <div style={S.secTit}>📐 Formato</div>
            {Object.entries(FORMATOS).map(([k,f])=>(
              <label key={k} style={S.radio}>
                <input type="radio" name="fmt" checked={formato===k}
                       onChange={()=>setFormato(k)} style={{accentColor:P.verde,marginTop:3}}/>
                <span>
                  <strong style={{fontSize:'0.87rem'}}>{f.tag} {f.label}</strong><br/>
                  <span style={{fontSize:'0.72rem',color:'#888'}}>{f.w}×{f.h}px · {f.desc}</span>
                </span>
              </label>
            ))}
          </div>

          {/* PLANTILLA */}
          <div style={S.sec}>
            <div style={S.secTit}>🎨 Plantilla</div>
            {Object.entries(PLANTILLAS).map(([k,p])=>(
              <label key={k} style={S.radio}>
                <input type="radio" name="plt" checked={plantilla===k}
                       onChange={()=>setPlantilla(k)} style={{accentColor:P.verde,marginTop:3}}/>
                <span>
                  <strong style={{fontSize:'0.87rem'}}>{p.label}</strong><br/>
                  <span style={{fontSize:'0.72rem',color:'#888'}}>{p.desc}</span>
                </span>
              </label>
            ))}
          </div>

          {/* ESQUEMA DE COLOR */}
          <div style={S.sec}>
            <div style={S.secTit}>🎭 Esquema de color</div>
            <select style={S.select} value={esquema} onChange={e=>setEsquema(e.target.value)}>
              {Object.entries(ESQUEMAS).map(([k,v])=>(
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* PRODUCTO */}
          <div style={S.sec}>
            <div style={S.secTit}>🍞 Producto</div>
            <select style={S.select} value={productoId} onChange={e=>setProdId(e.target.value)}>
              <option value="">— Sin producto específico —</option>
              {productos.map(p=>(
                <option key={p.id} value={p.id}>{p.nombre}  ·  {fmt2PYG(p.precio_venta)}</option>
              ))}
            </select>
            {productoActual&&(
              <div style={{marginTop:'0.4rem',display:'flex',gap:'0.3rem',flexWrap:'wrap'}}>
                <span style={{...S.badge,backgroundColor:'#e8f4e9',color:P.verde}}>{productoActual.categoria}</span>
                <span style={{...S.badge,
                  backgroundColor: productoActual.imagen_url
                    ? (imgProdLista?'#e8f4e9':'#fff8e0')
                    : '#fff0e0',
                  color: productoActual.imagen_url
                    ? (imgProdLista?P.verde:P.naranja)
                    : P.naranja,
                }}>
                  {productoActual.imagen_url
                    ? (imgProdLista?'✓ imagen OK':'⏳ cargando...')
                    : 'sin imagen'}
                </span>
              </div>
            )}
          </div>

          {/* TEXTOS */}
          <div style={S.sec}>
            <div style={S.secTit}>✏️ Textos</div>

            {plantilla==='promo'&&(
              <div style={{marginBottom:'0.65rem'}}>
                <label style={S.label}>Etiqueta de oferta</label>
                <input style={S.input} value={textoPromo} onChange={e=>setTextoPromo(e.target.value)}/>
              </div>
            )}

            <label style={S.label}>Texto principal</label>
            <textarea
              style={{...S.textarea, height:plantilla==='catalogo'?88:52}}
              value={textoPrincipal}
              onChange={e=>setTxtPrincipal(e.target.value)}
            />
            <p style={S.hint}>Enter = nueva línea. Cada línea tiene tamaño y color diferente.</p>

            {plantilla==='hero'&&(
              <div style={{marginTop:'0.65rem'}}>
                <label style={S.label}>Subtítulo</label>
                <input style={S.input} value={subtitulo}
                       onChange={e=>setSubtitulo(e.target.value)}
                       placeholder="Artesanal · Sin Gluten · Sin TACC"/>
              </div>
            )}

            <div style={{marginTop:'0.65rem'}}>
              <label style={S.label}>Texto del botón CTA</label>
              <input style={S.input} value={textoCTA} onChange={e=>setTextoCTA(e.target.value)}/>
            </div>
          </div>

          {/* OPCIONES VISUALES */}
          <div style={S.sec}>
            <div style={S.secTit}>⚙️ Mostrar en la imagen</div>
            {[
              [mostrarPrecio,    setMostrarPrecio,    'Precio del producto'],
              [mostrarSlogan,    setMostrarSlogan,    'Slogan de PanFree'],
              [mostrarDelivery,  setMostrarDelivery,  'Info de entrega'],
            ].map(([val,set,lbl])=>(
              <label key={lbl} style={S.toggle}>
                <input type="checkbox" checked={val} onChange={e=>set(e.target.checked)}
                       style={{accentColor:P.verde,width:15,height:15}}/>
                {lbl}
              </label>
            ))}
          </div>

          {/* HASHTAGS */}
          <div style={S.sec}>
            <div style={S.secTit}># Hashtags</div>
            <label style={S.toggle}>
              <input type="checkbox" checked={mostrarHashtags} onChange={e=>setMostrarHashtags(e.target.checked)}
                     style={{accentColor:P.verde,width:15,height:15}}/>
              Incluir hashtags en la imagen
            </label>
            {mostrarHashtags&&(
              <>
                <textarea
                  style={{...S.textarea,height:70,marginTop:'0.45rem'}}
                  value={hashtags}
                  onChange={e=>setHashtags(e.target.value)}
                />
                <p style={S.hint}>Separados por espacios. Máx. recomendado: 6–8 en imagen.<br/>
                  Podés agregar más en el caption de Instagram al publicar.</p>
              </>
            )}
            {!mostrarHashtags&&(
              <p style={S.hint}>Los hashtags se pueden agregar manualmente en el caption de Instagram al publicar. La imagen queda más limpia.</p>
            )}
          </div>

          {/* LOGO */}
          <div style={S.sec}>
            <div style={S.secTit}>🖼️ Logo</div>

            <label style={S.label}>
              Tamaño — {logoAltura}px
            </label>
            <input type="range" min={60} max={280} step={4}
              value={logoAltura}
              onChange={e=>setLogoAltura(Number(e.target.value))}
              style={{width:'100%', accentColor:P.verde, marginBottom:'0.75rem', cursor:'pointer'}}
            />
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.7rem',color:'#aaa',marginTop:'-0.55rem',marginBottom:'0.75rem'}}>
              <span>Pequeño</span><span>Mediano</span><span>Grande</span>
            </div>

            <label style={S.label}>
              Espacio vertical — {logoPaddingV}px
            </label>
            <input type="range" min={8} max={60} step={2}
              value={logoPaddingV}
              onChange={e=>setLogoPaddingV(Number(e.target.value))}
              style={{width:'100%', accentColor:P.verde, cursor:'pointer'}}
            />
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.7rem',color:'#aaa',marginTop:'-0.1rem',marginBottom:'0.5rem'}}>
              <span>Compacto</span><span>Amplio</span>
            </div>

            <button
              onClick={()=>{ setLogoAltura(120); setLogoPaddingV(20) }}
              style={{fontSize:'0.72rem',color:P.dorado,background:'none',border:'none',
                      cursor:'pointer',fontFamily:'inherit',padding:0,textDecoration:'underline'}}>
              Restaurar valores por defecto
            </button>
          </div>

          {/* EXPORTAR */}
          <div>
            <div style={S.secTit}>⬇️ Exportar</div>
            <div style={{display:'flex',gap:'0.6rem',marginBottom:'0.5rem'}}>
              <button style={S.btnV} onClick={()=>exportar('png')} disabled={exportando}>
                {exportando?'...':'PNG'} <span style={{fontSize:'0.71rem',opacity:0.7}}>lossless</span>
              </button>
              <button style={S.btnN} onClick={()=>exportar('jpg')} disabled={exportando}>
                {exportando?'...':'JPG'} <span style={{fontSize:'0.71rem',opacity:0.7}}>97%</span>
              </button>
            </div>
            <p style={S.hint}>
              Resolución completa: {F.w}×{F.h}px.<br/>
              Pasala al celular → publicá desde la app de Instagram.
            </p>
          </div>

        </div>

        {/* ── PREVIEW ───────────────────────────────────────────────────── */}
        <div style={S.preview}>

          {/* Barra superior: info resolución + toggle vista */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',maxWidth:380}}>
            <div style={{color:'#555',fontSize:'0.75rem'}}>
              {F.w}×{F.h}px · {F.label}
            </div>
            <div style={{display:'flex',gap:'0.3rem'}}>
              {['celular','canvas'].map(v=>(
                <button key={v} onClick={()=>setVistaPreview(v)}
                  style={{padding:'0.25rem 0.65rem',borderRadius:5,border:'none',cursor:'pointer',
                          fontFamily:'inherit',fontSize:'0.72rem',fontWeight:700,
                          backgroundColor: vistaPreview===v ? P.dorado : '#2a2a2a',
                          color: vistaPreview===v ? '#1a1a1a' : '#666',
                          transition:'all 0.15s'}}>
                  {v==='celular' ? '📱 Celular' : '🖼 Imagen'}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas SIEMPRE en el DOM — visible solo en vista imagen */}
          {/* display:none lo oculta pero sigue montado para que canvasRef funcione */}
          <div style={{display: vistaPreview==='canvas' ? 'flex' : 'none',
                       flexDirection:'column', alignItems:'center', gap:'1rem', width:'100%'}}>
            <div style={{borderRadius:8,overflow:'hidden',
                          boxShadow:'0 8px 48px rgba(0,0,0,0.7)',
                          width:preW,height:preH,flexShrink:0}}>
              <canvas ref={canvasRef} style={{width:preW,height:preH,display:'block'}}/>
            </div>
            <div style={{backgroundColor:'#1e1e1e',borderRadius:8,padding:'0.85rem 1rem',
                          maxWidth:preW,width:'100%',fontSize:'0.74rem',color:'#666',lineHeight:1.65}}>
              <span style={{color:P.dorado,fontWeight:700}}>Resolución completa</span>
              {' '}— exportá PNG/JPG y pasá al celular para publicar en Instagram.
            </div>
          </div>

          {/* ── VISTA SIMULADOR CELULAR ── */}
          {vistaPreview==='celular' && (
            <SimuladorCelular
              dataUrl={dataUrl}
              formato={formato}
              productoActual={productoActual}
              P={P}
            />
          )}

          {/* Nota zonas seguras */}
          <div style={{backgroundColor:'#1a1a1a',borderRadius:7,padding:'0.75rem 1rem',
                        maxWidth:380,width:'100%',fontSize:'0.72rem',color:'#555',lineHeight:1.65}}>
            <div style={{color:P.dorado,fontWeight:700,marginBottom:'0.25rem'}}>Zonas seguras Instagram</div>
            <div>↑ Header reservado para UI · ↓ Footer con hashtags opcionales</div>
            {formato==='stories'&&(
              <div style={{marginTop:'0.3rem',color:'#555'}}>
                📌 Sticker de link: se mueve libremente en la app de Instagram.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}