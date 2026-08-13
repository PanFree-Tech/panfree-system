/**
 * 📁 UBICACIÓN: src/app/producto/[slug]/not-found.js
 * 📅 CREADO: 2026-03-05
 * 📌 DESCRIPCIÓN: Página 404 para productos no encontrados.
 */
'use client'
import { useRouter } from 'next/navigation'

export default function ProductoNoEncontrado() {
  const router = useRouter()
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Segoe UI", sans-serif', textAlign: 'center', padding: '2rem',
    }}>
      <span style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍞</span>
      <h1 style={{ color: '#334c2b', fontSize: '1.5rem', margin: '0 0 0.5rem' }}>
        Producto no encontrado
      </h1>
      <p style={{ color: '#888', marginBottom: '1.5rem', maxWidth: '400px' }}>
        Este producto no existe o ya no está disponible. Puede que el link haya cambiado.
      </p>
      <button onClick={() => router.push('/')}
        style={{ backgroundColor: '#f46e15', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '1rem' }}>
        Ver todos los productos
      </button>
    </div>
  )
}