'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/lib/supabase/types'
import {
  LayoutDashboard, Users, UserCheck, ClipboardList,
  Calendar, TrendingUp, BarChart2, Activity,
  Home, Zap, History, BookOpen,
  LogOut, Settings, Dumbbell, Bell, Search,
  ChevronRight,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ style?: React.CSSProperties; className?: string }>
  pill?: string
}
interface NavGroup { label?: string; items: NavItem[] }

const adminNavGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { href: '/admin',            label: 'Dashboard',     icon: LayoutDashboard },
      { href: '/admin/alumnos',    label: 'Alumnos',       icon: Users },
      { href: '/admin/profesores', label: 'Profesores',    icon: UserCheck },
      { href: '/admin/rutinas',    label: 'Rutinas',       icon: ClipboardList },
    ],
  },
  {
    label: 'Módulos',
    items: [
      { href: '/admin/asistencia', label: 'Asistencia',    icon: Calendar,   pill: 'pronto' },
      { href: '/admin/progreso',   label: 'Progreso',      icon: TrendingUp, pill: 'pronto' },
      { href: '/admin/reportes',   label: 'Reportes',      icon: BarChart2,  pill: 'beta'   },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/config',     label: 'Configuración', icon: Settings,   pill: 'pronto' },
    ],
  },
]

const profesorNavGroups: NavGroup[] = [
  {
    items: [
      { href: '/profesor',            label: 'Dashboard',   icon: LayoutDashboard },
      { href: '/profesor/alumnos',    label: 'Mis alumnos', icon: Users },
      { href: '/profesor/rutinas',    label: 'Rutinas',     icon: Dumbbell },
      { href: '/profesor/ejercicios', label: 'Ejercicios',  icon: BookOpen },
      { href: '/profesor/asistencia', label: 'Asistencia',  icon: Calendar },
    ],
  },
  {
    label: 'Analítica',
    items: [
      { href: '/profesor/rendimiento', label: 'Rendimiento', icon: Activity },
    ],
  },
]

const alumnoNavGroups: NavGroup[] = [
  {
    items: [
      { href: '/alumno',           label: 'Inicio',      icon: Home },
      { href: '/alumno/rutinas',   label: 'Mi rutina',   icon: ClipboardList },
      { href: '/alumno/entrenar',  label: 'Entrenar',    icon: Zap },
      { href: '/alumno/historial', label: 'Historial',   icon: History },
      { href: '/alumno/progreso',  label: 'Mi progreso', icon: TrendingUp },
    ],
  },
]

const roleLabel: Record<UserRole, string> = {
  admin:    'Owner',
  profesor: 'Profesor',
  alumno:   'Atleta',
}

const adminBottomNav = [
  { href: '/admin',            label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/alumnos',    label: 'Alumnos',    icon: Users },
  { href: '/admin/profesores', label: 'Profesores', icon: UserCheck },
  { href: '/admin/rutinas',    label: 'Rutinas',    icon: ClipboardList },
]
const profesorBottomNav = [
  { href: '/profesor',         label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/profesor/alumnos', label: 'Alumnos',    icon: Users },
  { href: '/profesor/rutinas', label: 'Rutinas',    icon: Dumbbell },
]
const alumnoBottomNav = [
  { href: '/alumno',           label: 'Inicio',     icon: Home },
  { href: '/alumno/rutinas',   label: 'Rutina',     icon: ClipboardList },
  { href: '/alumno/entrenar',  label: 'Entrenar',   icon: Zap },
  { href: '/alumno/progreso',  label: 'Progreso',   icon: TrendingUp },
]

interface SidebarLayoutProps {
  role: UserRole
  userName: string
  children: React.ReactNode
}

interface SidebarContentProps {
  navGroups: NavGroup[]
  initials: string
  userName: string
  role: UserRole
  isActive: (item: NavItem) => boolean
  handleLogout: () => void
}

function SidebarContent({ navGroups, initials, userName, role, isActive, handleLogout }: SidebarContentProps) {
  return (
    <>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '18px 14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 30, height: 30, background: 'var(--primary)', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Dumbbell style={{ width: 15, height: 15, strokeWidth: 2.5, color: '#fff' }} />
        </div>
        <span className="sidebar-label" style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', letterSpacing: '-0.01em' }}>LangGym</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {navGroups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 4 }}>
            {group.label && (
              <div className="sidebar-group-label" style={{
                fontSize: 10, fontWeight: 600, color: 'var(--t3)',
                textTransform: 'uppercase', letterSpacing: '0.09em',
                padding: '16px 10px 6px',
              }}>
                {group.label}
              </div>
            )}
            {group.items.map(item => {
              const active = isActive(item)
              const disabled = !!item.pill
              return (
                <div key={item.href} className="nav-item-wrap">
                  <Link
                    href={disabled ? '#' : item.href}
                    onClick={disabled ? (e) => e.preventDefault() : undefined}
                    className={`nav-item-base ${active ? 'nav-active-item' : ''} ${disabled ? 'nav-disabled-item' : ''}`}
                  >
                    <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <item.icon style={{ width: 15, height: 15, strokeWidth: 1.8 }} />
                    </span>
                    <span className="sidebar-label" style={{ flex: 1, fontSize: 13.5 }}>{item.label}</span>
                    {item.pill && (
                      <span className="sidebar-label" style={{
                        fontSize: 9, background: 'rgba(255,255,255,0.06)',
                        color: 'var(--t3)', borderRadius: 999,
                        padding: '2px 6px', letterSpacing: '0.04em', fontWeight: 500,
                      }}>
                        {item.pill}
                      </span>
                    )}
                  </Link>
                  <span className="nav-tooltip">{item.label}</span>
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '12px 10px',
        display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'rgba(255,61,26,0.1)', border: '1px solid rgba(255,61,26,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, color: 'var(--primary)', flexShrink: 0,
          letterSpacing: '0.02em',
        }}>
          {initials}
        </div>
        <div className="sidebar-user-info" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: 'var(--t1)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>{roleLabel[role]}</div>
        </div>
        <div className="nav-item-wrap">
          <button onClick={handleLogout} title="Cerrar sesión" className="logout-btn" style={{ flexShrink: 0 }}>
            <LogOut style={{ width: 14, height: 14 }} />
          </button>
          <span className="nav-tooltip">Cerrar sesión</span>
        </div>
      </div>
    </>
  )
}

export function SidebarLayout({ role, userName, children }: SidebarLayoutProps) {
  const pathname = usePathname()

  const navGroups = role === 'admin' ? adminNavGroups
    : role === 'profesor' ? profesorNavGroups
    : alumnoNavGroups

  const bottomNav = role === 'admin' ? adminBottomNav
    : role === 'profesor' ? profesorBottomNav
    : alumnoBottomNav

  const initials = userName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'

  function isActive(item: NavItem) {
    if (item.pill) return false
    const roots = ['/admin', '/profesor', '/alumno']
    if (roots.includes(item.href)) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const allItems = navGroups.flatMap(g => g.items)
  const activeItem = allItems.find(i => isActive(i))
  const pageTitle = activeItem?.label ?? 'LangGym'

  async function handleLogout() {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.replace('/login')
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--background)' }}>

      {/* Sidebar */}
      <aside className="sidebar-rail">
        <SidebarContent
          navGroups={navGroups}
          initials={initials}
          userName={userName}
          role={role}
          isActive={isActive}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Topbar */}
      <header className="topbar-bar" style={{ padding: '0 20px', gap: 16 }}>

        {/* Breadcrumb (desktop) */}
        <div className="topbar-breadcrumb" style={{ alignItems: 'center', gap: 6, flex: 1 }}>
          <span style={{ fontSize: 12.5, color: 'var(--t3)', fontWeight: 400 }}>LangGym</span>
          <ChevronRight style={{ width: 12, height: 12, color: 'var(--t3)' }} />
          <span style={{ fontSize: 12.5, color: 'var(--t1)', fontWeight: 500 }}>{pageTitle}</span>
        </div>

        {/* Page title (tablet/mobile) */}
        <div className="topbar-page-title" style={{ alignItems: 'center', flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{pageTitle}</span>
        </div>

        {/* Search (desktop) */}
        <div className="topbar-search-area" style={{ alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '0 12px', width: 260, height: 34,
          }}>
            <Search style={{ width: 13, height: 13, color: 'var(--t3)', flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: 'var(--t3)', flex: 1 }}>Buscar…</span>
            <span style={{ fontSize: 10.5, color: 'var(--t3)', background: 'rgba(255,255,255,0.06)', padding: '2px 5px', borderRadius: 4 }}>⌘K</span>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <button style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--t3)', padding: 6, borderRadius: 7,
            display: 'flex', alignItems: 'center',
            transition: 'color 0.12s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--t1)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--t3)')}
          >
            <Bell style={{ width: 16, height: 16 }} />
          </button>

          <div className="topbar-org-name" style={{ alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
              transition: 'border-color 0.12s',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(255,61,26,0.1)', border: '1px solid rgba(255,61,26,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, color: 'var(--primary)',
              }}>
                {initials}
              </div>
              <span style={{ fontSize: 12.5, color: 'var(--t1)', fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName}
              </span>
            </div>
          </div>

          {/* Mobile: logout button */}
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--t3)', padding: 6, borderRadius: 7,
              alignItems: 'center',
            }}
            className="mobile-logout"
          >
            <LogOut style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </header>

      {/* Bottom nav (mobile) */}
      <nav className="bottom-nav-bar">
        {bottomNav.map(item => {
          const active = isActive(item)
          return (
            <Link key={item.href} href={item.href} className={`bnav-item${active ? ' active' : ''}`}>
              <item.icon style={{ width: 20, height: 20, strokeWidth: 1.8 }} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Main */}
      <main className="content-main">
        {children}
      </main>

    </div>
  )
}
