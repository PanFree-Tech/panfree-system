// En useFavoritos.js
const agregarFavorito = useCallback(async (productoId, clienteId) => {
  if (!clienteId) {
    console.error('clienteId es requerido')
    return
  }

  // ✅ Usar clienteId en lugar de usuario.id
  const { error } = await supabase
    .from('favoritos')
    .insert({ cliente_id: clienteId, producto_id: productoId })

  if (error) throw error

  setFavoritos(prev => [...prev, productoId])
}, [])