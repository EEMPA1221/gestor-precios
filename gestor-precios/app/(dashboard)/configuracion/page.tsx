'use client'

import { useState, useEffect } from 'react'
import { Settings, Save } from 'lucide-react'
import { toast } from 'sonner'
import { ROUNDING_LABELS, IVA_LABELS } from '@/lib/calculos'
import type { IvaRate, RoundingMode } from '@/types'

export default function ConfiguracionPage() {
  const [config, setConfig] = useState({
    default_margin: '35',
    default_iva: 'NONE',
    default_rounding: 'none',
    alert_increase_threshold: '15',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/configuracion', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    setSaving(false)
    if (res.ok) toast.success('Configuración guardada')
    else toast.error('Error al guardar')
  }

  return (
    <div className="animate-in" style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Configuración</h1>
        <p style={{ color: 'hsl(220 15% 50%)', fontSize: '0.875rem', marginTop: 2 }}>
          Parámetros globales del sistema
        </p>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ background: 'white', border: '1px solid hsl(220 15% 88%)', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem', color: 'hsl(220 25% 15%)' }}>
            Valores por defecto del simulador
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, marginBottom: 6 }}>
                Margen sugerido (%)
              </label>
              <input
                type="number" min={0} max={500}
                value={config.default_margin}
                onChange={e => setConfig(c => ({ ...c, default_margin: e.target.value }))}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: '1.5px solid hsl(220 15% 88%)', borderRadius: 8,
                  fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, marginBottom: 6 }}>
                IVA por defecto
              </label>
              <select
                value={config.default_iva}
                onChange={e => setConfig(c => ({ ...c, default_iva: e.target.value }))}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: '1.5px solid hsl(220 15% 88%)', borderRadius: 8,
                  fontSize: '0.9rem', fontFamily: 'inherit', background: 'white',
                }}
              >
                {(Object.keys(IVA_LABELS) as IvaRate[]).map(k => (
                  <option key={k} value={k}>{IVA_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, marginBottom: 6 }}>
                Redondeo por defecto
              </label>
              <select
                value={config.default_rounding}
                onChange={e => setConfig(c => ({ ...c, default_rounding: e.target.value }))}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: '1.5px solid hsl(220 15% 88%)', borderRadius: 8,
                  fontSize: '0.9rem', fontFamily: 'inherit', background: 'white',
                }}
              >
                {(Object.keys(ROUNDING_LABELS) as RoundingMode[]).map(k => (
                  <option key={k} value={k}>{ROUNDING_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, marginBottom: 6 }}>
                Alerta de aumento mayor a (%)
              </label>
              <input
                type="number" min={1} max={999}
                value={config.alert_increase_threshold}
                onChange={e => setConfig(c => ({ ...c, alert_increase_threshold: e.target.value }))}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: '1.5px solid hsl(220 15% 88%)', borderRadius: 8,
                  fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px',
            background: saving ? 'hsl(221 89% 65%)' : 'hsl(221 89% 54%)',
            color: 'white', border: 'none', borderRadius: 9,
            fontSize: '0.9rem', fontWeight: 500,
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}
        >
          <Save size={15} />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
