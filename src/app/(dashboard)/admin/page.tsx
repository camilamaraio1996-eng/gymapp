import { createClient } from '@/lib/supabase/server'
import {
  Users, UserCheck, UserX, Dumbbell, Calendar, ArrowRight,
  ArrowUpRight, ArrowDownRight, AlertTriangle, Plus,
  ClipboardList,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalAlumnos },
    { count: totalProfesores },
    { count: rutinasActivas },
    { count: sinRutina },
    { data: ultimos },
    { data: ultimasRutinas },
  ] = await Promise.all([
    supabase.from('alumnos').select('*', { count: 'exact', head: true }),
    supabase.from('profesores').select('*', { count: 'exact', head: true }),
    supabase.from('asignaciones').select('*', { count: 'exact', head: true }).eq('activa', true),
    // alumnos with no active assignment
    supabase.from('alumnos').select('id', { count: 'exact', head: true })
      .not('id', 'in', `(select alumno_id from asignaciones where activa = true)`),
    supabase
      .from('alumnos')
      .select('id, nombre, apellido, email, fecha_ingreso, objetivo, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('rutinas')
      .select('id, nombre, objetivo, dias_por_semana, updated_at, created_at')
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const alumnos = totalAlumnos ?? 0
  const activos = rutinasActivas ?? 0
  const sinRutinaCount = Math.max(0, (sinRutina ?? 0))
  const inactivos = Math.max(0, alumnos - activos)

  const kpis = [
    {
      label: 'Total alumnos',
      value: alumnos,
      icon: Users,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      href: '/admin/alumnos',
      trend: null,
    },
    {
      label: 'Rutinas activas',
      value: activos,
      icon: Dumbbell,
      iconBg: 'bg-[var(--primary)]/10',
      iconColor: 'text-[var(--primary)]',
      href: '/admin/rutinas',
      trend: activos > 0 ? { dir: 'up', pct: Math.round((activos / Math.max(1, alumnos)) * 100) + '%' } : null,
      trendLabel: 'del total',
    },
    {
      label: 'Profesores',
      value: totalProfesores ?? 0,
      icon: UserCheck,
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      href: '/admin/profesores',
      trend: null,
    },
    {
      label: 'Sin rutina',
      value: sinRutinaCount,
      icon: UserX,
      iconBg: sinRutinaCount > 0 ? 'bg-[var(--warning)]/10' : 'bg-[var(--success)]/10',
      iconColor: sinRutinaCount > 0 ? 'text-[var(--warning)]' : 'text-[var(--success)]',
      href: '/admin/alumnos',
      trend: null,
      alert: sinRutinaCount > 0,
    },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
        <Link href="/admin/alumnos?new=true">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Nuevo alumno
          </Button>
        </Link>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        {kpis.map(({ label, value, icon: Icon, iconBg, iconColor, href, trend, trendLabel, alert }) => (
          <Link key={label} href={href}>
            <div className="group relative bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--primary)]/40 hover:bg-[var(--bg-elevated)] transition-all duration-200 cursor-pointer animate-fade-in">
              <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <p className="text-2xl font-bold num">{value}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-3 h-3 text-[var(--success)]" />
                  <span className="text-xs text-[var(--success)] font-medium">{trend.pct}</span>
                  {trendLabel && <span className="text-xs text-[var(--text-muted)]">{trendLabel}</span>}
                </div>
              )}
              {alert && value > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <AlertTriangle className="w-3 h-3 text-[var(--warning)]" />
                  <span className="text-xs text-[var(--warning)]">Requieren atención</span>
                </div>
              )}
              <ArrowRight className="absolute top-4 right-4 w-3.5 h-3.5 text-[var(--border)] group-hover:text-[var(--text-muted)] transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {/* Alerts section */}
      {sinRutinaCount > 0 && (
        <div className="rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[var(--warning)] mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text)]">
                {sinRutinaCount} alumno{sinRutinaCount > 1 ? 's' : ''} sin rutina asignada
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Asigná una rutina para que puedan comenzar a entrenar.
              </p>
            </div>
            <Link href="/admin/alumnos">
              <Button variant="outline" size="sm" className="text-xs shrink-0">
                Ver alumnos
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">

        {/* Recent registrations */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Últimos registros</CardTitle>
              <Link
                href="/admin/alumnos"
                className="text-xs text-[var(--primary)] flex items-center gap-1 hover:underline"
              >
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!ultimos?.length ? (
              <div className="py-8 text-center">
                <Users className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-40" />
                <p className="text-sm text-[var(--text-muted)]">No hay alumnos registrados aún.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
                {ultimos.map((alumno) => (
                  <div key={alumno.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-xs font-bold text-[var(--primary)] shrink-0">
                      {alumno.nombre[0]}{alumno.apellido[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alumno.nombre} {alumno.apellido}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{alumno.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {alumno.objetivo && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {alumno.objetivo}
                        </Badge>
                      )}
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {formatDistanceToNow(new Date(alumno.created_at), { locale: es, addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Recent routines */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Rutinas recientes</CardTitle>
                <Link href="/admin/rutinas" className="text-xs text-[var(--primary)] flex items-center gap-1 hover:underline">
                  Ver todas <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!ultimasRutinas?.length ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">Sin rutinas creadas.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {ultimasRutinas.map((r) => (
                    <div key={r.id} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-3.5 h-3.5 text-[var(--primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.nombre}</p>
                        <p className="text-xs text-[var(--text-muted)]">{r.dias_por_semana}x semana</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {[
                { label: 'Nuevo alumno',   href: '/admin/alumnos?new=true',    icon: Users },
                { label: 'Nuevo profesor', href: '/admin/profesores?new=true', icon: UserCheck },
                { label: 'Nueva rutina',   href: '/admin/rutinas?new=true',    icon: ClipboardList },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={label} href={href} className="group">
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5 transition-all duration-150 cursor-pointer">
                    <Icon className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                    <span className="text-sm font-medium">{label}</span>
                    <ArrowRight className="w-3 h-3 text-[var(--border)] group-hover:text-[var(--primary)] ml-auto transition-colors" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
