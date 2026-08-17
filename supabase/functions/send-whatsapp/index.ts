// supabase/functions/send-whatsapp/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

serve(async (req) => {
  try {
    const { pedido, cliente } = await req.json()

    const mensaje = 
      `🍞 *¡Gracias por tu pedido en PanFree!* \n\n` +
      `*N° Pedido:* ${pedido.numero_pedido}\n` +
      `*Total:* ₲ ${pedido.total_final}\n` +
      `*Método de pago:* ${pedido.metodo_pago === 'transferencia' ? 'Transferencia bancaria' : 'Efectivo al entregar'}\n` +
      `*Método de entrega:* ${pedido.metodo_entrega === 'delivery' ? 'Delivery a domicilio' : 'Retiro en local'}\n\n` +
      `📦 Seguí tu pedido en:\n` +
      `https://panfree.fit/pedido/${pedido.numero_pedido}\n\n` +
      `🙌 ¡Gracias por confiar en PanFree!`

    // Enviar mensaje a WhatsApp Business API
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
          to: cliente.telefono,
          type: 'text',
          text: { body: mensaje }
        })
      }
    )

    const result = await response.json()

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})