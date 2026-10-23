'use client'
import { Download } from 'lucide-react'

export default function TicketDiptico({ codigo }) {
  const urlImagen = `/api/dipticos/imagen/${codigo}`

  return (
    <a
      href={urlImagen}
      download={`Diptico-PanFree-${codigo}.png`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        backgroundColor: '#334c2b', color: 'white', border: 'none',
        padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.82rem',
        fontWeight: '600', cursor: 'pointer', textDecoration: 'none',
        transition: 'background 0.2s'
      }}
      onMouseOver={(e) => e.target.style.backgroundColor = '#4a6b3e'}
      onMouseOut={(e) => e.target.style.backgroundColor = '#334c2b'}
    >
      <Download size={14} />
      Descargar Díptico
    </a>
  )
}