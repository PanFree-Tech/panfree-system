// src/components/UserGreeting.js
'use client'

import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import { memo } from 'react'

/**
 * Componente que muestra un saludo personalizado cuando el usuario está autenticado
 * Sigue mejores prácticas:
 * - Memoización para evitar re-renders innecesarios
 * - Manejo de fallbacks seguros
 * - Accesibilidad con atributos ARIA
 * - Responsive design
 */
function UserGreetingComponent() {
  const { usuario, abrirModal } = useAuth()

  // Si no hay usuario, mostrar botón "Ingresar"
  if (!usuario) {
    return (
      <button
        onClick={abrirModal}
        aria-label="Iniciar sesión"
        className="header-button header-button--login"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'transparent',
          color: '#334c2b',
          fontWeight: '600',
          fontSize: '0.9rem',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          border: '1px solid #b7996b',
          cursor: 'pointer',
          fontFamily: 'inherit',
          minHeight: '44px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(183,153,107,0.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <span aria-hidden="true">👤</span>
        <span className="header-cuenta-texto">Ingresar</span>
      </button>
    )
  }

  // Obtener nombre del usuario con fallbacks seguros
  const displayName = 
    usuario.user_metadata?.full_name ||
    usuario.user_metadata?.name ||
    usuario.email?.split('@')[0] ||
    'Usuario'

  // Obtener avatar con fallback
  const avatarUrl = 
    usuario.user_metadata?.avatar_url ||
    usuario.user_metadata?.picture ||
    null

  return (
    <Link
      href="/perfil"
      aria-label={`Mi cuenta - ${displayName}`}
      className="header-button header-button--user"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#334c2b',
        fontWeight: '600',
        fontSize: '0.9rem',
        padding: '0.3rem 1rem 0.3rem 0.3rem',
        borderRadius: '8px',
        textDecoration: 'none',
        minHeight: '44px',
        border: '1px solid #b7996b',
        backgroundColor: 'rgba(183,153,107,0.12)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(183,153,107,0.25)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(183,153,107,0.12)'
      }}
    >
      {/* Avatar */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          width={32}
          height={32}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            objectFit: 'cover',
            backgroundColor: '#eee6d9',
            flexShrink: 0,
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            // Mostrar icono fallback
            const parent = e.currentTarget.parentElement
            const fallbackIcon = document.createElement('span')
            fallbackIcon.textContent = '👤'
            fallbackIcon.style.fontSize = '1.2rem'
            if (parent) {
              parent.insertBefore(fallbackIcon, e.currentTarget)
              e.currentTarget.remove()
            }
          }}
        />
      ) : (
        <span style={{ fontSize: '1.2rem', padding: '0 2px' }} aria-hidden="true">👤</span>
      )}
      
      {/* Saludo */}
      <span className="header-cuenta-texto" style={{ whiteSpace: 'nowrap' }}>
        Hola, {displayName}
      </span>
    </Link>
  )
}

// Memoizar para evitar re-renders innecesarios
export const UserGreeting = memo(UserGreetingComponent)