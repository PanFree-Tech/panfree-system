/**
 * 📁 UBICACIÓN: src/app/admin/correos/components/EmailForm.jsx
 * 📅 ACTUALIZADO: 2026-08-22
 * 📌 DESCRIPCIÓN: Formulario administrativo para redacción y envío de correos con Resend.
 */

'use client'

import { useState } from 'react'
import { Send, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

const DEFAULT_ADMIN_EMAIL = 'system.panfree@gmail.com'

export default function EmailForm({ onEmailSent, onClose }) {
  const [destinatario, setDestinatario] = useState(DEFAULT_ADMIN_EMAIL || 'system.panfree@gmail.com')
  const [asunto, setAsunto] = useState('')
  const [contenidoHtml, setContenidoHtml] = useState('')
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState('personalizado')
  const [enviando, setEnviando] = useState(false)
  const [notificacion, setNotificacion] = useState(null)

  // Aplicar plantillas predefinidas
  const handleSeleccionarPlantilla = (tipo) => {
    setPlantillaSeleccionada(tipo)
    if (tipo === 'promocion') {
      setAsunto('📢 ¡PanFree: 15% OFF en Panificados Artesanales Sin Gluten!')
      setContenidoHtml(`
<div style="font-family: sans-serif; background-color: #f7f4ee; padding: 25px; border-radius: 10px;">
  <div style="background-color: #334c2b; color: #eee6d9; padding: 18px; border-radius: 8px; text-align: center;">
    <h2 style="margin: 0;">🥖 PanFree · Oferta de la Semana</h2>
    <p style="margin: 5px 0 0 0; color: #b7996b;">100% Sin Gluten · Encarnación</p>
  </div>
  <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-top: 15px; border: 1px solid #e8e2d5;">
    <h3 style="color: #334c2b; margin-top: 0;">¡Disfrutá lo mejor de la panadería artesanal libre de gluten!</h3>
    <p>Aprovechá un <strong>15% de descuento</strong> exclusivo en nuestra selección de panes de campo, chipas y delicias dulces.</p>
    <p>Hacé tu pedido directo en nuestra tienda online:</p>
    <div style="text-align: center; margin-top: 20px;">
      <a href="https://panfree.fit" style="background-color: #d9531e; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; display: inline-block;">
        Pedir en panfree.fit 📲
      </a>
    </div>
  </div>
</div>
      `.trim())
    } else if (tipo === 'notificacion') {
      setAsunto('ℹ️ PanFree: Actualización de Estado de Producción')
      setContenidoHtml(`
<div style="font-family: sans-serif; background-color: #f7f4ee; padding: 25px; border-radius: 10px;">
  <h2 style="color: #334c2b; margin-top: 0;">🥖 PanFree · Comunicado Importante</h2>
  <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e8e2d5;">
    <p>Estimado cliente,</p>
    <p>Te informamos que hoy hemos horneado una tanda fresca de panadería y pastelería 100% libre de contaminación cruzada.</p>
    <p>Los pedidos realizados antes de las 16:00 hs serán entregados en el día.</p>
    <p style="margin-bottom: 0;">¡Gracias por confiar en PanFree!</p>
  </div>
</div>
      `.trim())
    } else if (tipo === 'prueba') {
      setAsunto('🧪 PanFree: Verificación de Servicio de Correo Resend')
      setContenidoHtml(`
<div style="font-family: sans-serif; background-color: #f7f4ee; padding: 25px; border-radius: 10px;">
  <h2 style="color: #334c2b; margin-top: 0;">✅ Verificación de Resend API</h2>
  <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e8e2d5;">
    <p>Este correo confirma que el servicio transaccional de <strong>Resend</strong> está operando sin problemas desde el dominio verificado <code>panfree.fit</code>.</p>
    <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-PY', { timeZone: 'America/Asuncion' })}</p>
  </div>
</div>
      `.trim())
    }
  }

  // Enviar correo
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!destinatario || !asunto || !contenidoHtml) {
      setNotificacion({
        tipo: 'error',
        texto: 'Por favor completá todos los campos requeridos.',
      })
      return
    }

    try {
      setEnviando(true)
      setNotificacion(null)

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: destinatario,
          subject: asunto,
          html: contenidoHtml,
          from: 'PanFree <contacto@panfree.fit>',
          metadata: {
            tipo_plantilla: plantillaSeleccionada,
            origen: 'admin_correos_form',
          },
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setNotificacion({
          tipo: 'exito',
          texto: `🎉 ¡Correo enviado exitosamente! (ID: ${data.id || 'N/A'})`,
        })
        if (onEmailSent) {
          onEmailSent()
        }
      } else {
        throw new Error(data.error || 'Error al procesar el envío')
      }
    } catch (err) {
      setNotificacion({
        tipo: 'error',
        texto: err.message || 'No se pudo enviar el correo.',
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} id="form-enviar-correo" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Selector de Plantilla */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334c2b', marginBottom: '0.35rem' }}>
          Seleccionar Plantilla Rápida
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'personalizado', label: '✏️ En blanco' },
            { id: 'promocion', label: '📢 Promoción 15% OFF' },
            { id: 'notificacion', label: 'ℹ️ Estado Producción' },
            { id: 'prueba', label: '🧪 Test Resend' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSeleccionarPlantilla(item.id)}
              style={{
                backgroundColor: plantillaSeleccionada === item.id ? '#334c2b' : '#fff',
                color: plantillaSeleccionada === item.id ? '#eee6d9' : '#334c2b',
                border: '1px solid #b7996b',
                borderRadius: 6,
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campo: Para */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334c2b', marginBottom: '0.35rem' }}>
          Destinatario (Para:) *
        </label>
        <input
          type="email"
          required
          value={destinatario}
          onChange={(e) => setDestinatario(e.target.value)}
          placeholder="ejemplo@cliente.com o system.panfree@gmail.com"
          style={{
            width: '100%',
            padding: '0.6rem 0.8rem',
            borderRadius: 8,
            border: '1px solid #ccc',
            fontSize: '0.88rem',
            backgroundColor: '#fff',
          }}
        />
        <span style={{ fontSize: '0.7rem', color: '#777' }}>Remitente configurado: contacto@panfree.fit</span>
      </div>

      {/* Campo: Asunto */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334c2b', marginBottom: '0.35rem' }}>
          Asunto *
        </label>
        <input
          type="text"
          required
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          placeholder="Asunto del correo..."
          style={{
            width: '100%',
            padding: '0.6rem 0.8rem',
            borderRadius: 8,
            border: '1px solid #ccc',
            fontSize: '0.88rem',
            backgroundColor: '#fff',
          }}
        />
      </div>

      {/* Campo: Mensaje HTML */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334c2b', marginBottom: '0.35rem' }}>
          Contenido HTML / Mensaje *
        </label>
        <textarea
          required
          rows={8}
          value={contenidoHtml}
          onChange={(e) => setContenidoHtml(e.target.value)}
          placeholder="Escribí el contenido en HTML o texto plano..."
          style={{
            width: '100%',
            padding: '0.6rem 0.8rem',
            borderRadius: 8,
            border: '1px solid #ccc',
            fontSize: '0.82rem',
            fontFamily: 'monospace',
            backgroundColor: '#fff',
          }}
        />
      </div>

      {/* Mensaje de Estado */}
      {notificacion && (
        <div
          style={{
            padding: '0.65rem 0.9rem',
            borderRadius: 8,
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: notificacion.tipo === 'exito' ? '#eef7ee' : '#fef2f2',
            color: notificacion.tipo === 'exito' ? '#2b6e2d' : '#b91c1c',
            border: `1px solid ${notificacion.tipo === 'exito' ? '#c9e8ca' : '#fecaca'}`,
          }}
        >
          {notificacion.tipo === 'exito' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notificacion.texto}</span>
        </div>
      )}

      {/* Botones de Acción */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: 8,
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              color: '#555',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={enviando}
          style={{
            padding: '0.6rem 1.5rem',
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#334c2b',
            color: '#eee6d9',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: enviando ? 'not-allowed' : 'pointer',
          }}
        >
          {enviando ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
          {enviando ? 'Enviando...' : 'Enviar Correo'}
        </button>
      </div>
    </form>
  )
}
