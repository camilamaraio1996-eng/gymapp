import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Zap, Target, Flame, TrendingUp, Clock, Dumbbell,
  ChevronRight, Calendar, BarChart2, Trophy,
} from 'lucide-react'

/* ─── helpers ─────────────────────────────────────────────────── */
function calcularRacha(fechas: string[]): number {
  if (!fechas.length) return 0
  const ms = 86_400_000
  const toDay = (s: string) => { const d = new Date(s); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() }
  const dias = [...new Set(fechas.map(toDay))].sort((a, b) => b - a)
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  if (dias[0] < hoy.getTime() - ms) return 0
  let racha = 0, prev = dias[0]
  for (const dia of dias) {
    if (racha === 0 || prev - dia <= ms) { racha++; prev = dia }
    else break
  }
  return racha
}

function proximaMedalla(racha: number) {
  for (const n of [5, 10, 15, 21, 30, 50, 75, 100, 150, 200]) {
    if (racha < n) return n
  }
  return 200
}

function formatDuracion(seg: number) {
  const h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

/* ─── page ────────────────────────────────────────────────────── */
export default async function AlumnoHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: alumno }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user!.id).single(),
    supabase.from('alumnos')
      .select('*, profesor:profesores(nombre, apellido, especialidad)')
      .eq('user_id', user!.id).single(),
  ])

  const alumnoId = alumno?.id ?? ''

  const [
    { data: asignaciones },
    { data: fechasSesiones },
    { data: ultimasSesiones },
    { data: ultimaMedicion },
    { count: totalSesiones },
  ] = await Promise.all([
    supabase.from('asignaciones')
      .select('*, rutina:rutinas(id,nombre,objetivo,dias_por_semana)')
      .eq('alumno_id', alumnoId).eq('activa', true).limit(3),
    supabase.from('sesiones')
      .select('iniciada_at').eq('alumno_id', alumnoId)
      .not('finalizada_at', 'is', null).order('iniciada_at', { ascending: false }),
    supabase.from('sesiones').select('*').eq('alumno_id', alumnoId)
      .not('finalizada_at', 'is', null)
      .order('iniciada_at', { ascending: false }).limit(4),
    supabase.from('mediciones').select('*').eq('alumno_id', alumnoId)
      .order('fecha', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('sesiones').select('*', { count: 'exact', head: true })
      .eq('alumno_id', alumnoId).not('finalizada_at', 'is', null),
  ])

  const allFechas = (fechasSesiones ?? []).map(s => s.iniciada_at)
  const racha = calcularRacha(allFechas)
  const target = proximaMedalla(racha)
  const total = totalSesiones ?? 0

  // sessions this week
  const weekMs = Date.now() - 7 * 86_400_000
  const estaSemana = (fechasSesiones ?? []).filter(s => new Date(s.iniciada_at).getTime() > weekMs).length

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const nombre = profile?.nombre ?? user?.user_metadata?.nombre ?? 'Atleta'
  const today = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })

  type Prof = { nombre: string; apellido: string; especialidad?: string }
  const prof = alumno?.profesor as Prof | undefined
  const primeraRutina = (asignaciones?.[0]?.rutina as any)

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {saludo}, {nombre}
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--t2)', marginTop: 4, textTransform: 'capitalize' }}>{today}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {alumno?.objetivo && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: 'var(--primary)', background: 'rgba(170,255,0,0.08)', border: '1px solid rgba(170,255,0,0.2)', borderRadius: 999, padding: '3px 10px' }}>
              <Target style={{ width: 11, height: 11 }} /> {alumno.objetivo}
            </span>
          )}
          {prof && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: 'var(--t2)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 999, padding: '3px 10px' }}>
              Prof. {prof.nombre} {prof.apellido}
            </span>
          )}
        </div>
      </div>

      {/* ── CTA banner ── */}
      {primeraRutina ? (
        <Link href="/alumno/entrenar" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'var(--primary)', borderRadius: 14, padding: '22px 24px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Listo para entrenar
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#000', marginBottom: 14, letterSpacing: '-0.01em' }}>
                {primeraRutina.nombre}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.12)', color: '#000', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 8 }}>
                <Zap style={{ width: 13, height: 13 }} /> Empezar ahora
              </div>
            </div>
            <Zap style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', width: 80, height: 80, color: '#000', opacity: 0.07 }} />
          </div>
        </Link>
      ) : (
        <div style={{ ...card, padding: '20px 24px', textAlign: 'center' }}>
          <Dumbbell style={{ width: 32, height: 32, color: 'var(--t3)', margin: '0 auto 10px', display: 'block' }} />
          <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)', marginBottom: 5 }}>Aún no tenés rutina asignada</div>
          <div style={{ fontSize: 13, color: 'var(--t2)' }}>Tu profesor te asignará una rutina pronto.</div>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="stat-grid-3">
        {([
          { label: 'Racha', value: racha, unit: racha === 1 ? 'día' : 'días', Icon: Flame, color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
          { label: 'Esta semana', value: estaSemana, unit: estaSemana === 1 ? 'sesión' : 'sesiones', Icon: Calendar, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
          { label: 'Total', value: total, unit: total === 1 ? 'entrenamiento' : 'entrenamientos', Icon: BarChart2, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
        ] as const).map(({ label, value, unit, Icon, color, bg }) => (
          <div key={label} style={{ ...card, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 13, height: 13, color } as React.CSSProperties} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 5 }}>{unit}</div>
          </div>
        ))}
      </div>

      {/* ── Racha card ── */}
      {racha > 0 ? (
        <div style={{ ...card, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(251,146,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame style={{ width: 16, height: 16, color: '#fb923c' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t1)' }}>🔥 Racha de {racha} {racha === 1 ? 'día' : 'días'}</div>
              <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 1 }}>Próxima medalla: {target} entrenamientos</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#fb923c' }}>{racha}/{target}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 999, height: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (racha / target) * 100)}%`, background: 'linear-gradient(90deg,#fb923c,#fbbf24)', borderRadius: 999 }} />
          </div>
        </div>
      ) : total === 0 ? (
        <div style={{ ...card, padding: '24px 20px', textAlign: 'center' }}>
          <Trophy style={{ width: 36, height: 36, color: 'var(--t3)', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>¡Empezá tu primera racha!</div>
          <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 16 }}>
            Cada entrenamiento suma. Los campeones<br />no faltan, nunca.
          </div>
          {primeraRutina && (
            <Link href="/alumno/entrenar" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--primary)', color: '#000', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 9, textDecoration: 'none' }}>
              <Zap style={{ width: 14, height: 14 }} /> Entrenar ahora
            </Link>
          )}
        </div>
      ) : null}

      {/* ── Latest measurement ── */}
      {ultimaMedicion && (
        <div style={{ ...card, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp style={{ width: 14, height: 14, color: '#60a5fa' }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Última medición</span>
            </div>
            <Link href="/alumno/progreso" className="link-hover" style={{ fontSize: 12, color: 'var(--t3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              Ver progreso <ChevronRight style={{ width: 11, height: 11 }} />
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {ultimaMedicion.peso_kg != null && (
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--t3)', marginBottom: 2 }}>PESO</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)' }}>{ultimaMedicion.peso_kg}<span style={{ fontSize: 12, color: 'var(--t3)', marginLeft: 2 }}>kg</span></div>
              </div>
            )}
            {ultimaMedicion.masa_muscular_kg != null && (
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--t3)', marginBottom: 2 }}>MASA MUSCULAR</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#4ade80' }}>{ultimaMedicion.masa_muscular_kg}<span style={{ fontSize: 12, color: 'var(--t3)', marginLeft: 2 }}>kg</span></div>
              </div>
            )}
            {ultimaMedicion.grasa_pct != null && (
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--t3)', marginBottom: 2 }}>GRASA</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fb923c' }}>{ultimaMedicion.grasa_pct}<span style={{ fontSize: 12, color: 'var(--t3)', marginLeft: 2 }}>%</span></div>
              </div>
            )}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 10 }}>
            {format(new Date(ultimaMedicion.fecha + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: es })}
          </div>
        </div>
      )}

      {/* ── Recent sessions ── */}
      {!!ultimasSesiones?.length && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(170,255,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock style={{ width: 14, height: 14, color: 'var(--primary)' }} />
              </div>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)' }}>Últimas sesiones</span>
            </div>
            <Link href="/alumno/historial" className="link-hover" style={{ fontSize: 12.5, color: 'var(--t3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              Ver todo <ChevronRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          {ultimasSesiones.map((s, i) => (
            <Link key={s.id} href={`/alumno/historial/${s.id}`} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', textDecoration: 'none', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(170,255,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Dumbbell style={{ width: 15, height: 15, color: 'var(--primary)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.rutina_nombre ?? 'Entrenamiento'}{s.dia_label ? ` · ${s.dia_label}` : ''}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>
                  {format(new Date(s.iniciada_at), "dd MMM yyyy", { locale: es })}
                  {s.duracion_segundos ? ` · ${formatDuracion(s.duracion_segundos)}` : ''}
                  {s.volumen_total_kg ? ` · ${Number(s.volumen_total_kg).toLocaleString('es-AR')} kg` : ''}
                </div>
              </div>
              <ChevronRight style={{ width: 13, height: 13, color: 'var(--t3)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      )}

      {/* ── Quick links ── */}
      <div>
        {([
          { label: 'Mi progreso', sub: 'Mediciones y marcas', href: '/alumno/progreso', Icon: TrendingUp, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
        ] as const).map(({ label, sub, href, Icon, color, bg }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div className="card-hover" style={{ ...card, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 15, height: 15, color } as React.CSSProperties} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--t1)' }}>{label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 1 }}>{sub}</div>
              </div>
              <ChevronRight style={{ width: 13, height: 13, color: 'var(--t3)', flexShrink: 0 }} />
            </div>
          </Link>
        ))}
      </div>

    </div>
  )
}
