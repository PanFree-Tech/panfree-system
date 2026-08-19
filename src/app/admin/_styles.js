/**
 * 📁 UBICACIÓN: src/app/admin/_styles.js
 * 📅 CREADO: 2026-08-19 (Fase 4 - Sistema Compartido)
 * 📌 DESCRIPCIÓN: Paleta de colores oficial y objeto de estilos compartidos (S) para todo el panel administrativo de PanFree.
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

// ── Paleta de Colores Oficial PanFree ─────────────────────────────────────────
export const COLORS = {
  verdeOscuro: '#334c2b',
  naranja: '#f46e15',
  marfil: '#b7996b',
  beige: '#eee6d9',
  blanco: '#ffffff',
  rojo: '#c62828',
  verde: '#2e7d32',
  verdeClaro: '#388e3c',
  gris: '#666666',
  grisClaro: '#999999',
  grisBorde: '#e0d5c5',
  grisFondo: '#f5f5f5',
  negro: '#333333',
  azul: '#1976d2',
  whatsapp: '#25D366',
}

// ── Estilos Compartidos (S) ──────────────────────────────────────────────────
export const S = {
  // Layouts
  page: {
    minHeight: '100vh',
    backgroundColor: COLORS.grisFondo,
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
  },

  header: {
    backgroundColor: COLORS.verdeOscuro,
    color: COLORS.beige,
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `3px solid ${COLORS.marfil}`,
    flexWrap: 'wrap',
    gap: '0.75rem',
  },

  main: {
    padding: '1.5rem 2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },

  card: {
    backgroundColor: COLORS.blanco,
    border: `2px solid ${COLORS.marfil}`,
    borderRadius: '8px',
    marginBottom: '1rem',
    padding: '1.5rem',
  },

  seccion: {
    backgroundColor: '#f9f6f1',
    border: `1px solid #e8ddd0`,
    borderRadius: '6px',
    padding: '1rem',
    marginBottom: '1rem',
  },

  seccionTit: {
    color: COLORS.verdeOscuro,
    fontWeight: '700',
    fontSize: '0.9rem',
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },

  // Botones
  btnVerde: {
    backgroundColor: COLORS.verdeOscuro,
    color: COLORS.beige,
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: '600',
    fontSize: '0.85rem',
    transition: 'background-color 0.15s, opacity 0.15s',
  },

  btnNaranja: {
    backgroundColor: COLORS.naranja,
    color: COLORS.blanco,
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: '600',
    fontSize: '0.85rem',
    transition: 'background-color 0.15s, opacity 0.15s',
  },

  btnGris: {
    backgroundColor: COLORS.gris,
    color: COLORS.blanco,
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: '600',
    fontSize: '0.85rem',
    transition: 'background-color 0.15s, opacity 0.15s',
  },

  btnWA: {
    backgroundColor: COLORS.whatsapp,
    color: COLORS.blanco,
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: '600',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    transition: 'background-color 0.15s, opacity 0.15s',
  },

  btnAzul: {
    backgroundColor: COLORS.azul,
    color: COLORS.blanco,
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: '600',
    fontSize: '0.85rem',
    transition: 'background-color 0.15s, opacity 0.15s',
  },

  // Formularios
  input: {
    width: '100%',
    padding: '0.55rem 0.85rem',
    border: `2px solid ${COLORS.marfil}`,
    borderRadius: '4px',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    outline: 'none',
    backgroundColor: COLORS.blanco,
    boxSizing: 'border-box',
    color: COLORS.negro,
  },

  select: {
    padding: '0.55rem 0.85rem',
    border: `2px solid ${COLORS.marfil}`,
    borderRadius: '4px',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    outline: 'none',
    backgroundColor: COLORS.blanco,
    cursor: 'pointer',
    color: COLORS.negro,
  },

  label: {
    display: 'block',
    color: COLORS.verdeOscuro,
    fontWeight: '600',
    fontSize: '0.85rem',
    marginBottom: '0.3rem',
  },

  // Tablas
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
  },

  th: {
    backgroundColor: COLORS.verdeOscuro,
    color: COLORS.beige,
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontSize: '0.85rem',
  },

  td: {
    padding: '0.75rem 1rem',
    borderBottom: `1px solid ${COLORS.beige}`,
    fontSize: '0.9rem',
    color: COLORS.negro,
    verticalAlign: 'middle',
  },

  // Modales y Overlays
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 300,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    overflowY: 'auto',
    padding: '2rem 1rem',
  },

  modal: {
    backgroundColor: COLORS.blanco,
    borderRadius: '8px',
    border: `2px solid ${COLORS.marfil}`,
    width: '100%',
    maxWidth: '720px',
    padding: '2rem',
    position: 'relative',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
  },

  // Badges y utilitarios
  badge: (bg, text) => ({
    display: 'inline-block',
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.78rem',
    fontWeight: '700',
    backgroundColor: bg || '#eee',
    color: text || '#666',
  }),
}
