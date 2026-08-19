/**
 * 📁 UBICACIÓN: src/app/admin/pedidos/page.js
 * 📅 ACTUALIZADO: 2026-08-19 (Refactor Fase 2 - Modularización)
 * 📌 DESCRIPCIÓN: Controlador principal y layout del módulo de gestión de pedidos en PanFree.
 *    - Coordina la autenticación y carga de datos en tiempo real desde Supabase
 *    - Conecta los submódulos:
 *        * PedidoStats: Métricas del día (pedidos, facturación, pendientes)
 *        * PedidoList: Filtros avanzados, tabla expandible y desglose
 *        * PedidoActions: Transición de estados, cobro y WhatsApp
 *        * PedidoModal: Wizard de 4 pasos para pedidos manuales por WhatsApp
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Package, MessageSquare, RefreshCw } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { S, formatPYG } from './lib/config'
import PedidoStats from './components/PedidoStats'
import PedidoList from './components/PedidoList'
import PedidoModal from './components/PedidoModal'
import { AUDIT_ACTIONS, registrarAuditoria } from '../lib/audit'

export default function PaginaPedidosAdmin() {
  const router = useRouter()

  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState(null)
  const [detalles, setDetalles] = useState({}) // { [pedidoId]: items }
  const [cambiando, setCambiando] = useState(null)
  const [modalPedido, setModalPedido] = useState(false)

  // Stats del día
  const [statsHoy, setStatsHoy] = useState({ total: 0, monto: 0, pendientes: 0 })

  // ── Verificar sesión ─────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/admin/login')
    })
  }, [router])

  // ── Cargar pedidos ───────────────────────────────────────────────────────
  const cargarPedidos = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          id, numero_pedido, estado, metodo_entrega, metodo_pago,
          entrega_direccion, entrega_costo, entrega_instrucciones,
          subtotal, descuento, total_final, estado_pago,
          fecha_pedido, created_at,
          clientes (
            id, nombre_completo, email, telefono
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error
      setPedidos(data || [])

      // Calcular stats del día
      const hoy = new Date().toDateString()
      const pedidosHoy = (data || []).filter(
        (p) => new Date(p.created_at).toDateString() === hoy
      )
      setStatsHoy({
        total: pedidosHoy.length,
        monto: pedidosHoy.reduce((s, p) => s + Number(p.total_final || 0), 0),
        pendientes: (data || []).filter((p) => p.estado === 'pendiente').length,
      })
    } catch (err) {
      console.error('[PanFree] Error cargando pedidos:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarPedidos()
  }, [cargarPedidos])

  // ── Cargar detalle de un pedido ──────────────────────────────────────────
  async function cargarDetalle(pedidoId) {
    if (detalles[pedidoId]) return // ya cargado en cache
    try {
      const { data, error } = await supabase
        .from('detalle_pedido')
        .select(`
          id, cantidad, precio_unitario, subtotal, notas,
          productos (id, nombre, imagen_url)
        `)
        .eq('pedido_id', pedidoId)

      if (!error && data) {
        setDetalles((prev) => ({ ...prev, [pedidoId]: data }))
      }
    } catch (err) {
      console.error('[PanFree] Error cargando detalle del pedido:', err)
    }
  }

  function toggleExpandir(pedidoId) {
    if (expandido === pedidoId) {
      setExpandido(null)
    } else {
      setExpandido(pedidoId)
      cargarDetalle(pedidoId)
    }
  }

  // ── Cambiar estado del pedido ────────────────────────────────────────────
  async function cambiarEstado(pedidoId, nuevoEstado) {
    setCambiando(pedidoId)
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', pedidoId)

      if (error) throw error

      const pedidoModificado = pedidos.find((p) => p.id === pedidoId)
      await registrarAuditoria(AUDIT_ACTIONS.PEDIDO_ESTADO_CAMBIADO, {
        pedido_id: pedidoId,
        numero_pedido: pedidoModificado?.numero_pedido,
        estado_anterior: pedidoModificado?.estado,
        nuevo_estado: nuevoEstado,
      })

      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
      )

      if (nuevoEstado !== 'pendiente') {
        setStatsHoy((prev) => ({
          ...prev,
          pendientes: Math.max(0, prev.pendientes - 1),
        }))
      }
    } catch (err) {
      console.error('[PanFree] Error cambiando estado:', err)
      alert('Error al cambiar el estado. Intentá de nuevo.')
    } finally {
      setCambiando(null)
    }
  }

  // ── Cambiar estado de pago ───────────────────────────────────────────────
  async function cambiarEstadoPago(pedidoId, nuevoEstadoPago) {
    setCambiando(`${pedidoId}_pago`)
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado_pago: nuevoEstadoPago, updated_at: new Date().toISOString() })
        .eq('id', pedidoId)

      if (error) throw error

      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, estado_pago: nuevoEstadoPago } : p))
      )
    } catch (err) {
      console.error('[PanFree] Error cambiando estado de pago:', err)
    } finally {
      setCambiando(null)
    }
  }

  // ── WhatsApp al cliente ──────────────────────────────────────────────────
  function contactarCliente(pedido, mensaje) {
    const tel = pedido.clientes?.telefono?.replace(/\D/g, '')
    if (!tel) {
      alert('El cliente no tiene teléfono registrado.')
      return
    }
    const url = `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function msgListo(pedido) {
    const primerNombre = pedido.clientes?.nombre_completo?.split(' ')[0] || 'cliente'
    const mensajeEntrega =
      pedido.metodo_entrega === 'retiro'
        ? '¿Cuándo pasás a retirarlo?'
        : 'En breve salimos para la entrega. 🛵'

    return `¡Hola ${primerNombre}! 👋\n\nTu pedido *${pedido.numero_pedido}* de PanFree está listo 🎉🍞\n\n${mensajeEntrega}\n\nGracias por elegirnos! ❤️`
  }

  function msgConfirmado(pedido) {
    const primerNombre = pedido.clientes?.nombre_completo?.split(' ')[0] || 'cliente'
    return `¡Hola ${primerNombre}! 👋\n\nRecibimos tu pedido *${pedido.numero_pedido}* y ya lo estamos preparando 🍞✨\n\nTotal: *${formatPYG(pedido.total_final)}*\n\nCualquier consulta estamos aquí. ¡Gracias!`
  }

  return (
    <div style={S.page}>
      {/* Header con título, métricas y acciones globales */}
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            style={{ ...S.btnGris, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={16} /> Volver
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={22} /> Pedidos de Clientes
            </h1>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#b7996b' }}>
              Gestión comercial y entregas
            </p>
          </div>
        </div>

        {/* Métricas rápidas del día */}
        <PedidoStats statsHoy={statsHoy} />

        {/* Botones de acción del header */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setModalPedido(true)}
            style={{ ...S.btnNaranja, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <MessageSquare size={16} /> Pedido por WA
          </button>
          <button
            type="button"
            onClick={cargarPedidos}
            style={{ ...S.btnGris, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            title="Refrescar lista"
          >
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>
      </header>

      {/* Contenido principal: listado y filtros */}
      <main style={S.main}>
        <PedidoList
          pedidos={pedidos}
          loading={loading}
          expandido={expandido}
          detalles={detalles}
          cambiando={cambiando}
          onToggleExpandir={toggleExpandir}
          onCambiarEstado={cambiarEstado}
          onCambiarEstadoPago={cambiarEstadoPago}
          onContactarCliente={contactarCliente}
          msgConfirmado={msgConfirmado}
          msgListo={msgListo}
        />
      </main>

      {/* Modal nuevo pedido manual por WhatsApp */}
      {modalPedido && (
        <PedidoModal
          onCerrar={() => setModalPedido(false)}
          onCreado={() => {
            setModalPedido(false)
            cargarPedidos()
          }}
        />
      )}
    </div>
  )
}
