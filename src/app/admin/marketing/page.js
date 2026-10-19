'use client'
import Link from 'next/link'

export default function MarketingRetirado() {
  return (
    <div style={{ maxWidth: 720, margin: '4rem auto', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>Modulo de Marketing retirado</h1>
      <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
        Este modulo se retiro el <strong>2026-10-19 (S31)</strong> por falta de uso real.
        Ver <code style={{ background: '#f4f4f4', padding: '0.1rem 0.3rem', borderRadius: 3 }}>DOC-008</code>.
      </p>
      <p style={{ marginBottom: '0.5rem' }}>Las funcionalidades que cubria estan disponibles en:</p>
      <ul style={{ lineHeight: 1.8 }}>
        <li><Link href="/admin/productos">Productos - Promociones por producto</Link></li>
        <li><Link href="/admin/cupones">Cupones - Descuentos aplicables en checkout</Link></li>
      </ul>
    </div>
  )
}