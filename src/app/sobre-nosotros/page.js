/**
 * 📁 UBICACIÓN: src/app/sobre-nosotros/page.js
 * 📅 ACTUALIZADO: 2026-08-17
 * 📌 DESCRIPCIÓN: Página "Sobre Nosotros" de PanFree.
 *    Historia real basada en el pitch ganador de Bolt Emprende 2025.
 *    Diseño sobrio, profesional, sin emojis ni imágenes genéricas.
 */

import { WheatOff, ShieldCheck, Heart, Leaf, Award, Truck, TrendingUp, Medal, Users, Building2 } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Sobre Nosotros | PanFree — Panadería Sin Gluten',
  description: 'Conocé la historia real de PanFree, ganadores de Bolt Emprende 2025. Un emprendimiento familiar que devuelve el placer de comer libremente a los celíacos en Paraguay.',
}

export default function SobreNosotros() {
  return (
    <main style={{
      backgroundColor: '#eee6d9',
      fontFamily: '"Segoe UI", system-ui, sans-serif',
      color: '#333',
      lineHeight: 1.7,
      paddingBottom: '3rem',
    }}>

      {/* ============================================================ */}
      {/* 1. HERO */}
      {/* ============================================================ */}
      <section style={{
        backgroundColor: '#334c2b',
        color: '#eee6d9',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        borderBottom: '4px solid #b7996b',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#f46e15',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '1rem',
          }}>
            <WheatOff size={14} />
            <span>100% Sin Gluten</span>
          </div>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 2.8rem)',
            fontWeight: 800,
            margin: '0.5rem 0 0.75rem',
            color: '#eee6d9',
            letterSpacing: '-0.5px',
          }}>
            El placer de volver a comer libremente
          </h1>
          <p style={{
            fontSize: '1.05rem',
            color: '#d0c5b4',
            maxWidth: '580px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Un emprendimiento familiar que nació de una promesa. Con el apoyo de <strong style={{ color: '#f46e15' }}>Bolt Emprende 2025</strong>, llevamos seguridad y sabor a los celíacos en Paraguay.
          </p>
          <div style={{
            marginTop: '1.25rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(183,153,107,0.3)',
            padding: '0.4rem 1rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#b7996b',
          }}>
            <Medal size={16} color="#f46e15" />
            <span>Ganadores de <strong style={{ color: '#eee6d9' }}>Bolt Emprende 2025</strong></span>
            <a
              href="https://boltemprende.com.py/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#f46e15',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                marginLeft: '0.2rem',
              }}
            >
              [Ver programa]
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. LA HISTORIA REAL */}
      {/* ============================================================ */}
      <section style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '3rem 1.5rem',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2.5rem',
          alignItems: 'flex-start',
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f9f5f0',
              border: '1px solid #b7996b',
              padding: '2px 12px',
              borderRadius: '12px',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#334c2b',
              marginBottom: '1rem',
            }}>
              <Heart size={12} color="#f46e15" />
              <span>Historia real</span>
            </div>
            <h2 style={{
              color: '#334c2b',
              fontSize: '1.7rem',
              fontWeight: 700,
              marginTop: 0,
              lineHeight: 1.2,
            }}>
              ¿Cómo puede ser que comer sea un riesgo?
            </h2>
            <p style={{ color: '#555', fontSize: '1rem' }}>
              <strong>Mi hermana es celíaca.</strong> Durante mucho tiempo vimos lo difícil que era para ella conseguir alimentos con sabor. Le encanta la chipa piru, pero el riesgo de contaminación cruzada muchas veces la enfermó. <strong>Hasta que decidimos cambiar eso.</strong>
            </p>
            <p style={{ color: '#555', fontSize: '1rem', marginTop: '0.75rem' }}>
              La falta de opciones seguras implica un <strong>riesgo constante</strong>, gastos médicos elevados y, lo más triste, una <strong>exclusión social</strong> involuntaria. Situaciones cotidianas como compartir una pizza o una ronda de empanadas se vuelven incómodas para quienes viven con celiaquía.
            </p>
          </div>

          {/* Bloque de datos */}
          <div style={{
            backgroundColor: '#fdfbf8',
            border: '2px solid #b7996b',
            borderRadius: '8px',
            padding: '1.75rem 1.5rem',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#b7996b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '0.5rem',
            }}>
              En Paraguay
            </p>
            <div style={{
              fontSize: '2.8rem',
              fontWeight: 800,
              color: '#334c2b',
              lineHeight: 1,
            }}>
              60.000+
            </div>
            <p style={{
              color: '#555',
              fontSize: '0.9rem',
              margin: '0.25rem 0 0.75rem',
            }}>
              Personas diagnosticadas con celiaquía
            </p>
            <div style={{
              width: '40%',
              height: '1px',
              backgroundColor: '#b7996b',
              margin: '0.75rem auto',
            }} />
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#f46e15',
            }}>
              5.000 – 6.000
            </div>
            <p style={{
              color: '#555',
              fontSize: '0.9rem',
              margin: '0.25rem 0 0',
            }}>
              Solo en <strong>Encarnación</strong>
            </p>
            <p style={{
              color: '#888',
              fontSize: '0.7rem',
              marginTop: '0.5rem',
            }}>
              Fuente: Ministerio de Salud
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. EL ORIGEN Y PROPÓSITO */}
      {/* ============================================================ */}
      <section style={{
        backgroundColor: '#fdfbf8',
        borderTop: '2px solid #e0d5c5',
        borderBottom: '2px solid #e0d5c5',
        padding: '3rem 1.5rem',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.5rem',
          }}>
            <div style={{
              backgroundColor: '#fff',
              padding: '1.25rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid #e0d5c5',
              textAlign: 'center',
            }}>
              <Heart size={28} color="#f46e15" style={{ marginBottom: '0.35rem' }} />
              <h3 style={{ color: '#334c2b', fontSize: '1rem', margin: 0, fontWeight: 700 }}>Una promesa familiar</h3>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
                Devolver a mi hermana, y a miles de paraguayos, la posibilidad de comer sin miedo.
              </p>
            </div>
            <div style={{
              backgroundColor: '#fff',
              padding: '1.25rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid #e0d5c5',
              textAlign: 'center',
            }}>
              <Award size={28} color="#f46e15" style={{ marginBottom: '0.35rem' }} />
              <h3 style={{ color: '#334c2b', fontSize: '1rem', margin: 0, fontWeight: 700 }}>Bolt Emprende 2025</h3>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
                Reconocimiento al impacto social y viabilidad del negocio.
              </p>
            </div>
            <div style={{
              backgroundColor: '#fff',
              padding: '1.25rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid #e0d5c5',
              textAlign: 'center',
            }}>
              <TrendingUp size={28} color="#f46e15" style={{ marginBottom: '0.35rem' }} />
              <h3 style={{ color: '#334c2b', fontSize: '1rem', margin: 0, fontWeight: 700 }}>70% de conversión</h3>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
                En pruebas piloto con ventas reales antes del lanzamiento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. EL EQUIPO */}
      {/* ============================================================ */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h2 style={{
          color: '#334c2b',
          fontSize: '1.6rem',
          fontWeight: 700,
          textAlign: 'center',
          marginTop: 0,
          marginBottom: '0.5rem',
        }}>
          El equipo
        </h2>
        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '2rem',
          fontSize: '0.95rem',
        }}>
          Un matrimonio comprometido con la calidad y el crecimiento.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '2px solid #e0d5c5',
            padding: '1.5rem',
            textAlign: 'center',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#f9f5f0',
              border: '2px solid #b7996b',
              margin: '0 auto 0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '2rem', fontWeight: 300, color: '#334c2b' }}>L</span>
            </div>
            <h3 style={{ color: '#334c2b', fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>Luciana</h3>
            <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.1rem 0 0.5rem' }}>Producción</p>
            <div style={{
              display: 'inline-block',
              backgroundColor: '#f9f5f0',
              border: '1px solid #b7996b',
              borderRadius: '12px',
              padding: '0.15rem 0.7rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#334c2b',
            }}>
              <ShieldCheck size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Certificada SNPP
            </div>
            <p style={{ color: '#555', fontSize: '0.82rem', marginTop: '0.5rem' }}>
              Encargada de la producción y de asegurar calidad certificada.
            </p>
          </div>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '2px solid #e0d5c5',
            padding: '1.5rem',
            textAlign: 'center',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#f9f5f0',
              border: '2px solid #b7996b',
              margin: '0 auto 0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '2rem', fontWeight: 300, color: '#334c2b' }}>P</span>
            </div>
            <h3 style={{ color: '#334c2b', fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>Pedro</h3>
            <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.1rem 0 0.5rem' }}>Estrategia & Crecimiento</p>
            <div style={{
              display: 'inline-block',
              backgroundColor: '#f9f5f0',
              border: '1px solid #b7996b',
              borderRadius: '12px',
              padding: '0.15rem 0.7rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#334c2b',
            }}>
              <TrendingUp size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Marketing Gastronómico (SNPP)
            </div>
            <p style={{ color: '#555', fontSize: '0.82rem', marginTop: '0.5rem' }}>
              Enfocado en la estrategia y el crecimiento comercial.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. NEGOCIOS EN MARCHA */}
      {/* ============================================================ */}
      <section style={{
        backgroundColor: '#f9f5f0',
        borderTop: '2px solid #b7996b',
        borderBottom: '2px solid #b7996b',
        padding: '3rem 1.5rem',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            color: '#334c2b',
            fontSize: '1.6rem',
            fontWeight: 700,
            textAlign: 'center',
            marginTop: 0,
            marginBottom: '0.5rem',
          }}>
            Un negocio en marcha
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#666',
            marginBottom: '2rem',
            fontSize: '0.95rem',
          }}>
            No somos una idea, somos un negocio real con proyección y crecimiento.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            <div style={{
              backgroundColor: '#fff',
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #e0d5c5',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <Building2 size={20} color="#b7996b" />
              <div>
                <div style={{ fontWeight: 700, color: '#334c2b', fontSize: '0.9rem' }}>Supermercado</div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>Negociación en marcha</div>
              </div>
            </div>
            <div style={{
              backgroundColor: '#fff',
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #e0d5c5',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <Truck size={20} color="#b7996b" />
              <div>
                <div style={{ fontWeight: 700, color: '#334c2b', fontSize: '0.9rem' }}>Cafetería</div>
                <div style={{ fontSize: '0.75rem', color: '#2e7d32' }}>✅ Ventas realizadas</div>
              </div>
            </div>
            <div style={{
              backgroundColor: '#fff',
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #e0d5c5',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <Building2 size={20} color="#b7996b" />
              <div>
                <div style={{ fontWeight: 700, color: '#334c2b', fontSize: '0.9rem' }}>Hotel</div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>Negociación en marcha</div>
              </div>
            </div>
            <div style={{
              backgroundColor: '#fff',
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #e0d5c5',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <Building2 size={20} color="#b7996b" />
              <div>
                <div style={{ fontWeight: 700, color: '#334c2b', fontSize: '0.9rem' }}>Local gastronómico</div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>Negociación en marcha</div>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '1.5rem',
            backgroundColor: '#334c2b',
            color: '#eee6d9',
            padding: '1.25rem',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
              Proyección: alcanzar el punto de equilibrio y proyectar <strong style={{ color: '#f46e15' }}>USD 300</strong> de utilidad mensual en el primer trimestre.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. CERTIFICACIÓN OFICIAL */}
      {/* ============================================================ */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#f9f5f0',
            border: '1px solid #b7996b',
            padding: '2px 12px',
            borderRadius: '12px',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: '#334c2b',
            marginBottom: '0.75rem',
          }}>
            <ShieldCheck size={12} color="#334c2b" />
            <span>Certificación Oficial</span>
          </div>
          <h2 style={{
            color: '#334c2b',
            fontSize: '1.4rem',
            fontWeight: 700,
            marginTop: 0,
            marginBottom: '0.5rem',
          }}>
            Símbolo Nacional SIN GLUTEN de Paraguay
          </h2>
          <p style={{
            color: '#555',
            maxWidth: '600px',
            margin: '0 auto 1.25rem',
            fontSize: '0.95rem',
          }}>
            PanFree cumple con la <strong>Ley N° 3109/2006</strong> y su actualización <strong>Ley N° 6072/2018</strong>, que adoptan el símbolo nacional SIN GLUTEN de Paraguay, oficializado mediante el <strong>Decreto 7553/2022</strong>.
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '1rem',
          }}>
            <div style={{
              backgroundColor: '#fff',
              border: '2px solid #b7996b',
              borderRadius: '8px',
              padding: '0.6rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <img
                src="/images/simbolo-dinapi-sin-gluten.png"
                alt="Símbolo Nacional SIN GLUTEN - Paraguay"
                style={{ height: '36px', width: 'auto' }}
              />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, color: '#334c2b', fontSize: '0.82rem' }}>Sello Oficial</div>
                <div style={{ fontSize: '0.68rem', color: '#888' }}>Reconocido por el Estado Paraguayo</div>
              </div>
            </div>
            <a
              href="https://www.dinapi.gov.py/portal/v3/noticias/detalle-noticia?idNoticia=261"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#334c2b',
                color: '#eee6d9',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Ver en DINAPI</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. CTA FINAL */}
      {/* ============================================================ */}
      <section style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        borderTop: '1px solid #e0d5c5',
      }}>
        <h2 style={{
          color: '#334c2b',
          fontSize: '1.4rem',
          fontWeight: 700,
          marginTop: 0,
          marginBottom: '0.5rem',
        }}>
          El placer de volver a comer libremente
        </h2>
        <p style={{
          color: '#666',
          marginBottom: '1.5rem',
          fontSize: '0.95rem',
        }}>
          Hacé tu pedido y descubrí el sabor de la panadería sin gluten hecha con amor y certificación.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
          <Link
            href="/"
            style={{
              backgroundColor: '#f46e15',
              color: '#fff',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Ver Catálogo →
          </Link>
          <a
            href="https://wa.me/595984589845"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: 'transparent',
              color: '#334c2b',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
              border: '2px solid #b7996b',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Pedir por WhatsApp
          </a>
        </div>
      </section>

    </main>
  )
}