'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profesor } from '@/lib/supabase/types'

const emptyProfesor = { nombre: '', apellido: '', email: '', telefono: '', especialidad: '' }

export default function ProfesoresPage() {
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [editing, setEditing] = useState<Profesor | null>(null)
  const [form, setForm] = useState(emptyProfesor)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('profesores').select('*').order('nombre')
    setProfesores(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  function openNew() {
    setEditing(null)
    setForm(emptyProfesor)
    setOpenDialog(true)
  }

  function openEdit(p: Profesor) {
    setEditing(p)
    setForm({
      nombre: p.nombre, apellido: p.apellido, email: p.email,
      telefono: p.telefono ?? '', especialidad: p.especialidad ?? '',
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
      nombre: form.nombre, apellido: form.apellido, email: form.email,
      telefono: form.telefono || null, especialidad: form.especialidad || null,
    }

    if (editing) {
      const { error } = await supabase.from('profesores').update(payload).eq('id', editing.id)
      if (error) { toast.error('Error al actualizar.'); setSaving(false); return }
      toast.success('Profesor actualizado.')
    } else {
      const { error } = await supabase.from('profesores').insert(payload)
      if (error) { toast.error('Error al crear profesor.'); setSaving(false); return }
      toast.success('Profesor creado.')
    }
    setSaving(false)
    setOpenDialog(false)
    fetchData()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('profesores').delete().eq('id', id)
    if (error) { toast.error('Error al eliminar.'); return }
    toast.success('Profesor eliminado.')
    setDeleteDialog(null)
    fetchData()
  }

  const filtered = profesores.filter(p =>
    `${p.nombre} ${p.apellido} ${p.email} ${p.especialidad}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profesores</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{profesores.length} en el equipo</p>
        </div>
        <Button onClick={openNew} size="sm"><Plus className="w-4 h-4" />Nuevo</Button>
      </div>

      <div style={{ position: 'relative' }}>
        <Search style={{ width: 14, height: 14, color: 'var(--t3)', position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <Input placeholder="Buscar profesor..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" /></div>
      ) : !filtered.length ? (
        <div className="text-center py-16">
          <p className="text-[var(--muted-foreground)]">No hay profesores registrados.</p>
          <Button onClick={openNew} variant="outline" size="sm" className="mt-4"><Plus className="w-4 h-4" />Agregar primero</Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((prof) => (
            <Card key={prof.id} className="hover:border-[var(--border)]/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-purple-400/10 flex items-center justify-center text-sm font-bold text-purple-400 shrink-0">
                      {prof.nombre[0]}{prof.apellido[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{prof.nombre} {prof.apellido}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">{prof.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(prof)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteDialog(prof.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-400/10 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {prof.especialidad && (
                  <div className="mt-3"><Badge variant="secondary" className="text-[10px]">{prof.especialidad}</Badge></div>
                )}
                {prof.telefono && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">{prof.telefono}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar profesor' : 'Nuevo profesor'}</DialogTitle>
            <DialogDescription>Completá los datos del profesor.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Carlos" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Apellido *</Label>
              <Input value={form.apellido} onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))} placeholder="López" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="carlos@gym.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Teléfono</Label>
              <Input value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} placeholder="+54 11..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Especialidad</Label>
              <Input value={form.especialidad} onChange={e => setForm(p => ({ ...p, especialidad: e.target.value }))} placeholder="Musculación" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? 'Guardar cambios' : 'Crear profesor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar profesor</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
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
