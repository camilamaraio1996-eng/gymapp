'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2, MessageSquare, User, Users, ChevronLeft } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

interface Alumno {
  id: string; nombre: string; apellido: string; user_id: string
}
interface Mensaje {
  id: string; de_user_id: string; para_user_id: string
  contenido: string; leido: boolean; created_at: string
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  if (isToday(d))     return format(d, 'HH:mm')
  if (isYesterday(d)) return `Ayer ${format(d, 'HH:mm')}`
  return format(d, "d MMM, HH:mm", { locale: es })
}

export default function MensajesProfesorPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [selected, setSelected] = useState<Alumno | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [loadingChat, setLoadingChat] = useState(false)
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState<Record<string, number>>({})
  const [showList, setShowList] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setMyUserId(user.id)

      const { data: prof } = await supabase.from('profesores').select('id').eq('user_id', user.id).single()
      if (!prof) { setLoading(false); return }

      const { data: rawAlumnos } = await supabase
        .from('alumnos')
        .select('id, nombre, apellido, user_id')
        .eq('profesor_id', prof.id)
        .order('nombre')

      setAlumnos(rawAlumnos ?? [])

      // Unread counts per alumno user_id
      if ((rawAlumnos ?? []).length > 0) {
        const { data: unreadMsgs } = await supabase
          .from('mensajes')
          .select('de_user_id')
          .eq('para_user_id', user.id)
          .eq('leido', false)

        const counts: Record<string, number> = {}
        for (const m of unreadMsgs ?? []) {
          counts[m.de_user_id] = (counts[m.de_user_id] ?? 0) + 1
        }
        setUnread(counts)
      }

      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMessages(uid: string, alumnoUserId: string) {
    setLoadingChat(true)
    const { data } = await supabase
      .from('mensajes')
      .select('*')
      .or(`and(de_user_id.eq.${uid},para_user_id.eq.${alumnoUserId}),and(de_user_id.eq.${alumnoUserId},para_user_id.eq.${uid})`)
      .order('created_at', { ascending: true })
    setMensajes(data ?? [])
    setLoadingChat(false)

    // Mark as read
    await supabase.from('mensajes')
      .update({ leido: true })
      .eq('de_user_id', alumnoUserId)
      .eq('para_user_id', uid)
      .eq('leido', false)

    setUnread(prev => ({ ...prev, [alumnoUserId]: 0 }))
  }

  function selectAlumno(a: Alumno) {
    setSelected(a)
    setShowList(false)
    if (myUserId) loadMessages(myUserId, a.user_id)
  }

  // Polling
  useEffect(() => {
    if (!myUserId || !selected) return
    const interval = setInterval(() => loadMessages(myUserId, selected.user_id), 5000)
    return () => clearInterval(interval)
  }, [myUserId, selected]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  // Realtime
  useEffect(() => {
    if (!myUserId) return
    const channel = supabase.channel('mensajes-profesor')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'mensajes',
        filter: `para_user_id=eq.${myUserId}`,
      }, payload => {
        const msg = payload.new as Mensaje
        if (selected && msg.de_user_id === selected.user_id) {
          setMensajes(prev => [...prev, msg])
          supabase.from('mensajes').update({ leido: true }).eq('id', msg.id)
        } else {
          setUnread(prev => ({ ...prev, [msg.de_user_id]: (prev[msg.de_user_id] ?? 0) + 1 }))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [myUserId, selected]) // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMessage() {
    const txt = texto.trim()
    if (!txt || !myUserId || !selected) return
    setSending(true)

    const optimistic: Mensaje = {
      id: `opt-${Date.now()}`, de_user_id: myUserId, para_user_id: selected.user_id,
      contenido: txt, leido: false, created_at: new Date().toISOString(),
    }
    setMensajes(prev => [...prev, optimistic])
    setTexto('')

    const { data, error } = await supabase.from('mensajes').insert({
      de_user_id: myUserId, para_user_id: selected.user_id, contenido: txt,
    }).select().single()

    setSending(false)
    if (error) {
      toast.error('Error al enviar')
      setMensajes(prev => prev.filter(m => m.id !== optimistic.id))
      setTexto(txt)
    } else {
      setMensajes(prev => prev.map(m => m.id === optimistic.id ? data : m))
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // Day groups for chat
  type DayGroup = { label: string; msgs: Mensaje[] }
  const dayGroups: DayGroup[] = []
  for (const m of mensajes) {
    const d = new Date(m.created_at)
    const label = isToday(d) ? 'Hoy' : isYesterday(d) ? 'Ayer' : format(d, "d 'de' MMMM", { locale: es })
    const last = dayGroups[dayGroups.length - 1]
    if (last && last.label === label) last.msgs.push(m)
    else dayGroups.push({ label, msgs: [m] })
  }

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <Loader2 style={{ width: 24, height: 24, color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (!alumnos.length) return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>Mensajes</h1>
      <div style={{ ...card, padding: '48px 24px', textAlign: 'center' }}>
        <Users style={{ width: 36, height: 36, color: 'var(--t3)', margin: '0 auto 12px', display: 'block' }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>Sin alumnos asignados</div>
        <div style={{ fontSize: 13, color: 'var(--t2)' }}>Cuando tengas alumnos, podrás chatear con ellos aquí.</div>
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>Mensajes</h1>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '280px 1fr' : '1fr', gap: 14, height: 'calc(100dvh - 52px - 120px)', maxHeight: 650 }}>

        {/* Student list panel */}
        <div style={{
          ...card, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          ...(selected && typeof window !== 'undefined' && window.innerWidth < 768 && !showList ? { display: 'none' } : {}),
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13.5, fontWeight: 600, color: 'var(--t1)', flexShrink: 0 }}>
            Conversaciones
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {alumnos.map((a, i) => {
              const isSelected = selected?.id === a.id
              const unreadCount = unread[a.user_id] ?? 0
              return (
                <button
                  key={a.id}
                  onClick={() => selectAlumno(a)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    background: isSelected ? 'rgba(170,255,0,0.06)' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.025)' }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(96,165,250,0.1)', border: `1px solid ${isSelected ? 'rgba(170,255,0,0.3)' : 'rgba(96,165,250,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 700, color: isSelected ? 'var(--primary)' : '#60a5fa', flexShrink: 0 }}>
                    {a.nombre[0]}{a.apellido[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--primary)' : 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.nombre} {a.apellido}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>Alumno</div>
                  </div>
                  {unreadCount > 0 && (
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--primary)', color: '#000', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat panel */}
        {selected ? (
          <div style={{ ...card, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Chat header */}
            <div style={{ padding: '12px 16px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => { setSelected(null); setShowList(true); setMensajes([]) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 4, display: 'flex' }}>
                <ChevronLeft style={{ width: 16, height: 16 }} />
              </button>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User style={{ width: 15, height: 15, color: '#60a5fa' }} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t1)' }}>{selected.nombre} {selected.apellido}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>Alumno</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', background: 'var(--background)', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {loadingChat ? (
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
                  <Loader2 style={{ width: 20, height: 20, color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : mensajes.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <MessageSquare style={{ width: 32, height: 32, color: 'var(--t3)' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Empezá la conversación</div>
                  <div style={{ fontSize: 12.5, color: 'var(--t2)', textAlign: 'center' }}>
                    Enviá un mensaje a {selected.nombre} sobre su rutina o progreso.
                  </div>
                </div>
              ) : (
                dayGroups.map(({ label, msgs }) => (
                  <div key={label}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 8px' }}>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                      <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600 }}>{label}</span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                    </div>
                    {msgs.map(m => {
                      const isMe = m.de_user_id === myUserId
                      return (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 4, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                          {!isMe && (
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(96,165,250,0.1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User style={{ width: 12, height: 12, color: '#60a5fa' }} />
                            </div>
                          )}
                          <div style={{ maxWidth: '72%' }}>
                            <div style={{ padding: '8px 12px', borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: isMe ? 'var(--primary)' : 'var(--surface)', border: isMe ? 'none' : '1px solid var(--border)', fontSize: 13.5, color: isMe ? '#000' : 'var(--t1)', lineHeight: 1.45, wordBreak: 'break-word' }}>
                              {m.contenido}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3, textAlign: isMe ? 'right' : 'left', paddingInline: 2 }}>
                              {fmtTime(m.created_at)}
                              {isMe && <span style={{ marginLeft: 4 }}>{m.leido ? '✓✓' : '✓'}</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '10px 14px', flexShrink: 0, background: 'var(--surface)', display: 'flex', alignItems: 'flex-end', gap: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <textarea
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribí un mensaje... (Enter para enviar)"
                rows={1}
                style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '8px 12px', fontSize: 13.5, color: 'var(--t1)', outline: 'none', fontFamily: 'inherit', resize: 'none', maxHeight: 100, overflowY: 'auto' }}
                className="input-accent"
              />
              <button
                onClick={sendMessage}
                disabled={!texto.trim() || sending}
                style={{ width: 36, height: 36, borderRadius: 9, border: 'none', cursor: texto.trim() && !sending ? 'pointer' : 'default', background: texto.trim() && !sending ? 'var(--primary)' : 'rgba(255,255,255,0.06)', color: texto.trim() && !sending ? '#000' : 'var(--t3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
              >
                {sending
                  ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                  : <Send style={{ width: 14, height: 14 }} />
                }
              </button>
            </div>
          </div>
        ) : (
          <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <MessageSquare style={{ width: 36, height: 36, color: 'var(--t3)' }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Seleccioná un alumno</div>
            <div style={{ fontSize: 13, color: 'var(--t2)', textAlign: 'center', maxWidth: 220 }}>
              Elegí una conversación de la lista para empezar a chatear.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
