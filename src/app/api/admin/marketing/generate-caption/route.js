import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY no configurada en el servidor' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { product, tone = 'persuasivo', format = 'feed' } = body || {}

    const productName = product?.nombre || 'Panificados y Delicias Artesanales Sin Gluten'
    const productPrice = product?.precio_venta
      ? `G/ ${Number(product.precio_venta).toLocaleString('es-PY')}`
      : 'Consultar precio'
    const productCategory = product?.categoria || 'Panadería y Repostería'
    const productDesc = product?.descripcion || 'Elaborado 100% libre de gluten en cocina segura en Encarnación, Paraguay.'

    const prompt = `Actúa como el Director de Marketing y Copywriter de "Panfree", un emprendimiento gastronómico premium especializado en panificados y repostería 100% sin gluten (Sin TACC) ubicado en Encarnación, Paraguay.

Genera contenido publicitario de alto engagement para Instagram con las siguientes especificaciones:
- Producto: "${productName}"
- Categoría: "${productCategory}"
- Precio: "${productPrice}"
- Descripción / Detalles: "${productDesc}"
- Tono deseado: ${tone} (cercano, tentador, profesional, enfocado en personas celíacas e intolerantes al gluten)
- Formato: ${format}

Debes responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
{
  "hook": "Una frase de apertura atractiva y con emojis",
  "caption": "El texto completo del post de Instagram con saltos de línea, emojis relevantes, propuesta de valor sin gluten, mención de Encarnación y llamado a la acción",
  "hashtags": "#PanFree #SinGluten #SinTACC #Encarnacion #Paraguay #CeliacosParaguay #PanaderiaSinGluten",
  "callToAction": "Pedí directo por nuestra web panfree.fit o escribinos al WhatsApp +595 984 589845 📲"
}`

    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    })

    const rawText = response.text || ''
    const cleanedText = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim()

    try {
      const parsed = JSON.parse(cleanedText)
      return NextResponse.json({
        success: true,
        data: parsed,
        source: 'gemini-3.7-flash',
      })
    } catch {
      return NextResponse.json({
        success: true,
        data: {
          hook: `✨ ¡Probá nuestro ${productName}! 🍞`,
          caption: rawText,
          hashtags: '#PanFree #SinGluten #SinTACC #Encarnacion #Paraguay #CeliacosParaguay',
          callToAction: '📲 Hacé tu pedido en panfree.fit o por WhatsApp al +595 984 589845',
        },
        source: 'gemini-3.7-flash-raw',
      })
    }
  } catch (error) {
    console.error('Error en generate-caption route:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al generar contenido' },
      { status: 500 }
    )
  }
}
