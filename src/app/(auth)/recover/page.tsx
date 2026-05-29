'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dumbbell, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function RecoverPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setSent(true)
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
        <h1 className="text-2xl font-bold tracking-tight">Recuperar contraseña</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1 text-center">
          Te enviamos un enlace para restablecer tu contraseña
        </p>
      </div>

      {sent ? (
        <div className="card-base p-6 flex flex-col items-center gap-4 text-center animate-fade-in">
          <CheckCircle2 className="w-12 h-12 text-green-400" />
          <div>
            <p className="font-semibold">Email enviado</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Revisá tu bandeja de entrada en <span className="text-[var(--foreground)]">{email}</span>
            </p>
          </div>
          <Link href="/login">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Volver al login
            </Button>
          </Link>
        </div>
      ) : (
        <div className="card-base p-6">
          <form onSubmit={handleRecover} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Enviar enlace
            </Button>
          </form>
        </div>
      )}

      <div className="flex justify-center mt-6">
        <Link href="/login" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al login
        </Link>
      </div>
    </div>
  )
}
