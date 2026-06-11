import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Users, Zap, AlertTriangle, CheckCircle, UserX, Calendar, TrendingUp } from 'lucide-react'

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000)
}

function statusOf(lastMs: number | undefined) {
  if (!lastMs) return 'inactivo'
  const days = (Date.now() - lastMs) / 86_400_000
  if (days <= 3) return 'activo'
  if (days <= 7) return 'riesgo'
  return 'inactivo'
}

const STATUS = {
  activo:   { label: 'Activo',   color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  Icon: CheckCircle },
  riesgo:   { label: 'Riesgo',   color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  Icon: AlertTriangle },
  inactivo: { label: 'Inactivo', color: '#f87171', bg: 'rgba(248,113,113,0.1)', Icon: UserX },
}

export default async function AsistenciaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profesor } = await supabase
    .from('profesores').select('id').eq('user_id', user!.id).single()

  if (!profesor) return <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--t2)' }}>Perfil no encontrado.</div>

  const { data: misAlumnos } = await supabase
    .from('alumnos')
    .select('id, nombre, apellido, objetivo')
    .eq('profesor_id', profesor.id)
    .order('nombre')

  const alumnoIds = (misAlumnos ?? []).map(a => a.id)

  const { data: sesiones } = alumnoIds.length > 0
    ? await supabase.from('sesiones')
        .select('alumno_id, iniciada_at')
        .in('alumno_id', alumnoIds)
        .not('finalizada_at', 'is', null)
        .order('iniciada_at', { ascending: false })
    : { data: [] as { alumno_id: string; iniciada_at: string }[] }

  const allSes = sesiones ?? []
  const now = Date.now()
  const ms7  = 7  * 86_400_000
  const ms30 = 30 * 86_400_000
  const thisMonthStart = new Date(); thisMonthStart.setDate(1); thisMonthStart.setHours(0, 0, 0, 0)

  // Aggregate per alumno
  type AlumnoStats = {
    id: string; nombre: string; apellido: string; objetivo: string | null
    total: number; estaSemana: number; esteMes: number
    lastMs: number | undefined; status: 'activo' | 'riesgo' | 'inactivo'
  }

  const statsMap: Record<string, AlumnoStats> = {}
  for (const a of (misAlumnos ?? [])) {
    statsMap[a.id] = { id: a.id, nombre: a.nombre, apellido: a.apellido, objetivo: a.objetivo, total: 0, estaSemana: 0, esteMes: 0, lastMs: undefined, status: 'inactivo' }
  }

  for (const s of allSes) {
    const st = statsMap[s.alumno_id]
    if (!st) continue
    const t = new Date(s.iniciada_at).getTime()
    st.total++
    if (!st.lastMs || t > st.lastMs) st.lastMs = t
    if (now - t < ms7) st.estaSemana++
    if (new Date(s.iniciada_at) >= thisMonthStart) st.esteMes++
  }

  for (const st of Object.values(statsMap)) {
    st.status = statusOf(st.lastMs)
  }

  const sorted = Object.values(statsMap).sort((a, b) => {
    const dayA = a.lastMs ? daysSince(new Date(a.lastMs)) : 9999
    const dayB = b.lastMs ? daysSince(new Date(b.lastMs)) : 9999
    return dayB - dayA
  })

  const countActivos  = sorted.filter(s => s.status === 'activo').length
  const countRiesgo   = sorted.filter(s => s.status === 'riesgo').length
  const countInactivos = sorted.filter(s => s.status === 'inactivo').length
  const totalSemana   = allSes.filter(s => now - new Date(s.iniciada_at).getTime() < ms7).length
  const totalMes      = allSes.filter(s => new Date(s.iniciada_at) >= thisMonthStart).length

  const alumnosCount = misAlumnos?.length ?? 0
  const asistenciaPct = alumnosCount > 0
    ? Math.round((sorted.filter(s => s.estaSemana > 0).length / alumnosCount) * 100)
    : 0

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>Asistencia</h1>
        <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>Seguimiento de entrenamientos de tus alumnos</p>
      </div>

      {/* Summary KPIs */}
      <div className="kpi-grid">
        {[
          { label: 'Activos (semana)', value: countActivos, Icon: CheckCircle, color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
          { label: 'En riesgo', value: countRiesgo, Icon: AlertTriangle, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
          { label: 'Inactivos (+7d)', value: countInactivos, Icon: UserX, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
          { label: 'Sesiones este mes', value: totalMes, Icon: Zap, color: 'var(--primary)', bg: 'rgba(170,255,0,0.08)' },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} style={{ ...card, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 13, height: 13, color } as React.CSSProperties} />
              </div>
            </div>
            <div className="num" style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div className="grid-2">
        <div style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp style={{ width: 18, height: 18, color: '#a78bfa' } as React.CSSProperties} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)' }}>{asistenciaPct}%</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Asistencia semanal ({sorted.filter(s => s.estaSemana > 0).length}/{alumnosCount} alumnos entrenaron)</div>
          </div>
        </div>
        <div style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar style={{ width: 18, height: 18, color: '#60a5fa' } as React.CSSProperties} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)' }}>{totalSemana}</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Sesiones esta semana en total</div>
          </div>
        </div>
      </div>

      {/* Per-student table */}
      {!sorted.length ? (
        <div style={{ ...card, padding: '48px 24px', textAlign: 'center' }}>
          <Users style={{ width: 32, height: 32, color: 'var(--t3)', margin: '0 auto 12px', display: 'block' } as React.CSSProperties} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>Sin alumnos asignados</div>
        </div>
      ) : (
        <div style={card}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px 70px 90px 90px', gap: 8, padding: '10px 20px', fontSize: 9.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span>Alumno</span>
            <span style={{ textAlign: 'center' }}>Estado</span>
            <span style={{ textAlign: 'center' }}>Semana</span>
            <span style={{ textAlign: 'center' }}>Mes</span>
            <span style={{ textAlign: 'center' }}>Total</span>
            <span style={{ textAlign: 'center' }}>Última sesión</span>
          </div>

          {sorted.map((st, i) => {
            const cfg = STATUS[st.status]
            const StatusIcon = cfg.Icon
            const lastDate = st.lastMs ? new Date(st.lastMs) : null
            const dias = st.lastMs ? daysSince(new Date(st.lastMs)) : null
            return (
              <Link
                key={st.id}
                href={`/profesor/alumnos/${st.id}`}
                className="row-hover"
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 90px 70px 70px 90px 90px',
                  gap: 8, padding: '12px 20px', textDecoration: 'none',
                  alignItems: 'center',
                  borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {/* Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, color: '#60a5fa' }}>
                    {st.nombre[0]}{st.apellido[0]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {st.nombre} {st.apellido}
                    </div>
                    {st.objetivo && <div style={{ fontSize: 11, color: 'var(--t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.objetivo}</div>}
                  </div>
                </div>

                {/* Status */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
                    <StatusIcon style={{ width: 9, height: 9 }} />
                    {cfg.label}
                  </span>
                </div>

                {/* Stats */}
                <div style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 600, color: st.estaSemana > 0 ? 'var(--primary)' : 'var(--t3)' }}>{st.estaSemana}</div>
                <div style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 600, color: st.esteMes > 0 ? 'var(--t1)' : 'var(--t3)' }}>{st.esteMes}</div>
                <div style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 600, color: 'var(--t2)' }}>{st.total}</div>

                {/* Last session */}
                <div style={{ textAlign: 'center' }}>
                  {lastDate ? (
                    <>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: dias !== null && dias <= 3 ? '#4ade80' : dias !== null && dias <= 7 ? '#fbbf24' : '#f87171' }}>
                        {dias === 0 ? 'Hoy' : dias === 1 ? 'Ayer' : `Hace ${dias}d`}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>{format(lastDate, 'd MMM', { locale: es })}</div>
                    </>
                  ) : (
                    <span style={{ fontSize: 11.5, color: '#f87171', fontWeight: 600 }}>Nunca</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

    </div>
  )
}
