/**
📁 UBICACIÓN: src/app/admin/ayuda/costos/page.js
📌 DESCRIPCIÓN: Guía de ayuda para la sección Costos y Márgenes
📅 ACTUALIZADO: 2026-03-05 — Sistema por PESO (kg) + Plantilla Rodante
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
export default function AyudaCostos() {
const router = useRouter()
return (
<div style={S.page}>
<header style={S.header}>
<button onClick={() => router.push('/admin/costos')} style={{ ...S.btnGris, padding:'0.4rem 0.8rem' }}>← Volver a Costos</button>
<h1 style={{ margin:0, fontSize:'1.2rem' }}>📖 Guía de Costos — Cómo usar esta sección</h1>
</header>

<main style={S.main} >
    {/* Intro */}
     <div style={S.card} >
       <div style={S.titulo} >💰 ¿Para qué sirve la sección de Costos? </div >
       <p style={S.p} >
        Esta sección te muestra  <strong >el análisis completo de rentabilidad </strong > de todos tus productos.
        Acá podés ver rápidamente qué productos te dan ganancia y cuáles te están haciendo perder dinero.
       </p >
       <p style={S.p} >
        El sistema toma la información de  <strong >Recetas </strong > (ingredientes y cantidades) y  <strong >Productos </strong > (precios de venta)
        para calcular automáticamente:
       </p >
       <ul style={{ color:'#444', fontSize:'0.92rem', lineHeight:'2', paddingLeft:'1.5rem', margin:0 }} >
         <li >📊 Cuánto te cuesta fabricar  <strong >cada kilogramo </strong > </li >
         <li >💵 Cuánto ganás por kg vendido (margen bruto) </li >
         <li >📈 Qué porcentaje de ganancia tenés sobre el costo </li >
         <li >🏷️ Tres precios sugeridos según la estrategia que quieras </li >
       </ul >
     </div >

    {/* ═══════════════════════════════════════════════════════════════════
        NUEVO: Plantilla Rodante — Copiar mes anterior
    ═══════════════════════════════════════════════════════════════════ */}
     <div style={S.card} >
       <div style={S.titulo} >📋 Plantilla Rodante — Copiar mes anterior</div >
       <p style={S.p} >
        Para ahorrar tiempo en la carga mensual de costos fijos, el sistema incluye una función de 
        <strong > "plantilla rodante" </strong > (como usan Odoo, QuickBooks y Tango para pymes).
       </p >

       <div style={S.info} >
        <strong >🆕 ¿Qué es la plantilla rodante? </strong >  <br/ >
        En lugar de cargar todos los costos desde cero cada mes, podés copiar los valores del mes anterior 
        y solo editar lo que cambió (luz, gas, marketing, etc.). Esto reduce el tiempo de carga en 80%.
       </div >

       <div style={S.exito} >
        ✅  <strong >¿Cómo usarla? </strong >  <br/ >
        1. Andá a la pestaña  <strong >🏗️ Costos Fijos </strong >  <br/ >
        2. Hacé clic en  <strong >"+ Cargar mes" </strong >  <br/ >
        3. Si hay un mes anterior cargado, verás un  <strong >banner azul </strong > arriba del formulario  <br/ >
        4. Hacé clic en  <strong >"📄 Copiar mes anterior" </strong >  <br/ >
        5. El formulario se completa automáticamente con los valores del mes pasado  <br/ >
        6. Editá solo los campos que cambiaron (ej: subió el gas, nueva campaña de marketing)  <br/ >
        7. Guardá el nuevo mes
       </div >

       <div style={S.campo} >
         <div style={S.campoNom} >📊 ¿Qué campos suelen cambiar mes a mes? </div >
         <ul style={{ margin:'0.5rem 0 0', paddingLeft:'1.5rem', color:'#444', fontSize:'0.9rem', lineHeight:'1.8' }} >
           <li > <strong >💡 Servicios </strong > — Luz, agua, gas (fluctúan según producción y estación) </li >
           <li > <strong >📣 Marketing </strong > — Variable según campañas activas </li >
           <li > <strong >📦 Otros </strong > — Gastos eventuales no categorizados </li >
         </ul >
       </div >

       <div style={S.campo} >
         <div style={S.campoNom} >📊 ¿Qué campos raramente cambian? </div >
         <ul style={{ margin:'0.5rem 0 0', paddingLeft:'1.5rem', color:'#444', fontSize:'0.9rem', lineHeight:'1.8' }} >
           <li > <strong >🏠 Alquiler </strong > — Solo con aumento contractual anual </li >
           <li > <strong >👷 Salarios </strong > — Solo con ajustes anuales o nuevos empleados </li >
           <li > <strong >💻 Software </strong > — Precio fijo anual (Suscripciones) </li >
           <li > <strong >⚙️ Depreciación </strong > — Siempre igual (método lineal) </li >
         </ul >
       </div >

       <div style={S.alerta} >
        ⚠️  <strong >Importante: </strong > Aunque copies el mes anterior, siempre revisá los valores 
        antes de guardar. El sistema agrega una nota automática indicando que se copió del mes anterior, 
        pero la responsabilidad de verificar los números es tuya.
       </div >
     </div >

    {/* ═══════════════════════════════════════════════════════════════════
        NUEVO: Sugerencia de energía de maquinarias
    ═══════════════════════════════════════════════════════════════════ */}
     <div style={S.card} >
       <div style={S.titulo} >💡 Sugerencia de energía basada en producción</div >
       <p style={S.p} >
        El sistema puede sugerirte un valor estimado para el campo  <strong >"Servicios" </strong > 
        basándose en la energía consumida por tus maquinarias durante el mes.
       </p >

       <div style={S.exito} >
        ✅  <strong >¿Cómo funciona? </strong >  <br/ >
        1. Primero registrá tus maquinarias en  <strong >⚙️ Maquinarias y Energía </strong >  <br/ >
        2. Indicá la potencia (kW) de cada equipo y las horas de uso  <br/ >
        3. El sistema calcula el costo energético mensual automáticamente  <br/ >
        4. Al cargar costos fijos, verás un  <strong >banner naranja </strong > con la sugerencia  <br/ >
        5. Hacé clic en  <strong >"Aplicar sugerencia" </strong > para usar ese valor en Servicios  <br/ >
        6. Podés editarlo manualmente si necesitás ajustarlo
       </div >

       <div style={S.ejemplo} >
         <strong >Fórmula de cálculo: </strong >  <br/ > <br/ >
        <strong >Maquinarias activas (horno, amasadora): </strong >  <br/ >
        &nbsp;  &nbsp;kW × horas/tanda × tandas/mes × ₲/kWh  <br/ > <br/ >
        <strong >Maquinarias permanentes (heladera, freezer): </strong >  <br/ >
        &nbsp;  &nbsp;kW × 24hs × 30 días × ₲/kWh  <br/ > <br/ >
         <strong >Ejemplo: </strong >  <br/ >
        Horno 2.5kW × 1.5hs × 20 tandas × ₲800/kWh =  <strong >₲ 60.000/mes </strong >  <br/ >
        Heladera 0.15kW × 720hs × ₲800/kWh =  <strong >₲ 86.400/mes </strong >  <br/ >
        Total sugerido para Servicios:  <strong >₲ 146.400/mes </strong >
       </div >

       <div style={S.campo} >
         <div style={S.campoNom} >🔗 ¿Dónde se configura el precio del kWh? </div >
         <p style={{ ...S.p, margin:0 }} >
          En la sección  <strong >⚙️ Maquinarias y Energía </strong > hay un botón  "💡 Actualizar precio kWh"  
          que actualiza el valor en todas las maquinarias de una vez. La ANDE cobra aprox.  
          <strong > ₲ 650–900/kWh </strong > según categoría residencial/comercial.
         </p >
       </div >

       <div style={S.alerta} >
        ⚠️  <strong >Nota: </strong > La sugerencia de energía es solo una  <em >estimación </em >. 
        El valor real de tu factura de ANDE puede variar por impuestos, cargos fijos, o cambios tarifarios. 
        Usá la sugerencia como referencia, pero verificá con tu factura real.
       </div >
     </div >

    {/* KPIs */}
     <div style={S.card} >
       <div style={S.titulo} >📊 Los números de arriba (KPIs) </div >
       <p style={S.p} >
        Al entrar a Costos, lo primero que ves son 4 tarjetas con números importantes.
        Esto te da una foto rápida de cómo está tu negocio:
       </p >
       <div style={S.campo} >
         <div style={S.campoNom} >📦 Productos con receta </div >
         <p style={{ ...S.p, margin:0 }} >
          La cantidad de productos que ya tienen receta cargada. Si este número es bajo,
          significa que faltan recetas por completar.
         </p >
       </div >
       <div style={S.campo} >
         <div style={S.campoNom} >📈 Margen promedio </div >
         <p style={{ ...S.p, margin:0 }} >
          El porcentaje de ganancia promedio de todos tus productos.
           <strong > Si está por debajo de 40%, revisá los precios o los costos. </strong >
         </p >
       </div >
       <div style={S.campo} >
         <div style={S.campoNom} >🔴 Productos con margen bajo </div >
         <p style={{ ...S.p, margin:0 }} >
          Cuántos productos están ganando menos del 30%. Estos son los que necesitás atender primero.
         </p >
       </div >
       <div style={S.campo} >
         <div style={S.campoNom} >✅ Productos con margen ok </div >
         <p style={{ ...S.p, margin:0 }} >
          Cuántos productos ya están en un margen saludable (40% o más). ¡Estos están bien!
         </p >
       </div >
     </div >

    {/* Margen */}
     <div style={S.card} >
       <div style={S.titulo} >🎯 ¿Qué es el Margen? </div >
       <p style={S.p} >
        El  <strong >margen </strong > es el porcentaje de ganancia que tenés sobre el costo de materia prima.
        No es lo mismo que  "markup " o recargo — el margen se calcula sobre el precio de venta.
       </p >

       <div style={S.ejemplo} >
         <strong >Fórmula del margen: </strong >  <br/ >
        Margen % = (Precio Venta − Costo) ÷ Precio Venta × 100  <br/ > <br/ >
         <strong >Ejemplo — Chipa (por kg): </strong >  <br/ >
        Costo de materia prima: ₲ 12.654 por kg  <br/ >
        Precio de venta: ₲ 25.000 por kg  <br/ >
        Margen = (25000 − 12654) ÷ 25000 × 100 =  <strong >49.4% </strong >
       </div >

       <div style={S.alerta} >
        ⚠️  <strong >Importante: </strong > Este margen es solo de  <em >materia prima </em >.
        Todavía no incluye alquiler, luz, gas, salarios ni otros costos fijos.
        Por eso necesitás al menos  <strong >40% de margen </strong > para que el negocio sea rentable.
       </div >
     </div >

    {/* Colores de margen */}
     <div style={S.card} >
       <div style={S.titulo} >🎨 ¿Qué significan los colores? </div >
       <p style={S.p} >
        El sistema usa colores para que veas rápido qué productos están bien y cuáles necesitan atención:
       </p >
       <div style={S.campo} >
         <div style={{ ...S.campoNom, color:'#2e7d32' }} >✅ Verde — Excelente (50% o más) </div >
         <p style={{ ...S.p, margin:0 }} >
          Margen muy saludable. El producto cubre bien la materia prima y deja buen espacio para costos fijos y ganancia.
         </p >
       </div >
       <div style={S.campo} >
         <div style={{ ...S.campoNom, color:'#388e3c' }} >✅ Bueno (40% a 50%) </div >
         <p style={{ ...S.p, margin:0 }} >
          Margen recomendado. Es el objetivo para la mayoría de los productos.
          Cubre materia prima y deja espacio razonable para costos fijos.
         </p >
       </div >
       <div style={S.campo} >
         <div style={{ ...S.campoNom, color:'#f46e15' }} >⚠️ Ajustado (20% a 40%) </div >
         <p style={{ ...S.p, margin:0 }} >
          Hay ganancia pero es poca. Puede estar bien para productos de alta rotación,
          pero hay que revisar si los costos fijos quedan cubiertos.
         </p >
       </div >
       <div style={S.campo} >
         <div style={{ ...S.campoNom, color:'#c62828' }} >🔴 Pérdida o muy bajo (menos de 20%) </div >
         <p style={{ ...S.p, margin:0 }} >
          El producto se está vendiendo casi al costo o con muy poca ganancia.
           <strong > Hay que subir el precio o revisar la receta para reducir costos. </strong >
         </p >
       </div >
     </div >

    {/* Precios sugeridos */}
     <div style={S.card} >
       <div style={S.titulo} >🏷️ Los tres precios sugeridos </div >
       <p style={S.p} >
        El sistema calcula automáticamente tres precios según el margen que querés obtener.
        Cada uno sirve para una estrategia diferente:
       </p >

       <div style={S.campo} >
         <div style={S.campoNom} >Competitivo — 20% de margen </div >
         <p style={{ ...S.p, margin:0 }} >
          El precio mínimo para no perder dinero en materia prima.
           <strong > No lo uses como precio final </strong > porque no cubre costos fijos.
          Sirve para comparar con la competencia o para promociones muy puntuales.
         </p >
         <div style={S.ejemplo} >
          Si el costo es ₲ 10.000/kg → Precio 20% = ₲ 12.500/kg  <br/ >
          (ganás ₲ 2.500 por kg, solo para cubrir materia prima)
         </div >
       </div >

       <div style={S.campo} >
         <div style={{ ...S.campoNom, color:'#f46e15' }} >🎯 Objetivo — 40% de margen (RECOMENDADO) </div >
         <p style={{ ...S.p, margin:0 }} >
           <strong >Este es el precio que deberías usar como referencia principal. </strong >
          Cubre la materia prima con margen suficiente para también cubrir alquiler, luz, gas,
          salarios y dejar ganancia neta.
         </p >
         <div style={S.ejemplo} >
          Si el costo es ₲ 10.000/kg → Precio 40% = ₲ 16.667/kg  <br/ >
          (ganás ₲ 6.667 por kg, suficiente para costos fijos + ganancia)
         </div >
       </div >

       <div style={S.campo} >
         <div style={{ ...S.campoNom, color:'#b7996b' }} >💎 Premium — 60% de margen </div >
         <p style={{ ...S.p, margin:0 }} >
          Para productos especiales, de nicho, o cuando hay poca competencia.
          PanFree vende productos sin gluten —  <strong >este precio es completamente válido </strong >
          porque el público objetivo valora la calidad y está dispuesto a pagar más.
         </p >
         <div style={S.ejemplo} >
          Si el costo es ₲ 10.000/kg → Precio 60% = ₲ 25.000/kg  <br/ >
          (ganás ₲ 15.000 por kg, ideal para productos premium o exclusivos)
         </div >
       </div >
     </div >

    {/* ¿Cómo se calcula el costo? */}
     <div style={S.card} >
       <div style={S.titulo} >🧮 ¿Cómo se calcula el costo por kg? </div >
       <p style={S.p} >
        El costo que ves en esta página viene directamente de las  <strong >Recetas </strong >.
        El sistema hace esta cuenta:
       </p >

       <div style={S.ejemplo} >
         <strong >Paso 1 — Sumar todos los ingredientes de una tanda: </strong >  <br/ >
         &nbsp;  &nbsp;• 500g Almidón: ₲ 14.000  <br/ >
         &nbsp;  &nbsp;• 170g Queso: ₲ 8.500  <br/ >
         &nbsp;  &nbsp;• 85g Manteca: ₲ 3.400  <br/ >
         &nbsp;  &nbsp;• 2 Huevos: ₲ 1.500  <br/ >
         &nbsp;  &nbsp;• Otros: ₲ 2.785  <br/ >
         &nbsp;  &nbsp; <strong >= Costo total de tanda: ₲ 30.185 </strong >  <br/ > <br/ >
         <strong >Paso 2 — Dividir por el rendimiento en kg: </strong >  <br/ >
         &nbsp;  &nbsp;Si de esa tanda obtenés 1.200 kg de producto:  <br/ >
         &nbsp;  &nbsp;₲ 30.185 ÷ 1.200 kg =  <strong >₲ 25.154 por kg </strong >
       </div >

       <div style={S.alerta} >
        ⚠️  <strong >Si el costo no es real, revisá: </strong >  <br/ >
        1. Que los  <strong >Precios Promedio Ponderados (PPP) </strong > de los insumos estén actualizados en Insumos  <br/ >
        2. Que las  <strong >cantidades de la receta </strong > sean las correctas  <br/ >
        3. Que el  <strong >rendimiento en kg </strong > (peso total de la tanda) esté bien cargado en Recetas
       </div >
     </div >

    {/* Filtros */}
     <div style={S.card} >
       <div style={S.titulo} >🔍 Los filtros de arriba </div >
       <p style={S.p} >
        Podés filtrar los productos según su margen para enfocarte en lo que necesitás atender:
       </p >
       <div style={S.campo} >
         <div style={S.campoNom} >📋 Todos </div >
         <p style={{ ...S.p, margin:0 }} >Muestra todos los productos con receta cargada. </p >
       </div >
       <div style={S.campo} >
         <div style={S.campoNom} >✅ Buen margen (≥40%) </div >
         <p style={{ ...S.p, margin:0 }} >Solo los productos que ya están rentables. Para ver qué estás haciendo bien. </p >
       </div >
       <div style={S.campo} >
         <div style={S.campoNom} >⚠️ Ajustado (20-40%) </div >
         <p style={{ ...S.p, margin:0 }} >Productos con ganancia baja. Revisá si podés subir precios o reducir costos. </p >
       </div >
       <div style={S.campo} >
         <div style={S.campoNom} >🔴 Con pérdida ( &lt;20%) </div >
         <p style={{ ...S.p, margin:0 }} >
           <strong >Atención prioritaria. </strong > Estos productos te están haciendo perder dinero o ganás muy poco.
          Hay que actuar rápido.
         </p >
       </div >
     </div >

    {/* Vista Tabla vs Tarjetas */}
     <div style={S.card} >
       <div style={S.titulo} >📋 Tabla vs 🃏 Tarjetas </div >
       <p style={S.p} >
        Arriba a la derecha tenés un botón para cambiar entre dos vistas:
       </p >
       <div style={S.campo} >
         <div style={S.campoNom} >📋 Vista Tabla </div >
         <p style={{ ...S.p, margin:0 }} >
          Muestra todos los datos en filas y columnas. Ideal para comparar muchos productos a la vez
          y ver todos los precios sugeridos de un vistazo. Funciona mejor en  computadora.
         </p >
       </div >
       <div style={S.campo} >
         <div style={S.campoNom} >🃏 Vista Tarjetas </div >
         <p style={{ ...S.p, margin:0 }} >
          Muestra cada producto en una tarjeta individual. Más fácil de leer en el celular
          o cuando querés enfocarte en un producto a la vez.
         </p >
       </div >
     </div >

    {/* Alerta de rendimiento faltante */}
     <div style={S.card} >
       <div style={S.titulo} >⚠️ La alerta amarilla de arriba </div >
       <p style={S.p} >
        Si ves un cartel amarillo que dice  <strong > "X productos sin rendimiento cargado " </strong >,
        significa que hay recetas que no tienen completo el campo  "Rendimiento (kg) ".
       </p >

       <div style={S.alerta} >
        ⚠️  <strong >Si el rendimiento está mal o vacío, los costos no son reales. </strong >
         <br/ >El sistema no puede dividir el costo de la tanda si no sabe cuántos kg produce.
       </div >

       <div style={S.exito} >
        ✅  <strong >¿Cómo solucionarlo? </strong >  <br/ >
        1. Hacé clic en el botón  "✏️ Completar en Recetas "  <br/ >
        2. Editá cada producto que falte  <br/ >
        3. En  "Rendimiento (kg) " poné el peso total de la tanda  <br/ >
        4. Guardá y volvé a Costos para ver los números reales
       </div >
     </div >

    {/* Flujo de trabajo recomendado */}
     <div style={S.card} >
       <div style={S.titulo} >📝 Flujo de trabajo recomendado </div >
       <p style={S.p} >
        Para mantener los costos actualizados y tomar buenas decisiones de precios, seguí este orden:
       </p >

       <div style={{ backgroundColor:'#f0ebe3', border:'1px solid #b7996b', borderRadius:'6px', padding:'1rem', marginBottom:'0.75rem' }} >
         <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start' }} >
           <span style={{ backgroundColor:'#334c2b', color:'#eee6d9', width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight :700, flexShrink:0 }} >1 </span >
           <div >
             <div style={{ fontWeight:700, color:'#334c2b', marginBottom:'0.25rem' }} >Actualizá precios en Insumos </div >
             <div style={{ fontSize:'0.88rem', color:'#666' }} >Cuando hagas una compra, actualizá el PPP de los insumos. Esto afecta automáticamente todas las recetas que usan ese insumo. </div >
           </div >
         </div >
       </div >

       <div style={{ backgroundColor:'#f0ebe3', border:'1px solid #b7996b', borderRadius:'6px', padding:'1rem', marginBottom:'0.75rem' }} >
         <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start' }} >
           <span style={{ backgroundColor:'#334c2b', color:'#eee6d9', width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight :700, flexShrink:0 }} >2 </span >
           <div >
             <div style={{ fontWeight:700, color:'#334c2b', marginBottom:'0.25rem' }} >Revisá Recetas </div >
             <div style={{ fontSize:'0.88rem', color:'#666' }} >Verificá que las cantidades y rendimientos en kg estén correctos. Actualizá si cambiaste la receta. </div >
           </div >
         </div >
       </div >

       <div style={{ backgroundColor:'#f0ebe3', border:'1px solid #b7996b', borderRadius:'6px', padding:'1rem', marginBottom:'0.75rem' }} >
         <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start' }} >
           <span style={{ backgroundColor:'#334c2b', color:'#eee6d9', width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight :700, flexShrink:0 }} >3 </span >
           <div >
             <div style={{ fontWeight:700, color:'#334c2b', marginBottom:'0.25rem' }} >Analizá Costos </div >
             <div style={{ fontSize:'0.88rem', color:'#666' }} >Entrá a esta sección y revisá los márgenes. Filtrá por  "Con pérdida " para ver qué productos necesitan atención. </div >
           </div >
         </div >
       </div >

       <div style={{ backgroundColor:'#f0ebe3', border:'1px solid #b7996b', borderRadius:'6px', padding:'1rem', marginBottom:'0.75rem' }} >
         <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start' }} >
           <span style={{ backgroundColor:'#334c2b', color:'#eee6d9', width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight :700, flexShrink:0 }} >4 </span >
           <div >
             <div style={{ fontWeight:700, color:'#334c2b', marginBottom:'0.25rem' }} >Ajustá precios de venta </div >
             <div style={{ fontSize:'0.88rem', color:'#666' }} >Usá los precios sugeridos (especialmente el de 40%) como referencia para actualizar los precios en Productos. </div >
           </div >
         </div >
       </div >

       <div style={{ backgroundColor:'#f0ebe3', border:'1px solid #b7996b', borderRadius:'6px', padding:'1rem', marginBottom:'0.75rem' }} >
         <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start' }} >
           <span style={{ backgroundColor:'#334c2b', color:'#eee6d9', width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight :700, flexShrink:0 }} >5 </span >
           <div >
             <div style={{ fontWeight:700, color:'#334c2b', marginBottom:'0.25rem' }} >Cargá costos fijos mensuales </div >
             <div style={{ fontSize:'0.88rem', color:'#666' }} >Usá la plantilla rodante para copiar el mes anterior y solo editar lo que cambió. Ahorra 80% del tiempo. </div >
           </div >
         </div >
       </div >

       <div style={{ backgroundColor:'#f0ebe3', border:'1px solid #b7996b', borderRadius:'6px', padding:'1rem' }} >
         <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start' }} >
           <span style={{ backgroundColor:'#334c2b', color:'#eee6d9', width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight :700, flexShrink:0 }} >6 </span >
           <div >
             <div style={{ fontWeight:700, color:'#334c2b', marginBottom:'0.25rem' }} >Repetí mensualmente </div >
             <div style={{ fontSize:'0.88rem', color:'#666' }} >Hacé este recorrido al menos una vez por mes, o cada vez que hagas compras grandes de insumos. </div >
           </div >
         </div >
       </div >
     </div >

    {/* Preguntas frecuentes */}
     <div style={S.card} >
       <div style={S.titulo} >❓ Preguntas frecuentes </div >

       <div style={S.campo} >
         <div style={S.campoNom} >¿Por qué el margen cambió de la última vez? </div >
         <p style={{ ...S.p, margin:0 }} >
          Probablemente actualizaste el precio de algún insumo en Compras. El sistema recalcula
          automáticamente todos los costos cuando cambia el PPP de un insumo.
     </p >
       </div >

       <div style={S.campo} >
         <div style={S.campoNom} >¿Puedo usar el precio sugerido de 60% para todos mis productos? </div >
         <p style={{ ...S.p, margin:0 }} >
          Podés, pero tené en cuenta el mercado. Para productos sin gluten el precio premium es válido,
          pero compará con la competencia y considerá qué está dispuesto a  pagar tu cliente.
         </p >
       </div >

       <div style={S.campo} >
         <div style={S.campoNom} >¿El margen incluye mis costos de luz, gas y alquiler? </div >
         <p style={{ ...S.p, margin:0 }} >
           <strong >No. </strong > Este margen es solo de materia prima. Por eso se recomienda mínimo 40%:
          para que después de pagar costos fijos todavía quede ganancia neta. Para ver el margen con 
          costos fijos incluídos, usá la pestaña  <strong >🎯 Margen Real </strong >.
         </p >
       </div >

       <div style={S.campo} >
         <div style={S.campoNom} >¿Qué hago si un producto tiene margen negativo? </div >
         <p style={{ ...S.p, margin:0 }} >
          Tenés dos opciones:  <strong >1) </strong > Subir el precio de venta, o  <strong >2) </strong > Reducir costos
          (cambiar la receta, buscar insumos más baratos, o reducir el tamaño de la porción).
         </p >
       </div >

       <div style={S.campo} >
         <div style={S.campoNom} >¿Es obligatorio copiar el mes anterior? </div >
         <p style={{ ...S.p, margin:0 }} >
           <strong >No. </strong > La plantilla rodante es opcional. Si preferís cargar desde cero, 
          simplemente ignorá el banner azul y completá los campos manualmente. El sistema también 
          te da la opción  "No, empezar vacío"  si no querés usar los valores del mes anterior.
         </p >
       </div >

       <div style={S.campo} >
         <div style={S.campoNom} >¿La sugerencia de energía reemplaza mi factura de ANDE? </div >
         <p style={{ ...S.p, margin:0 }} >
           <strong >No. </strong > La sugerencia es solo una estimación basada en tus maquinarias 
          registradas. Siempre verificá con tu factura real de ANDE, ya que puede haber impuestos, 
          cargos fijos, o cambios tarifarios que el sistema no considera.
         </p >
       </div >
     </div >

     <div style={{ textAlign:'center', paddingBottom:'2rem' }} >
       <button onClick={() => router.push('/admin/costos')} style={{ backgroundColor:'#f46e15', color:'#fff', border:'none', padding:'0.8rem 2rem', borderRadius:'4px', cursor:'pointer', fontFamily:'inherit',  fontWeight:'700', fontSize:'1rem' }} >
        ✅ Entendido — Ir a Costos
       </button >
     </div >
   </main >
 </div >
)
}