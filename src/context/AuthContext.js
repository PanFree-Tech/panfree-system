/**
 * 📁 UBICACIÓN: src/context/AuthContext.js
 * 📅 CREADO: 2026-03-01
 * 📌 DESCRIPCIÓN: Context API para autenticación de clientes en la tienda pública.
 *    Maneja sesión de clientes con Supabase Auth (email + contraseña).
 *    Expone: usuario, sesion, loading, modalVisible, abrirModal, cerrarModal, cerrarSesion.
 *    El modal se abre automáticamente cuando un cliente intenta agregar al carrito
 *    sin estar autenticado (via abrirModal() desde CartContext).
 *    Modo: 'login' | 'registro' — alternables desde el modal.
 *    Al registrarse se crea automáticamente un registro en tabla clientes.
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario]           = useState(null)
  const [sesion, setSesion]             = useState(null)
  const [loading, setLoading]           = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // callback a ejecutar post-login

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session)
      setUsuario(session?.user ?? null)
      setLoading(false)
    })

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session)
      setUsuario(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Abrir modal de login (opcionalmente con acción a ejecutar tras login)
  const abrirModal = (callback = null) => {
    setPendingAction(() => callback)
    setModalVisible(true)
  }

  const cerrarModal = () => {
    setModalVisible(false)
    setPendingAction(null)
  }

  // Ejecutar acción pendiente tras login exitoso
  const onLoginExitoso = () => {
    cerrarModal()
    if (pendingAction) pendingAction()
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    setUsuario(null)
    setSesion(null)
  }

  return (
    <AuthContext.Provider value={{
      usuario, sesion, loading,
      modalVisible, abrirModal, cerrarModal, onLoginExitoso,
      cerrarSesion,
      estaAutenticado: !!usuario
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de un <AuthProvider>')
  return ctx
}