'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  ChevronLeft, Loader2, Dumbbell, TrendingUp, Calendar, Clock,
  Trophy, MessageSquare, Plus, Trash2, AlertTriangle, CheckCircle, Star,
} from 'lucide-react'

interface Alumno {
  id: string; nombre: string; apellido: string; objetivo: string | null
  email: string | null; observaciones: string | null; created_at: string
}
interface Medicion {
  id: string; fecha: string; peso_kg: number | null
  masa_muscular_kg: number | null; grasa_pct: number | null
}
interface Sesion {
  id: string; iniciada_at: string; rutina_nombre: string | null
  dia_label: string | null; duracion_segundos: number | null
  volumen_total_kg: number | null; series_completadas: number | null
}
interface Marca {
  id: string; ejercicio_nombre: string; peso_kg: number | null; repeticiones: number | null; fecha: string
}
interface Obs {
  id: string; contenido: string; tipo: 'nota' | 'alerta' | 'logro'; created_at: string
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div style={{ height: 32, color: 'var(--t3)', fontSize: 11 }}>Sin datos</div>
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const w = 120, h = 32
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const OBS_TIPOS = {
  nota:   { label: 'Nota',   color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  Icon: CheckCircle },
  alerta: { label: 'Alerta', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  Icon: AlertTriangle },
  logro:  { label: 'Logro',  color: '#4ade80', bg: 'rgba(74,222,128,0.1)', Icon: Star },
}

function formatDur(secs: number) {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function AlumnoDetailPage() {
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [alumno, setAlumno] = useState<Alumno | null>(null)
  const [mediciones, setMediciones] = useState<Medicion[]>([])
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [obs, setObs] = useState<Obs[]>([])
  const [rutinaActiva, setRutinaActiva] = useState<string | null>(null)
  const [profesorId, setProfesorId] = useState<string | null>(null)

  const [newObs, setNewObs] = useState('')
  const [newObsTipo, setNewObsTipo] = useState<Obs['tipo']>('nota')
  const [savingObs, setSavingObs] = useState(false)
  const obsRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase.from('profesores').select('id').eq('user_id', user.id).single()
      if (!prof) { setLoading(false); return }
      setProfesorId(prof.id)

      const [
        { data: al },
        { data: meds },
        { data: sess },
        { data: mrks },
        { data: observations },
        { data: asigs },
      ] = await Promise.all([
        supabase.from('alumnos').select('*').eq('id', id).eq('profesor_id', prof.id).single(),
        supabase.from('mediciones').select('id, fecha, peso_kg, masa_muscular_kg, grasa_pct').eq('alumno_id', id).order('fecha', { ascending: false }).limit(8),
        supabase.from('sesiones').select('id, iniciada_at, rutina_nombre, dia_label, duracion_segundos, volumen_total_kg, series_completadas').eq('alumno_id', id).not('finalizada_at', 'is', null).order('iniciada_at', { ascending: false }).limit(10),
        supabase.from('marcas_personales').select('id, ejercicio_nombre, peso_kg, repeticiones, fecha').eq('alumno_id', id).order('peso_kg', { ascending: false }).limit(8),
        supabase.from('observaciones_alumno').select('id, contenido, tipo, created_at').eq('alumno_id', id).eq('profesor_id', prof.id).order('created_at', { ascending: false }),
        supabase.from('asignaciones').select('rutinas(nombre)').eq('alumno_id', id).eq('activa', true).limit(1),
      ])

      if (!al) { setLoading(false); return }
      setAlumno(al)
      setMediciones((meds ?? []) as Medicion[])
      setSesiones((sess ?? []) as Sesion[])
      setMarcas((mrks ?? []) as Marca[])
      setObs((observations ?? []) as Obs[])

      const asig = asigs?.[0] as { rutinas: { nombre: string } | null } | undefined
      setRutinaActiva(asig?.rutinas?.nombre ?? null)

      setLoading(false)
    }
    load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function addObs() {
    if (!newObs.trim() || !profesorId) return
    setSavingObs(true)
    const { data, error } = await supabase.from('observaciones_alumno').insert({
      alumno_id: id, profesor_id: profesorId,
      contenido: newObs.trim(), tipo: newObsTipo,
    }).select('id, contenido, tipo, created_at').single()
    setSavingObs(false)
    if (error) { toast.error('Error al guardar'); return }
    setObs(prev => [data as Obs, ...prev])
    setNewObs('')
    toast.success('Observación guardada')
  }

  async function deleteObs(obsId: string) {
    await supabase.from('observaciones_alumno').delete().eq('id', obsId)
    setObs(prev => prev.filter(o => o.id !== obsId))
  }

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <Loader2 style={{ width: 24, height: 24, color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (!alumno) return (
    <div style={{ textAlign: 'center', paddingTop: 60 }}>
      <div style={{ color: 'var(--t2)' }}>Alumno no encontrado.</div>
      <Link href="/profesor/alumnos" style={{ color: 'var(--primary)', fontSize: 13, marginTop: 12, display: 'inline-block' }}>← Volver</Link>
    </div>
  )

  const ultimaMedicion = mediciones[0]
  const ultimaSesion = sesiones[0]
  const totalSesiones = sesiones.length

  // Sparkline data (chronological)
  const pesoData = [...mediciones].reverse().map(m => Number(m.peso_kg ?? 0)).filter(v => v > 0)
  const musculoData = [...mediciones].reverse().map(m => Number(m.masa_muscular_kg ?? 0)).filter(v => v > 0)
  const grasaData = [...mediciones].reverse().map(m => Number(m.grasa_pct ?? 0)).filter(v => v > 0)

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Back */}
      <Link href="/profesor/alumnos" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--t3)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
        <ChevronLeft style={{ width: 15, height: 15 }} /> Mis alumnos
      </Link>

      {/* Profile header */}
      <div style={{ ...card, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0, background: 'rgba(96,165,250,0.1)', border: '2px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#60a5fa' }}>
            {alumno.nombre[0]}{alumno.apellido[0]}
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.01em' }}>
              {alumno.nombre} {alumno.apellido}
            </h1>
            <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
              {alumno.objetivo && (
                <span style={{ fontSize: 12.5, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TrendingUp style={{ width: 11, height: 11 }} /> {alumno.objetivo}
                </span>
              )}
              {alumno.email && (
                <span style={{ fontSize: 12.5, color: 'var(--t3)' }}>{alumno.email}</span>
              )}
              <span style={{ fontSize: 12.5, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar style={{ width: 11, height: 11 }} />
                Desde {format(new Date(alumno.created_at), 'MMMM yyyy', { locale: es })}
              </span>
            </div>
            {rutinaActiva && (
              <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(170,255,0,0.07)', border: '1px solid rgba(170,255,0,0.15)', padding: '4px 12px', borderRadius: 20 }}>
                <Dumbbell style={{ width: 11, height: 11, color: 'var(--primary)' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>{rutinaActiva}</span>
              </div>
            )}
          </div>
          <Link href={`/profesor/mensajes`} style={{
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--t2)', fontSize: 13, padding: '8px 14px', borderRadius: 9, textDecoration: 'none',
          }}>
            <MessageSquare style={{ width: 13, height: 13 }} /> Mensaje
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="kpi-grid">
        {[
          { label: 'Sesiones', value: totalSesiones, Icon: Dumbbell, color: 'var(--primary)', bg: 'rgba(170,255,0,0.08)' },
          { label: 'Última sesión', value: ultimaSesion ? formatDistanceToNow(new Date(ultimaSesion.iniciada_at), { locale: es, addSuffix: true }) : 'Nunca', Icon: Clock, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
          { label: 'Peso actual', value: ultimaMedicion?.peso_kg ? `${ultimaMedicion.peso_kg} kg` : '—', Icon: TrendingUp, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
          { label: 'Records', value: marcas.length, Icon: Trophy, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} style={{ ...card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon style={{ width: 14, height: 14, color } as React.CSSProperties} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
              <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress sparklines */}
      {mediciones.length > 0 && (
        <div style={card}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Progreso corporal</span>
            <span style={{ fontSize: 11.5, color: 'var(--t3)', marginLeft: 8 }}>Últimas {mediciones.length} mediciones</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
            {[
              { label: 'Peso', data: pesoData, color: '#a78bfa', unit: 'kg', current: ultimaMedicion?.peso_kg },
              { label: 'Músculo', data: musculoData, color: '#4ade80', unit: 'kg', current: ultimaMedicion?.masa_muscular_kg },
              { label: 'Grasa', data: grasaData, color: '#fbbf24', unit: '%', current: ultimaMedicion?.grasa_pct },
            ].map(({ label, data, color, unit, current }, i) => (
              <div key={label} style={{ padding: '16px 20px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
                  {current ? `${current}${unit}` : '—'}
                </div>
                <Sparkline data={data} color={color} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      <div style={card}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Historial de sesiones</span>
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>{totalSesiones} total</span>
        </div>
        {sesiones.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <Dumbbell style={{ width: 24, height: 24, color: 'var(--t3)', margin: '0 auto 8px', display: 'block' }} />
            <div style={{ fontSize: 13, color: 'var(--t2)' }}>Sin sesiones registradas</div>
          </div>
        ) : (
          sesiones.map((s, i) => (
            <div key={s.id} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(170,255,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Dumbbell style={{ width: 13, height: 13, color: 'var(--primary)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.rutina_nombre ?? 'Entrenamiento'}{s.dia_label ? ` · ${s.dia_label}` : ''}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{format(new Date(s.iniciada_at), "d MMM yyyy", { locale: es })}</span>
                  {s.duracion_segundos ? <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{formatDur(s.duracion_segundos)}</span> : null}
                  {s.volumen_total_kg ? <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{Number(s.volumen_total_kg).toLocaleString('es-AR')} kg</span> : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Personal records */}
      {marcas.length > 0 && (
        <div style={card}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Marcas personales</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1, background: 'rgba(255,255,255,0.05)' }}>
            {marcas.map(m => (
              <div key={m.id} style={{ padding: '12px 16px', background: 'var(--surface)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>{m.ejercicio_nombre}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fbbf24' }}>
                  {m.peso_kg ? `${m.peso_kg} kg` : '—'}
                  {m.repeticiones ? <span style={{ fontSize: 11.5, color: 'var(--t3)', marginLeft: 5 }}>× {m.repeticiones}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observations */}
      <div style={card}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Observaciones privadas</span>
          <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 3 }}>Solo tú podés ver estas notas</div>
        </div>

        {/* Add form */}
        <div style={{ padding: '16px 20px', borderBottom: obs.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          {/* Tipo selector */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {(['nota', 'alerta', 'logro'] as Obs['tipo'][]).map(t => {
              const cfg = OBS_TIPOS[t]
              const active = newObsTipo === t
              return (
                <button key={t} onClick={() => setNewObsTipo(t)} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20,
                  fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${active ? cfg.color : 'rgba(255,255,255,0.1)'}`,
                  background: active ? cfg.bg : 'transparent',
                  color: active ? cfg.color : 'var(--t3)',
                  transition: 'all 0.12s',
                }}>
                  <cfg.Icon style={{ width: 10, height: 10 }} />
                  {cfg.label}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <textarea
              ref={obsRef}
              value={newObs}
              onChange={e => setNewObs(e.target.value)}
              placeholder="Ej: Dolor en hombro derecho, aumentar carga progresivamente..."
              rows={2}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 9, padding: '9px 13px', fontSize: 13, color: 'var(--t1)',
                outline: 'none', fontFamily: 'inherit', resize: 'none',
              }}
              className="input-accent"
            />
            <button onClick={addObs} disabled={!newObs.trim() || savingObs} style={{
              width: 38, height: 38, borderRadius: 9, flexShrink: 0, alignSelf: 'flex-end',
              background: newObs.trim() && !savingObs ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
              color: newObs.trim() && !savingObs ? '#000' : 'var(--t3)',
              border: 'none', cursor: newObs.trim() && !savingObs ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>
              {savingObs
                ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                : <Plus style={{ width: 14, height: 14 }} />
              }
            </button>
          </div>
        </div>

        {/* Obs list */}
        {obs.length === 0 ? (
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--t3)' }}>Sin observaciones aún</div>
          </div>
        ) : (
          obs.map((o, i) => {
            const cfg = OBS_TIPOS[o.tipo]
            return (
              <div key={o.id} className="row-hover" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 20px', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <cfg.Icon style={{ width: 12, height: 12, color: cfg.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.45, wordBreak: 'break-word' }}>{o.contenido}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>
                    {format(new Date(o.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                    {' · '}
                    <span style={{ color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                  </div>
                </div>
                <button onClick={() => deleteObs(o.id)} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--t3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.12s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--t3)' }}
                >
                  <Trash2 style={{ width: 12, height: 12 }} />
                </button>
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
