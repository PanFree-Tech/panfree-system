/**
 * 📁 UBICACIÓN: src/app/api/admin/marketing/generar-contenido/route.js
 * 📌 ENDPOINT: POST /api/admin/marketing/generar-contenido
 * 📖 DESCRIPCIÓN: Generador de contenido publicitario para Instagram con CASCADA INTELIGENTE DE MOTORES DE IA:
 *    1. Google Gemini (Prioridad 1 - gemini-2.5-flash con fallback interno a gemini-3.7-flash)
 *    2. Cloudflare Workers AI (Prioridad 2 - @cf/meta/llama-3.1-8b-instruct / llama-2-7b)
 *    3. Hugging Face Inference API (Prioridad 3 - Meta-Llama-3-8B-Instruct / Llama-2-7b)
 *
 *    - La IA genera captions, copies creativos, hashtags y brief de imagen publicitaria.
 *    - Los precios y descuentos oficiales provienen de la base de datos de PanFree.
 *    - Si un motor falla (503 / High Demand) o no tiene API Key, pasa automáticamente al siguiente.
 */

import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Constructor del prompt enriquecido para los motores de IA
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

REGLAS PARA "image_prompt":
- Debe ser ESTRICTAMENTE una descripción visual y estética para un fondo/escena de fotografía gastronómica.
- Usa términos fotográficos y descriptivos como: "fotografía gastronómica", "composición de estudio", "iluminación natural/cálida", "fondo desenfocado", "estilo artesanal", mesa de madera rústica, detalles gourmet.
- PROHIBIDO TERMINANTEMENTE en "image_prompt":
  * NO incluir precios ni signos monetarios (G/, $, %, OFF, descuento).
  * NO incluir llamados a la acción ni URLs ni teléfonos.
  * NO incluir texto promocional ni eslóganes.
  * NO incluir referencias a condiciones médicas (celiaquía, celiaco, enfermedad, intolerancias).
- El "image_prompt" debe describir SOLO la ambientación visual fotográfica donde se ubica el producto.

Responde ÚNICAMENTE con un JSON con la siguiente estructura exacta (sin texto introductorio ni explicaciones fuera del JSON):
{
  "image_prompt": "fotografía gastronómica de ${nombreProd}, composición de estudio profesional, estilo artesanal, sobre mesa de madera rústica con harina y espigas decorativas, iluminación natural cálida, fondo desenfocado (bokeh) de panadería elegante",
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

/**
 * Limpia y parsea el JSON retornado por cualquier LLM
 */
function parseJsonFromLlm(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Respuesta de texto vacía del modelo de IA')
  }

  const cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*$/gi, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    // Buscar el primer '{' y el último '}' si hay texto periférico
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonCandidate = cleaned.substring(firstBrace, lastBrace + 1)
      return JSON.parse(jsonCandidate)
    }
    throw new Error('No se pudo encontrar una estructura JSON válida en la respuesta del modelo')
  }
}

/**
 * MOTOR 1: Google Gemini con fallback interno de modelos
 */
async function generarConGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no configurada')
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  })

  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-3.7-flash',
    'gemini-flash-latest',
  ]

  let lastError = null

  for (const modelName of candidateModels) {
    try {
      console.log(`🤖 [Cascada: Gemini] Intentando con modelo: ${modelName}...`)
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      })

      const rawText = response.text || ''
      const parsed = parseJsonFromLlm(rawText)

      return {
        parsed,
        rawText,
        modelUsed: modelName,
        engineName: 'Google Gemini',
      }
    } catch (err) {
      console.warn(`⚠️ [Cascada: Gemini] Modelo ${modelName} falló:`, err.message)
      lastError = err
    }
  }

  throw new Error(`Todos los modelos de Gemini fallaron: ${lastError?.message || 'Error desconocido'}`)
}

/**
 * MOTOR 2: Cloudflare Workers AI (@cf/meta/llama-3.1-8b-instruct / llama-2-7b-chat-int8)
 */
async function generarConCloudflare(prompt) {
  const apiKey = process.env.CLOUDFLARE_API_KEY
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID

  if (!apiKey || !accountId) {
    throw new Error('CLOUDFLARE_API_KEY o CLOUDFLARE_ACCOUNT_ID no configuradas')
  }

  const candidateModels = [
    '@cf/meta/llama-3.1-8b-instruct',
    '@cf/meta/llama-3-8b-instruct',
    '@cf/meta/llama-2-7b-chat-int8',
  ]

  let lastError = null

  for (const model of candidateModels) {
    try {
      console.log(`☁️ [Cascada: Cloudflare] Intentando con modelo: ${model}...`)
      const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 35000)

      const res = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          max_tokens: 1200,
        }),
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`HTTP ${res.status}: ${errBody}`)
      }

      const json = await res.json()
      const rawText = json?.result?.response || json?.result?.text || ''

      if (!rawText) {
        throw new Error('Respuesta vacía de Cloudflare Workers AI')
      }

      const parsed = parseJsonFromLlm(rawText)

      return {
        parsed,
        rawText,
        modelUsed: `cloudflare-${model.split('/').pop()}`,
        engineName: 'Cloudflare Workers AI',
      }
    } catch (err) {
      console.warn(`⚠️ [Cascada: Cloudflare] Modelo ${model} falló:`, err.message)
      lastError = err
    }
  }

  throw new Error(`Todos los modelos de Cloudflare Workers AI fallaron: ${lastError?.message || 'Error desconocido'}`)
}

/**
 * MOTOR 3: Hugging Face Inference API (meta-llama / mistralai)
 */
async function generarConHuggingFace(prompt) {
  const apiKey = process.env.HF_API_KEY
  if (!apiKey) {
    throw new Error('HF_API_KEY no configurada')
  }

  const candidateModels = [
    'meta-llama/Meta-Llama-3-8B-Instruct',
    'mistralai/Mistral-7B-Instruct-v0.3',
    'meta-llama/Llama-2-7b-chat-hf',
  ]

  let lastError = null

  for (const model of candidateModels) {
    try {
      console.log(`🤗 [Cascada: Hugging Face] Intentando con modelo: ${model}...`)
      const endpoint = `https://api-inference.huggingface.co/models/${model}`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 35000)

      const res = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 1200,
            return_full_text: false,
          },
        }),
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`HTTP ${res.status}: ${errBody}`)
      }

      const json = await res.json()
      let rawText = ''

      if (Array.isArray(json) && json[0]?.generated_text) {
        rawText = json[0].generated_text
      } else if (json?.generated_text) {
        rawText = json.generated_text
      } else if (typeof json === 'string') {
        rawText = json
      }

      if (!rawText) {
        throw new Error('Respuesta vacía de Hugging Face Inference')
      }

      const parsed = parseJsonFromLlm(rawText)

      return {
        parsed,
        rawText,
        modelUsed: `hf-${model.split('/').pop()}`,
        engineName: 'Hugging Face Inference',
      }
    } catch (err) {
      console.warn(`⚠️ [Cascada: Hugging Face] Modelo ${model} falló:`, err.message)
      lastError = err
    }
  }

  throw new Error(`Todos los modelos de Hugging Face fallaron: ${lastError?.message || 'Error desconocido'}`)
}

export async function POST(req) {
  try {
    const body = await req.json()
    const {
      producto_id,
      descuento = 10,
      evento = '',
      regla_id = '',
      tono = 'persuasivo',
    } = body || {}

    // 1. Obtener detalles oficiales del producto desde Supabase
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

    // 2. Construir prompt enriquecido con contexto de negocio
    const prompt = buildPrompt({
      nombreProd,
      categoriaProd,
      descuento,
      precioBaseFmt,
      precioDescFmt,
      evento,
      tono,
    })

    // 3. EJECUTAR CASCADA DE MOTORES DE IA
    const intentAttempts = []
    let resultadoGeneracion = null

    // ── PRIORIDAD 1: Google Gemini (con fallback interno) ─────────
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('🚀 [Cascada IA] Paso 1: Ejecutando Google Gemini...')
        resultadoGeneracion = await generarConGemini(prompt)
        if (resultadoGeneracion) {
          intentAttempts.push({ motor: 'Google Gemini', modelo: resultadoGeneracion.modelUsed, status: 'success' })
        }
      } catch (err) {
        console.warn('⚠️ [Cascada IA] Google Gemini no completó la petición, probando siguiente motor:', err.message)
        intentAttempts.push({ motor: 'Google Gemini', status: 'failed', error: err.message })
      }
    } else {
      console.warn('⚠️ [Cascada IA] GEMINI_API_KEY no configurada, saltando...')
      intentAttempts.push({ motor: 'Google Gemini', status: 'skipped', reason: 'No configurado' })
    }

    // ── PRIORIDAD 2: Cloudflare Workers AI ─────────────────────────
    if (!resultadoGeneracion) {
      if (process.env.CLOUDFLARE_API_KEY && process.env.CLOUDFLARE_ACCOUNT_ID) {
        try {
          console.log('🚀 [Cascada IA] Paso 2: Ejecutando Cloudflare Workers AI...')
          resultadoGeneracion = await generarConCloudflare(prompt)
          if (resultadoGeneracion) {
            intentAttempts.push({ motor: 'Cloudflare Workers AI', modelo: resultadoGeneracion.modelUsed, status: 'success' })
          }
        } catch (err) {
          console.warn('⚠️ [Cascada IA] Cloudflare Workers AI falló, probando siguiente motor:', err.message)
          intentAttempts.push({ motor: 'Cloudflare Workers AI', status: 'failed', error: err.message })
        }
      } else {
        console.warn('⚠️ [Cascada IA] Cloudflare no configurado (falta API Key o Account ID), saltando...')
        intentAttempts.push({ motor: 'Cloudflare Workers AI', status: 'skipped', reason: 'No configurado' })
      }
    }

    // ── PRIORIDAD 3: Hugging Face Inference API ───────────────────
    if (!resultadoGeneracion) {
      if (process.env.HF_API_KEY) {
        try {
          console.log('🚀 [Cascada IA] Paso 3: Ejecutando Hugging Face Inference API...')
          resultadoGeneracion = await generarConHuggingFace(prompt)
          if (resultadoGeneracion) {
            intentAttempts.push({ motor: 'Hugging Face Inference', modelo: resultadoGeneracion.modelUsed, status: 'success' })
          }
        } catch (err) {
          console.warn('⚠️ [Cascada IA] Hugging Face Inference API falló:', err.message)
          intentAttempts.push({ motor: 'Hugging Face Inference', status: 'failed', error: err.message })
        }
      } else {
        console.warn('⚠️ [Cascada IA] Hugging Face no configurado (falta HF_API_KEY), saltando...')
        intentAttempts.push({ motor: 'Hugging Face Inference', status: 'skipped', reason: 'No configurado' })
      }
    }

    // 4. Si todos los motores fallaron o no están disponibles
    if (!resultadoGeneracion || !resultadoGeneracion.parsed) {
      console.error('❌ [Cascada IA] Todos los motores de IA fallaron en la cascada.')
      return NextResponse.json(
        {
          success: false,
          error: 'Todos los motores de IA en cascada (Gemini, Cloudflare, Hugging Face) están saturados o no disponibles. Intenta nuevamente en unos momentos.',
          fallback_info: {
            attempts: intentAttempts,
          },
        },
        { status: 503 }
      )
    }

    // 5. Normalizar datos asegurando todos los campos requeridos
    const parsed = resultadoGeneracion.parsed
    const hook = parsed.hook || `¡Descubrí el auténtico sabor de ${nombreProd}! 🥖✨`
    const caption = parsed.caption || `En PanFree elaboramos delicias 100% artesanales y libres de gluten en Encarnación.`
    const callToAction = parsed.callToAction || `Pedí directo por nuestra web panfree.fit o escribinos al WhatsApp +595 984 589845 📲`
    const hashtags = parsed.hashtags || `#PanFree #SinGluten #SinTACC #Encarnacion #Paraguay #CeliacosParaguay`
    const imagePrompt = parsed.image_prompt || `fotografía gastronómica de ${nombreProd}, composición de estudio profesional, estilo artesanal, mesa de madera rústica, iluminación cálida, fondo desenfocado bokeh`

    const canvasConfig = parsed.canvas_config || {
      plantilla: 'promo',
      textoPrincipal: `${nombreProd}\n${descuento}% OFF`,
      subtitulo: `${evento ? evento + ' · ' : ''}100% Sin Gluten · Encarnación`,
      textoPromo: `★ ${descuento}% OFF · ${precioDescFmt} ★`,
      textoCTA: 'Pedi en panfree.fit',
      esquema: 'naranja',
    }

    const fullPost = `${hook}\n\n${caption}\n\n${callToAction}\n\n${hashtags}`

    console.log(`✅ [Cascada IA] Éxito con ${resultadoGeneracion.engineName} (${resultadoGeneracion.modelUsed})`)

    return NextResponse.json({
      success: true,
      content: {
        hook,
        caption,
        callToAction,
        hashtags,
        image_prompt: imagePrompt,
        canvas_config: canvasConfig,
        fullPost,
        producto,
        descuento,
        precio_final_fmt: precioDescFmt,
      },
      source: resultadoGeneracion.modelUsed,
      motor_utilizado: resultadoGeneracion.engineName,
      fallback_info: {
        engine_used: resultadoGeneracion.engineName,
        model_used: resultadoGeneracion.modelUsed,
        attempts: intentAttempts,
      },
    })
  } catch (error) {
    console.error('Error general en generar-contenido route:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error inesperado al generar contenido creativo con IA',
      },
      { status: 500 }
    )
  }
}
