'use client'

import { useState, useEffect } from 'react'
import { User, Phone, Mail, Calendar, Target, FileText, Loader2, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function AlumnoPerfilPage() {
  const [alumno, setAlumno] = useState<any>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '' })

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: a } = await supabase
        .from('alumnos')
        .select('*, profesor:profesores(nombre, apellido, especialidad)')
        .eq('user_id', user.id)
        .single()

      if (a) {
        setAlumno(a)
        setForm({ nombre: a.nombre, apellido: a.apellido, telefono: a.telefono ?? '' })

        const { data: asigs } = await supabase
          .from('asignaciones')
          .select('*, rutina:rutinas(nombre, objetivo, dias_por_semana)')
          .eq('alumno_id', a.id)
          .order('created_at', { ascending: false })

        setHistorial(asigs ?? [])
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  async function handleSave() {
    if (!alumno) return
    setSaving(true)
    const { error } = await supabase.from('alumnos').update({
      nombre: form.nombre, apellido: form.apellido, telefono: form.telefono || null,
    }).eq('id', alumno.id)

    if (error) { toast.error('Error al guardar.') }
    else {
      toast.success('Perfil actualizado.')
      setAlumno((prev: any) => ({ ...prev, ...form }))
      setEditing(false)
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="flex justify-center pt-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" /></div>
  }

  if (!alumno) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--muted-foreground)]">No se encontró tu perfil. Contactá al administrador.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Mi perfil</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Tus datos personales</p>
      </div>

      {/* Avatar card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 border-2 border-[var(--primary)]/30 flex items-center justify-center text-2xl font-bold text-[var(--primary)]">
              {alumno.nombre[0]}{alumno.apellido[0]}
            </div>
            <div>
              <p className="text-xl font-bold">{alumno.nombre} {alumno.apellido}</p>
              <p className="text-sm text-[var(--muted-foreground)]">{alumno.email}</p>
              {alumno.objetivo && <Badge className="mt-1 text-[10px]">{alumno.objetivo}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Datos personales</CardTitle>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Editar
              </Button>
            ) : (
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Guardar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Nombre</Label>
                  <Input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Apellido</Label>
                  <Input value={form.apellido} onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} placeholder="+54 11..." />
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[
                { icon: Mail, label: 'Email', value: alumno.email },
                { icon: Phone, label: 'Teléfono', value: alumno.telefono ?? '—' },
                { icon: Calendar, label: 'Fecha de ingreso', value: alumno.fecha_ingreso ? format(new Date(alumno.fecha_ingreso), 'd MMMM yyyy', { locale: es }) : '—' },
                { icon: Target, label: 'Objetivo', value: alumno.objetivo ?? '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                </div>
              ))}
              {alumno.observaciones && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Observaciones</p>
                    <p className="text-sm">{alumno.observaciones}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de rutinas</CardTitle>
        </CardHeader>
        <CardContent>
          {!historial.length ? (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-4">Sin rutinas en el historial.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--border)]">
              {historial.map((asig) => (
                <div key={asig.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{asig.rutina?.nombre}</p>
                    {asig.rutina?.objetivo && <p className="text-xs text-[var(--muted-foreground)]">{asig.rutina.objetivo}</p>}
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Desde {format(new Date(asig.fecha_asignacion), 'd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <Badge variant={asig.activa ? 'success' : 'outline'} className="text-[10px] shrink-0">
                    {asig.activa ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
