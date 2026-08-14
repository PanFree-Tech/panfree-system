/**
 * Archivo: scripts/optimize-images.js
 *
 * Convierte public/og-image.jpg a WebP sin sobrescribir el original.
 * - Requiere: npm i sharp
 * - Uso: node scripts/optimize-images.js
 * - Opcional: node scripts/optimize-images.js --input=public/og-image.jpg --quality=80 --output=public/og-image.webp
 *
 * Validaciones:
 * - Verifica que el archivo de entrada exista.
 * - No sobrescribe el fichero original.
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const argv = process.argv.slice(2)
const argMap = argv.reduce((acc, cur) => {
  const [k, v] = cur.split('=')
  if (k && v) acc[k.replace(/^--/, '')] = v
  return acc
}, {})

const inputDefault = 'public/og-image.jpg'
const qualityDefault = 80

const inputPath = argMap.input || inputDefault
const outputPath = argMap.output || (() => {
  const ext = path.extname(inputPath)
  const base = inputPath.slice(0, -ext.length)
  return `${base}.webp`
})()
const quality = parseInt(argMap.quality || qualityDefault, 10)

async function run() {
  try {
    const fullInput = path.resolve(process.cwd(), inputPath)
    const fullOutput = path.resolve(process.cwd(), outputPath)

    if (!fs.existsSync(fullInput)) {
      console.error(`ERROR: archivo de entrada no encontrado: ${fullInput}`)
      process.exit(2)
    }

    if (fullInput === fullOutput) {
      console.error('ERROR: El archivo de salida coincide con el de entrada. Se evitará sobrescribir el original.')
      process.exit(3)
    }

    // Crear carpeta de salida si no existe
    const outDir = path.dirname(fullOutput)
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

    console.log(`Convirtiendo "${fullInput}" -> "${fullOutput}" (quality=${quality})`)

    await sharp(fullInput)
      .webp({ quality })
      .toFile(fullOutput)

    const inStats = fs.statSync(fullInput)
    const outStats = fs.statSync(fullOutput)
    console.log('Resultado:')
    console.log(`  - Original: ${inStats.size} bytes`)
    console.log(`  - WebP:     ${outStats.size} bytes`)
    console.log('Hecho. El archivo original se mantiene intacto.')
  } catch (err) {
    console.error('Error durante la optimización:', err)
    process.exit(1)
  }
}

run()