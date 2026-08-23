// src/app/api/admin/marketing/generar-imagen-cloudinary/route.js
import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { supabase } from '@/lib/supabase'
import { getCloudinaryClient } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

/**
 * Catálogo de motores de IA disponibles para generación de imágenes publicitarias
 */
export const MOTORES_IA = {
  gemini: {
    id: 'gemini',
    nombre: 'Google Gemini',
    modeloDefault: 'gemini-3.1-flash-image',
    modelos: [
      { id: 'gemini-3.1-flash-image', nombre: 'Gemini 3.1 Flash Image (Recomendado)', costo: '~$0.045/img' },
      { id: 'gemini-3-pro-image', nombre: 'Gemini 3 Pro Image (Alta Fidelidad)', costo: '~$0.09/img' },
    ],
    plan: 'Créditos prepago',
    costo: '~$0.045/imagen',
    descripcion: 'Motor principal de Google. Excelente calidad fotográfica y comprensión semántica de briefs.',
    requiereKey: 'GEMINI_API_KEY',
    gratuito: false,
  },
  pollinations: {
    id: 'pollinations',
    nombre: 'Pollinations.ai',
    modeloDefault: 'flux',
    modelos: [
      { id: 'flux', nombre: 'Flux (Ultra Realista)', costo: 'Gratis' },
      { id: 'turbo', nombre: 'SDXL Turbo (Rápido)', costo: 'Gratis' },
    ],
    plan: '100% Gratuito e Ilimitado',
    costo: '$0',
    descripcion: 'Acceso libre sin API Key requerida. Ideal para prototipado rápido y campañas sin coste.',
    requiereKey: null,
    gratuito: true,
  },
  leonardo: {
    id: 'leonardo',
    nombre: 'Leonardo AI',
    modeloDefault: 'aa77f04e-3eec-4034-9c07-d0f6196846fb', // Leonardo Kino XL / Phoenix
    modelos: [
      { id: 'aa77f04e-3eec-4034-9c07-d0f6196846fb', nombre: 'Leonardo Kino XL (Product Photography)', costo: 'Tokens diarios' },
      { id: 'b2614464-6028-4b72-8038-83223d2ff6c8', nombre: 'Leonardo Diffusion XL', costo: 'Tokens diarios' },
    ],
    plan: '150 tokens/día (~15-30 imágenes gratis)',
    costo: 'Planes desde $12/mes',
    descripcion: 'Especializado en fotografía de producto gastronómico, iluminación de estudio y texturas.',
    requiereKey: 'LEONARDO_API_KEY',
    gratuito: false,
  },
  agnes: {
    id: 'agnes',
    nombre: 'Agnes AI',
    modeloDefault: 'agnes-image-2.1-flash',
    modelos: [
      { id: 'agnes-image-2.1-flash', nombre: 'Agnes Image 2.1 Flash', costo: '$0 (Ilimitado)' },
    ],
    plan: '100% Gratuito e Ilimitado',
    costo: '$0',
    descripcion: 'Motor rápido sin límites de generación. Muy balanceado para redes sociales.',
    requiereKey: 'AGNES_API_KEY',
    gratuito: true,
  },
  aihubmix: {
    id: 'aihubmix',
    nombre: 'AIHubMix',
    modeloDefault: 'gpt-image-2-free',
    modelos: [
      { id: 'gpt-image-2-free', nombre: 'GPT Image 2 Free (E-commerce)', costo: '10 gratis / pago x uso' },
      { id: 'flux-pro', nombre: 'Flux Pro', costo: 'Pago x uso' },
    ],
    plan: '10 llamadas gratis al registrarse',
    costo: 'Pago por uso',
    descripcion: 'Optimizado para composiciones de e-commerce y fotografía gastronómica publicitaria.',
    requiereKey: 'AIHUBMIX_API_KEY',
    gratuito: false,
  },
  nexa: {
    id: 'nexa',
    nombre: 'NexaAPI',
    modeloDefault: 'flux-kontext',
    modelos: [
      { id: 'flux-kontext', nombre: 'Flux Kontext', costo: '$0.003/img' },
    ],
    plan: 'Ultra económico',
    costo: '$0.003/imagen',
    descripcion: 'Extremadamente económico para alto volumen con arquitectura Flux de última generación.',
    requiereKey: 'NEXA_API_KEY',
    gratuito: false,
  },
  cloudflare: {
    id: 'cloudflare',
    nombre: 'Cloudflare Workers AI',
    modeloDefault: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    modelos: [
      { id: '@cf/stabilityai/stable-diffusion-xl-base-1.0', nombre: 'Stable Diffusion XL Base 1.0', costo: '10k neuronas/día gratis' },
      { id: '@cf/bytedance/stable-diffusion-xl-lightning', nombre: 'SDXL Lightning (Ultra Rápido)', costo: '10k neuronas/día gratis' },
    ],
    plan: '10,000 neuronas/día gratis',
    costo: '$0.011 / 1k neuronas',
    descripcion: 'Infraestructura global ultra rápida y escalable en el edge de Cloudflare.',
    requiereKey: 'CLOUDFLARE_API_KEY',
    requiereExtra: 'CLOUDFLARE_ACCOUNT_ID',
    gratuito: false,
  },
  huggingface: {
    id: 'huggingface',
    nombre: 'Hugging Face Inference',
    modeloDefault: 'stabilityai/stable-diffusion-xl-base-1.0',
    modelos: [
      { id: 'stabilityai/stable-diffusion-xl-base-1.0', nombre: 'Stable Diffusion XL Base 1.0', costo: 'Créditos mensuales' },
      { id: 'black-forest-labs/FLUX.1-schnell', nombre: 'FLUX.1 Schnell (Fast Open Source)', costo: 'Créditos mensuales' },
    ],
    plan: '$0.10/mes en créditos',
    costo: 'Pago por uso',
    descripcion: 'Acceso a los mejores modelos de la comunidad open-source de Hugging Face.',
    requiereKey: 'HF_API_KEY',
    gratuito: false,
  },
}

/**
 * Función auxiliar para descargar imagen desde URL y convertir a Base64
 */
async function urlToBase64(imageUrl, timeoutMs = 50000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 PanFree-System/1.0',
      },
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`Fallo al descargar la imagen generada: HTTP ${res.status} ${res.statusText}`)
    }

    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mimeType = res.headers.get('content-type') || 'image/jpeg'
    const base64Data = buffer.toString('base64')

    return { base64Data, mimeType }
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

/**
 * 1. ADAPTADOR: Google Gemini (gemini-3.1-flash-image / gemini-3-pro-image)
 */
async function generarConGemini({ prompt, model = 'gemini-3.1-flash-image', aspectRatio = '3:4' }) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { success: false, error: 'GEMINI_API_KEY no configurada en las variables de entorno' }
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  })

  try {
    const response = await ai.models.generateContent({
      model: model || 'gemini-3.1-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      },
    })

    const imageData = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
    if (imageData) {
      return {
        success: true,
        base64Data: imageData,
        mimeType: 'image/png',
        modelUsed: model,
        engineName: 'Google Gemini',
      }
    } else {
      return { success: false, error: 'Gemini no retornó datos de imagen válidos.' }
    }
  } catch (err) {
    return { success: false, error: `Error en Gemini API: ${err.message}` }
  }
}

/**
 * 2. ADAPTADOR: Pollinations.ai (Público, 100% Gratuito sin API Key)
 */
async function generarConPollinations({ prompt, model = 'flux' }) {
  try {
    // Pollinations GET endpoint con parámetros optimizados
    const cleanPrompt = encodeURIComponent(prompt)
    const seed = Math.floor(Math.random() * 1000000)
    const selectedModel = model === 'turbo' ? 'turbo' : 'flux'
    const url = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=768&height=1024&nologo=true&enhance=true&model=${selectedModel}&seed=${seed}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 55000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PanFree-System/1.0',
      },
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`Pollinations API HTTP ${res.status}: ${res.statusText}`)
    }

    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = buffer.toString('base64')
    const mimeType = res.headers.get('content-type') || 'image/jpeg'

    return {
      success: true,
      base64Data,
      mimeType,
      modelUsed: `pollinations-${selectedModel}`,
      engineName: 'Pollinations.ai',
    }
  } catch (err) {
    return { success: false, error: `Error en Pollinations.ai: ${err.message}` }
  }
}

/**
 * 3. ADAPTADOR: Leonardo AI
 */
async function generarConLeonardo({ prompt, model = 'aa77f04e-3eec-4034-9c07-d0f6196846fb' }) {
  const apiKey = process.env.LEONARDO_API_KEY
  if (!apiKey) {
    return { success: false, error: 'LEONARDO_API_KEY no configurada en variables de entorno' }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    // 1. Iniciar el trabajo de generación
    const createRes = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        modelId: model || 'aa77f04e-3eec-4034-9c07-d0f6196846fb',
        width: 768,
        height: 1024,
        num_images: 1,
        promptMagic: true,
        photoReal: true,
      }),
    })
    clearTimeout(timeoutId)

    if (!createRes.ok) {
      const errText = await createRes.text()
      throw new Error(`Leonardo API HTTP ${createRes.status}: ${errText}`)
    }

    const createJson = await createRes.json()
    const generationId = createJson?.sdGenerationJob?.generationId || createJson?.generationId
    if (!generationId) {
      throw new Error('No se recibió generationId de Leonardo AI')
    }

    // 2. Sondear (polling) hasta que la imagen esté lista (máx 45 segundos)
    let imageUrl = null
    const startTime = Date.now()
    while (Date.now() - startTime < 45000) {
      await new Promise((r) => setTimeout(r, 3000))

      const pollRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      })

      if (pollRes.ok) {
        const pollJson = await pollRes.json()
        const generation = pollJson?.generations_by_pk || pollJson
        const status = generation?.status

        if (status === 'COMPLETE') {
          const images = generation?.generated_images || []
          if (images.length > 0 && images[0]?.url) {
            imageUrl = images[0].url
            break
          }
        } else if (status === 'FAILED') {
          throw new Error('El trabajo de generación en Leonardo AI falló.')
        }
      }
    }

    if (!imageUrl) {
      throw new Error('Tiempo de espera agotado esperando a que Leonardo AI complete la imagen.')
    }

    // 3. Descargar y convertir a base64
    const { base64Data, mimeType } = await urlToBase64(imageUrl)
    return {
      success: true,
      base64Data,
      mimeType,
      modelUsed: 'leonardo-kino-xl',
      engineName: 'Leonardo AI',
    }
  } catch (err) {
    return { success: false, error: `Error en Leonardo AI: ${err.message}` }
  }
}

/**
 * 4. ADAPTADOR: Agnes AI (agnes-image-2.1-flash)
 */
async function generarConAgnes({ prompt, model = 'agnes-image-2.1-flash' }) {
  const apiKey = process.env.AGNES_API_KEY
  if (!apiKey) {
    return { success: false, error: 'AGNES_API_KEY no configurada en variables de entorno' }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 55000)

    const res = await fetch('https://api.agnes.ai/v1/images/generations', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'agnes-image-2.1-flash',
        prompt: prompt,
        n: 1,
        size: '768x1024',
        response_format: 'b64_json',
      }),
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Agnes AI HTTP ${res.status}: ${errText}`)
    }

    const data = await res.json()
    const b64 = data?.data?.[0]?.b64_json
    const url = data?.data?.[0]?.url

    if (b64) {
      return {
        success: true,
        base64Data: b64,
        mimeType: 'image/png',
        modelUsed: model || 'agnes-image-2.1-flash',
        engineName: 'Agnes AI',
      }
    } else if (url) {
      const downloaded = await urlToBase64(url)
      return {
        success: true,
        base64Data: downloaded.base64Data,
        mimeType: downloaded.mimeType,
        modelUsed: model || 'agnes-image-2.1-flash',
        engineName: 'Agnes AI',
      }
    }

    throw new Error('Agnes AI no devolvió una imagen en base64 ni URL válida')
  } catch (err) {
    return { success: false, error: `Error en Agnes AI: ${err.message}` }
  }
}

/**
 * 5. ADAPTADOR: AIHubMix (gpt-image-2-free)
 */
async function generarConAIHubMix({ prompt, model = 'gpt-image-2-free' }) {
  const apiKey = process.env.AIHUBMIX_API_KEY
  if (!apiKey) {
    return { success: false, error: 'AIHUBMIX_API_KEY no configurada en variables de entorno' }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 55000)

    const res = await fetch('https://aihubmix.com/v1/images/generations', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-image-2-free',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json',
      }),
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`AIHubMix HTTP ${res.status}: ${errText}`)
    }

    const data = await res.json()
    const b64 = data?.data?.[0]?.b64_json
    const url = data?.data?.[0]?.url

    if (b64) {
      return {
        success: true,
        base64Data: b64,
        mimeType: 'image/png',
        modelUsed: model || 'gpt-image-2-free',
        engineName: 'AIHubMix',
      }
    } else if (url) {
      const downloaded = await urlToBase64(url)
      return {
        success: true,
        base64Data: downloaded.base64Data,
        mimeType: downloaded.mimeType,
        modelUsed: model || 'gpt-image-2-free',
        engineName: 'AIHubMix',
      }
    }

    throw new Error('AIHubMix no retornó imagen válida')
  } catch (err) {
    return { success: false, error: `Error en AIHubMix: ${err.message}` }
  }
}

/**
 * 6. ADAPTADOR: NexaAPI (flux-kontext)
 */
async function generarConNexa({ prompt, model = 'flux-kontext' }) {
  const apiKey = process.env.NEXA_API_KEY
  if (!apiKey) {
    return { success: false, error: 'NEXA_API_KEY no configurada en variables de entorno' }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 55000)

    const res = await fetch('https://api.nexa4ai.com/v1/images/generations', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'flux-kontext',
        prompt: prompt,
        n: 1,
        size: '768x1024',
        response_format: 'b64_json',
      }),
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`NexaAPI HTTP ${res.status}: ${errText}`)
    }

    const data = await res.json()
    const b64 = data?.data?.[0]?.b64_json
    const url = data?.data?.[0]?.url

    if (b64) {
      return {
        success: true,
        base64Data: b64,
        mimeType: 'image/png',
        modelUsed: model || 'flux-kontext',
        engineName: 'NexaAPI',
      }
    } else if (url) {
      const downloaded = await urlToBase64(url)
      return {
        success: true,
        base64Data: downloaded.base64Data,
        mimeType: downloaded.mimeType,
        modelUsed: model || 'flux-kontext',
        engineName: 'NexaAPI',
      }
    }

    throw new Error('NexaAPI no retornó imagen válida')
  } catch (err) {
    return { success: false, error: `Error en NexaAPI: ${err.message}` }
  }
}

/**
 * 7. ADAPTADOR: Cloudflare Workers AI (@cf/stabilityai/stable-diffusion-xl-base-1.0)
 */
async function generarConCloudflare({ prompt, model = '@cf/stabilityai/stable-diffusion-xl-base-1.0' }) {
  const apiKey = process.env.CLOUDFLARE_API_KEY
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID

  if (!apiKey || !accountId) {
    return { success: false, error: 'CLOUDFLARE_API_KEY o CLOUDFLARE_ACCOUNT_ID no configurados' }
  }

  try {
    const selectedModel = model || '@cf/stabilityai/stable-diffusion-xl-base-1.0'
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${selectedModel}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 55000)

    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        num_steps: 20,
      }),
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Cloudflare AI HTTP ${res.status}: ${errText}`)
    }

    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const json = await res.json()
      if (json?.result?.image) {
        return {
          success: true,
          base64Data: json.result.image,
          mimeType: 'image/png',
          modelUsed: selectedModel,
          engineName: 'Cloudflare Workers AI',
        }
      }
    }

    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return {
      success: true,
      base64Data: buffer.toString('base64'),
      mimeType: contentType || 'image/jpeg',
      modelUsed: selectedModel,
      engineName: 'Cloudflare Workers AI',
    }
  } catch (err) {
    return { success: false, error: `Error en Cloudflare Workers AI: ${err.message}` }
  }
}

/**
 * 8. ADAPTADOR: Hugging Face Inference API
 */
async function generarConHuggingFace({ prompt, model = 'stabilityai/stable-diffusion-xl-base-1.0' }) {
  const apiKey = process.env.HF_API_KEY
  if (!apiKey) {
    return { success: false, error: 'HF_API_KEY no configurada en variables de entorno' }
  }

  try {
    const selectedModel = model || 'stabilityai/stable-diffusion-xl-base-1.0'
    const endpoint = `https://api-inference.huggingface.co/models/${selectedModel}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 55000)

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
          negative_prompt: 'blurry, low quality, distorted, text, watermark, logo, bad anatomy',
        },
      }),
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Hugging Face HTTP ${res.status}: ${errText}`)
    }

    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mimeType = res.headers.get('content-type') || 'image/jpeg'

    return {
      success: true,
      base64Data: buffer.toString('base64'),
      mimeType,
      modelUsed: selectedModel,
      engineName: 'Hugging Face Inference',
    }
  } catch (err) {
    return { success: false, error: `Error en Hugging Face: ${err.message}` }
  }
}

/**
 * Router / Dispatcher unificado de generación de imágenes por motor
 */
async function generarImagenConMotor({ motor = 'gemini', modelo = '', prompt = '' }) {
  const motorNormalizado = (motor || 'gemini').toLowerCase().trim()
  const startTime = Date.now()

  console.log(`🚀 [Multi-Engine AI] Iniciando generación con motor: ${motorNormalizado.toUpperCase()}`)
  console.log(`   Modelo solicitado: ${modelo || 'default'}`)
  console.log(`   Longitud prompt: ${prompt.length} caracteres`)

  let resultado

  switch (motorNormalizado) {
    case 'gemini':
      resultado = await generarConGemini({ prompt, model: modelo || 'gemini-3.1-flash-image' })
      break
    case 'pollinations':
      resultado = await generarConPollinations({ prompt, model: modelo || 'flux' })
      break
    case 'leonardo':
      resultado = await generarConLeonardo({ prompt, model: modelo || 'aa77f04e-3eec-4034-9c07-d0f6196846fb' })
      break
    case 'agnes':
      resultado = await generarConAgnes({ prompt, model: modelo || 'agnes-image-2.1-flash' })
      break
    case 'aihubmix':
      resultado = await generarConAIHubMix({ prompt, model: modelo || 'gpt-image-2-free' })
      break
    case 'nexa':
      resultado = await generarConNexa({ prompt, model: modelo || 'flux-kontext' })
      break
    case 'cloudflare':
      resultado = await generarConCloudflare({ prompt, model: modelo || '@cf/stabilityai/stable-diffusion-xl-base-1.0' })
      break
    case 'huggingface':
      resultado = await generarConHuggingFace({ prompt, model: modelo || 'stabilityai/stable-diffusion-xl-base-1.0' })
      break
    default:
      // Fallback a Gemini si el motor no es reconocido
      console.warn(`⚠️ Motor '${motor}' desconocido. Usando Gemini por defecto.`)
      resultado = await generarConGemini({ prompt, model: 'gemini-3.1-flash-image' })
      break
  }

  const durationMs = Date.now() - startTime

  if (resultado.success) {
    console.log(`✅ [Multi-Engine AI] Éxito con ${resultado.engineName || motorNormalizado} (${resultado.modelUsed}) en ${durationMs}ms`)
  } else {
    console.error(`❌ [Multi-Engine AI] Error con ${motorNormalizado} (${durationMs}ms): ${resultado.error}`)
  }

  return {
    ...resultado,
    durationMs,
    motor: motorNormalizado,
  }
}

/**
 * GET: Devuelve el estado de disponibilidad y catálogo de todos los motores de IA
 */
export async function GET() {
  const catalogoConEstado = Object.values(MOTORES_IA).map((motor) => {
    let configurado = true
    if (motor.requiereKey && !process.env[motor.requiereKey]) {
      configurado = false
    }
    if (motor.requiereExtra && !process.env[motor.requiereExtra]) {
      configurado = false
    }

    return {
      ...motor,
      disponible: configurado,
      estadoTexto: configurado ? 'Configurado' : 'Falta API Key',
    }
  })

  return NextResponse.json({
    success: true,
    motores: catalogoConEstado,
    total: catalogoConEstado.length,
  })
}

/**
 * POST: Generación de imagen con el motor seleccionado, subida a Cloudinary y registro en Supabase
 */
export async function POST(req) {
  try {
    const body = await req.json()
    const {
      producto_id,
      descuento = 0,
      evento = '',
      brief_creativo = '',
      custom_image_url = null,
      motor = 'gemini',
      modelo = '',
    } = body || {}

    if (!producto_id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere producto_id para la imagen publicitaria' },
        { status: 400 }
      )
    }

    // 1. Obtener producto de Supabase
    let producto = null
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, categoria, precio_venta, imagen_url, imagen_public_id, imagenes_urls')
      .eq('id', producto_id)
      .single()

    if (!error && data) {
      producto = data
    }

    if (!producto) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado en la base de datos' },
        { status: 404 }
      )
    }

    // 2. Construir el prompt fotográfico profesional
    const nombreProducto = producto.nombre
    const precioOriginal = Number(producto.precio_venta) || 28000
    const descuentoNum = Number(descuento) || 0
    const precioPromo = Math.round(precioOriginal * (1 - descuentoNum / 100))

    const promptBase = brief_creativo || 
      `fotografía publicitaria profesional de ${nombreProducto}, panadería artesanal sin gluten de alta calidad, estilo Instagram, iluminación de estudio gastronómico cálida, composición atractiva sobre mesa de madera rústica, 8k, hiperrealista, sin texto superpuesto, sin logotipos, sin marcas de agua`

    // Incluir referencia visual del producto si está disponible
    let imageReferencePart = ''
    if (custom_image_url && custom_image_url.startsWith('http')) {
      imageReferencePart = ` Referencia visual del producto: ${custom_image_url}`
    } else if (producto.imagen_url && producto.imagen_url.startsWith('http')) {
      imageReferencePart = ` Referencia visual del producto: ${producto.imagen_url}`
    }

    const promptFinal = `${promptBase}.${imageReferencePart}`

    // 3. Ejecutar el motor de IA seleccionado
    const motorResultado = await generarImagenConMotor({
      motor: motor || 'gemini',
      modelo: modelo,
      prompt: promptFinal,
    })

    if (!motorResultado.success) {
      return NextResponse.json(
        {
          success: false,
          error: motorResultado.error || 'Error al generar la imagen con el motor seleccionado',
          motor_fallido: motor,
          sugerencia: 'Prueba seleccionando otro motor como Google Gemini o Pollinations.ai (gratuito sin API key).',
        },
        { status: 500 }
      )
    }

    // 4. Subir la imagen generada a Cloudinary (carpeta marketing/)
    const cloudinary = getCloudinaryClient()
    const timestamp = Date.now()
    const cleanId = String(producto.id).replace(/-/g, '')
    const publicIdDestino = `marketing/art_${cleanId}_${timestamp}`

    const dataUri = `data:${motorResultado.mimeType};base64,${motorResultado.base64Data}`
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      public_id: publicIdDestino,
      overwrite: true,
      resource_type: 'image',
      secure: true,
    })

    const generatedImageUrl = uploadResult.secure_url

    // 5. Guardar registro en Supabase (generaciones_imagen)
    try {
      await supabase.from('generaciones_imagen').insert([{
        producto_id: producto.id,
        imagen_original_url: producto.imagen_url || null,
        imagen_generada_url: generatedImageUrl,
        transformaciones: [
          { motor: motorResultado.motor, modelo: motorResultado.modelUsed, duracion_ms: motorResultado.durationMs }
        ],
        prompt_creativo: promptFinal,
        evento: evento || null,
        descuento_aplicado: descuentoNum,
        precio_original: precioOriginal,
        precio_promocional: precioPromo,
      }])
    } catch (dbErr) {
      console.warn('⚠️ No se pudo guardar el registro en generaciones_imagen (no crítico):', dbErr?.message)
    }

    const nombreMotorLegible = motorResultado.engineName || motor
    const modeloLegible = motorResultado.modelUsed || modelo

    return NextResponse.json({
      success: true,
      imagen_url: generatedImageUrl,
      motor_utilizado: motorResultado.motor,
      motor_nombre: nombreMotorLegible,
      modelo_utilizado: modeloLegible,
      tiempo_ms: motorResultado.durationMs,
      prompt_utilizado: promptFinal,
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        precio_original: precioOriginal,
        precio_original_fmt: `G/ ${precioOriginal.toLocaleString('es-PY')}`,
        precio_promocional: precioPromo,
        precio_promocional_fmt: `G/ ${precioPromo.toLocaleString('es-PY')}`,
        descuento: descuentoNum,
      },
      mensaje: `✅ Arte publicitario generado con ${nombreMotorLegible} (${modeloLegible}) en ${(motorResultado.durationMs / 1000).toFixed(1)}s y guardado en Cloudinary.`,
    })

  } catch (error) {
    console.error('❌ Error general en generar-imagen-cloudinary:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error inesperado al generar y subir la imagen' },
      { status: 500 }
    )
  }
}

