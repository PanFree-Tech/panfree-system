import { render, screen } from '@testing-library/react'
import ProductCard from '../ProductCard'

describe('ProductCard', () => {
  const mockProducto = {
    id: '1',
    nombre: 'Pan Sin Gluten',
    precio: 5000,
    descripcion: 'Pan artesanal',
    imagen_url: '/test-image.jpg',
    imagenes_urls: [],
  }

  it('renders product name', () => {
    render(<ProductCard producto={mockProducto} onAddToCart={() => {}} />)
    expect(screen.getByText('Pan Sin Gluten')).toBeInTheDocument()
  })

  it('renders price correctly', () => {
    render(<ProductCard producto={mockProducto} onAddToCart={() => {}} />)
    expect(screen.getByText('₲ 5000')).toBeInTheDocument()
  })

  it('returns null when producto is missing', () => {
    const { container } = render(<ProductCard producto={null} onAddToCart={() => {}} />)
    expect(container.firstChild).toBeNull()
  })
})
