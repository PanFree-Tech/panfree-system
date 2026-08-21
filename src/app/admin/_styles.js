/**
 * 📁 UBICACIÓN: src/app/admin/_styles.js
 * 📅 ACTUALIZADO: 2026-08-20 (Fase 4 - Optimización Responsive & Touch para Móvil y Tablet)
 * 📌 DESCRIPCIÓN: Paleta de colores oficial y objeto de estilos compartidos (S) para todo el panel administrativo de PanFree.
 *    - Inputs con font-size de 16px (1rem) para evitar zoom automático en dispositivos móviles (iOS/Android).
 *    - Botones con target táctil mínimo de 44-48px para facilitar interacción táctil.
 *    - Tarjetas y contenedores con márgenes y scroll horizontal protegido.
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
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
    width: '100%',
    boxSizing: 'border-box',
  },

  header: {
    backgroundColor: COLORS.verdeOscuro,
    color: COLORS.beige,
    padding: '0.85rem 1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `3px solid ${COLORS.marfil}`,
    flexWrap: 'wrap',
    gap: '0.75rem',
    minHeight: '56px',
    boxSizing: 'border-box',
  },

  main: {
    padding: '1.25rem 1rem',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },

  card: {
    backgroundColor: COLORS.blanco,
    border: `2px solid ${COLORS.marfil}`,
    borderRadius: '10px',
    marginBottom: '1rem',
    padding: '1.25rem',
    boxSizing: 'border-box',
    width: '100%',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },

  seccion: {
    backgroundColor: '#f9f6f1',
    border: `1px solid #e8ddd0`,
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    boxSizing: 'border-box',
  },

  seccionTit: {
    color: COLORS.verdeOscuro,
    fontWeight: '700',
    fontSize: '0.95rem',
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },

  // Botones con dimensiones táctiles recomendadas (>=44px de altura)
  btnVerde: {
    backgroundColor: COLORS.verdeOscuro,
    color: COLORS.beige,
    border: 'none',
    padding: '0.6rem 1.1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: '600',
    fontSize: '0.9rem',
    minHeight: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    transition: 'background-color 0.15s, opacity 0.15s',
    touchAction: 'manipulation',
    boxSizing: 'border-box',
  },

  btnNaranja: {
    backgroundColor: COLORS.naranja,
    color: COLORS.blanco,
    border: 'none',
    padding: '0.6rem 1.1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: '600',
    fontSize: '0.9rem',
    minHeight: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    transition: 'background-color 0.15s, opacity 0.15s',
    touchAction: 'manipulation',
    boxSizing: 'border-box',
  },

  btnGris: {
    backgroundColor: COLORS.gris,
    color: COLORS.blanco,
    border: 'none',
    padding: '0.6rem 1.1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: '600',
    fontSize: '0.9rem',
    minHeight: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    transition: 'background-color 0.15s, opacity 0.15s',
    touchAction: 'manipulation',
    boxSizing: 'border-box',
  },

  btnWA: {
    backgroundColor: COLORS.whatsapp,
    color: COLORS.blanco,
    border: 'none',
    padding: '0.6rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: '600',
    fontSize: '0.88rem',
    minHeight: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    transition: 'background-color 0.15s, opacity 0.15s',
    touchAction: 'manipulation',
    boxSizing: 'border-box',
  },

  btnAzul: {
    backgroundColor: COLORS.azul,
    color: COLORS.blanco,
    border: 'none',
    padding: '0.6rem 1.1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: '600',
    fontSize: '0.9rem',
    minHeight: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    transition: 'background-color 0.15s, opacity 0.15s',
    touchAction: 'manipulation',
    boxSizing: 'border-box',
  },

  // Formularios (fontSize 16px / 1rem evita zoom molesto en iOS)
  input: {
    width: '100%',
    padding: '0.65rem 0.85rem',
    border: `2px solid ${COLORS.marfil}`,
    borderRadius: '6px',
    fontFamily: 'inherit',
    fontSize: '16px', // Previene auto-zoom en Safari iOS
    outline: 'none',
    backgroundColor: COLORS.blanco,
    boxSizing: 'border-box',
    color: COLORS.negro,
    minHeight: '44px',
  },

  select: {
    width: '100%',
    padding: '0.65rem 0.85rem',
    border: `2px solid ${COLORS.marfil}`,
    borderRadius: '6px',
    fontFamily: 'inherit',
    fontSize: '16px', // Previene auto-zoom en Safari iOS
    outline: 'none',
    backgroundColor: COLORS.blanco,
    cursor: 'pointer',
    color: COLORS.negro,
    minHeight: '44px',
    boxSizing: 'border-box',
  },

  label: {
    display: 'block',
    color: COLORS.verdeOscuro,
    fontWeight: '600',
    fontSize: '0.88rem',
    marginBottom: '0.35rem',
  },

  // Tablas responsivas con scroll horizontal
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '580px', // Asegura legibilidad en tablas completas dentro de su contenedor con scroll
  },

  th: {
    backgroundColor: COLORS.verdeOscuro,
    color: COLORS.beige,
    padding: '0.75rem 0.85rem',
    textAlign: 'left',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
  },

  td: {
    padding: '0.75rem 0.85rem',
    borderBottom: `1px solid ${COLORS.beige}`,
    fontSize: '0.9rem',
    color: COLORS.negro,
    verticalAlign: 'middle',
  },

  // Modales y Overlays adaptables
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(2px)',
    zIndex: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflowY: 'auto',
    padding: '1rem',
    boxSizing: 'border-box',
  },

  modal: {
    backgroundColor: COLORS.blanco,
    borderRadius: '12px',
    border: `2px solid ${COLORS.marfil}`,
    width: '100%',
    maxWidth: '720px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '1.5rem',
    position: 'relative',
    boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
    boxSizing: 'border-box',
  },

  // Badges y utilitarios
  badge: (bg, text) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25rem 0.65rem',
    borderRadius: '12px',
    fontSize: '0.78rem',
    fontWeight: '700',
    backgroundColor: bg || '#eee',
    color: text || '#666',
  }),
}
