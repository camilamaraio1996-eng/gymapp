import { createClient } from '@/lib/supabase/server'
import { Dumbbell, Target, UserCheck, ArrowRight, ClipboardList } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function AlumnoHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: alumno }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user!.id).single(),
    supabase.from('alumnos').select('*, profesor:profesores(nombre, apellido, especialidad)').eq('user_id', user!.id).single(),
  ])

  const { data: asignaciones } = await supabase
    .from('asignaciones')
    .select('*, rutina:rutinas(nombre, objetivo, dias_por_semana, ejercicios(*))')
    .eq('alumno_id', alumno?.id ?? '')
    .eq('activa', true)
    .limit(3)

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Welcome hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[#b5f23a] p-5">
        <div className="relative z-10">
          <p className="text-black/70 text-sm font-medium">{saludo} 👋</p>
          <h1 className="text-black text-2xl font-bold mt-0.5">
            {profile?.nombre ?? 'Atleta'}
          </h1>
          <p className="text-black/60 text-sm mt-1">
            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
          <Dumbbell className="w-24 h-24 text-black" />
        </div>
      </div>

      {/* Objetivo */}
      {alumno?.objetivo && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/5">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">Objetivo actual</p>
            <p className="font-semibold text-sm">{alumno.objetivo}</p>
          </div>
        </div>
      )}

      {/* Profesor */}
      {alumno?.profesor && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="w-10 h-10 rounded-full bg-purple-400/10 flex items-center justify-center text-sm font-bold text-purple-400 shrink-0">
            {(alumno.profesor as { nombre: string; apellido: string }).nombre[0]}
            {(alumno.profesor as { nombre: string; apellido: string }).apellido[0]}
          </div>
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">Profesor asignado</p>
            <p className="font-semibold text-sm">
              {(alumno.profesor as { nombre: string; apellido: string }).nombre} {(alumno.profesor as { nombre: string; apellido: string }).apellido}
            </p>
            {(alumno.profesor as { especialidad?: string }).especialidad && (
              <p className="text-xs text-[var(--muted-foreground)]">{(alumno.profesor as { especialidad?: string }).especialidad}</p>
            )}
          </div>
          <UserCheck className="w-4 h-4 text-purple-400 ml-auto" />
        </div>
      )}

      {/* Active routines preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">Rutinas activas</h2>
          <Link href="/alumno/rutinas" className="text-xs text-[var(--primary)] flex items-center gap-1 hover:underline">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {!asignaciones?.length ? (
          <Card>
            <CardContent className="p-6 text-center">
              <ClipboardList className="w-10 h-10 text-[var(--muted-foreground)] mx-auto mb-2" />
              <p className="text-sm text-[var(--muted-foreground)]">No tenés rutinas asignadas aún.</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Tu profesor las configurará pronto.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {asignaciones.map((asig) => {
              const rutina = asig.rutina as { nombre: string; objetivo: string; dias_por_semana: number; ejercicios: unknown[] }
              return (
                <Link key={asig.id} href="/alumno/rutinas">
                  <Card className="hover:border-[var(--primary)]/30 transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                            <Dumbbell className="w-5 h-5 text-[var(--primary)]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{rutina?.nombre}</p>
                            <div className="flex gap-1.5 mt-0.5">
                              <Badge variant="secondary" className="text-[10px]">{rutina?.dias_por_semana}x semana</Badge>
                              <Badge variant="secondary" className="text-[10px]">{rutina?.ejercicios?.length ?? 0} ejercicios</Badge>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* CTA */}
      <Link href="/alumno/rutinas">
        <Button className="w-full" size="lg">
          <Dumbbell className="w-5 h-5" />
          Ver mis rutinas
        </Button>
      </Link>
    </div>
  )
}
