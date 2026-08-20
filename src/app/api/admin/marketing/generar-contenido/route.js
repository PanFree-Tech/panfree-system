/**
 * 📁 UBICACIÓN: src/app/api/admin/marketing/generar-contenido/route.js
 * 📌 ENDPOINT: POST /api/admin/marketing/generar-contenido
 * 📖 DESCRIPCIÓN: Generador de contenido creativo multimodal potenciado por Gemini 3.7 Flash.
 *    Produce prompts para generación de imagen, copies publicitarios para Instagram,
 *    y configuración visual automática adaptada a la identidad de PanFree.
 */

import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { supabase } from '@/lib/supabase'

export async function POST(req) {
  try {
    const body = await req.json()
    const {
      producto_id,
      descuento = 10,
      evento = '',
      regla_id = '',
      tono = 'persuasivo'
    } = body || {}

    // 1. Obtener detalles del producto
    let producto = null
    if (producto_id) {
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .eq('id', producto_id)
          .single()

        if (!error && data) {
          producto = data
        }
      } catch (e) {
        console.warn('No se pudo cargar producto desde DB en generar-contenido:', e.message)
      }
    }

    const nombreProd = producto?.nombre || 'Panificados y Delicias Artesanales Sin Gluten'
    const precioBase = Number(producto?.precio_venta) || 25000
    const precioDesc = Math.round(precioBase * (1 - Number(descuento) / 100))
    const precioBaseFmt = `G/ ${precioBase.toLocaleString('es-PY')}`
    const precioDescFmt = `G/ ${precioDesc.toLocaleString('es-PY')}`
    const categoriaProd = producto?.categoria || 'Panadería y Repostería'

    // 2. Construir Prompt enriquecido para Gemini
    const prompt = `Actúa como el Director de Marketing y Creativo de "Panfree", el emprendimiento líder de panadería y repostería artesanal 100% Sin Gluten (Sin TACC) en Encarnación, Paraguay.

Genera una campaña creativa completa para Instagram con estos datos:
- Producto: "${nombreProd}"
- Categoría: "${categoriaProd}"
- Descuento promocional: ${descuento}% OFF
- Precio Original: ${precioBaseFmt}
- Precio con Descuento: ${precioDescFmt}
- Evento / Contexto: "${evento || 'Promoción de la Semana'}"
- Tono: ${tono} (tentador, profesional, enfocado en personas celíacas, intolerantes y amantes de lo saludable y artesanal)

Responde ÚNICAMENTE con un JSON con la siguiente estructura exacta:
{
  "image_prompt": "Descripción artística y fotográfica detallada para generar o componer una foto publicitaria de alta calidad de este producto sin gluten con iluminación de estudio, fondo rústico y sello de ${descuento}% OFF",
  "hook": "Frase de impacto inicial con emojis",
  "caption": "Texto completo para el post de Instagram con propuesta de valor libre de gluten, mención de Encarnación, precio con descuento destacado y llamado a la acción",
  "hashtags": "#PanFree #SinGluten #SinTACC #Encarnacion #Paraguay #CeliacosParaguay #${categoriaProd.replace(/\\s+/g, '')}",
  "callToAction": "Pedí directo por nuestra web panfree.fit o escribinos al WhatsApp +595 984 589845 📲",
  "canvas_config": {
    "plantilla": "promo",
    "textoPrincipal": "${nombreProd}\\n${descuento}% OFF",
    "subtitulo": "${evento ? evento + ' · ' : ''}100% Sin Gluten · Encarnación",
    "textoPromo": "★ ${descuento}% OFF · ${precioDescFmt} ★",
    "textoCTA": "Pedi en panfree.fit",
    "esquema": "naranja"
  }
}`

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey })
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
        })

        const rawText = response.text || ''
        const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim()
        const parsed = JSON.parse(cleaned)

        const fullPost = `${parsed.hook}\n\n${parsed.caption}\n\n${parsed.callToAction}\n\n${parsed.hashtags}`

        return NextResponse.json({
          success: true,
          content: {
            ...parsed,
            fullPost: fullPost,
            producto: producto,
            descuento: descuento,
            precio_final_fmt: precioDescFmt,
          },
          source: 'gemini-3.7-flash',
        })
      } catch (geminiError) {
        console.warn('Fallo Gemini API en generar-contenido, activando generador local:', geminiError?.message)
      }
    }

    // 3. Fallback inteligente de alta calidad sin depender de conexión externa
    const eventoLabel = evento ? `con motivo de ${evento} ` : ''
    const fallbackHook = `✨ ¡Aprovechá un ${descuento}% OFF en nuestro ${nombreProd}! 🍞❤️`
    const fallbackCaption = `¡Disfrutá lo mejor de la panadería artesanal 100% libre de gluten en Encarnación! 🌾🚫\n\n` +
      `Celebramos ${eventoLabel}con una súper promo en nuestro ${nombreProd}, elaborado en cocina segura sin contaminación cruzada.\n\n` +
      `💥 Precio anterior: ~${precioBaseFmt}~\n` +
      `🏷️ Precio especial: ${precioDescFmt} (${descuento}% OFF)\n` +
      `📍 Retiros y envíos en Encarnación y alrededores.`

    const fallbackHashtags = `#PanFree #SinGluten #SinTACC #Encarnacion #Paraguay #CeliacosParaguay #${categoriaProd.replace(/\s+/g, '')} #PromoPanFree`
    const fallbackCTA = `👉 Hacé tu pedido en panfree.fit o escribinos al WhatsApp +595 984 589845 📲`
    const fullPost = `${fallbackHook}\n\n${fallbackCaption}\n\n${fallbackCTA}\n\n${fallbackHashtags}`

    const fallbackData = {
      image_prompt: `Fotografía gastronómica publicitaria de ${nombreProd} artesanal sin gluten sobre tabla de madera rústica, con textura dorada crujiente, granos de sésamo y distintivo flotante con el texto '${descuento}% OFF'. Estilo editorial, iluminación cálida y profesional.`,
      hook: fallbackHook,
      caption: fallbackCaption,
      hashtags: fallbackHashtags,
      callToAction: fallbackCTA,
      fullPost: fullPost,
      canvas_config: {
        plantilla: 'promo',
        textoPrincipal: `${nombreProd}\n${descuento}% OFF`,
        subtitulo: `${evento ? evento + ' · ' : ''}100% Sin Gluten · Encarnación`,
        textoPromo: `★ ${descuento}% OFF · ${precioDescFmt} ★`,
        textoCTA: 'Pedi en panfree.fit',
        esquema: 'naranja',
      },
      producto: producto,
      descuento: descuento,
      precio_final_fmt: precioDescFmt,
    }

    return NextResponse.json({
      success: true,
      content: fallbackData,
      source: 'smart-fallback',
    })
  } catch (error) {
    console.error('Error en generar-contenido route:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al generar contenido creativo' },
      { status: 500 }
    )
  }
}
