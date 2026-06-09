'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dumbbell, Plus, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function RoutineCard({ 
  rutina, 
  alumnoId, 
  isAlreadyAssigned 
}: { 
  rutina: any, 
  alumnoId: string,
  isAlreadyAssigned: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [assigned, setAssigned] = useState(isAlreadyAssigned)

  async function handleSaveRoutine() {
    if (assigned) return

    setLoading(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('asignaciones')
        .insert({
          rutina_id: rutina.id,
          alumno_id: alumnoId,
          activa: true
        })

      if (error) {
        toast.error(`Error al guardar la rutina: ${error.message}`)
      } else {
        toast.success('¡Rutina guardada en tu perfil!')
        setAssigned(true)
        router.refresh()
      }
    } catch (err: any) {
      toast.error('Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={`transition-all ${assigned ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'hover:border-[var(--primary)]/30'}`}>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{rutina.nombre}</p>
            {rutina.objetivo && (
              <p className="text-xs text-[var(--muted-foreground)] truncate">{rutina.objetivo}</p>
            )}
            <div className="flex gap-1.5 mt-1">
              <Badge variant="secondary" className="text-[10px]">{rutina.dias_por_semana}x semana</Badge>
            </div>
          </div>
        </div>
        
        <Button 
          variant={assigned ? "outline" : "default"} 
          size="sm"
          className={assigned ? "text-[var(--primary)] border-[var(--primary)]" : ""}
          onClick={handleSaveRoutine}
          disabled={loading || assigned}
        >
          {assigned ? (
            <><Check className="w-4 h-4 mr-1" /> Guardada</>
          ) : (
            <><Plus className="w-4 h-4 mr-1" /> Guardar</>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
