import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'

export default async function AlumnoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'alumno') redirect('/login')

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <Navbar role="alumno" userName={`${profile.nombre} ${profile.apellido}`} />
      <main className="md:pt-16 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
