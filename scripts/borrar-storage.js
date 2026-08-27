/**
 * Script para borrar archivos del Storage de Supabase usando la API oficial.
 * Uso:
 *   node scripts/borrar-storage.js
 * 
 * Requisitos:
 *   - SUPABASE_SERVICE_ROLE_KEY en .env.local
 */

const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno (los keys están en .env.local)
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validar
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno para Supabase.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function borrarStorage() {
  console.log('🚀 Iniciando borrado de archivos...\n');

  try {
    // 1. Obtener lista de archivos en el bucket 'productos'
    const { data: archivos, error } = await supabase
      .storage
      .from('productos')
      .list('', { limit: 100 });

    if (error) {
      throw new Error(`Error al obtener archivos: ${error.message}`);
    }

    if (!archivos || archivos.length === 0) {
      console.log('✅ No hay archivos en el bucket "productos".');
    } else {
      console.log(`📊 Encontrados: ${archivos.length} archivos.`);
      
      // 2. Borrar todos los archivos
      const paths = archivos.map(f => f.name);
      const { error: delError } = await supabase
        .storage
        .from('productos')
        .remove(paths);

      if (delError) {
        throw new Error(`Error al borrar: ${delError.message}`);
      }
      console.log('✅ Todos los archivos del bucket "productos" han sido borrados.');
    }

    // 3. (Opcional) Repetir para bucket 'public-images'
    const { data: archivos2 } = await supabase.storage.from('public-images').list('', { limit: 100 });
    if (archivos2 && archivos2.length > 0) {
      const paths2 = archivos2.map(f => f.name);
      await supabase.storage.from('public-images').remove(paths2);
      console.log('✅ Archivos del bucket "public-images" borrados.');
    } else {
      console.log('ℹ️ El bucket "public-images" está vacío o no existe.');
    }

  } catch (err) {
    console.error('💥 Error crítico:', err);
  }
}

borrarStorage();