/**
 * UBICACION: src/components/AuthModal.js
 * OPTIMIZACIONES MOBILE:
 *  - Clase auth-modal: 95% ancho en pantallas pequeñas via CSS
 *  - Inputs con font-size: 16px (previene zoom en iOS)
 *  - Botones con minHeight: 48px
 *  - padding reducido en móvil via clase
 * CAMBIOS 2026-03-03:
 *  - Flujo suave: registro inmediato → puede comprar → confirma email después
 *  - Todos los errores de Supabase traducidos al español
 *  - Botón login: "Ingresar" (sin emoji de carrito)
 *  - "Email not confirmed": mensaje amigable + botón reenviar confirmación
 *  - Registro exitoso: si hay sesión activa (confirm email OFF) → entra directo
 *  - Registro exitoso: si requiere confirmación → avisa y pasa a login
 */
'use client'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// Traduce errores de Supabase al español
function traducirError(msg) {
  if (!msg) return 'Ocurrió un error. Intentá de nuevo.'
  if (msg.includes('Invalid login credentials'))    return 'EMAIL_O_PASSWORD_INCORRECTOS'
  if (msg.includes('Email not confirmed'))          return 'EMAIL_NO_CONFIRMADO'
  if (msg.includes('already registered'))           return 'Este email ya tiene una cuenta. Iniciá sesión.'
  if (msg.includes('User already registered'))      return 'Este email ya está registrado. Iniciá sesión.'
  if (msg.includes('Password should be at least'))  return 'La contraseña debe tener al menos 6 caracteres.'
  if (msg.includes('Unable to validate email'))     return 'El formato del email no es válido.'
  if (msg.includes('signup is disabled'))           return 'El registro está temporalmente deshabilitado.'
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.'
  if (msg.includes('network') || msg.includes('fetch')) return 'Error de conexión. Verificá tu internet.'
  return msg
}

export default function AuthModal() {
  const { modalVisible, cerrarModal, onLoginExitoso } = useAuth()
  const [modo, setModo]               = useState('login')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [nombre, setNombre]           = useState('')
  const [loading, setLoading]         = useState(false)
  const [loadingReenvio, setLoadingReenvio] = useState(false)
  const [error, setError]             = useState(null)
  const [errorTipo, setErrorTipo]     = useState(null) // 'no_confirmado' | null
  const [mensaje, setMensaje]         = useState(null)

  if (!modalVisible) return null

  function limpiar() { setError(null); setErrorTipo(null); setMensaje(null) }
  function cambiarModo(m) { setModo(m); limpiar() }

  async function manejarLogin(e) {
    e.preventDefault()
    setLoading(true); limpiar()
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      onLoginExitoso()
    } catch (err) {
      const traducido = traducirError(err.message)
      if (traducido === 'EMAIL_NO_CONFIRMADO') {
        setErrorTipo('no_confirmado')
        setError('Tu cuenta todavía no fue confirmada. Revisá tu casilla de email (también el spam).')
      } else if (traducido === 'EMAIL_O_PASSWORD_INCORRECTOS') {
        setError('Email o contraseña incorrectos.')
      } else {
        setError(traducido)
      }
    } finally { setLoading(false) }
  }

  async function reenviarConfirmacion() {
    if (!email) {
      setError('Ingresá tu email para reenviar la confirmación.')
      return
    }
    setLoadingReenvio(true); limpiar()
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      if (error) throw error
      setMensaje('📧 Email de confirmación reenviado. Revisá tu bandeja de entrada y spam.')
    } catch (err) {
      setError('No se pudo reenviar el email. Intentá de nuevo en unos minutos.')
    } finally { setLoadingReenvio(false) }
  }

  async function manejarRegistro(e) {
    e.preventDefault()
    setLoading(true); limpiar()
    try {
      const { data, error: errAuth } = await supabase.auth.signUp({ email, password })
      if (errAuth) throw errAuth

      // Guardar en tabla clientes
      if (data.user) {
        await supabase.from('clientes').insert({
          nombre_completo: nombre,
          email,
          user_id: data.user.id,
          is_active: true,
        })
      }

      // Si ya tiene sesión activa (Confirm email desactivado en Supabase) → entrar directo
      if (data.session) {
        onLoginExitoso()
        return
      }

      // Si requiere confirmación de email → avisar y pasar a login
      setMensaje('✅ ¡Cuenta creada! Te enviamos un email de confirmación a ' + email + '. Confirmá tu cuenta para activarla — mientras tanto podés seguir comprando.')
      setModo('login')

    } catch (err) {
      const traducido = traducirError(err.message)
      if (traducido.includes('ya tiene una cuenta') || traducido.includes('ya está registrado')) {
        setError(traducido)
        setModo('login')
      } else {
        setError(traducido)
      }
    } finally { setLoading(false) }
  }

  const inp = {
    width: '100%', padding: '0.65rem 0.9rem',
    border: '2px solid #b7996b', borderRadius: '4px',
    fontFamily: 'inherit', fontSize: '16px', color: '#333',
    marginBottom: '1rem', outline: 'none',
    minHeight: '44px', boxSizing: 'border-box',
  }

  return (
    <>
      {/* Overlay */}
      <div onClick={cerrarModal} style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 500,
      }} />

      {/* Modal */}
      <div className="auth-modal" style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        backgroundColor: '#fff', border: '2px solid #b7996b',
        borderRadius: '8px', padding: '2rem', zIndex: 501,
        width: '90%', maxWidth: '420px',
        boxShadow: '0 8px 32px rgba(51,76,43,0.2)',
        fontFamily: '"Segoe UI",sans-serif',
        maxHeight: '90vh', overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, color: '#334c2b', fontSize: '1.2rem' }}>
              {modo === 'login' ? '🔐 Iniciar Sesión' : '📝 Crear Cuenta'}
            </h2>
            <p style={{ margin: '0.3rem 0 0', color: '#8f9a44', fontSize: '0.85rem' }}>
              {modo === 'login' ? 'Para continuar con tu compra' : 'Registrate para comprar en PanFree'}
            </p>
          </div>
          <button onClick={cerrarModal} style={{
            background: 'none', border: 'none', fontSize: '1.6rem',
            cursor: 'pointer', color: '#999', lineHeight: 1,
            minWidth: '44px', minHeight: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: '1.25rem', border: '2px solid #b7996b', borderRadius: '4px', overflow: 'hidden' }}>
          {[['login', 'Iniciar Sesión'], ['registro', 'Registrarme']].map(([m, label]) => (
            <button key={m} onClick={() => cambiarModo(m)} style={{
              flex: 1, padding: '0.6rem', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: '600', fontSize: '0.9rem',
              minHeight: '44px',
              backgroundColor: modo === m ? '#334c2b' : '#f9f5f0',
              color: modo === m ? '#eee6d9' : '#334c2b',
            }}>{label}</button>
          ))}
        </div>

        {/* Mensaje de éxito */}
        {mensaje && (
          <div style={{ backgroundColor: '#e8f5e9', border: '1px solid #2e7d32', borderRadius: '4px', padding: '0.7rem', marginBottom: '1rem', color: '#2e7d32', fontSize: '0.88rem' }}>
            {mensaje}
          </div>
        )}

        {/* Error normal */}
        {error && errorTipo !== 'no_confirmado' && (
          <div style={{ backgroundColor: '#fdecea', border: '1px solid #c62828', borderRadius: '4px', padding: '0.7rem', marginBottom: '1rem', color: '#c62828', fontSize: '0.88rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Error especial: email no confirmado */}
        {errorTipo === 'no_confirmado' && (
          <div style={{ backgroundColor: '#fff8e1', border: '1px solid #f9a825', borderRadius: '4px', padding: '0.85rem', marginBottom: '1rem', fontSize: '0.88rem' }}>
            <p style={{ color: '#e65100', fontWeight: '600', margin: '0 0 0.5rem' }}>
              📧 Tu cuenta no está confirmada todavía
            </p>
            <p style={{ color: '#555', margin: '0 0 0.75rem', lineHeight: '1.5' }}>
              Revisá tu casilla <strong>{email}</strong> (incluyendo spam). Si no recibiste el email, podés reenviarlo.
            </p>
            <button
              onClick={reenviarConfirmacion}
              disabled={loadingReenvio}
              style={{
                width: '100%', padding: '0.6rem',
                backgroundColor: loadingReenvio ? '#999' : '#334c2b',
                color: '#eee6d9', border: 'none', borderRadius: '4px',
                fontSize: '0.88rem', fontWeight: '600',
                cursor: loadingReenvio ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {loadingReenvio ? '⏳ Enviando...' : '📤 Reenviar email de confirmación'}
            </button>
          </div>
        )}

        {/* Formulario Login */}
        {modo === 'login' && (
          <form onSubmit={manejarLogin}>
            <label style={{ display: 'block', color: '#334c2b', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Email</label>
            <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com" autoComplete="email" />
            <label style={{ display: 'block', color: '#334c2b', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Contraseña</label>
            <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password" />
            <button type="submit" disabled={loading} style={{
              width: '100%', minHeight: '48px', padding: '0.8rem',
              backgroundColor: loading ? '#999' : '#f46e15',
              color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1rem',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              {loading ? '⏳ Ingresando...' : 'Ingresar'}
            </button>
          </form>
        )}

        {/* Formulario Registro */}
        {modo === 'registro' && (
          <form onSubmit={manejarRegistro}>
            <label style={{ display: 'block', color: '#334c2b', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Nombre completo</label>
            <input style={inp} type="text" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Tu nombre completo" autoComplete="name" />
            <label style={{ display: 'block', color: '#334c2b', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Email</label>
            <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com" autoComplete="email" />
            <label style={{ display: 'block', color: '#334c2b', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Contraseña</label>
            <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" autoComplete="new-password" minLength={6} />
            <button type="submit" disabled={loading} style={{
              width: '100%', minHeight: '48px', padding: '0.8rem',
              backgroundColor: loading ? '#999' : '#f46e15',
              color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1rem',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              {loading ? '⏳ Creando cuenta...' : ' Crear Cuenta '}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.78rem', color: '#aaa' }}>
          🔒 Tus datos están seguros. Solo usamos tu email para gestionar tus pedidos.
        </p>
      </div>
    </>
  )
}