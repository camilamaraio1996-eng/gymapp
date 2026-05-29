'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, UserCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
import type { Alumno, Profesor } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const emptyAlumno = {
  nombre: '', apellido: '', email: '', telefono: '',
  fecha_ingreso: new Date().toISOString().split('T')[0],
  objetivo: '', observaciones: '', profesor_id: '',
}

export default function AlumnosPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [editing, setEditing] = useState<Alumno | null>(null)
  const [form, setForm] = useState(emptyAlumno)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: a }, { data: p }] = await Promise.all([
      supabase.from('alumnos').select('*, profesor:profesores(*)').order('created_at', { ascending: false }),
      supabase.from('profesores').select('*').order('nombre'),
    ])
    setAlumnos(a ?? [])
    setProfesores(p ?? [])
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
      toast.success('Alumno actualizado correctamente.')
    } else {
      const { error } = await supabase.from('alumnos').insert(payload)
      if (error) { toast.error('Error al crear alumno. Verificá el email.'); setSaving(false); return }
      toast.success('Alumno creado correctamente.')
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

  const filtered = alumnos.filter(a =>
    `${a.nombre} ${a.apellido} ${a.email}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alumnos</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{alumnos.length} registrados</p>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="w-4 h-4" />
          Nuevo
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
        <Input placeholder="Buscar alumno..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" /></div>
      ) : !filtered.length ? (
        <div className="text-center py-16">
          <p className="text-[var(--muted-foreground)]">No se encontraron alumnos.</p>
          <Button onClick={openNew} variant="outline" size="sm" className="mt-4"><Plus className="w-4 h-4" />Agregar primero</Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((alumno) => (
            <Card key={alumno.id} className="hover:border-[var(--border)]/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-sm font-bold text-[var(--primary)] shrink-0">
                      {alumno.nombre[0]}{alumno.apellido[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{alumno.nombre} {alumno.apellido}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">{alumno.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(alumno)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteDialog(alumno.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-400/10 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {alumno.objetivo && <Badge variant="secondary" className="text-[10px]">{alumno.objetivo}</Badge>}
                  {alumno.profesor && (
                    <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                      <UserCheck className="w-2.5 h-2.5" />
                      {(alumno.profesor as Profesor).nombre}
                    </Badge>
                  )}
                </div>

                {alumno.telefono && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">{alumno.telefono}</p>
                )}
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                  Ingresó: {alumno.fecha_ingreso ? format(new Date(alumno.fecha_ingreso), 'd MMM yyyy', { locale: es }) : '—'}
                </p>
              </CardContent>
            </Card>
          ))}
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
            <DialogDescription>Esta acción no se puede deshacer. El alumno y sus datos asociados serán eliminados permanentemente.</DialogDescription>
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
