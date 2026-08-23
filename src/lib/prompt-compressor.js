// src/lib/prompt-compressor.js

let compressorInstance = null
let compressorLoadFailed = false

/**
 * Comprime un prompt extrayendo y reteniendo la información semántica clave.
 * Utiliza LLMLingua-2 con fallback seguro y heurístico en caso de fallos o prompts breves.
 *
 * @param {string} prompt - Texto del prompt a comprimir
 * @param {object} options - Opciones de compresión (ratio, maxTokens)
 * @returns {Promise<string>} Prompt comprimido o prompt original si no aplica / falla
 */
export async function comprimirPrompt(prompt, options = {}) {
  if (!prompt || typeof prompt !== 'string') return ''

  const { ratio = 0.6, maxTokens = 60 } = options
  const promptTrimmed = prompt.trim()

  // Si el prompt es corto (< 100 caracteres), no requiere compresión
  if (promptTrimmed.length < 100) {
    return promptTrimmed
  }

  try {
    if (!compressorInstance && !compressorLoadFailed) {
      try {
        // Carga dinámica segura para evitar conflictos de empaquetado
        const packageName = '@axiomantic/llmlingua-2'
        const linguaModule = await import(/* webpackIgnore: true */ packageName)
        const lingua = linguaModule.default || linguaModule
        if (lingua && typeof lingua.createCompressor === 'function') {
          compressorInstance = await lingua.createCompressor()
        } else if (typeof lingua === 'function') {
          compressorInstance = new lingua()
        }
      } catch (loadErr) {
        compressorLoadFailed = true
        console.warn('ℹ️ LLMLingua-2 operando en modo fallback semántico:', loadErr.message)
      }
    }

    if (compressorInstance && typeof compressorInstance.compress === 'function') {
      const result = await compressorInstance.compress(promptTrimmed, {
        targetRatio: ratio,
        maxTokens: maxTokens,
      })

      if (result && result.compressed && typeof result.compressed === 'string' && result.compressed.trim().length > 0) {
        return result.compressed.trim()
      }
    }

    // Fallback semántico inteligente: filtra conectores redundantes y extrae el núcleo descriptivo
    return comprimirPromptFallback(promptTrimmed, maxTokens)
  } catch (error) {
    console.warn('⚠️ Falló la compresión, usando fallback seguro:', error.message)
    return promptTrimmed
  }
}

/**
 * Compresión semántica heurística de respaldo (sin dependencias externas)
 */
function comprimirPromptFallback(prompt, maxTokens = 60) {
  const palabras = prompt.split(/\s+/)
  if (palabras.length <= maxTokens) {
    return prompt
  }

  // Filtrar artículos y conectores superfluos
  const stopWords = new Set([
    'un', 'una', 'unos', 'unas', 'el', 'la', 'los', 'las', 'de', 'del', 'con', 'para',
    'por', 'en', 'sobre', 'muy', 'mas', 'que', 'como', 'su', 'sus', 'al'
  ])

  const filtradas = palabras.filter((palabra, idx) => {
    // Mantener siempre primeras 3 palabras y sustantivos principales
    if (idx < 3) return true
    const limpio = palabra.toLowerCase().replace(/[^a-záéíóúñ]/g, '')
    return !stopWords.has(limpio)
  })

  const resultado = filtradas.slice(0, maxTokens).join(' ')
  return resultado.length > 0 ? resultado : prompt
}
