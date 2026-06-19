import { BarChart2, Users, TrendingUp, DollarSign, Download, ArrowUpRight, Medal, CalendarDays } from 'lucide-react'

const kpis = [
  { label: 'Ingresos del mes',  value: '$184.000', sub: '+12% vs mayo',           icon: DollarSign, iconColor: '#4ade80', iconBg: 'rgba(74,222,128,0.12)',  trend: '+12%', trendUp: true  },
  { label: 'Nuevos alumnos',    value: '8',        sub: '3 de referidos',          icon: Users,      iconColor: '#60a5fa', iconBg: 'rgba(96,165,250,0.12)',  trend: '+33%', trendUp: true  },
  { label: 'Sesiones totales',  value: '142',      sub: '87% de asistencia',       icon: BarChart2,  iconColor: '#fb923c', iconBg: 'rgba(251,146,60,0.12)',  trend: '+18%', trendUp: true  },
  { label: 'Tasa de retención', value: '94%',      sub: '1 baja este mes',         icon: TrendingUp, iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)', trend: '-1%',  trendUp: false },
]

const monthlyData = [
  { month: 'Ene', sessions: 98,  revenue: 142000 },
  { month: 'Feb', sessions: 110, revenue: 158000 },
  { month: 'Mar', sessions: 105, revenue: 151000 },
  { month: 'Abr', sessions: 120, revenue: 167000 },
  { month: 'May', sessions: 130, revenue: 172000 },
  { month: 'Jun', sessions: 142, revenue: 184000 },
]
const maxSessions = Math.max(...monthlyData.map(d => d.sessions))

const topStudents = [
  { name: 'Carlos Mendoza',   initials: 'CM', sessions: 16, streak: 12, badge: '🏆' },
  { name: 'Laura Gómez',      initials: 'LG', sessions: 14, streak: 8,  badge: '🥈' },
  { name: 'Valentina Suárez', initials: 'VS', sessions: 13, streak: 10, badge: '🥉' },
  { name: 'Diego Fernández',  initials: 'DF', sessions: 12, streak: 5,  badge: '4°' },
  { name: 'Nicolás Torres',   initials: 'NT', sessions: 10, streak: 3,  badge: '5°' },
]

const weeklyData = [
  { week: 'Semana 1', dates: '2–8 jun',   sessions: 34, attendancePct: 91, revenue: '$44.000', status: 'ok' as const },
  { week: 'Semana 2', dates: '9–15 jun',  sessions: 38, attendancePct: 88, revenue: '$48.000', status: 'ok' as const },
  { week: 'Semana 3', dates: '16–22 jun', sessions: 36, attendancePct: 85, revenue: '$46.000', status: 'warn' as const },
  { week: 'Semana 4', dates: '23–30 jun', sessions: 34, attendancePct: 90, revenue: '$46.000', status: 'ok' as const },
]

const reports = [
  { label: 'Reporte mensual — Junio 2026',  size: '84 KB', type: 'PDF' },
  { label: 'Asistencia detallada — Junio',  size: '42 KB', type: 'CSV' },
  { label: 'Ingresos por alumno — Junio',   size: '31 KB', type: 'CSV' },
  { label: 'Reporte mensual — Mayo 2026',   size: '79 KB', type: 'PDF' },
]

export default function ReportesPage() {
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
    <div className="animate-fade-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Reportes</div>
          <div style={{ fontSize: 13.5, color: 'var(--t2)', marginTop: 5 }}>Resumen ejecutivo — junio 2026</div>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--primary)', border: 'none',
          borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 600,
        }}>
          <Download style={{ width: 13, height: 13 }} /> Exportar PDF
        </button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid stagger" style={{ marginBottom: 20 }}>
        {kpis.map(({ label, value, sub, icon: Icon, iconColor, iconBg, trend, trendUp }) => (
          <div key={label} style={{ ...card, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 16, height: 16, color: iconColor }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--t1)', lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 999, marginBottom: 2,
                background: trendUp ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                color: trendUp ? '#4ade80' : '#f87171',
                display: 'flex', alignItems: 'center', gap: 2,
              }}>
                <ArrowUpRight style={{ width: 11, height: 11, transform: trendUp ? 'none' : 'rotate(90deg)' }} />{trend}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 7, fontWeight: 500 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Bar chart: sesiones por mes */}
        <div style={card}>
          <div style={cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(251,146,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 style={{ width: 14, height: 14, color: '#fb923c' }} />
              </div>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)' }}>Sesiones por mes</span>
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>Enero — Junio 2026</span>
          </div>
          <div style={{ padding: '24px 24px 12px', display: 'flex', alignItems: 'flex-end', gap: 10, height: 180 }}>
            {monthlyData.map((d, i) => {
              const isLast = i === monthlyData.length - 1
              const barPct = (d.sessions / maxSessions) * 100
              return (
                <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 10, color: isLast ? 'var(--t1)' : 'var(--t3)', fontWeight: 600 }}>{d.sessions}</span>
                  <div style={{
                    width: '100%', borderRadius: '5px 5px 0 0',
                    background: isLast ? 'var(--primary)' : 'rgba(255,61,26,0.25)',
                    height: `${barPct}%`,
                    minHeight: 4,
                  }} />
                  <span style={{ fontSize: 10.5, color: isLast ? 'var(--t1)' : 'var(--t3)', fontWeight: isLast ? 700 : 400 }}>{d.month}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top alumnos */}
        <div style={card}>
          <div style={cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Medal style={{ width: 14, height: 14, color: '#f59e0b' }} />
              </div>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)' }}>Top alumnos</span>
            </div>
          </div>
          <div>
            {topStudents.map((s, i) => (
              <div key={s.name} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 20px',
                borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontSize: 14, minWidth: 24, textAlign: 'center' }}>{s.badge}</span>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,61,26,0.08)', border: '1px solid rgba(255,61,26,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: 'var(--primary)',
                }}>{s.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{s.sessions} sesiones · racha {s.streak}d</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Ficha semanal */}
      <div style={{ ...card, marginBottom: 14 }}>
        <div style={cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarDays style={{ width: 14, height: 14, color: '#a78bfa' }} />
            </div>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)' }}>Ficha semanal</span>
          </div>
          <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>Junio 2026</span>
        </div>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 90px 70px', gap: 0, padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['Semana', 'Sesiones', 'Asistencia', 'Ingresos', 'Estado'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
          ))}
        </div>
        {weeklyData.map((w, i) => (
          <div key={w.week} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 90px 70px', gap: 0, padding: '13px 20px', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{w.week}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{w.dates}</div>
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t1)' }}>{w.sessions}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: w.attendancePct >= 88 ? '#4ade80' : '#fbbf24' }}>{w.attendancePct}%</span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 500 }}>{w.revenue}</span>
            <span style={{
              fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999, display: 'inline-block',
              background: w.status === 'ok' ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)',
              color: w.status === 'ok' ? '#4ade80' : '#fbbf24',
            }}>
              {w.status === 'ok' ? 'Normal' : 'Baja'}
            </span>
          </div>
        ))}
      </div>

      {/* Downloadable reports */}
      <div style={card}>
        <div style={cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Download style={{ width: 14, height: 14, color: '#60a5fa' }} />
            </div>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)' }}>Reportes descargables</span>
          </div>
        </div>
        <div>
          {reports.map((r, i) => (
            <div key={r.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '13px 20px',
              borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, padding: '3px 6px', borderRadius: 5,
                background: r.type === 'PDF' ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.1)',
                color: r.type === 'PDF' ? '#f87171' : '#4ade80',
                letterSpacing: '0.04em', flexShrink: 0,
              }}>{r.type}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 500 }}>{r.label}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{r.size}</div>
              </div>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 7, padding: '5px 11px', fontSize: 12, color: 'var(--t1)', cursor: 'pointer',
              }}>
                <Download style={{ width: 12, height: 12 }} /> Descargar
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
