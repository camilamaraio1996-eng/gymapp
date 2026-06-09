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
        <h1 className="text-2xl font-bold gradient-text pb-1">Mis alumnos</h1>
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
              <Card key={alumno.id} className="glass hover:border-[var(--primary)]/50 hover:bg-[var(--accent)]/50 transition-all cursor-default">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-lg font-bold text-[var(--primary)] shadow-inner shadow-[var(--primary)]/20">
                      {alumno.nombre[0]}{alumno.apellido[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{alumno.nombre} {alumno.apellido}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">{alumno.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {alumno.objetivo && <Badge variant="secondary" className="text-[10px]">{alumno.objetivo}</Badge>}
                    {rutinasActivas.length > 0 && (
                      <Badge className="bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 text-[10px] shadow-[0_0_10px_rgba(232,255,71,0.3)]">{rutinasActivas.length} rutina activa</Badge>
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
