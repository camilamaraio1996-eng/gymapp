import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarLayout } from '@/components/layout/sidebar'

export default async function AlumnoLayout({ children }: { children: React.ReactNode }) {
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

  role = role || 'alumno'

  if (role !== 'alumno') redirect('/login')

  return (
    <SidebarLayout role="alumno" userName={`${nombre} ${apellido}`.trim() || 'Alumno'}>
      <div className="dash-content" style={{ maxWidth: 780 }}>
        {children}
      </div>
    </SidebarLayout>
  )
}
