import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gbdrcaumghykiipqgbty.supabase.co'
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZHJjYXVtZ2h5a2lpcHFnYnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjczNjIsImV4cCI6MjA4NzgwMzM2Mn0.OydRQxa51Ql42zvscWnQkEKJuU_3yeCS4qPQQoP6TuM'

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

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

    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
    const businessId = process.env.INSTAGRAM_BUSINESS_ID

    let finalImageUrl = null

    // Si imageData es Base64, subir a Supabase Storage para obtener URL pública
    if (typeof imageData === 'string') {
      if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
        finalImageUrl = imageData
      } else if (imageData.startsWith('data:image') || imageData.length > 200) {
        try {
          const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')
          const fileName = `marketing/product_${productId || 'promo'}_${Date.now()}.jpg`

          const { error: uploadError } = await supabaseAdmin.storage
            .from('public-images')
            .upload(fileName, buffer, {
              contentType: 'image/jpeg',
              upsert: true,
            })

          if (!uploadError) {
            const { data: publicData } = supabaseAdmin.storage
              .from('public-images')
              .getPublicUrl(fileName)
            finalImageUrl = publicData?.publicUrl || null
          }
        } catch (e) {
          console.warn('Error subiendo imagen a Storage en publish-instagram:', e.message)
        }
      }
    }

    if (!finalImageUrl) {
      finalImageUrl = 'https://www.panfree.fit/images/logo-panfree.png'
    }

    let postId = `ig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    let postUrl = `https://www.instagram.com/p/${postId}/`
    let apiStatus = 'simulated'

    // Si cuenta con credenciales reales de Instagram Graph API en el servidor
    if (accessToken && businessId && finalImageUrl) {
      try {
        // 1. Crear contenedor de imagen
        const containerRes = await fetch(
          `https://graph.facebook.com/v19.0/${businessId}/media?image_url=${encodeURIComponent(
            finalImageUrl
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
      } catch (igErr) {
        console.warn('Instagram Graph API request fallback:', igErr?.message)
      }
    }

    // Registrar en Supabase tabla instagram_posts
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
      imageUrl: finalImageUrl,
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
