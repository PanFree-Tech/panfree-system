import { render, screen, act } from '@testing-library/react'
import { CartProvider, useCart } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'

const CartConsumer = () => {
  const { cantidadItems, agregarAlCarrito, eliminarDelCarrito, vaciarCarrito } = useCart()
  return (
    <div>
      <span data-testid="cantidad-items">{cantidadItems}</span>
      <button onClick={() => agregarAlCarrito({ id: '1', nombre: 'Pan', precio_venta: 1000, cantidad: 1 })}>Agregar Pan</button>
      <button onClick={() => eliminarDelCarrito('1')}>Eliminar Pan</button>
      <button onClick={() => vaciarCarrito()}>Vaciar</button>
    </div>
  )
}

const renderWithCart = (ui) => render(<AuthProvider><CartProvider>{ui}</CartProvider></AuthProvider>)

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('inicia con carrito vacío', () => {
    renderWithCart(<CartConsumer />)
    expect(screen.getByTestId('cantidad-items')).toHaveTextContent('0')
  })

  it('agrega un producto al carrito', async () => {
    renderWithCart(<CartConsumer />)
    await act(async () => {
      screen.getByText('Agregar Pan').click()
    })
    expect(screen.getByTestId('cantidad-items')).toHaveTextContent('1')
  })

  it('persiste el carrito en localStorage', async () => {
    renderWithCart(<CartConsumer />)
    await act(async () => {
      screen.getByText('Agregar Pan').click()
    })
    const guardado = localStorage.getItem('panfree_cart_v1')
    expect(guardado).toBeTruthy()
    const parsed = JSON.parse(guardado)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].nombre).toBe('Pan')
  })

  it('elimina un producto del carrito', async () => {
    renderWithCart(<CartConsumer />)
    await act(async () => {
      screen.getByText('Agregar Pan').click()
    })
    expect(screen.getByTestId('cantidad-items')).toHaveTextContent('1')
    await act(async () => {
      screen.getByText('Eliminar Pan').click()
    })
    expect(screen.getByTestId('cantidad-items')).toHaveTextContent('0')
  })

  it('vacía el carrito completamente', async () => {
    renderWithCart(<CartConsumer />)
    await act(async () => {
      screen.getByText('Agregar Pan').click()
    })
    await act(async () => {
      screen.getByText('Vaciar').click()
    })
    expect(screen.getByTestId('cantidad-items')).toHaveTextContent('0')
  })
})
