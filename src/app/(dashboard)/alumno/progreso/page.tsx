'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Plus, Trophy, BarChart2, Loader2, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

interface Medicion {
  id: string
  fecha: string
  peso_kg: number | null
  masa_muscular_kg: number | null
  grasa_pct: number | null
  notas: string | null
}

interface Marca {
  id: string
  ejercicio_nombre: string
  peso_kg: number | null
  repeticiones: number | null
  fecha: string
  updated_at: string
}

const FORM_INIT = { fecha: new Date().toISOString().split('T')[0], peso_kg: '', masa_muscular_kg: '', grasa_pct: '', notas: '' }

export default function ProgresoPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [mediciones, setMediciones] = useState<Medicion[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [alumnoId, setAlumnoId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(FORM_INIT)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: alumno } = await supabase.from('alumnos').select('id').eq('user_id', user.id).single()
      if (!alumno) { setLoading(false); return }
      setAlumnoId(alumno.id)

      const [{ data: meds }, { data: mks }] = await Promise.all([
        supabase.from('mediciones').select('*').eq('alumno_id', alumno.id).order('fecha', { ascending: false }),
        supabase.from('marcas_personales').select('*').eq('alumno_id', alumno.id).order('updated_at', { ascending: false }),
      ])
      setMediciones(meds ?? [])
      setMarcas(mks ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function saveMedicion() {
    if (!alumnoId) return
    setSaving(true)
    const payload: any = { alumno_id: alumnoId, fecha: form.fecha }
    if (form.peso_kg)          payload.peso_kg           = parseFloat(form.peso_kg)
    if (form.masa_muscular_kg) payload.masa_muscular_kg  = parseFloat(form.masa_muscular_kg)
    if (form.grasa_pct)        payload.grasa_pct         = parseFloat(form.grasa_pct)
    if (form.notas)            payload.notas             = form.notas

    const { data, error } = await supabase.from('mediciones')
      .upsert(payload, { onConflict: 'alumno_id,fecha' })
      .select().single()

    setSaving(false)
    if (error) { toast.error('Error al guardar'); return }
    toast.success('Medición guardada')
    setMediciones(prev => {
      const filtered = prev.filter(m => m.fecha !== form.fecha)
      return [data, ...filtered].sort((a, b) => b.fecha.localeCompare(a.fecha))
    })
    setForm(FORM_INIT)
    setShowForm(false)
  }

  /* ─── sparkline ───────────────────────────────────────────────── */
  function Sparkline({ data, color }: { data: number[], color: string }) {
    if (data.length < 2) return null
    const min = Math.min(...data), max = Math.max(...data)
    const range = max - min || 1
    const w = 80, h = 28, pad = 2
    const pts = data.map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2)
      const y = h - pad - ((v - min) / range) * (h - pad * 2)
      return `${x},${y}`
    }).join(' ')
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  /* ─── bar chart (last 8 sessions) ────────────────────────────── */
  function BarChart({ data, color, label }: { data: { v: number, fecha: string }[], color: string, label: string }) {
    const sliced = [...data].reverse().slice(0, 8)
    if (!sliced.length) return <p style={{ fontSize: 12, color: 'var(--t3)' }}>Sin datos</p>
    const max = Math.max(...sliced.map(d => d.v), 1)
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
        {sliced.map((d, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
            <div
              title={`${d.v} ${label} — ${format(new Date(d.fecha + 'T12:00:00'), 'd MMM', { locale: es })}`}
              style={{
                width: '100%', borderRadius: '3px 3px 0 0',
                background: color, opacity: 0.85,
                height: `${Math.max(4, (d.v / max) * 48)}px`,
                transition: 'height 0.3s',
              }}
            />
          </div>
        ))}
      </div>
    )
  }

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }
  const ultima = mediciones[0]
  const segunda = mediciones[1]

  function delta(field: 'peso_kg' | 'masa_muscular_kg' | 'grasa_pct') {
    if (!ultima || !segunda || ultima[field] == null || segunda[field] == null) return null
    return Number(ultima[field]) - Number(segunda[field])
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <Loader2 style={{ width: 24, height: 24, color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>Mi progreso</h1>
          <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>Mediciones corporales y marcas personales.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--primary)', color: '#000', fontSize: 12.5, fontWeight: 700,
            padding: '9px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Plus style={{ width: 13, height: 13 }} /> Registrar
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ ...card, padding: '20px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', marginBottom: 16 }}>Nueva medición</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            {([
              { key: 'fecha',           label: 'Fecha',                type: 'date',   placeholder: '' },
              { key: 'peso_kg',         label: 'Peso (kg)',            type: 'number', placeholder: '75.0' },
              { key: 'masa_muscular_kg',label: 'Masa muscular (kg)',   type: 'number', placeholder: '35.0' },
              { key: 'grasa_pct',       label: 'Grasa corporal (%)',   type: 'number', placeholder: '18.0' },
            ] as const).map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 10.5, color: 'var(--t3)', fontWeight: 600, marginBottom: 5 }}>
                  {label.toUpperCase()}
                </label>
                <input
                  type={type}
                  value={(form as any)[key]}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  step={type === 'number' ? '0.1' : undefined}
                  min={type === 'number' ? '0' : undefined}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '9px 12px', fontSize: 14, color: 'var(--t1)',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                  className="input-accent"
                />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 10.5, color: 'var(--t3)', fontWeight: 600, marginBottom: 5 }}>NOTAS</label>
            <textarea
              value={form.notas}
              onChange={e => setForm(prev => ({ ...prev, notas: e.target.value }))}
              placeholder="Observaciones opcionales..."
              rows={2}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--t1)',
                outline: 'none', fontFamily: 'inherit', resize: 'none',
              }}
              className="input-accent"
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => { setShowForm(false); setForm(FORM_INIT) }}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--t2)', fontSize: 13, fontWeight: 600, padding: '10px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={saveMedicion}
              disabled={saving}
              style={{ flex: 2, background: 'var(--primary)', color: '#000', fontSize: 13, fontWeight: 700, padding: '10px', borderRadius: 9, border: 'none', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {saving ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 style={{ width: 14, height: 14 }} />}
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Latest metrics */}
      {ultima ? (
        <div style={card}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp style={{ width: 14, height: 14, color: 'var(--primary)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Última medición</span>
              <span style={{ fontSize: 11.5, color: 'var(--t3)', marginLeft: 4 }}>
                {format(new Date(ultima.fecha + 'T12:00:00'), "d 'de' MMMM", { locale: es })}
              </span>
            </div>
          </div>
          <div style={{ padding: '16px 18px', display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {([
              { label: 'Peso', value: ultima.peso_kg, unit: 'kg', color: 'var(--t1)', deltaKey: 'peso_kg' as const, goodDown: true },
              { label: 'Músculo', value: ultima.masa_muscular_kg, unit: 'kg', color: '#4ade80', deltaKey: 'masa_muscular_kg' as const, goodDown: false },
              { label: 'Grasa', value: ultima.grasa_pct, unit: '%', color: '#fb923c', deltaKey: 'grasa_pct' as const, goodDown: true },
            ]).map(({ label, value, unit, color, deltaKey, goodDown }) => {
              if (value == null) return null
              const d = delta(deltaKey)
              return (
                <div key={label}>
                  <div style={{ fontSize: 10.5, color: 'var(--t3)', marginBottom: 4 }}>{label.toUpperCase()}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: '-0.02em' }}>{Number(value)}</span>
                    <span style={{ fontSize: 12, color: 'var(--t3)' }}>{unit}</span>
                    {d != null && d !== 0 && (
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: (d < 0) === goodDown ? '#4ade80' : '#f87171',
                      }}>
                        {d > 0 ? '+' : ''}{d.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ ...card, padding: '32px 24px', textAlign: 'center' }}>
          <BarChart2 style={{ width: 36, height: 36, color: 'var(--t3)', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>Sin mediciones aún</div>
          <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16 }}>Registrá tu primera medición para empezar a ver tu progreso.</div>
          <button
            onClick={() => setShowForm(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--primary)', color: '#000', fontSize: 12.5, fontWeight: 700, padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer' }}
          >
            <Plus style={{ width: 13, height: 13 }} /> Primera medición
          </button>
        </div>
      )}

      {/* Charts */}
      {mediciones.length >= 2 && (
        <div style={card}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Evolución</span>
          </div>
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {([
              { label: 'Peso (kg)', dataKey: 'peso_kg' as const, color: '#60a5fa' },
              { label: 'Músculo (kg)', dataKey: 'masa_muscular_kg' as const, color: '#4ade80' },
              { label: 'Grasa (%)', dataKey: 'grasa_pct' as const, color: '#fb923c' },
            ]).map(({ label, dataKey, color }) => {
              const vals = mediciones.filter(m => m[dataKey] != null).map(m => Number(m[dataKey]))
              if (vals.length < 2) return null
              const formatted = mediciones
                .filter(m => m[dataKey] != null)
                .reverse()
                .map(m => ({ v: Number(m[dataKey]), fecha: m.fecha }))
              return (
                <div key={label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--t3)' }}>{label}</span>
                    <Sparkline data={vals} color={color} />
                  </div>
                  <BarChart data={formatted} color={color} label={label.split(' ')[0]} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Personal records */}
      {marcas.length > 0 && (
        <div style={card}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy style={{ width: 14, height: 14, color: '#fbbf24' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Marcas personales</span>
          </div>
          {marcas.map((m, i) => (
            <div
              key={m.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '11px 18px',
                borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trophy style={{ width: 14, height: 14, color: '#fbbf24' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.ejercicio_nombre}
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
                  {format(new Date(m.fecha + 'T12:00:00'), "d MMM yyyy", { locale: es })}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {m.peso_kg != null && (
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fbbf24' }}>
                    {m.peso_kg} <span style={{ fontSize: 11, color: 'var(--t3)' }}>kg</span>
                  </div>
                )}
                {m.repeticiones != null && (
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>× {m.repeticiones} reps</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Measurement history */}
      {mediciones.length > 1 && (
        <div style={card}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Historial de mediciones</span>
          </div>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 60px', gap: 8, padding: '8px 18px', fontSize: 9.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span>Fecha</span><span>Peso</span><span>Músculo</span><span>Grasa</span>
          </div>
          {mediciones.map((m, i) => (
            <div
              key={m.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 70px 80px 60px', gap: 8,
                padding: '9px 18px', fontSize: 12.5, alignItems: 'center',
                borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span style={{ color: 'var(--t2)', textTransform: 'capitalize' }}>
                {format(new Date(m.fecha + 'T12:00:00'), "d MMM yyyy", { locale: es })}
              </span>
              <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{m.peso_kg != null ? `${m.peso_kg} kg` : '—'}</span>
              <span style={{ color: '#4ade80', fontWeight: 500 }}>{m.masa_muscular_kg != null ? `${m.masa_muscular_kg} kg` : '—'}</span>
              <span style={{ color: '#fb923c', fontWeight: 500 }}>{m.grasa_pct != null ? `${m.grasa_pct}%` : '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
