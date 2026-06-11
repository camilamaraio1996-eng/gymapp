import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Dumbbell, Clock, ChevronRight, BarChart2, Calendar, Zap } from 'lucide-react'

function formatDur(secs: number) {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default async function HistorialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: alumno } = await supabase
    .from('alumnos').select('id').eq('user_id', user!.id).single()

  if (!alumno) return (
    <div style={{ textAlign: 'center', paddingTop: 60 }}>
      <p style={{ color: 'var(--t2)' }}>Perfil de alumno no encontrado.</p>
    </div>
  )

  const { data: sesiones, count } = await supabase
    .from('sesiones')
    .select('*', { count: 'exact' })
    .eq('alumno_id', alumno.id)
    .not('finalizada_at', 'is', null)
    .order('iniciada_at', { ascending: false })

  const allSesiones = sesiones ?? []

  // Stats
  const total = count ?? 0
  const weekMs = Date.now() - 7 * 86_400_000
  const monthMs = Date.now() - 30 * 86_400_000
  const estaSemana = allSesiones.filter(s => new Date(s.iniciada_at).getTime() > weekMs).length
  const esteMes = allSesiones.filter(s => new Date(s.iniciada_at).getTime() > monthMs).length
  const volumenTotal = allSesiones.reduce((s, ses) => s + Number(ses.volumen_total_kg ?? 0), 0)

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }

  // Group by month
  type MonthGroup = { label: string; sesiones: typeof allSesiones }
  const months: MonthGroup[] = []
  for (const s of allSesiones) {
    const label = format(new Date(s.iniciada_at), 'MMMM yyyy', { locale: es })
    const existing = months.find(m => m.label === label)
    if (existing) existing.sesiones.push(s)
    else months.push({ label, sesiones: [s] })
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>Historial</h1>
        <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>Todos tus entrenamientos completados.</p>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {([
          { label: 'Total', value: total, Icon: BarChart2, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
          { label: 'Este mes', value: esteMes, Icon: Calendar, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
          { label: 'Esta semana', value: estaSemana, Icon: Zap, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
          { label: 'Volumen total', value: `${Math.round(volumenTotal).toLocaleString('es-AR')} kg`, Icon: Dumbbell, color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
        ] as const).map(({ label, value, Icon, color, bg }) => (
          <div key={label} style={{ ...card, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 13, height: 13, color } as React.CSSProperties} />
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Session list */}
      {!allSesiones.length ? (
        <div style={{ ...card, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏋️</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>No hay entrenamientos aún</div>
          <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>Completá tu primer entrenamiento para verlo aquí.</div>
          <Link href="/alumno/entrenar" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--primary)', color: '#000', fontSize: 13, fontWeight: 700,
            padding: '10px 20px', borderRadius: 9, textDecoration: 'none',
          }}>
            <Zap style={{ width: 14, height: 14 }} /> Entrenar ahora
          </Link>
        </div>
      ) : (
        months.map(({ label, sesiones: sGroup }) => (
          <div key={label}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'capitalize', letterSpacing: '0.1em', marginBottom: 10 }}>
              {label}
            </div>
            <div style={card}>
              {sGroup.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/alumno/historial/${s.id}`}
                  className="row-hover"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px',
                    textDecoration: 'none', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(170,255,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Dumbbell style={{ width: 16, height: 16, color: 'var(--primary)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.rutina_nombre ?? 'Entrenamiento'}{s.dia_label ? ` · ${s.dia_label}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11.5, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Calendar style={{ width: 10, height: 10 }} />
                        {format(new Date(s.iniciada_at), "d MMM", { locale: es })}
                      </span>
                      {s.duracion_segundos ? (
                        <span style={{ fontSize: 11.5, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock style={{ width: 10, height: 10 }} />{formatDur(s.duracion_segundos)}
                        </span>
                      ) : null}
                      {s.series_completadas ? (
                        <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{s.series_completadas} series</span>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {s.volumen_total_kg ? (
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)' }}>
                        {Number(s.volumen_total_kg).toLocaleString('es-AR')} kg
                      </div>
                    ) : null}
                    <ChevronRight style={{ width: 13, height: 13, color: 'var(--t3)', marginTop: 2 }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
