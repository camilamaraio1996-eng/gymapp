import { createClient } from '@/lib/supabase/server'
import { ClipboardList, UserCheck, Target, ChevronRight, Dumbbell, Zap, TrendingUp, History, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function AlumnoHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: alumno }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user!.id).single(),
    supabase.from('alumnos').select('*, profesor:profesores(nombre, apellido, especialidad)').eq('user_id', user!.id).single(),
  ])

  const { data: asignaciones } = await supabase
    .from('asignaciones')
    .select('*, rutina:rutinas(nombre, objetivo, dias_por_semana, ejercicios(*))')
    .eq('alumno_id', alumno?.id ?? '')
    .eq('activa', true)
    .limit(3)

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const nombre = profile?.nombre ?? user?.user_metadata?.nombre ?? 'Atleta'
  const today = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })

  type ProfesorData = { nombre: string; apellido: string; especialidad?: string }
  const prof = alumno?.profesor as ProfesorData | undefined

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

  const proximosModulos = [
    { label: 'Entrenar',    icon: Zap,           desc: 'Registrá tu sesión de hoy' },
    { label: 'Historial',   icon: History,        desc: 'Ver entrenamientos pasados' },
    { label: 'Mi progreso', icon: TrendingUp,     desc: 'Estadísticas y evolución' },
    { label: 'Mensajes',    icon: MessageSquare,  desc: 'Hablar con tu profesor' },
  ]

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Page header */}
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          {saludo}, {nombre}
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--t2)', marginTop: 5 }}>{today}</div>
      </div>

      {/* Active routine CTA */}
      {!!asignaciones?.length && (() => {
        const rutina = asignaciones[0].rutina as { nombre: string; dias_por_semana: number; ejercicios: unknown[] }
        return (
          <Link href="/alumno/rutinas" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--primary)', borderRadius: 14,
              padding: '22px 24px', cursor: 'pointer',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  Listo para entrenar
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#000', marginBottom: 14, letterSpacing: '-0.01em' }}>
                  {rutina?.nombre ?? 'Mi rutina'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(0,0,0,0.12)', color: '#000',
                    fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 8,
                  }}>
                    <Zap style={{ width: 13, height: 13 }} />
                    Empezar ahora
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', fontWeight: 500 }}>
                    {rutina?.dias_por_semana}x semana · {(rutina?.ejercicios as unknown[])?.length ?? 0} ejercicios
                  </span>
                </div>
              </div>
              <Zap style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', width: 72, height: 72, color: '#000', opacity: 0.07 }} />
            </div>
          </Link>
        )
      })()}

      {/* Info row */}
      {(alumno?.objetivo || prof) && (
        <div className="info-row">
          {alumno?.objetivo && (
            <div style={{ ...card, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(170,255,0,0.1)', border: '1px solid rgba(170,255,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Target style={{ width: 15, height: 15, color: 'var(--primary)' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Objetivo</div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--t1)', marginTop: 3 }}>{alumno.objetivo}</div>
              </div>
            </div>
          )}
          {prof && (
            <div style={{ ...card, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#60a5fa', flexShrink: 0,
              }}>
                {prof.nombre[0]}{prof.apellido[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Profesor</div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--t1)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {prof.nombre} {prof.apellido}
                </div>
              </div>
              <UserCheck style={{ width: 14, height: 14, color: '#60a5fa', flexShrink: 0 }} />
            </div>
          )}
        </div>
      )}

      {/* Rutinas activas */}
      <div style={card}>
        <div style={cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(251,146,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardList style={{ width: 14, height: 14, color: '#fb923c' }} />
            </div>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)' }}>Rutinas activas</span>
          </div>
          <Link href="/alumno/rutinas" className="link-hover" style={{ fontSize: 12.5, color: 'var(--t3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
            Ver todas <ChevronRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>

        {!asignaciones?.length ? (
          <div style={{ textAlign: 'center', padding: '44px 20px' }}>
            <ClipboardList style={{ width: 36, height: 36, color: 'var(--t3)', margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: 14, color: 'var(--t2)', fontWeight: 500 }}>Sin rutinas asignadas</div>
            <div style={{ fontSize: 12.5, color: 'var(--t3)', marginTop: 4 }}>Tu profesor las configurará pronto.</div>
          </div>
        ) : (
          <div>
            {asignaciones.map((asig, i) => {
              const rutina = asig.rutina as { nombre: string; dias_por_semana: number; ejercicios: unknown[] }
              return (
                <Link key={asig.id} href="/alumno/rutinas" className="row-hover" style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 20px', textDecoration: 'none',
                  borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(170,255,0,0.08)', border: '1px solid rgba(170,255,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Dumbbell style={{ width: 15, height: 15, color: 'var(--primary)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--t1)' }}>{rutina?.nombre}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>
                      {rutina?.dias_por_semana}x por semana · {(rutina?.ejercicios as unknown[])?.length ?? 0} ejercicios
                    </div>
                  </div>
                  <ChevronRight style={{ width: 14, height: 14, color: 'var(--t3)', flexShrink: 0 }} />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Próximos módulos */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12 }}>
          Próximamente
        </div>
        <div className="grid-2-fixed">
          {proximosModulos.map(({ label, icon: Icon, desc }) => (
            <div key={label} style={{ ...card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.45 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 14, height: 14, color: 'var(--t3)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t2)' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{desc}</div>
              </div>
              <span style={{ fontSize: 9.5, background: 'rgba(255,255,255,0.06)', color: 'var(--t3)', borderRadius: 999, padding: '2px 7px', fontWeight: 700, flexShrink: 0, letterSpacing: '0.04em' }}>
                pronto
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
