import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/context/AuthContext'

const AuthConsumer = () => {
  const { usuario, loading, modalVisible, abrirModal, cerrarModal } = useAuth()
  return (
    <div>
      <span data-testid="loading">{loading ? 'cargando' : 'listo'}</span>
      <span data-testid="modal">{modalVisible ? 'abierto' : 'cerrado'}</span>
      <span data-testid="usuario">{usuario ? usuario.email : 'sin usuario'}</span>
      <button onClick={() => abrirModal()}>Abrir Modal</button>
      <button onClick={() => cerrarModal()}>Cerrar Modal</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('inicia en estado loading', () => {
    render(<AuthProvider><AuthConsumer /></AuthProvider>)
    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('abre y cierra el modal', async () => {
    render(<AuthProvider><AuthConsumer /></AuthProvider>)
    expect(screen.getByTestId('modal')).toHaveTextContent('cerrado')
    await act(async () => {
      screen.getByText('Abrir Modal').click()
    })
    expect(screen.getByTestId('modal')).toHaveTextContent('abierto')
    await act(async () => {
      screen.getByText('Cerrar Modal').click()
    })
    expect(screen.getByTestId('modal')).toHaveTextContent('cerrado')
  })

  it('no tiene usuario al inicio', () => {
    render(<AuthProvider><AuthConsumer /></AuthProvider>)
    expect(screen.getByTestId('usuario')).toHaveTextContent('sin usuario')
  })
})
