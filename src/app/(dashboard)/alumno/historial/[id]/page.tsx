import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, Clock, Dumbbell, BarChart2, CheckCircle2 } from 'lucide-react'

function formatDur(secs: number) {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default async function SesionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: alumno } = await supabase
    .from('alumnos').select('id').eq('user_id', user!.id).single()
  if (!alumno) return notFound()

  const { data: sesion } = await supabase
    .from('sesiones')
    .select('*')
    .eq('id', id)
    .eq('alumno_id', alumno.id)
    .single()
  if (!sesion) return notFound()

  const { data: series } = await supabase
    .from('series_log')
    .select('*')
    .eq('sesion_id', id)
    .order('ejercicio_nombre').order('numero_serie')

  const allSeries = series ?? []

  // Group series by exercise
  const byEj: Record<string, typeof allSeries> = {}
  for (const s of allSeries) {
    if (!byEj[s.ejercicio_nombre]) byEj[s.ejercicio_nombre] = []
    byEj[s.ejercicio_nombre].push(s)
  }

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
  }

  const volumen = Number(sesion.volumen_total_kg ?? 0)

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Back */}
      <Link href="/alumno/historial" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--t3)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
        <ChevronLeft style={{ width: 15, height: 15 }} /> Historial
      </Link>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
          {sesion.rutina_nombre ?? 'Entrenamiento'}
          {sesion.dia_label ? ` · ${sesion.dia_label}` : ''}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 5, textTransform: 'capitalize' }}>
          {format(new Date(sesion.iniciada_at), "EEEE d 'de' MMMM, yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {[
          { label: 'Duración', value: sesion.duracion_segundos ? formatDur(sesion.duracion_segundos) : '—', Icon: Clock, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
          { label: 'Volumen', value: volumen > 0 ? `${volumen.toLocaleString('es-AR')} kg` : '—', Icon: BarChart2, color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
          { label: 'Ejercicios', value: `${sesion.ejercicios_completados ?? 0}`, Icon: Dumbbell, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
          { label: 'Series', value: `${sesion.series_completadas ?? 0}`, Icon: CheckCircle2, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} style={{ ...card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon style={{ width: 16, height: 16, color } as React.CSSProperties} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)' }}>{value}</div>
              <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Exercise breakdown */}
      {Object.keys(byEj).length === 0 ? (
        <div style={{ ...card, padding: '32px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--t2)', fontSize: 13 }}>No se registraron series en esta sesión.</p>
        </div>
      ) : (
        Object.entries(byEj).map(([ejNombre, sets]) => {
          const maxPeso = Math.max(...sets.map(s => Number(s.peso_kg ?? 0)))
          const totalVol = sets.reduce((sum, s) => sum + Number(s.peso_kg ?? 0) * Number(s.repeticiones ?? 0), 0)

          return (
            <div key={ejNombre} style={card}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(170,255,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Dumbbell style={{ width: 14, height: 14, color: 'var(--primary)' }} />
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t1)' }}>{ejNombre}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {maxPeso > 0 && <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Max {maxPeso} kg</div>}
                  {totalVol > 0 && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{Math.round(totalVol)} kg vol</div>}
                </div>
              </div>

              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 1fr', gap: 8, padding: '8px 18px', fontSize: 9.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span>#</span><span>Peso</span><span>Reps</span><span>RPE</span>
              </div>

              {sets.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '28px 1fr 1fr 1fr', gap: 8,
                    padding: '9px 18px', fontSize: 13, alignItems: 'center',
                    borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span style={{ color: 'var(--t3)', fontWeight: 600 }}>{s.numero_serie}</span>
                  <span style={{ color: 'var(--t1)', fontWeight: 600 }}>
                    {s.peso_kg ? `${s.peso_kg} kg` : <span style={{ color: 'var(--t3)' }}>—</span>}
                  </span>
                  <span style={{ color: 'var(--t2)' }}>
                    {s.repeticiones ?? <span style={{ color: 'var(--t3)' }}>—</span>}
                  </span>
                  <span style={{
                    color: s.esfuerzo >= 8 ? '#f87171' : s.esfuerzo >= 5 ? '#fbbf24' : s.esfuerzo ? '#4ade80' : 'var(--t3)',
                    fontWeight: s.esfuerzo ? 600 : 400,
                  }}>
                    {s.esfuerzo ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          )
        })
      )}

      {sesion.notas && (
        <div style={{ ...card, padding: '16px 18px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Notas</div>
          <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>{sesion.notas}</p>
        </div>
      )}

      <Link href="/alumno/historial" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--t3)', textDecoration: 'none', fontSize: 13, alignSelf: 'flex-start' }}>
        <ChevronLeft style={{ width: 13, height: 13 }} /> Volver al historial
      </Link>
    </div>
  )
}
