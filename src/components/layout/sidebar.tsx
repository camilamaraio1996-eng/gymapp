'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { UserRole } from '@/lib/supabase/types'
import {
  LayoutDashboard, Users, UserCheck, Dumbbell, ClipboardList,
  Calendar, TrendingUp, MessageSquare, BarChart2,
  Home, Zap, History, BookOpen, Menu, X, LogOut,
  Settings,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  soon?: boolean
}

const adminNav: NavItem[] = [
  { href: '/admin',             label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/admin/alumnos',     label: 'Alumnos',        icon: Users },
  { href: '/admin/profesores',  label: 'Profesores',     icon: UserCheck },
  { href: '/admin/rutinas',     label: 'Rutinas',        icon: Dumbbell },
  { href: '/admin/ejercicios',  label: 'Ejercicios',     icon: BookOpen,       soon: true },
  { href: '/admin/asistencia',  label: 'Asistencia',     icon: Calendar,       soon: true },
  { href: '/admin/progreso',    label: 'Progreso físico',icon: TrendingUp,     soon: true },
  { href: '/admin/mensajes',    label: 'Mensajes',       icon: MessageSquare,  soon: true },
  { href: '/admin/reportes',    label: 'Reportes',       icon: BarChart2,      soon: true },
  { href: '/admin/config',      label: 'Configuración',  icon: Settings,       soon: true },
]

const profesorNav: NavItem[] = [
  { href: '/profesor',             label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/profesor/alumnos',     label: 'Mis alumnos',icon: Users },
  { href: '/profesor/rutinas',     label: 'Rutinas',    icon: Dumbbell },
  { href: '/profesor/ejercicios',  label: 'Ejercicios', icon: BookOpen,      soon: true },
  { href: '/profesor/asistencia',  label: 'Asistencia', icon: Calendar,      soon: true },
  { href: '/profesor/mensajes',    label: 'Mensajes',   icon: MessageSquare, soon: true },
]

const alumnoNav: NavItem[] = [
  { href: '/alumno',           label: 'Inicio',      icon: Home },
  { href: '/alumno/rutinas',   label: 'Mi rutina',   icon: ClipboardList },
  { href: '/alumno/entrenar',  label: 'Entrenar',    icon: Zap,           soon: true },
  { href: '/alumno/historial', label: 'Historial',   icon: History,       soon: true },
  { href: '/alumno/progreso',  label: 'Mi progreso', icon: TrendingUp,    soon: true },
  { href: '/alumno/mensajes',  label: 'Mensajes',    icon: MessageSquare, soon: true },
]

const roleLabel: Record<UserRole, string> = {
  admin: 'Owner',
  profesor: 'Profesor',
  alumno: 'Alumno',
}

interface SidebarLayoutProps {
  role: UserRole
  userName: string
  children: React.ReactNode
}

export function SidebarLayout({ role, userName, children }: SidebarLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const navItems = role === 'admin' ? adminNav : role === 'profesor' ? profesorNav : alumnoNav

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when drawer open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/login')
  }

  function isActive(href: string) {
    const dashboards = ['/admin', '/profesor', '/alumno']
    if (dashboards.includes(href)) return pathname === href
    return pathname.startsWith(href)
  }

  const activeLabel = navItems.find((item) => isActive(item.href) && !item.soon)?.label ?? ''

  function NavLinks() {
    return (
      <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon, soon }) => {
          const active = isActive(href) && !soon
          return (
            <Link
              key={href}
              href={soon ? '#' : href}
              onClick={soon ? (e) => e.preventDefault() : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-[var(--primary)] text-black'
                  : soon
                    ? 'text-[var(--text-disabled)] cursor-default select-none'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)]'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {soon && (
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-disabled)] font-medium leading-none">
                  pronto
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    )
  }

  function UserFooter() {
    return (
      <div className="px-2 py-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg group hover:bg-[var(--bg-elevated)] transition-colors cursor-default">
          <div className="w-7 h-7 rounded-full bg-[var(--primary)]/15 flex items-center justify-center text-[11px] font-bold text-[var(--primary)] shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text)] truncate leading-tight">{userName}</p>
            <p className="text-xs text-[var(--text-muted)] leading-tight">{roleLabel[role]}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[var(--background)]">

      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col bg-[var(--bg-card)] border-r border-[var(--border)] z-40">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[var(--border)] shrink-0">
          <div className="w-7 h-7 bg-[var(--primary)] rounded-lg flex items-center justify-center shrink-0">
            <Dumbbell className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="font-bold text-[15px] tracking-tight">GymPro</span>
        </div>

        <NavLinks />
        <UserFooter />
      </aside>

      {/* ── Mobile overlay ───────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ────────────────────────────── */}
      <aside
        className={cn(
          'md:hidden fixed inset-y-0 left-0 w-72 z-50 flex flex-col bg-[var(--bg-card)] border-r border-[var(--border)] transform transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo + close */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[var(--primary)] rounded-lg flex items-center justify-center shrink-0">
              <Dumbbell className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="font-bold text-[15px] tracking-tight">GymPro</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <NavLinks />
        <UserFooter />
      </aside>

      {/* ── Topbar ───────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 md:left-60 right-0 h-14 z-30 flex items-center gap-3 px-4 md:px-6 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)]">
        {/* Hamburger */}
        <button
          className="md:hidden p-1.5 -ml-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] transition-colors"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile logo */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-6 h-6 bg-[var(--primary)] rounded-md flex items-center justify-center">
            <Dumbbell className="w-3 h-3 text-black" />
          </div>
          <span className="font-bold text-sm">GymPro</span>
        </div>

        {/* Desktop breadcrumb */}
        {activeLabel && (
          <span className="hidden md:block text-sm font-medium text-[var(--text)]">
            {activeLabel}
          </span>
        )}

        <div className="flex-1" />

        {/* Mobile logout */}
        <button
          onClick={handleLogout}
          className="md:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="md:ml-60 pt-14 min-h-dvh">
        {children}
      </main>
    </div>
  )
}
