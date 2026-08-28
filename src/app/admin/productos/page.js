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
import PromocionForm, {
  formatGs,
  parseFechaPromo,
  dateToLocalInputValue,
  localInputValueToIso,
  getEstadoPromo,
} from './components/PromocionForm'

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

// ─────────────────────────────────────────────────────────────
// Gestor Integral de Imágenes de Producto (Cloudinary + Supabase)
// ─────────────────────────────────────────────────────────────
function GestorImagenesProducto({ imagenUrl, imagenesUrls = [], onChange }) {
  const inputRef = useRef(null)
  const [subiendo, setSubiendo] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 })
  const dragItem = useRef(null)
  const dragOver = useRef(null)

  // Combinar lista sin duplicados asegurando que la principal sea la primera
  const listaImagenes = (() => {
    const arr = []
    if (imagenUrl && typeof imagenUrl === 'string' && imagenUrl.trim()) {
      arr.push(imagenUrl.trim())
    }
    if (Array.isArray(imagenesUrls)) {
      imagenesUrls.forEach((u) => {
        if (u && typeof u === 'string' && u.trim() && !arr.includes(u.trim())) {
          arr.push(u.trim())
        }
      })
    }
    return arr
  })()

  function actualizarLista(nuevaLista) {
    const limpia = nuevaLista.filter((u) => u && typeof u === 'string' && u.trim())
    const principal = limpia[0] || ''
    onChange({
      imagen_url: principal,
      imagenes_urls: limpia,
    })
  }

  async function subirArchivoCloudinary(archivo) {
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
    return data.secure_url
  }

  async function manejarArchivos(archivos) {
    if (!archivos || archivos.length === 0) return
    const lista = Array.from(archivos)
    const tiposOk = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const invalidos = lista.filter((f) => !tiposOk.includes(f.type))
    if (invalidos.length) {
      setErrorMsg('Solo se permiten formatos JPG, PNG, WEBP o GIF.')
      return
    }
    const grandes = lista.filter((f) => f.size > 10 * 1024 * 1024)
    if (grandes.length) {
      setErrorMsg('Cada imagen debe tener un tamaño máximo de 10MB.')
      return
    }

    setSubiendo(true)
    setErrorMsg(null)
    setProgreso({ actual: 0, total: lista.length })

    try {
      const nuevasUrls = []
      for (let i = 0; i < lista.length; i++) {
        setProgreso({ actual: i + 1, total: lista.length })
        const url = await subirArchivoCloudinary(lista[i])
        if (url) nuevasUrls.push(url)
      }

      const listaCombinada = [...listaImagenes, ...nuevasUrls]
      actualizarLista(listaCombinada)
    } catch (err) {
      console.error('Error Cloudinary upload:', err)
      setErrorMsg(err.message || 'Error al subir imagen. Intentá de nuevo.')
    } finally {
      setSubiendo(false)
      setProgreso({ actual: 0, total: 0 })
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function hacerPrincipal(idx) {
    if (idx === 0 || idx >= listaImagenes.length) return
    const copia = [...listaImagenes]
    const [elegida] = copia.splice(idx, 1)
    copia.unshift(elegida)
    actualizarLista(copia)
  }

  function eliminarFoto(idx) {
    const copia = listaImagenes.filter((_, i) => i !== idx)
    actualizarLista(copia)
  }

  function onDragStart(idx) {
    dragItem.current = idx
  }

  function onDragEnter(idx) {
    dragOver.current = idx
  }

  function onDragEnd() {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
      dragItem.current = null
      dragOver.current = null
      return
    }
    const copia = [...listaImagenes]
    const [movida] = copia.splice(dragItem.current, 1)
    copia.splice(dragOver.current, 0, movida)
    dragItem.current = null
    dragOver.current = null
    actualizarLista(copia)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <label style={{ ...S.label, margin: 0 }}>
          📸 Galería de Fotos del Producto
          <span style={{ fontWeight: 400, color: '#888', marginLeft: '0.5rem' }}>
            ({listaImagenes.length} foto{listaImagenes.length !== 1 ? 's' : ''})
          </span>
        </label>
        <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
          La 1ra foto es la <strong>Portada Principal</strong>
        </span>
      </div>

      {/* Grid de Fotos Existentes */}
      {listaImagenes.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '0.75rem',
            marginBottom: '0.9rem',
          }}
        >
          {listaImagenes.map((url, idx) => {
            const esPrincipal = idx === 0
            return (
              <div
                key={`${url}-${idx}`}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragEnter={() => onDragEnter(idx)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => e.preventDefault()}
                title="Arrastrá para reordenar"
                style={{
                  position: 'relative',
                  cursor: 'grab',
                  border: esPrincipal ? '2.5px solid #f46e15' : '1.5px solid #b7996b',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#fdf8f4',
                  boxShadow: esPrincipal ? '0 2px 8px rgba(244,110,21,0.25)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Imagen */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1', backgroundColor: '#eee6d9' }}>
                  <img
                    src={url}
                    alt={`Foto ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={(e) => {
                      e.target.style.opacity = '0.3'
                    }}
                  />

                  {/* Badge Principal / Número */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      backgroundColor: esPrincipal ? '#f46e15' : 'rgba(0,0,0,0.65)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      backdropFilter: 'blur(2px)',
                    }}
                  >
                    {esPrincipal ? '⭐ Portada' : `#${idx + 1}`}
                  </div>

                  {/* Botón Eliminar */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      eliminarFoto(idx)
                    }}
                    title="Eliminar esta foto"
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      backgroundColor: 'rgba(198,40,40,0.92)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Botón Hacer Portada */}
                {!esPrincipal && (
                  <button
                    type="button"
                    onClick={() => hacerPrincipal(idx)}
                    style={{
                      border: 'none',
                      borderTop: '1px solid #e0d5c5',
                      backgroundColor: '#fff',
                      color: '#334c2b',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.35rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff3e0'
                      e.currentTarget.style.color = '#e65100'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff'
                      e.currentTarget.style.color = '#334c2b'
                    }}
                  >
                    ⭐ Hacer portada
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Zona de Subida Drag & Drop */}
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
          padding: '1.25rem',
          textAlign: 'center',
          cursor: subiendo ? 'default' : 'pointer',
          backgroundColor: '#fdf8f4',
          transition: 'border-color 0.15s, background-color 0.15s',
        }}
      >
        {subiendo ? (
          <div>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>⏳</div>
            <p style={{ margin: 0, fontWeight: 700, color: '#334c2b', fontSize: '0.88rem' }}>
              Subiendo a Cloudinary ({progreso.actual} de {progreso.total})…
            </p>
            <span style={{ fontSize: '0.78rem', color: '#666' }}>Por favor aguardá un instante</span>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>📷 ➕</div>
            <p style={{ margin: '0 0 0.25rem 0', fontWeight: 700, color: '#334c2b', fontSize: '0.9rem' }}>
              Subir fotos a Cloudinary
            </p>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>
              Click aquí o arrastrá tus fotos · Podés subir una por una o varias juntas (JPG, PNG, WEBP)
            </span>
          </div>
        )}
      </div>

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

      {errorMsg && (
        <p style={{ color: '#c62828', fontSize: '0.82rem', marginTop: '0.4rem', fontWeight: 600 }}>
          ⚠️ {errorMsg}
        </p>
      )}
      <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.35rem' }}>
        Cloudinary Media Storage · Arrastrá las fotos para cambiar su orden · Máx 10MB por foto
      </p>
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

    // Consolidar lista de imágenes sin duplicados preservando la principal
    const fotosExistentes = []
    if (p.imagen_url && typeof p.imagen_url === 'string' && p.imagen_url.trim()) {
      fotosExistentes.push(p.imagen_url.trim())
    }
    if (Array.isArray(p.imagenes_urls)) {
      p.imagenes_urls.forEach((u) => {
        if (u && typeof u === 'string' && u.trim() && !fotosExistentes.includes(u.trim())) {
          fotosExistentes.push(u.trim())
        }
      })
    }

    setForm({
      ...p,
      imagen_url: p.imagen_url || fotosExistentes[0] || '',
      imagen_public_id: p.imagen_public_id || '',
      imagenes_urls: fotosExistentes,
      fecha_inicio_promo: dateToLocalInputValue(p.fecha_inicio_promo),
      fecha_fin_promo: dateToLocalInputValue(p.fecha_fin_promo),
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

      const todasLasImagenes = Array.isArray(form.imagenes_urls)
        ? form.imagenes_urls.filter((u) => u && typeof u === 'string' && u.trim())
        : []
      const principal = (form.imagen_url && form.imagen_url.trim()) || todasLasImagenes[0] || null

      const listaFinalUrls = principal
        ? [principal, ...todasLasImagenes.filter((u) => u !== principal)]
        : todasLasImagenes

      const payload = {
        nombre: form.nombre.trim(),
        slug: form.slug.trim(),
        descripcion: form.descripcion?.trim() || null,
        categoria: form.categoria,
        precio_venta: Number(form.precio_venta),
        precio_mayorista: form.precio_mayorista ? Number(form.precio_mayorista) : null,
        en_promocion: !!form.en_promocion,
        precio_promocion: form.en_promocion && form.precio_promocion ? Number(form.precio_promocion) : null,
        fecha_inicio_promo: form.en_promocion && form.fecha_inicio_promo ? localInputValueToIso(form.fecha_inicio_promo) : null,
        fecha_fin_promo: form.en_promocion && form.fecha_fin_promo ? localInputValueToIso(form.fecha_fin_promo) : null,
        stock_actual: Number(form.stock_actual) || 0,
        stock_minimo: Number(form.stock_minimo) || 5,
        unidad_medida: form.unidad_medida,
        imagen_url: principal,
        imagen_public_id: form.imagen_public_id || null,
        imagen_alt: form.imagen_alt?.trim() || null,
        imagenes_urls: listaFinalUrls,
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
                                  {p.fecha_fin_promo
                                    ? `Hasta ${parseFechaPromo(p.fecha_fin_promo)?.toLocaleDateString('es-PY') || p.fecha_fin_promo}`
                                    : 'Sin límite'}
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
              {/* Gestor Integral de Imágenes (Múltiples fotos, portada y eliminación) */}
              <div style={{ gridColumn: '1 / -1' }}>
                <GestorImagenesProducto
                  imagenUrl={form.imagen_url}
                  imagenesUrls={form.imagenes_urls}
                  onChange={({ imagen_url, imagenes_urls }) => {
                    setForm((prev) => ({
                      ...prev,
                      imagen_url,
                      imagenes_urls,
                    }))
                  }}
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
