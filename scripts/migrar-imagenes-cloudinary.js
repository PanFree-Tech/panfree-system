/**
 * Script para migrar imágenes de productos desde Supabase Storage a Cloudinary.
 * 
 * Uso:
 *   node scripts/migrar-imagenes-cloudinary.js
 * 
 * Requisitos:
 *   Variables de entorno definidas en .env.local o entorno:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY (o SUPABASE_SERVICE_ROLE_KEY)
 *   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   - CLOUDINARY_API_KEY
 *   - CLOUDINARY_API_SECRET
 */

const { createClient } = require('@supabase/supabase-js');
const { v2: cloudinary } = require('cloudinary');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// =====================================================
// ⚠️ ESTA SECCIÓN ES SOLO PARA PRUEBAS LOCALES.
// REEMPLAZA LOS VALORES CON TUS KEYS REALES.
// =====================================================
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://gbdrcaumghykiipqgbty.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZHJjYXVtZ2h5a2lpcHFnYnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjczNjIsImV4cCI6MjA4NzgwMzM2Mn0.OydRQxa51Ql42zvscWnQkEKJuU_3yeCS4qPQQoP6TuM';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZHJjYXVtZ2h5a2lpcHFnYnR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIyNzM2MiwiZXhwIjoyMDg3ODAzMzYyfQ.EH97qcovn21hWpqdu196z54lcLQ2epAiHrC-pqDZsGY';
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'd7simx38';
process.env.CLOUDINARY_API_KEY = '485388826873525';
process.env.CLOUDINARY_API_SECRET = 'ry5BfvM_YZqmjbhqnNHKqIkkKqk';
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Validar variables de entorno requeridas
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno para Supabase (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY).');
  process.exit(1);
}

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Error: Faltan variables de entorno para Cloudinary (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).');
  process.exit(1);
}

// Inicializar clientes
const supabase = createClient(supabaseUrl, supabaseKey);

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

async function migrarImagenes() {
  console.log('🚀 Iniciando migración de imágenes de Supabase Storage a Cloudinary...\n');

  try {
    // 1. Obtener productos que tienen imagen_url
    const { data: productos, error } = await supabase
      .from('productos')
      .select('id, nombre, imagen_url, imagen_public_id');

    if (error) {
      throw new Error(`Error al consultar Supabase: ${error.message}`);
    }

    if (!productos || productos.length === 0) {
      console.log('ℹ️ No se encontraron productos en la base de datos.');
      return;
    }

    // 2. Filtrar productos que necesitan migración (tienen imagen_url y no tienen imagen_public_id)
    const porMigrar = productos.filter(p => p.imagen_url && (!p.imagen_public_id || p.imagen_public_id.trim() === ''));

    console.log(`📊 Total de productos encontrados: ${productos.length}`);
    console.log(`📦 Productos pendientes de migración: ${porMigrar.length}\n`);

    if (porMigrar.length === 0) {
      console.log('✅ Todos los productos ya tienen un public_id de Cloudinary. ¡No hay nada que migrar!');
      return;
    }

    let exitosos = 0;
    let fallidos = 0;

    // 3. Procesar cada producto
    for (let i = 0; i < porMigrar.length; i++) {
      const prod = porMigrar[i];
      console.log(`[${i + 1}/${porMigrar.length}] Procesando "${prod.nombre}" (ID: ${prod.id})...`);
      console.log(`   URL original: ${prod.imagen_url}`);

      try {
        // Subir a Cloudinary usando la URL directa
        const uploadResult = await cloudinary.uploader.upload(prod.imagen_url, {
          folder: 'productos',
          resource_type: 'image',
        });

        const publicId = uploadResult.public_id;

        console.log(`   ✓ Subida exitosa a Cloudinary. public_id: ${publicId}`);

        // Actualizar el registro en Supabase
        const { error: updateError } = await supabase
          .from('productos')
          .update({
            imagen_url: uploadResult.secure_url, // ← ¡AHORA SÍ GUARDAMOS LA URL DE CLOUDINARY!
            imagen_public_id: publicId,
          })
          .eq('id', prod.id);

        if (updateError) {
          console.error(`   ❌ Error al actualizar Supabase para "${prod.nombre}": ${updateError.message}`);
          fallidos++;
        } else {
          console.log(`   ✓ Base de datos actualizada correctamente en Supabase.`);
          exitosos++;
        }
      } catch (uploadError) {
        console.error(`   ❌ Error al migrar la imagen de "${prod.nombre}":`, uploadError.message || uploadError);
        fallidos++;
      }

      console.log('--------------------------------------------------');
    }

    console.log('\n🎉 Proceso de migración finalizado.');
    console.log(`✅ Migrados con éxito: ${exitosos}`);
    if (fallidos > 0) {
      console.log(`⚠️ Fallidos: ${fallidos}`);
    }
  } catch (err) {
    console.error('💥 Error crítico en la migración:', err);
  }
}

migrarImagenes();