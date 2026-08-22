/**
 * 📁 UBICACIÓN: src/app/api/admin/marketing/generar-contenido/route.js
 * 📌 ENDPOINT: POST /api/admin/marketing/generar-contenido
 * 📖 DESCRIPCIÓN: Generador de contenido publicitario para Instagram potenciado por Gemini 3.7 Flash.
 *    - Requiere GEMINI_API_KEY (solo en servidor, sin prefijo NEXT_PUBLIC_).
 *    - La IA genera ÚNICAMENTE captions, copies creativos, hashtags y textos para artes visuales.
 *    - Los precios y descuentos son inyectados desde la base de datos de PanFree y reglas de negocio.
 */

import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Constructor del prompt enriquecido para Gemini
 */
function buildPrompt({ nombreProd, categoriaProd, descuento, precioBaseFmt, precioDescFmt, evento, tono }) {
  return `Actúa como el Director de Marketing y Creativo de "Panfree", el emprendimiento líder de panadería y repostería artesanal 100% Sin Gluten (Sin TACC) en Encarnación, Paraguay.

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
}

export async function POST(req) {
  try {
    // 1. Validación de API Key en el servidor (Seguridad: Nunca exponer en cliente)
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'GEMINI_API_KEY no configurada en las variables de entorno del servidor',
        },
        { status: 500 }
      )
    }

    const body = await req.json()
    const {
      producto_id,
      descuento = 10,
      evento = '',
      regla_id = '',
      tono = 'persuasivo',
    } = body || {}

    // 2. Obtener detalles del producto desde la base de datos (Precios oficiales de Supabase)
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

    // 3. Construir prompt seguro sin permitir a la IA inventar precios
    const prompt = buildPrompt({
      nombreProd,
      categoriaProd,
      descuento,
      precioBaseFmt,
      precioDescFmt,
      evento,
      tono,
    })

    // 4. Llamada a Gemini con sistema de fallback multi-modelo
    const ai = new GoogleGenAI({ apiKey })
    const candidateModels = [
      'gemini-1.5-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
    ]

    let parsed = null
    let modelUsado = null
    const fallbackAttempts = []

    for (const modelName of candidateModels) {
      try {
        console.log(`🤖 [Generar Contenido] Intentando generar con modelo: ${modelName}...`)
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        })

        const rawText = response.text || ''
        const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim()
        parsed = JSON.parse(cleaned)
        modelUsado = modelName

        console.log(`✅ [Generar Contenido] Contenido generado exitosamente con: ${modelName}`)
        fallbackAttempts.push({ model: modelName, status: 'success' })
        break
      } catch (err) {
        console.warn(`⚠️ [Generar Contenido] Falló el intento con modelo ${modelName}:`, err.message)
        fallbackAttempts.push({
          model: modelName,
          status: 'failed',
          error: err.message,
        })
      }
    }

    if (!parsed) {
      console.error('❌ [Generar Contenido] Todos los modelos de Gemini fallaron en la secuencia de fallback')
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo generar contenido con ninguno de los modelos disponibles de Gemini (503/High Demand)',
          fallback_info: {
            attempts: fallbackAttempts,
          },
        },
        { status: 503 }
      )
    }

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
      source: modelUsado.startsWith('gemini-') ? modelUsado : `gemini-${modelUsado}`,
      fallback_info: {
        model_used: modelUsado,
        attempts: fallbackAttempts,
      },
    })
  } catch (error) {
    console.error('Error en generar-contenido route:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error al generar contenido creativo con IA',
      },
      { status: 500 }
    )
  }
}
