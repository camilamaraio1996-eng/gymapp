'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dumbbell, Eye, EyeOff, Loader2 } from 'lucide-react'
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
      if (error) { toast.error('Email o contraseña incorrectos.'); return }
      if (data.user) {
        let role = data.user.user_metadata?.role
        if (!role) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', data.user.id).single()
          role = profile?.role
        }
        role = role || 'alumno'
        if (role === 'admin') window.location.href = '/admin'
        else if (role === 'profesor') window.location.href = '/profesor'
        else window.location.href = '/alumno'
      }
    } catch { toast.error('Error inesperado. Intentá de nuevo.') }
    finally { setLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48,
    background: 'var(--input-bg)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    color: 'var(--t1)',
    fontSize: 14,
    padding: '0 14px',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: 'inherit',
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 52, height: 52, background: 'var(--primary)', borderRadius: 14,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <Dumbbell style={{ width: 26, height: 26, strokeWidth: 2.2, color: '#000' }} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>GymPro</div>
        <div style={{ fontSize: 14, color: 'var(--t2)', marginTop: 4 }}>Iniciá sesión para continuar</div>
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 28,
      }}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--t2)', letterSpacing: '0.01em' }}>
              Email
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="input-accent"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(170,255,0,0.12)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--t2)' }}>Contraseña</label>
              <Link href="/recover" style={{ fontSize: 12, color: 'var(--t3)', textDecoration: 'none', transition: 'color 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--t3)')}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(170,255,0,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--t3)', display: 'flex', alignItems: 'center',
                  transition: 'color 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--t1)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--t3)')}
              >
                {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', height: 48,
              background: loading ? 'rgba(170,255,0,0.5)' : 'var(--primary)',
              color: '#000', fontWeight: 700, fontSize: 14,
              border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s, opacity 0.15s',
              fontFamily: 'inherit', letterSpacing: '0.01em',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--primary-dim)' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--primary)' }}
          >
            {loading && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
            {loading ? 'Iniciando…' : 'Iniciar sesión'}
          </button>

        </form>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--t3)', marginTop: 20 }}>
        ¿No tenés cuenta?{' '}
        <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>
          Registrate
        </Link>
      </p>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', marginTop: 28 }}>
        © {new Date().getFullYear()} GymPro. Todos los derechos reservados.
      </p>
    </div>
  )
}
