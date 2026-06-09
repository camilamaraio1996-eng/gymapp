import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'

export default async function ProfesorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let role = user.user_metadata?.role
  let nombre = user.user_metadata?.nombre || ''
  let apellido = user.user_metadata?.apellido || ''

  if (!role) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (profile) {
      role = profile.role
      nombre = profile.nombre
      apellido = profile.apellido
    }
  }

  if (role !== 'profesor') redirect('/login')

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <Navbar role="profesor" userName={`${nombre} ${apellido}`.trim() || 'Profesor'} />
      <main className="md:pt-16 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
