import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(req) {
  try {
    const body = await req.json()
    const secret = body?.secret
    if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ ok: false, message: 'invalid_secret' }, { status: 401 })
    }

    // Revalidate root and products index
    try {
      revalidatePath('/')
      revalidatePath('/productos')
    } catch (err) {
      console.error('revalidatePath error', err)
      // fallback: allow Next to handle revalidation by returning success (some platforms require different APIs)
    }

    return NextResponse.json({ revalidated: true })
  } catch (err) {
    console.error('revalidate endpoint error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
