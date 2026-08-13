/**
📁 UBICACIÓN: src/app/admin/ayuda/maquinarias/page.js
📌 DESCRIPCIÓN: Guía de ayuda para la sección Maquinarias y Energía
📅 CREADO: 2026-03-05
*/
'use client'
import { useRouter } from 'next/navigation'

const S = {
  page    : { minHeight:'100vh', backgroundColor:'#f5f5f5', fontFamily:'"Segoe UI",sans-serif' },
  header  : { backgroundColor:'#334c2b', color:'#eee6d9', padding:'1rem 2rem', display:'flex', alignItems:'center', gap:'1rem', borderBottom:'3px solid #b7996b' },
  main    : { padding:'2rem', maxWidth:'860px', margin:'0 auto' },
  card    : { backgroundColor:'#fff', border:'2px solid #b7996b', borderRadius:'8px', padding:'1.75rem', marginBottom:'1.5rem' },
  titulo  : { color:'#334c2b', fontSize:'1.15rem', fontWeight:'700', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem' },
  subtit  : { color:'#334c2b', fontSize:'0.95rem', fontWeight:'700', margin:'1.25rem 0 0.5rem' },
  p       : { color:'#444', fontSize:'0.92rem', lineHeight:'1.65', margin:'0 0 0.6rem' },
  campo   : { backgroundColor:'#f9f6f1', border:'1px solid #e8ddd0', borderRadius:'6px', padding:'0.9rem 1rem', marginBottom:'0.75rem' },
  campoNom: { color:'#334c2b', fontWeight:'700', fontSize:'0.93rem', marginBottom:'0.3rem' },
  ejemplo : { backgroundColor:'#334c2b', color:'#eee6d9', borderRadius:'6px', padding:'0.75rem 1rem', fontSize:'0.87rem', lineHeight:'1.6', marginTop:'0.75rem' },
  alerta  : { backgroundColor:'#fff8e1', border:'1px solid #f9c74f', borderRadius:'6px', padding:'0.9rem 1rem', marginBottom:'0.75rem', fontSize:'0.9rem', color:'#5a4000' },
  exito   : { backgroundColor:'#e8f5e9', border:'1px solid #a5d6a7', borderRadius:'6px', padding:'0.9rem 1rem', marginBottom:'0.75rem', fontSize:'0.9rem', color:'#1b5e20' },
  info    : { backgroundColor:'#e3f2fd', border:'1px solid #90caf9', borderRadius:'6px', padding:'0.9rem 1rem', marginBottom:'0.75rem', fontSize:'0.9rem', color:'#1565c0' },
  btnGris : { backgroundColor:'#999', color:'#fff', border:'none', padding:'0.6rem 1.2rem', borderRadius:'4px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600', fontSize:'0.9rem' },
}

export default function AyudaMaquinarias() {
  const router = useRouter()
  return (
    <div style={S.page}>
      <header style={S.header}>
        <button onClick={() => router.push('/admin/maquinarias')} style={{ ...S.btnGris, padding:'0.4rem 0.8rem' }}>← Volver a Maquinarias</button>
        <h1 style={{ margin:0, fontSize:'1.2rem' }}>📖 Guía de Maquinarias — Cómo usar esta sección</h1>
      </header>

      <main style={S.main}>
        {/* Intro */}
        <div style={S.card}>
          <div style={S.titulo}>⚙️ ¿Para qué sirve la sección de Maquinarias?</div>
          <p style={S.p}>
            Esta sección te permite <strong>registrar todos los equipos eléctricos</strong> de tu panadería
            y calcular automáticamente cuánto te cuesta mantenerlos encendidos cada mes.
          </p>
          <p style={S.p}>
            Con esta información podés:
          </p>
          <ul style={{ color:'#444', fontSize:'0.92rem', lineHeight:'2', paddingLeft:'1.5rem', margin:0 }}>
            <li>💡 Saber exactamente cuánto gastás en energía por equipo</li>
            <li>📊 Identificar qué máquinas consumen más</li>
            <li>💰 Llevar ese costo a <strong>Costos Fijos → Servicios</strong> al cerrar el mes</li>
            <li>📈 Tomar decisiones sobre cuándo usar cada equipo para ahorrar</li>
          </ul>
        </div>

        {/* Tipos de equipos */}
        <div style={S.card}>
          <div style={S.titulo}>🔌 Dos tipos de consumo de energía</div>
          <p style={S.p}>
            El sistema diferencia dos tipos de equipos según cómo consumen energía:
          </p>

          <div style={S.campo}>
            <div style={S.campoNom}>🧊 Consumo Permanente (24/7)</div>
            <p style={{ ...S.p, margin:0 }}>
              Equipos que están <strong>siempre encendidos</strong>, todo el día, todos los días.
              El sistema calcula: <code>kW × 24 horas × 30 días × precio/kWh</code>
            </p>
            <div style={S.ejemplo}>
              <strong>Ejemplos:</strong> Heladera, Freezer, Cámara de frío <br/>
              <strong>Ejemplo de cálculo:</strong> Heladera 0.12 kW × 720 horas × ₲402 = <strong>₲ 34.733/mes</strong>
            </div>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>🔥 Consumo Activo (solo en producción)</div>
            <p style={{ ...S.p, margin:0 }}>
              Equipos que solo usás <strong>cuando producís</strong>. Tenés que indicar
              cuántas horas los usás por tanda y cuántas tandas hacés por mes.
              El sistema calcula: <code>kW × horas/tanda × tandas/mes × precio/kWh</code>
            </p>
            <div style={S.ejemplo}>
              <strong>Ejemplos:</strong> Horno, Amasadora, Batidora, Aire acondicionado <br/>
              <strong>Ejemplo de cálculo:</strong> Horno 2.67 kW × 1 hora × 20 tandas × ₲402 = <strong>₲ 21.467/mes</strong>
            </div>
          </div>
        </div>

        {/* Campos del formulario */}
        <div style={S.card}>
          <div style={S.titulo}>📝 Campos al registrar un equipo</div>

          <div style={S.campo}>
            <div style={S.campoNom}>Nombre *</div>
            <p style={{ ...S.p, margin:0 }}>
              El nombre del equipo. Sé específico para poder identificarlo después.
            </p>
            <div style={S.ejemplo}>
              <strong>Bien:</strong> "Horno Convector Santini MC-600", "Heladera Midea 203L" <br/>
              <strong>Evitar:</strong> "Horno", "Heladera" (muy genérico)
            </div>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>Descripción</div>
            <p style={{ ...S.p, margin:0 }}>
              Opcional. Podés copiar acá los datos de la etiqueta del equipo
              (modelo, potencia, año, etc.) para tener el historial.
            </p>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>Tipo de uso *</div>
            <p style={{ ...S.p, margin:0 }}>
              Elegí si el equipo es <strong>Activo</strong> (solo en producción) o <strong>Permanente</strong> (24/7).
              Esto afecta cómo se calcula el consumo.
            </p>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>⚡ Potencia (kW) *</div>
            <p style={{ ...S.p, margin:0 }}>
              La potencia eléctrica del equipo en <strong>kilowatts</strong>.
              Este dato está en la etiqueta del equipo o en el manual.
            </p>
            <div style={S.ejemplo}>
              <strong>¿Dónde buscarlo?</strong> Mirá la chapita o etiqueta del equipo.
              Dice algo como "2670W" o "2.67kW" o "220V~ 12A". <br/>
              <strong>Conversión:</strong> Si dice 2670W → dividí por 1000 = 2.67 kW
            </div>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>💡 Precio kWh (₲) *</div>
            <p style={{ ...S.p, margin:0 }}>
              Cuánto te cobra la ANDE por cada kilowatt-hora.
              <strong> Este valor se comparte entre todos los equipos.</strong>
            </p>
            <div style={S.ejemplo}>
              <strong>¿Dónde buscarlo?</strong> Mirá tu factura de la ANDE.
              Buscá "Precio unitario" o "Tarifa" por kWh. <br/>
              <strong>Ejemplo:</strong> ₲ 402 por kWh (tarifa comercial típica)
            </div>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>⏱️ Horas por tanda *</div>
            <p style={{ ...S.p, margin:0 }}>
              <strong>(Solo para equipos Activos)</strong> Cuántas horas usás el equipo en cada tanda de producción.
            </p>
            <div style={S.ejemplo}>
              Horno: 1 hora por tanda (incluye precalentamiento + cocción) <br/>
              Amasadora: 0.25 horas (15 minutos de amasado)
            </div>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>📅 Tandas por mes *</div>
            <p style={{ ...S.p, margin:0 }}>
              <strong>(Solo para equipos Activos)</strong> Cuántas tandas de producción hacés por mes en promedio.
            </p>
            <div style={S.ejemplo}>
              Si producís 5 veces por semana: 5 × 4.3 semanas = <strong>~22 tandas/mes</strong>
            </div>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>✅ Equipo activo</div>
            <p style={{ ...S.p, margin:0 }}>
              Si desmarcás esta opción, el equipo se considera <strong>inactivo</strong>:
              no se incluye en el cálculo del total mensual, pero sigue registrado
              por si lo volvés a usar después.
            </p>
          </div>
        </div>

        {/* Cómo encontrar la potencia */}
        <div style={S.card}>
          <div style={S.titulo}>🔍 ¿Cómo encontrar la potencia de un equipo?</div>
          <p style={S.p}>
            La potencia está en la <strong>etiqueta técnica</strong> del equipo. Buscá:
          </p>

          <div style={S.campo}>
            <div style={S.campoNom}>Opción 1: Etiqueta del fabricante</div>
            <p style={{ ...S.p, margin:0 }}>
              Usualmente está atrás, abajo o en un costado del equipo.
              Buscá "Potencia", "Power", "W", "kW" o "Watts".
            </p>
            <div style={S.ejemplo}>
              <strong>Ejemplo de etiqueta:</strong> <br/>
              "220-240V~ 50Hz 2670W" → Potencia = 2.67 kW <br/>
              "220V 12A" → Potencia = 220 × 12 = 2640W = 2.64 kW
            </div>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>Opción 2: Manual del usuario</div>
            <p style={{ ...S.p, margin:0 }}>
              Si tenés el manual, buscá la sección "Especificaciones técnicas"
              o "Datos eléctricos".
            </p>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>Opción 3: Modelo + Internet</div>
            <p style={{ ...S.p, margin:0 }}>
              Si no encontrás la etiqueta, buscá el modelo en Google.
              Ej: "Santini MC-600 especificaciones técnicas".
            </p>
          </div>

          <div style={S.alerta}>
            ⚠️ <strong>Importante:</strong> Si el equipo tiene motor (amasadora, batidora),
            la potencia del motor puede ser menor al consumo real.
            Si podés, medí con un medidor de consumo para mayor precisión.
          </div>
        </div>

        {/* Cómo calcular el consumo */}
        <div style={S.card}>
          <div style={S.titulo}>🧮 ¿Cómo se calcula el costo mensual?</div>
          <p style={S.p}>
            El sistema hace la cuenta automáticamente, pero es útil entender la fórmula:
          </p>

          <div style={S.campo}>
            <div style={S.campoNom}>🧊 Para equipos Permanentes</div>
            <div style={{ fontFamily:'monospace', fontSize:'0.85rem', backgroundColor:'#f5f5f5', padding:'0.5rem 0.75rem', borderRadius:'4px', marginBottom:'0.5rem' }}>
              Potencia (kW) × 24 horas × 30 días × Precio/kWh = Costo/mes
            </div>
            <div style={S.ejemplo}>
              <strong>Ejemplo — Heladera:</strong> <br/>
              0.12 kW × 24 hs × 30 días × ₲402 = <strong>₲ 34.733/mes</strong>
            </div>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>🔥 Para equipos Activos</div>
            <div style={{ fontFamily:'monospace', fontSize:'0.85rem', backgroundColor:'#f5f5f5', padding:'0.5rem 0.75rem', borderRadius:'4px', marginBottom:'0.5rem' }}>
              Potencia (kW) × Horas/tanda × Tandas/mes × Precio/kWh = Costo/mes
            </div>
            <div style={S.ejemplo}>
              <strong>Ejemplo — Horno:</strong> <br/>
              2.67 kW × 1 hora × 20 tandas × ₲402 = <strong>₲ 21.467/mes</strong>
            </div>
          </div>
        </div>

        {/* Actualizar precio kWh */}
        <div style={S.card}>
          <div style={S.titulo}>💡 Actualizar el precio del kWh</div>
          <p style={S.p}>
            Cuando cambia la tarifa de la ANDE, podés actualizar el precio del kWh
            para <strong>todos los equipos de una vez</strong>:
          </p>

          <div style={S.exito}>
            ✅ <strong>Pasos:</strong> <br/>
            1. Hacé clic en el botón "💡 Actualizar precio kWh" (arriba a la derecha) <br/>
            2. Ingresá el nuevo precio por kWh (ej: ₲450) <br/>
            3. Confirmá "Actualizar todas" <br/>
            4. El sistema recalcula automáticamente todos los costos mensuales
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>¿Cuándo actualizar?</div>
            <p style={{ ...S.p, margin:0 }}>
              Cada vez que recibís una factura de la ANDE con tarifa diferente,
              o al menos una vez cada 6 meses para mantener los costos actualizados.
            </p>
          </div>
        </div>

        {/* Cómo usar los resultados */}
        <div style={S.card}>
          <div style={S.titulo}>📊 ¿Qué hacer con el total calculado?</div>
          <p style={S.p}>
            El banner verde de arriba muestra el <strong>total mensual de energía</strong>
            de todos tus equipos. Este valor lo usás en Costos Fijos:
          </p>

          <div style={S.exito}>
            ✅ <strong>Flujo recomendado:</strong> <br/>
            1. Registrá todos tus equipos en Maquinarias <br/>
            2. Verificá que los datos de potencia y uso sean correctos <br/>
            3. Al final del mes, anotá el total que muestra el banner verde <br/>
            4. Andá a <strong>Costos Fijos → Servicios</strong> <br/>
            5. Cargá ese monto como "Energía eléctrica" del mes <br/>
            6. El sistema distribuye ese costo entre tus productos
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>Ejemplo de flujo mensual</div>
            <p style={{ ...S.p, margin:0 }}>
              <strong>Total energía calculado:</strong> ₲ 210.890/mes <br/>
              <strong>En Costos Fijos cargás:</strong> Energía eléctrica = ₲ 210.890 <br/>
              <strong>Si producís 20 lotes/mes:</strong> ₲ 210.890 ÷ 20 = ₲ 10.545 por lote
            </p>
          </div>
        </div>

        {/* Consejos para ahorrar */}
        <div style={S.card}>
          <div style={S.titulo}>💡 Consejos para reducir el consumo</div>
          <p style={S.p}>
            Algunas prácticas que pueden ayudarte a ahorrar energía:
          </p>

          <ul style={{ color:'#444', fontSize:'0.92rem', lineHeight:'2', paddingLeft:'1.5rem', margin:0 }}>
            <li>🔥 <strong>Horno:</strong> Agrupá productos que requieren la misma temperatura. Evitá abrir la puerta durante la cocción.</li>
            <li>🧊 <strong>Heladeras:</strong> Mantené las gomas de las puertas en buen estado. No las abrás innecesariamente.</li>
            <li>⏱️ <strong>Producción:</strong> Planificá tandas completas para maximizar el uso del horno por encendido.</li>
            <li>🌡️ <strong>Aire acondicionado:</strong> Usalo solo cuando sea necesario. Mantené los filtros limpios.</li>
            <li>🔌 <strong>Equipos en standby:</strong> Desconectá equipos que no se usan (batidoras, balanzas) al final del día.</li>
          </ul>
        </div>

        {/* Preguntas frecuentes */}
        <div style={S.card}>
          <div style={S.titulo}>❓ Preguntas frecuentes</div>

          <div style={S.campo}>
            <div style={S.campoNom}>¿Qué pasa si desmarco "Equipo activo"?</div>
            <p style={{ ...S.p, margin:0 }}>
              El equipo queda registrado pero <strong>no se incluye en el cálculo del total mensual</strong>.
              Es útil si dejaste de usar un equipo temporalmente pero querés mantener el registro.
            </p>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>¿Puedo tener varios equipos del mismo tipo?</div>
            <p style={{ ...S.p, margin:0 }}>
              <strong>Sí.</strong> Por ejemplo, podés registrar "Heladera 1", "Heladera 2", etc.
              Cada uno se calcula por separado y se suman al total.
            </p>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>¿El cálculo incluye otros costos de energía?</div>
            <p style={{ ...S.p, margin:0 }}>
              <strong>No.</strong> Este cálculo es solo para los equipos registrados.
              Si tenés iluminación, enchufes generales u otros consumos,
              estimá un monto adicional y sumalo al cargar en Costos Fijos.
            </p>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>¿Qué hago si no encuentro la potencia de un equipo?</div>
            <p style={{ ...S.p, margin:0 }}>
              Podés usar una <strong>estimación conservadora</strong> basada en equipos similares.
              Por ejemplo: Heladera pequeña ~0.1 kW, Horno mediano ~2.5 kW,
              Amasadora ~0.5 kW. Después actualizá cuando consigas el dato exacto.
            </p>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>¿Cada cuánto debo revisar los datos?</div>
            <p style={{ ...S.p, margin:0 }}>
              <strong>Recomendado:</strong> Una vez cada 6 meses, o cuando:
              <br/>• Cambia la tarifa de la ANDE
              <br/>• Comprás o vendés un equipo
              <br/>• Cambiás tu frecuencia de producción
            </p>
          </div>
        </div>

        <div style={{ textAlign:'center', paddingBottom:'2rem' }}>
          <button onClick={() => router.push('/admin/maquinarias')} style={{ backgroundColor:'#f46e15', color:'#fff', border:'none', padding:'0.8rem 2rem', borderRadius:'4px', cursor:'pointer', fontFamily:'inherit', fontWeight:'700', fontSize:'1rem' }}>
            ✅ Entendido — Ir a Maquinarias
          </button>
        </div>
      </main>
    </div>
  )
}