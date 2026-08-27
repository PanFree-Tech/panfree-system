/**
 * 📁 UBICACIÓN: src/app/admin/productos/page.js
 * 📅 ACTUALIZADO: 2026-08-27
 * 📌 CAMBIOS:
 *  - Sistema integral de Promociones y Descuentos con Supabase (en_promocion, precio_promocion, fecha_inicio_promo, fecha_fin_promo).
 *  - Botón dedicado en encabezado: "🏷️ Gestionar Promociones" para configuración rápida.
 *  - Botón "🏷️ Promo" en cada fila de producto para ajuste inmediato de oferta y vigencia.
 *  - Formateo de precios en Guaraníes con "Gs." (~~Gs. 50.000~~ Gs. 40.000 AHORRAS Gs. 10.000).
 *  - Detección de estado de promo: Activa, Programada o Vencida según fechas.
 *  - Galería múltiple con Cloudinary y subida de imagen principal.
 */

'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  Croissant,
  Camera,
  Pencil,
  Star,
  AlertTriangle,
  Loader2,
  Save,
  Tag,
  Clock,
  Sparkles,
  X,
  CheckCircle2,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { S, COLORS } from '../_styles'
import PromocionForm, { formatGs } from './components/PromocionForm'

const CATEGORIAS = ['panes', 'dulces', 'salados', 'eventos']
const UNIDADES = ['unidad', 'kg', 'docena', 'pack']

const FORM_VACIO = {
  nombre: '',
  slug: '',
  descripcion: '',
  categoria: 'panes',
  precio_venta: '',
  precio_mayorista: '',
  stock_actual: 0,
  stock_minimo: 5,
  unidad_medida: 'unidad',
  imagen_url: '',
  imagen_public_id: '',
  imagen_alt: '',
  imagenes_urls: [],
  en_promocion: false,
  precio_promocion: '',
  fecha_inicio_promo: '',
  fecha_fin_promo: '',
  is_active: true,
  is_featured: false,
  disponible_delivery: true,
}

function generarSlug(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

/**
 * Determina el estado temporal de una promoción
 */
function getEstadoPromo(producto) {
  if (!producto.en_promocion || !producto.precio_promocion) {
    return { activa: false, label: null, color: '#6b7280', bg: '#f3f4f6' }
  }

  const now = new Date()
  if (producto.fecha_inicio_promo) {
    const inicio = new Date(producto.fecha_inicio_promo)
    if (now < inicio) {
      return { activa: false, label: '⏰ Programada', color: '#b45309', bg: '#fef3c7' }
    }
  }

  if (producto.fecha_fin_promo) {
    const fin = new Date(producto.fecha_fin_promo)
    if (now > fin) {
      return { activa: false, label: '⌛ Vencida', color: '#4b5563', bg: '#e5e7eb' }
    }
  }

  return { activa: true, label: '🔥 Oferta Activa', color: '#dc2626', bg: '#fee2e2' }
}

// ─────────────────────────────────────────────────────────────
// Uploader imagen principal (Cloudinary Direct Unsigned Upload)
// ─────────────────────────────────────────────────────────────
function ImagenUploader({ imagenUrl, imagenPublicId, onChange }) {
  const inputRef = useRef(null)
  const [subiendo, setSubiendo] = useState(false)
  const [preview, setPreview] = useState(imagenUrl || '')
  const [errorImg, setErrorImg] = useState(null)

  useEffect(() => {
    setPreview(imagenUrl || '')
  }, [imagenUrl])

  async function manejarArchivo(archivo) {
    if (!archivo) return
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!tiposPermitidos.includes(archivo.type)) {
      setErrorImg('Solo JPG, PNG, WEBP o GIF.')
      return
    }
    if (archivo.size > 10 * 1024 * 1024) {
      setErrorImg('Máximo 10MB.')
      return
    }
    setSubiendo(true)
    setErrorImg(null)
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'd7simx38'
      const uploadPreset = process.env.NEXT_PUBLIC_UPLOAD_PRESET || 'panfree_upload'

      const formData = new FormData()
      formData.append('file', archivo)
      formData.append('upload_preset', uploadPreset)
      formData.append('folder', 'productos')

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData?.error?.message || 'Error al subir imagen a Cloudinary')
      }

      const data = await res.json()
      setPreview(data.secure_url)
      onChange(data.secure_url, data.public_id)
    } catch (err) {
      console.error('Error Cloudinary upload:', err)
      setErrorImg(err.message || 'Error al subir. Intentá de nuevo.')
    } finally {
      setSubiendo(false)
    }
  }

  function eliminarImagen() {
    setPreview('')
    onChange('', '')
  }

  return (
    <div>
      <label style={S.label}>📷 Imagen principal</label>
      {preview ? (
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.75rem' }}>
          <img
            src={preview}
            alt="Preview"
            style={{
              width: '160px',
              height: '160px',
              objectFit: 'cover',
              borderRadius: '8px',
              border: '2px solid #b7996b',
              display: 'block',
            }}
            onError={(e) => {
              e.target.src = ''
              e.target.style.display = 'none'
            }}
          />
          <button
            type="button"
            onClick={eliminarImagen}
            title="Eliminar imagen"
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              backgroundColor: 'rgba(198,40,40,0.9)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            e.currentTarget.style.borderColor = '#f46e15'
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.borderColor = '#b7996b'
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.currentTarget.style.borderColor = '#b7996b'
            const f = e.dataTransfer.files[0]
            if (f) manejarArchivo(f)
          }}
          style={{
            width: '160px',
            height: '160px',
            border: '2px dashed #b7996b',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: '#fdf8f4',
            marginBottom: '0.75rem',
          }}
        >
          {subiendo ? (
            <>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>⏳</div>
              <span style={{ fontSize: '0.78rem', color: '#999' }}>Subiendo a Cloudinary…</span>
            </>
          ) : (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>📷</div>
              <span style={{ fontSize: '0.78rem', color: '#999', textAlign: 'center', padding: '0 0.5rem' }}>
                Click o arrastrá
                <br />
                una imagen aquí
              </span>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) manejarArchivo(f)
        }}
      />
      {preview && !subiendo && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{ ...S.btnGris, fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
        >
          🔄 Cambiar imagen
        </button>
      )}
      {errorImg && <p style={{ color: '#c62828', fontSize: '0.82rem', marginTop: '0.4rem' }}>{errorImg}</p>}
      <p style={{ fontSize: '0.78rem', color: '#999', marginTop: '0.3rem' }}>Cloudinary CDN · JPG, PNG, WEBP o GIF · Máximo 10MB</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Galería — subida múltiple a Cloudinary
// ─────────────────────────────────────────────────────────────
function GaleriaUploader({ urls, onChange }) {
  const inputRef = useRef(null)
  const [subiendo, setSubiendo] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [progreso, setProgreso] = useState(0)
  const dragItem = useRef(null)
  const dragOver = useRef(null)

  async function subirArchivoCloudinary(archivo) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'd7simx38'
    const uploadPreset = process.env.NEXT_PUBLIC_UPLOAD_PRESET || 'panfree_upload'

    const formData = new FormData()
    formData.append('file', archivo)
    formData.append('upload_preset', uploadPreset)
    formData.append('folder', 'productos/galeria')

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData?.error?.message || 'Error al subir a Cloudinary')
    }

    const data = await res.json()
    return data.secure_url
  }

  async function manejarArchivos(archivos) {
    const lista = Array.from(archivos)
    const tiposOk = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const invalidos = lista.filter((f) => !tiposOk.includes(f.type))
    if (invalidos.length) {
      setErrorMsg('Solo JPG, PNG, WEBP o GIF.')
      return
    }
    const grandes = lista.filter((f) => f.size > 10 * 1024 * 1024)
    if (grandes.length) {
      setErrorMsg('Cada imagen tiene máximo 10MB.')
      return
    }
    if (urls.length + lista.length > 8) {
      setErrorMsg('Máximo 8 imágenes en la galería.')
      return
    }

    setSubiendo(true)
    setErrorMsg(null)
    setProgreso(0)
    try {
      const nuevas = []
      for (let i = 0; i < lista.length; i++) {
        const url = await subirArchivoCloudinary(lista[i])
        nuevas.push(url)
        setProgreso(i + 1)
      }
      onChange([...urls, ...nuevas])
    } catch (err) {
      console.error('Error Galeria Cloudinary upload:', err)
      setErrorMsg(err.message || 'Error al subir alguna imagen. Intentá de nuevo.')
    } finally {
      setSubiendo(false)
      setProgreso(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function eliminar(idx) {
    onChange(urls.filter((_, i) => i !== idx))
  }

  function onDragStart(idx) {
    dragItem.current = idx
  }
  function onDragEnter(idx) {
    dragOver.current = idx
  }
  function onDragEnd() {
    const copia = [...urls]
    const [movida] = copia.splice(dragItem.current, 1)
    copia.splice(dragOver.current, 0, movida)
    dragItem.current = null
    dragOver.current = null
    onChange(copia)
  }

  return (
    <div>
      <label style={S.label}>
        🖼️ Galería adicional
        <span style={{ fontWeight: 400, color: '#888', marginLeft: '0.5rem' }}>
          ({urls.length}/8) — se muestran en el carrusel de la página del producto
        </span>
      </label>

      {urls.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.75rem' }}>
          {urls.map((url, idx) => (
            <div
              key={url}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragEnter={() => onDragEnter(idx)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              title="Arrastrá para reordenar"
              style={{
                position: 'relative',
                cursor: 'grab',
                border: '2px solid #b7996b',
                borderRadius: '6px',
                overflow: 'hidden',
                width: '80px',
                height: '80px',
                flexShrink: 0,
              }}
            >
              <img
                src={url}
                alt={`Foto ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  e.target.style.opacity = '0.3'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '3px',
                  left: '4px',
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '8px',
                }}
              >
                {idx + 1}
              </div>
              <button
                type="button"
                onClick={() => eliminar(idx)}
                title="Eliminar esta foto"
                style={{
                  position: 'absolute',
                  top: '3px',
                  right: '3px',
                  backgroundColor: 'rgba(198,40,40,0.88)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {urls.length < 8 && (
        <div
          onClick={() => !subiendo && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            e.currentTarget.style.borderColor = '#f46e15'
            e.currentTarget.style.backgroundColor = '#fff8f3'
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.borderColor = '#b7996b'
            e.currentTarget.style.backgroundColor = '#fdf8f4'
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.currentTarget.style.borderColor = '#b7996b'
            e.currentTarget.style.backgroundColor = '#fdf8f4'
            if (!subiendo) manejarArchivos(e.dataTransfer.files)
          }}
          style={{
            border: '2px dashed #b7996b',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center',
            cursor: subiendo ? 'default' : 'pointer',
            backgroundColor: '#fdf8f4',
            transition: 'border-color 0.15s, background-color 0.15s',
          }}
        >
          {subiendo ? (
            <div>
              <div style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>⏳</div>
              <span style={{ fontSize: '0.82rem', color: '#666' }}>
                Subiendo {progreso} de {progreso}… aguardá
              </span>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>➕</div>
              <span style={{ fontSize: '0.82rem', color: '#888' }}>
                Click o arrastrá fotos aquí · Podés seleccionar varias a la vez
              </span>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.length) manejarArchivos(e.target.files)
        }}
      />

      {errorMsg && <p style={{ color: '#c62828', fontSize: '0.82rem', marginTop: '0.4rem' }}>{errorMsg}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Página Principal
// ─────────────────────────────────────────────────────────────
export default function PaginaProductos() {
  const router = useRouter()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalPromoAbierto, setModalPromoAbierto] = useState(false)
  const [promoProductoId, setPromoProductoId] = useState(null)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    cargarProductos()
  }, [])

  async function cargarProductos() {
    setLoading(true)
    const { data, error } = await supabase.from('productos').select('*').order('nombre')
    if (!error) setProductos(data || [])
    setLoading(false)
  }

  function abrirNuevo() {
    setEditando(null)
    setForm(FORM_VACIO)
    setError(null)
    setModalAbierto(true)
  }

  function abrirEditar(p) {
    setEditando(p.id)
    setForm({
      ...p,
      imagen_public_id: p.imagen_public_id || '',
      imagenes_urls: Array.isArray(p.imagenes_urls) ? p.imagenes_urls.filter(Boolean) : [],
      fecha_inicio_promo: p.fecha_inicio_promo ? p.fecha_inicio_promo.slice(0, 16) : '',
      fecha_fin_promo: p.fecha_fin_promo ? p.fecha_fin_promo.slice(0, 16) : '',
    })
    setError(null)
    setModalAbierto(true)
  }

  function abrirGestionPromo(productoId = null) {
    setPromoProductoId(productoId || (productos[0]?.id ?? null))
    setModalPromoAbierto(true)
  }

  function cerrarModal() {
    setModalAbierto(false)
    setError(null)
  }

  function cambiarCampo(campo, valor) {
    setForm((prev) => {
      const next = { ...prev, [campo]: valor }
      if (campo === 'nombre' && !editando) next.slug = generarSlug(valor)
      return next
    })
  }

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      if (!form.nombre.trim()) throw new Error('El nombre es obligatorio.')
      if (!form.slug.trim()) throw new Error('El slug es obligatorio.')
      if (!form.precio_venta) throw new Error('El precio de venta es obligatorio.')

      const payload = {
        nombre: form.nombre.trim(),
        slug: form.slug.trim(),
        descripcion: form.descripcion?.trim() || null,
        categoria: form.categoria,
        precio_venta: Number(form.precio_venta),
        precio_mayorista: form.precio_mayorista ? Number(form.precio_mayorista) : null,
        en_promocion: !!form.en_promocion,
        precio_promocion: form.en_promocion && form.precio_promocion ? Number(form.precio_promocion) : null,
        fecha_inicio_promo: form.en_promocion && form.fecha_inicio_promo ? new Date(form.fecha_inicio_promo).toISOString() : null,
        fecha_fin_promo: form.en_promocion && form.fecha_fin_promo ? new Date(form.fecha_fin_promo).toISOString() : null,
        stock_actual: Number(form.stock_actual) || 0,
        stock_minimo: Number(form.stock_minimo) || 5,
        unidad_medida: form.unidad_medida,
        imagen_url: form.imagen_url || null,
        imagen_public_id: form.imagen_public_id || null,
        imagen_alt: form.imagen_alt?.trim() || null,
        imagenes_urls: Array.isArray(form.imagenes_urls) ? form.imagenes_urls.filter(Boolean) : [],
        is_active: form.is_active,
        is_featured: form.is_featured,
        disponible_delivery: form.disponible_delivery,
        updated_at: new Date().toISOString(),
      }

      if (editando) {
        const { error } = await supabase.from('productos').update(payload).eq('id', editando)
        if (error) throw error
      } else {
        const { error } = await supabase.from('productos').insert({ ...payload, created_at: new Date().toISOString() })
        if (error) throw error
      }

      await cargarProductos()
      cerrarModal()
    } catch (err) {
      setError(err.message || 'Error al guardar el producto.')
    } finally {
      setGuardando(false)
    }
  }

  async function toggleActivo(producto) {
    await supabase
      .from('productos')
      .update({ is_active: !producto.is_active, updated_at: new Date().toISOString() })
      .eq('id', producto.id)
    await cargarProductos()
  }

  const productosFiltrados = productos.filter((p) =>
    filtro === 'todos'
      ? true
      : filtro === 'activos'
      ? p.is_active
      : filtro === 'promociones'
      ? p.en_promocion
      : !p.is_active
  )

  const totalPromocionesActivas = productos.filter((p) => p.en_promocion && p.precio_promocion).length

  return (
    <div style={S.page}>
      {/* Header */}
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => router.push('/admin')}
            style={{ ...S.btnGris, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={16} /> Volver
          </button>
          <h1 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Croissant size={22} color="#f46e15" /> Catálogo de Productos
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          {/* Botón Gestor de Promociones */}
          <button
            onClick={() => abrirGestionPromo()}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.9rem',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
            }}
          >
            <Tag size={16} /> Promociones ({totalPromocionesActivas})
          </button>

          <button
            onClick={abrirNuevo}
            style={{ ...S.btnNaranja, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={16} /> Nuevo producto
          </button>
        </div>
      </header>

      <main style={S.main}>
        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {['todos', 'activos', 'promociones', 'inactivos'].map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={{
                ...(filtro === f ? (f === 'promociones' ? { ...S.btnVerde, backgroundColor: '#dc2626' } : S.btnVerde) : S.btnGris),
                textTransform: 'capitalize',
                fontWeight: 700,
              }}
            >
              {f === 'promociones' ? `🔥 En Promoción (${totalPromocionesActivas})` : f}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', color: '#666', fontSize: '0.85rem', alignSelf: 'center' }}>
            {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Tabla */}
        <div style={S.card}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>Cargando productos…</p>
          ) : productosFiltrados.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No hay productos que coincidan.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={S.tabla}>
                <thead>
                  <tr>
                    <th style={{ ...S.th, width: '60px' }}>Img</th>
                    <th style={S.th}>Nombre y Estado</th>
                    <th style={S.th}>Categoría</th>
                    <th style={S.th}>Precio Normal / Oferta</th>
                    <th style={S.th}>Stock</th>
                    <th style={{ ...S.th, width: '70px' }}>Fotos</th>
                    <th style={S.th}>Estado</th>
                    <th style={S.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((p) => {
                    const totalFotos = 1 + (Array.isArray(p.imagenes_urls) ? p.imagenes_urls.filter(Boolean).length : 0)
                    const estadoPromo = getEstadoPromo(p)
                    const precioVentaNum = Number(p.precio_venta) || 0
                    const precioPromoNum = Number(p.precio_promocion) || 0
                    const ahorroGs = precioVentaNum > precioPromoNum && precioPromoNum > 0 ? precioVentaNum - precioPromoNum : 0

                    return (
                      <tr key={p.id}>
                        {/* Miniatura */}
                        <td style={S.td}>
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              backgroundColor: '#f5f0ea',
                              border: '1px solid #e0d5c5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {p.imagen_url ? (
                              <img
                                src={p.imagen_url}
                                alt={p.nombre}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <Croissant size={20} color="#b7996b" />
                            )}
                          </div>
                        </td>

                        {/* Nombre y Badges */}
                        <td style={S.td}>
                          <strong style={{ color: '#334c2b' }}>{p.nombre}</strong>
                          <br />
                          <span style={{ fontSize: '0.78rem', color: '#999' }}>{p.slug}</span>
                          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                            {p.is_featured && (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  backgroundColor: '#fff3e0',
                                  color: '#e65100',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '8px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                }}
                              >
                                <Star size={11} /> Destacado
                              </span>
                            )}
                            {estadoPromo.label && (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  backgroundColor: estadoPromo.bg,
                                  color: estadoPromo.color,
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: '8px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  fontWeight: 800,
                                }}
                              >
                                {estadoPromo.label}
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={S.td}>{p.categoria}</td>

                        {/* Precio con formato Guaraníes */}
                        <td style={S.td}>
                          {p.en_promocion && p.precio_promocion ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                                <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.82rem' }}>
                                  {formatGs(p.precio_venta)}
                                </span>
                                <strong style={{ color: '#dc2626', fontSize: '1rem' }}>
                                  {formatGs(p.precio_promocion)}
                                </strong>
                              </div>
                              {ahorroGs > 0 && (
                                <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 700, marginTop: '2px' }}>
                                  AHORRAS {formatGs(ahorroGs)}
                                </div>
                              )}
                              {(p.fecha_inicio_promo || p.fecha_fin_promo) && (
                                <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Clock size={11} />
                                  {p.fecha_fin_promo ? `Hasta ${new Date(p.fecha_fin_promo).toLocaleDateString('es-PY')}` : 'Sin límite'}
                                </div>
                              )}
                            </div>
                          ) : (
                            <strong style={{ color: '#334c2b', fontSize: '0.95rem' }}>
                              {formatGs(p.precio_venta)}
                            </strong>
                          )}
                        </td>

                        {/* Stock */}
                        <td style={{ ...S.td, color: p.stock_actual <= p.stock_minimo ? '#c62828' : '#333' }}>
                          {p.stock_actual} {p.unidad_medida}
                          {p.stock_actual <= p.stock_minimo && (
                            <AlertTriangle
                              size={14}
                              color="#c62828"
                              style={{ display: 'inline', marginLeft: '0.3rem', verticalAlign: 'middle' }}
                            />
                          )}
                        </td>

                        {/* Contador de fotos */}
                        <td style={{ ...S.td, textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '12px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              backgroundColor: totalFotos > 1 ? '#e8f5e9' : '#f5f5f5',
                              color: totalFotos > 1 ? '#2e7d32' : '#999',
                            }}
                          >
                            {totalFotos > 1 ? (
                              <>
                                <Camera size={12} /> {totalFotos}
                              </>
                            ) : (
                              '1'
                            )}
                          </span>
                        </td>

                        {/* Estado */}
                        <td style={S.td}>
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '12px',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              backgroundColor: p.is_active ? '#e8f5e9' : '#ffebee',
                              color: p.is_active ? '#2e7d32' : '#c62828',
                            }}
                          >
                            {p.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td style={S.td}>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => abrirGestionPromo(p.id)}
                              style={{
                                backgroundColor: p.en_promocion ? '#dc2626' : '#ffffff',
                                color: p.en_promocion ? '#ffffff' : '#dc2626',
                                border: '1px solid #dc2626',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                              title="Gestionar promoción de este producto"
                            >
                              <Tag size={12} /> Promo
                            </button>
                            <button
                              onClick={() => abrirEditar(p)}
                              style={{
                                ...S.btnVerde,
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.8rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <Pencil size={12} /> Editar
                            </button>
                            <button
                              onClick={() => toggleActivo(p)}
                              style={{ ...S.btnGris, padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                            >
                              {p.is_active ? 'Desactivar' : 'Activar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Dedicado de Gestión de Promociones */}
      {modalPromoAbierto && (
        <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) setModalPromoAbierto(false) }}>
          <div style={{ ...S.modal, maxWidth: '650px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ color: '#991b1b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                <Tag size={24} color="#dc2626" /> Gestor Rápido de Promociones
              </h2>
              <button
                onClick={() => setModalPromoAbierto(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0.2rem',
                }}
              >
                ×
              </button>
            </div>

            <PromocionForm
              isStandalone={true}
              productos={productos}
              productoInicialId={promoProductoId}
              onGuardado={async () => {
                await cargarProductos()
              }}
              onCerrar={() => setModalPromoAbierto(false)}
            />
          </div>
        </div>
      )}

      {/* Modal Crear/Editar Producto Completo */}
      {modalAbierto && (
        <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) cerrarModal() }}>
          <div style={S.modal}>
            <h2
              style={{
                color: '#334c2b',
                marginTop: 0,
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {editando ? (
                <>
                  <Pencil size={20} /> Editar producto
                </>
              ) : (
                <>
                  <Plus size={20} /> Nuevo producto
                </>
              )}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Imagen principal */}
              <div style={{ gridColumn: '1 / -1' }}>
                <ImagenUploader
                  imagenUrl={form.imagen_url}
                  imagenPublicId={form.imagen_public_id}
                  onChange={(url, publicId) => {
                    setForm((prev) => ({
                      ...prev,
                      imagen_url: url,
                      imagen_public_id: publicId !== undefined ? publicId : prev.imagen_public_id,
                    }))
                  }}
                />
              </div>

              {/* Galería adicional */}
              <div style={{ gridColumn: '1 / -1' }}>
                <GaleriaUploader
                  urls={Array.isArray(form.imagenes_urls) ? form.imagenes_urls : []}
                  onChange={(nuevas) => cambiarCampo('imagenes_urls', nuevas)}
                />
              </div>

              {/* Separador visual */}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e0d5c5', marginTop: '0.25rem' }} />

              {/* Nombre */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={S.label}>Nombre *</label>
                <input
                  style={S.input}
                  value={form.nombre}
                  onChange={(e) => cambiarCampo('nombre', e.target.value)}
                  placeholder="Pan de Miga Clásico"
                />
              </div>

              {/* Slug */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={S.label}>Slug (URL) *</label>
                <input
                  style={S.input}
                  value={form.slug}
                  onChange={(e) => cambiarCampo('slug', e.target.value)}
                  placeholder="pan-de-miga-clasico"
                />
              </div>

              {/* Descripción */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={S.label}>Descripción</label>
                <textarea
                  style={{ ...S.input, minHeight: '80px', resize: 'vertical' }}
                  value={form.descripcion || ''}
                  onChange={(e) => cambiarCampo('descripcion', e.target.value)}
                  placeholder="Descripción del producto…"
                />
              </div>

              {/* Categoría */}
              <div>
                <label style={S.label}>Categoría *</label>
                <select style={S.input} value={form.categoria} onChange={(e) => cambiarCampo('categoria', e.target.value)}>
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unidad */}
              <div>
                <label style={S.label}>Unidad de medida</label>
                <select
                  style={S.input}
                  value={form.unidad_medida}
                  onChange={(e) => cambiarCampo('unidad_medida', e.target.value)}
                >
                  {UNIDADES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {/* Precio venta normal */}
              <div>
                <label style={S.label}>Precio venta normal (₲) *</label>
                <input
                  style={S.input}
                  type="number"
                  value={form.precio_venta}
                  onChange={(e) => cambiarCampo('precio_venta', e.target.value)}
                  placeholder="50000"
                />
              </div>

              {/* Precio mayorista */}
              <div>
                <label style={S.label}>Precio mayorista (₲)</label>
                <input
                  style={S.input}
                  type="number"
                  value={form.precio_mayorista || ''}
                  onChange={(e) => cambiarCampo('precio_mayorista', e.target.value)}
                  placeholder="40000"
                />
              </div>

              {/* Sección Oferta y Promoción (Embebida) */}
              <div style={{ gridColumn: '1 / -1' }}>
                <PromocionForm
                  enPromocion={!!form.en_promocion}
                  setEnPromocion={(val) => cambiarCampo('en_promocion', val)}
                  precioPromocion={form.precio_promocion || ''}
                  setPrecioPromocion={(val) => cambiarCampo('precio_promocion', val)}
                  precioBase={form.precio_venta}
                  fechaInicioPromo={form.fecha_inicio_promo || ''}
                  setFechaInicioPromo={(val) => cambiarCampo('fecha_inicio_promo', val)}
                  fechaFinPromo={form.fecha_fin_promo || ''}
                  setFechaFinPromo={(val) => cambiarCampo('fecha_fin_promo', val)}
                />
              </div>

              {/* Stock actual */}
              <div>
                <label style={S.label}>Stock actual</label>
                <input
                  style={S.input}
                  type="number"
                  value={form.stock_actual}
                  onChange={(e) => cambiarCampo('stock_actual', e.target.value)}
                />
              </div>

              {/* Stock mínimo */}
              <div>
                <label style={S.label}>Stock mínimo (alerta)</label>
                <input
                  style={S.input}
                  type="number"
                  value={form.stock_minimo}
                  onChange={(e) => cambiarCampo('stock_minimo', e.target.value)}
                />
              </div>

              {/* Checks */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                {[
                  ['is_active', '✅ Producto activo'],
                  ['is_featured', '⭐ Destacado en inicio'],
                  ['disponible_delivery', '🛵 Disponible para delivery'],
                ].map(([campo, etiqueta]) => (
                  <label
                    key={campo}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      color: '#334c2b',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!form[campo]}
                      onChange={(e) => cambiarCampo(campo, e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#334c2b' }}
                    />
                    {etiqueta}
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  border: '1px solid #ef9a9a',
                  borderRadius: '4px',
                  padding: '0.75rem',
                  marginTop: '1rem',
                  fontSize: '0.88rem',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={cerrarModal} style={S.btnGris}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando} style={{ ...S.btnNaranja, opacity: guardando ? 0.7 : 1 }}>
                {guardando ? 'Guardando…' : editando ? '💾 Guardar cambios' : '✅ Crear producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
