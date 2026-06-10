import { createClient } from '@/lib/supabase/server'
import { Users, Dumbbell, ChevronRight, Clock, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function ProfesorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profesor } = await supabase
    .from('profesores').select('*').eq('user_id', user!.id).single()

  const [{ data: misAlumnos }, { count: totalRutinas }, { data: ultimasRutinas }] = await Promise.all([
    supabase.from('alumnos').select('id, nombre, apellido, objetivo, created_at').eq('profesor_id', profesor?.id ?? '').order('created_at', { ascending: false }),
    supabase.from('rutinas').select('*', { count: 'exact', head: true }).eq('created_by', user!.id),
    supabase.from('rutinas').select('id, nombre, objetivo, dias_por_semana, updated_at, created_at').eq('created_by', user!.id).order('updated_at', { ascending: false }).limit(5),
  ])

  const alumnosCount = misAlumnos?.length ?? 0
  const rutinasCount = totalRutinas ?? 0

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const today = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })

  const card: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    overflow: 'hidden',
  }
  const cardHeader: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Page header */}
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          {saludo}, {profesor?.nombre ?? 'Profesor'}
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--t2)', marginTop: 5 }}>{today}</div>
      </div>

      {/* KPI stats */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Link href="/profesor/alumnos" style={{ textDecoration: 'none' }}>
          <div className="card-hover" style={{ ...card, padding: '20px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mis alumnos</div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(96,165,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users style={{ width: 16, height: 16, color: '#60a5fa' } as React.CSSProperties} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{alumnosCount}</div>
            <div style={{ fontSize: 11.5, color: alumnosCount > 0 ? '#4ade80' : 'var(--t3)', marginTop: 7, fontWeight: 500 }}>
              {alumnosCount > 0 ? `${alumnosCount} asignado${alumnosCount !== 1 ? 's' : ''}` : 'Sin alumnos aún'}
            </div>
          </div>
        </Link>
        <Link href="/profesor/rutinas" style={{ textDecoration: 'none' }}>
          <div className="card-hover" style={{ ...card, padding: '20px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rutinas creadas</div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(251,146,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Dumbbell style={{ width: 16, height: 16, color: '#fb923c' } as React.CSSProperties} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{rutinasCount}</div>
            <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 7, fontWeight: 500 }}>
              {rutinasCount > 0 ? `${rutinasCount} plan${rutinasCount !== 1 ? 'es' : ''} activo${rutinasCount !== 1 ? 's' : ''}` : 'Sin rutinas aún'}
            </div>
          </div>
        </Link>
      </div>

      {/* Content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Mis alumnos */}
        <div style={card}>
          <div style={cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users style={{ width: 14, height: 14, color: '#60a5fa' } as React.CSSProperties} />
              </div>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)' }}>Mis alumnos</span>
            </div>
            <Link href="/profesor/alumnos" className="link-hover" style={{ fontSize: 12.5, color: 'var(--t3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              Ver todos <ChevronRight style={{ width: 12, height: 12 } as React.CSSProperties} />
            </Link>
          </div>
          {!misAlumnos?.length ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Users style={{ width: 32, height: 32, color: 'var(--t3)', margin: '0 auto 10px', display: 'block' } as React.CSSProperties} />
              <div style={{ fontSize: 13.5, color: 'var(--t2)', fontWeight: 500 }}>Sin alumnos asignados</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>El admin te asignará alumnos pronto.</div>
            </div>
          ) : (
            <div>
              {misAlumnos.slice(0, 6).map((alumno, i) => (
                <div key={alumno.id} className="row-hover" style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px',
                  borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10.5, fontWeight: 700, color: '#60a5fa',
                  }}>
                    {alumno.nombre[0]}{alumno.apellido[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {alumno.nombre} {alumno.apellido}
                    </div>
                    {alumno.objetivo && (
                      <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alumno.objetivo}</div>
                    )}
                  </div>
                </div>
              ))}
              {(misAlumnos.length > 6) && (
                <div style={{ padding: '10px 20px', fontSize: 12, color: 'var(--t3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  +{misAlumnos.length - 6} más
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rutinas recientes */}
        <div style={card}>
          <div style={cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(251,146,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Dumbbell style={{ width: 14, height: 14, color: '#fb923c' } as React.CSSProperties} />
              </div>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)' }}>Rutinas recientes</span>
            </div>
            <Link href="/profesor/rutinas" className="link-hover" style={{ fontSize: 12.5, color: 'var(--t3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              Ver todas <ChevronRight style={{ width: 12, height: 12 } as React.CSSProperties} />
            </Link>
          </div>
          {!ultimasRutinas?.length ? (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <Dumbbell style={{ width: 32, height: 32, color: 'var(--t3)', margin: '0 auto 10px', display: 'block' } as React.CSSProperties} />
              <div style={{ fontSize: 13.5, color: 'var(--t2)', fontWeight: 500, marginBottom: 14 }}>No creaste rutinas aún</div>
              <Link href="/profesor/rutinas?new=true" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(170,255,0,0.08)', border: '1px solid rgba(170,255,0,0.2)',
                color: 'var(--primary)', fontSize: 12.5, fontWeight: 600,
                padding: '8px 16px', borderRadius: 8, textDecoration: 'none',
              }}>
                <Plus style={{ width: 13, height: 13 } as React.CSSProperties} /> Crear primera rutina
              </Link>
            </div>
          ) : (
            <div>
              {ultimasRutinas.map((rutina, i) => (
                <div key={rutina.id} className="row-hover" style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px',
                  borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(251,146,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Dumbbell style={{ width: 13, height: 13, color: '#fb923c' } as React.CSSProperties} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rutina.nombre}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 1 }}>{rutina.dias_por_semana}x semana</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--t3)', flexShrink: 0 }}>
                    <Clock style={{ width: 11, height: 11 } as React.CSSProperties} />
                    {formatDistanceToNow(new Date(rutina.updated_at), { locale: es, addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[
          { label: 'Nueva rutina',    sub: 'Crear plan de entrenamiento', href: '/profesor/rutinas?new=true', Icon: Dumbbell, iconColor: '#fb923c', iconBg: 'rgba(251,146,60,0.1)' },
          { label: 'Ver mis alumnos', sub: `${alumnosCount} asignados`,    href: '/profesor/alumnos',          Icon: Users,   iconColor: '#60a5fa', iconBg: 'rgba(96,165,250,0.1)'  },
        ].map(({ label, sub, href, Icon, iconColor, iconBg }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div className="card-hover" style={{
              ...card, padding: '16px 18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 15, height: 15, color: iconColor } as React.CSSProperties} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--t1)' }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{sub}</div>
              </div>
              <ArrowRight style={{ width: 14, height: 14, color: 'var(--t3)', flexShrink: 0 } as React.CSSProperties} />
            </div>
          </Link>
        ))}
      </div>

    </div>
  )
}
