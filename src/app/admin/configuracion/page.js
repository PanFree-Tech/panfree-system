/**
 * 📁 UBICACIÓN: src/app/admin/configuracion/page.js
 * 📅 CREADO: 2026-08-28
 * 📌 DESCRIPCIÓN: Panel de Configuración General del Sitio, Branding y Usuarios de PanFree.
 *    - Logo Principal (Oficial Base).
 *    - Galería de Variantes Temáticas (Octubre Rosa, Navidad, San Valentín, etc.).
 *    - Selector de Variante Activa para Header y Footer.
 *    - Banners de la tienda (Hero) y Favicon.
 *    - Gestión de Usuarios / Administradores con avatares en Cloudinary.
 *    - Subida directa a Cloudinary (carpetas: 'logos', 'banners', 'usuarios').
 *    - Persistencia en tablas `configuracion_sitio` y `usuarios` de Supabase.
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Settings,
  Image as ImageIcon,
  Users,
  Save,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  UserCheck,
  Sparkles,
  RefreshCw,
  Eye,
  Check,
  Palette,
  Star,
  Edit2,
  Layers,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { S } from '../_styles'

// ─────────────────────────────────────────────────────────────
// Subidor de Archivos a Cloudinary
// ─────────────────────────────────────────────────────────────
async function subirACloudinary(archivo, carpeta = 'logos') {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'd7simx38'
  const uploadPreset = process.env.NEXT_PUBLIC_UPLOAD_PRESET || 'panfree_upload'

  const formData = new FormData()
  formData.append('file', archivo)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', carpeta)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Error al subir imagen a Cloudinary')
  }

  const data = await res.json()
  return data.secure_url
}

// ─────────────────────────────────────────────────────────────
// Componente de Subida de Imagen Individual
// ─────────────────────────────────────────────────────────────
function SingleImageUploader({
  label,
  sublabel,
  currentUrl,
  fallbackUrl,
  folder = 'logos',
  onChange,
  aspectRatio = '1 / 1',
  maxWidth = '180px',
}) {
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const displayUrl = currentUrl || fallbackUrl

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setSubiendo(true)
    setError(null)
    try {
      const url = await subirACloudinary(file, folder)
      onChange(url)
    } catch (err) {
      setError(err.message || 'Error al subir')
    } finally {
      setSubiendo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div>
        <label style={{ ...S.label, marginBottom: '0.15rem' }}>{label}</label>
        {sublabel && <span style={{ fontSize: '0.78rem', color: '#666' }}>{sublabel}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Preview */}
        <div
          style={{
            width: maxWidth,
            aspectRatio,
            backgroundColor: '#f8f5f0',
            border: '2px dashed #b7996b',
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={label}
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
            />
          ) : (
            <ImageIcon size={32} color="#b7996b" />
          )}

          {subiendo && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255,255,255,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: '#334c2b',
              }}
            >
              Subiendo…
            </div>
          )}
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={subiendo}
            style={{
              ...S.btnVerde,
              padding: '0.5rem 0.9rem',
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <UploadCloud size={16} /> {displayUrl ? 'Cambiar imagen' : 'Subir imagen'}
          </button>

          {currentUrl && (
            <button
              type="button"
              onClick={() => onChange('')}
              style={{
                ...S.btnGris,
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                color: '#c62828',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <Trash2 size={14} /> Quitar personalizada
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
        </div>
      </div>

      {error && (
        <span style={{ fontSize: '0.8rem', color: '#c62828', fontWeight: 600 }}>⚠️ {error}</span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL DE CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────
export default function PaginaConfiguracionAdmin() {
  const router = useRouter()
  const [tabActiva, setTabActiva] = useState('branding') // 'branding' | 'banners' | 'usuarios'
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  // Estado de Configuración del Sitio
  const [config, setConfig] = useState({
    id: 1,
    nombre_tienda: 'PanFree',
    logo_url: '',
    logo_variantes: [],
    logo_variante_activa: '',
    banner_url: '',
    banner_titulo: 'Panificados y Repostería 100% Sin Gluten',
    banner_subtitulo: 'Elaborados artesanalmente en Encarnación con ingredientes certificados.',
    banner_link: '#catalogo',
    favicon_url: '',
    telefono_whatsapp: '+595984589845',
    instagram_handle: '@panfree.py',
    direccion_fisica: 'Encarnación, Itapúa, Paraguay',
  })

  // Modal para agregar/editar variante de logo
  const [modalVariante, setModalVariante] = useState(false)
  const [varianteEditandoIndex, setVarianteEditandoIndex] = useState(null)
  const [formVariante, setFormVariante] = useState({
    id: '',
    nombre: '',
    url: '',
  })
  const [subiendoVariante, setSubiendoVariante] = useState(false)
  const [errorVariante, setErrorVariante] = useState(null)
  const fileVarianteInputRef = useRef(null)

  // Estado de Usuarios
  const [usuarios, setUsuarios] = useState([])
  const [modalUsuario, setModalUsuario] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [formUsuario, setFormUsuario] = useState({
    nombre: '',
    email: '',
    rol: 'operador',
    avatar_url: '',
    telefono: '',
    is_active: true,
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setLoading(true)
    try {
      // 1. Cargar Configuración de Sitio
      const { data: configData, error: errConfig } = await supabase
        .from('configuracion_sitio')
        .select('*')
        .eq('id', 1)
        .single()

      if (configData) {
        // Asegurar que logo_variantes sea un array
        let variantes = []
        if (Array.isArray(configData.logo_variantes)) {
          variantes = configData.logo_variantes
        } else if (typeof configData.logo_variantes === 'string') {
          try {
            variantes = JSON.parse(configData.logo_variantes)
          } catch {
            variantes = []
          }
        }

        // Migración suave si existía logo_rosa_url y no está en la galería
        if (configData.logo_rosa_url && !variantes.some((v) => v.nombre?.toLowerCase().includes('rosa'))) {
          variantes.push({
            id: 'octubre-rosa',
            nombre: 'Octubre Rosa',
            url: configData.logo_rosa_url,
            creada_en: new Date().toISOString(),
          })
        }

        let varianteActiva = configData.logo_variante_activa || ''
        if (!varianteActiva && configData.usar_logo_rosa && configData.logo_rosa_url) {
          varianteActiva = 'octubre-rosa'
        }

        setConfig((prev) => ({
          ...prev,
          ...configData,
          logo_variantes: variantes,
          logo_variante_activa: varianteActiva,
        }))
      } else if (errConfig && errConfig.code === 'PGRST116') {
        // No existe la fila 1 aún, se creará al guardar
      }

      // 2. Cargar Usuarios
      const { data: usuariosData } = await supabase
        .from('usuarios')
        .select('*')
        .order('nombre')

      if (usuariosData) {
        setUsuarios(usuariosData)
      }
    } catch (err) {
      console.error('Error cargando configuración:', err)
    } finally {
      setLoading(false)
    }
  }

  async function guardarConfiguracion() {
    setGuardando(true)
    setMensaje(null)
    try {
      const payload = {
        ...config,
        id: 1,
        logo_variantes: config.logo_variantes || [],
        logo_variante_activa: config.logo_variante_activa || null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('configuracion_sitio')
        .upsert(payload, { onConflict: 'id' })

      if (error) throw error

      setMensaje({ tipo: 'ok', texto: 'Configuración y variantes guardadas exitosamente.' })
      setTimeout(() => setMensaje(null), 3500)
    } catch (err) {
      console.error('Error guardando configuración:', err)
      setMensaje({ tipo: 'err', texto: err.message || 'Error al guardar la configuración.' })
    } finally {
      setGuardando(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Operaciones de Galería de Variantes
  // ─────────────────────────────────────────────────────────────
  function abrirNuevaVariante() {
    setVarianteEditandoIndex(null)
    setFormVariante({
      id: `var-${Date.now()}`,
      nombre: '',
      url: '',
    })
    setErrorVariante(null)
    setModalVariante(true)
  }

  function abrirEditarVariante(index) {
    const v = config.logo_variantes[index]
    if (!v) return
    setVarianteEditandoIndex(index)
    setFormVariante({
      id: v.id || `var-${Date.now()}`,
      nombre: v.nombre || '',
      url: v.url || '',
    })
    setErrorVariante(null)
    setModalVariante(true)
  }

  async function handleSubirArchivoVariante(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setSubiendoVariante(true)
    setErrorVariante(null)
    try {
      const url = await subirACloudinary(file, 'logos')
      setFormVariante((prev) => ({
        ...prev,
        url,
        nombre: prev.nombre || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      }))
    } catch (err) {
      setErrorVariante(err.message || 'Error al subir imagen a Cloudinary')
    } finally {
      setSubiendoVariante(false)
      if (fileVarianteInputRef.current) fileVarianteInputRef.current.value = ''
    }
  }

  function guardarVarianteModal() {
    if (!formVariante.url) {
      setErrorVariante('Debes subir o indicar la imagen de la variante.')
      return
    }
    if (!formVariante.nombre.trim()) {
      setErrorVariante('Por favor escribe un nombre para la variante (ej: Navidad, Octubre Rosa).')
      return
    }

    const nuevaVariante = {
      id: formVariante.id || `var-${Date.now()}`,
      nombre: formVariante.nombre.trim(),
      url: formVariante.url,
      creada_en: new Date().toISOString(),
    }

    let nuevasVariantes = [...(config.logo_variantes || [])]
    if (varianteEditandoIndex !== null) {
      nuevasVariantes[varianteEditandoIndex] = {
        ...nuevasVariantes[varianteEditandoIndex],
        ...nuevaVariante,
      }
    } else {
      nuevasVariantes.push(nuevaVariante)
    }

    setConfig({ ...config, logo_variantes: nuevasVariantes })
    setModalVariante(false)
  }

  function eliminarVariante(index) {
    const variante = config.logo_variantes[index]
    if (!variante) return
    if (!confirm(`¿Eliminar la variante "${variante.nombre}"?`)) return

    const nuevasVariantes = config.logo_variantes.filter((_, i) => i !== index)
    let nuevaActiva = config.logo_variante_activa

    // Si la variante eliminada era la activa, volver al logo base
    if (nuevaActiva === variante.id || nuevaActiva === variante.url) {
      nuevaActiva = ''
    }

    setConfig({
      ...config,
      logo_variantes: nuevasVariantes,
      logo_variante_activa: nuevaActiva,
    })
  }

  function seleccionarVarianteActiva(identificador) {
    setConfig({
      ...config,
      logo_variante_activa: identificador || '',
    })
  }

  // Obtener logo que se mostraría actualmente en tienda
  function getLogoActivoPreview() {
    if (config.logo_variante_activa) {
      const variante = (config.logo_variantes || []).find(
        (v) => v.id === config.logo_variante_activa || v.url === config.logo_variante_activa
      )
      if (variante?.url) return { url: variante.url, nombre: variante.nombre, esVariante: true }
      if (config.logo_variante_activa.startsWith('http')) {
        return { url: config.logo_variante_activa, nombre: 'Variante personalizada', esVariante: true }
      }
    }
    return {
      url: config.logo_url || '/images/logo-panfree.svg',
      nombre: 'Logo Principal Oficial (Base)',
      esVariante: false,
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Operaciones de Usuario
  // ─────────────────────────────────────────────────────────────
  function abrirNuevoUsuario() {
    setUsuarioEditando(null)
    setFormUsuario({
      nombre: '',
      email: '',
      rol: 'operador',
      avatar_url: '',
      telefono: '',
      is_active: true,
    })
    setModalUsuario(true)
  }

  function abrirEditarUsuario(u) {
    setUsuarioEditando(u.id)
    setFormUsuario({
      nombre: u.nombre || '',
      email: u.email || '',
      rol: u.rol || 'operador',
      avatar_url: u.avatar_url || '',
      telefono: u.telefono || '',
      is_active: u.is_active !== false,
    })
    setModalUsuario(true)
  }

  async function guardarUsuario() {
    if (!formUsuario.nombre.trim() || !formUsuario.email.trim()) {
      alert('Nombre y Correo electrónico son requeridos.')
      return
    }

    try {
      const payload = {
        nombre: formUsuario.nombre.trim(),
        email: formUsuario.email.trim().toLowerCase(),
        rol: formUsuario.rol,
        avatar_url: formUsuario.avatar_url || null,
        foto_url: formUsuario.avatar_url || null,
        telefono: formUsuario.telefono?.trim() || null,
        is_active: formUsuario.is_active,
        updated_at: new Date().toISOString(),
      }

      if (usuarioEditando) {
        const { error } = await supabase
          .from('usuarios')
          .update(payload)
          .eq('id', usuarioEditando)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('usuarios')
          .insert({ ...payload, created_at: new Date().toISOString() })
        if (error) throw error
      }

      setModalUsuario(false)
      cargarDatos()
    } catch (err) {
      alert(err.message || 'Error al guardar usuario')
    }
  }

  async function eliminarUsuario(id) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return
    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', id)
      if (error) throw error
      cargarDatos()
    } catch (err) {
      alert(err.message || 'Error al eliminar usuario')
    }
  }

  const logoActualTienda = getLogoActivoPreview()

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
            <Settings size={22} color="#f46e15" /> Configuración del Sistema & Branding
          </h1>
        </div>

        <button
          onClick={guardarConfiguracion}
          disabled={guardando}
          style={{
            ...S.btnNaranja,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            opacity: guardando ? 0.7 : 1,
          }}
        >
          <Save size={16} /> {guardando ? 'Guardando…' : 'Guardar Cambios'}
        </button>
      </header>

      <main style={S.main}>
        {/* Notificación de Éxito / Error */}
        {mensaje && (
          <div
            style={{
              padding: '0.85rem 1.2rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              backgroundColor: mensaje.tipo === 'ok' ? '#e8f5e9' : '#ffebee',
              color: mensaje.tipo === 'ok' ? '#2e7d32' : '#c62828',
              border: `1px solid ${mensaje.tipo === 'ok' ? '#a5d6a7' : '#ef9a9a'}`,
            }}
          >
            {mensaje.tipo === 'ok' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {mensaje.texto}
          </div>
        )}

        {/* Tabs de Configuración */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setTabActiva('branding')}
            style={{
              ...(tabActiva === 'branding' ? S.btnVerde : S.btnGris),
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
            }}
          >
            <Sparkles size={16} /> Identidad y Logos
          </button>
          <button
            onClick={() => setTabActiva('banners')}
            style={{
              ...(tabActiva === 'banners' ? S.btnVerde : S.btnGris),
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
            }}
          >
            <ImageIcon size={16} /> Banners de Tienda
          </button>
          <button
            onClick={() => setTabActiva('usuarios')}
            style={{
              ...(tabActiva === 'usuarios' ? S.btnVerde : S.btnGris),
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
            }}
          >
            <Users size={16} /> Usuarios & Equipo ({usuarios.length})
          </button>
        </div>

        {loading ? (
          <div style={{ ...S.card, padding: '3rem', textAlign: 'center', color: '#666' }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
            <p>Cargando configuración...</p>
          </div>
        ) : (
          <>
            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB 1: IDENTIDAD Y LOGOS (SIMPLIFICADO Y OPTIMIZADO) */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {tabActiva === 'branding' && (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* 1. SELECCIÓN DE VARIANTE ACTIVA EN TIENDA */}
                <div
                  style={{
                    ...S.card,
                    border: logoActualTienda.esVariante ? '2px solid #b7996b' : '1px solid #e0d5c5',
                    backgroundColor: '#fffdf9',
                  }}
                >
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid #f0e6d6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#334c2b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Palette size={20} color="#f46e15" /> Variante de Logo Activa en la Tienda
                      </h2>
                      <span style={{ fontSize: '0.82rem', color: '#666' }}>
                        El logo seleccionado se aplicará de inmediato en el Header y Footer de la tienda pública.
                      </span>
                    </div>

                    {/* Selector Rápido */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334c2b' }}>
                        Variante Actual:
                      </label>
                      <select
                        style={{
                          ...S.input,
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          borderColor: '#b7996b',
                          minWidth: '220px',
                        }}
                        value={config.logo_variante_activa || ''}
                        onChange={(e) => seleccionarVarianteActiva(e.target.value)}
                      >
                        <option value="">🏛️ Logo Principal (Oficial Base)</option>
                        {(config.logo_variantes || []).map((v) => (
                          <option key={v.id} value={v.id}>
                            🎨 {v.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Estado y Vista Previa en Vivo del Header */}
                  <div style={{ padding: '1.25rem', backgroundColor: '#fcfaf6' }}>
                    <div
                      style={{
                        backgroundColor: '#eee6d9',
                        border: '2px solid #b7996b',
                        borderRadius: '8px',
                        padding: '0.85rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        boxShadow: '0 2px 6px rgba(51,76,43,0.08)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        <div
                          style={{
                            width: '54px',
                            height: '54px',
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            padding: '4px',
                            border: '1.5px solid #b7996b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={logoActualTienda.url}
                            alt="Logo Activo"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#334c2b', lineHeight: 1.2 }}>
                            {config.nombre_tienda || 'PanFree'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#8f9a44', fontWeight: 600 }}>
                            100% Sin Gluten · Encarnación
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.3rem 0.75rem',
                            borderRadius: '16px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            backgroundColor: logoActualTienda.esVariante ? '#fdf2f8' : '#e8f5e9',
                            color: logoActualTienda.esVariante ? '#9d174d' : '#2e7d32',
                            border: `1px solid ${logoActualTienda.esVariante ? '#f472b6' : '#a5d6a7'}`,
                          }}
                        >
                          <Check size={14} /> Mostrando: <strong>{logoActualTienda.nombre}</strong>
                        </span>

                        {logoActualTienda.esVariante && (
                          <button
                            type="button"
                            onClick={() => seleccionarVarianteActiva('')}
                            style={{
                              ...S.btnGris,
                              padding: '0.3rem 0.65rem',
                              fontSize: '0.8rem',
                              color: '#334c2b',
                            }}
                          >
                            Restablecer al Base
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. LOGO PRINCIPAL BASE Y NOMBRE DE MARCA */}
                <div style={S.card}>
                  <h2 style={{ ...S.cardHead, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Star size={18} color="#b7996b" /> 1. Logo Principal (Oficial Base)
                  </h2>
                  <div style={{ ...S.cardBody, display: 'grid', gap: '1.5rem' }}>
                    {/* Nombre del Sitio */}
                    <div>
                      <label style={S.label}>Nombre de la Marca / Tienda</label>
                      <input
                        style={S.input}
                        value={config.nombre_tienda}
                        onChange={(e) => setConfig({ ...config, nombre_tienda: e.target.value })}
                        placeholder="PanFree"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                      {/* Logo Principal */}
                      <SingleImageUploader
                        label="Logo Base Oficial"
                        sublabel="El logo permanente de PanFree (SVG o PNG transparente, 200x200px)"
                        currentUrl={config.logo_url}
                        fallbackUrl="/images/logo-panfree.svg"
                        folder="logos"
                        onChange={(url) => setConfig({ ...config, logo_url: url })}
                      />

                      {/* Favicon */}
                      <SingleImageUploader
                        label="Favicon / Icono de Pestaña"
                        sublabel="Icono pequeño para el navegador (32x32 o 64x64px)"
                        currentUrl={config.favicon_url}
                        fallbackUrl="/favicon.ico"
                        folder="logos"
                        maxWidth="90px"
                        onChange={(url) => setConfig({ ...config, favicon_url: url })}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. GALERÍA DE VARIANTES TEMÁTICAS */}
                <div style={S.card}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.25rem',
                      backgroundColor: '#334c2b',
                      color: '#eee6d9',
                    }}
                  >
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Layers size={18} /> 2. Galería de Variantes Temáticas ({config.logo_variantes?.length || 0})
                      </h2>
                      <span style={{ fontSize: '0.78rem', color: '#d0c5b4' }}>
                        Logos estilizados para fechas especiales (Octubre Rosa, Navidad, San Valentín, Pascua, Aniversario, etc.)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={abrirNuevaVariante}
                      style={{
                        ...S.btnNaranja,
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Plus size={15} /> Subir Nueva Variante
                    </button>
                  </div>

                  <div style={S.cardBody}>
                    {(!config.logo_variantes || config.logo_variantes.length === 0) ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '3rem 1.5rem',
                          backgroundColor: '#fcfaf6',
                          borderRadius: '8px',
                          border: '1.5px dashed #b7996b',
                        }}
                      >
                        <Sparkles size={38} color="#b7996b" style={{ margin: '0 auto 0.75rem' }} />
                        <h3 style={{ margin: '0 0 0.4rem 0', color: '#334c2b', fontSize: '1.05rem' }}>
                          No hay variantes temáticas en la galería
                        </h3>
                        <p style={{ margin: '0 0 1.25rem 0', color: '#666', fontSize: '0.88rem', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
                          Podés subir variantes con listones, gorros navideños, corazones o colores conmemorativos para activarlas en cualquier momento con un solo clic.
                        </p>
                        <button
                          type="button"
                          onClick={abrirNuevaVariante}
                          style={{ ...S.btnVerde, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <Plus size={16} /> Subir primera variante
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                          gap: '1.25rem',
                        }}
                      >
                        {config.logo_variantes.map((v, idx) => {
                          const estaActiva = config.logo_variante_activa === v.id || config.logo_variante_activa === v.url

                          return (
                            <div
                              key={v.id || idx}
                              style={{
                                backgroundColor: '#ffffff',
                                border: estaActiva ? '2.5px solid #2e7d32' : '1px solid #e0d5c5',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: estaActiva ? '0 4px 12px rgba(46, 125, 50, 0.15)' : '0 2px 6px rgba(0,0,0,0.04)',
                                transition: 'all 0.2s ease',
                                position: 'relative',
                              }}
                            >
                              {/* Badge Activa */}
                              {estaActiva && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    backgroundColor: '#2e7d32',
                                    color: '#ffffff',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    zIndex: 2,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                  }}
                                >
                                  <Check size={12} /> ACTIVA
                                </div>
                              )}

                              {/* Preview de la imagen */}
                              <div
                                style={{
                                  height: '140px',
                                  backgroundColor: '#f9f6f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '12px',
                                  borderBottom: '1px solid #eee',
                                }}
                              >
                                <img
                                  src={v.url}
                                  alt={v.nombre}
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                />
                              </div>

                              {/* Información */}
                              <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#334c2b', marginBottom: '0.75rem' }}>
                                  {v.nombre}
                                </div>

                                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  {estaActiva ? (
                                    <button
                                      type="button"
                                      onClick={() => seleccionarVarianteActiva('')}
                                      style={{
                                        ...S.btnGris,
                                        width: '100%',
                                        padding: '0.45rem',
                                        fontSize: '0.8rem',
                                        color: '#334c2b',
                                        fontWeight: 700,
                                      }}
                                    >
                                      Desactivar (Usar Oficial)
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => seleccionarVarianteActiva(v.id)}
                                      style={{
                                        ...S.btnVerde,
                                        width: '100%',
                                        padding: '0.45rem',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.35rem',
                                      }}
                                    >
                                      <Check size={14} /> Activar en Tienda
                                    </button>
                                  )}

                                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                                    <button
                                      type="button"
                                      onClick={() => abrirEditarVariante(idx)}
                                      style={{
                                        ...S.btnGris,
                                        flex: 1,
                                        padding: '0.3rem',
                                        fontSize: '0.75rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.25rem',
                                      }}
                                    >
                                      <Edit2 size={12} /> Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => eliminarVariante(idx)}
                                      style={{
                                        ...S.btnGris,
                                        padding: '0.3rem 0.5rem',
                                        fontSize: '0.75rem',
                                        color: '#c62828',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                      title="Eliminar variante"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB 2: BANNERS DE LA TIENDA */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {tabActiva === 'banners' && (
              <div style={S.card}>
                <h2 style={{ ...S.cardHead, margin: 0 }}>🖼️ Banner Principal de la Tienda (Hero)</h2>
                <div style={{ ...S.cardBody, display: 'grid', gap: '1.5rem' }}>
                  <SingleImageUploader
                    label="Imagen de Banner / Portada"
                    sublabel="Recomendado: 1200x400px o 1920x600px optimizado para web (JPG o WEBP)"
                    currentUrl={config.banner_url}
                    folder="banners"
                    aspectRatio="16 / 6"
                    maxWidth="100%"
                    onChange={(url) => setConfig({ ...config, banner_url: url })}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={S.label}>Título del Banner</label>
                      <input
                        style={S.input}
                        value={config.banner_titulo || ''}
                        onChange={(e) => setConfig({ ...config, banner_titulo: e.target.value })}
                        placeholder="Panificados y Repostería 100% Sin Gluten"
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={S.label}>Subtítulo del Banner</label>
                      <input
                        style={S.input}
                        value={config.banner_subtitulo || ''}
                        onChange={(e) => setConfig({ ...config, banner_subtitulo: e.target.value })}
                        placeholder="Elaborados artesanalmente en Encarnación con ingredientes certificados."
                      />
                    </div>

                    <div>
                      <label style={S.label}>Enlace del Botón (CTA)</label>
                      <input
                        style={S.input}
                        value={config.banner_link || ''}
                        onChange={(e) => setConfig({ ...config, banner_link: e.target.value })}
                        placeholder="#catalogo"
                      />
                    </div>
                  </div>

                  {/* Previsualización del Banner */}
                  {config.banner_url && (
                    <div style={{ marginTop: '1rem' }}>
                      <label style={{ ...S.label, marginBottom: '0.4rem' }}>
                        <Eye size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Vista previa del Banner en Tienda
                      </label>
                      <div
                        style={{
                          position: 'relative',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          minHeight: '180px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          color: '#fff',
                          padding: '2rem',
                          background: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.6)), url(${config.banner_url}) center/cover no-repeat`,
                        }}
                      >
                        <div>
                          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', fontWeight: 800 }}>
                            {config.banner_titulo || 'PanFree Sin Gluten'}
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
                            {config.banner_subtitulo}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB 3: USUARIOS Y EQUIPO */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {tabActiva === 'usuarios' && (
              <div style={S.card}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1.25rem',
                    backgroundColor: '#334c2b',
                    color: '#eee6d9',
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={18} /> Equipo y Usuarios del Sistema
                  </h2>
                  <button
                    onClick={abrirNuevoUsuario}
                    style={{
                      ...S.btnNaranja,
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Plus size={14} /> Nuevo Usuario
                  </button>
                </div>

                <div style={S.cardBody}>
                  {usuarios.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      <Users size={40} color="#b7996b" style={{ margin: '0 auto 0.5rem' }} />
                      <p>No hay usuarios registrados en la tabla de personal.</p>
                      <button onClick={abrirNuevoUsuario} style={S.btnVerde}>
                        Crear primer usuario
                      </button>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={S.tabla}>
                        <thead>
                          <tr>
                            <th style={{ ...S.th, width: '60px' }}>Avatar</th>
                            <th style={S.th}>Nombre y Email</th>
                            <th style={S.th}>Rol</th>
                            <th style={S.th}>Teléfono</th>
                            <th style={S.th}>Estado</th>
                            <th style={{ ...S.th, textAlign: 'right' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usuarios.map((u) => (
                            <tr key={u.id}>
                              <td style={S.td}>
                                <div
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    backgroundColor: '#eee6d9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1.5px solid #b7996b',
                                  }}
                                >
                                  {u.avatar_url || u.foto_url ? (
                                    <img
                                      src={u.avatar_url || u.foto_url}
                                      alt={u.nombre}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <UserCheck size={20} color="#334c2b" />
                                  )}
                                </div>
                              </td>
                              <td style={S.td}>
                                <strong style={{ color: '#334c2b' }}>{u.nombre}</strong>
                                <br />
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>{u.email}</span>
                              </td>
                              <td style={S.td}>
                                <span
                                  style={{
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    backgroundColor: u.rol === 'admin' ? '#fdf2f8' : '#e8f5e9',
                                    color: u.rol === 'admin' ? '#9d174d' : '#2e7d32',
                                    border: `1px solid ${u.rol === 'admin' ? '#f472b6' : '#a5d6a7'}`,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {u.rol}
                                </span>
                              </td>
                              <td style={S.td}>{u.telefono || '—'}</td>
                              <td style={S.td}>
                                <span
                                  style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '10px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    backgroundColor: u.is_active ? '#e8f5e9' : '#ffebee',
                                    color: u.is_active ? '#2e7d32' : '#c62828',
                                  }}
                                >
                                  {u.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td style={{ ...S.td, textAlign: 'right' }}>
                                <button
                                  onClick={() => abrirEditarUsuario(u)}
                                  style={{
                                    ...S.btnVerde,
                                    padding: '0.3rem 0.6rem',
                                    fontSize: '0.78rem',
                                    marginRight: '0.4rem',
                                  }}
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => eliminarUsuario(u.id)}
                                  style={{
                                    ...S.btnGris,
                                    padding: '0.3rem 0.6rem',
                                    fontSize: '0.78rem',
                                    color: '#c62828',
                                  }}
                                >
                                  Eliminar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: AGREGAR / EDITAR VARIANTE DE LOGO */}
      {/* ───────────────────────────────────────────────────────────── */}
      {modalVariante && (
        <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) setModalVariante(false) }}>
          <div style={{ ...S.modal, maxWidth: '480px' }}>
            <h2 style={{ color: '#334c2b', marginTop: 0, marginBottom: '1.25rem', fontSize: '1.15rem' }}>
              {varianteEditandoIndex !== null ? 'Editar Variante de Logo' : 'Subir Nueva Variante de Logo'}
            </h2>

            <div style={{ display: 'grid', gap: '1.2rem' }}>
              {/* Nombre de la Variante */}
              <div>
                <label style={S.label}>Nombre de la Ocasión / Temática *</label>
                <input
                  style={S.input}
                  value={formVariante.nombre}
                  onChange={(e) => setFormVariante({ ...formVariante, nombre: e.target.value })}
                  placeholder="Ej: Octubre Rosa, Navidad 2026, San Valentín..."
                />
              </div>

              {/* Subida de Imagen */}
              <div>
                <label style={S.label}>Imagen de la Variante *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem' }}>
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      backgroundColor: '#f8f5f0',
                      border: '2px dashed #b7996b',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {formVariante.url ? (
                      <img
                        src={formVariante.url}
                        alt="Variante"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                      />
                    ) : (
                      <ImageIcon size={30} color="#b7996b" />
                    )}

                    {subiendoVariante && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(255,255,255,0.85)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#334c2b',
                        }}
                      >
                        Subiendo…
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => fileVarianteInputRef.current?.click()}
                      disabled={subiendoVariante}
                      style={{
                        ...S.btnVerde,
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <UploadCloud size={16} /> {formVariante.url ? 'Cambiar archivo' : 'Seleccionar imagen'}
                    </button>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#666' }}>
                      Se guardará en la carpeta <strong>'logos'</strong> de Cloudinary.
                    </p>
                    <input
                      ref={fileVarianteInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleSubirArchivoVariante}
                    />
                  </div>
                </div>
              </div>

              {errorVariante && (
                <div style={{ color: '#c62828', fontSize: '0.82rem', fontWeight: 600 }}>
                  ⚠️ {errorVariante}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalVariante(false)} style={S.btnGris}>
                Cancelar
              </button>
              <button onClick={guardarVarianteModal} style={S.btnNaranja} disabled={subiendoVariante}>
                Guardar Variante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Usuario */}
      {modalUsuario && (
        <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) setModalUsuario(false) }}>
          <div style={{ ...S.modal, maxWidth: '500px' }}>
            <h2 style={{ color: '#334c2b', marginTop: 0, marginBottom: '1.25rem', fontSize: '1.15rem' }}>
              {usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario / Personal'}
            </h2>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {/* Subir Avatar a Cloudinary */}
              <SingleImageUploader
                label="Avatar / Foto de Perfil"
                sublabel="Se guardará en la carpeta 'usuarios' de Cloudinary"
                currentUrl={formUsuario.avatar_url}
                folder="usuarios"
                maxWidth="90px"
                onChange={(url) => setFormUsuario({ ...formUsuario, avatar_url: url })}
              />

              <div>
                <label style={S.label}>Nombre Completo *</label>
                <input
                  style={S.input}
                  value={formUsuario.nombre}
                  onChange={(e) => setFormUsuario({ ...formUsuario, nombre: e.target.value })}
                  placeholder="Ej: Laura Benítez"
                />
              </div>

              <div>
                <label style={S.label}>Correo Electrónico *</label>
                <input
                  style={S.input}
                  type="email"
                  value={formUsuario.email}
                  onChange={(e) => setFormUsuario({ ...formUsuario, email: e.target.value })}
                  placeholder="laura@panfree.py"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={S.label}>Rol en el Sistema</label>
                  <select
                    style={S.input}
                    value={formUsuario.rol}
                    onChange={(e) => setFormUsuario({ ...formUsuario, rol: e.target.value })}
                  >
                    <option value="admin">Administrador (Total)</option>
                    <option value="operador">Operador (Producción)</option>
                    <option value="repartidor">Repartidor (Delivery)</option>
                    <option value="marketing">Marketing (Promociones)</option>
                  </select>
                </div>

                <div>
                  <label style={S.label}>Teléfono</label>
                  <input
                    style={S.input}
                    value={formUsuario.telefono}
                    onChange={(e) => setFormUsuario({ ...formUsuario, telefono: e.target.value })}
                    placeholder="+595 981 ..."
                  />
                </div>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#334c2b',
                }}
              >
                <input
                  type="checkbox"
                  checked={formUsuario.is_active}
                  onChange={(e) => setFormUsuario({ ...formUsuario, is_active: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#334c2b' }}
                />
                Usuario Activo
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalUsuario(false)} style={S.btnGris}>
                Cancelar
              </button>
              <button onClick={guardarUsuario} style={S.btnNaranja}>
                Guardar Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
