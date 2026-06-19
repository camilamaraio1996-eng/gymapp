'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Copy, Dumbbell, Loader2, ChevronDown, ChevronUp, Users, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Rutina, Ejercicio, Alumno } from '@/lib/supabase/types'

type Nivel = 'principiante' | 'intermedio' | 'avanzado' | 'élite'
type Estado = 'activa' | 'borrador' | 'archivada'

const NIVEL_COLOR: Record<Nivel, { color: string; bg: string }> = {
  principiante: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  intermedio:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  avanzado:     { color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  'élite':      { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
}

const ESTADO_COLOR: Record<Estado, { color: string; bg: string; label: string }> = {
  activa:    { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  label: 'Activa' },
  borrador:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  label: 'Borrador' },
  archivada: { color: '#555568', bg: 'rgba(85,85,104,0.15)',  label: 'Archivada' },
}

const emptyEjercicio = { nombre: '', series: 3, repeticiones: '10', descanso: '60s', observaciones: '', dia: 1 }

type ExtRutina = Rutina & { nivel?: Nivel; estado?: Estado; asignaciones?: { id: string; activa: boolean }[] }

export default function ProfesorRutinasPage() {
  const [rutinas, setRutinas] = useState<ExtRutina[]>([])
  const [alumnos, setAlumnos] = useState<Pick<Alumno, 'id' | 'nombre' | 'apellido'>[]>([])
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState<Estado | 'todas'>('todas')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [assignDialog, setAssignDialog] = useState<ExtRutina | null>(null)
  const [selectedAlumno, setSelectedAlumno] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [editing, setEditing] = useState<ExtRutina | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: '', objetivo: '', dias_por_semana: '3', nivel: 'principiante' as Nivel, estado: 'activa' as Estado })
  const [ejercicios, setEjercicios] = useState([{ ...emptyEjercicio }])
  const [userId, setUserId] = useState<string | null>(null)
  const [importDialog, setImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: prof } = await supabase.from('profesores').select('id').eq('user_id', user.id).single()

    const [{ data: r }, { data: a }] = await Promise.all([
      supabase.from('rutinas').select('*, ejercicios(*), asignaciones(id, activa)').eq('created_by', user.id).order('created_at', { ascending: false }),
      supabase.from('alumnos').select('id, nombre, apellido').eq('profesor_id', prof?.id ?? '').order('nombre'),
    ])

    const sorted = (r ?? []).map(rt => ({
      ...rt,
      ejercicios: [...(rt.ejercicios ?? [])].sort((a: Ejercicio, b: Ejercicio) => a.orden - b.orden),
    }))
    setRutinas(sorted as ExtRutina[])
    setAlumnos(a ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleImport() {
    if (!importFile) return
    setImporting(true)
    await new Promise(r => setTimeout(r, 1200))
    toast.success(`"${importFile.name}" importado. Las rutinas se cargarán una vez activada la integración.`)
    setImporting(false)
    setImportDialog(false)
    setImportFile(null)
  }

  function openNew() {
    setEditing(null)
    setForm({ nombre: '', objetivo: '', dias_por_semana: '3', nivel: 'principiante', estado: 'activa' })
    setEjercicios([{ ...emptyEjercicio }])
    setOpenDialog(true)
  }

  function openEdit(rutina: ExtRutina) {
    setEditing(rutina)
    setForm({
      nombre: rutina.nombre,
      objetivo: rutina.objetivo ?? '',
      dias_por_semana: String(rutina.dias_por_semana),
      nivel: (rutina.nivel as Nivel) ?? 'principiante',
      estado: (rutina.estado as Estado) ?? 'activa',
    })
    setEjercicios(
      rutina.ejercicios?.length
        ? rutina.ejercicios.map(e => ({
            nombre: e.nombre, series: e.series, repeticiones: e.repeticiones,
            descanso: e.descanso ?? '', observaciones: e.observaciones ?? '',
            dia: (e as Ejercicio & { dia?: number }).dia ?? 1,
          }))
        : [{ ...emptyEjercicio }]
    )
    setOpenDialog(true)
  }

  function updateEjercicio(i: number, field: string, value: string | number) {
    setEjercicios(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
  }

  async function handleSave() {
    if (!form.nombre) { toast.error('El nombre es obligatorio.'); return }
    if (ejercicios.some(e => !e.nombre)) { toast.error('Todos los ejercicios necesitan nombre.'); return }
    setSaving(true)

    if (editing) {
      const { error } = await supabase.from('rutinas').update({
        nombre: form.nombre, objetivo: form.objetivo || null,
        dias_por_semana: parseInt(form.dias_por_semana),
        nivel: form.nivel, estado: form.estado,
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
        nivel: form.nivel, estado: form.estado,
        created_by: userId,
      }).select().single()

      if (!error && newRutina) {
        await supabase.from('ejercicios').insert(
          ejercicios.map((e, i) => ({ ...e, rutina_id: newRutina.id, orden: i, series: Number(e.series) }))
        )
        toast.success('Rutina creada.')
      } else { toast.error('Error al crear.') }
    }
    setSaving(false)
    setOpenDialog(false)
    fetchData()
  }

  async function handleDuplicate(rutina: ExtRutina) {
    const { data: newRutina } = await supabase.from('rutinas').insert({
      nombre: `${rutina.nombre} (copia)`, objetivo: rutina.objetivo,
      dias_por_semana: rutina.dias_por_semana, created_by: userId,
      nivel: rutina.nivel ?? 'principiante', estado: 'borrador',
    }).select().single()

    if (newRutina && rutina.ejercicios?.length) {
      await supabase.from('ejercicios').insert(
        rutina.ejercicios.map(e => ({
          rutina_id: newRutina.id, nombre: e.nombre, series: e.series,
          repeticiones: e.repeticiones, descanso: e.descanso,
          observaciones: e.observaciones, orden: e.orden,
          dia: (e as Ejercicio & { dia?: number }).dia ?? 1,
        }))
      )
    }
    toast.success('Rutina duplicada como borrador.')
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
    // Deactivate previous assignment for this alumno
    await supabase.from('asignaciones').update({ activa: false }).eq('alumno_id', selectedAlumno).eq('activa', true)
    const { error } = await supabase.from('asignaciones').insert({
      rutina_id: assignDialog.id, alumno_id: selectedAlumno,
      fecha_asignacion: new Date().toISOString().split('T')[0], activa: true,
    })
    if (error) toast.error('Error al asignar.')
    else toast.success('Rutina asignada.')
    setAssigning(false)
    setAssignDialog(null)
    setSelectedAlumno('')
    fetchData()
  }

  const filtered = rutinas.filter(r => {
    const matchSearch = `${r.nombre} ${r.objetivo}`.toLowerCase().includes(search.toLowerCase())
    const matchEstado = filterEstado === 'todas' || (r.estado ?? 'activa') === filterEstado
    return matchSearch && matchEstado
  })

  // Group exercises by day for display
  function groupByDay(ejercicios: (Ejercicio & { dia?: number })[]) {
    const days: Record<number, typeof ejercicios> = {}
    for (const e of ejercicios) {
      const d = e.dia ?? 1
      if (!days[d]) days[d] = []
      days[d].push(e)
    }
    return Object.entries(days).sort(([a], [b]) => Number(a) - Number(b))
  }

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>Mis rutinas</h1>
          <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>{rutinas.length} creada{rutinas.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setImportDialog(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 9, cursor: 'pointer' }}>
            <FileUp style={{ width: 14, height: 14 }} /> Importar Excel
          </button>
          <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--primary)', color: '#000', fontSize: 13, fontWeight: 700, padding: '9px 16px', borderRadius: 9, border: 'none', cursor: 'pointer' }}>
            <Plus style={{ width: 14, height: 14 }} /> Nueva rutina
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search style={{ width: 14, height: 14, color: 'var(--t3)', position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar rutina..."
            style={{ width: '100%', paddingLeft: 36, paddingRight: 14, height: 38, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--t1)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            className="input-accent"
          />
        </div>
        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value as Estado | 'todas')}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--t2)', fontSize: 12.5, padding: '0 12px', height: 38, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
        >
          <option value="todas">Todos los estados</option>
          <option value="activa">Activas</option>
          <option value="borrador">Borradores</option>
          <option value="archivada">Archivadas</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
          <Loader2 style={{ width: 24, height: 24, color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : !filtered.length ? (
        <div style={{ ...card, padding: '48px 24px', textAlign: 'center' }}>
          <Dumbbell style={{ width: 32, height: 32, color: 'var(--t3)', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', marginBottom: 8 }}>
            {rutinas.length === 0 ? 'No creaste rutinas aún' : 'Sin resultados'}
          </div>
          {rutinas.length === 0 && (
            <button onClick={openNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(170,255,0,0.08)', border: '1px solid rgba(170,255,0,0.2)', color: 'var(--primary)', fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 9, cursor: 'pointer' }}>
              <Plus style={{ width: 13, height: 13 }} /> Crear primera rutina
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(rutina => {
            const nivel = (rutina.nivel ?? 'principiante') as Nivel
            const estado = (rutina.estado ?? 'activa') as Estado
            const nc = NIVEL_COLOR[nivel]
            const ec = ESTADO_COLOR[estado]
            const asignadosCount = rutina.asignaciones?.filter(a => a.activa).length ?? 0
            const isExpanded = expandedId === rutina.id

            return (
              <div key={rutina.id} style={card}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(251,146,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Dumbbell style={{ width: 16, height: 16, color: '#fb923c' }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rutina.nombre}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: ec.bg, color: ec.color }}>{ec.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: nc.bg, color: nc.color }}>{nivel}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{rutina.dias_por_semana}x semana</span>
                      {rutina.objetivo && <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{rutina.objetivo}</span>}
                      {asignadosCount > 0 && (
                        <span style={{ fontSize: 11.5, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Users style={{ width: 9, height: 9 }} /> {asignadosCount} alumno{asignadosCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    <ActionBtn onClick={() => setExpandedId(isExpanded ? null : rutina.id)} title={isExpanded ? 'Colapsar' : 'Expandir'}>
                      {isExpanded ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                    </ActionBtn>
                    <ActionBtn onClick={() => setAssignDialog(rutina)} title="Asignar alumno" hoverColor="#60a5fa">
                      <Users style={{ width: 13, height: 13 }} />
                    </ActionBtn>
                    <ActionBtn onClick={() => handleDuplicate(rutina)} title="Duplicar">
                      <Copy style={{ width: 13, height: 13 }} />
                    </ActionBtn>
                    <ActionBtn onClick={() => openEdit(rutina)} title="Editar">
                      <Pencil style={{ width: 13, height: 13 }} />
                    </ActionBtn>
                    <ActionBtn onClick={() => setDeleteDialog(rutina.id)} title="Eliminar" hoverColor="#f87171">
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </ActionBtn>
                  </div>
                </div>

                {/* Expanded exercises grouped by day */}
                {isExpanded && rutina.ejercicios?.length ? (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {groupByDay(rutina.ejercicios as (Ejercicio & { dia?: number })[]).map(([day, exs]) => (
                      <div key={day}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                          Día {day}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {exs.map((ej, i) => (
                            <div key={ej.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 9, border: '1px solid rgba(255,255,255,0.04)' }}>
                              <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(170,255,0,0.08)', color: 'var(--primary)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--t1)' }}>{ej.nombre}</div>
                                <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>
                                  {ej.series} series × {ej.repeticiones}{ej.descanso ? ` · ${ej.descanso}` : ''}
                                </div>
                              </div>
                              {ej.observaciones && (
                                <div style={{ fontSize: 11, color: 'var(--t3)', maxWidth: 160, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ej.observaciones}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isExpanded && !rutina.ejercicios?.length ? (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 18px', fontSize: 13, color: 'var(--t3)', textAlign: 'center' }}>
                    Sin ejercicios. <button onClick={() => openEdit(rutina)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 13 }}>Agregar ahora →</button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar rutina' : 'Nueva rutina'}</DialogTitle>
            <DialogDescription>Diseñá el plan de entrenamiento con todos sus ejercicios.</DialogDescription>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <Label>Nombre *</Label>
                <Input className="mt-1" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Hipertrofia Full Body A" />
              </div>
            </div>
            <div>
              <Label>Objetivo</Label>
              <Input className="mt-1" value={form.objetivo} onChange={e => setForm(p => ({ ...p, objetivo: e.target.value }))} placeholder="Ej: Aumento de masa muscular" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <Label>Días/semana</Label>
                <Select value={form.dias_por_semana} onValueChange={v => setForm(p => ({ ...p, dias_por_semana: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5,6,7].map(d => <SelectItem key={d} value={String(d)}>{d} días</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nivel</Label>
                <Select value={form.nivel} onValueChange={v => setForm(p => ({ ...p, nivel: v as Nivel }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principiante">Principiante</SelectItem>
                    <SelectItem value="intermedio">Intermedio</SelectItem>
                    <SelectItem value="avanzado">Avanzado</SelectItem>
                    <SelectItem value="élite">Élite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={v => setForm(p => ({ ...p, estado: v as Estado }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activa">Activa</SelectItem>
                    <SelectItem value="borrador">Borrador</SelectItem>
                    <SelectItem value="archivada">Archivada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Exercises */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <Label>Ejercicios</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setEjercicios(p => [...p, { ...emptyEjercicio, dia: p[p.length - 1]?.dia ?? 1 }])}>
                  <Plus className="w-3.5 h-3.5" />Agregar
                </Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ejercicios.map((ej, i) => (
                  <div key={i} style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(170,255,0,0.08)', color: 'var(--primary)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                      <Input value={ej.nombre} onChange={e => updateEjercicio(i, 'nombre', e.target.value)} placeholder="Nombre del ejercicio *" style={{ flex: 1 }} />
                      {ejercicios.length > 1 && (
                        <button type="button" onClick={() => setEjercicios(p => p.filter((_, idx) => idx !== i))} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--t3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 style={{ width: 13, height: 13 }} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 1fr', gap: 8 }}>
                      <div>
                        <Label style={{ fontSize: 10 }}>Día</Label>
                        <Input type="number" min="1" max={parseInt(form.dias_por_semana)} value={ej.dia} onChange={e => updateEjercicio(i, 'dia', parseInt(e.target.value) || 1)} className="text-center" />
                      </div>
                      <div>
                        <Label style={{ fontSize: 10 }}>Series</Label>
                        <Input type="number" min="1" value={ej.series} onChange={e => updateEjercicio(i, 'series', parseInt(e.target.value))} className="text-center" />
                      </div>
                      <div>
                        <Label style={{ fontSize: 10 }}>Reps</Label>
                        <Input value={ej.repeticiones} onChange={e => updateEjercicio(i, 'repeticiones', e.target.value)} placeholder="10" />
                      </div>
                      <div>
                        <Label style={{ fontSize: 10 }}>Descanso</Label>
                        <Input value={ej.descanso} onChange={e => updateEjercicio(i, 'descanso', e.target.value)} placeholder="60s" />
                      </div>
                    </div>
                    <Textarea value={ej.observaciones} onChange={e => updateEjercicio(i, 'observaciones', e.target.value)} placeholder="Técnica, tempo, notas..." style={{ minHeight: 52, resize: 'none', fontSize: 12 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {editing ? 'Guardar cambios' : 'Crear rutina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign dialog */}
      <Dialog open={!!assignDialog} onOpenChange={() => { setAssignDialog(null); setSelectedAlumno('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar rutina</DialogTitle>
            <DialogDescription>Asignar &quot;{assignDialog?.nombre}&quot; a un alumno</DialogDescription>
          </DialogHeader>
          <div>
            <Label>Alumno</Label>
            <Select value={selectedAlumno} onValueChange={setSelectedAlumno}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar alumno" /></SelectTrigger>
              <SelectContent>
                {alumnos.length === 0
                  ? <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--t3)', textAlign: 'center' }}>Sin alumnos asignados</div>
                  : alumnos.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre} {a.apellido}</SelectItem>)
                }
              </SelectContent>
            </Select>
            {selectedAlumno && <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 6 }}>La rutina activa anterior del alumno será reemplazada.</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignDialog(null); setSelectedAlumno('') }}>Cancelar</Button>
            <Button onClick={handleAssign} disabled={!selectedAlumno || assigning}>
              {assigning && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Excel dialog */}
      <Dialog open={importDialog} onOpenChange={open => { setImportDialog(open); if (!open) setImportFile(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar rutinas desde Excel</DialogTitle>
            <DialogDescription>Subí un archivo .xlsx con tus rutinas. Cada fila debe tener: Nombre, Objetivo, Días/semana, Nivel, Ejercicios.</DialogDescription>
          </DialogHeader>
          <div>
            <Label>Archivo Excel</Label>
            <div
              style={{ marginTop: 8, border: '2px dashed var(--border)', borderRadius: 10, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onClick={() => document.getElementById('excel-input')?.click()}
            >
              <FileUp style={{ width: 28, height: 28, color: 'var(--t3)', margin: '0 auto 10px', display: 'block' }} />
              {importFile ? (
                <div style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 600 }}>{importFile.name}</div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: 'var(--t2)' }}>Hacé clic para seleccionar el archivo</div>
                  <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 4 }}>Soporta .xlsx y .xls</div>
                </>
              )}
              <input id="excel-input" type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => setImportFile(e.target.files?.[0] ?? null)} />
            </div>
            <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--t3)' }}>
              ¿No tenés el formato? Descargá la{' '}
              <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 11.5, padding: 0 }}>plantilla de ejemplo</button>.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportDialog(false); setImportFile(null) }}>Cancelar</Button>
            <Button onClick={handleImport} disabled={!importFile || importing}>
              {importing && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Importar rutinas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar rutina</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer. Se eliminarán también los ejercicios asociados.</DialogDescription>
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

function ActionBtn({ children, onClick, title, hoverColor }: { children: React.ReactNode; onClick: () => void; title?: string; hoverColor?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--t3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = hoverColor ? `${hoverColor}18` : 'rgba(255,255,255,0.06)'
        el.style.color = hoverColor ?? 'var(--t1)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = 'transparent'
        el.style.color = 'var(--t3)'
      }}
    >
      {children}
    </button>
  )
}
