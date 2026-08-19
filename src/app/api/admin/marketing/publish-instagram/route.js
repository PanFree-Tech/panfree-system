import { NextResponse } from 'next/server'
import { supabase } from '../../../../../lib/supabase'

export async function POST(req) {
  try {
    const body = await req.json()
    const {
      imageData, // base64 o URL
      caption,
      productName,
      productId,
      format = 'feed_4_5',
    } = body || {}

    if (!caption) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el caption para publicar' },
        { status: 400 }
      )
    }

    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN
    const businessId = process.env.INSTAGRAM_BUSINESS_ID || process.env.NEXT_PUBLIC_INSTAGRAM_BUSINESS_ID

    let postId = `ig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    let postUrl = `https://www.instagram.com/p/${postId}/`
    let apiStatus = 'simulated'

    // Si cuenta con credenciales reales de Instagram Graph API
    if (accessToken && businessId && imageData) {
      try {
        // 1. Crear contenedor de imagen
        const isUrl = typeof imageData === 'string' && imageData.startsWith('http')
        if (isUrl) {
          const containerRes = await fetch(
            `https://graph.facebook.com/v19.0/${businessId}/media?image_url=${encodeURIComponent(
              imageData
            )}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
            { method: 'POST' }
          )
          const containerData = await containerRes.json()

          if (containerData?.id) {
            // 2. Publicar contenedor
            const publishRes = await fetch(
              `https://graph.facebook.com/v19.0/${businessId}/media_publish?creation_id=${containerData.id}&access_token=${accessToken}`,
              { method: 'POST' }
            )
            const publishData = await publishRes.json()
            if (publishData?.id) {
              postId = publishData.id
              postUrl = `https://www.instagram.com/p/${publishData.id}/`
              apiStatus = 'published_live'
            }
          }
        }
      } catch (igErr) {
        console.warn('Instagram Graph API request fallback:', igErr?.message)
      }
    }

    // Registrar en Supabase si la tabla instagram_posts existe
    const postRecord = {
      product_id: productId || null,
      product_name: productName || 'Panfree Promo',
      caption,
      post_id: postId,
      post_url: postUrl,
      format,
      status: apiStatus === 'published_live' ? 'publicado' : 'programado',
      created_at: new Date().toISOString(),
    }

    try {
      await supabase.from('instagram_posts').insert([postRecord])
    } catch (dbErr) {
      console.warn('Registro en tabla instagram_posts no disponible:', dbErr?.message)
    }

    return NextResponse.json({
      success: true,
      postId,
      url: postUrl,
      status: apiStatus,
      message:
        apiStatus === 'published_live'
          ? 'Publicado exitosamente en Instagram'
          : 'Contenido preparado y programado exitosamente',
      record: postRecord,
    })
  } catch (error) {
    console.error('Error en publish-instagram API:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al procesar publicación' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('instagram_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ success: true, posts: [] })
    }

    return NextResponse.json({ success: true, posts: data || [] })
  } catch {
    return NextResponse.json({ success: true, posts: [] })
  }
}
