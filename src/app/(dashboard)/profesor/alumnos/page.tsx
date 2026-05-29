import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'

export default async function ProfesorAlumnosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profesor } = await supabase
    .from('profesores').select('*').eq('user_id', user!.id).single()

  const { data: alumnos } = await supabase
    .from('alumnos')
    .select('*, asignaciones(id, activa, rutinas(nombre))')
    .eq('profesor_id', profesor?.id ?? '')
    .order('nombre')

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Mis alumnos</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{alumnos?.length ?? 0} asignados</p>
      </div>

      {!alumnos?.length ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3" />
          <p className="text-[var(--muted-foreground)]">No tenés alumnos asignados aún.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alumnos.map((alumno) => {
            const rutinasActivas = (alumno.asignaciones as Array<{ activa: boolean; rutinas: { nombre: string } | null }>)
              ?.filter(a => a.activa) ?? []
            return (
              <Card key={alumno.id} className="hover:border-[var(--border)]/80 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-sm font-bold text-[var(--primary)]">
                      {alumno.nombre[0]}{alumno.apellido[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{alumno.nombre} {alumno.apellido}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">{alumno.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {alumno.objetivo && <Badge variant="secondary" className="text-[10px]">{alumno.objetivo}</Badge>}
                    {rutinasActivas.length > 0 && (
                      <Badge variant="success" className="text-[10px]">{rutinasActivas.length} rutina activa</Badge>
                    )}
                  </div>
                  {alumno.observaciones && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-2 italic">{alumno.observaciones}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
