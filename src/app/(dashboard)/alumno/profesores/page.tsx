import { createClient } from '@/lib/supabase/server'
import { Search, UserCheck, Dumbbell, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default async function ProfesoresDirectory({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const supabase = await createClient()
  const q = searchParams.q || ''

  // Fetch profesores
  let query = supabase
    .from('profesores')
    .select('*')
    .order('nombre', { ascending: true })

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,especialidad.ilike.%${q}%`)
  }

  const { data: profesores } = await query

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Buscar Profesor</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-0.5">
          Encuentra a tu profe y busca tus rutinas
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
        <Input 
          type="search" 
          placeholder="Buscar por nombre o especialidad..." 
          className="pl-9 bg-[var(--card)] border-[var(--border)]"
          defaultValue={q}
          // Note: In a real app we'd use a client component for real-time search, 
          // but for simplicity we rely on native form submission or just the UI for now.
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {profesores?.length ? (
          profesores.map((prof) => (
            <Link key={prof.id} href={`/alumno/profesores/${prof.id}`}>
              <Card className="hover:border-[var(--primary)]/50 transition-all cursor-pointer h-full">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-400/10 flex items-center justify-center text-lg font-bold text-purple-400 shrink-0">
                      {prof.nombre[0]}{prof.apellido[0]}
                    </div>
                    <div>
                      <p className="font-semibold">{prof.nombre} {prof.apellido}</p>
                      {prof.especialidad ? (
                        <p className="text-xs text-[var(--muted-foreground)]">{prof.especialidad}</p>
                      ) : (
                        <p className="text-xs text-[var(--muted-foreground)]">Entrenador</p>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-10 text-center text-[var(--muted-foreground)]">
            No se encontraron profesores.
          </div>
        )}
      </div>
    </div>
  )
}
