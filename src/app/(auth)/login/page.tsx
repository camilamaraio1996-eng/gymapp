'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dumbbell, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        toast.error('Email o contraseña incorrectos.')
        return
      }

      if (data.user) {
        let role = data.user.user_metadata?.role

        if (!role) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', data.user.id)
            .single()
          role = profile?.role
        }

        role = role || 'alumno'

        if (role === 'admin') {
          window.location.href = '/admin'
        } else if (role === 'profesor') {
          window.location.href = '/profesor'
        } else {
          window.location.href = '/alumno'
        }
      }
    } catch {
      toast.error('Error inesperado. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-[var(--primary)] rounded-xl flex items-center justify-center mb-4">
          <Dumbbell className="w-6 h-6 text-black" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">GymPro</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Iniciá sesión para continuar</p>
      </div>

      {/* Form */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end -mt-1">
            <Link href="/recover" className="text-xs text-[var(--primary)] hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Iniciar sesión
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-[var(--text-muted)] mt-5">
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="text-[var(--primary)] font-medium hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  )
}
