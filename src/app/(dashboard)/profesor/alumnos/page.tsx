'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Users, Dumbbell, ChevronRight, Search, Loader2, UserX, AlertTriangle, CheckCircle, Plus } from 'lucide-react'

type StatusKey = 'todos' | 'activo' | 'riesgo' | 'inactivo'

interface Alumno {
  id: string
  nombre: string
  apellido: string
  objetivo: string | null
  email: string | null
  observaciones: string | null
  created_at: string
  lastSession?: Date | null
  status: 'activo' | 'riesgo' | 'inactivo'
  rutinaActiva?: string | null
}

const STATUS_CONFIG = {
  activo:   { label: 'Activo',   color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  Icon: CheckCircle },
  riesgo:   { label: 'Riesgo',   color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  Icon: AlertTriangle },
  inactivo: { label: 'Inactivo', color: '#f87171', bg: 'rgba(248,113,113,0.1)', Icon: UserX },
}

export default function AlumnosPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [filter, setFilter] = useState<StatusKey>('todos')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profesores').select('id').eq('user_id', user.id).single()
      if (!prof) { setLoading(false); return }

      const [{ data: rawAlumnos }, { data: sesiones }, { data: asignaciones }] = await Promise.all([
        supabase.from('alumnos')
          .select('id, nombre, apellido, objetivo, email, observaciones, created_at')
          .eq('profesor_id', prof.id)
          .order('nombre'),
        supabase.from('sesiones')
          .select('alumno_id, iniciada_at')
          .in('alumno_id', [] as string[]) // populated below after alumnos load
          .not('finalizada_at', 'is', null)
          .order('iniciada_at', { ascending: false })
          .limit(500),
        supabase.from('asignaciones')
          .select('alumno_id, rutinas(nombre)')
          .eq('activa', true),
      ])

      const ids = (rawAlumnos ?? []).map(a => a.id)

      // Re-fetch sesiones with actual IDs
      const { data: sesionesReal } = ids.length > 0
        ? await supabase.from('sesiones')
            .select('alumno_id, iniciada_at')
            .in('alumno_id', ids)
            .not('finalizada_at', 'is', null)
            .order('iniciada_at', { ascending: false })
            .limit(500)
        : { data: [] as { alumno_id: string; iniciada_at: string }[] }

      const lastSessionMap: Record<string, Date> = {}
      for (const s of (sesionesReal ?? [])) {
        if (!lastSessionMap[s.alumno_id]) {
          lastSessionMap[s.alumno_id] = new Date(s.iniciada_at)
        }
      }

      const rutinaMap: Record<string, string> = {}
      for (const a of (asignaciones ?? [])) {
        const r = (a.rutinas as unknown) as { nombre: string } | { nombre: string }[] | null
        const nombre = Array.isArray(r) ? r[0]?.nombre : r?.nombre
        if (nombre) rutinaMap[a.alumno_id] = nombre
      }

      const now = Date.now()
      const ms7 = 7 * 86_400_000
      const ms3 = 3 * 86_400_000

      const mapped: Alumno[] = (rawAlumnos ?? []).map(a => {
        const last = lastSessionMap[a.id]
        let status: Alumno['status'] = 'inactivo'
        if (last && now - last.getTime() <= ms3) status = 'activo'
        else if (last && now - last.getTime() <= ms7) status = 'riesgo'
        return {
          ...a,
          lastSession: last ?? null,
          status,
          rutinaActiva: rutinaMap[a.id] ?? null,
        }
      })

      setAlumnos(mapped)
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const counts = {
    todos: alumnos.length,
    activo: alumnos.filter(a => a.status === 'activo').length,
    riesgo: alumnos.filter(a => a.status === 'riesgo').length,
    inactivo: alumnos.filter(a => a.status === 'inactivo').length,
  }

  const filtered = alumnos.filter(a => {
    const matchFilter = filter === 'todos' || a.status === filter
    const matchSearch = `${a.nombre} ${a.apellido} ${a.objetivo ?? ''}`.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <Loader2 style={{ width: 24, height: 24, color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>Mis alumnos</h1>
          <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>{alumnos.length} asignado{alumnos.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/profesor/rutinas?new=true" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--primary)', color: '#000', fontSize: 13, fontWeight: 700,
          padding: '9px 16px', borderRadius: 9, textDecoration: 'none',
        }}>
          <Plus style={{ width: 14, height: 14 }} /> Nueva rutina
        </Link>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ width: 14, height: 14, color: 'var(--t3)', position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar alumno..."
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 14, height: 38,
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9,
              color: 'var(--t1)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
            }}
            className="input-accent"
          />
        </div>

        {/* Status filter chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['todos', 'activo', 'riesgo', 'inactivo'] as StatusKey[]).map(s => {
            const active = filter === s
            const cfg = s === 'todos' ? null : STATUS_CONFIG[s]
            return (
              <button key={s} onClick={() => setFilter(s)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: `1px solid ${active ? (cfg?.color ?? 'var(--primary)') : 'rgba(255,255,255,0.1)'}`,
                background: active ? (cfg?.bg ?? 'rgba(170,255,0,0.08)') : 'transparent',
                color: active ? (cfg?.color ?? 'var(--primary)') : 'var(--t2)',
                cursor: 'pointer', transition: 'all 0.12s',
              }}>
                {s === 'todos' ? 'Todos' : cfg?.label}
                <span style={{ fontSize: 10, opacity: 0.8 }}>({counts[s]})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* List */}
      {!alumnos.length ? (
        <div style={{ ...card, padding: '48px 24px', textAlign: 'center' }}>
          <Users style={{ width: 36, height: 36, color: 'var(--t3)', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>Sin alumnos asignados</div>
          <div style={{ fontSize: 13, color: 'var(--t2)' }}>El administrador te asignará alumnos próximamente.</div>
        </div>
      ) : !filtered.length ? (
        <div style={{ ...card, padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--t2)' }}>Sin resultados para &quot;{search}&quot;</div>
        </div>
      ) : (
        <div style={{ ...card, overflow: 'hidden' }}>
          {filtered.map((alumno, i) => {
            const cfg = STATUS_CONFIG[alumno.status]
            const StatusIcon = cfg.Icon
            const initials = `${alumno.nombre[0]}${alumno.apellido[0]}`.toUpperCase()
            return (
              <Link
                key={alumno.id}
                href={`/profesor/alumnos/${alumno.id}`}
                className="row-hover"
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                  textDecoration: 'none',
                  borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#60a5fa',
                }}>
                  {initials}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>
                      {alumno.nombre} {alumno.apellido}
                    </span>
                    {/* Status badge */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: cfg.bg, color: cfg.color,
                    }}>
                      <StatusIcon style={{ width: 9, height: 9 }} />
                      {cfg.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                    {alumno.objetivo && (
                      <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{alumno.objetivo}</span>
                    )}
                    {alumno.rutinaActiva && (
                      <span style={{ fontSize: 11.5, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Dumbbell style={{ width: 9, height: 9 }} /> {alumno.rutinaActiva}
                      </span>
                    )}
                    {alumno.lastSession && (
                      <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>
                        Último entrenamiento: {formatDistanceToNow(alumno.lastSession, { locale: es, addSuffix: true })}
                      </span>
                    )}
                    {!alumno.lastSession && (
                      <span style={{ fontSize: 11.5, color: '#f87171' }}>Sin sesiones registradas</span>
                    )}
                  </div>
                </div>

                <ChevronRight style={{ width: 14, height: 14, color: 'var(--t3)', flexShrink: 0 }} />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
