// test-supabase.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function test() {
  const { data, error } = await supabase.from('productos').select('count')
  if (error) console.log('❌ Error:', error.message)
  else console.log('✅ Conexión exitosa:', data)
}

test()