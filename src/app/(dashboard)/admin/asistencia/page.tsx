import { Calendar, Users, TrendingUp, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const today = new Date()
const monthName = format(today, 'MMMM yyyy', { locale: es })
const dayOfMonth = today.getDate()

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

// Generate calendar cells for current month
function buildCalendar() {
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const attendanceByDay: Record<number, 'high' | 'mid' | 'low' | 'absent'> = {
  1: 'high', 2: 'high', 3: 'mid', 4: 'high', 5: 'high', 6: 'mid', 7: 'low',
  8: 'high', 9: 'high', 10: 'mid', 11: 'high', 12: 'high', 13: 'mid', 14: 'absent',
  15: 'high', 16: 'high', 17: 'mid', 18: 'high', 19: 'high', 20: 'mid', 21: 'low',
  22: 'high', 23: 'high', 24: 'mid', 25: 'high', 26: 'high', 27: 'mid', 28: 'absent',
}

const dayDotColor = {
  high: '#4ade80',
  mid: '#fb923c',
  low: '#f87171',
  absent: 'rgba(255,255,255,0.1)',
}

const sessions = [
  { name: 'Carlos Mendoza',    initials: 'CM', time: '07:00', status: 'presente' },
  { name: 'Laura Gómez',       initials: 'LG', time: '08:30', status: 'presente' },
  { name: 'Matías Rodríguez',  initials: 'MR', time: '09:00', status: 'ausente'  },
  { name: 'Valentina Suárez',  initials: 'VS', time: '10:00', status: 'presente' },
  { name: 'Diego Fernández',   initials: 'DF', time: '11:30', status: 'presente' },
  { name: 'Camila Reyes',      initials: 'CR', time: '17:00', status: 'tarde'    },
  { name: 'Nicolás Torres',    initials: 'NT', time: '18:00', status: 'presente' },
  { name: 'Ana López',         initials: 'AL', time: '19:30', status: 'ausente'  },
]

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  presente: { bg: 'rgba(74,222,128,0.1)',  color: '#4ade80', label: 'Presente' },
  ausente:  { bg: 'rgba(248,113,113,0.1)', color: '#f87171', label: 'Ausente'  },
  tarde:    { bg: 'rgba(251,146,60,0.1)',  color: '#fb923c', label: 'Tarde'    },
}

const kpis = [
  { label: 'Sesiones este mes',  value: '142',  sub: '+18% vs mes anterior',  icon: Calendar,    iconColor: '#60a5fa', iconBg: 'rgba(96,165,250,0.12)'  },
  { label: 'Tasa de asistencia', value: '87%',  sub: 'Meta: 80% ✓',            icon: TrendingUp,  iconColor: '#4ade80', iconBg: 'rgba(74,222,128,0.12)'  },
  { label: 'Presentes hoy',      value: '6/8',  sub: '2 ausencias registradas', icon: Users,       iconColor: '#fb923c', iconBg: 'rgba(251,146,60,0.12)'  },
  { label: 'Racha activa',       value: '12d',  sub: 'Récord del gym',          icon: CheckCircle2, iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)' },
]

export default function AsistenciaPage() {
  const cells = buildCalendar()

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

  const presentCount = sessions.filter(s => s.status === 'presente').length
  const absentCount  = sessions.filter(s => s.status === 'ausente').length

  return (
    <div className="animate-fade-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Asistencia</div>
          <div style={{ fontSize: 13.5, color: 'var(--t2)', marginTop: 5, textTransform: 'capitalize' }}>{monthName}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '7px 14px', fontSize: 13, color: 'var(--t1)', cursor: 'pointer',
          }}>
            <Clock style={{ width: 13, height: 13 }} /> Registrar sesión
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--primary)', border: 'none',
            borderRadius: 8, padding: '7px 14px', fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 600,
          }}>
            Exportar
          </button>
        </div>
      </div>

      {/* Alert */}
      {absentCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.2)',
          borderRadius: 10, padding: '11px 16px', marginBottom: 20, fontSize: 13,
        }}>
          <AlertCircle style={{ width: 15, height: 15, color: '#fb923c', flexShrink: 0 }} />
          <span style={{ color: 'var(--t2)' }}>
            <b style={{ color: '#fb923c' }}>{absentCount} alumno{absentCount !== 1 ? 's' : ''}</b> ausentes hoy. Considera notificarlos.
          </span>
        </div>
      )}

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>

        {/* Calendar */}
        <div style={card}>
          <div style={cardHeader}>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)', textTransform: 'capitalize' }}>{monthName}</span>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--t3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Alta</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fb923c', display: 'inline-block' }} /> Media</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} /> Baja</span>
            </div>
          </div>
          <div style={{ padding: '14px 16px' }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
              {DAYS.map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 600, color: 'var(--t3)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d}</div>
              ))}
            </div>
            {/* Calendar cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {cells.map((day, i) => {
                if (!day) return <div key={i} />
                const level = attendanceByDay[day]
                const isToday = day === dayOfMonth
                const isPast = day < dayOfMonth
                return (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '5px 2px',
                    borderRadius: 7,
                    background: isToday ? 'rgba(255,61,26,0.12)' : 'transparent',
                    border: isToday ? '1px solid rgba(255,61,26,0.3)' : '1px solid transparent',
                  }}>
                    <span style={{ fontSize: 11.5, fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--primary)' : 'var(--t2)' }}>{day}</span>
                    {isPast && level && (
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: dayDotColor[level], display: 'block', marginTop: 2 }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Today's sessions */}
        <div style={card}>
          <div style={cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users style={{ width: 14, height: 14, color: '#4ade80' }} />
              </div>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)' }}>Sesiones de hoy</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>{presentCount} de {sessions.length} presentes</span>
          </div>
          <div>
            {sessions.map((s, i) => {
              const st = statusStyle[s.status]
              return (
                <div key={s.name} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 20px',
                  borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,61,26,0.08)', border: '1px solid rgba(255,61,26,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10.5, fontWeight: 700, color: 'var(--primary)',
                  }}>{s.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{s.time} hs</div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999,
                    background: st.bg, color: st.color,
                  }}>{st.label}</span>
                  {s.status === 'ausente'
                    ? <XCircle style={{ width: 14, height: 14, color: '#f87171', flexShrink: 0 }} />
                    : <CheckCircle2 style={{ width: 14, height: 14, color: '#4ade80', flexShrink: 0 }} />
                  }
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
