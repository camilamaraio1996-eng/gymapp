'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Copy, Dumbbell, Loader2, ChevronDown, ChevronUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Rutina, Ejercicio, Alumno } from '@/lib/supabase/types'

const emptyEjercicio = { nombre: '', series: 3, repeticiones: '10', descanso: '60s', observaciones: '' }

export default function RutinasPage() {
  const [rutinas, setRutinas] = useState<Rutina[]>([])
  const [alumnos, setAlumnos] = useState<Pick<Alumno, 'id' | 'nombre' | 'apellido'>[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [assignDialog, setAssignDialog] = useState<Rutina | null>(null)
  const [selectedAlumno, setSelectedAlumno] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [editing, setEditing] = useState<Rutina | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: '', objetivo: '', dias_por_semana: '3' })
  const [ejercicios, setEjercicios] = useState([{ ...emptyEjercicio }])

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: r }, { data: a }] = await Promise.all([
      supabase.from('rutinas').select('*, ejercicios(*)').order('created_at', { ascending: false }),
      supabase.from('alumnos').select('id, nombre, apellido').order('nombre'),
    ])
    const sorted = (r ?? []).map(rt => ({
      ...rt,
      ejercicios: [...(rt.ejercicios ?? [])].sort((a: Ejercicio, b: Ejercicio) => a.orden - b.orden),
    }))
    setRutinas(sorted)
    setAlumnos(a ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  function openNew() {
    setEditing(null)
    setForm({ nombre: '', objetivo: '', dias_por_semana: '3' })
    setEjercicios([{ ...emptyEjercicio }])
    setOpenDialog(true)
  }

  function openEdit(rutina: Rutina) {
    setEditing(rutina)
    setForm({ nombre: rutina.nombre, objetivo: rutina.objetivo ?? '', dias_por_semana: String(rutina.dias_por_semana) })
    setEjercicios(
      rutina.ejercicios?.length
        ? rutina.ejercicios.map(e => ({ nombre: e.nombre, series: e.series, repeticiones: e.repeticiones, descanso: e.descanso ?? '', observaciones: e.observaciones ?? '' }))
        : [{ ...emptyEjercicio }]
    )
    setOpenDialog(true)
  }

  function addEjercicio() {
    setEjercicios(prev => [...prev, { ...emptyEjercicio }])
  }

  function removeEjercicio(i: number) {
    setEjercicios(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateEjercicio(i: number, field: string, value: string | number) {
    setEjercicios(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
  }

  async function handleSave() {
    if (!form.nombre) { toast.error('El nombre de la rutina es obligatorio.'); return }
    if (ejercicios.some(e => !e.nombre)) { toast.error('Todos los ejercicios necesitan un nombre.'); return }
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (editing) {
      const { error } = await supabase.from('rutinas').update({
        nombre: form.nombre, objetivo: form.objetivo || null,
        dias_por_semana: parseInt(form.dias_por_semana),
      }).eq('id', editing.id)

      if (!error) {
        await supabase.from('ejercicios').delete().eq('rutina_id', editing.id)
        await supabase.from('ejercicios').insert(
          ejercicios.map((e, i) => ({ ...e, rutina_id: editing.id, orden: i, series: Number(e.series) }))
        )
        toast.success('Rutina actualizada.')
      } else { toast.error('Error al actualizar.') }
    } else {
      const { data: newRutina, error } = await supabase.from('rutinas').insert({
        nombre: form.nombre, objetivo: form.objetivo || null,
        dias_por_semana: parseInt(form.dias_por_semana),
        created_by: user?.id,
      }).select().single()

      if (!error && newRutina) {
        await supabase.from('ejercicios').insert(
          ejercicios.map((e, i) => ({ ...e, rutina_id: newRutina.id, orden: i, series: Number(e.series) }))
        )
        toast.success('Rutina creada.')
      } else { toast.error('Error al crear rutina.') }
    }

    setSaving(false)
    setOpenDialog(false)
    fetchData()
  }

  async function handleDuplicate(rutina: Rutina) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: newRutina, error } = await supabase.from('rutinas').insert({
      nombre: `${rutina.nombre} (copia)`, objetivo: rutina.objetivo,
      dias_por_semana: rutina.dias_por_semana, created_by: user?.id,
    }).select().single()

    if (!error && newRutina && rutina.ejercicios?.length) {
      await supabase.from('ejercicios').insert(
        rutina.ejercicios.map(e => ({
          rutina_id: newRutina.id, nombre: e.nombre, series: e.series,
          repeticiones: e.repeticiones, descanso: e.descanso, observaciones: e.observaciones, orden: e.orden,
        }))
      )
    }
    toast.success('Rutina duplicada.')
    fetchData()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('rutinas').delete().eq('id', id)
    if (error) { toast.error('Error al eliminar.'); return }
    toast.success('Rutina eliminada.')
    setDeleteDialog(null)
    fetchData()
  }

  async function handleAssign() {
    if (!selectedAlumno || !assignDialog) return
    setAssigning(true)
    const { error } = await supabase.from('asignaciones').insert({
      rutina_id: assignDialog.id, alumno_id: selectedAlumno,
      fecha_asignacion: new Date().toISOString().split('T')[0], activa: true,
    })
    if (error) { toast.error('Error al asignar rutina.') }
    else { toast.success('Rutina asignada correctamente.') }
    setAssigning(false)
    setAssignDialog(null)
    setSelectedAlumno('')
  }

  const filtered = rutinas.filter(r =>
    `${r.nombre} ${r.objetivo}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rutinas</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{rutinas.length} creadas</p>
        </div>
        <Button onClick={openNew} size="sm"><Plus className="w-4 h-4" />Nueva</Button>
      </div>

      <div style={{ position: 'relative' }}>
        <Search style={{ width: 14, height: 14, color: 'var(--t3)', position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <Input placeholder="Buscar rutina..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" /></div>
      ) : !filtered.length ? (
        <div className="text-center py-16">
          <Dumbbell className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3" />
          <p className="text-[var(--muted-foreground)]">No hay rutinas creadas.</p>
          <Button onClick={openNew} variant="outline" size="sm" className="mt-4"><Plus className="w-4 h-4" />Crear primera</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((rutina) => (
            <Card key={rutina.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                      <Dumbbell className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{rutina.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">{rutina.dias_por_semana}x semana</Badge>
                        {rutina.objetivo && <span className="text-xs text-[var(--muted-foreground)] truncate">{rutina.objetivo}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setExpandedId(expandedId === rutina.id ? null : rutina.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-all">
                      {expandedId === rutina.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setAssignDialog(rutina)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:text-blue-400 hover:bg-blue-400/10 transition-all">
                      <Users className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDuplicate(rutina)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => openEdit(rutina)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteDialog(rutina.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-400/10 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {expandedId === rutina.id && rutina.ejercicios?.length ? (
                  <div className="border-t border-[var(--border)] px-4 pb-4">
                    <p className="text-xs font-semibold text-[var(--muted-foreground)] mt-3 mb-2 uppercase tracking-wider">
                      {rutina.ejercicios.length} ejercicio{rutina.ejercicios.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-col gap-2">
                      {rutina.ejercicios.map((ej, i) => (
                        <div key={ej.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--accent)]">
                          <span className="w-6 h-6 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ej.nombre}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {ej.series} series × {ej.repeticiones} reps{ej.descanso ? ` · ${ej.descanso} descanso` : ''}
                            </p>
                            {ej.observaciones && <p className="text-xs text-[var(--muted-foreground)] mt-0.5 italic">{ej.observaciones}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar rutina' : 'Nueva rutina'}</DialogTitle>
            <DialogDescription>Diseñá el entrenamiento con todos sus ejercicios.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <Label>Nombre de la rutina *</Label>
                <Input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Full Body A" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Días por semana</Label>
                <Select value={form.dias_por_semana} onValueChange={v => setForm(p => ({ ...p, dias_por_semana: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map(d => (
                      <SelectItem key={d} value={String(d)}>{d} día{d !== 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Objetivo</Label>
              <Input value={form.objetivo} onChange={e => setForm(p => ({ ...p, objetivo: e.target.value }))} placeholder="Ej: Ganar masa muscular" />
            </div>

            {/* Exercises */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base">Ejercicios</Label>
                <Button type="button" variant="outline" size="sm" onClick={addEjercicio}>
                  <Plus className="w-3.5 h-3.5" />Agregar
                </Button>
              </div>
              <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto pr-1">
                {ejercicios.map((ej, i) => (
                  <div key={i} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--accent)] flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <Input
                        value={ej.nombre}
                        onChange={e => updateEjercicio(i, 'nombre', e.target.value)}
                        placeholder="Nombre del ejercicio *"
                        className="bg-[var(--input)]"
                      />
                      {ejercicios.length > 1 && (
                        <button type="button" onClick={() => removeEjercicio(i)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px]">Series</Label>
                        <Input type="number" min="1" value={ej.series} onChange={e => updateEjercicio(i, 'series', parseInt(e.target.value))} className="bg-[var(--input)] text-center" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px]">Repeticiones</Label>
                        <Input value={ej.repeticiones} onChange={e => updateEjercicio(i, 'repeticiones', e.target.value)} placeholder="10" className="bg-[var(--input)]" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px]">Descanso</Label>
                        <Input value={ej.descanso} onChange={e => updateEjercicio(i, 'descanso', e.target.value)} placeholder="60s" className="bg-[var(--input)]" />
                      </div>
                    </div>
                    <Textarea
                      value={ej.observaciones}
                      onChange={e => updateEjercicio(i, 'observaciones', e.target.value)}
                      placeholder="Observaciones (técnica, variantes...)"
                      className="bg-[var(--input)] min-h-[52px]"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? 'Guardar cambios' : 'Crear rutina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={() => { setAssignDialog(null); setSelectedAlumno('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar rutina</DialogTitle>
            <DialogDescription>Seleccioná el alumno para asignar &quot;{assignDialog?.nombre}&quot;</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label>Alumno</Label>
            <Select value={selectedAlumno} onValueChange={setSelectedAlumno}>
              <SelectTrigger><SelectValue placeholder="Seleccionar alumno" /></SelectTrigger>
              <SelectContent>
                {alumnos.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.nombre} {a.apellido}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignDialog(null); setSelectedAlumno('') }}>Cancelar</Button>
            <Button onClick={handleAssign} disabled={!selectedAlumno || assigning}>
              {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar rutina</DialogTitle>
            <DialogDescription>Se eliminarán todos los ejercicios y asignaciones relacionadas. Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteDialog && handleDelete(deleteDialog)}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
