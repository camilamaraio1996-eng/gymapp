import { TrendingUp, Zap, Medal, Activity, ChevronUp, Minus } from 'lucide-react'

const kpis = [
  { label: 'Alumnos activos',      value: '24',  sub: '3 nuevos esta semana',    icon: Activity,  iconColor: '#4ade80', iconBg: 'rgba(74,222,128,0.12)'  },
  { label: 'Sesiones / semana',    value: '3.4', sub: 'Promedio del gym',         icon: TrendingUp, iconColor: '#60a5fa', iconBg: 'rgba(96,165,250,0.12)'  },
  { label: 'Récords este mes',     value: '11',  sub: 'Máximos personales',       icon: Medal,     iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)'  },
  { label: 'Carga promedio',       value: '68kg', sub: '+4kg vs mes anterior',    icon: Zap,       iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)' },
]

const students = [
  { name: 'Carlos Mendoza',   initials: 'CM', sessions: 16, goal: 20, streak: 12, trend: 'up',   pr: '120kg squat'  },
  { name: 'Laura Gómez',      initials: 'LG', sessions: 14, goal: 16, streak: 8,  trend: 'up',   pr: '70kg bench'   },
  { name: 'Diego Fernández',  initials: 'DF', sessions: 12, goal: 16, streak: 5,  trend: 'flat', pr: '—'            },
  { name: 'Valentina Suárez', initials: 'VS', sessions: 10, goal: 12, streak: 10, trend: 'up',   pr: '60kg peso muerto' },
  { name: 'Nicolás Torres',   initials: 'NT', sessions: 8,  goal: 12, streak: 3,  trend: 'flat', pr: '—'            },
  { name: 'Ana López',        initials: 'AL', sessions: 6,  goal: 12, streak: 2,  trend: 'down', pr: '—'            },
]

const categories = [
  { label: 'Fuerza',       pct: 72, color: '#ff3d1a' },
  { label: 'Cardio',       pct: 55, color: '#60a5fa' },
  { label: 'Flexibilidad', pct: 41, color: '#4ade80' },
  { label: 'Resistencia',  pct: 63, color: '#a78bfa' },
]

const weeklyData = [
  { day: 'L', pct: 60 }, { day: 'M', pct: 80 }, { day: 'M', pct: 45 },
  { day: 'J', pct: 90 }, { day: 'V', pct: 70 }, { day: 'S', pct: 50 }, { day: 'D', pct: 20 },
]

export default function ProgresoPage() {
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
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Progreso</div>
        <div style={{ fontSize: 13.5, color: 'var(--t2)', marginTop: 5 }}>Seguimiento de rendimiento del gym — junio 2026</div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid stagger" style={{ marginBottom: 20 }}>
        {kpis.map(({ label, value, sub, icon: Icon, iconColor, iconBg }) => (
          <div key={label} style={{ ...card, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 16, height: 16, color: iconColor }} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--t1)', lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 7, fontWeight: 500 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Student progress table */}
        <div style={card}>
          <div style={cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp style={{ width: 14, height: 14, color: '#4ade80' }} />
              </div>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)' }}>Progreso por alumno</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>Este mes</span>
          </div>
          <div>
            {students.map((s, i) => {
              const pct = Math.round((s.sessions / s.goal) * 100)
              return (
                <div key={s.name} style={{
                  padding: '12px 20px',
                  borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(255,61,26,0.08)', border: '1px solid rgba(255,61,26,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10.5, fontWeight: 700, color: 'var(--primary)',
                    }}>{s.initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 500 }}>{s.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {s.trend === 'up'   && <ChevronUp style={{ width: 13, height: 13, color: '#4ade80' }} />}
                          {s.trend === 'down' && <ChevronUp style={{ width: 13, height: 13, color: '#f87171', transform: 'rotate(180deg)' }} />}
                          {s.trend === 'flat' && <Minus style={{ width: 13, height: 13, color: '#fb923c' }} />}
                          <span style={{ fontSize: 12, color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>{s.sessions}/{s.goal} sesiones</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(pct, 100)}%`,
                      background: pct >= 80 ? '#4ade80' : pct >= 50 ? '#fb923c' : '#f87171',
                      borderRadius: 999,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  {s.pr !== '—' && (
                    <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Medal style={{ width: 11, height: 11 }} /> PR: {s.pr}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: categories + weekly chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Categories */}
          <div style={card}>
            <div style={cardHeader}>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)' }}>Por categoría</span>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {categories.map(cat => (
                <div key={cat.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--t1)' }}>{cat.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>{cat.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${cat.pct}%`, background: cat.color, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly chart */}
          <div style={card}>
            <div style={cardHeader}>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)' }}>Esta semana</span>
              <span style={{ fontSize: 11, color: 'var(--t3)', background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: 999 }}>sesiones</span>
            </div>
            <div style={{ padding: '20px 20px 12px', display: 'flex', alignItems: 'flex-end', gap: 6, height: 110 }}>
              {weeklyData.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{
                    width: '100%', borderRadius: '4px 4px 0 0',
                    background: d.pct > 70 ? 'var(--primary)' : 'rgba(255,61,26,0.3)',
                    height: `${d.pct}%`,
                    transition: 'height 0.3s ease',
                  }} />
                  <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600 }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
