import { createClient } from '@/lib/supabase/server'
import { Users, UserCheck, ClipboardList, TrendingUp, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [{ count: totalAlumnos }, { count: totalProfesores }, { count: rutinasActivas }, { data: ultimos }] =
    await Promise.all([
      supabase.from('alumnos').select('*', { count: 'exact', head: true }),
      supabase.from('profesores').select('*', { count: 'exact', head: true }),
      supabase.from('asignaciones').select('*', { count: 'exact', head: true }).eq('activa', true),
      supabase.from('alumnos').select('id, nombre, apellido, email, fecha_ingreso, objetivo').order('created_at', { ascending: false }).limit(5),
    ])

  const stats = [
    { label: 'Alumnos', value: totalAlumnos ?? 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', href: '/admin/alumnos' },
    { label: 'Profesores', value: totalProfesores ?? 0, icon: UserCheck, color: 'text-purple-400', bg: 'bg-purple-400/10', href: '/admin/profesores' },
    { label: 'Rutinas activas', value: rutinasActivas ?? 0, icon: ClipboardList, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10', href: '/admin/rutinas' },
    { label: 'Crecimiento', value: '+12%', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10', href: '/admin/alumnos' },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-0.5">
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:border-[var(--primary)]/30 transition-all duration-200 cursor-pointer group">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent registrations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Últimos registros</CardTitle>
            <Link href="/admin/alumnos" className="text-xs text-[var(--primary)] flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!ultimos?.length ? (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-6">No hay alumnos registrados aún.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--border)]">
              {ultimos.map((alumno) => (
                <div key={alumno.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center text-sm font-bold text-[var(--primary)]">
                      {alumno.nombre[0]}{alumno.apellido[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{alumno.nombre} {alumno.apellido}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{alumno.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {alumno.objetivo && (
                      <Badge variant="secondary" className="text-[10px]">{alumno.objetivo}</Badge>
                    )}
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {alumno.fecha_ingreso ? format(new Date(alumno.fecha_ingreso), 'd MMM', { locale: es }) : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Nuevo alumno', href: '/admin/alumnos?new=true', desc: 'Registrar un alumno' },
          { label: 'Nuevo profesor', href: '/admin/profesores?new=true', desc: 'Agregar al equipo' },
          { label: 'Nueva rutina', href: '/admin/rutinas?new=true', desc: 'Crear entrenamiento' },
        ].map(({ label, href, desc }) => (
          <Link key={label} href={href}>
            <Card className="hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5 transition-all duration-200 cursor-pointer group">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
