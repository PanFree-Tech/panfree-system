// src/app/api/send-whatsapp-team/route.js
import { NextResponse } from 'next/server'

const WA_NUMBER = '595984589845' // Número de la empresa
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

export async function POST(request) {
  try {
    const { pedido, cliente } = await request.json()

    const mensaje = 
      `🍞 *NUEVO PEDIDO EN PANFREE* \n\n` +
      `*N° Pedido:* ${pedido.numero_pedido}\n` +
      `*Cliente:* ${cliente.nombre || 'Anónimo'}\n` +
      `*Teléfono:* ${cliente.telefono || 'No registrado'}\n` +
      `*Total:* ₲ ${pedido.total_final}\n` +
      `*Pago:* ${pedido.metodo_pago === 'transferencia' ? 'Transferencia' : 'Efectivo'}\n` +
      `*Entrega:* ${pedido.metodo_entrega === 'delivery' ? 'Delivery' : 'Retiro'}\n\n` +
      `🔗 Ver pedido:\n` +
      `https://panfree.fit/admin/pedidos/${pedido.id}`

    // Enviar WhatsApp al equipo
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: WA_NUMBER,
          type: 'text',
          text: { body: mensaje }
        })
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}