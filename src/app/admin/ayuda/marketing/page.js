'use client'
import Link from 'next/link'

export default function AyudaMarketingRetirado() {
  return (
    <div style={{ maxWidth: 720, margin: '4rem auto', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>Ayuda de Marketing retirada</h1>
      <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
        El modulo de Marketing se retiro el <strong>2026-10-19 (S31)</strong>.
        Esta pagina de ayuda ya no aplica.
      </p>
      <p style={{ marginBottom: '0.5rem' }}>Consulta en su lugar:</p>
      <ul style={{ lineHeight: 1.8 }}>
        <li><Link href="/admin/productos">Productos (promociones por producto)</Link></li>
        <li><Link href="/admin/cupones">Cupones (descuentos en checkout)</Link></li>
      </ul>
    </div>
  )
}