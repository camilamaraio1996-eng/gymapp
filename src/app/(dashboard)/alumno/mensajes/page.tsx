'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2, MessageSquare, User } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

interface Mensaje {
  id: string
  de_user_id: string
  para_user_id: string
  contenido: string
  leido: boolean
  created_at: string
}

function formatMsgTime(iso: string) {
  const d = new Date(iso)
  if (isToday(d))     return format(d, 'HH:mm')
  if (isYesterday(d)) return `Ayer ${format(d, 'HH:mm')}`
  return format(d, "d MMM, HH:mm", { locale: es })
}

export default function MensajesPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [profUserId, setProfUserId] = useState<string | null>(null)
  const [profNombre, setProfNombre] = useState('Tu profesor')
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setMyUserId(user.id)

      // Get alumno and their profesor's user_id
      const { data: alumno } = await supabase
        .from('alumnos')
        .select('id, profesor:profesores(user_id, nombre, apellido)')
        .eq('user_id', user.id)
        .single()

      const prof = alumno?.profesor as { user_id: string, nombre: string, apellido: string } | undefined
      if (!prof?.user_id) { setLoading(false); return }

      setProfUserId(prof.user_id)
      setProfNombre(`${prof.nombre} ${prof.apellido}`)

      await loadMessages(user.id, prof.user_id)
      setLoading(false)

      // Mark received messages as read
      await supabase
        .from('mensajes')
        .update({ leido: true })
        .eq('de_user_id', prof.user_id)
        .eq('para_user_id', user.id)
        .eq('leido', false)
    }
    load()
  }, [])

  async function loadMessages(uid: string, profId: string) {
    const { data } = await supabase
      .from('mensajes')
      .select('*')
      .or(`and(de_user_id.eq.${uid},para_user_id.eq.${profId}),and(de_user_id.eq.${profId},para_user_id.eq.${uid})`)
      .order('created_at', { ascending: true })
    setMensajes(data ?? [])
  }

  // Polling for new messages
  useEffect(() => {
    if (!myUserId || !profUserId) return
    const interval = setInterval(() => loadMessages(myUserId, profUserId), 5000)
    return () => clearInterval(interval)
  }, [myUserId, profUserId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  // Realtime subscription
  useEffect(() => {
    if (!myUserId || !profUserId) return
    const channel = supabase
      .channel('mensajes-alumno')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'mensajes',
        filter: `para_user_id=eq.${myUserId}`,
      }, payload => {
        const msg = payload.new as Mensaje
        if (msg.de_user_id === profUserId) {
          setMensajes(prev => [...prev, msg])
          supabase.from('mensajes').update({ leido: true }).eq('id', msg.id)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [myUserId, profUserId])

  async function sendMessage() {
    const txt = texto.trim()
    if (!txt || !myUserId || !profUserId) return
    setSending(true)

    const optimistic: Mensaje = {
      id: `opt-${Date.now()}`,
      de_user_id: myUserId,
      para_user_id: profUserId,
      contenido: txt,
      leido: false,
      created_at: new Date().toISOString(),
    }
    setMensajes(prev => [...prev, optimistic])
    setTexto('')

    const { data, error } = await supabase.from('mensajes').insert({
      de_user_id: myUserId,
      para_user_id: profUserId,
      contenido: txt,
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

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <Loader2 style={{ width: 24, height: 24, color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (!profUserId) return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>Mensajes</h1>
      <div style={{ ...card, padding: '48px 24px', textAlign: 'center' }}>
        <MessageSquare style={{ width: 36, height: 36, color: 'var(--t3)', margin: '0 auto 12px', display: 'block' }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>Sin profesor asignado</div>
        <div style={{ fontSize: 13, color: 'var(--t2)' }}>Cuando tengas un profesor, podrás chatear con él aquí.</div>
      </div>
    </div>
  )

  // Group messages by date
  type DayGroup = { dayLabel: string; msgs: Mensaje[] }
  const dayGroups: DayGroup[] = []
  for (const m of mensajes) {
    const d = new Date(m.created_at)
    const label = isToday(d) ? 'Hoy' : isYesterday(d) ? 'Ayer' : format(d, "d 'de' MMMM", { locale: es })
    const last = dayGroups[dayGroups.length - 1]
    if (last && last.dayLabel === label) last.msgs.push(m)
    else dayGroups.push({ dayLabel: label, msgs: [m] })
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 0, height: 'calc(100dvh - 52px - 56px)', maxHeight: 700 }}>

      {/* Chat header */}
      <div style={{ padding: '16px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', borderRadius: '14px 14px 0 0', border: '1px solid var(--border)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User style={{ width: 17, height: 17, color: '#60a5fa' }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{profNombre}</div>
          <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 1 }}>Tu profesor</div>
        </div>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 16px',
        background: 'var(--background)',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        {mensajes.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <MessageSquare style={{ width: 36, height: 36, color: 'var(--t3)' }} />
            <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t1)' }}>Empezá la conversación</div>
            <div style={{ fontSize: 13, color: 'var(--t2)', textAlign: 'center' }}>
              Enviá un mensaje a tu profesor para preguntas sobre tu rutina, progreso o cualquier duda.
            </div>
          </div>
        )}

        {dayGroups.map(({ dayLabel, msgs }) => (
          <div key={dayLabel}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
              <span style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 600, whiteSpace: 'nowrap' }}>{dayLabel}</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
            </div>

            {msgs.map((m, i) => {
              const isMe = m.de_user_id === myUserId
              const showAvatar = !isMe && (i === 0 || msgs[i - 1]?.de_user_id !== m.de_user_id)
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 4,
                    flexDirection: isMe ? 'row-reverse' : 'row',
                  }}
                >
                  {!isMe && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: showAvatar ? 'rgba(96,165,250,0.1)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {showAvatar && <User style={{ width: 13, height: 13, color: '#60a5fa' }} />}
                    </div>
                  )}
                  <div style={{ maxWidth: '72%' }}>
                    <div style={{
                      padding: '9px 13px', borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: isMe ? 'var(--primary)' : 'var(--surface)',
                      border: isMe ? 'none' : '1px solid var(--border)',
                      fontSize: 13.5, color: isMe ? '#000' : 'var(--t1)',
                      lineHeight: 1.45, wordBreak: 'break-word',
                    }}>
                      {m.contenido}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3, textAlign: isMe ? 'right' : 'left', paddingLeft: 2, paddingRight: 2 }}>
                      {formatMsgTime(m.created_at)}
                      {isMe && <span style={{ marginLeft: 4 }}>{m.leido ? '✓✓' : '✓'}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{
        padding: '12px 14px', flexShrink: 0,
        background: 'var(--surface)',
        display: 'flex', alignItems: 'flex-end', gap: 10,
        borderRadius: '0 0 14px 14px', border: '1px solid var(--border)', borderTop: '1px solid rgba(255,255,255,0.07)',
      }}>
        <textarea
          ref={inputRef}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí un mensaje... (Enter para enviar)"
          rows={1}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 10, padding: '9px 13px', fontSize: 13.5, color: 'var(--t1)',
            outline: 'none', fontFamily: 'inherit', resize: 'none',
            maxHeight: 100, overflowY: 'auto',
          }}
          className="input-accent"
        />
        <button
          onClick={sendMessage}
          disabled={!texto.trim() || sending}
          style={{
            width: 38, height: 38, borderRadius: 10, border: 'none', cursor: texto.trim() && !sending ? 'pointer' : 'default',
            background: texto.trim() && !sending ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
            color: texto.trim() && !sending ? '#000' : 'var(--t3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s, color 0.15s',
          }}
        >
          {sending
            ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />
            : <Send style={{ width: 15, height: 15 }} />
          }
        </button>
      </div>
    </div>
  )
}
