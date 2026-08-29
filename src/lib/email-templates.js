/**
 * 📁 UBICACIÓN: src/lib/email-templates.js
 * 📅 ACTUALIZADO: 2026-08-22
 * 📌 DESCRIPCIÓN: Colección de plantillas HTML responsivas y elegantes para correos de PanFree.
 *    - Notificaciones de Marketing e IA
 *    - Confirmación de Publicación en Instagram
 *    - Alertas de Stock y Producción
 *    - Notificaciones Generales del Sistema
 */

/**
 * Envoltorio base para todos los correos electrónicos
 */
function baseTemplate({ title, content, footerText = 'PanFree · Panadería & Repostería 100% Sin Gluten · Encarnación, Paraguay' }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f7f4ee;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #2b2b2b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f7f4ee;
      padding: 30px 10px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
      border: 1px solid #e8e2d5;
    }
    .header {
      background-color: #334c2b;
      padding: 24px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #eee6d9;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 4px 0 0 0;
      color: #b7996b;
      font-size: 13px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .body-content {
      padding: 30px;
      line-height: 1.6;
      font-size: 15px;
      color: #333333;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-orange {
      background-color: #fff1eb;
      color: #d9531e;
      border: 1px solid #fbdcd0;
    }
    .badge-green {
      background-color: #eef7ee;
      color: #2b6e2d;
      border: 1px solid #c9e8ca;
    }
    .card-info {
      background-color: #faf8f5;
      border: 1px solid #ebe5d8;
      border-radius: 8px;
      padding: 18px;
      margin: 20px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #d9531e;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      margin-top: 15px;
      text-align: center;
    }
    .footer {
      background-color: #263322;
      color: #9eab9a;
      text-align: center;
      padding: 20px 30px;
      font-size: 12px;
    }
    .footer a {
      color: #b7996b;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>🥖 PanFree</h1>
        <p>100% Sin Gluten · Encarnación</p>
      </div>
      <div class="body-content">
        ${content}
      </div>
      <div class="footer">
        <p style="margin: 0 0 6px 0;">${footerText}</p>
        <p style="margin: 0;"><a href="https://panfree.fit">panfree.fit</a> · Contacto: contacto@panfree.fit</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

/**
 * Plantilla: Notificación de Campaña / Promoción de Marketing Generada con IA
 */
export function templateNotificacionMarketing({
  producto,
  descuento = 0,
  precioOriginal = 0,
  precioFinal = 0,
  copy = '',
  evento = 'Promoción Especial',
  fuente = 'Gemini AI',
}) {
  const nombre = producto?.nombre || (typeof producto === 'string' ? producto : 'Especialidad PanFree')
  const precioOrgFmt = `G/ ${Number(precioOriginal || 0).toLocaleString('es-PY')}`
  const precioFinFmt = `G/ ${Number(precioFinal || 0).toLocaleString('es-PY')}`
  const fecha = new Date().toLocaleString('es-PY', { timeZone: 'America/Asuncion' })

  const content = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
      <span class="badge badge-orange">✨ Campaña Creativa Generada</span>
      <span style="font-size: 12px; color: #777;">${fecha}</span>
    </div>

    <h2 style="margin: 0 0 10px 0; color: #334c2b; font-size: 20px;">
      Nueva propuesta de marketing para "${nombre}"
    </h2>
    <p style="margin-top: 0; color: #666;">
      El motor de marketing con IA (${fuente}) ha generado una estrategia de promoción para el evento <strong>${evento}</strong>.
    </p>

    <div class="card-info">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #666;">Producto:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #222;">${nombre}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;">Descuento Aplicado:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #d9531e;">${descuento}% OFF</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;">Precio Regular:</td>
          <td style="padding: 6px 0; text-decoration: line-through; text-align: right; color: #888;">${precioOrgFmt}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;">Precio Promocional (DB):</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #334c2b; font-size: 16px;">${precioFinFmt}</td>
        </tr>
      </table>
    </div>

    <h3 style="color: #334c2b; font-size: 15px; margin: 20px 0 8px 0;">📝 Copy / Caption Propuesto:</h3>
    <div style="background-color: #f5f5f5; border-left: 4px solid #b7996b; padding: 14px; border-radius: 4px; font-size: 13px; white-space: pre-wrap; font-family: monospace; color: #333;">
${copy || 'Contenido generado pendiente de revisión en el panel.'}
    </div>

    <div style="text-align: center; margin-top: 25px;">
      <a href="https://panfree.fit/admin/marketing" class="cta-button">
        Ver en Panel de Marketing
      </a>
    </div>
  `

  return baseTemplate({
    title: `📢 PanFree: Nueva Campaña de Marketing - ${nombre}`,
    content,
  })
}

/**
 * Plantilla: Notificación de Publicación en Instagram
 */
export function templatePublicacionInstagram({
  producto,
  descuento = 0,
  precioFinal = 0,
  postUrl = 'https://www.instagram.com/panfree_py/',
  postId = 'IG-POST',
  capacidadRestante = null,
  estado = 'Publicado con éxito',
}) {
  const nombre = producto?.nombre || (typeof producto === 'string' ? producto : 'Producto PanFree')
  const precioFinFmt = `G/ ${Number(precioFinal || 0).toLocaleString('es-PY')}`
  const fecha = new Date().toLocaleString('es-PY', { timeZone: 'America/Asuncion' })

  const content = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
      <span class="badge badge-green">📸 Post Publicado en Instagram</span>
      <span style="font-size: 12px; color: #777;">${fecha}</span>
    </div>

    <h2 style="margin: 0 0 10px 0; color: #334c2b; font-size: 20px;">
      ¡Publicación en vivo para "${nombre}"!
    </h2>
    <p style="margin-top: 0; color: #666;">
      La publicación programada se ha procesado exitosamente en Instagram.
    </p>

    <div class="card-info">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #666;">Producto:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #222;">${nombre}</td>
        </tr>
        ${descuento > 0 ? `
        <tr>
          <td style="padding: 6px 0; color: #666;">Descuento en Post:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #d9531e;">${descuento}% OFF</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 6px 0; color: #666;">Precio Promocionado:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #334c2b;">${precioFinFmt}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;">ID de Publicación:</td>
          <td style="padding: 6px 0; font-family: monospace; font-size: 12px; text-align: right; color: #555;">${postId}</td>
        </tr>
        ${capacidadRestante !== null ? `
        <tr>
          <td style="padding: 6px 0; color: #666;">Capacidad Restante:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #2b6e2d;">${capacidadRestante} un.</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 6px 0; color: #666;">Estado:</td>
          <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #2b6e2d;">${estado}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 25px;">
      <a href="${postUrl}" class="cta-button" style="background-color: #E1306C;">
        Ver Publicación en Instagram 📸
      </a>
    </div>
  `

  return baseTemplate({
    title: `📸 Post Publicado en Instagram - ${nombre}`,
    content,
  })
}

/**
 * Plantilla: Correo de Prueba de Resend
 */
export function templatePruebaSistema({
  fecha = new Date().toLocaleString('es-PY', { timeZone: 'America/Asuncion' }),
  detalles = 'Verificación del servicio transaccional Resend.',
}) {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span class="badge badge-green">✅ Integración Resend Activa</span>
    </div>

    <h2 style="margin: 0 0 10px 0; color: #334c2b; font-size: 20px; text-align: center;">
      ¡Prueba de Correo Exitosa!
    </h2>
    <p style="text-align: center; color: #666;">
      El sistema de envío de correos electrónicos de <strong>PanFree</strong> está funcionando correctamente.
    </p>

    <div class="card-info">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Remitente Oficial:</strong> contacto@panfree.fit</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Destinatario de Alertas:</strong> system.panfree@gmail.com</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Fecha y Hora:</strong> ${fecha}</p>
      <p style="margin: 0; font-size: 14px;"><strong>Detalle:</strong> ${detalles}</p>
    </div>

    <div style="text-align: center; margin-top: 25px;">
      <a href="https://panfree.fit/admin/correos" class="cta-button">
        Ir a Gestión de Correos
      </a>
    </div>
  `

  return baseTemplate({
    title: '🔔 PanFree: Prueba de Envío con Resend',
    content,
  })
}

/**
 * Plantilla: Notificación General / Mensaje Personalizado
 */
export function templateNotificacionGeneral({
  titulo = 'Notificación de PanFree',
  mensaje = '',
  ctaTexto = null,
  ctaUrl = null,
}) {
  const content = `
    <h2 style="margin: 0 0 15px 0; color: #334c2b; font-size: 20px;">
      ${titulo}
    </h2>
    <div style="font-size: 15px; color: #333; line-height: 1.6;">
      ${mensaje}
    </div>
    ${ctaTexto && ctaUrl ? `
      <div style="text-align: center; margin-top: 25px;">
        <a href="${ctaUrl}" class="cta-button">
          ${ctaTexto}
        </a>
      </div>
    ` : ''}
  `

  return baseTemplate({
    title: titulo,
    content,
  })
}

/**
 * Plantilla: Confirmación de Compra para el Cliente (Checkout)
 */
export function templateConfirmacionCompra({ pedido, cliente, items = [] }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://panfree.fit'
  const numeroPedido = pedido?.numero_pedido || pedido?.numero || 'N/A'
  const nombreCliente = cliente?.nombre_completo || cliente?.nombre || 'Cliente'
  const fechaStr = new Date(pedido?.created_at || Date.now()).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Asuncion',
  })
  
  const metodoEntregaTexto = pedido?.metodo_entrega === 'delivery' || pedido?.metodoEntrega === 'delivery'
    ? '🛵 Delivery a domicilio'
    : '🏪 Retiro en local'

  const tiempoEstimado = pedido?.metodo_entrega === 'delivery' || pedido?.metodoEntrega === 'delivery'
    ? '45 a 90 minutos'
    : 'Listo en 30 a 60 minutos'

  const metodoPagoTexto = (() => {
    const p = pedido?.metodo_pago || pedido?.metodoPago
    if (p === 'transferencia') return '🏦 Transferencia bancaria (SIPAP / Ueno Bank)'
    if (p === 'tarjeta') return '💳 Tarjeta de crédito / débito'
    return '💵 Efectivo contra entrega'
  })()

  const direccionTexto = (pedido?.entrega_direccion || pedido?.direccion || 'Retiro en local (Encarnación, Paraguay)')

  const subtotal = Number(pedido?.subtotal || 0)
  const descuento = Number(pedido?.descuento_monto || pedido?.descuento || 0)
  const envio = Number(pedido?.entrega_costo || pedido?.costoDelivery || 0)
  const totalFinal = Number(pedido?.total_final || pedido?.totalFinal || subtotal - descuento + envio)

  const itemsRows = (items || []).map((item) => {
    const cant = item?.cantidad || 1
    const nombreProd = item?.nombre || item?.productos?.nombre || 'Producto sin gluten'
    const precio = Number(item?.precio_unitario || item?.precio_venta || item?.precio || 0)
    const precioTotal = precio * cant
    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee6d9; color: #333; font-size: 14px;">${nombreProd}</td>
        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee6d9; color: #555; font-size: 14px;">${cant}</td>
        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee6d9; font-weight: 600; color: #334c2b; font-size: 14px;">${precioTotal.toLocaleString('es-PY')} ₲</td>
      </tr>
    `
  }).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de pedido - PanFree</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fcfaf7; color: #2b2b2b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e8e2d5;">
    <tr>
      <td style="text-align: center; padding-bottom: 24px; border-bottom: 2px solid #eee6d9;">
        <img src="https://res.cloudinary.com/d7simx38/image/upload/v1/logos/panfree-logo-email" alt="PanFree Sin Gluten" style="max-height: 60px; margin-bottom: 8px;">
        <h1 style="color: #334c2b; margin: 12px 0 0 0; font-size: 24px;">🍞 ¡Gracias por tu pedido!</h1>
        <p style="margin: 6px 0 0 0; color: #b7996b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Panadería & Repostería 100% Sin Gluten</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 0;">
        <p style="font-size: 16px; color: #333; margin-top: 0;">Hola <strong>${nombreCliente}</strong>,</p>
        <p style="font-size: 15px; color: #444; line-height: 1.6;">Tu pedido <strong>#${numeroPedido}</strong> ha sido confirmado y nuestro equipo de panaderos ya está preparando tus productos sin gluten con mucho amor. ❤️</p>
        
        <div style="background: #f5f2ed; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #ebe5d8;">
          <p style="margin: 0 0 6px 0; font-size: 14px; color: #333;"><strong>📅 Fecha:</strong> ${fechaStr}</p>
          <p style="margin: 0 0 6px 0; font-size: 14px; color: #333;"><strong>⏱️ Tiempo estimado:</strong> ${tiempoEstimado}</p>
          <p style="margin: 0; font-size: 14px; color: #333;"><strong>📍 Entrega:</strong> ${metodoEntregaTexto}</p>
        </div>

        <h2 style="color: #334c2b; font-size: 18px; margin: 24px 0 12px 0;">📋 Resumen de tu compra</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background: #eee6d9;">
              <th style="padding: 12px; text-align: left; font-size: 14px; color: #334c2b;">Producto</th>
              <th style="padding: 12px; text-align: center; font-size: 14px; color: #334c2b;">Cant.</th>
              <th style="padding: 12px; text-align: right; font-size: 14px; color: #334c2b;">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows || `
              <tr>
                <td colspan="3" style="padding: 12px; text-align: center; color: #666;">Productos sin gluten seleccionados</td>
              </tr>
            `}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px 12px; text-align: right; font-weight: bold; color: #555;">Subtotal:</td>
              <td style="padding: 10px 12px; text-align: right; color: #333;">${subtotal.toLocaleString('es-PY')} ₲</td>
            </tr>
            ${descuento > 0 ? `
            <tr>
              <td colspan="2" style="padding: 10px 12px; text-align: right; font-weight: bold; color: #2e7d32;">Descuento:</td>
              <td style="padding: 10px 12px; text-align: right; color: #2e7d32;">-${descuento.toLocaleString('es-PY')} ₲</td>
            </tr>
            ` : ''}
            <tr>
              <td colspan="2" style="padding: 10px 12px; text-align: right; font-weight: bold; color: #555;">Costo de envío:</td>
              <td style="padding: 10px 12px; text-align: right; color: #333;">${envio > 0 ? `${envio.toLocaleString('es-PY')} ₲` : 'Gratis 🎁'}</td>
            </tr>
            <tr style="background: #f5f2ed; font-size: 18px;">
              <td colspan="2" style="padding: 14px 12px; text-align: right; font-weight: 800; color: #334c2b;">Total:</td>
              <td style="padding: 14px 12px; text-align: right; font-weight: 800; color: #f46e15;">${totalFinal.toLocaleString('es-PY')} ₲</td>
            </tr>
          </tfoot>
        </table>

        <div style="background: #f5f2ed; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #ebe5d8;">
          <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>💳 Método de pago:</strong> ${metodoPagoTexto}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>🚚 Método de entrega:</strong> ${metodoEntregaTexto}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>📍 Dirección:</strong> ${direccionTexto}</p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${baseUrl}/pedido/${numeroPedido}" style="background: #334c2b; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px; box-shadow: 0 2px 8px rgba(51,76,43,0.3);">
            🔍 Seguir mi pedido en tiempo real
          </a>
        </div>

        <p style="font-size: 14px; color: #666; text-align: center; margin-top: 24px;">
          ¿Tienes preguntas o querés avisarnos algo? Escríbenos por WhatsApp al <a href="https://wa.me/595984589845" style="color: #334c2b; font-weight: bold; text-decoration: none;">+595 984 589845</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding-top: 24px; border-top: 2px solid #eee6d9; font-size: 12px; color: #888; line-height: 1.5;">
        <p style="margin: 0 0 4px 0;"><strong>PanFree</strong> · Panadería & Repostería 100% Sin Gluten</p>
        <p style="margin: 0 0 4px 0;">Encarnación, Itapúa, Paraguay</p>
        <p style="margin: 0;"><a href="${baseUrl}" style="color: #334c2b; text-decoration: none; font-weight: 600;">panfree.fit</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Plantilla: Notificación de Cambio de Estado de Pedido (Admin → Cliente)
 */
export function templateCambioEstadoPedido({ estado, pedido, cliente }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://panfree.fit'
  const numeroPedido = pedido?.numero_pedido || pedido?.numero || 'N/A'
  const nombreCliente = cliente?.nombre_completo || cliente?.nombre || 'Cliente'
  const metodoEntrega = pedido?.metodo_entrega || pedido?.metodoEntrega || 'retiro'
  const esDelivery = metodoEntrega === 'delivery'
  const tiempoEstimado = esDelivery ? '40 a 60 minutos' : '15 a 30 minutos'
  const totalFmt = Number(pedido?.total_final || pedido?.totalFinal || 0).toLocaleString('es-PY')

  // Mapeo exhaustivo de estados y contenidos
  const estadoConfig = {
    confirmado: {
      subject: `✅ Pedido #${numeroPedido} confirmado - PanFree`,
      headerTitle: '✅ ¡Tu pedido ha sido confirmado!',
      badgeClass: 'badge-green',
      badgeText: 'Pedido Confirmado',
      headerBg: '#334c2b',
      btnColor: '#334c2b',
      mensajePrincipal: `¡Tu pedido ha sido confirmado! Nuestro equipo de panaderos ya está preparando tus productos sin gluten con mucho amor. Te avisaremos cuando estén listos.`,
      infoExtra: `
        <div style="background: #f5f2ed; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #ebe5d8;">
          <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>📦 N° Pedido:</strong> #${numeroPedido}</p>
          <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>🚚 Entrega:</strong> ${esDelivery ? 'Delivery a domicilio' : 'Retiro en local'}</p>
          <p style="margin: 0; font-size: 14px;"><strong>💰 Total:</strong> ${totalFmt} ₲</p>
        </div>
      `,
    },
    en_produccion: {
      subject: `🔥 Tu pedido #${numeroPedido} está en producción - PanFree`,
      headerTitle: '🔥 ¡Tu pedido ya está en el horno!',
      badgeClass: 'badge-orange',
      badgeText: 'En Producción',
      headerBg: '#d9531e',
      btnColor: '#d9531e',
      mensajePrincipal: `¡Tu pedido ya está en preparación y horneado! El aroma del pan recién horneado te espera. Estará listo en aproximadamente <strong>${tiempoEstimado}</strong>.`,
      infoExtra: `
        <div style="background: #fff8f4; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #fbdcd0;">
          <p style="margin: 0 0 6px 0; font-size: 14px; color: #d9531e;"><strong>⏳ Estado actual:</strong> Horneando con ingredientes 100% seguros sin gluten</p>
          <p style="margin: 0; font-size: 14px; color: #333;"><strong>⏱️ Tiempo estimado restante:</strong> ${tiempoEstimado}</p>
        </div>
      `,
    },
    listo: {
      subject: `🎉 Pedido #${numeroPedido} listo ${esDelivery ? 'para entrega' : 'para retirar'} - PanFree`,
      headerTitle: '🎉 ¡Tu pedido ya está listo!',
      badgeClass: 'badge-green',
      badgeText: esDelivery ? 'Listo para Despacho' : 'Listo para Retirar',
      headerBg: '#f46e15',
      btnColor: '#f46e15',
      mensajePrincipal: esDelivery
        ? `¡Tu pedido ya está empaquetado y listo para salir con nuestro delivery! En breve llegará a tu dirección.`
        : `¡Tu pedido ya está listo! Pasá por nuestro local a retirarlo. ¡Te esperamos con una sonrisa y el aroma del pan recién horneado!`,
      infoExtra: `
        <div style="background: #f5f2ed; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #ebe5d8;">
          <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>📍 Ubicación del local:</strong> Encarnación, Itapúa, Paraguay</p>
          <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>🕐 Horario de atención:</strong> Lunes a Sábado de 7:00 a 20:00</p>
          <p style="margin: 0; font-size: 14px;"><strong>📱 Contacto directo:</strong> +595 984 589845</p>
        </div>
      `,
    },
    entregado: {
      subject: `📦 Pedido #${numeroPedido} entregado - ¡Gracias! - PanFree`,
      headerTitle: '📦 ¡Pedido entregado con éxito!',
      badgeClass: 'badge-green',
      badgeText: 'Entregado',
      headerBg: '#2e7d32',
      btnColor: '#2e7d32',
      mensajePrincipal: `¡Tu pedido ha sido entregado! Esperamos que disfrutes de nuestros productos sin gluten. ¡Gracias por confiar en PanFree y formar parte de nuestra comunidad celíaca y saludable! ⭐`,
      infoExtra: `
        <div style="background: #e8f5e9; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #a5d6a7; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 15px; color: #2e7d32; font-weight: bold;">¿Te gustaron nuestros productos?</p>
          <p style="margin: 0; font-size: 13px; color: #555;">Contanos tu experiencia por WhatsApp o etiquetanos en Instagram <a href="https://instagram.com/panfree_py" style="color: #2e7d32; font-weight: bold;">@panfree_py</a></p>
        </div>
      `,
    },
    cancelado: {
      subject: `❌ Pedido #${numeroPedido} cancelado - PanFree`,
      headerTitle: '❌ Tu pedido ha sido cancelado',
      badgeClass: 'badge-orange',
      badgeText: 'Cancelado',
      headerBg: '#c62828',
      btnColor: '#334c2b',
      mensajePrincipal: `Lamentamos informarte que tu pedido ha sido cancelado. Si tienes dudas o necesitás asistencia para realizar un nuevo pedido, no dudes en escribirnos por WhatsApp.`,
      infoExtra: `
        <div style="background: #fdecea; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #f5c6cb;">
          <p style="margin: 0; font-size: 14px; color: #c62828;">Si ya realizaste un pago por transferencia bancaria y corresponde reembolso, contactanos de inmediato con tu comprobante.</p>
        </div>
      `,
    },
  }

  const actual = estadoConfig[estado] || {
    subject: `🔔 Actualización de tu pedido #${numeroPedido} - PanFree`,
    headerTitle: `Actualización de pedido #${numeroPedido}`,
    badgeClass: 'badge-green',
    badgeText: estado,
    headerBg: '#334c2b',
    btnColor: '#334c2b',
    mensajePrincipal: `El estado de tu pedido #${numeroPedido} ha cambiado a: <strong>${estado}</strong>.`,
    infoExtra: '',
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${actual.subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fcfaf7; color: #2b2b2b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e8e2d5;">
    <tr>
      <td style="text-align: center; padding-bottom: 24px; border-bottom: 2px solid #eee6d9;">
        <img src="https://res.cloudinary.com/d7simx38/image/upload/v1/logos/panfree-logo-email" alt="PanFree Sin Gluten" style="max-height: 50px; margin-bottom: 8px;">
        <h1 style="color: ${actual.headerBg}; margin: 12px 0 0 0; font-size: 22px;">${actual.headerTitle}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 0;">
        <p style="font-size: 16px; color: #333; margin-top: 0;">Hola <strong>${nombreCliente}</strong>,</p>
        <p style="font-size: 15px; color: #444; line-height: 1.6;">${actual.mensajePrincipal}</p>
        
        ${actual.infoExtra}

        <div style="text-align: center; margin: 28px 0;">
          <a href="${baseUrl}/pedido/${numeroPedido}" style="background: ${actual.btnColor}; color: #ffffff !important; padding: 13px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 14px;">
            📋 Ver detalles y seguimiento del pedido
          </a>
        </div>

        <div style="text-align: center; margin-top: 16px;">
          <a href="https://wa.me/595984589845" style="color: #334c2b; text-decoration: none; font-size: 14px; font-weight: 600;">
            💬 ¿Necesitas ayuda? Escríbenos por WhatsApp (+595 984 589845)
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding-top: 24px; border-top: 2px solid #eee6d9; font-size: 12px; color: #888; line-height: 1.5;">
        <p style="margin: 0 0 4px 0;"><strong>PanFree</strong> · Panadería Sin Gluten</p>
        <p style="margin: 0 0 4px 0;">Encarnación, Itapúa, Paraguay</p>
        <p style="margin: 0;"><a href="${baseUrl}" style="color: #334c2b; text-decoration: none;">panfree.fit</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`

  return {
    subject: actual.subject,
    html,
  }
}

/**
 * Plantilla: Alerta Interna para Administradores de Nuevo Pedido
 */
export function templateAlertaAdminNuevoPedido({ pedido, cliente, items = [] }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://panfree.fit'
  const numero = pedido?.numero_pedido || pedido?.numero || 'N/A'
  const total = Number(pedido?.total_final || pedido?.totalFinal || 0).toLocaleString('es-PY')
  const nombreCliente = cliente?.nombre_completo || cliente?.nombre || 'Cliente'
  const telefonoCliente = cliente?.telefono || 'No especificado'
  const metodoPago = pedido?.metodo_pago || pedido?.metodoPago || 'No especificado'
  const metodoEntrega = pedido?.metodo_entrega || pedido?.metodoEntrega || 'retiro'
  const direccion = pedido?.entrega_direccion || pedido?.direccion || 'Retiro en local'
  const pedidoId = pedido?.id || ''

  const itemsHtml = (items || []).map(i => {
    const cant = i.cantidad || 1
    const nombre = i.nombre || i.productos?.nombre || 'Producto'
    const precio = Number(i.precio_unitario || i.precio_venta || i.precio || 0)
    return `<li><strong>${cant}x</strong> ${nombre} (${(precio * cant).toLocaleString('es-PY')} ₲)</li>`
  }).join('')

  const content = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
      <span class="badge badge-orange">📦 Nuevo Pedido Recibido</span>
      <span style="font-size: 12px; color: #777;">${new Date().toLocaleString('es-PY', { timeZone: 'America/Asuncion' })}</span>
    </div>

    <h2 style="margin: 0 0 10px 0; color: #334c2b; font-size: 20px;">
      Nuevo pedido #${numero} en PanFree
    </h2>
    <p style="margin-top: 0; color: #555;">
      Se ha registrado un nuevo pedido a través del sistema.
    </p>

    <div class="card-info">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #666;">Cliente:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #222;">${nombreCliente}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;">Teléfono:</td>
          <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #334c2b;">${telefonoCliente}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;">Total:</td>
          <td style="padding: 6px 0; font-weight: 800; text-align: right; color: #f46e15; font-size: 16px;">${total} ₲</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;">Método de Pago:</td>
          <td style="padding: 6px 0; text-align: right; color: #444;">${metodoPago}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;">Entrega:</td>
          <td style="padding: 6px 0; text-align: right; color: #444;">${metodoEntrega === 'delivery' ? '🛵 Delivery' : '🏪 Retiro en local'}</td>
        </tr>
        ${metodoEntrega === 'delivery' ? `
        <tr>
          <td style="padding: 6px 0; color: #666;">Dirección:</td>
          <td style="padding: 6px 0; text-align: right; color: #444;">${direccion}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${itemsHtml ? `
      <h3 style="color: #334c2b; font-size: 15px; margin: 15px 0 8px 0;">Detalle de productos:</h3>
      <ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 14px; color: #333; line-height: 1.6;">
        ${itemsHtml}
      </ul>
    ` : ''}

    <div style="text-align: center; margin-top: 25px;">
      <a href="${baseUrl}/admin/pedidos${pedidoId ? `/${pedidoId}` : ''}" class="cta-button">
        👀 Ver pedido en panel de administración
      </a>
    </div>
  `

  return baseTemplate({
    title: `📦 Nuevo pedido #${numero} - PanFree Admin`,
    content,
    footerText: 'PanFree ERP & Administración · Notificación automática interna'
  })
}

/**
 * Plantilla: Alerta Interna de Stock Bajo en Insumos
 */
export function templateAlertaStockBajo({ insumo }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://panfree.fit'
  const nombre = insumo?.nombre || 'Insumo'
  const stockActual = insumo?.stock_actual ?? 0
  const stockMinimo = insumo?.stock_minimo ?? 0
  const unidad = insumo?.unidad_medida || 'un.'

  const content = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
      <span class="badge badge-orange">⚠️ Alerta de Inventario</span>
      <span style="font-size: 12px; color: #777;">${new Date().toLocaleString('es-PY', { timeZone: 'America/Asuncion' })}</span>
    </div>

    <h2 style="margin: 0 0 10px 0; color: #c62828; font-size: 20px;">
      Stock bajo en insumo: ${nombre}
    </h2>
    <p style="margin-top: 0; color: #555;">
      El stock actual ha alcanzado o caído por debajo del umbral mínimo requerido para la producción continua.
    </p>

    <div class="card-info" style="border-left: 4px solid #c62828;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #666;">Insumo:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #222;">${nombre}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;">Stock Actual:</td>
          <td style="padding: 6px 0; font-weight: 800; text-align: right; color: #c62828; font-size: 16px;">${stockActual} ${unidad}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;">Stock Mínimo:</td>
          <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #555;">${stockMinimo} ${unidad}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 25px;">
      <a href="${baseUrl}/admin/insumos" class="cta-button" style="background-color: #334c2b;">
        📦 Ir a Gestión de Insumos y Compras
      </a>
    </div>
  `

  return baseTemplate({
    title: `⚠️ Alerta de stock: ${nombre} - PanFree Admin`,
    content,
    footerText: 'PanFree ERP & Inventario · Notificación automática de control de stock'
  })
}

