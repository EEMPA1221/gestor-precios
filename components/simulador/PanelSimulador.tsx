'use client'

import { useState } from 'react'
import { Calculator, X, ChevronDown, ChevronUp } from 'lucide-react'
import { calcFinalPrice, formatPrice, IVA_LABELS, ROUNDING_LABELS } from '@/lib/calculos'
import type { IvaRate, RoundingMode, ListItem } from '@/types'

interface PanelSimuladorProps {
  items: ListItem[]
  onClear?: () => void
}

const DEFAULT_MARGINS = [30, 35, 40, 45]

export default function PanelSimulador({ items, onClear }: PanelSimuladorProps) {
  const [open, setOpen] = useState(true)
  const [margins, setMargins] = useState(DEFAULT_MARGINS)
  const [ivaRate, setIvaRate] = useState<IvaRate>('NONE')
  const [roundingMode, setRoundingMode] = useState<RoundingMode>('none')

  if (items.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      width: open ? 680 : 220,
      maxWidth: 'calc(100vw - 32px)',
      background: 'white',
      border: '1px solid hsl(220 15% 85%)',
      borderRadius: 14,
      boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
      zIndex: 200,
      overflow: 'hidden',
      transition: 'width 0.25s ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 16px',
        background: 'hsl(221 89% 54%)',
        cursor: 'pointer',
      }} onClick={() => setOpen(!open)}>
        <Calculator size={16} color="white" />
        <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', flex: 1 }}>
          Simulador — {items.length} producto{items.length !== 1 ? 's' : ''}
        </span>
        {open
          ? <ChevronDown size={16} color="white" />
          : <ChevronUp size={16} color="white" />}
        <button
          onClick={e => { e.stopPropagation(); onClear?.() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', padding: 2 }}
        >
          <X size={14} />
        </button>
      </div>

      {open && (
        <div>
          {/* Config row */}
          <div style={{
            display: 'flex',
            gap: 12,
            padding: '10px 16px',
            borderBottom: '1px solid hsl(220 15% 92%)',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <label style={{ fontSize: '0.8rem', color: 'hsl(220 15% 40%)', display: 'flex', alignItems: 'center', gap: 6 }}>
              IVA:
              <select
                value={ivaRate}
                onChange={e => setIvaRate(e.target.value as IvaRate)}
                style={selectStyle}
              >
                {(Object.keys(IVA_LABELS) as IvaRate[]).map(k => (
                  <option key={k} value={k}>{IVA_LABELS[k]}</option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: '0.8rem', color: 'hsl(220 15% 40%)', display: 'flex', alignItems: 'center', gap: 6 }}>
              Redondeo:
              <select
                value={roundingMode}
                onChange={e => setRoundingMode(e.target.value as RoundingMode)}
                style={selectStyle}
              >
                {(Object.keys(ROUNDING_LABELS) as RoundingMode[]).map(k => (
                  <option key={k} value={k}>{ROUNDING_LABELS[k]}</option>
                ))}
              </select>
            </label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
              <span style={{ fontSize: '0.8rem', color: 'hsl(220 15% 40%)' }}>Márgenes %:</span>
              {margins.map((m, i) => (
                <input
                  key={i}
                  type="number"
                  value={m}
                  onChange={e => {
                    const next = [...margins]
                    next[i] = Number(e.target.value)
                    setMargins(next)
                  }}
                  style={{
                    width: 48,
                    padding: '4px 6px',
                    border: '1px solid hsl(220 15% 88%)',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: 'hsl(220 15% 97%)' }}>
                  <th style={thStyle}>Producto</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Costo</th>
                  {margins.map(m => (
                    <th key={m} style={{ ...thStyle, textAlign: 'right' }}>+{m}%</th>
                  ))}
                  <th style={{ ...thStyle, textAlign: 'right' }}>Con IVA</th>
                  <th style={{ ...thStyle, textAlign: 'right', color: 'hsl(221 89% 45%)' }}>Redondeado</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const cost = Number(item.costPrice)
                  const effectiveIva = ivaRate !== 'NONE' ? ivaRate : item.ivaRate
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid hsl(220 15% 94%)' }}>
                      <td style={{ padding: '8px 12px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.masterProduct?.internalName || item.originalName}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'hsl(220 10% 40%)' }}>
                        {formatPrice(cost)}
                      </td>
                      {margins.map(m => {
                        const { withMargin } = calcFinalPrice(cost, m, 'NONE', 'none')
                        return (
                          <td key={m} style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                            {formatPrice(withMargin)}
                          </td>
                        )
                      })}
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'hsl(37 91% 38%)' }}>
                        {formatPrice(calcFinalPrice(cost, margins[1] ?? 35, effectiveIva, 'none').withIva)}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'hsl(221 89% 45%)' }}>
                        {formatPrice(calcFinalPrice(cost, margins[1] ?? 35, effectiveIva, roundingMode).rounded)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '3px 6px',
  border: '1px solid hsl(220 15% 88%)',
  borderRadius: 6,
  fontSize: '0.8rem',
  fontFamily: 'inherit',
  background: 'white',
  outline: 'none',
}

const thStyle: React.CSSProperties = {
  padding: '7px 12px',
  textAlign: 'left',
  fontWeight: 500,
  fontSize: '0.75rem',
  color: 'hsl(220 15% 40%)',
  borderBottom: '1px solid hsl(220 15% 90%)',
  whiteSpace: 'nowrap',
}
