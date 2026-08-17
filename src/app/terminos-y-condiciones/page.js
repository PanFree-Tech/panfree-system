/**
 * 📁 UBICACIÓN: src/app/terminos-y-condiciones/page.js
 * 📅 CREADO: 2026-08-16
 * 📌 DESCRIPCIÓN: Términos y condiciones de compra de PanFree.
 *  - ✅ AGREGADO: sección de Certificación Oficial SIN GLUTEN (Ley 3109/2006, Decreto 7553/2022)
 */

export default function TerminosCondiciones() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: '"Segoe UI", sans-serif', color: '#333', lineHeight: 1.7 }}>
      <h1 style={{ color: '#334c2b', fontSize: '2rem', borderBottom: '3px solid #b7996b', paddingBottom: '0.5rem' }}>
        Términos y Condiciones
      </h1>
      <p style={{ fontSize: '0.95rem', color: '#555' }}>
        <strong>Última actualización:</strong> 16 de agosto de 2026
      </p>

      <p>
        Bienvenido a <strong>PanFree</strong>. Al realizar un pedido en nuestra tienda online, aceptás los siguientes términos y condiciones.
      </p>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>1. Productos</h2>
      <ul>
        <li>Todos nuestros productos son <strong>100% libres de gluten</strong> y elaborados en nuestra cocina artesanal en Encarnación.</li>
        <li>Los productos se fabrican por pedido, por lo que requerimos <strong>24 a 48 horas</strong> de anticipación para su preparación.</li>
        <li>Las imágenes son ilustrativas; el producto final puede variar ligeramente en decoración o presentación.</li>
      </ul>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>2. Precios y pagos</h2>
      <ul>
        <li>Los precios están en <strong>Guaraníes (₲)</strong> e incluyen impuestos.</li>
        <li>Aceptamos <strong>transferencia bancaria</strong> (Ueno Bank) y <strong>efectivo al entregar</strong>.</li>
        <li>Para transferencias, el pedido se confirma al recibir el comprobante de pago.</li>
      </ul>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>3. Envíos</h2>
      <ul>
        <li><strong>Cobertura:</strong> Encarnación y Gran Encarnación (Cambyretá, Capitán Miranda, San Juan del Paraná).</li>
        <li><strong>Costo:</strong> según la zona seleccionada en el checkout.</li>
        <li><strong>Envío gratis:</strong> en compras superiores a ₲ 50.000.</li>
        <li>El tiempo de entrega estimado es de <strong>24 a 48 horas</strong> después de confirmado el pedido.</li>
      </ul>

      {/* NUEVA SECCIÓN: Certificación Oficial */}
      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>
        🏅 Certificación Oficial SIN GLUTEN
      </h2>
      <p>
        PanFree cumple con los requisitos establecidos por la <strong>Ley N° 3109/2006</strong> y su actualización <strong>Ley N° 6072/2018</strong>, que adoptan el símbolo nacional SIN GLUTEN de Paraguay, oficializado mediante el <strong>Decreto 7553/2022</strong>.
      </p>
      <p>
        Nuestros productos están elaborados bajo estrictos estándares de seguridad para celíacos, y utilizamos el símbolo oficial reconocido por el Estado Paraguayo.
      </p>
      <p>
        Para más información sobre el símbolo nacional SIN GLUTEN, visitá el portal de la{' '}
        <a
          href="https://www.dinapi.gov.py/portal/v3/noticias/detalle-noticia?idNoticia=261"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#f46e15', fontWeight: 600, textDecoration: 'none' }}
        >
          DINAPI
        </a>.
      </p>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>4. Devoluciones y cambios</h2>
      <ul>
        <li>Si el producto no cumple con tus expectativas, contactanos dentro de las <strong>24 horas</strong> de recibido.</li>
        <li>Debido a que son productos perecederos, no aceptamos devoluciones por cambio de opinión.</li>
        <li>Si el producto llega en mal estado, te reembolsaremos o repondremos el pedido sin costo adicional.</li>
      </ul>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>5. Responsabilidad del cliente</h2>
      <ul>
        <li>Es responsabilidad del cliente proporcionar una <strong>dirección de entrega correcta</strong> y estar disponible para recibir el pedido.</li>
        <li>En caso de ausencia, se coordinará una nueva entrega con costo adicional.</li>
      </ul>

      <h2 style={{ color: '#334c2b', fontSize: '1.3rem', marginTop: '2rem' }}>6. Modificaciones</h2>
      <p>
        PanFree se reserva el derecho de actualizar estos términos en cualquier momento. Te notificaremos por email si hay cambios significativos.
      </p>

      <p style={{ marginTop: '2rem', backgroundColor: '#f9f6f1', padding: '1rem', borderRadius: '6px', borderLeft: '3px solid #b7996b' }}>
        <strong>Contacto:</strong> PanFree · Encarnación, Paraguay · <strong>+595 984 589845</strong> · contacto.panfree@gmail.com
      </p>
    </div>
  )
}