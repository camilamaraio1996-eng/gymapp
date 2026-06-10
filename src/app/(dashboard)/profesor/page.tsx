import { createClient } from '@/lib/supabase/server'
import { Users, Dumbbell, ArrowRight, Clock, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function ProfesorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profesor } = await supabase
    .from('profesores')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  const [{ data: misAlumnos }, { count: totalRutinas }, { data: ultimasRutinas }] = await Promise.all([
    supabase
      .from('alumnos')
      .select('id, nombre, apellido, objetivo, created_at')
      .eq('profesor_id', profesor?.id ?? '')
      .order('created_at', { ascending: false }),
    supabase
      .from('rutinas')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user!.id),
    supabase
      .from('rutinas')
      .select('id, nombre, objetivo, dias_por_semana, updated_at, created_at')
      .eq('created_by', user!.id)
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  const alumnosCount = misAlumnos?.length ?? 0
  const rutinasCount = totalRutinas ?? 0

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Header */}
      <div>
        <p className="text-sm text-[var(--text-muted)]">{saludo}</p>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5">
          {profesor?.nombre ?? 'Profesor'} {profesor?.apellido ?? ''}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/profesor/alumnos">
          <div className="group bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--primary)]/40 hover:bg-[var(--bg-elevated)] transition-all duration-150 cursor-pointer h-full">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold num">{alumnosCount}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Mis alumnos</p>
          </div>
        </Link>
        <Link href="/profesor/rutinas">
          <div className="group bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--primary)]/40 hover:bg-[var(--bg-elevated)] transition-all duration-150 cursor-pointer h-full">
            <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center mb-3">
              <Dumbbell className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <p className="text-2xl font-bold num">{rutinasCount}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Rutinas creadas</p>
          </div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">

        {/* Students list */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Mis alumnos</CardTitle>
              <Link href="/profesor/alumnos" className="text-xs text-[var(--primary)] flex items-center gap-1 hover:underline">
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!misAlumnos?.length ? (
              <div className="py-6 text-center flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center">
                  <Users className="w-5 h-5 text-[var(--text-muted)]" />
                </div>
                <p className="text-sm text-[var(--text-muted)]">Todavía no tenés alumnos asignados.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
                {misAlumnos.slice(0, 6).map((alumno) => (
                  <div key={alumno.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-xs font-bold text-[var(--primary)] shrink-0">
                      {alumno.nombre[0]}{alumno.apellido[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alumno.nombre} {alumno.apellido}</p>
                      {alumno.objetivo && (
                        <p className="text-xs text-[var(--text-muted)] truncate">{alumno.objetivo}</p>
                      )}
                    </div>
                  </div>
                ))}
                {misAlumnos.length > 6 && (
                  <p className="text-xs text-[var(--text-muted)] pt-2.5">
                    +{misAlumnos.length - 6} más
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Routines */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Rutinas recientes</CardTitle>
              <Link href="/profesor/rutinas" className="text-xs text-[var(--primary)] flex items-center gap-1 hover:underline">
                Ver todas <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!ultimasRutinas?.length ? (
              <div className="py-6 text-center flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-[var(--text-muted)]" />
                </div>
                <p className="text-sm text-[var(--text-muted)]">No creaste rutinas aún.</p>
                <Link href="/profesor/rutinas?new=true">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Crear primera rutina
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
                {ultimasRutinas.map((rutina) => (
                  <div key={rutina.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                      <Dumbbell className="w-3.5 h-3.5 text-[var(--primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rutina.nombre}</p>
                      <p className="text-xs text-[var(--text-muted)]">{rutina.dias_por_semana}x semana</p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[var(--text-disabled)] shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(rutina.updated_at), { locale: es, addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Nueva rutina',      href: '/profesor/rutinas?new=true', icon: Dumbbell },
          { label: 'Ver mis alumnos',   href: '/profesor/alumnos',          icon: Users },
        ].map(({ label, href, icon: Icon }) => (
          <Link key={label} href={href} className="group">
            <div className="flex items-center gap-2.5 px-3 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5 transition-all duration-150">
              <Icon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
              <span className="text-sm font-medium flex-1">{label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--border)] group-hover:text-[var(--primary)] transition-colors" />
            </div>
          </Link>
        ))}
      </div>

    </div>
  )
}
