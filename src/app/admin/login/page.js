/**
 * 📁 UBICACIÓN: src/app/admin/login/page.js
 * 📅 ACTUALIZADO: 2026-03-12
 * 📌 DESCRIPCIÓN: Página de inicio de sesión del panel administrativo.
 * ✅ FIX original: useSearchParams() envuelto en <Suspense> (requerido Next.js 14)
 *    Sin Suspense, Next.js 14 no renderiza la página y queda en blanco.
 * ✅ 2026-03-12: user_metadata → app_metadata (app_metadata no es editable por el usuario).
 */

'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

// ─── Componente interno que usa useSearchParams ────────────────────────────────
// DEBE estar dentro de <Suspense> — Next.js 14 lo exige obligatoriamente
function LoginForm() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)
  const router       = useRouter()
  const searchParams = useSearchParams()

  // Si ya está logueado como admin, redirigir directo
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // ✅ app_metadata no es editable por el usuario final
      if (session?.user?.app_metadata?.role === 'admin') {
        const redirect = searchParams.get('redirect') || '/admin'
        router.replace(redirect)
      }
    })
  }, [router, searchParams])

  const manejarLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: errAuth } = await supabase.auth.signInWithPassword({ email, password })
      if (errAuth) throw errAuth

      const rol = data.session?.user?.app_metadata?.role

      if (rol !== 'admin') {
        await supabase.auth.signOut()
        setError('Tu cuenta no tiene permisos para acceder al panel administrativo. Contactá a Pedro o Luciana.')
        return
      }

      const redirect = searchParams.get('redirect') || '/admin'
      router.replace(redirect)

    } catch (err) {
      console.error('Error de autenticación:', err)
      if (err.message === 'Invalid login credentials') {
        setError('Email o contraseña incorrectos.')
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Debés confirmar tu email antes de ingresar.')
      } else {
        setError(err.message || 'Error al iniciar sesión. Intentá de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      padding: '2.5rem',
      width: '100%',
      maxWidth: '420px',
      boxShadow: '0 4px 16px rgba(51, 76, 43, 0.15)',
      border: '2px solid #b7996b',
    }}>

      {/* Logo / Título */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <img
          src="/images/logo-panfree.svg"
          alt="PanFree"
          width={80}
          height={80}
          style={{ objectFit: 'contain', marginBottom: '0.75rem' }}
          onError={(e) => (e.target.style.display = 'none')}
        />
        <h1 style={{ margin: 0, color: '#334c2b', fontSize: '1.5rem', fontWeight: '700' }}>
          Panel Administrativo
        </h1>
        <p style={{ margin: '0.4rem 0 0', color: '#888', fontSize: '0.9rem' }}>
          PanFree — Solo acceso autorizado
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          backgroundColor: '#fdecea',
          border: '1px solid #f5c6cb',
          borderRadius: '6px',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          color: '#c62828',
          fontSize: '0.9rem',
          lineHeight: '1.4',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={manejarLogin}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="tu@email.com"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.85rem',
            backgroundColor: loading ? '#888' : '#334c2b',
            color: '#eee6d9',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.2s',
            minHeight: '48px',
          }}
        >
          {loading ? '⏳ Verificando...' : '🔐 Ingresar al Panel'}
        </button>
      </form>

      {/* Link a la tienda */}
      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <a href="/" style={{ color: '#b7996b', fontSize: '0.85rem', textDecoration: 'none' }}>
          ← Volver a la tienda
        </a>
      </div>
    </div>
  )
}

// ─── Fallback mientras carga el Suspense ──────────────────────────────────────
function LoginCargando() {
  return (
    <div style={{
      backgroundColor: '#ffffff', borderRadius: '8px', padding: '2.5rem',
      width: '100%', maxWidth: '420px',
      boxShadow: '0 4px 16px rgba(51,76,43,0.15)', border: '2px solid #b7996b',
      textAlign: 'center', color: '#334c2b',
    }}>
      <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🍞</p>
      <p style={{ fontSize: '0.95rem', color: '#888' }}>Cargando...</p>
    </div>
  )
}

// ─── Página raíz — envuelve LoginForm en Suspense ─────────────────────────────
export default function PaginaLoginAdmin() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#eee6d9',
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '1rem',
    }}>
      <Suspense fallback={<LoginCargando />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  color: '#334c2b',
  fontWeight: '600',
  fontSize: '0.875rem',
  marginBottom: '0.35rem',
}

const inputStyle = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  border: '2px solid #b7996b',
  borderRadius: '6px',
  fontFamily: 'inherit',
  fontSize: '1rem',
  color: '#333',
  outline: 'none',
  boxSizing: 'border-box',
  minHeight: '44px',
  backgroundColor: '#fff',
}