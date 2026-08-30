// src/components/UserGreeting.js
'use client'

import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { memo } from 'react'
import { User } from 'lucide-react'

/**
 * Componente que muestra un saludo personalizado cuando el usuario está autenticado
 */
function UserGreetingComponent() {
  const { usuario } = useAuth()

  // Si no hay usuario, mostrar botón "Ingresar" → redirige a /login
  // ⚠️ ESTILO ORIGINAL RESTAURADO
  if (!usuario) {
    return (
      <Link
        href="/login"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#f46e15',
          color: 'white',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          transition: 'background-color 0.2s ease',
          textDecoration: 'none',
          border: 'none',
          cursor: 'pointer',
          lineHeight: '1.25rem',
          fontFamily: 'inherit'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#e05d0a'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#f46e15'
        }}
      >
        Ingresar
      </Link>
    )
  }

  // Obtener nombre del usuario con fallbacks seguros
  const displayName = 
    usuario.user_metadata?.full_name ||
    usuario.user_metadata?.name ||
    usuario.user_metadata?.nombre_completo ||
    usuario.email?.split('@')[0] ||
    'Usuario'

  // Obtener avatar con fallback
  const avatarUrl = 
    usuario.user_metadata?.avatar_url ||
    usuario.user_metadata?.picture ||
    null

  // Usuario logueado - mantener estilo consistente con el header
  return (
    <Link
      href="/perfil"
      aria-label={`Mi cuenta - ${displayName}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#334c2b',
        color: 'white',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '500',
        transition: 'background-color 0.2s ease',
        textDecoration: 'none',
        border: 'none',
        cursor: 'pointer',
        lineHeight: '1.25rem',
        fontFamily: 'inherit'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#2a3d24'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#334c2b'
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          width={20}
          height={20}
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            objectFit: 'cover',
            backgroundColor: '#eee6d9'
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <User size={16} style={{ color: 'white' }} />
      )}
      <span>Hola, {displayName}</span>
    </Link>
  )
}

// Memoizar para evitar re-renders innecesarios
export const UserGreeting = memo(UserGreetingComponent)