import { createClient } from '@/lib/supabase/server'
import { Users, ClipboardList, ArrowRight, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function ProfesorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profesor } = await supabase
    .from('profesores')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  const [{ data: misAlumnos }, { data: rutinas }, { data: ultimasRutinas }] = await Promise.all([
    supabase.from('alumnos').select('id, nombre, apellido, objetivo').eq('profesor_id', profesor?.id ?? ''),
    supabase.from('rutinas').select('id', { count: 'exact', head: true }).eq('created_by', user!.id),
    supabase.from('rutinas').select('id, nombre, objetivo, dias_por_semana, updated_at')
      .eq('created_by', user!.id).order('updated_at', { ascending: false }).limit(5),
  ])

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Mi panel</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-0.5">
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/profesor/alumnos">
          <Card className="hover:border-[var(--primary)]/30 transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold">{misAlumnos?.length ?? 0}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Mis alumnos</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/profesor/rutinas">
          <Card className="hover:border-[var(--primary)]/30 transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-3">
                <ClipboardList className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <p className="text-2xl font-bold">{(rutinas as unknown as { count: number })?.count ?? 0}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Mis rutinas</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* My students */}
      {misAlumnos?.length ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mis alumnos</CardTitle>
              <Link href="/profesor/alumnos" className="text-xs text-[var(--primary)] flex items-center gap-1 hover:underline">
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-[var(--border)]">
              {misAlumnos.slice(0, 5).map((alumno) => (
                <div key={alumno.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center text-sm font-bold text-[var(--primary)]">
                      {alumno.nombre[0]}{alumno.apellido[0]}
                    </div>
                    <p className="text-sm font-medium">{alumno.nombre} {alumno.apellido}</p>
                  </div>
                  {alumno.objetivo && <Badge variant="secondary" className="text-[10px]">{alumno.objetivo}</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-10 h-10 text-[var(--muted-foreground)] mx-auto mb-2" />
            <p className="text-sm text-[var(--muted-foreground)]">Todavía no tenés alumnos asignados.</p>
          </CardContent>
        </Card>
      )}

      {/* Recent routines */}
      {ultimasRutinas?.length ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Últimas modificaciones</CardTitle>
              <Link href="/profesor/rutinas" className="text-xs text-[var(--primary)] flex items-center gap-1 hover:underline">
                Ver todas <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-[var(--border)]">
              {ultimasRutinas.map((rutina) => (
                <div key={rutina.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{rutina.nombre}</p>
                    {rutina.objetivo && <p className="text-xs text-[var(--muted-foreground)]">{rutina.objetivo}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(rutina.updated_at), 'd MMM', { locale: es })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
