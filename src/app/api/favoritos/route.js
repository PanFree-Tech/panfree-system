import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: Obtener favoritos del usuario
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Se requiere userId' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('favoritos')
      .select('producto_id')
      .eq('cliente_id', userId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      favoritos: data?.map((f) => f.producto_id) || [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST: Agregar favorito
export async function POST(req) {
  try {
    const body = await req.json()
    const { clienteId, productoId } = body

    if (!clienteId || !productoId) {
      return NextResponse.json(
        { error: 'Se requiere clienteId y productoId' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('favoritos')
      .insert({
        cliente_id: clienteId,
        producto_id: productoId,
      })
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar favorito
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const clienteId = searchParams.get('clienteId')
    const productoId = searchParams.get('productoId')

    if (!clienteId || !productoId) {
      return NextResponse.json(
        { error: 'Se requiere clienteId y productoId' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('favoritos')
      .delete()
      .eq('cliente_id', clienteId)
      .eq('producto_id', productoId)

    if (error) throw error

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}