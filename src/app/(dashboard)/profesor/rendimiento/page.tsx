'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Trophy, TrendingUp, AlertTriangle, CheckCircle,
  Users, Award, BarChart2,
  Flame, ChevronRight, Loader2, UserX, Activity,
  ArrowUp, ArrowDown, Minus, Zap,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AlumnoBase {
  id: string; nombre: string; apellido: string; objetivo: string | null; created_at: string
}
interface Sesion { alumno_id: string; iniciada_at: string }
interface Medicion {
  alumno_id: string; peso_kg: number | null; masa_muscular_kg: number | null
  grasa_pct: number | null; fecha: string
}
interface Marca {
  alumno_id: string; ejercicio_nombre: string; peso_kg: number | null
  repeticiones: number | null; fecha: string; updated_at: string
}
interface AlumnoStats {
  alumno: AlumnoBase
  sesionesMes: number; sesionesSemana: number; sesionesTotal: number
  lastSessionMs: number | undefined; lastMedicionMs: number | undefined
  latestMedicion: Medicion | null
  medicion30d: Medicion | null; medicion60d: Medicion | null; medicion90d: Medicion | null
  recentMarcas: Marca[]; totalMarcas: number
  puntos: number; riskScore: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
}

function ini(s: AlumnoStats) {
  return `${s.alumno.nombre[0]}${s.alumno.apellido[0]}`.toUpperCase()
}

function daysSince(ms: number) {
  return Math.floor((Date.now() - ms) / 86_400_000)
}

function riskMeta(score: number) {
  if (score >= 70) return { label: 'Riesgo alto',  color: '#f87171', bg: 'rgba(248,113,113,0.1)' }
  if (score >= 40) return { label: 'Riesgo medio', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' }
  return              { label: 'Riesgo bajo',  color: '#4ade80', bg: 'rgba(74,222,128,0.1)' }
}

function DeltaBadge({ value, unit = 'kg', inverse = false }: {
  value: number | null; unit?: string; inverse?: boolean
}) {
  if (value === null || Math.abs(value) < 0.05) {
    return <span style={{ color: 'var(--t3)', fontSize: 11 }}>—</span>
  }
  const good = inverse ? value < 0 : value > 0
  const color = good ? '#4ade80' : '#f87171'
  const Arrow = good ? ArrowUp : ArrowDown
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 700, color }}>
      <Arrow style={{ width: 9, height: 9 }} />
      {Math.abs(value).toFixed(1)}{unit}
    </span>
  )
}

function BarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1)
  const H = 64, BW = 18, GAP = 5
  const W = data.length * (BW + GAP) - GAP
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={W} height={H + 28} style={{ display: 'block' }}>
        {data.map((v, i) => {
          const bh = Math.max(2, (v / max) * H)
          const x = i * (BW + GAP), y = H - bh
          const recent = i >= data.length - 3
          return (
            <g key={i}>
              <rect x={x} y={y} width={BW} height={bh} rx={4}
                fill={v > 0
                  ? (recent ? 'rgba(170,255,0,0.75)' : 'rgba(170,255,0,0.3)')
                  : 'rgba(255,255,255,0.04)'} />
              {v > 0 && (
                <text x={x + BW / 2} y={y - 5} textAnchor="middle"
                  fill="var(--t3)" fontSize={9} fontFamily="inherit">{v}</text>
              )}
              <text x={x + BW / 2} y={H + 18} textAnchor="middle"
                fill="var(--t3)" fontSize={8} fontFamily="inherit">{labels[i]}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function RiskBar({ score }: { score: number }) {
  const { color } = riskMeta(score)
  return (
    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 2 }} />
    </div>
  )
}

const MEDAL_EMOJI  = ['🥇', '🥈', '🥉']
const MEDAL_COLORS = ['#fbbf24', '#94a3b8', '#d97706']

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RendimientoPage() {
  const supabase = createClient()
  const [loading, setLoading]           = useState(true)
  const [stats, setStats]               = useState<AlumnoStats[]>([])
  const [allSesiones, setAllSesiones]   = useState<Sesion[]>([])
  const [allMarcas, setAllMarcas]       = useState<Marca[]>([])
  const [progressPeriod, setProgressPeriod] = useState<30 | 60 | 90>(30)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profesores').select('id').eq('user_id', user.id).single()
      if (!prof) { setLoading(false); return }

      const { data: rawAlumnos } = await supabase
        .from('alumnos')
        .select('id, nombre, apellido, objetivo, created_at')
        .eq('profesor_id', prof.id)
        .order('nombre')

      const ids = (rawAlumnos ?? []).map(a => a.id)
      if (!ids.length) { setLoading(false); return }

      const [{ data: sesRaw }, { data: medRaw }, { data: marRaw }] = await Promise.all([
        supabase.from('sesiones')
          .select('alumno_id, iniciada_at')
          .in('alumno_id', ids)
          .not('finalizada_at', 'is', null)
          .order('iniciada_at', { ascending: false }),
        supabase.from('mediciones')
          .select('alumno_id, peso_kg, masa_muscular_kg, grasa_pct, fecha')
          .in('alumno_id', ids)
          .order('fecha', { ascending: false }),
        supabase.from('marcas_personales')
          .select('alumno_id, ejercicio_nombre, peso_kg, repeticiones, fecha, updated_at')
          .in('alumno_id', ids)
          .order('updated_at', { ascending: false }),
      ])

      const now      = Date.now()
      const ms7      = 7  * 86_400_000
      const ms30     = 30 * 86_400_000
      const ms60     = 60 * 86_400_000
      const ms90     = 90 * 86_400_000
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

      const statsArr: AlumnoStats[] = (rawAlumnos ?? []).map(alumno => {
        const ses  = (sesRaw ?? []).filter(s => s.alumno_id === alumno.id)
        const meds = (medRaw ?? []).filter(m => m.alumno_id === alumno.id)
        const mars = (marRaw ?? []).filter(m => m.alumno_id === alumno.id)

        const sesionesMes    = ses.filter(s => new Date(s.iniciada_at) >= monthStart).length
        const sesionesSemana = ses.filter(s => now - new Date(s.iniciada_at).getTime() < ms7).length
        const sesionesTotal  = ses.length
        const lastSessionMs  = ses[0]  ? new Date(ses[0].iniciada_at).getTime() : undefined
        const latestMedicion = meds[0] ?? null
        const lastMedicionMs = latestMedicion ? new Date(latestMedicion.fecha).getTime() : undefined

        function closestBefore(targetMs: number): Medicion | null {
          return meds.find(m => new Date(m.fecha).getTime() <= targetMs) ?? null
        }

        const medicion30d  = closestBefore(now - ms30)
        const medicion60d  = closestBefore(now - ms60)
        const medicion90d  = closestBefore(now - ms90)
        const recentMarcas = mars.filter(m => now - new Date(m.updated_at || m.fecha).getTime() < ms30)

        const puntos =
          (sesionesMes * 10) +
          (recentMarcas.length * 15) +
          (lastMedicionMs && now - lastMedicionMs < ms30 ? 5 : 0) +
          (sesionesMes >= 12 ? 20 : sesionesMes >= 8 ? 10 : 0)

        let riskScore = 0
        if (!lastSessionMs) {
          riskScore += 60
        } else {
          const d = (now - lastSessionMs) / 86_400_000
          if (d > 30)      riskScore += 50
          else if (d > 14) riskScore += 35
          else if (d > 7)  riskScore += 20
          else if (d > 3)  riskScore += 10
        }
        if (!lastMedicionMs || now - lastMedicionMs > ms30) riskScore += 20
        const expectedSes = (new Date().getDate() / 7) * 3
        if (sesionesMes < expectedSes * 0.3) riskScore += 15
        riskScore = Math.min(100, riskScore)

        return {
          alumno, sesionesMes, sesionesSemana, sesionesTotal,
          lastSessionMs, lastMedicionMs, latestMedicion,
          medicion30d, medicion60d, medicion90d,
          recentMarcas, totalMarcas: mars.length,
          puntos, riskScore,
        }
      })

      setStats(statsArr)
      setAllSesiones(sesRaw ?? [])
      setAllMarcas(marRaw ?? [])
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Derived ──────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const now = Date.now()
    const ms7 = 7 * 86_400_000
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    return {
      activos:       stats.filter(s => s.lastSessionMs && now - s.lastSessionMs <= ms7).length,
      riesgo:        stats.filter(s => s.riskScore >= 40).length,
      sesEstaSemana: allSesiones.filter(s => now - new Date(s.iniciada_at).getTime() < ms7).length,
      newMarcas:     allMarcas.filter(m => now - new Date(m.updated_at || m.fecha).getTime() < ms7).length,
      asistenciaMes: stats.length > 0
        ? Math.round(stats.filter(s => s.sesionesMes > 0).length / stats.length * 100) : 0,
      total: stats.length,
    }
  }, [stats, allSesiones, allMarcas])

  const topAlumnos = useMemo(() =>
    [...stats].sort((a, b) => b.puntos - a.puntos).slice(0, 5)
  , [stats])

  const spotlight = useMemo(() =>
    [...stats].sort((a, b) => b.riskScore - a.riskScore)[0] ?? null
  , [stats])

  const progressData = useMemo(() => {
    const getPast = (s: AlumnoStats) =>
      progressPeriod === 30 ? s.medicion30d : progressPeriod === 60 ? s.medicion60d : s.medicion90d
    return stats
      .map(s => {
        const past = getPast(s)
        if (!s.latestMedicion || !past) return null
        const dm = s.latestMedicion.masa_muscular_kg !== null && past.masa_muscular_kg !== null
          ? s.latestMedicion.masa_muscular_kg - past.masa_muscular_kg : null
        const dg = s.latestMedicion.grasa_pct !== null && past.grasa_pct !== null
          ? s.latestMedicion.grasa_pct - past.grasa_pct : null
        const dp = s.latestMedicion.peso_kg !== null && past.peso_kg !== null
          ? s.latestMedicion.peso_kg - past.peso_kg : null
        if (dm === null && dg === null && dp === null) return null
        return { s, dm, dg, dp, score: (dm ?? 0) * 2 - (dg ?? 0) }
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 5) as { s: AlumnoStats; dm: number | null; dg: number | null; dp: number | null }[]
  }, [stats, progressPeriod])

  const alertas = useMemo(() => {
    const now  = Date.now()
    const ms30 = 30 * 86_400_000
    const result: { alumno: AlumnoBase; tipo: string; msg: string; color: string; priority: number }[] = []
    for (const s of stats) {
      if (!s.lastSessionMs) {
        result.push({ alumno: s.alumno, tipo: 'sin_sesion', msg: 'Nunca ha entrenado', color: '#f87171', priority: 5 })
      } else {
        const d = Math.floor((now - s.lastSessionMs) / 86_400_000)
        if      (d > 30) result.push({ alumno: s.alumno, tipo: 'ausente_30', msg: `Sin entrenar hace ${d} días`, color: '#f87171', priority: 4 })
        else if (d > 14) result.push({ alumno: s.alumno, tipo: 'ausente_14', msg: `Sin entrenar hace ${d} días`, color: '#fbbf24', priority: 3 })
        else if (d > 7)  result.push({ alumno: s.alumno, tipo: 'ausente_7',  msg: `Sin entrenar hace ${d} días`, color: '#fb923c', priority: 2 })
      }
      if (s.sesionesTotal > 0 && (!s.lastMedicionMs || now - s.lastMedicionMs > ms30)) {
        result.push({ alumno: s.alumno, tipo: 'sin_medicion', msg: 'Sin medición corporal reciente', color: '#a78bfa', priority: 1 })
      }
    }
    return result.sort((a, b) => b.priority - a.priority).slice(0, 8)
  }, [stats])

  const estancados = useMemo(() => {
    const now  = Date.now()
    const ms30 = 30 * 86_400_000
    return stats.filter(s =>
      s.sesionesTotal > 3 &&
      (!s.lastMedicionMs || now - s.lastMedicionMs > ms30) &&
      s.recentMarcas.length === 0
    )
  }, [stats])

  const riesgoList = useMemo(() =>
    [...stats].filter(s => s.riskScore > 0).sort((a, b) => b.riskScore - a.riskScore).slice(0, 6)
  , [stats])

  const barData = useMemo(() => {
    const DAYS = 14
    const data = Array(DAYS).fill(0) as number[]
    const labels: string[] = []
    const now = Date.now()
    for (let i = DAYS - 1; i >= 0; i--) {
      labels.push(format(new Date(now - i * 86_400_000), 'dd/MM', { locale: es }))
    }
    for (const s of allSesiones) {
      const dAgo = Math.floor((now - new Date(s.iniciada_at).getTime()) / 86_400_000)
      if (dAgo >= 0 && dAgo < DAYS) data[DAYS - 1 - dAgo]++
    }
    return { data, labels }
  }, [allSesiones])

  const resumen = useMemo(() => {
    const now = Date.now()
    const ms7 = 7 * 86_400_000
    return {
      sesSemana:      allSesiones.filter(s => now - new Date(s.iniciada_at).getTime() < ms7).length,
      alumnosActivos: stats.filter(s => s.lastSessionMs && now - s.lastSessionMs < ms7).length,
      nuevosRecords:  allMarcas.filter(m => now - new Date(m.updated_at || m.fecha).getTime() < ms7).length,
      riesgoCount:    stats.filter(s => s.riskScore >= 40).length,
    }
  }, [stats, allSesiones, allMarcas])

  // ─── Loading / Empty ──────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <Loader2 style={{ width: 24, height: 24, color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (!stats.length) return (
    <div style={{ ...card, padding: '60px 24px', textAlign: 'center', marginTop: 20 }}>
      <Users style={{ width: 40, height: 40, color: 'var(--t3)', margin: '0 auto 12px', display: 'block' }} />
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', marginBottom: 8 }}>Sin alumnos asignados</div>
      <div style={{ fontSize: 13, color: 'var(--t2)' }}>El administrador te asignará alumnos para comenzar el análisis.</div>
    </div>
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  const slRm = spotlight ? riskMeta(spotlight.riskScore) : null

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(170,255,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Activity style={{ width: 16, height: 16, color: 'var(--primary)' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
            Centro de Rendimiento
          </h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--t2)', marginLeft: 42 }}>
          Analítica avanzada · {stats.length} alumno{stats.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Spotlight ──────────────────────────────────────────────────────── */}
      {spotlight && spotlight.riskScore >= 40 && slRm && (
        <div style={{
          ...card,
          padding: '16px 20px',
          border: '1px solid rgba(251,191,36,0.25)',
          background: 'linear-gradient(135deg, rgba(251,191,36,0.05) 0%, var(--surface) 55%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Atención requerida hoy
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fbbf24', flexShrink: 0 }}>
              {ini(spotlight)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 7 }}>
                {spotlight.alumno.nombre} {spotlight.alumno.apellido}
                {spotlight.alumno.objetivo && (
                  <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 400, marginLeft: 8 }}>
                    {spotlight.alumno.objetivo}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {!spotlight.lastSessionMs
                  ? <span style={{ fontSize: 11.5, color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '3px 10px', borderRadius: 20 }}>Nunca ha entrenado</span>
                  : <span style={{ fontSize: 11.5, color: 'var(--t2)', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: 20 }}>Sin entrenar hace {daysSince(spotlight.lastSessionMs)}d</span>
                }
                {!spotlight.lastMedicionMs
                  ? <span style={{ fontSize: 11.5, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', padding: '3px 10px', borderRadius: 20 }}>Sin mediciones</span>
                  : <span style={{ fontSize: 11.5, color: 'var(--t2)', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: 20 }}>Sin medición hace {daysSince(spotlight.lastMedicionMs)}d</span>
                }
                <span style={{ fontSize: 11.5, fontWeight: 700, color: slRm.color, background: slRm.bg, padding: '3px 10px', borderRadius: 20 }}>
                  {slRm.label}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7, flexShrink: 0, alignSelf: 'center' }}>
              <Link href={`/profesor/alumnos/${spotlight.alumno.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', color: 'var(--t1)', fontSize: 12, fontWeight: 600, padding: '7px 13px', borderRadius: 8, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
                Ver perfil
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Grid ───────────────────────────────────────────────────────── */}
      <div className="stat-grid-3">
        {([
          { label: 'Alumnos activos',   value: kpis.activos,        sub: 'entrenaron esta semana',   Icon: CheckCircle,  color: '#4ade80',        bg: 'rgba(74,222,128,0.1)' },
          { label: 'Entrenam. semana',  value: kpis.sesEstaSemana,  sub: 'sesiones completadas',      Icon: Flame,        color: 'var(--primary)', bg: 'rgba(170,255,0,0.08)' },
          { label: 'Asistencia mes',    value: `${kpis.asistenciaMes}%`, sub: 'con sesiones este mes',Icon: TrendingUp,   color: '#60a5fa',        bg: 'rgba(96,165,250,0.1)' },
          { label: 'En riesgo',         value: kpis.riesgo,         sub: 'necesitan atención',        Icon: AlertTriangle,color: '#fbbf24',        bg: 'rgba(251,191,36,0.1)' },
          { label: 'Récords semana',    value: kpis.newMarcas,      sub: 'marcas personales batidas', Icon: Trophy,       color: '#f59e0b',        bg: 'rgba(245,158,11,0.1)' },
          { label: 'Total alumnos',     value: kpis.total,          sub: 'asignados a ti',            Icon: Users,        color: '#a78bfa',        bg: 'rgba(167,139,250,0.1)' },
        ] as const).map(({ label, value, sub, Icon, color, bg }) => (
          <div key={label} style={{ ...card, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 13, height: 13, color } as React.CSSProperties} />
              </div>
            </div>
            <div className="num" style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Resumen Semanal ────────────────────────────────────────────────── */}
      <div style={{ ...card, padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Zap style={{ width: 13, height: 13, color: 'var(--primary)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t1)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Resumen esta semana
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {([
            { v: resumen.sesSemana,      l: 'entrenamientos',  c: 'var(--primary)' },
            { v: resumen.alumnosActivos, l: 'alumnos activos', c: '#60a5fa' },
            { v: resumen.nuevosRecords,  l: 'récords batidos', c: '#fbbf24' },
            { v: resumen.riesgoCount,    l: 'en riesgo',       c: '#f87171' },
          ] as const).map(({ v, l, c }) => (
            <div key={l} style={{ display: 'flex', alignItems: 'baseline', gap: 6, padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="num" style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</span>
              <span style={{ fontSize: 12, color: 'var(--t2)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top Alumnos | Alertas ──────────────────────────────────────────── */}
      <div className="grid-2">

        {/* Top Alumnos */}
        <div style={card}>
          <div style={{ padding: '13px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy style={{ width: 14, height: 14, color: '#fbbf24' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Top alumnos del mes</span>
            <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--t3)', fontStyle: 'italic' }}>por puntos</span>
          </div>
          {!topAlumnos.length ? (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 12.5, color: 'var(--t2)' }}>Sin datos este mes</div>
            </div>
          ) : topAlumnos.map((s, i) => (
            <Link key={s.alumno.id} href={`/profesor/alumnos/${s.alumno.id}`} className="row-hover" style={{
              display: 'flex', alignItems: 'center', gap: 11, padding: '10px 18px',
              textDecoration: 'none', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ width: 22, textAlign: 'center', flexShrink: 0, fontSize: i < 3 ? 16 : 12, fontWeight: 700, color: 'var(--t3)' }}>
                {i < 3 ? MEDAL_EMOJI[i] : i + 1}
              </div>
              <div style={{ width: 33, height: 33, borderRadius: '50%', flexShrink: 0, background: `rgba(${i === 0 ? '251,191,36' : i === 1 ? '148,163,184' : i === 2 ? '217,119,6' : '96,165,250'},0.1)`, border: `1px solid rgba(${i === 0 ? '251,191,36' : i === 1 ? '148,163,184' : i === 2 ? '217,119,6' : '96,165,250'},0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: i < 3 ? MEDAL_COLORS[i] : '#60a5fa' }}>
                {ini(s)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.alumno.nombre} {s.alumno.apellido}
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                  {s.sesionesMes} sesiones · {s.totalMarcas} récords
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="num" style={{ fontSize: 16, fontWeight: 700, color: i < 3 ? MEDAL_COLORS[i] : 'var(--t1)' }}>
                  {s.puntos}
                </div>
                <div style={{ fontSize: 9.5, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>pts</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Alertas */}
        <div style={card}>
          <div style={{ padding: '13px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle style={{ width: 14, height: 14, color: '#fbbf24' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Alertas inteligentes</span>
            {alertas.length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, background: 'rgba(248,113,113,0.12)', color: '#f87171', padding: '2px 8px', borderRadius: 20 }}>
                {alertas.length}
              </span>
            )}
          </div>
          {!alertas.length ? (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <CheckCircle style={{ width: 22, height: 22, color: '#4ade80', margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontSize: 13, color: 'var(--t2)' }}>Sin alertas activas</div>
            </div>
          ) : alertas.map((a, i) => (
            <Link key={`${a.alumno.id}-${a.tipo}`} href={`/profesor/alumnos/${a.alumno.id}`} className="row-hover" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px',
              textDecoration: 'none', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.alumno.nombre} {a.alumno.apellido}
                </div>
                <div style={{ fontSize: 11, color: a.color }}>{a.msg}</div>
              </div>
              <ChevronRight style={{ width: 12, height: 12, color: 'var(--t3)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Mayor Progreso | Riesgo Abandono ──────────────────────────────── */}
      <div className="grid-2">

        {/* Mayor Progreso */}
        <div style={card}>
          <div style={{ padding: '13px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp style={{ width: 14, height: 14, color: '#4ade80' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Mayor progreso</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {([30, 60, 90] as const).map(p => (
                  <button key={p} onClick={() => setProgressPeriod(p)} style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: progressPeriod === p ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
                    color: progressPeriod === p ? '#000' : 'var(--t2)',
                    border: `1px solid ${progressPeriod === p ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}`,
                    transition: 'all 0.12s',
                  }}>
                    {p}d
                  </button>
                ))}
              </div>
            </div>
          </div>
          {!progressData.length ? (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <Minus style={{ width: 20, height: 20, color: 'var(--t3)', margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontSize: 12.5, color: 'var(--t2)' }}>Sin mediciones para este período</div>
            </div>
          ) : progressData.map((p, i) => (
            <div key={p.s.alumno.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 18px', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, color: '#4ade80' }}>
                {ini(p.s)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.s.alumno.nombre} {p.s.alumno.apellido}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                  {p.dm !== null && Math.abs(p.dm) >= 0.05 && (
                    <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>Músculo: <DeltaBadge value={p.dm} /></span>
                  )}
                  {p.dg !== null && Math.abs(p.dg) >= 0.05 && (
                    <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>Grasa: <DeltaBadge value={p.dg} unit="%" inverse /></span>
                  )}
                  {p.dp !== null && Math.abs(p.dp) >= 0.1 && (
                    <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>Peso: <DeltaBadge value={p.dp} /></span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Riesgo Abandono */}
        <div style={card}>
          <div style={{ padding: '13px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserX style={{ width: 14, height: 14, color: '#f87171' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Riesgo de abandono</span>
          </div>
          {!riesgoList.length ? (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <CheckCircle style={{ width: 22, height: 22, color: '#4ade80', margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontSize: 13, color: 'var(--t2)' }}>Todos los alumnos están activos</div>
            </div>
          ) : riesgoList.map((s, i) => {
            const rm = riskMeta(s.riskScore)
            return (
              <Link key={s.alumno.id} href={`/profesor/alumnos/${s.alumno.id}`} className="row-hover" style={{
                display: 'flex', flexDirection: 'column', gap: 7, padding: '10px 18px',
                textDecoration: 'none', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: rm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: rm.color }}>
                    {ini(s)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.alumno.nombre} {s.alumno.apellido}
                    </div>
                    {s.lastSessionMs && (
                      <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>Hace {daysSince(s.lastSessionMs)}d sin entrenar</div>
                    )}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: rm.color, padding: '2px 8px', borderRadius: 6, background: rm.bg, flexShrink: 0 }}>
                    {rm.label}
                  </span>
                </div>
                <RiskBar score={s.riskScore} />
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Bar Chart ──────────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ padding: '13px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 style={{ width: 14, height: 14, color: 'var(--primary)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>
            Sesiones diarias — últimas 2 semanas
          </span>
        </div>
        <div style={{ padding: '16px 18px 12px' }}>
          <BarChart data={barData.data} labels={barData.labels} />
        </div>
      </div>

      {/* ── Estancados | Récords Recientes ────────────────────────────────── */}
      <div className="grid-2">

        {/* Estancados */}
        <div style={card}>
          <div style={{ padding: '13px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Minus style={{ width: 14, height: 14, color: '#a78bfa' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Alumnos estancados</span>
            {estancados.length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, background: 'rgba(167,139,250,0.12)', color: '#a78bfa', padding: '2px 8px', borderRadius: 20 }}>
                {estancados.length}
              </span>
            )}
          </div>
          {!estancados.length ? (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <CheckCircle style={{ width: 20, height: 20, color: '#4ade80', margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontSize: 12.5, color: 'var(--t2)' }}>Ningún alumno estancado</div>
            </div>
          ) : estancados.map((s, i) => (
            <Link key={s.alumno.id} href={`/profesor/alumnos/${s.alumno.id}`} className="row-hover" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
              textDecoration: 'none', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, color: '#a78bfa', flexShrink: 0 }}>
                {ini(s)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.alumno.nombre} {s.alumno.apellido}
                </div>
                <div style={{ fontSize: 11, color: '#a78bfa' }}>Requiere revisión · sin progreso +30d</div>
              </div>
              <ChevronRight style={{ width: 12, height: 12, color: 'var(--t3)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>

        {/* Récords Recientes */}
        <div style={card}>
          <div style={{ padding: '13px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award style={{ width: 14, height: 14, color: '#f59e0b' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Récords personales recientes</span>
          </div>
          {!allMarcas.length ? (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 12.5, color: 'var(--t2)' }}>Sin récords registrados</div>
            </div>
          ) : allMarcas.slice(0, 7).map((m, i) => {
            const alumnoStat = stats.find(s => s.alumno.id === m.alumno_id)
            if (!alumnoStat) return null
            return (
              <Link key={i} href={`/profesor/alumnos/${m.alumno_id}`} className="row-hover" style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
                textDecoration: 'none', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Award style={{ width: 12, height: 12, color: '#f59e0b' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {alumnoStat.alumno.nombre} {alumnoStat.alumno.apellido}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                    {m.ejercicio_nombre} ·{' '}
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                      {m.peso_kg ? `${m.peso_kg} kg` : m.repeticiones ? `${m.repeticiones} reps` : '—'}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>
                  {format(new Date(m.fecha), 'd MMM', { locale: es })}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

    </div>
  )
}
