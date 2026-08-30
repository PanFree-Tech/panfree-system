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
  if (!usuario) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-[#334c2b] hover:text-[#f46e15] transition px-3 py-2 rounded-lg hover:bg-gray-50"
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

  return (
    <Link
      href="/perfil"
      aria-label={`Mi cuenta - ${displayName}`}
      className="flex items-center gap-2 text-sm font-medium text-[#334c2b] hover:text-[#f46e15] transition px-3 py-2 rounded-lg hover:bg-gray-50"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          width={24}
          height={24}
          className="w-6 h-6 rounded-full object-cover bg-[#eee6d9]"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <User size={18} className="text-[#334c2b]" />
      )}
      <span>Hola, {displayName}</span>
    </Link>
  )
}

// Memoizar para evitar re-renders innecesarios
export const UserGreeting = memo(UserGreetingComponent)