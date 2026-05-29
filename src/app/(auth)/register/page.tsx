'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Dumbbell, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { nombre: form.nombre, apellido: form.apellido, role: 'alumno' },
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Cuenta creada. Revisá tu email para confirmar.')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 bg-[var(--primary)] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[rgba(232,255,71,0.3)]">
          <Dumbbell className="w-8 h-8 text-black" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Crear cuenta</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Completá tus datos para registrarte</p>
      </div>

      <div className="card-base p-6">
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" placeholder="Juan" value={form.nombre} onChange={handleChange} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input id="apellido" name="apellido" placeholder="García" value={form.apellido} onChange={handleChange} required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="tu@email.com" value={form.email} onChange={handleChange} required autoComplete="email" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full mt-1" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear cuenta
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  )
}
