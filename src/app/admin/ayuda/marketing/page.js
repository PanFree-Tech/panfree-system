/**
 * 📁 UBICACIÓN: src/app/admin/ayuda/marketing/page.js
 * 📅 CREADO: 2026-03-07
 * 📌 DESCRIPCIÓN: Guía completa de uso del Generador de Imágenes para Instagram.
 *    Cubre: formatos, plantillas, textos, hashtags, zonas seguras,
 *    flujo de exportación y mejores prácticas globales de marketing.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const P = {
  crema:       '#eee6d9',
  verde:       '#334c2b',
  verdeClaro:  '#4a6e3f',
  verdeOsc:    '#1c2c17',
  naranja:     '#f46e15',
  dorado:      '#b7996b',
  doradoClaro: '#d2b991',
  blanco:      '#ffffff',
  gris:        '#f5f0e8',
}

// ─── ESTRUCTURA DE LA GUÍA ────────────────────────────────────────────────────
const SECCIONES = [
  {
    id: 'que-es',
    icono: '🎯',
    titulo: '¿Para qué sirve?',
    subtitulo: 'Descripción general del generador',
  },
  {
    id: 'flujo',
    icono: '🔄',
    titulo: 'Flujo de trabajo',
    subtitulo: 'Del generador a Instagram, paso a paso',
  },
  {
    id: 'formatos',
    icono: '📐',
    titulo: 'Formatos de imagen',
    subtitulo: 'Feed, Stories y cuándo usar cada uno',
  },
  {
    id: 'plantillas',
    icono: '🎨',
    titulo: 'Plantillas disponibles',
    subtitulo: 'Hero, Catálogo, Promo — diferencias y usos',
  },
  {
    id: 'textos',
    icono: '✏️',
    titulo: 'Cómo escribir los textos',
    subtitulo: 'Jerarquía tipográfica y copywriting',
  },
  {
    id: 'hashtags',
    icono: '#️⃣',
    titulo: 'Estrategia de hashtags',
    subtitulo: 'En la imagen vs en el caption',
  },
  {
    id: 'zonas',
    icono: '🛡️',
    titulo: 'Zonas seguras de Instagram',
    subtitulo: 'Qué tapa Instagram y cómo lo evitamos',
  },
  {
    id: 'exportar',
    icono: '⬇️',
    titulo: 'Exportar y publicar',
    subtitulo: 'PNG vs JPG y cómo pasar al celular',
  },
  {
    id: 'mejores-practicas',
    icono: '🌍',
    titulo: 'Mejores prácticas',
    subtitulo: 'Algoritmo, comunidad celíaca, consistencia',
  },
]

// ─── CONTENIDOS ───────────────────────────────────────────────────────────────
const CONTENIDOS = {

  'que-es': () => (
    <>
      <P_txt>
        El <strong>Generador de Imágenes</strong> es una herramienta dentro del panel de
        administración de PanFree que te permite crear publicidades profesionales para Instagram
        directamente desde el sistema, sin necesidad de Canva, Adobe ni ninguna app externa.
      </P_txt>
      <InfoBox color={P.verde}>
        Todo el procesamiento ocurre en tu navegador. Las imágenes no se suben a ningún servidor
        externo. La imagen del producto se carga desde Supabase Storage —
        el mismo lugar donde está guardada en la tienda online.
      </InfoBox>
      <Subtitulo>Lo que podés hacer:</Subtitulo>
      <Lista items={[
        'Seleccionar cualquier producto activo del catálogo de PanFree',
        'Elegir formato (Feed cuadrado, Feed vertical 4:5, Stories/Reels)',
        'Elegir plantilla (Producto Estrella, Catálogo, Promo)',
        'Elegir esquema de color de la marca',
        'Personalizar todos los textos en tiempo real',
        'Ver la imagen generada antes de descargarla',
        'Descargar en PNG (máxima calidad) o JPG (97%) en resolución completa',
        'Publicar manualmente desde la app de Instagram en tu celular',
      ]}/>
      <Subtitulo>Lo que NO hace (y por qué):</Subtitulo>
      <Lista items={[
        'No publica automáticamente en Instagram — la API oficial requiere aprobación de Meta y es de pago',
        'No agrega el sticker de link automáticamente — eso solo se hace dentro de la app de Instagram',
        'No genera imágenes con IA — todo es diseño de marca consistente basado en la paleta de PanFree',
      ]}/>
    </>
  ),

  'flujo': () => (
    <>
      <P_txt>El proceso completo desde el generador hasta Instagram:</P_txt>
      <div style={{display:'flex',flexDirection:'column',gap:'0'}}>
        {[
          { n:1, titulo:'Abrís el generador', desc:'Admin → 📸 Marketing. Los productos se cargan automáticamente desde Supabase.' },
          { n:2, titulo:'Configurás los parámetros', desc:'Formato, plantilla, esquema de color, producto, textos. La vista previa se actualiza en tiempo real con cada cambio.' },
          { n:3, titulo:'Revisás la vista previa', desc:'Verificá que el nombre del producto, el precio y el CTA sean legibles. Asegurate de que nada importante quede en las zonas que cubre Instagram.' },
          { n:4, titulo:'Exportás la imagen', desc:'Botón PNG (recomendado) o JPG. El archivo se descarga directamente a tu dispositivo con el nombre del producto y la resolución.' },
          { n:5, titulo:'Enviás al celular', desc:'WhatsApp Web, Google Drive, Bluetooth, AirDrop o cable USB. La imagen queda guardada en la galería de fotos.' },
          { n:6, titulo:'Publicás en Instagram', desc:'Abrís Instagram → Nueva publicación → elegís la imagen → escribís el caption con los hashtags que querás → publicar.' },
        ].map(paso => (
          <PasoItem key={paso.n} n={paso.n} titulo={paso.titulo} desc={paso.desc}/>
        ))}
      </div>
      <InfoBox color={P.naranja} titulo="Tiempo estimado total">
        Desde que abrís el generador hasta tener la imagen lista para publicar: <strong>3 a 5 minutos</strong>.
        El paso que más lleva es enviarla al celular si no tenés WhatsApp Web configurado.
      </InfoBox>
    </>
  ),

  'formatos': () => (
    <>
      <P_txt>
        Instagram acepta varios formatos de imagen. El generador produce los tres más relevantes
        para una panadería artesanal como PanFree:
      </P_txt>

      <Card borde={P.verde} titulo="📱 Feed Vertical 4:5  —  1080×1350px" subtitulo="⭐ RECOMENDADO para empezar">
        Ocupa más espacio vertical en el feed que el cuadrado. Cuando alguien hace scroll,
        ve esta imagen durante más tiempo antes de que desaparezca de la pantalla.
        El algoritmo de Instagram favorece este formato para cuentas con bajo número de seguidores
        porque genera más tiempo de visualización. <br/><br/>
        <strong>Ideal para:</strong> presentar un producto con imagen, catálogo general, cualquier publicación
        que quieras que tenga más alcance orgánico.
      </Card>

      <Card borde="#666" titulo="⬛ Feed Cuadrado 1:1  —  1080×1080px" subtitulo="Clásico y seguro">
        El formato original de Instagram. Bueno para mantener una grilla de perfil visualmente
        uniforme. Ocupa menos espacio en pantalla que el 4:5, pero tiene más años de historia
        y es lo que el público espera cuando piensa en "post de Instagram".<br/><br/>
        <strong>Ideal para:</strong> catálogo de categorías, publicaciones donde la estética
        del grid sea una prioridad.
      </Card>

      <Card borde={P.naranja} titulo="📲 Stories / Reels  —  1080×1920px" subtitulo="Mayor visibilidad temporaria">
        Las Stories tienen una duración de 24 horas pero generan alcance muy alto, especialmente
        entre seguidores actuales. Los Reels con esta proporción tienen el mayor alcance orgánico
        en Instagram en 2026, especialmente para cuentas nuevas.<br/><br/>
        <strong>Importante:</strong> este formato incluye una zona gris punteada en la imagen que
        indica dónde Instagram posiciona el sticker de link por defecto. Podés moverlo dentro
        de la app antes de publicar. Ver sección <em>Zonas seguras</em>.
      </Card>

      <Tabla
        columnas={['Formato','Resolución','Cuándo usarlo']}
        filas={[
          ['Feed 4:5', '1080×1350px', 'Primera publicación, productos, catálogo general'],
          ['Feed 1:1', '1080×1080px', 'Grid uniforme, catálogo de categorías'],
          ['Stories',  '1080×1920px', 'Promos urgentes, novedades, Reels'],
        ]}
      />
    </>
  ),

  'plantillas': () => (
    <>
      <P_txt>
        Hay tres plantillas de diseño disponibles. Cada una tiene una estructura visual diferente
        pensada para un objetivo de comunicación específico.
      </P_txt>

      <Card borde={P.naranja} titulo="✦ Producto Estrella" subtitulo="Para lanzar o destacar un producto específico">
        Muestra la imagen del producto en grande (cargada automáticamente desde Supabase Storage),
        el nombre del producto en tipografía llamativa, un subtítulo descriptivo y el precio.<br/><br/>
        Si el producto no tiene imagen cargada en el sistema, aparece un placeholder decorativo.
        Para aprovechar esta plantilla al máximo, el producto debe tener imagen en el módulo
        de Productos del admin.<br/><br/>
        <strong>Estructura visual:</strong> imagen → nombre → subtítulo → precio → CTA.
      </Card>

      <Card borde={P.verde} titulo="◈ Catálogo General" subtitulo="Para presentar PanFree a nuevas personas">
        Muestra las 4 categorías del catálogo (Panes, Dulces, Salados, Eventos) con descripción
        y precio de entrada de cada una. No requiere seleccionar un producto específico.<br/><br/>
        El texto principal tiene jerarquía de 4 líneas, pensado para el slogan de la marca.
        Es la plantilla con más información y la más recomendada como primera publicación
        para nuevos seguidores.<br/><br/>
        <strong>Estructura visual:</strong> pregunta → claim 4 líneas → 4 cards de categoría → CTA.
      </Card>

      <Card borde="#c89000" titulo="★ Promo / Oferta" subtitulo="Para generar urgencia de compra">
        Diseñada para comunicar descuentos, disponibilidad limitada o productos de temporada.
        Incluye una etiqueta de oferta personalizable arriba, el nombre del producto, precio
        en grande y badges de confianza (Sin Gluten, Sin TACC, Artesanal).<br/><br/>
        <strong>Estructura visual:</strong> badge oferta → nombre → texto → precio grande → badges → CTA.
      </Card>
    </>
  ),

  'textos': () => (
    <>
      <Subtitulo>Jerarquía tipográfica del texto principal</Subtitulo>
      <P_txt>
        El campo "Texto principal" acepta múltiples líneas separadas por Enter.
        Cada línea tiene un tamaño y color predefinido:
      </P_txt>

      <div style={{backgroundColor:P.gris,border:`1px solid ${P.dorado}40`,borderRadius:8,
                    padding:'1rem',marginBottom:'1rem',fontFamily:'monospace'}}>
        {[
          { linea:'El placer de',  nota:'Línea 1 · tamaño mediano · color base' },
          { linea:'volver a',      nota:'Línea 2 · tamaño grande · color naranja (énfasis)' },
          { linea:'COMER',         nota:'Línea 3 · tamaño muy grande · color base (impacto)' },
          { linea:'libremente.',   nota:'Línea 4 · tamaño grande · color dorado (cierre)' },
        ].map((r,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',
                                alignItems:'center',padding:'5px 8px',borderRadius:4,
                                marginBottom:3,backgroundColor:i%2===0?'#fff':'transparent'}}>
            <code style={{color:P.verde,fontWeight:700,fontSize:'0.88rem'}}>{r.linea}</code>
            <span style={{color:'#888',fontSize:'0.76rem'}}>{r.nota}</span>
          </div>
        ))}
      </div>

      <InfoBox color={P.verde}>
        Máximo 4 líneas recomendadas. Con más de 4 líneas la imagen se satura y pierde impacto.
        Menos texto = más impacto visual = más ventas.
      </InfoBox>

      <Subtitulo>Reglas de copywriting para PanFree</Subtitulo>
      <Lista items={[
        'Apelá a la emoción, no solo al producto: "volvé a disfrutar el pan" conecta más que "pan sin gluten disponible"',
        'La pregunta al inicio genera identificación: "¿Sos celíaco?" engancha a la persona correcta',
        'El precio siempre visible y en Guaraníes: G/ 25.000, no "desde veinte y cinco mil"',
        'El CTA debe ser una acción concreta: "Pedí hoy", "Escribinos por WhatsApp", no "Visitar sitio"',
        'Palabras que funcionan en este nicho: artesanal, casero, elaborado por pedido, sin TACC, sin gluten, hecho con amor',
        'Evitá poner demasiada información: una imagen, un mensaje, una acción',
      ]}/>

      <Subtitulo>Campo Subtítulo (plantilla Hero)</Subtitulo>
      <P_txt>
        En la plantilla Producto Estrella hay un campo "Subtítulo" que aparece debajo del nombre
        del producto. Usalo para los atributos del producto:
        "Artesanal · Sin Gluten · Sin TACC" o "Disponible toda la semana · Pedido anticipado".
      </P_txt>
    </>
  ),

  'hashtags': () => (
    <>
      <P_txt>
        Tenés dos estrategias para los hashtags. El generador te permite elegir cuál usar
        con un simple checkbox.
      </P_txt>

      <Card borde={P.verde} titulo="Opción A: Hashtags en la imagen" subtitulo="Cuándo usarla">
        Activando el checkbox "Incluir hashtags en la imagen", los hashtags se agregan en el
        footer inferior de la imagen. Útil cuando la imagen se comparte por WhatsApp o se guarda
        en galería, porque los hashtags viajan con la imagen.<br/><br/>
        <strong>Recomendación:</strong> usá máximo 6–8 hashtags en la imagen. Más de eso satura
        visualmente y reduce el impacto del diseño.
      </Card>

      <Card borde={P.naranja} titulo="Opción B: Hashtags solo en el caption" subtitulo="Estrategia recomendada en 2026">
        La imagen queda limpia y más profesional. En el caption de Instagram podés agregar
        hasta 30 hashtags sin que afecten la estética de la imagen. Esta es la práctica
        estándar de las marcas de alimentos de mayor engagement en América Latina.<br/><br/>
        <strong>Ventaja adicional:</strong> podés cambiar los hashtags en cada publicación
        sin regenerar la imagen.
      </Card>

      <Subtitulo>Hashtags sugeridos para PanFree:</Subtitulo>
      <Tabla
        columnas={['Categoría','Hashtags']}
        filas={[
          ['Marca propia',     '#PanFree  #PanFreeParaguay'],
          ['Condición',        '#SinGluten  #SinTACC  #Celiaco  #IntoleranciaAlGluten'],
          ['Producto',         '#PanSinGluten  #MasaSinGluten  #PanificadosSinGluten'],
          ['Geolocalización',  '#Encarnacion  #Paraguay  #Itapua  #EncarnacionParaguay'],
          ['Lifestyle',        '#PanArtesanal  #ComidaSaludable  #HechoEnCasa'],
          ['Logística',        '#DeliveryEncarnacion  #PedidosOnline'],
        ]}
      />
      <InfoBox color={P.dorado}>
        El hashtag <strong>#PanFree</strong> es tu hashtag de marca. Usalo siempre,
        en todas las publicaciones. Con el tiempo, cuando alguien lo busca, aparece
        todo el contenido de tu cuenta.
      </InfoBox>
    </>
  ),

  'zonas': () => (
    <>
      <P_txt>
        Instagram superpone elementos de su propia interfaz sobre las imágenes.
        Si el texto importante queda en esas zonas, queda tapado para el usuario.
        El generador respeta estas zonas automáticamente.
      </P_txt>

      <Tabla
        columnas={['Zona','Alto aprox.','Qué superpone Instagram','Cómo lo maneja PanFree']}
        filas={[
          ['Superior',        '~140px', 'Nombre de usuario, ubicación, botón "···"',  'Logo + tagline dentro del recuadro dorado superior'],
          ['Inferior Feed',   '~100px', 'Iconos de reacción, caption, comentarios',   'Footer con hashtags opcionales, zona de bajo impacto'],
          ['Inferior Stories','~20%',   'Sticker de link, barra de respuesta',        'Zona gris punteada como guía; el CTA naranja va arriba'],
          ['Laterales',       '~40px',  'Bordes del teléfono',                        'Márgenes internos en todos los elementos del diseño'],
        ]}
      />

      <Subtitulo>Sticker de link en Stories — preguntas frecuentes</Subtitulo>

      <Pregunta texto="¿Se puede mover el sticker de link?">
        Sí. En Stories y Reels, una vez que agregás el sticker de link dentro de la app
        de Instagram, podés arrastrarlo libremente a cualquier parte de la pantalla y
        también redimensionarlo. La zona gris punteada en la imagen generada indica
        únicamente dónde aparece <em>por defecto</em> si no lo movés.
      </Pregunta>

      <Pregunta texto="¿El sticker de link está disponible para todos?">
        Sí. Desde 2022, Instagram habilitó el sticker de link para todas las cuentas,
        independientemente del número de seguidores. Antes solo lo tenían cuentas verificadas
        o con más de 10.000 seguidores.
      </Pregunta>

      <Pregunta texto="¿El sticker de link funciona en publicaciones de Feed?">
        No. En publicaciones de Feed (cuadradas o 4:5), no existe sticker de link.
        El único link clickeable en Feed es el de la bio del perfil.
        Para enviar tráfico a panfree.fit desde el Feed, mencioná la URL en el caption:
        "Link en bio 👆" o "Entrá a panfree.fit".
      </Pregunta>

      <InfoBox color={P.verde} titulo="Regla de oro">
        El nombre del producto, el precio y el CTA siempre están en la zona central
        (entre el 15% y el 75% del alto de la imagen). El generador cumple esto
        automáticamente en todas las plantillas y formatos.
      </InfoBox>
    </>
  ),

  'exportar': () => (
    <>
      <Subtitulo>PNG vs JPG — ¿cuál elegir?</Subtitulo>
      <Tabla
        columnas={['Formato','Calidad','Peso aprox.','Cuándo usarlo']}
        filas={[
          ['PNG', 'Sin pérdida (lossless)', '2–4 MB', 'Siempre que sea posible · texto más nítido'],
          ['JPG 97%', 'Casi imperceptible', '400KB–1MB', 'Conexión lenta · compartir por WhatsApp'],
        ]}
      />
      <InfoBox color={P.dorado}>
        Instagram recomprime todas las imágenes que subís, sin importar el formato original.
        Por eso conviene siempre subir la mayor calidad posible (PNG o JPG al máximo).
        El generador produce imágenes a 1080px de ancho, que es exactamente el tamaño
        que Instagram espera para no reescalar.
      </InfoBox>

      <Subtitulo>Nombre del archivo exportado</Subtitulo>
      <P_txt>
        El archivo se descarga con el nombre: <code style={{backgroundColor:P.gris,padding:'2px 6px',borderRadius:4,fontSize:'0.85rem'}}>panfree_[slug-del-producto]_[ancho]x[alto].png</code><br/>
        Ejemplo: <code style={{backgroundColor:P.gris,padding:'2px 6px',borderRadius:4,fontSize:'0.85rem'}}>panfree_pan-de-miga-clasico_1080x1350.png</code>
      </P_txt>

      <Subtitulo>Cómo pasar la imagen al celular</Subtitulo>
      <Lista items={[
        'WhatsApp Web: enviarte la imagen a vos mismo por WhatsApp → descargar en el celular',
        'Google Drive / Dropbox: subir la imagen → abrirla en el celular y guardar',
        'Cable USB: conectar el celular a la PC y copiar el archivo a la galería',
        'AirDrop (Apple): si usás Mac + iPhone, la forma más rápida',
        'Email: adjuntar y enviarte a vos mismo (funciona, aunque más lento)',
      ]}/>

      <Subtitulo>Publicar en Instagram</Subtitulo>
      <div style={{display:'flex',flexDirection:'column',gap:'0'}}>
        {[
          { n:1, titulo:'Nueva publicación', desc:'Tocá el + en la barra inferior de Instagram.' },
          { n:2, titulo:'Seleccionar imagen', desc:'Buscá la imagen en tu galería. Si es Stories, elegí "Tu historia". Si es Feed, elegí "Publicación".' },
          { n:3, titulo:'Ajustar si es necesario', desc:'Instagram puede recortar la imagen. Asegurate de que el ratio sea el correcto (el generador ya lo produce al tamaño exacto).' },
          { n:4, titulo:'Escribir el caption', desc:'Acá van los hashtags, el texto adicional, la CTA y el link si es Feed. Máximo 2200 caracteres.' },
          { n:5, titulo:'Agregar sticker de link (solo Stories)', desc:'Tocá el ícono de stickers → Link → pegá la URL de panfree.fit o del producto específico.' },
          { n:6, titulo:'Publicar', desc:'Tocá "Compartir". La publicación aparece en el perfil y en el feed de tus seguidores.' },
        ].map(p=>(
          <PasoItem key={p.n} n={p.n} titulo={p.titulo} desc={p.desc}/>
        ))}
      </div>
    </>
  ),

  'mejores-practicas': () => (
    <>
      <Subtitulo>Consistencia de marca</Subtitulo>
      <Lista items={[
        'Usá el mismo esquema de color durante semanas o meses. La coherencia visual hace que tu perfil se reconozca de un vistazo.',
        'El logo siempre en la misma posición: arriba al centro. El generador lo respeta automáticamente.',
        'La misma tipografía en todas las imágenes: Segoe UI, ya integrada en el generador.',
        'Publicá con cadencia regular: 3–4 veces por semana rinde más que rafagas de 10 posts seguidos de silencio.',
        'Alternás tipos de contenido: producto estrella → catálogo → promo → producto estrella. No publiques 5 promos seguidas.',
      ]}/>

      <Subtitulo>Para la comunidad celíaca y sin TACC</Subtitulo>
      <Lista items={[
        'Este público tiene alta desconfianza hacia marcas nuevas. Mostrá siempre visualmente el sello Sin TACC o Sin Gluten en la imagen.',
        'Las palabras "artesanal" y "elaborado por pedido" generan más confianza que "disponible".',
        'Contá el proceso: "Lo hacemos nosotros en Encarnación" conecta más que un catálogo de precios.',
        'Los testimonios y reseñas de clientes generan el doble de engagement que las publicaciones de producto puro.',
        'Respondé siempre los comentarios con preguntas sobre ingredientes. Demuestra expertise y genera confianza.',
      ]}/>

      <Subtitulo>Algoritmo de Instagram en 2026</Subtitulo>
      <Lista items={[
        'Formato 4:5 tiene mayor alcance orgánico que 1:1 para cuentas con pocos seguidores.',
        'Reels con carátula atractiva tienen el mayor alcance de todos los formatos actualmente.',
        'Las primeras 3 palabras del caption son las más importantes — el algoritmo las usa para clasificar el contenido.',
        'Publicar en horario de audiencia local: 12:00–13:30 y 19:00–21:00 hora de Encarnación (UTC-4).',
        'Responder comentarios en las primeras 2 horas después de publicar dispara el alcance de forma significativa.',
        'Las publicaciones que generan "guardados" tienen el mayor peso en el algoritmo. Contenido útil (listas de recetas, info nutricional) se guarda más.',
      ]}/>

      <Subtitulo>Cadencia sugerida para PanFree</Subtitulo>
      <Tabla
        columnas={['Día','Tipo de contenido','Plantilla sugerida']}
        filas={[
          ['Lunes',    'Producto de la semana',   'Producto Estrella · 4:5'],
          ['Miércoles','Catálogo completo',        'Catálogo General · 4:5'],
          ['Viernes',  'Promo o novedad',          'Promo/Oferta · Stories'],
          ['Domingo',  'Recordatorio delivery',    'Producto Estrella · 1:1'],
        ]}
      />

      <InfoBox color={P.naranja} titulo="El activo más valioso: la comunidad">
        Un seguidor celíaco que encuentra una panadería confiable se convierte en cliente
        recurrente de por vida. La constancia en Instagram construye esa confianza antes
        de que la persona haga el primer pedido. Cada imagen bien hecha es una inversión
        en esa relación.
      </InfoBox>
    </>
  ),
}

// ─── COMPONENTES UI DE LA GUÍA ────────────────────────────────────────────────
function P_txt({ children }) {
  return <p style={{fontSize:'0.88rem',color:'#444',lineHeight:1.7,margin:'0 0 0.85rem'}}>{children}</p>
}

function Subtitulo({ children }) {
  return <h3 style={{fontSize:'0.92rem',fontWeight:700,color:P.verde,
                      margin:'1.25rem 0 0.45rem',borderLeft:`3px solid ${P.dorado}`,
                      paddingLeft:'0.6rem'}}>{children}</h3>
}

function Lista({ items }) {
  return (
    <ul style={{paddingLeft:'1.15rem',margin:'0 0 0.85rem'}}>
      {items.map((item,i)=>(
        <li key={i} style={{fontSize:'0.85rem',color:'#444',lineHeight:1.65,marginBottom:'0.3rem'}}>
          {item}
        </li>
      ))}
    </ul>
  )
}

function InfoBox({ children, color=P.verde, titulo }) {
  const {r,g,b} = {
    [P.verde]:  {r:51,g:76,b:43},
    [P.naranja]:{r:244,g:110,b:21},
    [P.dorado]: {r:183,g:153,b:107},
  }[color] || {r:51,g:76,b:43}
  return (
    <div style={{backgroundColor:`rgba(${r},${g},${b},0.07)`,
                  borderLeft:`3px solid ${color}`,borderRadius:'0 8px 8px 0',
                  padding:'0.7rem 0.9rem',margin:'0.75rem 0 1rem'}}>
      {titulo&&<div style={{fontSize:'0.82rem',fontWeight:700,color,marginBottom:'0.3rem'}}>{titulo}</div>}
      <div style={{fontSize:'0.84rem',color:'#444',lineHeight:1.6}}>{children}</div>
    </div>
  )
}

function Card({ children, borde, titulo, subtitulo }) {
  return (
    <div style={{backgroundColor:P.gris,border:`1px solid ${borde}30`,
                  borderLeft:`3px solid ${borde}`,borderRadius:'0 8px 8px 0',
                  padding:'0.85rem 1rem',marginBottom:'0.75rem'}}>
      <div style={{fontSize:'0.92rem',fontWeight:700,color:P.verde,marginBottom:'0.2rem'}}>{titulo}</div>
      {subtitulo&&<div style={{fontSize:'0.76rem',fontWeight:600,color:borde,marginBottom:'0.45rem'}}>{subtitulo}</div>}
      <div style={{fontSize:'0.84rem',color:'#444',lineHeight:1.65}}>{children}</div>
    </div>
  )
}

function Tabla({ columnas, filas }) {
  return (
    <div style={{overflowX:'auto',margin:'0.5rem 0 1rem'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.82rem'}}>
        <thead>
          <tr>
            {columnas.map((c,i)=>(
              <th key={i} style={{backgroundColor:P.verde,color:P.crema,
                                   padding:'7px 10px',textAlign:'left',
                                   fontSize:'0.78rem',fontWeight:700}}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila,i)=>(
            <tr key={i} style={{backgroundColor:i%2===0?'#fdfbf8':'#fff'}}>
              {fila.map((cel,j)=>(
                <td key={j} style={{padding:'7px 10px',
                                     borderBottom:'1px solid #e8e0d4',
                                     color:'#444',verticalAlign:'top',
                                     fontWeight:j===0?600:400}}>
                  {cel}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PasoItem({ n, titulo, desc }) {
  return (
    <div style={{display:'flex',gap:'0.85rem',alignItems:'flex-start',
                  padding:'0.7rem 0',borderBottom:'1px solid #ede5d8'}}>
      <div style={{minWidth:28,height:28,borderRadius:'50%',
                    backgroundColor:P.verde,color:P.crema,
                    fontSize:'0.78rem',fontWeight:700,flexShrink:0,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    marginTop:2}}>
        {n}
      </div>
      <div>
        <div style={{fontSize:'0.88rem',fontWeight:700,color:P.verde,marginBottom:'0.15rem'}}>
          {titulo}
        </div>
        <div style={{fontSize:'0.83rem',color:'#555',lineHeight:1.6}}>
          {desc}
        </div>
      </div>
    </div>
  )
}

function Pregunta({ texto, children }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div style={{border:`1px solid ${P.dorado}40`,borderRadius:8,
                  marginBottom:'0.5rem',overflow:'hidden'}}>
      <button
        onClick={()=>setAbierto(v=>!v)}
        style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',
                padding:'0.7rem 0.9rem',background:'none',border:'none',cursor:'pointer',
                fontFamily:'inherit',textAlign:'left'}}>
        <span style={{fontSize:'0.88rem',fontWeight:600,color:P.verde}}>{texto}</span>
        <span style={{color:P.dorado,fontSize:'1rem',flexShrink:0,marginLeft:'0.5rem'}}>
          {abierto?'▲':'▼'}
        </span>
      </button>
      {abierto&&(
        <div style={{padding:'0 0.9rem 0.8rem',fontSize:'0.84rem',
                      color:'#444',lineHeight:1.65,borderTop:`1px solid ${P.dorado}20`}}>
          <div style={{paddingTop:'0.65rem'}}>{children}</div>
        </div>
      )}
    </div>
  )
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function AyudaMarketing() {
  const router = useRouter()
  const [secActiva, setSecActiva] = useState('que-es')

  const seccion    = SECCIONES.find(s=>s.id===secActiva)
  const Contenido  = CONTENIDOS[secActiva]

  const S = {
    page:    { minHeight:'100vh', backgroundColor:P.gris, fontFamily:'"Segoe UI",sans-serif' },
    header:  { backgroundColor:P.verde, color:P.crema, padding:'0.85rem 1.5rem',
                display:'flex', justifyContent:'space-between', alignItems:'center',
                borderBottom:`3px solid ${P.dorado}` },
    body:    { display:'grid', gridTemplateColumns:'250px 1fr', minHeight:'calc(100vh - 62px)' },
    nav:     { backgroundColor:'#fff', borderRight:`2px solid #e0d5c5`,
                overflowY:'auto', padding:'1rem 0' },
    content: { overflowY:'auto', padding:'2rem' },
    navItem: (activo) => ({
      display:'flex', alignItems:'center', gap:'0.6rem',
      padding:'0.6rem 1rem', cursor:'pointer', border:'none',
      backgroundColor: activo ? P.verde : 'transparent',
      color: activo ? P.crema : '#555',
      fontFamily:'inherit', fontSize:'0.85rem',
      fontWeight: activo ? 700 : 400,
      textAlign:'left', width:'100%',
      borderLeft: activo ? `3px solid ${P.dorado}` : '3px solid transparent',
      transition:'all 0.12s',
    }),
    navIcn:  { fontSize:'1rem', flexShrink:0 },
    contentInner:{ maxWidth:760, margin:'0 auto' },
    tituloSec:{ fontSize:'1.3rem', fontWeight:800, color:P.verde,
                 marginBottom:'0.3rem' },
    subtSec: { fontSize:'0.84rem', color:'#888', marginBottom:'1.5rem',
                borderBottom:`2px solid ${P.dorado}`, paddingBottom:'0.85rem' },
    backBtn: { background:'none', border:`1px solid ${P.dorado}50`, color:P.crema,
                padding:'0.3rem 0.75rem', borderRadius:6, cursor:'pointer',
                fontFamily:'inherit', fontSize:'0.82rem' },
    genBtn:  { backgroundColor:P.naranja, border:'none', color:P.blanco,
                padding:'0.3rem 0.85rem', borderRadius:6, cursor:'pointer',
                fontFamily:'inherit', fontSize:'0.82rem', fontWeight:700 },
    navGrupo:{ fontSize:'0.68rem', fontWeight:700, color:P.dorado,
                textTransform:'uppercase', letterSpacing:'0.1em',
                padding:'0.75rem 1rem 0.25rem' },
  }

  return (
    <div style={S.page}>

      {/* HEADER */}
      <div style={S.header}>
        <div style={{display:'flex',alignItems:'center',gap:'0.85rem'}}>
          <button onClick={()=>router.push('/admin/ayuda')} style={S.backBtn}>← Ayuda</button>
          <div>
            <div style={{fontWeight:800,fontSize:'1rem'}}>📸 Guía · Generador Instagram</div>
            <div style={{fontSize:'0.73rem',color:P.dorado,opacity:0.85}}>
              Marketing · imágenes publicitarias para Instagram
            </div>
          </div>
        </div>
        <button onClick={()=>router.push('/admin/marketing')} style={S.genBtn}>
          Ir al generador →
        </button>
      </div>

      {/* BODY */}
      <div style={S.body}>

        {/* ── NAVEGACIÓN ── */}
        <nav style={S.nav}>
          <div style={S.navGrupo}>Contenidos</div>
          {SECCIONES.map(sec=>(
            <button
              key={sec.id}
              onClick={()=>setSecActiva(sec.id)}
              style={S.navItem(secActiva===sec.id)}
            >
              <span style={S.navIcn}>{sec.icono}</span>
              <span>{sec.titulo}</span>
            </button>
          ))}

          {/* Separador + link al generador */}
          <div style={{margin:'1rem 1rem 0',borderTop:`1px solid ${P.dorado}30`,paddingTop:'0.75rem'}}>
            <button
              onClick={()=>router.push('/admin/marketing')}
              style={{width:'100%',padding:'0.6rem',backgroundColor:P.naranja,
                       color:P.blanco,border:'none',borderRadius:6,
                       fontFamily:'inherit',fontSize:'0.83rem',fontWeight:700,
                       cursor:'pointer'}}>
              📸 Abrir generador
            </button>
          </div>
        </nav>

        {/* ── CONTENIDO ── */}
        <div style={S.content}>
          <div style={S.contentInner}>

            {/* Título de sección */}
            <div style={S.tituloSec}>
              {seccion?.icono} {seccion?.titulo}
            </div>
            <div style={S.subtSec}>{seccion?.subtitulo}</div>

            {/* Contenido dinámico */}
            {Contenido && <Contenido/>}

            {/* Navegación entre secciones */}
            <div style={{display:'flex',justifyContent:'space-between',
                          marginTop:'2rem',paddingTop:'1rem',
                          borderTop:`1px solid ${P.dorado}30`}}>
              {(() => {
                const idx=SECCIONES.findIndex(s=>s.id===secActiva)
                const prev=SECCIONES[idx-1], next=SECCIONES[idx+1]
                return (
                  <>
                    <div>
                      {prev&&(
                        <button onClick={()=>setSecActiva(prev.id)}
                          style={{background:'none',border:`1px solid ${P.dorado}50`,
                                   color:P.verde,padding:'0.4rem 0.85rem',borderRadius:6,
                                   cursor:'pointer',fontFamily:'inherit',fontSize:'0.83rem'}}>
                          ← {prev.icono} {prev.titulo}
                        </button>
                      )}
                    </div>
                    <div>
                      {next&&(
                        <button onClick={()=>setSecActiva(next.id)}
                          style={{backgroundColor:P.verde,border:'none',color:P.crema,
                                   padding:'0.4rem 0.85rem',borderRadius:6,
                                   cursor:'pointer',fontFamily:'inherit',fontSize:'0.83rem',fontWeight:600}}>
                          {next.icono} {next.titulo} →
                        </button>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}