/**
📁 UBICACIÓN: src/app/admin/ayuda/recetas/page.js
📌 DESCRIPCIÓN: Guía de ayuda para la sección Recetas
📅 ACTUALIZADO: 2026-03-05 — Sistema por PESO (kg)
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
  btnGris : { backgroundColor:'#999', color:'#fff', border:'none', padding:'0.6rem 1.2rem', borderRadius:'4px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600', fontSize:'0.9rem' },
}

export default function AyudaRecetas() {
  const router = useRouter()
  return (
    <div style={S.page}>
      <header style={S.header}>
        <button onClick={() => router.push('/admin/recetas')} style={{ ...S.btnGris, padding:'0.4rem 0.8rem' }}>← Volver a Recetas</button>
        <h1 style={{ margin:0, fontSize:'1.2rem' }}>📖 Guía de Recetas — Cómo usar esta sección</h1>
      </header>

      <main style={S.main}>
        {/* Intro */}
        <div style={S.card}>
          <div style={S.titulo}>🍞 ¿Para qué sirve la sección de Recetas?</div>
          <p style={S.p}>
            Esta sección es el <strong>corazón del sistema de costos</strong> de PanFree.
            Acá cargás exactamente qué ingredientes usás para hacer cada producto y en qué cantidades.
          </p>
          <p style={S.p}>
            Con esa información, el sistema calcula <strong>automáticamente</strong>:
          </p>
          <ul style={{ color:'#444', fontSize:'0.92rem', lineHeight:'2', paddingLeft:'1.5rem', margin:0 }}>
            <li>💰 Cuánto te cuesta fabricar <strong>cada kilogramo</strong> de producto</li>
            <li>📊 Cuál es tu margen de ganancia real</li>
            <li>🏷️ A qué precio deberías vender para ganar bien</li>
            <li>📈 Qué productos son rentables y cuáles te generan pérdida</li>
          </ul>
        </div>

        {/* Campo clave: rendimiento en KG */}
        <div style={S.card}>
          <div style={S.titulo}>⚖️ El campo MÁS IMPORTANTE: Rendimiento (kg)</div>

          <div style={S.alerta}>
            ⚠️ <strong>¡Atención!</strong> Este es el campo que más afecta el cálculo del costo.
            Si está mal, todos los precios sugeridos van a estar mal.
          </div>

          <p style={S.p}>
            <strong>"Rendimiento"</strong> significa: <em>¿cuánto pesa el producto terminado que obtenés de UNA tanda de esta receta?</em>
          </p>
          <p style={S.p}>
            Los ingredientes que cargás en la receta son los que usás <strong>en una sola preparación (tanda)</strong>.
            El sistema divide el costo total de esa tanda por el peso obtenido (en kg) para saber cuánto cuesta cada kilogramo.
          </p>

          <div style={S.ejemplo}>
            <strong>Ejemplo — Chipa Tradicional:</strong> <br/>
            📦 Ingredientes de UNA tanda (lo que cargás en la receta): <br/>
            &nbsp; &nbsp;• 500g de Almidón de Mandioca <br/>
            &nbsp; &nbsp;• 170g de Queso Paraguay <br/>
            &nbsp; &nbsp;• 85g de Manteca de Cerdo <br/>
            &nbsp; &nbsp;• 1 huevo... etc. <br/> <br/>
            💰 Costo total de esa tanda: ₲ 15.185 <br/>
            ⚖️ Rendimiento: <strong>1.200 kg</strong> (pesás toda la masa horneada) <br/>
            ✅ Costo por kg: ₲ 15.185 ÷ 1.200 = <strong>₲ 12.654 por kg</strong>
          </div>

          <div style={{ ...S.exito, marginTop:'0.75rem' }}>
            ✅ <strong>¿Cómo medir el rendimiento?</strong> Es muy simple:
            <br/>1. Hacé la receta completa como siempre
            <br/>2. Una vez listo el producto, pesalo TODO junto en una balanza
            <br/>3. Anotá ese peso en kg (ej: 1.200 kg, 2.500 kg, 0.850 kg)
            <br/>4. Ese número va en el campo "Rendimiento (kg)"
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>📝 Consejos para medir bien el rendimiento</div>
            <ul style={{ ...S.p, margin:0, paddingLeft:'1.5rem' }}>
              <li>Usá siempre la misma balanza para ser consistente</li>
              <li>Pesá el producto <strong>ya horneado</strong>, no la masa cruda (hay merma en el horno)</li>
              <li>Si hacés múltiples bandejas, pesá todo junto</li>
              <li>Redondeá a 3 decimales (ej: 1.250 kg, no 1.25 kg)</li>
              <li>Si el producto se vende por unidad, podés pesar 10 unidades y dividir por 10 para saber el peso promedio</li>
            </ul>
          </div>
        </div>

        {/* Tiempos */}
        <div style={S.card}>
          <div style={S.titulo}>⏱️ Tiempos de elaboración</div>
          <p style={S.p}>
            Estos campos no afectan el cálculo de costos pero son muy útiles para <strong>planificar la producción</strong>
            — saber cuánto tiempo lleva hacer cada producto y organizar el día de trabajo.
          </p>

          <div style={S.campo}>
            <div style={S.campoNom}>⏱️ Preparación (minutos)</div>
            <p style={{ ...S.p, margin:0 }}>
              El tiempo que tardás en juntar, pesar y mezclar los ingredientes hasta tener la masa lista para hornear.
              No incluye el tiempo en el horno.
            </p>
            <div style={S.ejemplo}>Ejemplo — Chipa: preparación = <strong>20 min</strong> (pesar y mezclar todo)</div>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>🔥 Cocción (minutos)</div>
            <p style={{ ...S.p, margin:0 }}>
              El tiempo que está en el horno o en cocción. Es el tiempo desde que entra al horno hasta que sale.
            </p>
            <div style={S.ejemplo}>Ejemplo — Chipa: cocción = <strong>25 min</strong> a 200°C</div>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>❄️ Reposo (minutos)</div>
            <p style={{ ...S.p, margin:0 }}>
              El tiempo que hay que esperar después de sacar del horno antes de empacar o vender.
              Incluye enfriado, leudado en frío, o cualquier tiempo de espera.
            </p>
            <div style={S.ejemplo}>Ejemplo — Pan: reposo = <strong>30 min</strong> (enfriado antes de cortar)</div>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>🌡️ Temperatura del horno (°C)</div>
            <p style={{ ...S.p, margin:0 }}>
              La temperatura en grados Celsius a la que se hornea. Sirve como recordatorio para el operario
              y para estandarizar la producción.
            </p>
            <div style={S.ejemplo}>Ejemplo: <strong>180°C</strong> para muffins, <strong>200°C</strong> para chipas</div>
          </div>
        </div>

        {/* Dificultad */}
        <div style={S.card}>
          <div style={S.titulo}>⭐ Nivel de dificultad</div>
          <p style={S.p}>Indica qué tan compleja es la elaboración del producto. Útil para asignar tareas al personal.</p>
          <div style={S.campo}>
            <div style={S.campoNom}>🟢 Fácil</div>
            <p style={{ ...S.p, margin:0 }}>Receta simple, pocos pasos, cualquier ayudante puede hacerla. <br/>
            Ejemplo: Masa para chipa (solo mezclar), galletitas simples.</p>
          </div>
          <div style={S.campo}>
            <div style={S.campoNom}>🟡 Media</div>
            <p style={{ ...S.p, margin:0 }}>Requiere atención y técnica básica. Ideal para alguien con experiencia. <br/>
            Ejemplo: Muffins, pan de miga.</p>
          </div>
          <div style={S.campo}>
            <div style={S.campoNom}>🔴 Avanzada</div>
            <p style={{ ...S.p, margin:0 }}>Requiere técnica específica o mucha experiencia. Solo para el operario principal. <br/>
            Ejemplo: Facturas hojaldradas, pan dulce con frutas.</p>
          </div>
        </div>

        {/* Notas de producción */}
        <div style={S.card}>
          <div style={S.titulo}>📝 Notas de producción</div>
          <p style={S.p}>
            Un espacio libre para escribir instrucciones importantes que no queden en el olvido.
            Estas notas las ve cualquier persona que abra la receta en el sistema.
          </p>
          <div style={S.ejemplo}>
            <strong>Ejemplos de buenas notas:</strong> <br/>
            • "No abrir el horno en los primeros 15 minutos o el pan se baja." <br/>
            • "El queso paraguay debe estar bien frío para rallar mejor." <br/>
            • "Amasar mínimo 10 minutos hasta que la masa no se pegue en las manos." <br/>
            • "Si el día está muy húmedo, reducir el agua en 20ml." <br/>
            • "Sacar la manteca de la heladera 30 minutos antes de empezar."
          </div>
        </div>

        {/* Ingredientes */}
        <div style={S.card}>
          <div style={S.titulo}>🌾 Cómo cargar los ingredientes</div>

          <div style={S.alerta}>
            ⚠️ <strong>Regla de oro:</strong> Los ingredientes que cargás son los de <strong>UNA sola tanda</strong>,
            no de toda la semana ni de todo el mes. Solo lo que usás en una preparación.
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>Insumo</div>
            <p style={{ ...S.p, margin:0 }}>
              Seleccioná el ingrediente de la lista. El precio que aparece entre paréntesis
              es el <strong>Precio Promedio Ponderado (PPP)</strong> — el precio real que pagaste en tus compras.
            </p>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>Cantidad</div>
            <p style={{ ...S.p, margin:0 }}>
              Cuánto usás de ese ingrediente en UNA tanda. Usá decimales para fracciones.
            </p>
            <div style={S.ejemplo}>
              Si usás 500 gramos → escribí <strong>0.500</strong> (con unidad: kg) <br/>
              Si usás 250 ml → escribí <strong>0.250</strong> (con unidad: lt) <br/>
              Si usás 2 huevos → escribí <strong>2</strong> (con unidad: unidad) <br/>
              Si usás 100g → podés escribir <strong>100</strong> (con unidad: g) o <strong>0.100</strong> (con unidad: kg)
            </div>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>Unidad de medida</div>
            <p style={{ ...S.p, margin:0 }}>
              Tiene que coincidir con la unidad en que pesás ese ingrediente.
              Lo más fácil es usar <strong>kg</strong> para todo lo sólido y <strong>lt</strong> para líquidos,
              así el sistema calcula bien con los precios que están cargados por kg o litro.
            </p>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>⭕ Ingrediente opcional</div>
            <p style={{ ...S.p, margin:0 }}>
              Marcá esta opción para ingredientes que a veces se usan y a veces no
              (por ejemplo: frutas abrillantadas en pan dulce, chips de chocolate en galletitas).
              Los ingredientes opcionales <strong>no se cuentan en el costo base</strong> del producto.
            </p>
          </div>

          <div style={S.campo}>
            <div style={S.campoNom}>Nota del ingrediente</div>
            <p style={{ ...S.p, margin:0 }}>
              Un comentario corto sobre ese ingrediente específico.
            </p>
            <div style={S.ejemplo}>
              Ejemplos: "tamizado dos veces" / "a temperatura ambiente" / "derretida" / "bien fría"
            </div>
          </div>
        </div>

        {/* Colores de margen */}
        <div style={S.card}>
          <div style={S.titulo}>🎨 ¿Qué significan los colores de margen?</div>
          <p style={S.p}>
            El sistema muestra automáticamente si el precio de venta actual es rentable o no,
            comparando con el costo real de fabricación <strong>por kilogramo</strong>.
          </p>
          <div style={S.campo}>
            <div style={{ ...S.campoNom, color:'#2e7d32' }}>✅ Verde — Buen margen (40% o más)</div>
            <p style={{ ...S.p, margin:0 }}>El precio de venta cubre bien los costos y queda ganancia real. ¡Ideal!</p>
          </div>
          <div style={S.campo}>
            <div style={{ ...S.campoNom, color:'#f46e15' }}>⚠️ Naranja — Margen ajustado (20% a 40%)</div>
            <p style={{ ...S.p, margin:0 }}>
              Hay ganancia pero es poca. Puede estar bien para productos de alta rotación,
              pero hay que revisar si los costos fijos están cubiertos.
            </p>
          </div>
          <div style={S.campo}>
            <div style={{ ...S.campoNom, color:'#c62828' }}>🔴 Rojo — Pérdida (menos de 20%)</div>
            <p style={{ ...S.p, margin:0 }}>
              El producto se está vendiendo por debajo del costo o con muy poca ganancia.
              Hay que subir el precio o revisar la receta para reducir costos.
            </p>
          </div>

          <div style={{ ...S.alerta, marginTop:'0.75rem' }}>
            💡 <strong>Importante:</strong> Estos cálculos son solo de <em>materia prima</em>. Todavía no incluyen
            los costos fijos (alquiler, luz, gas, salarios). Eso se configura en la sección <strong>Costos</strong>.
            Por eso necesitás un margen de al menos 40% para que el negocio sea realmente rentable.
          </div>
        </div>

        {/* Precios sugeridos */}
        <div style={S.card}>
          <div style={S.titulo}>🏷️ Precios sugeridos — ¿Cuál elegir?</div>
          <p style={S.p}>El sistema calcula tres precios sugeridos según el margen que querés obtener <em>sobre el costo de materia prima</em>:</p>
          <div style={S.campo}>
            <div style={S.campoNom}>Competitivo — 20% de margen</div>
            <p style={{ ...S.p, margin:0 }}>
              El precio mínimo para no perder dinero en materia prima. <strong>No recomendado</strong> como precio final
              porque no cubre los costos fijos. Solo es útil para comparar con la competencia.
            </p>
          </div>
          <div style={S.campo}>
            <div style={{ ...S.campoNom, color:'#f46e15' }}>🎯 Objetivo — 40% de margen (recomendado)</div>
            <p style={{ ...S.p, margin:0 }}>
              El precio equilibrado. Cubre la materia prima con margen suficiente para también cubrir
              los costos fijos (alquiler, luz, gas) y dejar ganancia neta.
              <strong> Este es el precio de referencia principal.</strong>
            </p>
          </div>
          <div style={S.campo}>
            <div style={{ ...S.campoNom, color:'#b7996b' }}>💎 Premium — 60% de margen</div>
            <p style={{ ...S.p, margin:0 }}>
              Para productos especiales, de nicho, o cuando hay poca competencia y el cliente valora la calidad.
              PanFree vende productos sin gluten — <strong>este precio es completamente válido</strong> para productos premium.
            </p>
          </div>
        </div>

        <div style={{ textAlign:'center', paddingBottom:'2rem' }}>
          <button onClick={() => router.push('/admin/recetas')} style={{ backgroundColor:'#f46e15', color:'#fff', border:'none', padding:'0.8rem 2rem', borderRadius:'4px', cursor:'pointer', fontFamily:'inherit', fontWeight:'700', fontSize:'1rem' }}>
            ✅ Entendido — Ir a cargar recetas
          </button>
        </div>
      </main>
    </div>
  )
}