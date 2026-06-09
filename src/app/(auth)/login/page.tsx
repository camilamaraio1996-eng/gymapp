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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    console.log('Iniciando sesión con:', email)

    try {
      const supabase = createClient()
      console.log('Cliente Supabase creado')
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        console.error('Error de autenticación:', error)
        toast.error(`Error de autenticación: ${error.message}`)
        return
      }

      console.log('Usuario autenticado con éxito:', data.user)

      if (data.user) {
        console.log('Obteniendo perfil de usuario...');
        
        // Primero intentamos sacar el rol de los metadatos del usuario (JWT)
        let role = data.user.user_metadata?.role;
        
        // Si no está en los metadatos, consultamos la base de datos
        if (!role) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', data.user.id)
            .single()

          if (profileError) {
            console.warn('No se pudo obtener el perfil de DB (posible error de RLS):', profileError.message)
          } else if (profile) {
            role = profile.role;
          }
        }
        
        // Rol por defecto si no se encontró ninguno
        role = role || 'alumno';

        console.log('Rol final resuelto:', role)

        if (role === 'admin') {
          toast.success('Bienvenido al panel de Administrador');
          router.push('/admin');
        } else if (role === 'profesor') {
          toast.success('Bienvenido al panel de Profesor');
          router.push('/profesor');
        } else {
          toast.success('Bienvenido al panel de Alumno');
          router.push('/alumno');
        }
      }
    } catch (err: any) {
      console.error('Excepción en login:', err)
      toast.error(`Error inesperado: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 bg-[var(--primary)] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[rgba(232,255,71,0.3)]">
          <Dumbbell className="w-8 h-8 text-black" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">GymPro</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Iniciá sesión para continuar</p>
      </div>

      {/* Form */}
      <div className="card-base p-6">
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
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

          <div className="flex flex-col gap-2">
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

          <div className="flex justify-end">
            <Link href="/recover" className="text-xs text-[var(--primary)] hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" className="w-full mt-1" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Iniciar sesión
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="text-[var(--primary)] font-medium hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  )
}
