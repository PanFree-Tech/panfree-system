'use client'
import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

export default function TicketDiptico({ codigo }) {
  const [descargando, setDescargando] = useState(false)

  const descargarImagen = async () => {
    setDescargando(true)
    try {
      // 1. Pedir la imagen al servidor
      const response = await fetch(`/api/dipticos/imagen/${codigo}`)
      
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`)
      }

      // 2. Convertir la respuesta a Blob (archivo binario)
      const blob = await response.blob()
      
      // 3. Crear una URL temporal para el Blob
      const url = window.URL.createObjectURL(blob)
      
      // 4. Crear un enlace invisible y forzar el clic
      const link = document.createElement('a')
      link.href = url
      link.download = `Diptico-PanFree-${codigo}.png`
      document.body.appendChild(link)
      link.click()
      
      // 5. Limpiar
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (err) {
      console.error('Error al descargar:', err)
      alert('Hubo un error al descargar el díptico. Intentá de nuevo.')
    } finally {
      setDescargando(false)
    }
  }

  return (
    <button
      onClick={descargarImagen}
      disabled={descargando}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        backgroundColor: '#334c2b', color: 'white', border: 'none',
        padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.82rem',
        fontWeight: '600', cursor: descargando ? 'wait' : 'pointer',
        transition: 'background 0.2s', opacity: descargando ? 0.7 : 1
      }}
    >
      {descargando ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          Descargando...
        </>
      ) : (
        <>
          <Download size={14} />
          Descargar Díptico
        </>
      )}
    </button>
  )
}