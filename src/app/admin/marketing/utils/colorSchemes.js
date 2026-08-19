/**
 * 📁 UBICACIÓN: src/app/admin/marketing/utils/colorSchemes.js
 * 📌 Paleta institucional y esquemas de color para creatividades.
 */

// ─── PALETA OFICIAL PANFREE ───────────────────────────────────────────────────
export const P = {
  crema:       '#eee6d9',
  verde:       '#334c2b',
  verdeMed:    '#2a3e23',
  verdeOsc:    '#1c2c17',
  naranja:     '#f46e15',
  naranjaOsc:  '#c8550a',
  dorado:      '#b7996b',
  doradoClaro: '#d2b991',
  blanco:      '#ffffff',
  // Acentos de marca extendidos
  turquesa:    '#4ECDC4',
  oscuro:      '#2D2D2D',
  naranjaPanfree: '#FF6B35',
}

export const ESQUEMAS = {
  oscuro: {
    label: 'Verde oscuro (clásico)',
    bg: P.verdeOsc,
    bgBot: P.verde,
    txt: P.crema,
    aA: P.naranja,
    aB: P.dorado,
  },
  claro: {
    label: 'Crema artesanal',
    bg: P.crema,
    bgBot: '#d4c9b5',
    txt: P.verde,
    aA: P.naranja,
    aB: P.verde,
  },
  naranja: {
    label: 'Naranja impacto',
    bg: P.naranjaOsc,
    bgBot: '#5a1e00',
    txt: P.blanco,
    aA: P.crema,
    aB: P.dorado,
  },
}

/**
 * Convierte un color hexadecimal a componentes RGB
 * @param {string} hex - Color hexadecimal (ej: "#334c2b")
 * @returns {{r: number, g: number, b: number}}
 */
export function rgb(hex) {
  const cleanHex = hex.replace('#', '')
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16),
  }
}
