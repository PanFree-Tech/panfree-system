'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Home, ShoppingBag, Info, Phone, User, Heart, Clock, Award, LogIn, UserPlus, Mail } from 'lucide-react'

export default function Drawer({ isOpen, onClose }) {
  const pathname = usePathname()

  const menuItems = [
    { href: '/', icon: Home, label: 'Inicio' },
    { href: '/catalogo', icon: ShoppingBag, label: 'Catálogo' },
    { href: '/sobre-nosotros', icon: Info, label: 'Sobre Nosotros' },
    { href: '/contacto', icon: Phone, label: 'Contacto' },
  ]

  const accountItems = [
    { href: '/perfil', icon: User, label: 'Mi Perfil' },
    { href: '/perfil/puntos', icon: Award, label: 'Mis Puntos' },
    { href: '/pedido', icon: Clock, label: 'Mis Pedidos' },
    { href: '/favoritos', icon: Heart, label: 'Favoritos' },
  ]

  const isActive = (href) => {
    if (href === '/') return pathname === href
    return pathname?.startsWith(href)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`
          fixed inset-0 z-[60] transition-all duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      >
        <div className="absolute inset-0 backdrop-blur-md bg-black/50" />
      </div>

      {/* Drawer */}
      <div
        className={`
          fixed top-0 left-0 z-[70] h-full w-[300px] sm:w-[360px] bg-white shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          overflow-y-auto
        `}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <span className="text-2xl">🍞</span>
            <span className="text-xl font-bold text-[#334c2b]">PanFree</span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Menú Principal */}
        <nav className="p-4 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
            Navegación
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${active 
                    ? 'bg-[#334c2b] text-white' 
                    : 'text-gray-700 hover:bg-[#f5f2ed] hover:text-[#334c2b]'
                  }
                `}
              >
                <Icon size={20} className={active ? 'text-white' : 'text-[#b7996b]'} />
                <span className={`font-medium ${active ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Separador */}
        <div className="border-t border-gray-100 mx-4" />

        {/* Mi Cuenta */}
        <nav className="p-4 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
            Mi Cuenta
          </p>
          {accountItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${active 
                    ? 'bg-[#334c2b] text-white' 
                    : 'text-gray-700 hover:bg-[#f5f2ed] hover:text-[#334c2b]'
                  }
                `}
              >
                <Icon size={20} className={active ? 'text-white' : 'text-[#b7996b]'} />
                <span className={`font-medium ${active ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Separador */}
        <div className="border-t border-gray-100 mx-4" />

        {/* Autenticación */}
        <div className="p-4 space-y-2">
          <div className="flex gap-2">
            <Link
              href="/login"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f5f2ed] hover:bg-[#eee6d9] rounded-xl transition text-sm font-medium text-[#334c2b]"
            >
              <LogIn size={18} />
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#334c2b] hover:bg-[#2a3d24] rounded-xl transition text-sm font-medium text-white"
            >
              <UserPlus size={18} />
              Registrarse
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 mt-2">
          <div className="flex justify-center gap-4 mb-3">
            {/* Instagram */}
            <a
              href="https://instagram.com/panfree_py"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#E1306C] transition"
            >
              <svg 
                className="w-[22px] h-[22px]" 
                width="22" 
                height="22" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>

            {/* Facebook */}
            <a
              href="https://facebook.com/PanFreePY"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#1877F2] transition"
            >
              <svg 
                className="w-[22px] h-[22px]" 
                width="22" 
                height="22" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/595984589845"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#25D366] transition"
            >
              <svg 
                className="w-[22px] h-[22px]" 
                width="22" 
                height="22" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>

            {/* Email */}
            <a
              href="mailto:contacto@panfree.fit"
              className="text-gray-400 hover:text-[#334c2b] transition"
            >
              <Mail size={22} />
            </a>
          </div>
          <p className="text-xs text-gray-400 text-center">
            PanFree · Panadería Sin Gluten
          </p>
          <p className="text-xs text-gray-400 text-center mt-1">
            Encarnación, Paraguay
          </p>
        </div>
      </div>
    </>
  )
}