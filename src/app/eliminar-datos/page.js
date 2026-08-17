/**
 * 📁 UBICACIÓN: src/app/eliminar-datos/page.js
 * 📅 ACTUALIZADO: 2026-08-16
 * 📌 DESCRIPCIÓN: Procedimiento para solicitar eliminación de datos personales.
 */

export default function EliminarDatos() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: '"Segoe UI", sans-serif', color: '#333', lineHeight: 1.7 }}>
      <h1 style={{ color: '#334c2b', fontSize: '2rem', borderBottom: '3px solid #b7996b', paddingBottom: '0.5rem' }}>
        Eliminación de Datos Personales
      </h1>
      <p style={{ fontSize: '0.95rem', color: '#555' }}>
        <strong>Última actualización:</strong> 16 de agosto de 2026
      </p>

      <p>
        En <strong>PanFree</strong> respetamos tu derecho a la privacidad. Si deseas que eliminemos tus datos personales, podés solicitarlo de forma sencilla.
      </p>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>¿Qué datos podemos eliminar?</h2>
      <ul>
        <li>Nombre completo</li>
        <li>Email</li>
        <li>Teléfono</li>
        <li>Dirección de entrega</li>
        <li>Historial de pedidos (excepto los que debamos conservar por obligaciones fiscales)</li>
        <li>Cuenta de usuario (si creaste una)</li>
      </ul>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>¿Qué datos NO podemos eliminar?</h2>
      <ul>
        <li><strong>Pedidos ya facturados:</strong> por obligaciones fiscales, debemos conservar registros de transacciones por al menos 5 años (según legislación paraguaya).</li>
        <li><strong>Datos anonimizados:</strong> estadísticas agregadas de ventas que no te identifican personalmente.</li>
      </ul>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>Procedimiento para solicitar la eliminación</h2>
      <ol>
        <li><strong>Envíanos un correo</strong> a <strong>contacto.panfree@gmail.com</strong> con el asunto <em>"Solicitud de eliminación de datos"</em>.</li>
        <li><strong>Incluye en el correo:</strong>
          <ul>
            <li>Tu nombre completo.</li>
            <li>El email asociado a tus pedidos o cuenta.</li>
            <li>Tu número de teléfono (para verificar identidad).</li>
          </ul>
        </li>
        <li><strong>También podés contactarnos por WhatsApp</strong> al <strong>+595 984 589845</strong> con la misma información.</li>
      </ol>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>Plazos</h2>
      <p>
        Procesaremos tu solicitud en un plazo máximo de <strong>10 días hábiles</strong>. Te confirmaremos por email una vez que la eliminación se haya completado.
      </p>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>Si creaste una cuenta en PanFree</h2>
      <p>
        Si tienes una cuenta con usuario y contraseña, la eliminación de tus datos incluirá el cierre de tu cuenta. No podrás acceder a tu historial de pedidos ni realizar seguimiento de pedidos anteriores.
      </p>

      <p style={{ marginTop: '2rem', backgroundColor: '#f9f6f1', padding: '1rem', borderRadius: '6px', borderLeft: '3px solid #b7996b' }}>
        <strong>Contacto:</strong> PanFree · Encarnación, Paraguay · <strong>+595 984 589845</strong> · contacto.panfree@gmail.com
      </p>
    </div>
  )
}