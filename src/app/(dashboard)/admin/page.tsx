import { createClient } from '@/lib/supabase/server'
import { Users, UserCheck, Dumbbell, AlertTriangle, UserPlus, PlusCircle, BarChart2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalAlumnos },
    { count: totalProfesores },
    { count: rutinasActivas },
    { count: sinRutina },
    { data: ultimos },
  ] = await Promise.all([
    supabase.from('alumnos').select('*', { count: 'exact', head: true }),
    supabase.from('profesores').select('*', { count: 'exact', head: true }),
    supabase.from('asignaciones').select('*', { count: 'exact', head: true }).eq('activa', true),
    supabase.from('alumnos').select('id', { count: 'exact', head: true })
      .not('id', 'in', `(select alumno_id from asignaciones where activa = true)`),
    supabase.from('alumnos')
      .select('id, nombre, apellido, email, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const totalA     = totalAlumnos    ?? 0
  const totalP     = totalProfesores ?? 0
  const activos    = rutinasActivas  ?? 0
  const sinRutinaC = sinRutina       ?? 0

  const today = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })

  const kpis = [
    {
      label: 'Alumnos activos', value: totalA, href: '/admin/alumnos',
      Icon: Users, iconColor: '#4ade80', iconBg: 'rgba(74,222,128,0.12)',
      sub: totalA > 0 ? `${totalA} inscriptos` : 'Sin registros',
      subColor: totalA > 0 ? '#4ade80' : ('var(--t3)' as string),
    },
    {
      label: 'Profesores', value: totalP, href: '/admin/profesores',
      Icon: UserCheck, iconColor: '#60a5fa', iconBg: 'rgba(96,165,250,0.12)',
      sub: `${totalP} activo${totalP !== 1 ? 's' : ''} este mes`,
      subColor: 'var(--t3)' as string,
    },
    {
      label: 'Rutinas activas', value: activos, href: '/admin/rutinas',
      Icon: Dumbbell, iconColor: '#fb923c', iconBg: 'rgba(251,146,60,0.12)',
      sub: `${activos} en curso`,
      subColor: 'var(--t3)' as string,
    },
    {
      label: 'Sin rutina', value: sinRutinaC, href: '/admin/alumnos',
      Icon: AlertTriangle, iconColor: '#f87171', iconBg: 'rgba(248,113,113,0.12)',
      sub: sinRutinaC > 0 ? 'Acción requerida' : 'Todo asignado ✓',
      subColor: sinRutinaC > 0 ? '#f87171' : '#4ade80',
    },
  ]

  const quickActions = [
    { label: 'Nuevo alumno',   sub: 'Registrar en el sistema',     href: '/admin/alumnos',    Icon: UserPlus,   iconColor: '#4ade80', iconBg: 'rgba(74,222,128,0.12)'  },
    { label: 'Crear rutina',   sub: 'Armar plan de entrenamiento', href: '/admin/rutinas',    Icon: PlusCircle, iconColor: '#60a5fa', iconBg: 'rgba(96,165,250,0.12)'  },
    { label: 'Ver profesores', sub: `${totalP} activos este mes`,  href: '/admin/profesores', Icon: UserCheck,  iconColor: '#fb923c', iconBg: 'rgba(251,146,60,0.12)'  },
    { label: 'Ver reportes',   sub: 'Estadísticas del mes',        href: '/admin/reportes',   Icon: BarChart2,  iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)' },
  ]

  const dotColors = ['#AAFF00', '#60a5fa', '#fb923c', '#f87171', '#a78bfa']

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

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Dashboard
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--t2)', marginTop: 5 }}>{today}</div>
      </div>

      {/* Alert banner */}
      {sinRutinaC > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 10, padding: '11px 16px', marginBottom: 20, fontSize: 13,
        }}>
          <AlertTriangle style={{ width: 15, height: 15, color: '#f87171', flexShrink: 0 } as React.CSSProperties} />
          <span style={{ color: 'var(--t2)' }}>
            <b style={{ color: '#f87171' }}>{sinRutinaC} alumno{sinRutinaC !== 1 ? 's' : ''}</b> sin rutina asignada.{' '}
            <Link href="/admin/alumnos" style={{ color: '#f87171', fontWeight: 600, textDecoration: 'underline' }}>Ver →</Link>
          </span>
        </div>
      )}

      {/* KPI grid */}
      <div className="kpi-grid stagger" style={{ marginBottom: 20 }}>
        {kpis.map(({ label, value, Icon, iconBg, iconColor, sub, subColor, href }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div className="card-hover" style={{ ...card, padding: '20px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {label}
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 16, height: 16, color: iconColor } as React.CSSProperties} />
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--t1)', lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                {value}
              </div>
              <div style={{ fontSize: 11.5, color: subColor, marginTop: 7, fontWeight: 500 }}>{sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main 2-col grid */}
      <div className="grid-admin-main">

        {/* Registros recientes */}
        <div style={card}>
          <div style={cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users style={{ width: 14, height: 14, color: '#4ade80' } as React.CSSProperties} />
              </div>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)' }}>Registros recientes</span>
            </div>
            <Link href="/admin/alumnos" className="link-hover" style={{ fontSize: 12.5, color: 'var(--t3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              Ver todos <ChevronRight style={{ width: 12, height: 12 } as React.CSSProperties} />
            </Link>
          </div>

          {!ultimos?.length ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <Users style={{ width: 36, height: 36, color: 'var(--t3)', margin: '0 auto 12px', display: 'block' } as React.CSSProperties} />
              <div style={{ fontSize: 14, color: 'var(--t2)', fontWeight: 500 }}>Sin alumnos registrados</div>
              <div style={{ fontSize: 12.5, color: 'var(--t3)', marginTop: 4 }}>Los nuevos registros aparecerán acá.</div>
            </div>
          ) : (
            <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.016)' }}>
                  {['Alumno', 'Estado', 'Ingreso', ''].map((h, i) => (
                    <th key={i} style={{
                      textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: 'var(--t3)',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      padding: '10px 20px', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ultimos.map((alumno) => (
                  <tr key={alumno.id} className="row-hover" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 20px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                          background: 'rgba(170,255,0,0.08)', border: '1px solid rgba(170,255,0,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10.5, fontWeight: 700, color: 'var(--primary)',
                        }}>
                          {alumno.nombre[0]}{alumno.apellido[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--t1)', fontSize: 13.5 }}>{alumno.nombre} {alumno.apellido}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 1 }}>{alumno.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', verticalAlign: 'middle' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999,
                        background: 'rgba(170,255,0,0.1)', color: 'var(--primary)',
                      }}>
                        Activo
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', verticalAlign: 'middle', color: 'var(--t2)', fontSize: 12.5 }}>
                      {format(new Date(alumno.created_at), 'dd MMM yyyy', { locale: es })}
                    </td>
                    <td style={{ padding: '12px 20px', verticalAlign: 'middle' }}>
                      <Link href="/admin/alumnos" className="ghost-btn">Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Quick actions */}
          <div style={card}>
            <div style={cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Dumbbell style={{ width: 14, height: 14, color: '#60a5fa' } as React.CSSProperties} />
                </div>
                <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)' }}>Acciones rápidas</span>
              </div>
            </div>
            {quickActions.map(({ label, sub, href, Icon, iconColor, iconBg }) => (
              <Link key={label} href={href} className="action-row" style={{ textDecoration: 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 14, height: 14, color: iconColor } as React.CSSProperties} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 500 }}>{label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 1 }}>{sub}</div>
                </div>
                <ChevronRight style={{ width: 12, height: 12, color: 'var(--t3)', flexShrink: 0 } as React.CSSProperties} />
              </Link>
            ))}
          </div>

          {/* Activity */}
          <div style={card}>
            <div style={cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(251,146,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart2 style={{ width: 14, height: 14, color: '#fb923c' } as React.CSSProperties} />
                </div>
                <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)' }}>Actividad reciente</span>
              </div>
            </div>
            {!ultimos?.length ? (
              <div style={{ padding: '24px 20px', color: 'var(--t3)', fontSize: 12.5, textAlign: 'center' }}>Sin actividad registrada.</div>
            ) : (
              <div style={{ padding: '4px 0 8px' }}>
                {ultimos.slice(0, 5).map((alumno, i) => (
                  <div key={alumno.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '9px 20px',
                    borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColors[i % dotColors.length], marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.4 }}>
                        <b style={{ color: 'var(--t1)', fontWeight: 500 }}>{alumno.nombre} {alumno.apellido}</b> se registró
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                        {format(new Date(alumno.created_at), 'dd MMM, HH:mm', { locale: es })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  )
}
