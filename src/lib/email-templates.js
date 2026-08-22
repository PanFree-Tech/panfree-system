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
