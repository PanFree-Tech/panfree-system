
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SECCIONES = [
  { id:'inicio',      emoji:'🏠', titulo:'Por donde empezar' },
  { id:'flujo',       emoji:'🔄', titulo:'Flujo de trabajo' },
  { id:'productos',   emoji:'📦', titulo:'Productos' },
  { id:'proveedores', emoji:'🏭', titulo:'Proveedores' },
  { id:'insumos',     emoji:'🌾', titulo:'Insumos y PPP' },
  { id:'recetas',     emoji:'📋', titulo:'Recetas' },
  { id:'compras',     emoji:'🛒', titulo:'Compras' },
  { id:'produccion',  emoji:'🍞', titulo:'Produccion' },
  { id:'costos',      emoji:'💰', titulo:'Costos y Margenes' },
  { id:'reportes',    emoji:'📊', titulo:'Reportes' },
  { id:'tienda',      emoji:'🛍️', titulo:'Tienda Online' },
  { id:'clientes',    emoji:'👥', titulo:'Clientes' },
  { id:'faq',         emoji:'❓', titulo:'Preguntas Frecuentes' },
]

const S = {
  page:    { minHeight:'100vh', backgroundColor:'#f5f5f5', fontFamily:'"Segoe UI",sans-serif', display:'flex', flexDirection:'column' },
  header:  { backgroundColor:'#334c2b', color:'#eee6d9', padding:'1rem 2rem', display:'flex', alignItems:'center', gap:'1rem', borderBottom:'3px solid #b7996b', flexShrink:0 },
  body:    { display:'flex', flex:1, minHeight:0 },
  sidebar: { width:'260px', backgroundColor:'#fff', borderRight:'2px solid #b7996b', overflowY:'auto', flexShrink:0, padding:'1rem 0' },
  content: { flex:1, overflowY:'auto', padding:'2rem 2.5rem', maxWidth:'800px' },
  btnGris: { backgroundColor:'#999', color:'#fff', border:'none', padding:'0.5rem 1rem', borderRadius:'4px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600', fontSize:'0.85rem' },
  h2:      { color:'#334c2b', fontSize:'1.5rem', marginBottom:'0.5rem', paddingBottom:'0.5rem', borderBottom:'2px solid #b7996b' },
  h3:      { color:'#334c2b', fontSize:'1.1rem', margin:'1.5rem 0 0.5rem' },
  p:       { color:'#444', lineHeight:'1.7', marginBottom:'0.75rem', fontSize:'0.95rem' },
  alerta:  { backgroundColor:'#fff8e7', border:'1px solid #f46e15', borderRadius:'6px', padding:'0.9rem 1rem', margin:'1rem 0', fontSize:'0.9rem', color:'#7a4500' },
  tip:     { backgroundColor:'#e8f5e9', border:'1px solid #2e7d32', borderRadius:'6px', padding:'0.9rem 1rem', margin:'1rem 0', fontSize:'0.9rem', color:'#1b5e20' },
  tabla:   { width:'100%', borderCollapse:'collapse', margin:'1rem 0', fontSize:'0.88rem' },
  th:      { backgroundColor:'#334c2b', color:'#eee6d9', padding:'0.6rem 0.8rem', textAlign:'left' },
  td:      { padding:'0.6rem 0.8rem', borderBottom:'1px solid #eee6d9', color:'#444', verticalAlign:'top' },
  paso:    { display:'flex', gap:'1rem', marginBottom:'0.75rem', alignItems:'flex-start' },
  numPaso: { backgroundColor:'#334c2b', color:'#eee6d9', borderRadius:'50%', width:'28px', height:'28px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'0.85rem', flexShrink:0, marginTop:'2px' },
}

function Paso({ n, children }) {
  return (
    <div style={S.paso}>
      <span style={S.numPaso}>{n}</span>
      <p style={{ ...S.p, margin:0 }}>{children}</p>
    </div>
  )
}

const CONTENIDO = {
  inicio: (
    <div>
      <h2 style={S.h2}>🏠 Por donde empezar?</h2>
      <p style={S.p}>Bienvenido al panel de administracion de <strong>PanFree</strong>. Este sistema gestiona toda la operacion de la panaderia.</p>
      <div style={S.tip}><strong>Si es la primera vez</strong>, segui este orden:</div>
      <Paso n={1}>Carga tus <strong>Proveedores</strong></Paso>
      <Paso n={2}>Carga tus <strong>Insumos</strong> con precio y stock inicial</Paso>
      <Paso n={3}>Carga tus <strong>Productos</strong></Paso>
      <Paso n={4}>Crea las <strong>Recetas</strong></Paso>
      <Paso n={5}>Registra una <strong>Compra</strong> cuando compres ingredientes</Paso>
      <Paso n={6}>Registra <strong>Produccion</strong> cada vez que hornees</Paso>
      <Paso n={7}>Revisa <strong>Costos</strong> para ver margenes</Paso>
      <div style={S.alerta}><strong>Importante:</strong> El sistema calcula costos usando el <strong>PPP (Precio Promedio Ponderado)</strong>. Registra todas las compras para que los costos sean precisos.</div>
    </div>
  ),
  flujo: (
    <div>
      <h2 style={S.h2}>🔄 Flujo de Trabajo</h2>
      <h3 style={S.h3}>Cuando compras ingredientes</h3>
      <Paso n={1}>Ir a <strong>Compras - Nueva Compra</strong></Paso>
      <Paso n={2}>Seleccionar proveedor y agregar insumos con cantidades y precios</Paso>
      <Paso n={3}>Al recepcionar, el stock se actualiza automaticamente</Paso>
      <h3 style={S.h3}>Cuando produces</h3>
      <Paso n={1}>Ir a <strong>Produccion - Registrar Lote</strong></Paso>
      <Paso n={2}>Seleccionar producto y cantidad producida</Paso>
      <Paso n={3}>El sistema calcula el costo unitario vs precio de venta</Paso>
      <div style={S.tip}><strong>Buena practica:</strong> Registra cada lote de produccion para tener datos reales de costos y margenes.</div>
    </div>
  ),
  productos: (
    <div>
      <h2 style={S.h2}>📦 Modulo: Productos</h2>
      <p style={S.p}>Gestiona el catalogo que aparece en tu tienda online.</p>
      <table style={S.tabla}>
        <thead><tr><th style={S.th}>Campo</th><th style={S.th}>Descripcion</th></tr></thead>
        <tbody>
          {[
            ['Nombre','Nombre del producto en la tienda'],
            ['Categoria','panes / dulces / salados / eventos'],
            ['Precio Venta','Precio al publico en Guaranies'],
            ['Stock Actual','Unidades disponibles para vender'],
            ['Stock Minimo','Alerta cuando el stock baje de este numero'],
            ['Activo','Si esta en false, no aparece en la tienda'],
            ['Destacado','Aparece primero en la pagina de inicio'],
          ].map(([c,d]) => <tr key={c}><td style={{ ...S.td, fontWeight:600, color:'#334c2b' }}>{c}</td><td style={S.td}>{d}</td></tr>)}
        </tbody>
      </table>
    </div>
  ),
  proveedores: (
    <div>
      <h2 style={S.h2}>🏭 Modulo: Proveedores</h2>
      <p style={S.p}>Registra las empresas o personas que te proveen ingredientes.</p>
      <table style={S.tabla}>
        <thead><tr><th style={S.th}>Campo</th><th style={S.th}>Para que sirve</th></tr></thead>
        <tbody>
          {[
            ['Nombre Empresa','Nombre del proveedor (requerido)'],
            ['CUIT / RUC','Numero de identificacion fiscal'],
            ['Contacto','Persona, email y telefono para pedidos'],
            ['Calificacion','Tu valoracion del proveedor (0-5)'],
            ['Notas','Observaciones privadas (pagos, dias de entrega, etc.)'],
          ].map(([c,d]) => <tr key={c}><td style={{ ...S.td, fontWeight:600, color:'#334c2b' }}>{c}</td><td style={S.td}>{d}</td></tr>)}
        </tbody>
      </table>
    </div>
  ),
  insumos: (
    <div>
      <h2 style={S.h2}>🌾 Modulo: Insumos y PPP</h2>
      <p style={S.p}>Los insumos son tus materias primas: harinas, levaduras, grasas, envases, etc.</p>
      <h3 style={S.h3}>Que es el PPP?</h3>
      <p style={S.p}>El <strong>PPP (Precio Promedio Ponderado)</strong> es el costo promedio de un insumo considerando todas tus compras y sus cantidades.</p>
      <div style={S.alerta}>
        <strong>Ejemplo:</strong> 10 kg a G 5.000/kg + 20 kg a G 6.000/kg = PPP de G 5.667/kg
      </div>
      <p style={S.p}>Cuando el stock baja del minimo, el insumo aparece en rojo como alerta.</p>
    </div>
  ),
  recetas: (
    <div>
      <h2 style={S.h2}>📋 Modulo: Recetas</h2>
      <p style={S.p}>Las recetas definen que insumos y cantidades se usan para producir cada producto.</p>
      <Paso n={1}>Clic en <strong>+ Nueva Receta</strong></Paso>
      <Paso n={2}>Seleccionar el producto</Paso>
      <Paso n={3}>Agregar insumos con cantidad y unidad</Paso>
      <Paso n={4}>Guardar - el costo se calcula automaticamente con el PPP</Paso>
      <div style={S.tip}><strong>Importante:</strong> Si el PPP de un insumo cambia, el costo de la receta se actualiza automaticamente.</div>
    </div>
  ),
  compras: (
    <div>
      <h2 style={S.h2}>🛒 Modulo: Compras</h2>
      <p style={S.p}>Registra cada compra a tus proveedores. Actualiza el stock y recalcula el PPP.</p>
      <table style={S.tabla}>
        <thead><tr><th style={S.th}>Estado</th><th style={S.th}>Significa</th></tr></thead>
        <tbody>
          {[
            ['Pendiente','Creada pero no confirmada'],
            ['Confirmada','Proveedor confirmo, en camino'],
            ['Recepcionada','Recibiste los productos, stock actualizado'],
            ['Cancelada','No se concreto'],
          ].map(([e,d]) => <tr key={e}><td style={{ ...S.td, fontWeight:600 }}>{e}</td><td style={S.td}>{d}</td></tr>)}
        </tbody>
      </table>
      <div style={S.tip}><strong>Tip:</strong> Cambia a <strong>Recepcionada</strong> cuando recibas fisicamente los productos para actualizar el stock.</div>
    </div>
  ),
  produccion: (
    <div>
      <h2 style={S.h2}>🍞 Modulo: Produccion</h2>
      <p style={S.p}>Registra cada lote para llevar control de costos reales.</p>
      <table style={S.tabla}>
        <thead><tr><th style={S.th}>Costo</th><th style={S.th}>Que incluir</th></tr></thead>
        <tbody>
          {[
            ['Materia Prima','El costo de los insumos usados'],
            ['Mano de Obra','Horas de trabajo x costo hora'],
            ['Indirectos','Gas, electricidad, empaques prorrateados'],
          ].map(([c,d]) => <tr key={c}><td style={{ ...S.td, fontWeight:600, color:'#334c2b' }}>{c}</td><td style={S.td}>{d}</td></tr>)}
        </tbody>
      </table>
      <p style={S.p}>El sistema calcula: Costo Total, Costo Unitario y Margen Estimado.</p>
    </div>
  ),
  costos: (
    <div>
      <h2 style={S.h2}>💰 Modulo: Costos y Margenes</h2>
      <p style={S.p}>Vista de rentabilidad de todos los productos con receta cargada.</p>
      <table style={S.tabla}>
        <thead><tr><th style={S.th}>Indicador</th><th style={S.th}>Margen</th><th style={S.th}>Que hacer</th></tr></thead>
        <tbody>
          {[
            ['Excelente','50% o mas','Muy rentable, mantene el precio'],
            ['Bueno','30% - 49%','Rentable, esta bien'],
            ['Bajo','0% - 29%','Revisa si podes subir precio o bajar costos'],
            ['Negativo','Menos de 0%','Estas perdiendo plata, accion urgente'],
          ].map(([i,m,q]) => <tr key={i}><td style={S.td}>{i}</td><td style={{ ...S.td, fontWeight:700 }}>{m}</td><td style={S.td}>{q}</td></tr>)}
        </tbody>
      </table>
    </div>
  ),
  reportes: (
    <div>
      <h2 style={S.h2}>📊 Modulo: Reportes</h2>
      <p style={S.p}>Panel de estado general. Revisalo regularmente para detectar problemas.</p>
      <table style={S.tabla}>
        <thead><tr><th style={S.th}>Seccion</th><th style={S.th}>Para que sirve</th></tr></thead>
        <tbody>
          {[
            ['KPIs generales','Contadores de productos, proveedores, insumos'],
            ['Insumos con stock bajo','Ingredientes que necesitan reposicion urgente'],
            ['Compras pendientes','Compras no recepcionadas todavia'],
            ['Ultimos lotes','Los 5 lotes mas recientes con su margen'],
          ].map(([s,d]) => <tr key={s}><td style={{ ...S.td, fontWeight:600, color:'#334c2b' }}>{s}</td><td style={S.td}>{d}</td></tr>)}
        </tbody>
      </table>
      <div style={S.tip}><strong>Recomendacion:</strong> Revisa este panel al inicio de cada semana para planificar las compras.</div>
    </div>
  ),
  tienda: (
    <div>
      <h2 style={S.h2}>🛍️ Tienda Online</h2>
      <p style={S.p}>La tienda publica muestra los productos con is_active = true, ordenados por destacados primero.</p>
      <table style={S.tabla}>
        <thead><tr><th style={S.th}>Condicion</th><th style={S.th}>Resultado</th></tr></thead>
        <tbody>
          {[
            ['is_active = true','Visible en la tienda'],
            ['is_active = false','Oculto'],
            ['is_featured = true','Aparece primero'],
            ['stock_actual = 0','Se muestra como Agotado'],
          ].map(([c,r]) => <tr key={c}><td style={{ ...S.td, fontFamily:'monospace', fontSize:'0.82rem', color:'#334c2b' }}>{c}</td><td style={S.td}>{r}</td></tr>)}
        </tbody>
      </table>
      <p style={S.p}>En el footer de la tienda hay un enlace discreto <strong>"Administracion"</strong> que lleva al login del panel.</p>
    </div>
  ),
  clientes: (
    <div>
      <h2 style={S.h2}>👥 Clientes</h2>
      <p style={S.p}>Los clientes se registran automaticamente al crear una cuenta en la tienda.</p>
      <Paso n={1}>El cliente intenta agregar un producto al carrito</Paso>
      <Paso n={2}>Sin sesion, aparece el modal de Iniciar Sesion / Registrarse</Paso>
      <Paso n={3}>Al registrarse se crea usuario en Supabase Auth y registro en tabla clientes</Paso>
      <Paso n={4}>El producto se agrega al carrito automaticamente</Paso>
    </div>
  ),
  faq: (
    <div>
      <h2 style={S.h2}>❓ Preguntas Frecuentes</h2>
      {[
        { q:'Como actualizo el precio de un producto?', a:'Productos - Editar - cambiar Precio Venta - Guardar.' },
        { q:'Por que el margen cambio solo?', a:'Porque el PPP de algun insumo de su receta cambio al registrar una nueva compra.' },
        { q:'Como desactivo un producto sin borrarlo?', a:'En la lista de Productos, clic en el boton Activo del producto. Cambia a Inactivo y desaparece de la tienda.' },
        { q:'Que pasa si borro un proveedor con compras asociadas?', a:'No se puede borrar. Podes desactivarlo (is_active = false) en lugar de borrarlo.' },
        { q:'Como acceden Pedro y Luciana al panel?', a:'Yendo a la URL del sitio seguida de /admin/login, o usando el enlace Administracion del footer.' },
        { q:'Los pedidos online se gestionan aqui?', a:'El modulo de gestion de pedidos esta pendiente de desarrollo en una proxima version.' },
      ].map(({ q, a }) => (
        <div key={q} style={{ marginBottom:'1.25rem', paddingBottom:'1.25rem', borderBottom:'1px solid #eee6d9' }}>
          <p style={{ ...S.p, fontWeight:'700', color:'#334c2b', marginBottom:'0.3rem' }}>❓ {q}</p>
          <p style={{ ...S.p, margin:0 }}>💬 {a}</p>
        </div>
      ))}
    </div>
  ),
}

export default function PaginaAyuda() {
  const router = useRouter()
  const [seccionActiva, setSeccionActiva] = useState('inicio')

  return (
    <div style={S.page}>
      <header style={S.header}>
        <button onClick={() => router.push('/admin')} style={{ ...S.btnGris, padding:'0.4rem 0.8rem' }}>
          Volver
        </button>
        <span style={{ fontSize:'1.3rem' }}>❓</span>
        <h1 style={{ margin:0, fontSize:'1.2rem' }}>Guia del Sistema PanFree</h1>
        <span style={{ marginLeft:'auto', fontSize:'0.8rem', color:'#b7996b' }}>v1.0 - Encarnacion 🇵🇾</span>
      </header>

      <div style={S.body}>
        <aside style={S.sidebar}>
          <p style={{ padding:'0 1rem 0.5rem', fontSize:'0.75rem', color:'#b7996b', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px' }}>
            Contenidos
          </p>
          {SECCIONES.map(sec => (
            <button
              key={sec.id}
              onClick={() => setSeccionActiva(sec.id)}
              style={{
                display:'block', width:'100%', textAlign:'left',
                padding:'0.6rem 1rem', border:'none', cursor:'pointer',
                fontFamily:'inherit', fontSize:'0.9rem',
                fontWeight: seccionActiva === sec.id ? '700' : '400',
                backgroundColor: seccionActiva === sec.id ? '#eee6d9' : 'transparent',
                color: seccionActiva === sec.id ? '#334c2b' : '#555',
                borderLeft: seccionActiva === sec.id ? '3px solid #f46e15' : '3px solid transparent',
                transition:'all 0.15s'
              }}
            >
              {sec.emoji} {sec.titulo}
            </button>
          ))}
        </aside>

        <div style={S.content}>
          {CONTENIDO[seccionActiva] || <p style={S.p}>Seccion no encontrada.</p>}
        </div>
      </div>
    </div>
  )
}