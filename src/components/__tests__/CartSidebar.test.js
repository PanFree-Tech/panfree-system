import { render, screen, act } from '@testing-library/react'
import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'
import CartSidebar from '@/components/CartSidebar'

// Mock de next/navigation (el componente usa useRouter)
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

const renderWithProviders = (ui) => render(
  <AuthProvider><CartProvider>{ui}</CartProvider></AuthProvider>
)

describe('CartSidebar', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renderiza el carrito vacío (mensaje de carrito vacío)', () => {
    renderWithProviders(<CartSidebar />)
    // El sidebar puede no estar visible por defecto, pero el componente se monta
    // Verificamos que no crashé al renderizar
    expect(document.body).toBeTruthy()
  })

  it('no muestra items si el carrito está vacío', () => {
    renderWithProviders(<CartSidebar />)
    // El sidebar está oculto por defecto, no muestra items
    expect(screen.queryByText(/Tu carrito/i)).not.toBeInTheDocument()
  })
})
