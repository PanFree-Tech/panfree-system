/**
 * 📁 UBICACIÓN: src/app/perfil/page.js
 * 📅 ACTUALIZADO: 2026-03-04
 * 📌 DESCRIPCIÓN: Página "Mi Cuenta" para clientes de PanFree.
 *    Secciones:
 *      1. Info personal (nombre, email, estado confirmación, miembro desde)
 *      2. Dirección de entrega completa + notas + preferencia retiro/delivery
 *      3. Email sin confirmar → botón reenviar (condicional)
 *      4. Cambiar contraseña (con mostrar/ocultar)
 *      5. Historial de pedidos (expandible, con detalle_pedido real)
 *      6. Cerrar sesión → redirige a /
 *    CORRECCIONES vs versión anterior:
 *      - cargarPedidos usa tabla 'pedidos' + join 'detalle_pedido' y 'productos'
 *        (la versión anterior usaba 'pedido_items' que NO existe en el schema)
 *      - Muestra total_final en lugar de 'total' (columna real en BD)
 *      - Filtra pedidos por cliente_id (via tabla clientes) y no por user_id
 *        (pedidos no tiene user_id directo, tiene cliente_id → clientes → user_id)
 *    Si no está autenticado → abre modal de login automáticamente.
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  User,
  MapPin,
  Lock,
  Mail,
  Key,
  Package,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Phone,
  FileText,
  Truck,
  Store,
  Save,
  Building2,
  Banknote,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

const formatPYG   = n => `₲ ${Number(n || 0).toLocaleString('es-PY')}`
const formatFecha = f => f
  ? new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—'
const colorEstado = e => ({
  pendiente:     { bg: '#fff3e0', text: '#e65100' },
  confirmado:    { bg: '#e8f5e9', text: '#2e7d32' },
  en_produccion: { bg: '#e3f2fd', text: '#1565c0' },
  listo:         { bg: '#f3e5f5', text: '#6a1b9a' },
  entregado:     { bg: '#e8f5e9', text: '#1b5e20' },
  cancelado:     { bg: '#ffebee', text: '#c62828' },
}[e] || { bg: '#f5f5f5', text: '#666' })

const S = {
  page:       { minHeight: '100vh', backgroundColor: '#eee6d9', fontFamily: '"Segoe UI", -apple-system, sans-serif', paddingBottom: '3rem' },
  hero:       { backgroundColor: '#334c2b', color: '#eee6d9', padding: '2rem', textAlign: 'center', borderBottom: '3px solid #b7996b' },
  main:       { maxWidth: '720px', margin: '0 auto', padding: '1.5rem 1rem' },
  card:       { backgroundColor: '#fff', border: '2px solid #b7996b', borderRadius: '8px', marginBottom: '1.5rem', overflow: 'hidden' },
  cardHead:   { backgroundColor: '#334c2b', color: '#eee6d9', padding: '0.75rem 1.25rem', fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  cardBody:   { padding: '1.25rem' },
  label:      { fontSize: '0.8rem', fontWeight: '600', color: '#b7996b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem', display: 'block' },
  input:      { width: '100%', padding: '0.65rem 0.9rem', border: '2px solid #b7996b', borderRadius: '4px', fontFamily: 'inherit', fontSize: '15px', color: '#333', marginBottom: '0.75rem', outline: 'none', boxSizing: 'border-box' },
  row:        { display: 'grid', gap: '0.75rem', marginBottom: '0' },
  btnVerde:   { backgroundColor: '#334c2b', color: '#eee6d9', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', fontSize: '0.95rem', minHeight: '44px' },
  btnNaranja: { backgroundColor: '#f46e15', color: '#fff', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', fontSize: '0.95rem', minHeight: '44px' },
  btnRojo:    { backgroundColor: '#c62828', color: '#fff', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', fontSize: '0.95rem', minHeight: '44px' },
  btnOutline: { backgroundColor: 'transparent', color: '#334c2b', border: '2px solid #334c2b', padding: '0.6rem 1.2rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.9rem', minHeight: '44px' },
  badge:      { display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' },
  alert:      { padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' },
  ok:         { backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' },
  warn:       { backgroundColor: '#fff8e1', color: '#e65100', border: '1px solid #ffcc02' },
  err:        { backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a' },
}

const PERFIL_VACIO = {
  nombre_completo: '', telefono: '',
  direccion_calle: '', direccion_numero: '', direccion_piso_dept: '',
  direccion_ciudad: 'Encarnación', direccion_provincia: 'Itapúa',
  notas_cliente: '', prefiere_retiro: false, prefiere_delivery: true,
}

export default function PaginaPerfil() {
  const { usuario, loading, abrirModal, cerrarSesion } = useAuth()
  const router = useRouter()

  // — Perfil
  const [perfil, setPerfil]                 = useState(PERFIL_VACIO)
  const [perfilOriginal, setPerfilOriginal]   = useState(PERFIL_VACIO)
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [mensajePerfil, setMensajePerfil]     = useState(null)
  const [perfilDirty, setPerfilDirty]         = useState(false)

  // — Email confirmación
  const [enviandoConfirm, setEnviandoConfirm] = useState(false)
  const [mensajeConfirm, setMensajeConfirm]   = useState(null)
  const emailConfirmado = !!usuario?.email_confirmed_at

  // — Contraseña
  const [passNueva, setPassNueva]         = useState('')
  const [passRepeat, setPassRepeat]       = useState('')
  const [cambiandoPass, setCambiandoPass] = useState(false)
  const [mensajePass, setMensajePass]     = useState(null)
  const [mostrarPass, setMostrarPass]     = useState(false)

  // — Pedidos
  const [pedidos, setPedidos]                 = useState([])
  const [cargandoPedidos, setCargandoPedidos] = useState(false)
  const [pedidoExpandido, setPedidoExpandido] = useState(null)

  // ── Si no autenticado → modal ────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !usuario) abrirModal(() => {})
  }, [loading, usuario])

  // ── Cargar perfil ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!usuario) return
    supabase
      .from('clientes')
      .select('nombre_completo, telefono, direccion_calle, direccion_numero, direccion_piso_dept, direccion_ciudad, direccion_provincia, notas_cliente, prefiere_retiro, prefiere_delivery')
      .eq('user_id', usuario.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const p = {
            nombre_completo:     data.nombre_completo     || '',
            telefono:            data.telefono            || '',
            direccion_calle:     data.direccion_calle     || '',
            direccion_numero:    data.direccion_numero    || '',
            direccion_piso_dept: data.direccion_piso_dept || '',
            direccion_ciudad:    data.direccion_ciudad    || 'Encarnación',
            direccion_provincia: data.direccion_provincia || 'Itapúa',
            notas_cliente:       data.notas_cliente       || '',
            prefiere_retiro:     !!data.prefiere_retiro,
            prefiere_delivery:   data.prefiere_delivery !== false,
          }
          setPerfil(p)
          setPerfilOriginal(p)
        }
      })
    cargarPedidos()
  }, [usuario])

  function actualizarPerfil(campo, valor) {
    setPerfil(prev => {
      const nuevo = { ...prev, [campo]: valor }
      setPerfilDirty(JSON.stringify(nuevo) !== JSON.stringify(perfilOriginal))
      return nuevo
    })
  }

  // ── Guardar perfil ───────────────────────────────────────────────────────
  async function guardarPerfil() {
    if (!perfil.nombre_completo.trim()) {
      setMensajePerfil({ tipo: 'err', texto: 'El nombre no puede estar vacío.' })
      return
    }
    setGuardandoPerfil(true); setMensajePerfil(null)
    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          nombre_completo:     perfil.nombre_completo.trim(),
          telefono:            perfil.telefono.trim() || null,
          direccion_calle:     perfil.direccion_calle.trim() || null,
          direccion_numero:    perfil.direccion_numero.trim() || null,
          direccion_piso_dept: perfil.direccion_piso_dept.trim() || null,
          direccion_ciudad:    perfil.direccion_ciudad.trim() || 'Encarnación',
          direccion_provincia: perfil.direccion_provincia.trim() || 'Itapúa',
          notas_cliente:       perfil.notas_cliente.trim() || null,
          prefiere_retiro:     perfil.prefiere_retiro,
          prefiere_delivery:   perfil.prefiere_delivery,
          updated_at:          new Date().toISOString(),
        })
        .eq('user_id', usuario.id)
      if (error) throw error
      setPerfilOriginal({ ...perfil })
      setPerfilDirty(false)
      setMensajePerfil({ tipo: 'ok', texto: 'Datos actualizados correctamente.' })
    } catch {
      setMensajePerfil({ tipo: 'err', texto: 'Error al guardar. Intentá de nuevo.' })
    } finally { setGuardandoPerfil(false) }
  }

  // ── Reenviar confirmación ────────────────────────────────────────────────
  async function reenviarConfirmacion() {
    setEnviandoConfirm(true); setMensajeConfirm(null)
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: usuario.email })
      if (error) throw error
      setMensajeConfirm({ tipo: 'ok', texto: 'Email reenviado. Revisá tu bandeja y spam.' })
    } catch {
      setMensajeConfirm({ tipo: 'err', texto: 'No se pudo reenviar. Intentá en unos minutos.' })
    } finally { setEnviandoConfirm(false) }
  }

  // ── Cambiar contraseña ───────────────────────────────────────────────────
  async function cambiarPassword(e) {
    e.preventDefault(); setMensajePass(null)
    if (passNueva.length < 6) return setMensajePass({ tipo: 'err', texto: 'Mínimo 6 caracteres.' })
    if (passNueva !== passRepeat) return setMensajePass({ tipo: 'err', texto: 'Las contraseñas no coinciden.' })
    setCambiandoPass(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passNueva })
      if (error) throw error
      setMensajePass({ tipo: 'ok', texto: 'Contraseña actualizada correctamente.' })
      setPassNueva(''); setPassRepeat('')
    } catch (err) {
      setMensajePass({ tipo: 'err', texto: err.message?.includes('same password') ? 'La nueva contraseña debe ser diferente a la actual.' : 'Error al cambiar contraseña.' })
    } finally { setCambiandoPass(false) }
  }

  // ── Cargar pedidos ───────────────────────────────────────────────────────
  // ⚠️  CORRECCIÓN: pedidos no tiene user_id, tiene cliente_id → clientes → user_id
  // ⚠️  CORRECCIÓN: columna es 'total_final', no 'total'
  // ⚠️  CORRECCIÓN: items están en 'detalle_pedido' con join a 'productos'
  async function cargarPedidos() {
    if (!usuario) return
    setCargandoPedidos(true)
    try {
      // Primero obtenemos el cliente_id del usuario actual
      const { data: cliente } = await supabase
        .from('clientes')
        .select('id')
        .eq('user_id', usuario.id)
        .single()

      if (!cliente) { setCargandoPedidos(false); return }

      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          id, numero_pedido, estado, estado_pago, metodo_entrega,
          metodo_pago, subtotal, entrega_costo, total_final,
          fecha_pedido, created_at, entrega_direccion,
          detalle_pedido (
            cantidad, precio_unitario,
            productos ( nombre )
          )
        `)
        .eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!error && data) setPedidos(data)
    } catch (_) {}
    finally { setCargandoPedidos(false) }
  }

  async function handleCerrarSesion() {
    await cerrarSesion()
    router.push('/')
  }

  // ── Guards ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#334c2b', fontSize: '1.1rem' }}>Cargando…</p>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <Lock size={48} color="#334c2b" />
          </div>
          <p style={{ color: '#334c2b', fontSize: '1.1rem', marginBottom: '1.5rem' }}>Necesitás iniciar sesión para ver tu cuenta.</p>
          <button style={S.btnNaranja} onClick={() => abrirModal()}>Iniciar sesión</button>
        </div>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>

      {/* Hero */}
      <div style={S.hero}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <User size={48} color="#eee6d9" />
        </div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Mi Cuenta</h1>
        <p style={{ margin: '0.4rem 0 0', color: '#b7996b', fontSize: '0.95rem' }}>
          {perfil.nombre_completo || usuario.email}
        </p>
      </div>

      <div style={S.main}>

        {/* ── 1. Información personal ── */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <User size={18} /> Información personal
          </div>
          <div style={S.cardBody}>

            {mensajePerfil && (
              <div style={{ ...S.alert, ...(mensajePerfil.tipo === 'ok' ? S.ok : S.err), display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {mensajePerfil.tipo === 'ok' ? <CheckCircle size={16} color="#2e7d32" /> : <AlertCircle size={16} color="#c62828" />}
                <span>{mensajePerfil.texto}</span>
              </div>
            )}

            <label style={S.label}>Nombre completo *</label>
            <input
              style={S.input}
              value={perfil.nombre_completo}
              onChange={e => actualizarPerfil('nombre_completo', e.target.value)}
              placeholder="Tu nombre completo"
            />

            <label style={S.label}>Email</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.95rem', color: '#333' }}>{usuario.email}</span>
              <span style={{ ...S.badge, backgroundColor: emailConfirmado ? '#e8f5e9' : '#fff3e0', color: emailConfirmado ? '#2e7d32' : '#e65100', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                {emailConfirmado ? (
                  <>
                    <CheckCircle size={13} /> Confirmado
                  </>
                ) : (
                  <>
                    <AlertCircle size={13} /> Sin confirmar
                  </>
                )}
              </span>
            </div>

            <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Phone size={14} /> Teléfono
            </label>
            <input
              style={S.input}
              type="tel"
              value={perfil.telefono}
              onChange={e => actualizarPerfil('telefono', e.target.value)}
              placeholder="+595 984 000000"
            />

            <label style={S.label}>Miembro desde</label>
            <p style={{ margin: '0 0 0.75rem', color: '#555', fontSize: '0.95rem' }}>
              {formatFecha(usuario.created_at)}
            </p>
          </div>
        </div>

        {/* ── 2. Dirección de entrega ── */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <MapPin size={18} /> Dirección de entrega
          </div>
          <div style={S.cardBody}>

            <div style={{ ...S.row, gridTemplateColumns: '1fr auto' }}>
              <div>
                <label style={S.label}>Calle</label>
                <input style={S.input} value={perfil.direccion_calle}
                  onChange={e => actualizarPerfil('direccion_calle', e.target.value)}
                  placeholder="Ej: Av. Costanera" />
              </div>
              <div style={{ minWidth: '100px' }}>
                <label style={S.label}>Número</label>
                <input style={S.input} value={perfil.direccion_numero}
                  onChange={e => actualizarPerfil('direccion_numero', e.target.value)}
                  placeholder="1234" />
              </div>
            </div>

            <label style={S.label}>Piso / Departamento</label>
            <input style={S.input} value={perfil.direccion_piso_dept}
              onChange={e => actualizarPerfil('direccion_piso_dept', e.target.value)}
              placeholder="Ej: Piso 2, Dpto B (opcional)" />

            <div style={{ ...S.row, gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label style={S.label}>Ciudad</label>
                <input style={S.input} value={perfil.direccion_ciudad}
                  onChange={e => actualizarPerfil('direccion_ciudad', e.target.value)}
                  placeholder="Encarnación" />
              </div>
              <div>
                <label style={S.label}>Departamento</label>
                <input style={S.input} value={perfil.direccion_provincia}
                  onChange={e => actualizarPerfil('direccion_provincia', e.target.value)}
                  placeholder="Itapúa" />
              </div>
            </div>

            <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <FileText size={14} /> Referencia / Notas de entrega
            </label>
            <textarea
              style={{ ...S.input, minHeight: '80px', resize: 'vertical' }}
              value={perfil.notas_cliente}
              onChange={e => actualizarPerfil('notas_cliente', e.target.value)}
              placeholder="Ej: Casa verde con portón negro, tocar timbre 2 veces"
            />

            <label style={S.label}>Preferencia de entrega</label>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem', color: '#334c2b', fontWeight: perfil.prefiere_delivery ? '700' : '400' }}>
                <input type="checkbox" checked={perfil.prefiere_delivery}
                  onChange={e => actualizarPerfil('prefiere_delivery', e.target.checked)}
                  style={{ accentColor: '#f46e15', width: '18px', height: '18px', minHeight: 'unset' }} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Truck size={16} color="#334c2b" /> Delivery a domicilio
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem', color: '#334c2b', fontWeight: perfil.prefiere_retiro ? '700' : '400' }}>
                <input type="checkbox" checked={perfil.prefiere_retiro}
                  onChange={e => actualizarPerfil('prefiere_retiro', e.target.checked)}
                  style={{ accentColor: '#f46e15', width: '18px', height: '18px', minHeight: 'unset' }} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Store size={16} color="#334c2b" /> Retiro en local
                </span>
              </label>
            </div>

            <button style={{ ...S.btnVerde, opacity: perfilDirty ? 1 : 0.5, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={guardarPerfil} disabled={guardandoPerfil || !perfilDirty}>
              <Save size={16} />
              <span>{guardandoPerfil ? 'Guardando…' : 'Guardar datos'}</span>
            </button>
            {!perfilDirty && !guardandoPerfil && (
              <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: '#999' }}>Sin cambios pendientes</span>
            )}
          </div>
        </div>

        {/* ── 3. Email sin confirmar (condicional) ── */}
        {!emailConfirmado && (
          <div style={{ ...S.card, border: '2px solid #ffcc02' }}>
            <div style={{ ...S.cardHead, backgroundColor: '#e65100' }}>
              <AlertCircle size={18} /> Email sin confirmar
            </div>
            <div style={S.cardBody}>
              <div style={{ ...S.alert, ...S.warn }}>
                Tu email <strong>{usuario.email}</strong> todavía no fue confirmado.
              </div>
              {mensajeConfirm && (
                <div style={{ ...S.alert, ...(mensajeConfirm.tipo === 'ok' ? S.ok : S.err), display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {mensajeConfirm.tipo === 'ok' ? <CheckCircle size={16} color="#2e7d32" /> : <AlertCircle size={16} color="#c62828" />}
                  <span>{mensajeConfirm.texto}</span>
                </div>
              )}
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Revisá tu carpeta de spam o reenviá el email de confirmación.
              </p>
              <button style={{ ...S.btnNaranja, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }} onClick={reenviarConfirmacion} disabled={enviandoConfirm}>
                <Mail size={16} />
                <span>{enviandoConfirm ? 'Enviando…' : 'Reenviar confirmación'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── 4. Cambiar contraseña ── */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <Key size={18} /> Cambiar contraseña
          </div>
          <div style={S.cardBody}>
            {mensajePass && (
              <div style={{ ...S.alert, ...(mensajePass.tipo === 'ok' ? S.ok : S.err), display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {mensajePass.tipo === 'ok' ? <CheckCircle size={16} color="#2e7d32" /> : <AlertCircle size={16} color="#c62828" />}
                <span>{mensajePass.texto}</span>
              </div>
            )}
            <form onSubmit={cambiarPassword}>
              <label style={S.label}>Nueva contraseña</label>
              <input style={S.input} type={mostrarPass ? 'text' : 'password'}
                value={passNueva} onChange={e => setPassNueva(e.target.value)}
                placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
              <label style={S.label}>Repetir contraseña</label>
              <input style={S.input} type={mostrarPass ? 'text' : 'password'}
                value={passRepeat} onChange={e => setPassRepeat(e.target.value)}
                placeholder="Repetir contraseña" autoComplete="new-password" />
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer', fontSize: '0.9rem', color: '#555' }}>
                <input type="checkbox" checked={mostrarPass} onChange={e => setMostrarPass(e.target.checked)} style={{ minHeight: 'unset' }} />
                Mostrar contraseña
              </label>
              <button type="submit" style={S.btnVerde} disabled={cambiandoPass || !passNueva || !passRepeat}>
                {cambiandoPass ? 'Guardando…' : 'Cambiar contraseña'}
              </button>
            </form>
          </div>
        </div>

        {/* ── 5. Historial de pedidos ── */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <Package size={18} /> Mis pedidos
          </div>
          <div style={S.cardBody}>
            {cargandoPedidos ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '1rem' }}>Cargando pedidos…</p>
            ) : pedidos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  <ShoppingCart size={40} color="#334c2b" />
                </div>
                <p style={{ color: '#666' }}>Todavía no realizaste ningún pedido.</p>
                <a href="/" style={{ ...S.btnNaranja, display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}>
                  Ver productos
                </a>
              </div>
            ) : (
              pedidos.map(pedido => {
                const est = colorEstado(pedido.estado)
                const expandido = pedidoExpandido === pedido.id
                return (
                  <div key={pedido.id} style={{ border: '1px solid #e0d5c5', borderRadius: '6px', marginBottom: '0.75rem', overflow: 'hidden' }}>

                    {/* Cabecera clickeable */}
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: '0.5rem', padding: '0.85rem 1rem', backgroundColor: expandido ? '#f9f5f0' : '#fff' }}
                      onClick={() => setPedidoExpandido(expandido ? null : pedido.id)}
                    >
                      <div>
                        <span style={{ fontWeight: '700', color: '#334c2b', fontSize: '0.95rem' }}>
                          {pedido.numero_pedido || `#${pedido.id?.slice(0, 8)}`}
                        </span>
                        <span style={{ color: '#999', fontSize: '0.82rem', marginLeft: '0.75rem' }}>
                          {formatFecha(pedido.fecha_pedido || pedido.created_at)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        <span style={{ fontWeight: '700', color: '#334c2b' }}>
                          {formatPYG(pedido.total_final)}
                        </span>
                        <span style={{ ...S.badge, backgroundColor: est.bg, color: est.text }}>
                          {pedido.estado}
                        </span>
                        <span style={{ color: '#b7996b', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
                          {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      </div>
                    </div>

                    {/* Detalle expandido */}
                    {expandido && (
                      <div style={{ borderTop: '1px solid #f0ebe4', backgroundColor: '#fafafa', padding: '1rem' }}>

                        {/* Productos */}
                        {pedido.detalle_pedido?.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#555', padding: '0.3rem 0', borderBottom: i < pedido.detalle_pedido.length - 1 ? '1px solid #f0ebe4' : 'none' }}>
                            <span>{item.cantidad}× {item.productos?.nombre || 'Producto'}</span>
                            <span style={{ fontWeight: '600' }}>{formatPYG(item.precio_unitario * item.cantidad)}</span>
                          </div>
                        ))}

                        {/* Totales */}
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666' }}>
                            <span>Subtotal</span><span>{formatPYG(pedido.subtotal)}</span>
                          </div>
                          {pedido.entrega_costo > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666' }}>
                              <span>Envío</span><span>{formatPYG(pedido.entrega_costo)}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#334c2b', fontSize: '1rem', marginTop: '0.25rem' }}>
                            <span>Total</span><span style={{ color: '#f46e15' }}>{formatPYG(pedido.total_final)}</span>
                          </div>
                        </div>

                        {/* Info extra */}
                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.82rem', color: '#888' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            {pedido.metodo_entrega === 'delivery' ? <><Truck size={14} /> Delivery</> : <><Store size={14} /> Retiro</>}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            {pedido.metodo_pago === 'transferencia' ? <><Building2 size={14} /> Transferencia</> : <><Banknote size={14} /> Efectivo</>}
                          </span>
                          <span style={{
                            fontWeight: '700',
                            color: pedido.estado_pago === 'aprobado' ? '#2e7d32' : '#e65100',
                          }}>
                            {pedido.estado_pago === 'aprobado' ? '✓ Pago confirmado' : 'Pago pendiente'}
                          </span>
                        </div>

                        {pedido.metodo_entrega === 'delivery' && pedido.entrega_direccion && (
                          <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin size={14} /> {pedido.entrega_direccion}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── 6. Cerrar sesión ── */}
        <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
          <button style={S.btnRojo} onClick={handleCerrarSesion}>
            Cerrar sesión
          </button>
        </div>

      </div>
    </div>
  )
}