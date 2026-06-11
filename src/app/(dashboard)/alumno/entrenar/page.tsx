'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap, ChevronLeft, CheckCircle2, Timer, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

/* ─── types ───────────────────────────────────────────────────── */
type Phase = 'loading' | 'idle' | 'training' | 'resting' | 'done'

interface Ejercicio {
  id: string
  nombre: string
  series: number
  repeticiones: string
  descanso: string
  observaciones: string | null
  orden: number
  dia: number
  grupo_muscular: string | null
}

interface SetLog {
  ejercicio_id: string | null
  ejercicio_nombre: string
  numero_serie: number
  peso_kg: number | null
  repeticiones: number | null
  esfuerzo: number | null
}

interface Training {
  alumnoId: string
  rutinaId: string
  rutinaNombre: string
  dia: number
  diaLabel: string
  ejercicios: Ejercicio[]
  ejercicioIndex: number
  setIndex: number
  logs: SetLog[]
  startedAt: Date
}

interface DoneState {
  logs: SetLog[]
  ejercicios: Ejercicio[]
  rutinaNombre: string
  diaLabel: string
  duracionSeg: number
  sesionId: string | null
}

/* ─── helpers ─────────────────────────────────────────────────── */
function parseDescanso(d: string): number {
  if (!d) return 60
  const s = d.toLowerCase().trim()
  const min = s.match(/(\d+)\s*min/)
  if (min) return parseInt(min[1]) * 60
  const sec = s.match(/(\d+)\s*s/)
  if (sec) return parseInt(sec[1])
  const num = s.match(/^(\d+)$/)
  if (num) return parseInt(num[1])
  return 60
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60), s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDur(secs: number) {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

/* ─── component ───────────────────────────────────────────────── */
export default function EntrenarPage() {
  const supabase = createClient()

  const [phase, setPhase] = useState<Phase>('loading')
  const [asignaciones, setAsignaciones] = useState<any[]>([])
  const [alumnoId, setAlumnoId] = useState<string | null>(null)
  const [training, setTraining] = useState<Training | null>(null)
  const [done, setDone] = useState<DoneState | null>(null)
  const [restLeft, setRestLeft] = useState(60)
  const [restTotal, setRestTotal] = useState(60)
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [effort, setEffort] = useState(7)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: alumno } = await supabase.from('alumnos').select('id').eq('user_id', user.id).single()
      if (!alumno) { setPhase('idle'); return }
      setAlumnoId(alumno.id)
      const { data: asigs } = await supabase
        .from('asignaciones')
        .select('*, rutina:rutinas(id,nombre,objetivo,dias_por_semana,ejercicios(*))')
        .eq('alumno_id', alumno.id).eq('activa', true)
        .order('created_at', { ascending: false })
      const sorted = (asigs ?? []).map(a => ({
        ...a,
        rutina: {
          ...a.rutina,
          ejercicios: [...(a.rutina?.ejercicios ?? [])].sort((x: any, y: any) =>
            (x.dia ?? 1) !== (y.dia ?? 1) ? (x.dia ?? 1) - (y.dia ?? 1) : x.orden - y.orden
          ),
        },
      }))
      setAsignaciones(sorted)
      setPhase('idle')
    }
    load()
  }, [])

  // rest timer
  useEffect(() => {
    if (phase !== 'resting') { if (timerRef.current) clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setRestLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); setPhase('training'); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  function startDay(asig: any, dia: number, label: string) {
    const ejs: Ejercicio[] = (asig.rutina?.ejercicios ?? []).filter((e: any) => (e.dia ?? 1) === dia)
    if (!ejs.length) { toast.error('No hay ejercicios para este día'); return }
    const t: Training = {
      alumnoId: alumnoId!,
      rutinaId: asig.rutina.id,
      rutinaNombre: asig.rutina.nombre,
      dia, diaLabel: label,
      ejercicios: ejs, ejercicioIndex: 0, setIndex: 1, logs: [],
      startedAt: new Date(),
    }
    setTraining(t)
    setReps(ejs[0]?.repeticiones?.replace(/[^\d]/g, '') ?? '')
    setWeight(''); setEffort(7)
    setPhase('training')
  }

  function completeSet() {
    if (!training) return
    const ej = training.ejercicios[training.ejercicioIndex]
    const newLog: SetLog = {
      ejercicio_id: ej.id,
      ejercicio_nombre: ej.nombre,
      numero_serie: training.setIndex,
      peso_kg: weight ? parseFloat(weight) : null,
      repeticiones: reps ? parseInt(reps) : null,
      esfuerzo: effort,
    }
    const newLogs = [...training.logs, newLog]
    const lastSet = training.setIndex >= ej.series
    const lastEj = training.ejercicioIndex >= training.ejercicios.length - 1

    if (lastSet && lastEj) {
      setTraining(prev => prev ? { ...prev, logs: newLogs } : null)
      finalizeSesion(newLogs, training)
      return
    }

    const nextEjIdx = lastSet ? training.ejercicioIndex + 1 : training.ejercicioIndex
    const nextSetIdx = lastSet ? 1 : training.setIndex + 1
    const nextEj = training.ejercicios[nextEjIdx]

    setTraining(prev => prev ? { ...prev, logs: newLogs, ejercicioIndex: nextEjIdx, setIndex: nextSetIdx } : null)
    setReps(nextEj?.repeticiones?.replace(/[^\d]/g, '') ?? '')
    setWeight(''); setEffort(7)

    const restSecs = parseDescanso(ej.descanso ?? '')
    setRestTotal(restSecs); setRestLeft(restSecs)
    setPhase('resting')
  }

  async function finalizeSesion(logs: SetLog[], t: Training) {
    const finalizedAt = new Date()
    const durSeg = Math.floor((finalizedAt.getTime() - t.startedAt.getTime()) / 1000)
    const volumen = logs.reduce((s, l) => s + (l.peso_kg ?? 0) * (l.repeticiones ?? 0), 0)
    const uniqueEjs = new Set(logs.map(l => l.ejercicio_nombre)).size

    setDone({ logs, ejercicios: t.ejercicios, rutinaNombre: t.rutinaNombre, diaLabel: t.diaLabel, duracionSeg: durSeg, sesionId: null })
    setPhase('done')

    const { data: sesion, error } = await supabase.from('sesiones').insert({
      alumno_id: t.alumnoId,
      rutina_id: t.rutinaId,
      rutina_nombre: t.rutinaNombre,
      dia: t.dia, dia_label: t.diaLabel,
      iniciada_at: t.startedAt.toISOString(),
      finalizada_at: finalizedAt.toISOString(),
      duracion_segundos: durSeg,
      volumen_total_kg: Math.round(volumen * 10) / 10,
      ejercicios_completados: uniqueEjs,
      series_completadas: logs.length,
    }).select('id').single()

    if (error || !sesion) { toast.error('Error al guardar la sesión'); return }

    if (logs.length) {
      await supabase.from('series_log').insert(
        logs.map(l => ({ sesion_id: sesion.id, ...l }))
      )
    }
    setDone(prev => prev ? { ...prev, sesionId: sesion.id } : prev)
    toast.success('¡Sesión guardada!')
  }

  /* ─── styles ──────────────────────────────────────────────────── */
  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }

  /* ─── loading ─────────────────────────────────────────────────── */
  if (phase === 'loading') return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <Loader2 style={{ width: 24, height: 24, color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  /* ─── idle ────────────────────────────────────────────────────── */
  if (phase === 'idle') {
    if (!asignaciones.length) return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>Entrenar</h1>
        <div style={{ ...card, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏋️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>Sin rutina asignada</div>
          <div style={{ fontSize: 13, color: 'var(--t2)' }}>Tu profesor te asignará una rutina pronto.</div>
        </div>
      </div>
    )

    const diaLabels = ['', 'Día A', 'Día B', 'Día C', 'Día D', 'Día E', 'Día F', 'Día G']
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>Entrenar</h1>
          <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>Seleccioná un día y empezá tu sesión.</p>
        </div>
        {asignaciones.map(asig => {
          const ejs: Ejercicio[] = asig.rutina?.ejercicios ?? []
          const dias = [...new Set(ejs.map(e => e.dia ?? 1))].sort()
          return (
            <div key={asig.id} style={card}>
              <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(170,255,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap style={{ width: 16, height: 16, color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)' }}>{asig.rutina?.nombre}</div>
                    {asig.rutina?.objetivo && <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 1 }}>{asig.rutina.objetivo}</div>}
                  </div>
                </div>
              </div>
              <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dias.map(dia => {
                  const diaEjs = ejs.filter(e => (e.dia ?? 1) === dia)
                  const label = dias.length === 1 ? 'Entrenamiento' : (diaLabels[dia] ?? `Día ${dia}`)
                  return (
                    <div key={dia} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.02)' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{label}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>{diaEjs.length} ejercicios</div>
                        </div>
                        <button
                          onClick={() => startDay(asig, dia, label)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--primary)', color: '#000', fontSize: 12.5, fontWeight: 700, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                        >
                          <Zap style={{ width: 12, height: 12 }} /> Empezar
                        </button>
                      </div>
                      <div style={{ padding: '6px 14px 10px' }}>
                        {diaEjs.map((ej, i) => (
                          <div key={ej.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                            <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, width: 16, textAlign: 'center' }}>{i + 1}</span>
                            <span style={{ fontSize: 12.5, color: 'var(--t2)', flex: 1 }}>{ej.nombre}</span>
                            <span style={{ fontSize: 11, color: 'var(--t3)' }}>{ej.series}×{ej.repeticiones}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  /* ─── training ────────────────────────────────────────────────── */
  if (phase === 'training' && training) {
    const ej = training.ejercicios[training.ejercicioIndex]
    const totalSets = training.ejercicios.reduce((s, e) => s + e.series, 0)
    const pct = Math.round((training.logs.length / totalSets) * 100)
    const prevSets = training.logs.filter(l => l.ejercicio_nombre === ej.nombre)

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => { if (confirm('¿Abandonar el entrenamiento?')) setPhase('idle') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <ChevronLeft style={{ width: 20, height: 20 }} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{training.diaLabel}</div>
            <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 1 }}>
              Ejercicio {training.ejercicioIndex + 1}/{training.ejercicios.length}
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>{pct}%</span>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 999, height: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)', borderRadius: 999, transition: 'width 0.4s' }} />
        </div>

        {/* Exercise card */}
        <div style={{ ...card, padding: '22px 20px' }}>
          {ej.grupo_muscular && (
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
              {ej.grupo_muscular}
            </div>
          )}
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.01em', marginBottom: 10 }}>
            {ej.nombre}
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15 }}>{ej.series}</span> series
            </div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>
              <span style={{ color: 'var(--t2)', fontWeight: 600, fontSize: 15 }}>{ej.repeticiones}</span> reps
            </div>
            {ej.descanso && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--t3)' }}>
                <Timer style={{ width: 11, height: 11 }} /> {ej.descanso}
              </div>
            )}
          </div>
          {ej.observaciones && (
            <div style={{ fontSize: 12, color: 'var(--t3)', fontStyle: 'italic', marginTop: 10 }}>{ej.observaciones}</div>
          )}
        </div>

        {/* Set circles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {Array.from({ length: ej.series }).map((_, i) => {
            const n = i + 1
            const done = prevSets.some(l => l.numero_serie === n)
            const cur = n === training.setIndex
            return (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: done ? 'rgba(74,222,128,0.12)' : cur ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
                color: done ? '#4ade80' : cur ? '#000' : 'var(--t3)',
                border: `1px solid ${done ? 'rgba(74,222,128,0.3)' : cur ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
              }}>
                {done ? '✓' : n}
              </div>
            )
          })}
          <span style={{ fontSize: 12.5, color: 'var(--t3)', marginLeft: 4 }}>Serie {training.setIndex} de {ej.series}</span>
        </div>

        {/* Log form */}
        <div style={{ ...card, padding: '20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
            Registrar serie {training.setIndex}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            {[
              { label: 'PESO (kg)', value: weight, set: setWeight, placeholder: '0', type: 'number', step: '0.5' },
              { label: 'REPETICIONES', value: reps, set: setReps, placeholder: ej.repeticiones, type: 'number', step: '1' },
            ].map(({ label, value, set, placeholder, type, step }) => (
              <div key={label}>
                <label style={{ display: 'block', fontSize: 10.5, color: 'var(--t3)', marginBottom: 6, fontWeight: 600 }}>{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  min="0"
                  step={step}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '11px 12px', fontSize: 17, fontWeight: 700, color: 'var(--t1)',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                  className="input-accent"
                />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 600 }}>ESFUERZO (RPE)</label>
              <span style={{ fontSize: 12, fontWeight: 700, color: effort <= 4 ? '#4ade80' : effort <= 7 ? '#fbbf24' : '#f87171' }}>
                {effort}/10
              </span>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <button
                  key={n}
                  onClick={() => setEffort(n)}
                  style={{
                    flex: 1, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700,
                    background: effort >= n
                      ? (effort <= 4 ? '#4ade80' : effort <= 7 ? '#fbbf24' : '#f87171')
                      : 'rgba(255,255,255,0.04)',
                    color: effort >= n ? '#000' : 'var(--t3)',
                    transition: 'background 0.1s, color 0.1s',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 9, color: 'var(--t3)' }}>Muy fácil</span>
              <span style={{ fontSize: 9, color: 'var(--t3)' }}>Máximo</span>
            </div>
          </div>

          <button
            onClick={completeSet}
            style={{
              width: '100%', background: 'var(--primary)', color: '#000',
              fontSize: 14, fontWeight: 700, padding: '13px', borderRadius: 10,
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <CheckCircle2 style={{ width: 15, height: 15 }} /> Completar serie
          </button>
        </div>

        {/* Previous sets */}
        {prevSets.length > 0 && (
          <div style={card}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Series completadas</span>
            </div>
            {prevSets.map((l, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 16px', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)', fontSize: 12.5 }}>
                <span style={{ color: 'var(--t3)', width: 20 }}>S{l.numero_serie}</span>
                <span style={{ color: 'var(--t2)', flex: 1 }}>{l.peso_kg ? `${l.peso_kg} kg` : '—'} × {l.repeticiones ?? '—'} reps</span>
                <span style={{ color: l.esfuerzo && l.esfuerzo >= 8 ? '#f87171' : l.esfuerzo && l.esfuerzo >= 5 ? '#fbbf24' : '#4ade80' }}>
                  RPE {l.esfuerzo ?? '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  /* ─── resting ─────────────────────────────────────────────────── */
  if (phase === 'resting' && training) {
    const nextEj = training.ejercicios[training.ejercicioIndex]
    const pct = Math.round((restLeft / restTotal) * 100)
    const r = 70
    const circ = 2 * Math.PI * r

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', paddingTop: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t2)' }}>⏱ Tiempo de descanso</div>

        <div style={{ position: 'relative', width: 168, height: 168 }}>
          <svg width="168" height="168" viewBox="0 0 168 168" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="84" cy="84" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
              cx="84" cy="84" r={r} fill="none" stroke="var(--primary)" strokeWidth="8"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 44, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {formatTime(restLeft)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 5 }}>restante</div>
          </div>
        </div>

        <div style={{ ...card, padding: '14px 24px', textAlign: 'center', minWidth: 240 }}>
          <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Próximo</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>{nextEj?.nombre}</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 3 }}>
            Serie {training.setIndex} de {nextEj?.series}
          </div>
        </div>

        <button
          onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setPhase('training') }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.06)', color: 'var(--t2)',
            fontSize: 13, fontWeight: 600, padding: '10px 24px', borderRadius: 9,
            border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
          }}
        >
          Saltar descanso →
        </button>
      </div>
    )
  }

  /* ─── done ────────────────────────────────────────────────────── */
  if (phase === 'done' && done) {
    const volumen = done.logs.reduce((s, l) => s + (l.peso_kg ?? 0) * (l.repeticiones ?? 0), 0)

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', paddingTop: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(170,255,0,0.1)', border: '2px solid rgba(170,255,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 style={{ width: 34, height: 34, color: 'var(--primary)' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em', marginBottom: 5 }}>
            ¡Entrenamiento completado!
          </div>
          <div style={{ fontSize: 13, color: 'var(--t2)' }}>{done.rutinaNombre} · {done.diaLabel}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%' }}>
          {[
            { label: 'Duración', value: formatDur(done.duracionSeg), emoji: '⏱' },
            { label: 'Volumen', value: `${Math.round(volumen)} kg`, emoji: '📊' },
            { label: 'Series', value: `${done.logs.length}`, emoji: '✅' },
          ].map(({ label, value, emoji }) => (
            <div key={label} style={{ ...card, padding: '14px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)' }}>{value}</div>
              <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>

        {done.ejercicios.map(ej => {
          const sets = done.logs.filter(l => l.ejercicio_nombre === ej.nombre)
          if (!sets.length) return null
          const maxPeso = Math.max(...sets.map(s => s.peso_kg ?? 0))
          return (
            <div key={ej.id} style={{ ...card, width: '100%', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{ej.nombre}</span>
                {maxPeso > 0 && <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Max {maxPeso} kg</span>}
              </div>
              {sets.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '4px 0', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                  <span style={{ color: 'var(--t3)', width: 18 }}>S{s.numero_serie}</span>
                  <span style={{ color: 'var(--t2)', flex: 1 }}>
                    {s.peso_kg ? `${s.peso_kg} kg` : '—'} × {s.repeticiones ?? '—'} reps
                  </span>
                  <span style={{ color: s.esfuerzo && s.esfuerzo >= 8 ? '#f87171' : s.esfuerzo && s.esfuerzo >= 5 ? '#fbbf24' : '#4ade80' }}>
                    RPE {s.esfuerzo ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          )
        })}

        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <Link href="/alumno" style={{ flex: 1, textDecoration: 'none' }}>
            <button style={{ width: '100%', background: 'rgba(255,255,255,0.06)', color: 'var(--t2)', fontSize: 13, fontWeight: 600, padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              Ir al inicio
            </button>
          </Link>
          {done.sesionId ? (
            <Link href={`/alumno/historial/${done.sesionId}`} style={{ flex: 1, textDecoration: 'none' }}>
              <button style={{ width: '100%', background: 'var(--primary)', color: '#000', fontSize: 13, fontWeight: 700, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
                Ver historial
              </button>
            </Link>
          ) : (
            <button
              onClick={() => training && finalizeSesion(done.logs, training)}
              style={{ flex: 1, background: 'var(--primary)', color: '#000', fontSize: 13, fontWeight: 700, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
            >
              Reintentar guardar
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}
