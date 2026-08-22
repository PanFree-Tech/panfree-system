/**
 * 📁 UBICACIÓN: src/app/admin/correos/page.js
 * 📅 ACTUALIZADO: 2026-08-22
 * 📌 DESCRIPCIÓN: Panel Administrativo de Correos y Notificaciones Transaccionales (Resend).
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Plus,
  Eye,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import EmailForm from './components/EmailForm'
import { supabase } from '@/lib/supabase-client'

export default function AdminCorreosPage() {
  const [logs, setLogs] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [correoSeleccionado, setCorreoSeleccionado] = useState(null)
  const [probandoEnvio, setProbandoEnvio] = useState(false)
  const [testResultado, setTestResultado] = useState(null)
  const [filtroStatus, setFiltroStatus] = useState('todos')

  // Cargar historial de correos
  const fetchLogs = useCallback(async () => {
    try {
      setCargando(true)
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        setLogs(data)
      } else {
        // Si la tabla no existe aún o está vacía
        setLogs([])
      }
    } catch (err) {
      console.warn('Error al cargar email_logs:', err.message)
      setLogs([])
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Ejecutar prueba rápida de Resend
  const handleTestRapido = async () => {
    try {
      setProbandoEnvio(true)
      setTestResultado(null)
      const res = await fetch('/api/admin/marketing/test-email', { method: 'POST' })
      const data = await res.json()

      if (res.ok && data.success) {
        setTestResultado({
          tipo: 'exito',
          mensaje: `✅ Prueba enviada exitosamente a ${data.to || 'system.panfree@gmail.com'} (ID: ${data.id})`,
        })
        fetchLogs()
      } else {
        throw new Error(data.error || 'Error en prueba de correo')
      }
    } catch (err) {
      setTestResultado({
        tipo: 'error',
        mensaje: `❌ Error al probar correo: ${err.message}`,
      })
    } finally {
      setProbandoEnvio(false)
    }
  }

  // Filtrado
  const logsFiltrados = logs.filter((log) => {
    if (filtroStatus === 'todos') return true
    return log.status === filtroStatus
  })

  // Métricas
  const totalEnviados = logs.length
  const totalExitosos = logs.filter((l) => l.status === 'sent' || l.status === 'delivered').length
  const totalFallidos = logs.filter((l) => l.status === 'failed' || l.status === 'bounced').length

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#334c2b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={28} /> Gestión de Correos & Resend
          </h1>
          <p style={{ color: '#666', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
            Envío de notificaciones transaccionales, alertas de marketing y auditoría con dominio <strong>panfree.fit</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            onClick={handleTestRapido}
            disabled={probandoEnvio}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#fff',
              color: '#d9531e',
              border: '1px solid #d9531e',
              borderRadius: 8,
              padding: '0.55rem 0.9rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: probandoEnvio ? 'not-allowed' : 'pointer',
            }}
          >
            {probandoEnvio ? <RefreshCw className="animate-spin" size={15} /> : <Zap size={15} />}
            {probandoEnvio ? 'Probando...' : 'Probar Envío (Test)'}
          </button>

          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#334c2b',
              color: '#eee6d9',
              border: 'none',
              borderRadius: 8,
              padding: '0.55rem 1.1rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            {mostrarForm ? 'Cerrar Formulario' : 'Nuevo Correo'}
          </button>
        </div>
      </div>

      {/* Banner de resultado de prueba */}
      {testResultado && (
        <div
          style={{
            marginBottom: '1.2rem',
            padding: '0.75rem 1rem',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: 600,
            backgroundColor: testResultado.tipo === 'exito' ? '#eef7ee' : '#fef2f2',
            color: testResultado.tipo === 'exito' ? '#2b6e2d' : '#b91c1c',
            border: `1px solid ${testResultado.tipo === 'exito' ? '#c9e8ca' : '#fecaca'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{testResultado.mensaje}</span>
          <button
            onClick={() => setTestResultado(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tarjetas de Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: 10, border: '1px solid #e8e2d5', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#777', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>TOTAL ENVIADOS</span>
            <Send size={18} color="#334c2b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#334c2b', marginTop: '0.4rem' }}>
            {totalEnviados}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: 10, border: '1px solid #e8e2d5', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#777', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>ENTREGADOS / EXITOSOS</span>
            <CheckCircle size={18} color="#2b6e2d" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2b6e2d', marginTop: '0.4rem' }}>
            {totalExitosos}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: 10, border: '1px solid #e8e2d5', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#777', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>FALLIDOS / REBOTES</span>
            <XCircle size={18} color="#d9531e" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d9531e', marginTop: '0.4rem' }}>
            {totalFallidos}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: 10, border: '1px solid #e8e2d5', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#777', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>CONFIGURACIÓN</span>
            <ShieldCheck size={18} color="#334c2b" />
          </div>
          <div style={{ fontSize: '0.82rem', color: '#333', marginTop: '0.4rem', lineHeight: 1.4 }}>
            <div><strong>Remitente:</strong> contacto@panfree.fit</div>
            <div><strong>Destino Alertas:</strong> system.panfree@gmail.com</div>
          </div>
        </div>
      </div>

      {/* Formulario de Envío (Collapsible o Modal) */}
      {mostrarForm && (
        <div style={{ backgroundColor: '#faf8f5', border: '1px solid #b7996b', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334c2b', margin: '0 0 1rem 0' }}>
            ✉️ Redactar y Enviar Nuevo Correo con Resend
          </h2>
          <EmailForm
            onEmailSent={() => {
              fetchLogs()
              setMostrarForm(false)
            }}
            onClose={() => setMostrarForm(false)}
          />
        </div>
      )}

      {/* Tabla de Logs / Historial */}
      <div style={{ backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e8e2d5', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ padding: '1rem 1.2rem', borderBottom: '1px solid #e8e2d5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334c2b', margin: 0 }}>
            📋 Historial de Envíos (email_logs)
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.78rem' }}
            >
              <option value="todos">Todos los Estados</option>
              <option value="sent">Enviados (sent)</option>
              <option value="delivered">Entregados (delivered)</option>
              <option value="failed">Fallidos (failed)</option>
            </select>

            <button
              onClick={fetchLogs}
              style={{ background: 'none', border: '1px solid #ccc', borderRadius: 6, padding: '0.3rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Refrescar lista"
            >
              <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {cargando ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#777', fontSize: '0.9rem' }}>
            <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem auto' }} />
            Cargando historial de correos...
          </div>
        ) : logsFiltrados.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#777', fontSize: '0.9rem' }}>
            <Mail size={32} color="#b7996b" style={{ margin: '0 auto 0.5rem auto' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No hay registros de correos enviados todavía.</p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem' }}>Hacé clic en &quot;Probar Envío&quot; o &quot;Nuevo Correo&quot; para enviar tu primer mensaje.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#faf8f5', borderBottom: '1px solid #e8e2d5', color: '#555', fontWeight: 600 }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Fecha</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Destinatario</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Asunto</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Estado</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Resend ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {logsFiltrados.map((log) => {
                  const fecha = new Date(log.created_at).toLocaleString('es-PY', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  const esExito = log.status === 'sent' || log.status === 'delivered'

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f0ece1' }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#666', whiteSpace: 'nowrap' }}>
                        {fecha}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#222' }}>
                        {log.to_email}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#334c2b', fontWeight: 500, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.subject}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.5rem',
                            borderRadius: 4,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: esExito ? '#eef7ee' : '#fef2f2',
                            color: esExito ? '#2b6e2d' : '#b91c1c',
                            border: `1px solid ${esExito ? '#c9e8ca' : '#fecaca'}`,
                          }}
                        >
                          {log.status?.toUpperCase() || 'SENT'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.72rem', color: '#777' }}>
                        {log.resend_id ? log.resend_id.substring(0, 14) + '...' : 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => setCorreoSeleccionado(log)}
                          style={{
                            backgroundColor: '#faf8f5',
                            border: '1px solid #b7996b',
                            borderRadius: 6,
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer',
                            color: '#334c2b',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <Eye size={12} /> Ver
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalle de Correo */}
      {correoSeleccionado && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setCorreoSeleccionado(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, color: '#334c2b', fontSize: '1.1rem', fontWeight: 700 }}>
                Detalles del Correo
              </h3>
              <button
                onClick={() => setCorreoSeleccionado(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#777' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 0.3rem 0' }}><strong>Destinatario:</strong> {correoSeleccionado.to_email}</p>
              <p style={{ margin: '0 0 0.3rem 0' }}><strong>Remitente:</strong> {correoSeleccionado.from_email || 'contacto@panfree.fit'}</p>
              <p style={{ margin: '0 0 0.3rem 0' }}><strong>Asunto:</strong> {correoSeleccionado.subject}</p>
              <p style={{ margin: '0 0 0.3rem 0' }}><strong>Resend ID:</strong> <code style={{ fontSize: '0.8rem' }}>{correoSeleccionado.resend_id || 'N/A'}</code></p>
              <p style={{ margin: '0 0 0.3rem 0' }}><strong>Fecha:</strong> {new Date(correoSeleccionado.created_at).toLocaleString('es-PY')}</p>
              {correoSeleccionado.error_message && (
                <p style={{ margin: '0.3rem 0', color: '#b91c1c' }}><strong>Error:</strong> {correoSeleccionado.error_message}</p>
              )}
            </div>

            <h4 style={{ color: '#334c2b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Cuerpo del Mensaje (HTML):</h4>
            <div
              style={{
                border: '1px solid #e8e2d5',
                borderRadius: 8,
                padding: '1rem',
                backgroundColor: '#faf8f5',
                maxHeight: '350px',
                overflowY: 'auto',
              }}
              dangerouslySetInnerHTML={{ __html: correoSeleccionado.body_html || correoSeleccionado.body_text || '<p>Sin contenido</p>' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
