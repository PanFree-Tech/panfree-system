import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseKey) {
      return new Response('Missing Supabase config', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: productos, error } = await supabase
      .from('productos')
      .select('slug, updated_at')
      .eq('is_active', true)

    if (error) {
      console.error('[sitemap] supabase error', error)
      return new Response('Error fetching products', { status: 500 })
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.panfree.fit'
    const items = (productos || []).map(p => `<url><loc>${base}/producto/${p.slug}</loc><lastmod>${(p.updated_at || new Date()).toISOString()}</lastmod></url>`).join('')
    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</urlset>`

    return new Response(xml, { headers: { 'Content-Type': 'application/xml' } })
  } catch (err) {
    console.error('[sitemap] unexpected error', err)
    return new Response('Internal error', { status: 500 })
  }
}
