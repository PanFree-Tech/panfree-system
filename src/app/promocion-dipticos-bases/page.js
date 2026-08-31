// src/app/promocion-dipticos-bases/page.js
import Link from 'next/link'

export default function PromocionDipticosBases() {
  return (
    <div className="min-h-screen bg-[#fcfaf7] py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        {/* Encabezado */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#334c2b] mb-2">
            Bases y Condiciones
          </h1>
          <p className="text-gray-500 text-sm">
            Promoción "Códigos Dípticos PanFree"
          </p>
          <div className="w-16 h-1 bg-[#f46e15] mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Fecha de vigencia */}
        <div className="bg-[#f5f1eb] rounded-xl p-4 mb-8 text-center text-sm text-gray-600">
          <span className="font-semibold">Vigencia:</span> 01 de septiembre de 2026 al 31 de diciembre de 2026
        </div>

        {/* Contenido de Bases y Condiciones */}
        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          {/* 1. DATOS DE LA EMPRESA PROMOTORA */}
          <section>
            <h2 className="text-lg font-semibold text-[#334c2b] mb-2">1. Datos de la empresa promotora</h2>
            <div className="bg-[#fcfaf7] p-4 rounded-xl border border-gray-100 text-sm">
              <p><strong>Nombre:</strong> PanFree (Panificados Sin Gluten)</p>
              <p><strong>RUC:</strong> [Completar con el RUC de la empresa]</p>
              <p><strong>Dirección:</strong> [Completar con la dirección física]</p>
              <p><strong>Teléfono/WhatsApp:</strong> +595 984 589845</p>
              <p><strong>Correo electrónico:</strong> contacto@panfree.fit</p>
            </div>
          </section>

          {/* 2. VIGENCIA */}
          <section>
            <h2 className="text-lg font-semibold text-[#334c2b] mb-2">2. Vigencia</h2>
            <p>La presente promoción se encuentra vigente desde el <strong>01 de septiembre de 2026</strong> hasta el <strong>31 de diciembre de 2026</strong>, o hasta agotar stock de códigos disponibles.</p>
          </section>

          {/* 3. PARTICIPANTES */}
          <section>
            <h2 className="text-lg font-semibold text-[#334c2b] mb-2">3. Participantes</h2>
            <p>Podrán participar todas las personas físicas mayores de 18 años que:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Sean clientes registrados en la plataforma PanFree.</li>
              <li>Posean un código QR válido asignado en el marco de esta promoción.</li>
            </ul>
          </section>

          {/* 4. MECÁNICA DE PARTICIPACIÓN */}
          <section>
            <h2 className="text-lg font-semibold text-[#334c2b] mb-2">4. Mecánica de participación</h2>
            <ul className="list-decimal list-inside ml-4 space-y-1">
              <li>Cada díptico contiene un <strong>código QR único</strong> e irrepetible.</li>
              <li>El participante deberá escanear el código QR con su dispositivo móvil, lo que lo dirigirá a la página web <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">https://panfree.fit/diptico/[código]</code>.</li>
              <li>En dicha página, el participante deberá iniciar sesión en su cuenta PanFree y hacer clic en el botón <strong>"Canjear mi premio"</strong>.</li>
              <li>Al hacerlo, el código se marcará como <strong>"canjeado"</strong> en nuestro sistema y no podrá volver a utilizarse.</li>
            </ul>
          </section>

          {/* 5. PREMIOS Y BENEFICIOS */}
          <section>
            <h2 className="text-lg font-semibold text-[#334c2b] mb-2">5. Premios y beneficios</h2>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Por cada código QR válido canjeado, el participante recibirá <strong>50 (cincuenta) puntos PanFree</strong> acreditados en su cuenta de usuario.</li>
              <li>Los puntos acumulados podrán ser canjeados por productos, descuentos o beneficios exclusivos disponibles en el <strong>Catálogo de Premios</strong> de PanFree.</li>
              <li>Los premios no son acumulables con otras promociones vigentes.</li>
              <li>Los puntos no tienen valor monetario y no pueden ser cambiados por dinero en efectivo.</li>
            </ul>
          </section>

          {/* 6. LIMITACIONES Y EXCLUSIONES */}
          <section>
            <h2 className="text-lg font-semibold text-[#334c2b] mb-2">6. Limitaciones y exclusiones</h2>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Cada código QR es <strong>válido por un solo uso</strong>.</li>
              <li>No se permite el uso de códigos duplicados, alterados o falsificados.</li>
              <li>PanFree se reserva el derecho de suspender o cancelar la participación de cualquier usuario que intente utilizar medios fraudulentos para obtener puntos.</li>
              <li>Los puntos tienen una validez de <strong>6 (seis) meses</strong> a partir de su fecha de acreditación.</li>
            </ul>
          </section>

          {/* 7. TRATAMIENTO DE DATOS PERSONALES */}
          <section>
            <h2 className="text-lg font-semibold text-[#334c2b] mb-2">7. Tratamiento de datos personales</h2>
            <p>Los datos personales proporcionados por los participantes serán tratados conforme a nuestra Política de Privacidad, disponible en <Link href="/politica-privacidad" className="text-[#f46e15] hover:underline">este enlace</Link>. Los participantes autorizan a PanFree a utilizar sus datos para la gestión de la promoción y comunicaciones comerciales relacionadas.</p>
          </section>

          {/* 8. ACEPTACIÓN DE LAS BASES */}
          <section>
            <h2 className="text-lg font-semibold text-[#334c2b] mb-2">8. Aceptación de las bases</h2>
            <p>La participación en esta promoción implica la <strong>aceptación total e incondicional</strong> de las presentes Bases y Condiciones. Cualquier situación no prevista será resuelta por PanFree en un plazo razonable y de manera transparente.</p>
          </section>

          {/* 9. CONTACTO Y CONSULTAS */}
          <section>
            <h2 className="text-lg font-semibold text-[#334c2b] mb-2">9. Contacto y consultas</h2>
            <div className="bg-[#fcfaf7] p-4 rounded-xl border border-gray-100 text-sm">
              <p>Para consultas, reclamos o mayor información, los participantes podrán comunicarse a través de:</p>
              <p><strong>WhatsApp:</strong> +595 984 589845</p>
              <p><strong>Correo electrónico:</strong> contacto@panfree.fit</p>
            </div>
          </section>
        </div>

        {/* Botón de acción */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-block bg-[#f46e15] hover:bg-[#e05d0a] text-white font-semibold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
          >
            Volver a la tienda
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>© 2026 PanFree - Panificados Sin Gluten. Todos los derechos reservados.</p>
          <p className="mt-1">Encarnación, Paraguay</p>
        </div>
      </div>
    </div>
  )
}
