'use client'

import { useState } from 'react'
import { Settings, Bell, Shield, CreditCard, Globe, Save, Check } from 'lucide-react'

const sections = [
  { id: 'general',        label: 'General',        icon: Settings  },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell      },
  { id: 'seguridad',      label: 'Seguridad',       icon: Shield    },
  { id: 'facturacion',    label: 'Facturación',     icon: CreditCard },
]

function SaveButton({ label = 'Guardar cambios' }: { label?: string }) {
  const [saved, setSaved] = useState(false)
  function handleClick() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: saved ? '#4ade80' : 'var(--primary)',
        border: 'none', borderRadius: 8,
        padding: '8px 18px', fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 600,
        transition: 'background 0.2s',
      }}
    >
      {saved ? <Check style={{ width: 13, height: 13 }} /> : <Save style={{ width: 13, height: 13 }} />}
      {saved ? 'Guardado' : label}
    </button>
  )
}

function Toggle({ defaultOn = false, label }: { defaultOn?: boolean; label: string }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: 13.5, color: 'var(--t1)' }}>{label}</span>
      <button
        onClick={() => setOn(v => !v)}
        style={{
          width: 40, height: 22, borderRadius: 999,
          background: on ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
          border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: on ? 20 : 3,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', display: 'block',
        }} />
      </button>
    </div>
  )
}

function Field({ label, value, type = 'text', hint }: { label: string; value: string; type?: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</label>
      <input
        type={type}
        defaultValue={value}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'var(--background)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '9px 12px',
          fontSize: 13.5, color: 'var(--t1)',
          outline: 'none',
        }}
      />
      {hint && <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 5 }}>{hint}</div>}
    </div>
  )
}

export default function ConfigPage() {
  const [activeSection, setActiveSection] = useState('general')

  const card: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    overflow: 'hidden',
  }

  return (
    <div className="animate-fade-in">

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Configuración</div>
        <div style={{ fontSize: 13.5, color: 'var(--t2)', marginTop: 5 }}>Ajustes generales del sistema</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14, alignItems: 'start' }}>

        {/* Sidebar nav */}
        <div style={{ ...card, padding: '8px' }}>
          {sections.map(sec => {
            const active = activeSection === sec.id
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(255,61,26,0.08)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--t2)',
                  fontSize: 13.5, fontWeight: active ? 600 : 400,
                  textAlign: 'left',
                  transition: 'all 0.12s',
                  marginBottom: 2,
                }}
              >
                <sec.icon style={{ width: 15, height: 15, flexShrink: 0 }} />
                {sec.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={card}>

          {activeSection === 'general' && (
            <div>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,61,26,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Settings style={{ width: 14, height: 14, color: 'var(--primary)' }} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>Información general</span>
              </div>
              <div style={{ padding: '24px' }}>
                <Field label="Nombre del gimnasio"  value="LangGym"           hint="Aparece en todos los correos y reportes." />
                <Field label="Dirección"             value="Av. Corrientes 1234, CABA" />
                <Field label="Teléfono de contacto" value="+54 11 4567-8900" type="tel" />
                <Field label="Email de contacto"    value="hola@langgym.com"  type="email" />
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Zona horaria</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px' }}>
                    <Globe style={{ width: 13, height: 13, color: 'var(--t3)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, color: 'var(--t1)' }}>América/Buenos_Aires (UTC-3)</span>
                  </div>
                </div>
                <Field label="Horario de apertura" value="06:00 – 22:00" hint="De lunes a sábado. Domingo: 09:00 – 18:00." />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <SaveButton />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notificaciones' && (
            <div>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell style={{ width: 14, height: 14, color: '#60a5fa' }} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>Notificaciones</span>
              </div>
              <div style={{ padding: '8px 24px 24px' }}>
                <div style={{ fontSize: 11.5, color: 'var(--t3)', margin: '16px 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Alertas del sistema</div>
                <Toggle defaultOn label="Alumnos sin rutina asignada" />
                <Toggle defaultOn label="Nuevos registros de alumnos" />
                <Toggle label="Ausencias repetidas (3+ seguidas)" />
                <Toggle defaultOn label="Resumen semanal por email" />

                <div style={{ fontSize: 11.5, color: 'var(--t3)', margin: '20px 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Notificaciones push</div>
                <Toggle defaultOn label="Notificaciones en el navegador" />
                <Toggle label="Notificaciones por WhatsApp" />
                <Toggle defaultOn label="Reporte mensual automático" />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                  <SaveButton />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'seguridad' && (
            <div>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield style={{ width: 14, height: 14, color: '#4ade80' }} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>Seguridad</span>
              </div>
              <div style={{ padding: '24px' }}>
                <Field label="Email actual" value="admin@langgym.com" type="email" hint="Para cambiar el email, contactá a soporte." />
                <Field label="Contraseña nueva" value="" type="password" />
                <Field label="Confirmar contraseña" value="" type="password" />

                <div style={{ margin: '24px 0 16px', padding: '14px 16px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#4ade80', marginBottom: 4 }}>2FA activo</div>
                  <div style={{ fontSize: 12.5, color: 'var(--t2)' }}>Autenticación de dos factores habilitada vía email.</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <button style={{ fontSize: 13, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Cerrar todas las sesiones activas
                  </button>
                  <SaveButton label="Actualizar contraseña" />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'facturacion' && (
            <div>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard style={{ width: 14, height: 14, color: '#a78bfa' }} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>Facturación</span>
              </div>
              <div style={{ padding: '24px' }}>
                {/* Plan actual */}
                <div style={{ padding: '16px', background: 'rgba(255,61,26,0.06)', border: '1px solid rgba(255,61,26,0.2)', borderRadius: 10, marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Plan Pro</div>
                      <div style={{ fontSize: 12.5, color: 'var(--t3)', marginTop: 3 }}>Hasta 50 alumnos · Renovación: 15 Jul 2026</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'var(--primary)', color: '#fff' }}>ACTIVO</span>
                  </div>
                </div>

                <Field label="Razón social / CUIT" value="Gym Solutions S.A.S. · 30-71234567-8" />
                <Field label="Dirección de facturación" value="Av. Corrientes 1234, CABA" />

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Método de pago</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px' }}>
                    <CreditCard style={{ width: 14, height: 14, color: 'var(--t3)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, color: 'var(--t1)', flex: 1 }}>•••• •••• •••• 4242</span>
                    <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>Vence 09/27</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <button style={{ fontSize: 13, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Ver historial de pagos
                  </button>
                  <SaveButton label="Actualizar facturación" />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
