/**
 * 📁 UBICACIÓN: src/app/api/resumen-diario/route.js
 * 📅 CREADO: 2026-03-05
 * 📌 DESCRIPCIÓN: Envía resumen diario de pedidos pendientes a los admins.
 *    Configurar en Supabase → Edge Functions → Cron job a las 8:00 AM PY
 *    O llamar manualmente desde el panel admin.
 *
 *    URL: https://panfree.fit/api/resumen-diario
 *    Header requerido: x-cron-secret: [CRON_SECRET]
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const RESEND_API_KEY  = process.env.RESEND_API_KEY
const ADMIN_EMAILS    = ['luzzdevictoria@gmail.com', 'pirovanipedrojose@gmail.com'] // ← cambiá por emails reales
const EMAIL_FROM      = 'PanFree <notificaciones@panfree.fit>'

const formatPYG = n => `₲ ${Number(n || 0).toLocaleString('es-PY')}`

const ESTADO_COLOR = {
  pendiente     : '#f46e15',
  confirmado    : '#2e7d32',
  en_produccion : '#1565c0',
  listo         : '#334c2b',
}

export async function GET(request) {
  // Verificar secret
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Pedidos pendientes (todos los que no están entregados ni cancelados)
  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select('numero_pedido, estado, metodo_entrega, total_final, fecha_pedido, metodo_pago, entrega_direccion')
    .not('estado', 'in', '("entregado","cancelado")')
    .order('fecha_pedido', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!pedidos || pedidos.length === 0) {
    // Sin pendientes → email corto
    await enviarEmail(
      ADMIN_EMAILS,
      '✅ Sin pedidos pendientes — PanFree',
      `<div style="font-family:sans-serif;padding:24px;background:#eee6d9;border-radius:12px;text-align:center;">
        <h2 style="color:#334c2b;">🍞 PanFree — Resumen del día</h2>
        <p style="color:#2e7d32;font-size:1.1rem;font-weight:600;">✅ No hay pedidos pendientes hoy</p>
        <a href="https://panfree.fit/admin" style="display:inline-block;margin-top:16px;background:#334c2b;color:#eee6d9;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
          Ir al panel admin
        </a>
      </div>`
    )
    return NextResponse.json({ ok: true, pendientes: 0 })
  }

  // Agrupar por estado
  const grupos = pedidos.reduce((acc, p) => {
    acc[p.estado] = acc[p.estado] || []
    acc[p.estado].push(p)
    return acc
  }, {})

  const ESTADO_LABEL = {
    pendiente     : '🟡 Pendientes',
    confirmado    : '🟢 Confirmados',
    en_produccion : '🔵 En producción',
    listo         : '✅ Listos para entregar',
  }

  // Construir tabla de pedidos por grupo
  let tablaHtml = ''
  for (const [estado, lista] of Object.entries(grupos)) {
    tablaHtml += `
    <h3 style="color:${ESTADO_COLOR[estado] || '#334c2b'};margin:20px 0 8px;">${ESTADO_LABEL[estado] || estado} (${lista.length})</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
      <thead>
        <tr style="background:#eee6d9;">
          <th style="padding:8px;text-align:left;font-size:0.82rem;color:#334c2b;">Pedido</th>
          <th style="padding:8px;text-align:left;font-size:0.82rem;color:#334c2b;">Entrega</th>
          <th style="padding:8px;text-align:right;font-size:0.82rem;color:#334c2b;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${lista.map(p => `
        <tr style="border-bottom:1px solid #eee6d9;">
          <td style="padding:8px;color:#334c2b;font-weight:700;">${p.numero_pedido}</td>
          <td style="padding:8px;color:#555;font-size:0.88rem;">${p.metodo_entrega === 'delivery' ? '🚚' : '🏪'} ${p.entrega_direccion || p.metodo_entrega}</td>
          <td style="padding:8px;color:#f46e15;font-weight:700;text-align:right;">${formatPYG(p.total_final)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`
  }

  const totalGeneral = pedidos.reduce((sum, p) => sum + Number(p.total_final || 0), 0)
  const hoy = new Date().toLocaleDateString('es-PY', { timeZone: 'America/Asuncion', dateStyle: 'full' })

  const html = `
<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:#334c2b;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:#eee6d9;margin:0;font-size:1.4rem;">🍞 PanFree</h1>
      <p style="color:#b7996b;margin:8px 0 0;">Resumen del día — ${hoy}</p>
    </div>
    <div style="background:#fff;padding:24px;border:2px solid #b7996b;border-top:none;border-radius:0 0 12px 12px;">

      <!-- Resumen general -->
      <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
        <div style="flex:1;min-width:120px;background:#eee6d9;border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0;color:#888;font-size:0.78rem;text-transform:uppercase;">Pedidos activos</p>
          <p style="margin:4px 0 0;color:#334c2b;font-size:2rem;font-weight:800;">${pedidos.length}</p>
        </div>
        <div style="flex:1;min-width:120px;background:#eee6d9;border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0;color:#888;font-size:0.78rem;text-transform:uppercase;">Total pendiente</p>
          <p style="margin:4px 0 0;color:#f46e15;font-size:1.3rem;font-weight:800;">${formatPYG(totalGeneral)}</p>
        </div>
      </div>

      ${tablaHtml}

      <a href="https://panfree.fit/admin"
        style="display:block;background:#f46e15;color:#fff;padding:14px 24px;border-radius:8px;text-align:center;text-decoration:none;font-weight:700;font-size:1rem;margin-top:20px;">
        Gestionar pedidos →
      </a>
    </div>
    <p style="text-align:center;color:#888;font-size:0.75rem;margin-top:16px;">
      PanFree · Encarnación, Paraguay · panfree.fit
    </p>
  </div>
</body>
</html>`

  await enviarEmail(
    ADMIN_EMAILS,
    `📋 ${pedidos.length} pedido${pedidos.length > 1 ? 's' : ''} pendiente${pedidos.length > 1 ? 's' : ''} — PanFree`,
    html
  )

  return NextResponse.json({ ok: true, pendientes: pedidos.length })
}

async function enviarEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  })
  if (!res.ok) console.error('Error Resend:', await res.text())
  return res
}