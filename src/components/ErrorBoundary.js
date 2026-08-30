// src/components/ErrorBoundary.js
'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'

/**
 * ErrorBoundary - Clase React que captura errores de renderizado
 * y muestra una interfaz de fallback en lugar de romper la app.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para mostrar el fallback en el siguiente render
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log del error en consola
    console.error('🔥 ErrorBoundary capturó un error:', error, errorInfo)
    
    // También se puede enviar a un servicio de reporting
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI cuando hay un error
      return (
        <div
          style={{
            padding: '2rem',
            margin: '1rem 0',
            backgroundColor: '#fef2f2',
            border: '2px solid #fca5a5',
            borderRadius: '12px',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <AlertCircle size={24} color="#dc2626" />
            <h3 style={{ margin: 0, color: '#991b1b', fontWeight: 700 }}>
              Algo salió mal
            </h3>
          </div>
          <p style={{ color: '#7f1d1d', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            {this.state.error?.message || 'Ocurrió un error inesperado.'}
          </p>
          {this.state.errorInfo && (
            <details style={{ textAlign: 'left', fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem' }}>
              <summary>Ver detalles técnicos</summary>
              <pre style={{ whiteSpace: 'pre-wrap', padding: '0.5rem', background: '#f3f4f6', borderRadius: '4px' }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            >
              Recargar página
            </button>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      )
    }

    // Si no hay error, renderizar los hijos normalmente
    return this.props.children
  }
}