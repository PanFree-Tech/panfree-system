'use client'

import React from 'react'
import { useCart } from '../context/CartContext'

const WA_URL = 'https://wa.me/595984589845?text=Hola%20PanFree!%20🍞%20Quisiera%20hacer%20una%20consulta'

export default function BottomNav() {
  const { cantidadItems, setVisible } = useCart()

  const scrollToSearch = (e) => {
    e.preventDefault()
    const searchInput = document.getElementById('search-products-input')
    if (searchInput) {
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
      searchInput.focus()
    } else {
      window.scrollTo({ top: 300, behavior: 'smooth' })
    }
  }

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Navegación móvil"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e0d5c5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 150,
        boxShadow: '0 -4px 16px rgba(51, 76, 43, 0.08)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      className="mobile-bottom-nav-container"
    >
      {/* 1. Inicio */}
      <a
        href="/"
        id="nav-mobile-home"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          color: '#334c2b',
          flex: 1,
          height: '100%',
          gap: '2px',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Inicio</span>
      </a>

      {/* 2. Buscar */}
      <a
        href="#catalogo"
        id="nav-mobile-search"
        onClick={scrollToSearch}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          color: '#334c2b',
          flex: 1,
          height: '100%',
          gap: '2px',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Buscar</span>
      </a>

      {/* 3. Carrito con Badge */}
      <button
        type="button"
        id="nav-mobile-cart"
        onClick={() => setVisible(true)}
        aria-label={`Carrito, ${cantidadItems} productos`}
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#334c2b',
          flex: 1,
          height: '100%',
          position: 'relative',
          cursor: 'pointer',
          padding: 0,
          gap: '2px',
        }}
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {cantidadItems > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-7px',
                right: '-10px',
                backgroundColor: '#c62828',
                color: '#ffffff',
                borderRadius: '10px',
                fontSize: '0.65rem',
                fontWeight: 700,
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {cantidadItems}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Carrito</span>
      </button>

      {/* 4. WhatsApp */}
      <a
        href={WA_URL}
        id="nav-mobile-whatsapp"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          color: '#2e7d32',
          flex: 1,
          height: '100%',
          gap: '2px',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.655 1.435 5.163L2 22l4.956-1.406A9.944 9.944 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-1.177 5.83c-.198-.442-.407-.451-.596-.459l-.507-.007c-.176 0-.462.066-.704.33-.242.264-.924.903-.924 2.2 0 1.299.946 2.553 1.078 2.729.132.176 1.826 2.903 4.493 3.953 2.222.877 2.667.703 3.148.659.48-.044 1.55-.634 1.77-1.247.218-.613.218-1.138.153-1.248-.066-.11-.242-.176-.507-.308-.264-.132-1.562-.77-1.804-.858-.242-.088-.418-.132-.594.132-.176.264-.682.857-.836 1.033-.154.176-.308.198-.572.066-.264-.132-1.114-.411-2.122-1.308-.784-.698-1.314-1.56-1.468-1.824-.154-.264-.016-.407.116-.538.118-.118.264-.308.396-.462.132-.154.176-.264.264-.44.088-.176.044-.33-.022-.462-.066-.132-.574-1.43-.79-1.957z"
            fill="currentColor"
          />
        </svg>
        <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>WhatsApp</span>
      </a>
    </nav>
  )
}
