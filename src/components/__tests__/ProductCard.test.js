import { render, screen } from '@testing-library/react'
import ProductCard from '../ProductCard'

describe('ProductCard', () => {
  const mockProducto = {
    id: '1',
    nombre: 'Pan Sin Gluten',
    precio_venta: 50000,
    descripcion: 'Pan artesanal',
    imagen_url: '/test-image.jpg',
    imagenes_urls: [],
  }

  const mockProductoPromo = {
    id: '2',
    nombre: 'Pan Dulce Oferta',
    precio_venta: 50000,
    precio_promocion: 40000,
    en_promocion: true,
    descripcion: 'Pan dulce',
    imagen_url: '/test-image-2.jpg',
  }

  it('renders product name', () => {
    render(<ProductCard producto={mockProducto} onAddToCart={() => {}} />)
    expect(screen.getByText('Pan Sin Gluten')).toBeInTheDocument()
  })

  it('renders standard price formatted with Gs.', () => {
    render(<ProductCard producto={mockProducto} onAddToCart={() => {}} />)
    expect(screen.getByText('Gs. 50.000')).toBeInTheDocument()
  })

  it('renders promotional price and savings when promo is active', () => {
    render(<ProductCard producto={mockProductoPromo} onAddToCart={() => {}} />)
    expect(screen.getByText('Gs. 40.000')).toBeInTheDocument()
    expect(screen.getByText('Gs. 50.000')).toBeInTheDocument()
    expect(screen.getByText(/AHORRAS Gs\. 10\.000/i)).toBeInTheDocument()
  })

  it('returns null when producto is missing', () => {
    const { container } = render(<ProductCard producto={null} onAddToCart={() => {}} />)
    expect(container.firstChild).toBeNull()
  })
})
