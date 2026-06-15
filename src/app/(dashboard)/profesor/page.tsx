import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Users, Dumbbell, Zap, AlertTriangle, TrendingUp,
  Activity, ChevronRight, ArrowRight, UserX, CheckCircle, Bell,
} from 'lucide-react'

function fmtDate(d: Date) {
  if (isToday(d)) return `hoy ${format(d, 'HH:mm')}`
  if (isYesterday(d)) return `ayer ${format(d, 'HH:mm')}`
  return format(d, "d MMM", { locale: es })
}

export default async function ProfesorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profesor } = await supabase
    .from('profesores').select('*').eq('user_id', user!.id).single()

  if (!profesor) {
    const hora = new Date().getHours()
    const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
    const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }
    const demoTimeline = [
      { name: 'Carlos M.', text: 'completó Fuerza Full Body · Pecho y Tríceps', icon: 'session' as const, date: new Date(Date.now() - 2 * 3600_000) },
      { name: 'María L.', text: 'registró 62.5 kg de peso', icon: 'medicion' as const, date: new Date(Date.now() - 5 * 3600_000) },
      { name: 'Lucas G.', text: 'completó Hipertrofia Tren Superior · Espalda', icon: 'session' as const, date: new Date(Date.now() - 26 * 3600_000) },
      { name: 'Ana P.', text: 'completó Cardio HIIT · Full Body', icon: 'session' as const, date: new Date(Date.now() - 50 * 3600_000) },
      { name: 'Pedro R.', text: 'registró nuevas mediciones', icon: 'medicion' as const, date: new Date(Date.now() - 72 * 3600_000) },
    ]
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Demo notice */}
        <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 10, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle style={{ width: 14, height: 14, color: '#fbbf24', flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: '#fbbf24', fontWeight: 500 }}>
            Modo demo · Tu perfil de profesor aún no está vinculado al sistema. Contacta al administrador para activar tu cuenta.
          </span>
        </div>
        {/* Header */}
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>{saludo}, Profesor</div>
          <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4, textTransform: 'capitalize' }}>
            {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </div>
        </div>
        {/* KPI Row 1 */}
        <div className="stat-grid-3">
          {([
            { label: 'Alumnos', value: 8, sub: '5 activos esta semana', subColor: '#4ade80', iconColor: '#60a5fa', iconBg: 'rgba(96,165,250,0.1)', Icon: Users },
            { label: 'Sesiones esta semana', value: 23, sub: '7/8 alumnos entrenaron', subColor: 'var(--primary)', iconColor: 'var(--primary)', iconBg: 'rgba(255,61,26,0.08)', Icon: Zap },
            { label: 'Inactivos', value: 1, sub: '1 sin entrenar +7 días', subColor: '#f87171', iconColor: '#f87171', iconBg: 'rgba(248,113,113,0.1)', Icon: UserX },
          ] as const).map(({ label, value, sub, subColor, iconColor, iconBg, Icon }) => (
            <div key={label} style={{ ...card, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: 14, height: 14, color: iconColor } as React.CSSProperties} />
                </div>
              </div>
              <div className="num" style={{ fontSize: 30, fontWeight: 700, color: 'var(--t1)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11.5, color: subColor, marginTop: 8, fontWeight: 500 }}>{sub}</div>
            </div>
          ))}
        </div>
        {/* KPI Row 2 */}
        <div className="stat-grid-3">
          {([
            { label: 'Rutinas creadas', value: 4, sub: '4 planes disponibles', subColor: 'var(--t3)', iconColor: '#fb923c', iconBg: 'rgba(251,146,60,0.1)', Icon: Dumbbell },
            { label: 'Asistencia semana', value: '87%', sub: '7 de 8 alumnos', subColor: '#4ade80', iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.1)', Icon: TrendingUp },
            { label: 'En riesgo', value: 1, sub: '1 sin entrenar 3–7 días', subColor: '#fbbf24', iconColor: '#fbbf24', iconBg: 'rgba(251,191,36,0.1)', Icon: AlertTriangle },
          ] as const).map(({ label, value, sub, subColor, iconColor, iconBg, Icon }) => (
            <div key={label} style={{ ...card, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: 14, height: 14, color: iconColor } as React.CSSProperties} />
                </div>
              </div>
              <div className="num" style={{ fontSize: 30, fontWeight: 700, color: 'var(--t1)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11.5, color: subColor, marginTop: 8, fontWeight: 500 }}>{sub}</div>
            </div>
          ))}
        </div>
        {/* Timeline + Alerts */}
        <div className="grid-2">
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity style={{ width: 12, height: 12, color: '#60a5fa' } as React.CSSProperties} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Actividad reciente</span>
              </div>
              <span style={{ fontSize: 10, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', padding: '2px 8px', borderRadius: 20, fontWeight: 600, letterSpacing: '0.04em' }}>DEMO</span>
            </div>
            <div style={{ padding: '6px 0' }}>
              {demoTimeline.map((ev, i) => (
                <div key={i} className="row-hover" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 20px' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ev.icon === 'session' ? 'rgba(255,61,26,0.07)' : 'rgba(167,139,250,0.1)' }}>
                    {ev.icon === 'session'
                      ? <Zap style={{ width: 11, height: 11, color: 'var(--primary)' } as React.CSSProperties} />
                      : <TrendingUp style={{ width: 11, height: 11, color: '#a78bfa' } as React.CSSProperties} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 600 }}>{ev.name.split(' ')[0]}</span>{' '}
                      <span style={{ color: 'var(--t2)' }}>{ev.text}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{fmtDate(ev.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell style={{ width: 12, height: 12, color: '#fbbf24' } as React.CSSProperties} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Alertas</span>
              </div>
              <span style={{ fontSize: 10.5, background: 'rgba(248,113,113,0.12)', color: '#f87171', padding: '2px 9px', borderRadius: 20, fontWeight: 700 }}>2 alertas</span>
            </div>
            <div style={{ padding: '6px 0' }}>
              {[
                { label: '1 alumno inactivo', sub: 'Sin entrenar hace más de 7 días', color: '#f87171', bg: 'rgba(248,113,113,0.1)', Icon: UserX },
                { label: '1 sin rutina asignada', sub: 'Marcos Torres', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', Icon: Dumbbell },
              ].map(({ label, sub, color, bg, Icon }, i) => (
                <div key={i} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 15, height: 15, color } as React.CSSProperties} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>{sub}</div>
                  </div>
                  <ChevronRight style={{ width: 12, height: 12, color: 'var(--t3)' } as React.CSSProperties} />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Quick actions */}
        <div className="stat-grid-3">
          {([
            { label: 'Nueva rutina', sub: 'Crear plan de entrenamiento', href: '/profesor/rutinas?new=true', color: '#fb923c', bg: 'rgba(251,146,60,0.1)', Icon: Dumbbell },
            { label: 'Ver alumnos', sub: '8 asignados', href: '/profesor/alumnos', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', Icon: Users },
          ] as const).map(({ label, sub, href, color, bg, Icon }) => (
            <Link key={label} href={href} style={{ textDecoration: 'none' }}>
              <div className="card-hover" style={{ ...card, padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 14, height: 14, color } as React.CSSProperties} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--t1)' }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 1 }}>{sub}</div>
                </div>
                <ArrowRight style={{ width: 13, height: 13, color: 'var(--t3)', flexShrink: 0 } as React.CSSProperties} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  const { data: misAlumnos } = await supabase
    .from('alumnos')
    .select('id, nombre, apellido, user_id')
    .eq('profesor_id', profesor.id)
    .order('nombre')

  const alumnoIds = (misAlumnos ?? []).map(a => a.id)
  const alumnosCount = alumnoIds.length

  const [todasSesionesRes, recentMedicionesRes, rutinasCountRes, asignacionesRes] = await Promise.all([
    alumnoIds.length > 0
      ? supabase.from('sesiones')
          .select('id, alumno_id, rutina_nombre, dia_label, iniciada_at')
          .in('alumno_id', alumnoIds)
          .not('finalizada_at', 'is', null)
          .order('iniciada_at', { ascending: false })
          .limit(300)
      : Promise.resolve({ data: [] as { id: string; alumno_id: string; rutina_nombre: string | null; dia_label: string | null; iniciada_at: string }[] }),

    alumnoIds.length > 0
      ? supabase.from('mediciones')
          .select('alumno_id, peso_kg, fecha')
          .in('alumno_id', alumnoIds)
          .order('fecha', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] as { alumno_id: string; peso_kg: number | null; fecha: string }[] }),

    supabase.from('rutinas')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user!.id),

    alumnoIds.length > 0
      ? supabase.from('asignaciones')
          .select('alumno_id')
          .in('alumno_id', alumnoIds)
          .eq('activa', true)
      : Promise.resolve({ data: [] as { alumno_id: string }[] }),
  ])

  const todasSesiones = todasSesionesRes.data ?? []
  const recentMediciones = recentMedicionesRes.data ?? []
  const rutinasCount = rutinasCountRes.count ?? 0

  const now = Date.now()
  const ms7 = 7 * 86_400_000
  const ms3 = 3 * 86_400_000

  // Last session per alumno
  const lastSessionMap: Record<string, number> = {}
  for (const s of todasSesiones) {
    const t = new Date(s.iniciada_at).getTime()
    if (!lastSessionMap[s.alumno_id] || t > lastSessionMap[s.alumno_id]) {
      lastSessionMap[s.alumno_id] = t
    }
  }

  let countActivos = 0, countRiesgo = 0, countInactivos = 0
  const alumnosSinSesion: typeof misAlumnos = []
  for (const a of (misAlumnos ?? [])) {
    const last = lastSessionMap[a.id]
    if (!last || now - last > ms7) { countInactivos++; alumnosSinSesion?.push(a) }
    else if (now - last > ms3) countRiesgo++
    else countActivos++
  }

  const sesionesEstaSemana = todasSesiones.filter(s => now - new Date(s.iniciada_at).getTime() < ms7).length

  const trainedThisWeek = new Set(
    todasSesiones.filter(s => now - new Date(s.iniciada_at).getTime() < ms7).map(s => s.alumno_id)
  )
  const asistenciaPct = alumnosCount > 0
    ? Math.round((trainedThisWeek.size / alumnosCount) * 100)
    : 0

  const alumnosConRutina = new Set((asignacionesRes.data ?? []).map(a => a.alumno_id))
  const alumnosSinRutina = (misAlumnos ?? []).filter(a => !alumnosConRutina.has(a.id))

  // Timeline
  const alumnoMap = Object.fromEntries((misAlumnos ?? []).map(a => [a.id, `${a.nombre} ${a.apellido}`]))

  type TEvent = { date: Date; text: string; icon: 'session' | 'medicion'; name: string }
  const sessionEvents: TEvent[] = todasSesiones.slice(0, 10).map(s => ({
    date: new Date(s.iniciada_at),
    text: `completó${s.rutina_nombre ? ` ${s.rutina_nombre}` : ' entrenamiento'}${s.dia_label ? ` · ${s.dia_label}` : ''}`,
    icon: 'session',
    name: alumnoMap[s.alumno_id] ?? 'Alumno',
  }))
  const medicionEvents: TEvent[] = recentMediciones.map(m => ({
    date: new Date(m.fecha),
    text: `registró ${m.peso_kg ? `${m.peso_kg} kg de peso` : 'nuevas mediciones'}`,
    icon: 'medicion',
    name: alumnoMap[m.alumno_id] ?? 'Alumno',
  }))
  const timeline = [...sessionEvents, ...medicionEvents]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8)

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }

  const totalAlertas = countInactivos + alumnosSinRutina.length

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
          {saludo}, {profesor.nombre}
        </div>
        <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4, textTransform: 'capitalize' }}>
          {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="stat-grid-3 stagger">
        {[
          {
            label: 'Alumnos', value: alumnosCount, href: '/profesor/alumnos',
            sub: countActivos > 0 ? `${countActivos} activos esta semana` : alumnosCount > 0 ? 'Ninguno activo' : 'Sin alumnos',
            subColor: countActivos > 0 ? '#4ade80' : 'var(--t3)',
            iconColor: '#60a5fa', iconBg: 'rgba(96,165,250,0.1)', Icon: Users,
          },
          {
            label: 'Sesiones esta semana', value: sesionesEstaSemana, href: '/profesor/asistencia',
            sub: sesionesEstaSemana > 0 ? `${trainedThisWeek.size}/${alumnosCount} alumnos entrenaron` : 'Ninguna esta semana',
            subColor: sesionesEstaSemana > 0 ? 'var(--primary)' : 'var(--t3)',
            iconColor: 'var(--primary)', iconBg: 'rgba(255,61,26,0.08)', Icon: Zap,
          },
          {
            label: 'Inactivos', value: countInactivos, href: '/profesor/asistencia',
            sub: countInactivos > 0 ? `${countInactivos} sin entrenar +7 días` : alumnosCount > 0 ? 'Todos entrenando' : 'Sin alumnos',
            subColor: countInactivos > 0 ? '#f87171' : '#4ade80',
            iconColor: countInactivos > 0 ? '#f87171' : '#4ade80',
            iconBg: countInactivos > 0 ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)', Icon: countInactivos > 0 ? UserX : CheckCircle,
          },
        ].map(({ label, value, href, sub, subColor, iconColor, iconBg, Icon }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div className="card-hover" style={{ ...card, padding: '18px 20px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: 14, height: 14, color: iconColor } as React.CSSProperties} />
                </div>
              </div>
              <div className="num" style={{ fontSize: 30, fontWeight: 700, color: 'var(--t1)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11.5, color: subColor, marginTop: 8, fontWeight: 500 }}>{sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* KPI Row 2 */}
      <div className="stat-grid-3 stagger">
        {[
          {
            label: 'Rutinas creadas', value: rutinasCount, href: '/profesor/rutinas',
            sub: rutinasCount > 0 ? `${rutinasCount} plan${rutinasCount !== 1 ? 'es' : ''} disponible${rutinasCount !== 1 ? 's' : ''}` : 'Sin rutinas aún',
            subColor: 'var(--t3)', iconColor: '#fb923c', iconBg: 'rgba(251,146,60,0.1)', Icon: Dumbbell,
          },
          {
            label: 'Asistencia semana', value: `${asistenciaPct}%`, href: '/profesor/asistencia',
            sub: alumnosCount > 0 ? `${trainedThisWeek.size} de ${alumnosCount} alumnos` : 'Sin datos',
            subColor: asistenciaPct >= 70 ? '#4ade80' : asistenciaPct >= 40 ? '#fbbf24' : asistenciaPct > 0 ? '#f87171' : 'var(--t3)',
            iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.1)', Icon: TrendingUp,
          },
          {
            label: 'En riesgo', value: countRiesgo, href: '/profesor/asistencia',
            sub: countRiesgo > 0 ? `${countRiesgo} sin entrenar 3-7 días` : 'Todos al día',
            subColor: countRiesgo > 0 ? '#fbbf24' : '#4ade80',
            iconColor: '#fbbf24', iconBg: 'rgba(251,191,36,0.1)', Icon: AlertTriangle,
          },
        ].map(({ label, value, href, sub, subColor, iconColor, iconBg, Icon }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div className="card-hover" style={{ ...card, padding: '18px 20px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: 14, height: 14, color: iconColor } as React.CSSProperties} />
                </div>
              </div>
              <div className="num" style={{ fontSize: 30, fontWeight: 700, color: 'var(--t1)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11.5, color: subColor, marginTop: 8, fontWeight: 500 }}>{sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Timeline + Alerts */}
      <div className="grid-2">

        {/* Activity timeline */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity style={{ width: 12, height: 12, color: '#60a5fa' } as React.CSSProperties} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Actividad reciente</span>
            </div>
            <Link href="/profesor/alumnos" className="link-hover" style={{ fontSize: 12, color: 'var(--t3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              Ver alumnos <ChevronRight style={{ width: 11, height: 11 } as React.CSSProperties} />
            </Link>
          </div>
          {timeline.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Activity style={{ width: 28, height: 28, color: 'var(--t3)', margin: '0 auto 10px', display: 'block' } as React.CSSProperties} />
              <div style={{ fontSize: 13, color: 'var(--t2)' }}>Sin actividad reciente</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>Las sesiones y mediciones aparecerán aquí</div>
            </div>
          ) : (
            <div style={{ padding: '6px 0' }}>
              {timeline.map((ev, i) => (
                <div key={i} className="row-hover" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 20px' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ev.icon === 'session' ? 'rgba(255,61,26,0.07)' : 'rgba(167,139,250,0.1)' }}>
                    {ev.icon === 'session'
                      ? <Zap style={{ width: 11, height: 11, color: 'var(--primary)' } as React.CSSProperties} />
                      : <TrendingUp style={{ width: 11, height: 11, color: '#a78bfa' } as React.CSSProperties} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 600 }}>{ev.name.split(' ')[0]}</span>{' '}
                      <span style={{ color: 'var(--t2)' }}>{ev.text}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{fmtDate(ev.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Smart alerts */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell style={{ width: 12, height: 12, color: '#fbbf24' } as React.CSSProperties} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Alertas</span>
            </div>
            {totalAlertas > 0 && (
              <span style={{ fontSize: 10.5, background: 'rgba(248,113,113,0.12)', color: '#f87171', padding: '2px 9px', borderRadius: 20, fontWeight: 700 }}>
                {totalAlertas} alerta{totalAlertas !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div style={{ padding: '6px 0' }}>
            {totalAlertas === 0 && countRiesgo === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <CheckCircle style={{ width: 28, height: 28, color: '#4ade80', margin: '0 auto 10px', display: 'block' } as React.CSSProperties} />
                <div style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 500 }}>Todo en orden</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>No hay alertas pendientes</div>
              </div>
            ) : (
              <>
                {countInactivos > 0 && (
                  <Link href="/profesor/asistencia" style={{ textDecoration: 'none' }}>
                    <div className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <UserX style={{ width: 15, height: 15, color: '#f87171' } as React.CSSProperties} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
                          {countInactivos} alumno{countInactivos !== 1 ? 's' : ''} inactivo{countInactivos !== 1 ? 's' : ''}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>Sin entrenar hace más de 7 días</div>
                      </div>
                      <ChevronRight style={{ width: 12, height: 12, color: 'var(--t3)' } as React.CSSProperties} />
                    </div>
                  </Link>
                )}
                {countRiesgo > 0 && (
                  <Link href="/profesor/asistencia" style={{ textDecoration: 'none' }}>
                    <div className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderTop: countInactivos > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle style={{ width: 15, height: 15, color: '#fbbf24' } as React.CSSProperties} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
                          {countRiesgo} en riesgo de abandono
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>Sin entrenar 3-7 días</div>
                      </div>
                      <ChevronRight style={{ width: 12, height: 12, color: 'var(--t3)' } as React.CSSProperties} />
                    </div>
                  </Link>
                )}
                {alumnosSinRutina.length > 0 && (
                  <Link href="/profesor/alumnos" style={{ textDecoration: 'none' }}>
                    <div className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderTop: (countInactivos > 0 || countRiesgo > 0) ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Dumbbell style={{ width: 15, height: 15, color: '#60a5fa' } as React.CSSProperties} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
                          {alumnosSinRutina.length} sin rutina asignada
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>
                          {alumnosSinRutina.slice(0, 2).map(a => a.nombre).join(', ')}{alumnosSinRutina.length > 2 ? ` +${alumnosSinRutina.length - 2}` : ''}
                        </div>
                      </div>
                      <ChevronRight style={{ width: 12, height: 12, color: 'var(--t3)' } as React.CSSProperties} />
                    </div>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="stat-grid-3">
        {[
          { label: 'Nueva rutina', sub: 'Crear plan de entrenamiento', href: '/profesor/rutinas?new=true', color: '#fb923c', bg: 'rgba(251,146,60,0.1)', Icon: Dumbbell },
          { label: 'Ver alumnos', sub: `${alumnosCount} asignado${alumnosCount !== 1 ? 's' : ''}`, href: '/profesor/alumnos', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', Icon: Users },
        ].map(({ label, sub, href, color, bg, Icon }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div className="card-hover" style={{ ...card, padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 14, height: 14, color } as React.CSSProperties} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--t1)' }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 1 }}>{sub}</div>
              </div>
              <ArrowRight style={{ width: 13, height: 13, color: 'var(--t3)', flexShrink: 0 } as React.CSSProperties} />
            </div>
          </Link>
        ))}
      </div>

    </div>
  )
}
