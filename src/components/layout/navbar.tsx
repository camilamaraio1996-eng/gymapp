'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Dumbbell, LayoutDashboard, Users, UserCheck, ClipboardList, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { UserRole } from '@/lib/supabase/types'

interface NavbarProps {
  role: UserRole
  userName: string
}

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/alumnos', label: 'Alumnos', icon: Users },
  { href: '/admin/profesores', label: 'Profesores', icon: UserCheck },
  { href: '/admin/rutinas', label: 'Rutinas', icon: ClipboardList },
]

const profesorLinks = [
  { href: '/profesor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profesor/alumnos', label: 'Mis Alumnos', icon: Users },
  { href: '/profesor/rutinas', label: 'Rutinas', icon: ClipboardList },
]

const alumnoLinks = [
  { href: '/alumno', label: 'Inicio', icon: LayoutDashboard },
  { href: '/alumno/rutinas', label: 'Rutinas', icon: ClipboardList },
  { href: '/alumno/perfil', label: 'Perfil', icon: User },
]

export function Navbar({ role, userName }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const links = role === 'admin' ? adminLinks : role === 'profesor' ? profesorLinks : alumnoLinks

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/login')
  }

  return (
    <>
      {/* Top header - desktop */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-[var(--border)] items-center px-6 justify-between">
        <Link href={`/${role}`} className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-lg">GymPro</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                pathname === href
                  ? 'bg-[var(--primary)] text-black'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-[var(--muted-foreground)]">{role}</p>
            <p className="text-sm font-medium">{userName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-[var(--border)] pb-safe">
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-[60px] transition-all duration-200',
                pathname === href
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--muted-foreground)]'
              )}
            >
              <Icon className={cn('w-5 h-5 transition-transform duration-200', pathname === href && 'scale-110')} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-[60px] text-[var(--muted-foreground)] active:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-medium">Salir</span>
          </button>
        </div>
      </nav>
    </>
  )
}
