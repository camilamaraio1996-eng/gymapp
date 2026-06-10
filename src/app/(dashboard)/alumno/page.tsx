import { createClient } from '@/lib/supabase/server'
import { Dumbbell, Target, UserCheck, ArrowRight, ClipboardList, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function AlumnoHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: alumno }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user!.id).single(),
    supabase
      .from('alumnos')
      .select('*, profesor:profesores(nombre, apellido, especialidad)')
      .eq('user_id', user!.id)
      .single(),
  ])

  const { data: asignaciones } = await supabase
    .from('asignaciones')
    .select('*, rutina:rutinas(nombre, objetivo, dias_por_semana, ejercicios(*))')
    .eq('alumno_id', alumno?.id ?? '')
    .eq('activa', true)
    .limit(3)

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const nombre = profile?.nombre ?? 'Atleta'

  type ProfesorData = { nombre: string; apellido: string; especialidad?: string }
  const prof = alumno?.profesor as ProfesorData | undefined

  return (
    <div className="flex flex-col gap-5 animate-fade-in">

      {/* Welcome */}
      <div>
        <p className="text-sm text-[var(--text-muted)]">{saludo}</p>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5">{nombre} 👋</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5 capitalize">
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {/* Primary CTA */}
      {asignaciones?.length ? (
        <Link href="/alumno/rutinas">
          <div className="relative overflow-hidden rounded-lg bg-[var(--primary)] p-5 cursor-pointer group">
            <div className="relative z-10">
              <p className="text-black/60 text-xs font-medium uppercase tracking-wide">Listo para entrenar</p>
              <p className="text-black text-xl font-bold mt-1">
                {(asignaciones[0].rutina as { nombre: string })?.nombre ?? 'Mi rutina'}
              </p>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="text-xs bg-black/15 text-black font-medium px-2.5 py-1 rounded-full">
                  Empezar ahora
                </span>
                <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-10">
              <Zap className="w-20 h-20 text-black" />
            </div>
          </div>
        </Link>
      ) : null}

      {/* Objetivo + Profesor row */}
      <div className="grid grid-cols-1 gap-3">

        {alumno?.objetivo && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Objetivo</p>
              <p className="text-sm font-semibold">{alumno.objetivo}</p>
            </div>
          </div>
        )}

        {prof && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
            <div className="w-8 h-8 rounded-full bg-purple-400/10 flex items-center justify-center text-xs font-bold text-purple-400 shrink-0">
              {prof.nombre[0]}{prof.apellido[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--text-muted)]">Profesor</p>
              <p className="text-sm font-semibold truncate">{prof.nombre} {prof.apellido}</p>
              {prof.especialidad && (
                <p className="text-xs text-[var(--text-muted)] truncate">{prof.especialidad}</p>
              )}
            </div>
            <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
          </div>
        )}
      </div>

      {/* Active routines */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Mis rutinas activas</h2>
          <Link href="/alumno/rutinas" className="text-xs text-[var(--primary)] flex items-center gap-1 hover:underline">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {!asignaciones?.length ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-[var(--text-muted)]" />
            </div>
            <div>
              <p className="text-sm font-medium">Sin rutinas asignadas</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Tu profesor aún no te asignó una rutina.
              </p>
            </div>
            <Link href="/alumno/profesores">
              <Button variant="outline" size="sm" className="gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Ver profesores
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {asignaciones.map((asig) => {
              const rutina = asig.rutina as {
                nombre: string
                objetivo?: string
                dias_por_semana: number
                ejercicios: unknown[]
              }
              return (
                <Link key={asig.id} href="/alumno/rutinas">
                  <div className="group flex items-center gap-3 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--primary)]/30 hover:bg-[var(--bg-elevated)] transition-all duration-150 cursor-pointer">
                    <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                      <Dumbbell className="w-4 h-4 text-[var(--primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{rutina?.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {rutina?.dias_por_semana}x por semana
                        </span>
                        <span className="text-[var(--border)]">·</span>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {rutina?.ejercicios?.length ?? 0} ejercicios
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] shrink-0 transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      {asignaciones?.length ? (
        <Link href="/alumno/rutinas">
          <Button className="w-full gap-2" size="lg">
            <Dumbbell className="w-4 h-4" />
            Ver mis rutinas
          </Button>
        </Link>
      ) : null}
    </div>
  )
}
