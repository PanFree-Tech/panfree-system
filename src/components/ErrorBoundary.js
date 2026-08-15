'use client'
import React, { useState } from 'react';

export default function ErrorBoundary({ children, fallback }) {
  const [error, setError] = useState(null)

  const handleError = (err) => {
    console.error('Error capturado:', err)
    setError(err)
  }

  if (error) {
    return fallback ? fallback(error) : (
      <div style={{
        padding: '2rem',
        margin: '2rem 0',
        backgroundColor: '#fee',
        border: '2px solid #f88',
        borderRadius: '8px',
        color: '#c00',
      }}>
        <h3>❌ Algo salió mal</h3>
        <p>{error.message}</p>
        <button
          onClick={() => setError(null)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f88',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <ErrorCatcher onError={handleError}>
      {children}
    </ErrorCatcher>
  )
}

function ErrorCatcher({ children, onError }) {
  try {
    return children
  } catch (err) {
    onError(err)
    return null
  }
}