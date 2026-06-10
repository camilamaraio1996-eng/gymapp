'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, UserCheck, Loader2, Users, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Alumno, Profesor } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const emptyAlumno = {
  nombre: '', apellido: '', email: '', telefono: '',
  fecha_ingreso: new Date().toISOString().split('T')[0],
  objetivo: '', observaciones: '', profesor_id: '',
}

type AlumnoStatus = 'all' | 'activo' | 'sin-rutina' | 'sin-profesor'

function getStatus(alumno: Alumno, activeIds: Set<string>) {
  if (!alumno.profesor_id) return 'sin-profesor'
  if (!activeIds.has(alumno.id)) return 'sin-rutina'
  return 'activo'
}

const statusConfig = {
  activo:       { label: 'Activo',       cls: 'bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/20' },
  'sin-rutina': { label: 'Sin rutina',   cls: 'bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/20' },
  'sin-profesor': { label: 'Sin profesor', cls: 'bg-[var(--text-disabled)]/20 text-[var(--text-muted)] border-[var(--border)]' },
}

export default function AlumnosPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [activeAlumnoIds, setActiveAlumnoIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AlumnoStatus>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [editing, setEditing] = useState<Alumno | null>(null)
  const [form, setForm] = useState(emptyAlumno)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: a }, { data: p }, { data: asig }] = await Promise.all([
      supabase.from('alumnos').select('*, profesor:profesores(*)').order('created_at', { ascending: false }),
      supabase.from('profesores').select('*').order('nombre'),
      supabase.from('asignaciones').select('alumno_id').eq('activa', true),
    ])
    setAlumnos(a ?? [])
    setProfesores(p ?? [])
    setActiveAlumnoIds(new Set((asig ?? []).map((x) => x.alumno_id)))
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  function openNew() {
    setEditing(null)
    setForm(emptyAlumno)
    setOpenDialog(true)
  }

  function openEdit(alumno: Alumno) {
    setEditing(alumno)
    setForm({
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      email: alumno.email,
      telefono: alumno.telefono ?? '',
      fecha_ingreso: alumno.fecha_ingreso,
      objetivo: alumno.objetivo ?? '',
      observaciones: alumno.observaciones ?? '',
      profesor_id: alumno.profesor_id ?? '',
    })
    setOpenDialog(true)
  }

  async function handleSave() {
    if (!form.nombre || !form.apellido || !form.email) {
      toast.error('Nombre, apellido y email son obligatorios.')
      return
    }
    setSaving(true)
    const payload = {
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email,
      telefono: form.telefono || null,
      fecha_ingreso: form.fecha_ingreso,
      objetivo: form.objetivo || null,
      observaciones: form.observaciones || null,
      profesor_id: form.profesor_id || null,
    }

    if (editing) {
      const { error } = await supabase.from('alumnos').update(payload).eq('id', editing.id)
      if (error) { toast.error('Error al actualizar alumno.'); setSaving(false); return }
      toast.success('Alumno actualizado.')
    } else {
      const { error } = await supabase.from('alumnos').insert(payload)
      if (error) { toast.error('Error al crear alumno. Verificá el email.'); setSaving(false); return }
      toast.success('Alumno creado.')
    }
    setSaving(false)
    setOpenDialog(false)
    fetchData()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('alumnos').delete().eq('id', id)
    if (error) { toast.error('Error al eliminar alumno.'); return }
    toast.success('Alumno eliminado.')
    setDeleteDialog(null)
    fetchData()
  }

  const filtered = alumnos.filter((a) => {
    const matchSearch = `${a.nombre} ${a.apellido} ${a.email}`.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (statusFilter === 'all') return true
    return getStatus(a, activeAlumnoIds) === statusFilter
  })

  const counts = {
    all: alumnos.length,
    activo: alumnos.filter((a) => getStatus(a, activeAlumnoIds) === 'activo').length,
    'sin-rutina': alumnos.filter((a) => getStatus(a, activeAlumnoIds) === 'sin-rutina').length,
    'sin-profesor': alumnos.filter((a) => getStatus(a, activeAlumnoIds) === 'sin-profesor').length,
  }

  const filterTabs: { key: AlumnoStatus; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'activo', label: 'Activos' },
    { key: 'sin-rutina', label: 'Sin rutina' },
    { key: 'sin-profesor', label: 'Sin profesor' },
  ]

  return (
    <div className="flex flex-col gap-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alumnos</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {alumnos.length} registrado{alumnos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openNew} size="sm" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Nuevo alumno
        </Button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {filterTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5',
              statusFilter === key
                ? 'bg-[var(--primary)] text-black'
                : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)]'
            )}
          >
            {label}
            <span className={cn(
              'text-[10px] px-1 rounded',
              statusFilter === key ? 'bg-black/20 text-black' : 'bg-[var(--border)] text-[var(--text-muted)]'
            )}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
        </div>
      ) : !filtered.length ? (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center">
            <Users className="w-6 h-6 text-[var(--text-muted)]" />
          </div>
          <p className="text-[var(--text-muted)] text-sm">
            {search ? 'No se encontraron alumnos con ese criterio.' : 'No hay alumnos registrados aún.'}
          </p>
          {!search && (
            <Button onClick={openNew} variant="outline" size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Agregar primero
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((alumno) => {
            const status = getStatus(alumno, activeAlumnoIds)
            const sCfg = statusConfig[status]
            const prof = alumno.profesor as Profesor | undefined
            return (
              <div
                key={alumno.id}
                className="group bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--primary)]/30 hover:bg-[var(--bg-elevated)] transition-all duration-150"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] group-hover:bg-[var(--bg-card)] flex items-center justify-center text-xs font-bold text-[var(--primary)] shrink-0 border border-[var(--border)] transition-colors">
                      {alumno.nombre[0]}{alumno.apellido[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{alumno.nombre} {alumno.apellido}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{alumno.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(alumno)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-card)] transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteDialog(alumno.id)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', sCfg.cls)}>
                    {sCfg.label}
                  </span>
                  {alumno.objetivo && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
                      {alumno.objetivo}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  {prof ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-purple-400/15 flex items-center justify-center text-[9px] font-bold text-purple-400">
                        {prof.nombre[0]}{prof.apellido[0]}
                      </div>
                      <span className="text-xs text-[var(--text-muted)] truncate max-w-[120px]">
                        {prof.nombre} {prof.apellido}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--text-disabled)]">Sin profesor</span>
                  )}
                  <span className="text-[11px] text-[var(--text-disabled)] shrink-0">
                    {alumno.fecha_ingreso ? format(new Date(alumno.fecha_ingreso), 'd MMM yy', { locale: es }) : '—'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar alumno' : 'Nuevo alumno'}</DialogTitle>
            <DialogDescription>Completá los datos del alumno.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Juan" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Apellido *</Label>
              <Input value={form.apellido} onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))} placeholder="García" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="juan@email.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Teléfono</Label>
              <Input value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} placeholder="+54 11..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Fecha ingreso</Label>
              <Input type="date" value={form.fecha_ingreso} onChange={e => setForm(p => ({ ...p, fecha_ingreso: e.target.value }))} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Objetivo físico</Label>
            <Select value={form.objetivo} onValueChange={v => setForm(p => ({ ...p, objetivo: v }))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar objetivo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Perder peso">Perder peso</SelectItem>
                <SelectItem value="Ganar músculo">Ganar músculo</SelectItem>
                <SelectItem value="Tonificar">Tonificar</SelectItem>
                <SelectItem value="Resistencia">Resistencia</SelectItem>
                <SelectItem value="Rehabilitación">Rehabilitación</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Profesor asignado</Label>
            <Select value={form.profesor_id} onValueChange={v => setForm(p => ({ ...p, profesor_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin asignar</SelectItem>
                {profesores.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Observaciones</Label>
            <Textarea value={form.observaciones} onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))} placeholder="Lesiones, condiciones especiales..." rows={2} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? 'Guardar cambios' : 'Crear alumno'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar alumno</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer. El alumno y sus datos serán eliminados permanentemente.</DialogDescription>
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
