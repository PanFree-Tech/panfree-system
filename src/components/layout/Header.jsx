'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, ShoppingCart, User, Search, X } from 'lucide-react'
import { useDrawer } from '@/hooks/useDrawer'
import Drawer from './Drawer'
import { useState } from 'react'

export default function Header() {
  const pathname = usePathname()
  const { isOpen, openDrawer, closeDrawer } = useDrawer()
  const [searchOpen, setSearchOpen] = useState(false)

  // Ocultar header en páginas de admin o auth
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
    return null
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Izquierda: Hamburguesa + Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={openDrawer}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu size={24} className="text-[#334c2b]" />
            </button>
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl group-hover:scale-110 transition-transform">🍞</span>
              <span className="text-xl font-bold text-[#334c2b] hidden sm:block">
                PanFree
              </span>
            </Link>
          </div>

          {/* Centro: Navegación (solo desktop) */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              href="/catalogo"
              className={`text-sm font-medium transition ${
                pathname === '/catalogo'
                  ? 'text-[#f46e15]'
                  : 'text-gray-600 hover:text-[#334c2b]'
              }`}
            >
              Catálogo
            </Link>
            <Link
              href="/sobre-nosotros"
              className={`text-sm font-medium transition ${
                pathname === '/sobre-nosotros'
                  ? 'text-[#f46e15]'
                  : 'text-gray-600 hover:text-[#334c2b]'
              }`}
            >
              Nosotros
            </Link>
            <Link
              href="/contacto"
              className={`text-sm font-medium transition ${
                pathname === '/contacto'
                  ? 'text-[#f46e15]'
                  : 'text-gray-600 hover:text-[#334c2b]'
              }`}
            >
              Contacto
            </Link>
          </nav>

          {/* Derecha: Acciones */}
          <div className="flex items-center gap-1">
            {/* Buscador (toggle) */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              aria-label="Buscar"
            >
              {searchOpen ? (
                <X size={22} className="text-gray-600" />
              ) : (
                <Search size={22} className="text-[#334c2b]" />
              )}
            </button>

            {/* Carrito */}
            <Link
              href="/carrito"
              className="p-2 hover:bg-gray-100 rounded-full transition relative"
              aria-label="Carrito de compras"
            >
              <ShoppingCart size={22} className="text-[#334c2b]" />
              <span className="absolute -top-0.5 -right-0.5 bg-[#f46e15] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                0
              </span>
            </Link>

            {/* Perfil */}
            <Link
              href="/perfil"
              className="p-2 hover:bg-gray-100 rounded-full transition"
              aria-label="Mi perfil"
            >
              <User size={22} className="text-[#334c2b]" />
            </Link>
          </div>
        </div>

        {/* Buscador expandido */}
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${searchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="max-w-7xl mx-auto px-4 pb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar productos, categorías..."
                className="w-full px-4 py-2.5 pl-11 rounded-xl border border-gray-200 focus:border-[#b7996b] focus:ring-2 focus:ring-[#b7996b]/20 outline-none transition text-sm bg-gray-50"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Drawer */}
      <Drawer isOpen={isOpen} onClose={closeDrawer} />
    </>
  )
}