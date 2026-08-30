/**
 * UBICACION: src/components/AuthModal.js
 * Se agregan botones de OAuth (Google, Facebook) y manejo de carga/errores.
 * 
 * MEJORES PRÁCTICAS APLICADAS:
 * 1. URL de callback de Supabase fija (no dinámica) para OAuth
 * 2. Manejo de errores específico por proveedor
 * 3. Cierre inmediato del modal para mejor UX
 * 4. Limpieza de estados de carga en finally
 * 5. Logging para facilitar debugging
 */
'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  UserPlus,
  X,
  Mail,
  Send,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase-client'

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
  const router = useRouter()
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
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingFacebook, setLoadingFacebook] = useState(false)

  if (!modalVisible) return null

  function handleCerrar() {
    cerrarModal()
    router.push('/login')
  }

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
      setMensaje('Email de confirmación reenviado. Revisá tu bandeja de entrada y spam.')
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
          role: 'cliente'
        })
      }

      // Si ya tiene sesión activa (Confirm email desactivado en Supabase) → entrar directo
      if (data.session) {
        onLoginExitoso()
        return
      }

      // Si requiere confirmación de email → avisar y pasar a login
      setMensaje('¡Cuenta creada! Te enviamos un email de confirmación a ' + email + '. Confirmá tu cuenta para activarla — mientras tanto podés seguir comprando.')
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

  /**
   * Inicia sesión con proveedor OAuth (Google, Facebook)
   * 
   * MEJORES PRÁCTICAS APLICADAS:
   * 1. Usa la URL de callback de Supabase como redirectTo (no la de la app)
   * 2. Maneja errores con mensajes específicos por proveedor
   * 3. Cierra el modal inmediatamente para mejor UX
   * 4. Limpia estados de carga correctamente
   * 5. Logging para facilitar debugging
   */
  async function signInWithProvider(provider) {
    limpiar()
    
    // Estados de carga específicos por proveedor
    if (provider === 'google') setLoadingGoogle(true)
    if (provider === 'facebook') setLoadingFacebook(true)

    try {
      // ✅ MEJOR PRÁCTICA: Usar la URL de callback de Supabase
      // Esto asegura que Google/Facebook redirijan a Supabase, 
      // que luego redirige a tu app
      const redirectTo = 'https://gbdrcaumghykiipqgbty.supabase.co/auth/v1/callback'
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          redirectTo,
          // ✅ Ahora solicita email y public_profile automáticamente
          // Supabase usa los scopes por defecto: email, public_profile
        }
      })
      
      if (error) throw error
      
      // Mejor práctica: cerrar modal inmediatamente para mejor UX
      // El usuario será redirigido al proveedor, no necesita ver el modal
      cerrarModal()
      
    } catch (err) {
      console.error(`Error en login con ${provider}:`, err)
      
      // Mensajes específicos por proveedor
      const mensajes = {
        google: 'No se pudo iniciar sesión con Google. Verificá tu conexión e intentá de nuevo.',
        facebook: 'No se pudo iniciar sesión con Facebook. Verificá tu conexión e intentá de nuevo.'
      }
      
      setError(mensajes[provider] || 'Error al iniciar sesión. Intentá de nuevo.')
    } finally {
      // Siempre limpiar estados de carga
      if (provider === 'google') setLoadingGoogle(false)
      if (provider === 'facebook') setLoadingFacebook(false)
    }
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
      <div onClick={handleCerrar} style={{
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
            <h2 style={{ margin: 0, color: '#334c2b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {modo === 'login' ? (
                <>
                  <Lock size={20} color="#334c2b" /> Iniciar Sesión
                </>
              ) : (
                <>
                  <UserPlus size={20} color="#334c2b" /> Crear Cuenta
                </>
              )}
            </h2>
            <p style={{ margin: '0.3rem 0 0', color: '#8f9a44', fontSize: '0.85rem' }}>
              {modo === 'login' ? 'Para continuar con tu compra' : 'Registrate para comprar en PanFree'}
            </p>
          </div>
          <button onClick={handleCerrar} style={{
            background: 'none', border: 'none',
            cursor: 'pointer', color: '#999', lineHeight: 1,
            minWidth: '44px', minHeight: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={24} />
          </button>
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

        {/* Social buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>

          <button
            onClick={() => signInWithProvider('google')}
            aria-label="Continuar con Google"
            disabled={loadingGoogle}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center',
              background: '#fff', color: '#333', border: '1px solid #ddd', padding: '0.6rem', borderRadius: '6px',
              fontWeight: 600, cursor: loadingGoogle ? 'not-allowed' : 'pointer', minHeight: '44px',
            }}
          >
            {/* Google SVG */}
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <path fill="#EA4335" d="M12 11.5v2.9h4.3c-.2 1.2-1.1 3.4-4.3 3.4-2.6 0-4.8-2.1-4.8-4.8s2.2-4.8 4.8-4.8c1.5 0 2.5.6 3.1 1.1l2.1-2.1C16.9 6 15.1 5 12 5 7.6 5 4 8.6 4 13s3.6 8 8 8c4.6 0 7.6-3.2 7.6-7.7 0-.6-.1-1-.2-1.4H12z"/>
            </svg>
            {loadingGoogle ? 'Redirigiendo...' : 'Continuar con Google'}
          </button>

          <button
            onClick={() => signInWithProvider('facebook')}
            aria-label="Continuar con Facebook"
            disabled={loadingFacebook}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center',
              background: '#1877F2', color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '6px',
              fontWeight: 600, cursor: loadingFacebook ? 'not-allowed' : 'pointer', minHeight: '44px',
            }}
          >
            {/* Facebook SVG */}
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <path fill="#fff" d="M22 12.07C22 6.48 17.52 2 11.93 2 6.34 2 1.86 6.48 1.86 12.07c0 4.99 3.66 9.13 8.44 9.86v-6.98H8.07v-2.88h2.23V9.41c0-2.21 1.31-3.43 3.32-3.43.96 0 1.97.17 1.97.17v2.17h-1.11c-1.09 0-1.43.68-1.43 1.37v1.66h2.44l-.39 2.88h-2.05v6.98c4.78-.73 8.44-4.87 8.44-9.86z"/>
            </svg>
            {loadingFacebook ? 'Redirigiendo...' : 'Continuar con Facebook'}
          </button>

        </div>

        {/* Mensaje de éxito */}
        {mensaje && (
          <div style={{ backgroundColor: '#e8f5e9', border: '1px solid #2e7d32', borderRadius: '4px', padding: '0.7rem', marginBottom: '1rem', color: '#2e7d32', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="#2e7d32" style={{ flexShrink: 0 }} />
            <span>{mensaje}</span>
          </div>
        )}

        {/* Error normal */}
        {error && errorTipo !== 'no_confirmado' && (
          <div style={{ backgroundColor: '#fdecea', border: '1px solid #c62828', borderRadius: '4px', padding: '0.7rem', marginBottom: '1rem', color: '#c62828', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#c62828" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Error especial: email no confirmado */}
        {errorTipo === 'no_confirmado' && (
          <div style={{ backgroundColor: '#fff8e1', border: '1px solid #f9a825', borderRadius: '4px', padding: '0.85rem', marginBottom: '1rem', fontSize: '0.88rem' }}>
            <p style={{ color: '#e65100', fontWeight: '600', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={16} color="#e65100" /> Tu cuenta no está confirmada todavía
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Send size={16} /> {loadingReenvio ? 'Enviando...' : 'Reenviar email de confirmación'}
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
              {loading ? 'Ingresando...' : 'Ingresar'}
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
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.78rem', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color="#8f9a44" /> Tus datos están seguros. Solo usamos tu email para gestionar tus pedidos.
        </p>
      </div>
    </>
  )
}