/**
 * UBICACION: src/app/auth/callback/route.js
 * DESCRIPCION:
 *  - Endpoint que sirve una página HTML con un script cliente que completa
 *    el flujo OAuth de Supabase usando getSessionFromUrl (MANEJA PKCE AUTOMÁTICAMENTE)
 *  - Crea el perfil en tabla `clientes` si no existe, y redirige al home.
 */
import { sanitizeSupabaseUrl, DEFAULT_SUPABASE_ANON_KEY } from '@/lib/supabase'

export async function GET(request) {
  const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()) || DEFAULT_SUPABASE_ANON_KEY;

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Procesando inicio de sesión…</title>
    <style>
      body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; background:#fff8f0; color:#333 }
      .card { padding:24px; border:2px solid #b7996b; border-radius:8px; text-align:center; box-shadow:0 8px 24px rgba(0,0,0,0.08) }
      .spinner { display:inline-block; width:24px; height:24px; border:3px solid #f3f3f3; border-top:3px solid #334c2b; border-radius:50%; animation:spin 1s linear infinite }
      @keyframes spin { to { transform:rotate(360deg) } }
      a { color:#334c2b }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="spinner" aria-hidden="true"></div>
      <h2 style="margin:12px 0 6px">Procesando inicio de sesión…</h2>
      <p style="margin:0 0 8px; color:#666; font-size:14px">Si no te redirige automáticamente, <a id="homeLink" href="/">haz click aquí</a>.</p>
    </div>

    <script type="module">
      // Usamos la versión moderna de Supabase
      import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

      const SUPABASE_URL = ${JSON.stringify(supabaseUrl)};
      const SUPABASE_ANON_KEY = ${JSON.stringify(supabaseAnonKey)};

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Faltan variables de entorno NEXT_PUBLIC_SUPABASE_*');
        document.getElementById('homeLink').textContent = 'Volver al inicio';
      } else {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        (async function handleOAuthCallback() {
          try {
            // ✅ MÉTODO CORRECTO PARA PKCE: getSessionFromUrl maneja code_verifier automáticamente
            // Guarda la sesión en el almacenamiento local automáticamente
            const { data, error } = await supabase.auth.getSessionFromUrl({
              storeSession: true
            });
            
            if (error) {
              console.error('Error al obtener sesión desde URL:', error);
              window.location.replace('/login?error=oauth_failed');
              return;
            }

            const session = data?.session;
            const user = session?.user;
            
            if (!user) {
              console.warn('No se obtuvo usuario de la sesión');
              window.location.replace('/');
              return;
            }

            console.log('✅ Sesión obtenida para:', user.email);

            // Crear perfil en tabla clientes si no existe
            try {
              const { data: existing } = await supabase
                .from('clientes')
                .select('id')
                .eq('user_id', user.id)
                .limit(1);

              if (!existing || existing.length === 0) {
                const nombre = user.user_metadata?.full_name || 
                              user.user_metadata?.name || 
                              user.user_metadata?.nombre_completo ||
                              (user.email ? user.email.split('@')[0] : 'Usuario');
                const avatar = user.user_metadata?.avatar_url || 
                              user.user_metadata?.picture || 
                              null;

                console.log('📝 Creando perfil para:', nombre);

                try {
                  const { error: insertError } = await supabase
                    .from('clientes')
                    .insert({
                      nombre_completo: nombre,
                      email: user.email,
                      user_id: user.id,
                      is_active: true,
                      role: 'cliente',
                      avatar: avatar
                    });

                  if (insertError) throw insertError;
                  console.log('✅ Perfil creado correctamente');
                } catch (insertErr) {
                  console.warn('Inserción con role/avatar falló, reintentando sin esos campos:', insertErr);
                  
                  try {
                    const { error: fallbackErr } = await supabase
                      .from('clientes')
                      .insert({
                        nombre_completo: nombre,
                        email: user.email,
                        user_id: user.id,
                        is_active: true
                      });

                    if (fallbackErr) throw fallbackErr;
                    console.log('✅ Perfil creado (fallback)');
                  } catch (finalErr) {
                    console.error('No se pudo crear el perfil de cliente:', finalErr);
                  }
                }
              } else {
                console.log('✅ Perfil ya existe');
              }
            } catch (err) {
              console.error('Error al crear/validar perfil:', err);
            }

            // ✅ Redirigir al home
            window.location.replace('/');

          } catch (err) {
            console.error('Error inesperado en callback OAuth:', err);
            window.location.replace('/login?error=callback_error');
          }
        })();
      }
    </script>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}