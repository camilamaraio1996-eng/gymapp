import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { RoutineCard } from './routine-card'

export default async function ProfesorProfile({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Obtener al alumno actual
  const { data: alumno } = await supabase
    .from('alumnos')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  // Obtener al profesor
  const { data: profesor } = await supabase
    .from('profesores')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!profesor) {
    return <div>Profesor no encontrado</div>
  }

  // Obtener rutinas creadas por el profesor
  const { data: rutinas } = await supabase
    .from('rutinas')
    .select('*')
    .eq('created_by', profesor.user_id)
    .order('created_at', { ascending: false })

  // Obtener asignaciones actuales del alumno para saber cuáles ya guardó
  const { data: asignaciones } = await supabase
    .from('asignaciones')
    .select('rutina_id')
    .eq('alumno_id', alumno?.id ?? '')

  const assignedRoutineIds = new Set(asignaciones?.map(a => a.rutina_id) || [])

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Link href="/alumno/profesores" className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] w-fit">
        <ArrowLeft className="w-4 h-4" />
        Volver a profesores
      </Link>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-purple-400/10 flex items-center justify-center text-2xl font-bold text-purple-400 shrink-0">
          {profesor.nombre[0]}{profesor.apellido[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profesor.nombre} {profesor.apellido}</h1>
          <p className="text-[var(--muted-foreground)]">
            {profesor.especialidad || 'Entrenador'}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--border)]">
        <h2 className="text-lg font-bold mb-4">Rutinas Disponibles</h2>
        
        {rutinas && rutinas.length > 0 ? (
          <div className="flex flex-col gap-3">
            {rutinas.map((rutina) => (
              <RoutineCard 
                key={rutina.id} 
                rutina={rutina} 
                alumnoId={alumno?.id} 
                isAlreadyAssigned={assignedRoutineIds.has(rutina.id)} 
              />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-2xl">
            Este profesor aún no ha subido rutinas.
          </div>
        )}
      </div>
    </div>
  )
}
