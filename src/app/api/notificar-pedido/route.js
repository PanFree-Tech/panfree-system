/**
 * 📁 UBICACIÓN: src/app/api/notificar-pedido/route.js
 * 📅 ACTUALIZADO: 2026-03-06
 * 📌 CAMBIOS:
 *  - Ahora envía TAMBIÉN push notification además del email
 */
import { NextResponse } from 'next/server'

const RESEND_API_KEY  = process.env.RESEND_API_KEY
const ADMIN_EMAILS    = ['luzzdevictoria@gmail.com', 'pirovanipedrojose@gmail.com']
const EMAIL_FROM      = 'PanFree <notificaciones@panfree.fit>'

const formatPYG = n => `₲ ${Number(n || 0).toLocaleString('es-PY')}`

const ESTADO_LABEL  = { pendiente: '🟡 Pendiente', confirmado: '🟢 Confirmado', en_produccion: '🔵 En producción', listo: '✅ Listo', entregado: '📦 Entregado', cancelado: '🔴 Cancelado' }
const ENTREGA_LABEL = { delivery: '🚚 Delivery', retiro: '🏪 Retiro en local' }
const PAGO_LABEL    = { efectivo: '💵 Efectivo', transferencia: '🏦 Transferencia' }

export async function POST(request) {
  try {
    const secret = request.headers.get('x-webhook-secret')
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body   = await request.json()
    const pedido = body.record

    if (!pedido) return NextResponse.json({ error: 'Sin datos de pedido' }, { status: 400 })

    // ── 1. Enviar Push Notification ───────────────────────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://panfree.fit'
    fetch(`${baseUrl}/api/push-notificar`, {
      method: 'POST',
      headers: {
        'Content-Type'    : 'application/json',
        'x-webhook-secret': process.env.WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        titulo: `🍞 Nuevo pedido ${pedido.numero_pedido}`,
        cuerpo: `${ENTREGA_LABEL[pedido.metodo_entrega] || pedido.metodo_entrega} · ${formatPYG(pedido.total_final)}`,
        url   : `${baseUrl}/admin/pedidos`,
      }),
    }).catch(err => console.error('Error enviando push:', err))

    // ── 2. Enviar Email ───────────────────────────────────────────────────────
    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:#334c2b;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:#eee6d9;margin:0;font-size:1.4rem;">🍞 PanFree</h1>
      <p style="color:#b7996b;margin:8px 0 0;font-size:0.9rem;">Nuevo pedido recibido</p>
    </div>
    <div style="background:#fff;padding:24px;border:2px solid #b7996b;border-top:none;border-radius:0 0 12px 12px;">
      <div style="background:#eee6d9;border-radius:8px;padding:16px;margin-bottom:20px;text-align:center;">
        <p style="margin:0;color:#334c2b;font-size:0.85rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Pedido</p>
        <p style="margin:4px 0 0;color:#f46e15;font-size:1.8rem;font-weight:800;">${pedido.numero_pedido}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr style="border-bottom:1px solid #eee6d9;">
          <td style="padding:10px 0;color:#888;font-size:0.88rem;width:40%;">Estado</td>
          <td style="padding:10px 0;color:#334c2b;font-weight:600;">${ESTADO_LABEL[pedido.estado] || pedido.estado}</td>
        </tr>
        <tr style="border-bottom:1px solid #eee6d9;">
          <td style="padding:10px 0;color:#888;font-size:0.88rem;">Entrega</td>
          <td style="padding:10px 0;color:#334c2b;font-weight:600;">${ENTREGA_LABEL[pedido.metodo_entrega] || pedido.metodo_entrega}</td>
        </tr>
        ${pedido.entrega_direccion ? `<tr style="border-bottom:1px solid #eee6d9;"><td style="padding:10px 0;color:#888;font-size:0.88rem;">Dirección</td><td style="padding:10px 0;color:#334c2b;">${pedido.entrega_direccion}</td></tr>` : ''}
        <tr style="border-bottom:1px solid #eee6d9;">
          <td style="padding:10px 0;color:#888;font-size:0.88rem;">Pago</td>
          <td style="padding:10px 0;color:#334c2b;font-weight:600;">${PAGO_LABEL[pedido.metodo_pago] || pedido.metodo_pago}</td>
        </tr>
        <tr style="border-bottom:1px solid #eee6d9;">
          <td style="padding:10px 0;color:#888;font-size:0.88rem;">Subtotal</td>
          <td style="padding:10px 0;color:#334c2b;">${formatPYG(pedido.subtotal)}</td>
        </tr>
        ${pedido.entrega_costo > 0 ? `<tr style="border-bottom:1px solid #eee6d9;"><td style="padding:10px 0;color:#888;font-size:0.88rem;">Delivery</td><td style="padding:10px 0;color:#334c2b;">${formatPYG(pedido.entrega_costo)}</td></tr>` : ''}
        <tr>
          <td style="padding:10px 0;color:#334c2b;font-weight:700;">TOTAL</td>
          <td style="padding:10px 0;color:#f46e15;font-weight:800;font-size:1.2rem;">${formatPYG(pedido.total_final)}</td>
        </tr>
      </table>
      <p style="color:#888;font-size:0.82rem;margin:0 0 20px;">
        📅 ${new Date(pedido.fecha_pedido).toLocaleString('es-PY', { timeZone: 'America/Asuncion', dateStyle: 'full', timeStyle: 'short' })}
      </p>
      <a href="${baseUrl}/admin" style="display:block;background:#f46e15;color:#fff;padding:14px 24px;border-radius:8px;text-align:center;text-decoration:none;font-weight:700;font-size:1rem;">
        Ver pedido en el panel admin →
      </a>
    </div>
    <p style="text-align:center;color:#888;font-size:0.75rem;margin-top:16px;">PanFree · Encarnación, Paraguay · panfree.fit</p>
  </div>
</body>
</html>`

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from   : EMAIL_FROM,
        to     : ADMIN_EMAILS,
        subject: `🍞 Nuevo pedido ${pedido.numero_pedido} — ${formatPYG(pedido.total_final)}`,
        html,
      }),
    })

    if (!resendResponse.ok) {
      const err = await resendResponse.text()
      console.error('Error Resend:', err)
      return NextResponse.json({ error: 'Error enviando email' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, pedido: pedido.numero_pedido })

  } catch (err) {
    console.error('Error webhook pedido:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}