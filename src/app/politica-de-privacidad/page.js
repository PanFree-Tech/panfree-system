/**
 * 📁 UBICACIÓN: src/app/politica-de-privacidad/page.js
 * 📅 ACTUALIZADO: 2026-08-16
 * 📌 DESCRIPCIÓN: Política de Privacidad de PanFree.
 *    Cumple con requisitos de Meta Ads y protección de datos.
 */

export default function PoliticaPrivacidad() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: '"Segoe UI", sans-serif', color: '#333', lineHeight: 1.7 }}>
      <h1 style={{ color: '#334c2b', fontSize: '2rem', borderBottom: '3px solid #b7996b', paddingBottom: '0.5rem' }}>
        Política de Privacidad
      </h1>
      <p style={{ fontSize: '0.95rem', color: '#555' }}>
        <strong>Última actualización:</strong> 16 de agosto de 2026
      </p>

      <p>
        En <strong>PanFree</strong> nos tomamos muy en serio tu privacidad. Esta política explica qué datos recolectamos, cómo los usamos y cómo podés ejercer tus derechos.
      </p>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>1. Datos que recolectamos</h2>
      <ul>
        <li><strong>Datos de contacto:</strong> nombre, email, teléfono, dirección de entrega.</li>
        <li><strong>Datos de pedido:</strong> productos comprados, método de pago, método de entrega.</li>
        <li><strong>Datos de navegación:</strong> cookies, IP, dispositivo, páginas visitadas (para mejorar tu experiencia).</li>
        <li><strong>Datos de autenticación:</strong> si creás una cuenta, almacenamos tu email y contraseña (en Supabase).</li>
      </ul>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>2. Cómo usamos tus datos</h2>
      <ul>
        <li><strong>Procesar tus pedidos:</strong> confirmación, preparación, entrega y seguimiento.</li>
        <li><strong>Comunicación:</strong> enviarte confirmaciones, actualizaciones de estado y responder consultas.</li>
        <li><strong>Mejorar el servicio:</strong> analizar patrones de compra para ofrecerte mejores productos y promociones.</li>
        <li><strong>Marketing:</strong> solo si nos das tu consentimiento explícito (ej. newsletter).</li>
      </ul>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>3. Compartición de datos</h2>
      <p>
        No compartimos tus datos con terceros, excepto cuando es <strong>estrictamente necesario</strong> para:
      </p>
      <ul>
        <li><strong>Procesar pagos:</strong> transferencias bancarias (no compartimos datos bancarios con terceros).</li>
        <li><strong>Entregar pedidos:</strong> compartimos tu dirección y teléfono con el repartidor.</li>
        <li><strong>Proveedores de infraestructura:</strong> Supabase (hosting, base de datos), Vercel (hosting).</li>
      </ul>
      <p>
        Nunca vendemos ni alquilamos tus datos a terceros para fines comerciales.
      </p>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>4. Tus derechos</h2>
      <p>
        Tenés derecho a:
      </p>
      <ul>
        <li><strong>Acceder</strong> a tus datos personales que tenemos.</li>
        <li><strong>Rectificar</strong> datos incorrectos o desactualizados.</li>
        <li><strong>Solicitar la eliminación</strong> de tus datos (excepto los que debamos conservar por obligación legal).</li>
        <li><strong>Oponerte</strong> al uso de tus datos para marketing.</li>
      </ul>
      <p>
        Para ejercer estos derechos, escribinos a <strong>contacto.panfree@gmail.com</strong> o por WhatsApp al <strong>+595 984 589845</strong>.
      </p>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>5. Seguridad</h2>
      <p>
        Implementamos medidas técnicas y organizativas para proteger tus datos (cifrado SSL, accesos controlados, autenticación segura con Supabase).
      </p>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>6. Cookies</h2>
      <p>
        Usamos cookies esenciales para el funcionamiento del sitio (carrito, autenticación). No usamos cookies de seguimiento de terceros sin tu consentimiento.
      </p>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>7. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política ocasionalmente. Te notificaremos por email si hay cambios significativos.
      </p>

      <p style={{ marginTop: '2rem', color: '#555' }}>
        <strong>Contacto:</strong> PanFree · Encarnación, Paraguay · <strong>+595 984 589845</strong> · contacto.panfree@gmail.com
      </p>
    </div>
  )
}