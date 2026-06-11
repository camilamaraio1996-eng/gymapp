'use client'

import { useState, useMemo } from 'react'
import { Search, BookOpen } from 'lucide-react'

interface Ejercicio {
  nombre: string
  grupo: string
  nivel: 'principiante' | 'intermedio' | 'avanzado'
  equipo: string
  desc: string
  muscSec?: string
}

const EJERCICIOS: Ejercicio[] = [
  // PECHO
  { nombre: 'Press de banca plano', grupo: 'Pecho', nivel: 'intermedio', equipo: 'Barra', desc: 'Ejercicio compuesto fundamental. Espalda neutral, escápulas retraídas, barra al pecho.', muscSec: 'Tríceps, Deltoides anterior' },
  { nombre: 'Press de banca inclinado', grupo: 'Pecho', nivel: 'intermedio', equipo: 'Barra', desc: 'Banco a 30-45°. Énfasis en la parte alta del pecho.', muscSec: 'Tríceps, Deltoides anterior' },
  { nombre: 'Press con mancuernas', grupo: 'Pecho', nivel: 'principiante', equipo: 'Mancuernas', desc: 'Mayor rango de movimiento que con barra. Permite trabajar cada lado de forma independiente.' },
  { nombre: 'Aperturas con mancuernas', grupo: 'Pecho', nivel: 'principiante', equipo: 'Mancuernas', desc: 'Aislamiento del pecho. Arco controlado, codos ligeramente flexionados.', muscSec: 'Deltoides anterior' },
  { nombre: 'Fondos en paralelas', grupo: 'Pecho', nivel: 'intermedio', equipo: 'Peso corporal', desc: 'Inclinarse hacia adelante activa más el pecho. Bajar hasta 90° de flexión de codo.', muscSec: 'Tríceps' },
  { nombre: 'Crossover en cable', grupo: 'Pecho', nivel: 'intermedio', equipo: 'Cable', desc: 'Resistencia constante en todo el rango. Excelente para el contorno del pecho.' },
  { nombre: 'Pullover con mancuerna', grupo: 'Pecho', nivel: 'intermedio', equipo: 'Mancuernas', desc: 'Trabaja pecho y serrato anterior. Acostado perpendicular al banco.' },
  // ESPALDA
  { nombre: 'Dominadas', grupo: 'Espalda', nivel: 'avanzado', equipo: 'Peso corporal', desc: 'El mejor ejercicio para el dorsal. Agarre prono, tirar los codos hacia las caderas.', muscSec: 'Bíceps, Romboides' },
  { nombre: 'Jalón al pecho en polea', grupo: 'Espalda', nivel: 'principiante', equipo: 'Cable', desc: 'Alternativa a las dominadas. Tirar la barra al pecho manteniendo el torso erguido.', muscSec: 'Bíceps' },
  { nombre: 'Remo con barra', grupo: 'Espalda', nivel: 'intermedio', equipo: 'Barra', desc: 'Torso a 45°. Tirar hacia el abdomen. Excelente para grosor de espalda.', muscSec: 'Bíceps, Romboides' },
  { nombre: 'Remo con mancuerna', grupo: 'Espalda', nivel: 'principiante', equipo: 'Mancuernas', desc: 'Unilateral. Apoyo en banco, remo hacia la cadera. Permite mayor carga por lado.' },
  { nombre: 'Remo en cable sentado', grupo: 'Espalda', nivel: 'principiante', equipo: 'Cable', desc: 'Resistencia constante. Menos carga lumbar que el remo con barra.' },
  { nombre: 'Face pull', grupo: 'Espalda', nivel: 'principiante', equipo: 'Cable', desc: 'Deltoides posterior y manguito rotador. Fundamental para la salud del hombro.', muscSec: 'Deltoides posterior' },
  { nombre: 'Peso muerto convencional', grupo: 'Espalda', nivel: 'avanzado', equipo: 'Barra', desc: 'El ejercicio más completo del tren posterior. Requiere técnica perfecta y progresión cuidadosa.', muscSec: 'Glúteos, Isquiotibiales, Core' },
  { nombre: 'Peso muerto rumano', grupo: 'Espalda', nivel: 'intermedio', equipo: 'Barra', desc: 'Énfasis en isquiotibiales y glúteos. Espalda siempre neutra.', muscSec: 'Isquiotibiales, Glúteos' },
  // PIERNAS
  { nombre: 'Sentadilla con barra', grupo: 'Piernas', nivel: 'avanzado', equipo: 'Barra', desc: 'El ejercicio más completo para piernas. Activa cuádriceps, glúteos, isquiotibiales y core.', muscSec: 'Glúteos, Core' },
  { nombre: 'Prensa de piernas', grupo: 'Piernas', nivel: 'principiante', equipo: 'Máquina', desc: 'Menor exigencia técnica que la sentadilla. Permite trabajar con mayor carga de forma segura.' },
  { nombre: 'Extensión de cuádriceps', grupo: 'Piernas', nivel: 'principiante', equipo: 'Máquina', desc: 'Aislamiento del cuádriceps. Útil como trabajo de calentamiento o finalización.' },
  { nombre: 'Curl de femorales tumbado', grupo: 'Piernas', nivel: 'principiante', equipo: 'Máquina', desc: 'Aislamiento de los isquiotibiales. Bajar con control en fase excéntrica.' },
  { nombre: 'Zancada (lunges)', grupo: 'Piernas', nivel: 'principiante', equipo: 'Mancuernas', desc: 'Trabajo unilateral de cuádriceps y glúteos. Mejora el equilibrio y la simetría.', muscSec: 'Glúteos' },
  { nombre: 'Sentadilla búlgara', grupo: 'Piernas', nivel: 'intermedio', equipo: 'Mancuernas', desc: 'Pie trasero elevado. Alta activación del cuádriceps y glúteo. Requiere equilibrio.', muscSec: 'Glúteos' },
  { nombre: 'Elevación de talones de pie', grupo: 'Piernas', nivel: 'principiante', equipo: 'Máquina', desc: 'Aislamiento del gastrocnemio. Rango de movimiento completo es clave.' },
  // HOMBROS
  { nombre: 'Press militar con barra', grupo: 'Hombros', nivel: 'intermedio', equipo: 'Barra', desc: 'Empuje vertical. Activa todos los deltoides y tríceps. Pasar la barra cerca de la cara.', muscSec: 'Tríceps' },
  { nombre: 'Press de hombros con mancuernas', grupo: 'Hombros', nivel: 'principiante', equipo: 'Mancuernas', desc: 'Mayor rango de movimiento que con barra. Cada lado trabaja de forma independiente.' },
  { nombre: 'Elevaciones laterales', grupo: 'Hombros', nivel: 'principiante', equipo: 'Mancuernas', desc: 'Aislamiento del deltoides lateral. El ejercicio más importante para hombros anchos.' },
  { nombre: 'Elevaciones frontales', grupo: 'Hombros', nivel: 'principiante', equipo: 'Mancuernas', desc: 'Deltoides anterior. Alternar brazos o simultáneo con disco.' },
  { nombre: 'Pájaro con mancuernas', grupo: 'Hombros', nivel: 'principiante', equipo: 'Mancuernas', desc: 'Deltoides posterior. Torso inclinado, elevar hacia los lados.', muscSec: 'Romboides' },
  // BÍCEPS
  { nombre: 'Curl con barra', grupo: 'Bíceps', nivel: 'principiante', equipo: 'Barra', desc: 'Ejercicio clásico. Codos fijos al cuerpo, evitar balancear el torso.' },
  { nombre: 'Curl con mancuernas', grupo: 'Bíceps', nivel: 'principiante', equipo: 'Mancuernas', desc: 'Unilateral. Supinar el antebrazo en la contracción máxima.' },
  { nombre: 'Curl martillo', grupo: 'Bíceps', nivel: 'principiante', equipo: 'Mancuernas', desc: 'Agarre neutro. Activa bíceps braquial y braquiorradial. Buen ejercicio de volumen.' },
  { nombre: 'Curl en banco predicador', grupo: 'Bíceps', nivel: 'intermedio', equipo: 'Barra', desc: 'Aísla el bíceps al eliminar el balanceo del torso. Gran estiramiento en la parte baja.' },
  { nombre: 'Curl en cable', grupo: 'Bíceps', nivel: 'principiante', equipo: 'Cable', desc: 'Resistencia constante en todo el rango. Excelente como ejercicio final.' },
  // TRÍCEPS
  { nombre: 'Press francés (skull crusher)', grupo: 'Tríceps', nivel: 'intermedio', equipo: 'Barra', desc: 'Aislamiento profundo. Codos apuntando al techo, bajar la barra a la frente.' },
  { nombre: 'Extensión en polea alta', grupo: 'Tríceps', nivel: 'principiante', equipo: 'Cable', desc: 'Resistencia constante. Codos fijos, extensión completa hacia abajo.' },
  { nombre: 'Fondos en banco', grupo: 'Tríceps', nivel: 'principiante', equipo: 'Peso corporal', desc: 'Codos apuntando atrás. Bajar hasta 90° de flexión y empujar.' },
  { nombre: 'Extensión sobre cabeza', grupo: 'Tríceps', nivel: 'principiante', equipo: 'Mancuernas', desc: 'Énfasis en la cabeza larga del tríceps. Codos pegados a los lados de la cabeza.' },
  // CORE
  { nombre: 'Plancha', grupo: 'Core', nivel: 'principiante', equipo: 'Peso corporal', desc: 'Posición neutra de columna. Contraer glúteos y abdomen durante todo el ejercicio.' },
  { nombre: 'Crunch abdominal', grupo: 'Core', nivel: 'principiante', equipo: 'Peso corporal', desc: 'No tirar del cuello. Contraer el abdomen llevando el ombligo hacia la columna.' },
  { nombre: 'Russian twist', grupo: 'Core', nivel: 'principiante', equipo: 'Peso corporal', desc: 'Rotación del tronco. Trabaja oblicuos. Pies elevados para mayor dificultad.' },
  { nombre: 'Rueda abdominal', grupo: 'Core', nivel: 'avanzado', equipo: 'Peso corporal', desc: 'Ejercicio avanzado. Alta activación del recto abdominal y serrato.' },
  { nombre: 'Elevación de piernas colgado', grupo: 'Core', nivel: 'intermedio', equipo: 'Peso corporal', desc: 'Colgado de la barra, elevar piernas a 90°. Core inferior.' },
  { nombre: 'Dead bug', grupo: 'Core', nivel: 'principiante', equipo: 'Peso corporal', desc: 'Antirotación y estabilidad. Excelente para rehabilitación lumbar.' },
  // GLÚTEOS
  { nombre: 'Hip thrust', grupo: 'Glúteos', nivel: 'principiante', equipo: 'Barra', desc: 'El ejercicio rey para los glúteos. Empuje de cadera. Espalda alta apoyada en banco.', muscSec: 'Isquiotibiales' },
  { nombre: 'Sentadilla sumo', grupo: 'Glúteos', nivel: 'principiante', equipo: 'Mancuernas', desc: 'Pies separados y apuntando hacia afuera. Mayor activación de glúteos y aductores.', muscSec: 'Aductores' },
  { nombre: 'Patada de glúteo en cable', grupo: 'Glúteos', nivel: 'principiante', equipo: 'Cable', desc: 'Aislamiento del glúteo mayor. Mantener la cadera estable.' },
  { nombre: 'Abducción de cadera', grupo: 'Glúteos', nivel: 'principiante', equipo: 'Máquina', desc: 'Glúteo medio y menor. Fundamental para la salud de la cadera.', muscSec: 'Glúteo medio' },
  { nombre: 'Puente de glúteos', grupo: 'Glúteos', nivel: 'principiante', equipo: 'Peso corporal', desc: 'Variante sin barra. Ideal para principiantes o calentamiento.' },
  // CARDIO
  { nombre: 'Cinta de correr', grupo: 'Cardio', nivel: 'principiante', equipo: 'Máquina', desc: 'Cardio de baja a alta intensidad. Ajustar velocidad e inclinación según el objetivo.' },
  { nombre: 'Bicicleta estática', grupo: 'Cardio', nivel: 'principiante', equipo: 'Máquina', desc: 'Sin impacto articular. Excelente para HIIT o cardio estable.' },
  { nombre: 'Elíptica', grupo: 'Cardio', nivel: 'principiante', equipo: 'Máquina', desc: 'Cardio de cuerpo completo sin impacto. Activa trenes superior e inferior.' },
  { nombre: 'Burpees', grupo: 'Cardio', nivel: 'intermedio', equipo: 'Peso corporal', desc: 'Alta demanda cardiovascular y muscular. Sprint funcional de cuerpo completo.' },
  { nombre: 'Saltar la cuerda', grupo: 'Cardio', nivel: 'principiante', equipo: 'Peso corporal', desc: 'Cardio de alta eficiencia. Mejora coordinación, ritmo y resistencia cardiovascular.' },
  // MOVILIDAD
  { nombre: 'Apertura de cadera', grupo: 'Movilidad', nivel: 'principiante', equipo: 'Peso corporal', desc: 'Estiramiento del psoas y flexores de cadera. Fundamental para la sentadilla.' },
  { nombre: 'Rotación torácica', grupo: 'Movilidad', nivel: 'principiante', equipo: 'Peso corporal', desc: 'Movilidad de la columna torácica. Previene dolor cervical y lumbar.' },
  { nombre: 'Estiramiento isquiotibiales', grupo: 'Movilidad', nivel: 'principiante', equipo: 'Peso corporal', desc: 'Fundamental para salud lumbar. Cadena posterior.' },
  { nombre: 'Foam roller espalda', grupo: 'Movilidad', nivel: 'principiante', equipo: 'Peso corporal', desc: 'Liberación miofascial de la columna torácica. Ideal antes de entrenar.' },
]

const GRUPOS = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Bíceps', 'Tríceps', 'Core', 'Glúteos', 'Cardio', 'Movilidad']

const GRUPO_COLOR: Record<string, { color: string; bg: string }> = {
  Pecho:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  Espalda:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  Piernas:  { color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  Hombros:  { color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  Bíceps:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  Tríceps:  { color: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
  Core:     { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  Glúteos:  { color: '#2dd4bf', bg: 'rgba(45,212,191,0.1)' },
  Cardio:   { color: '#a3e635', bg: 'rgba(163,230,53,0.1)' },
  Movilidad:{ color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
}

const NIVEL_COLOR: Record<string, { color: string; bg: string }> = {
  principiante: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  intermedio:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  avanzado:     { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
}

export default function EjerciciosPage() {
  const [search, setSearch] = useState('')
  const [grupoFilter, setGrupoFilter] = useState('Todos')
  const [nivelFilter, setNivelFilter] = useState('todos')
  const [equipoFilter, setEquipoFilter] = useState('todos')

  const filtered = useMemo(() => EJERCICIOS.filter(e => {
    const matchSearch = e.nombre.toLowerCase().includes(search.toLowerCase()) ||
                        e.desc.toLowerCase().includes(search.toLowerCase())
    const matchGrupo = grupoFilter === 'Todos' || e.grupo === grupoFilter
    const matchNivel = nivelFilter === 'todos' || e.nivel === nivelFilter
    const matchEquipo = equipoFilter === 'todos' || e.equipo.toLowerCase().includes(equipoFilter.toLowerCase())
    return matchSearch && matchGrupo && matchNivel && matchEquipo
  }), [search, grupoFilter, nivelFilter, equipoFilter])

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>Biblioteca de ejercicios</h1>
        <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>{filtered.length} ejercicio{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search style={{ width: 14, height: 14, color: 'var(--t3)', position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar ejercicio..."
          style={{
            width: '100%', paddingLeft: 36, paddingRight: 14, height: 38,
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9,
            color: 'var(--t1)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
          }}
          className="input-accent"
        />
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={nivelFilter}
          onChange={e => setNivelFilter(e.target.value)}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--t2)', fontSize: 12.5, padding: '6px 10px', cursor: 'pointer',
            outline: 'none', fontFamily: 'inherit',
          }}
        >
          <option value="todos">Todos los niveles</option>
          <option value="principiante">Principiante</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>

        <select
          value={equipoFilter}
          onChange={e => setEquipoFilter(e.target.value)}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--t2)', fontSize: 12.5, padding: '6px 10px', cursor: 'pointer',
            outline: 'none', fontFamily: 'inherit',
          }}
        >
          <option value="todos">Todo el equipamiento</option>
          <option value="Barra">Barra</option>
          <option value="Mancuernas">Mancuernas</option>
          <option value="Máquina">Máquina</option>
          <option value="Cable">Cable</option>
          <option value="Peso corporal">Peso corporal</option>
        </select>
      </div>

      {/* Muscle group chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {GRUPOS.map(g => {
          const active = grupoFilter === g
          const cfg = g !== 'Todos' ? GRUPO_COLOR[g] : null
          return (
            <button key={g} onClick={() => setGrupoFilter(g)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: `1px solid ${active ? (cfg?.color ?? 'var(--primary)') : 'rgba(255,255,255,0.1)'}`,
              background: active ? (cfg?.bg ?? 'rgba(170,255,0,0.08)') : 'transparent',
              color: active ? (cfg?.color ?? 'var(--primary)') : 'var(--t2)',
              cursor: 'pointer', transition: 'all 0.12s',
            }}>
              {g}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ ...card, padding: '40px 24px', textAlign: 'center' }}>
          <BookOpen style={{ width: 28, height: 28, color: 'var(--t3)', margin: '0 auto 10px', display: 'block' }} />
          <div style={{ fontSize: 14, color: 'var(--t2)' }}>Sin resultados para los filtros seleccionados</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filtered.map(ej => {
            const gc = GRUPO_COLOR[ej.grupo] ?? { color: 'var(--primary)', bg: 'rgba(170,255,0,0.08)' }
            const nc = NIVEL_COLOR[ej.nivel]
            return (
              <div key={ej.nombre} style={{ ...card, overflow: 'hidden' }}>
                {/* Card header */}
                <div style={{ padding: '12px 16px', background: gc.bg, borderBottom: `1px solid ${gc.color}22` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: gc.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {ej.grupo}
                    </span>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: nc.bg, color: nc.color }}>
                        {ej.nivel}
                      </span>
                      <span style={{ fontSize: 9.5, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', color: 'var(--t3)' }}>
                        {ej.equipo}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 8 }}>{ej.nombre}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5 }}>{ej.desc}</div>
                  {ej.muscSec && (
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--t3)' }}>
                      <span style={{ fontWeight: 600 }}>Músc. secundarios: </span>{ej.muscSec}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
