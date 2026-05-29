'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, Circle, Dumbbell, Timer, RotateCcw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ProgresoMap {
  [ejercicioId: string]: boolean
}

export default function AlumnoRutinasPage() {
  const [asignaciones, setAsignaciones] = useState<any[]>([])
  const [progreso, setProgreso] = useState<Record<string, ProgresoMap>>({})
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [alumnoId, setAlumnoId] = useState<string | null>(null)

  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: alumno } = await supabase.from('alumnos').select('id').eq('user_id', user.id).single()
    if (!alumno) { setLoading(false); return }
    setAlumnoId(alumno.id)

    const { data: asigs } = await supabase
      .from('asignaciones')
      .select('*, rutina:rutinas(*, ejercicios(*))')
      .eq('alumno_id', alumno.id)
      .order('created_at', { ascending: false })

    const { data: prog } = await supabase
      .from('progreso')
      .select('*')
      .eq('alumno_id', alumno.id)
      .eq('fecha', today)

    const progresoMap: Record<string, ProgresoMap> = {}
    prog?.forEach(p => {
      if (!progresoMap[p.asignacion_id]) progresoMap[p.asignacion_id] = {}
      progresoMap[p.asignacion_id][p.ejercicio_id] = p.completado
    })

    const sorted = (asigs ?? []).map(a => ({
      ...a,
      rutina: {
        ...a.rutina,
        ejercicios: [...(a.rutina?.ejercicios ?? [])].sort((x: any, y: any) => x.orden - y.orden),
      },
    }))

    setAsignaciones(sorted)
    setProgreso(progresoMap)
    if (sorted.length > 0 && sorted[0].activa) setExpandedId(sorted[0].id)
    setLoading(false)
  }, [supabase, today])

  useEffect(() => { fetchData() }, [fetchData])

  async function toggleEjercicio(asignacionId: string, ejercicioId: string) {
    if (!alumnoId) return
    const current = progreso[asignacionId]?.[ejercicioId] ?? false
    const newVal = !current

    setProgreso(prev => ({
      ...prev,
      [asignacionId]: { ...prev[asignacionId], [ejercicioId]: newVal },
    }))

    const { error } = await supabase.from('progreso').upsert({
      asignacion_id: asignacionId,
      ejercicio_id: ejercicioId,
      alumno_id: alumnoId,
      completado: newVal,
      fecha: today,
    }, { onConflict: 'asignacion_id,ejercicio_id,fecha' })

    if (error) {
      setProgreso(prev => ({
        ...prev,
        [asignacionId]: { ...prev[asignacionId], [ejercicioId]: current },
      }))
      toast.error('Error al guardar progreso.')
    }
  }

  async function resetProgreso(asignacionId: string) {
    if (!alumnoId) return
    await supabase.from('progreso').delete()
      .eq('asignacion_id', asignacionId)
      .eq('alumno_id', alumnoId)
      .eq('fecha', today)

    setProgreso(prev => ({ ...prev, [asignacionId]: {} }))
    toast.success('Progreso reiniciado.')
  }

  function getCompletion(asignacionId: string, ejerciciosCount: number) {
    const p = progreso[asignacionId] ?? {}
    const done = Object.values(p).filter(Boolean).length
    return { done, total: ejerciciosCount, pct: ejerciciosCount ? Math.round((done / ejerciciosCount) * 100) : 0 }
  }

  if (loading) {
    return <div className="flex justify-center pt-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" /></div>
  }

  const activas = asignaciones.filter(a => a.activa)
  const historial = asignaciones.filter(a => !a.activa)

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Mis rutinas</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {!activas.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Dumbbell className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3" />
            <p className="font-semibold">Sin rutinas activas</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Tu profesor te asignará una rutina pronto.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {activas.map((asig) => {
            const rutina = asig.rutina
            const ejercicios = rutina?.ejercicios ?? []
            const { done, total, pct } = getCompletion(asig.id, ejercicios.length)
            const expanded = expandedId === asig.id

            return (
              <Card key={asig.id} className="overflow-hidden">
                {/* Header */}
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedId(expanded ? null : asig.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                          pct === 100 ? 'bg-green-400/20' : 'bg-[var(--primary)]/10'
                        )}>
                          <Dumbbell className={cn('w-5 h-5', pct === 100 ? 'text-green-400' : 'text-[var(--primary)]')} />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{rutina?.nombre}</CardTitle>
                          {rutina?.objetivo && (
                            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{rutina.objetivo}</p>
                          )}
                        </div>
                      </div>
                      {expanded ? <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)] shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] shrink-0 mt-1" />}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex gap-1.5">
                          <Badge variant={pct === 100 ? 'success' : 'secondary'} className="text-[10px]">
                            {pct === 100 ? '¡Completado!' : `${done}/${total} ejercicios`}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">{rutina?.dias_por_semana}x/semana</Badge>
                        </div>
                        <span className="text-xs font-bold text-[var(--primary)]">{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--accent)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {/* Exercise list */}
                {expanded && (
                  <CardContent className="pt-0">
                    <div className="flex flex-col gap-2">
                      {ejercicios.map((ej: any) => {
                        const completado = progreso[asig.id]?.[ej.id] ?? false
                        return (
                          <button
                            key={ej.id}
                            onClick={() => toggleEjercicio(asig.id, ej.id)}
                            className={cn(
                              'flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 text-left w-full',
                              completado
                                ? 'border-green-600/30 bg-green-600/10'
                                : 'border-[var(--border)] bg-[var(--accent)] hover:border-[var(--primary)]/30 active:scale-[0.98]'
                            )}
                          >
                            {completado
                              ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                              : <Circle className="w-5 h-5 text-[var(--muted-foreground)] shrink-0" />
                            }
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm font-medium', completado && 'line-through text-[var(--muted-foreground)]')}>
                                {ej.nombre}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-xs text-[var(--muted-foreground)]">
                                  {ej.series} series × {ej.repeticiones} reps
                                </span>
                                {ej.descanso && (
                                  <span className="flex items-center gap-0.5 text-xs text-[var(--muted-foreground)]">
                                    <Timer className="w-3 h-3" />{ej.descanso}
                                  </span>
                                )}
                              </div>
                              {ej.observaciones && (
                                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 italic">{ej.observaciones}</p>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {total > 0 && (
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetProgreso(asig.id)}
                          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reiniciar día
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* History */}
      {historial.length > 0 && (
        <div>
          <h2 className="font-bold text-sm text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Historial</h2>
          <div className="flex flex-col gap-2">
            {historial.map((asig) => (
              <Card key={asig.id} className="opacity-60">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center shrink-0">
                    <Dumbbell className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{asig.rutina?.nombre}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Asignada el {format(new Date(asig.fecha_asignacion), 'd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-[10px]">Inactiva</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
