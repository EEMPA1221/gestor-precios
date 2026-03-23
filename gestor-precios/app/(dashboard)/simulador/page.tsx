'use client'

import { useState, useEffect } from 'react'
import { Calculator, Search, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice, IVA_LABELS, ROUNDING_LABELS } from '@/lib/calculos'
import type { IvaRate, RoundingMode } from '@/types'

interface ListOption { id: string; supplierName: string; listDate: string; itemCount: number }
interface ListItem { id: string; originalName: string; costPrice: number; ivaRate: IvaRate; category?: string }
interface SimResult {
  id: string; originalName: string; internalName: string; costPrice: number; ivaRate: IvaRate
  pricesByMargin: { margin: number; withMargin: number; withIva: number; rounded: number }[]
}

const MARGIN_PRESETS = [25, 30, 35, 40, 45, 50]

export default function SimuladorPage() {
  const [lists, setLists] = useState<ListOption[]>([])
  const [selectedList, setSelectedList] = useState('')
  const [items, setItems] = useState<ListItem[]>([])
  const [filteredItems, setFilteredItems] = useState<ListItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [margins, setMargins] = useState([30, 35, 40])
  const [ivaOverride, setIvaOverride] = useState<IvaRate | ''>('')
  const [roundingMode, setRoundingMode] = useState<RoundingMode>('none')
  const [results, setResults] = useState<SimResult[]>([])
  const [calculating, setCalculating] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)

  useEffect(() => { fetchLists() }, [])
  useEffect(() => {
    const q = search.toLowerCase()
    setFilteredItems(items.filter(i =>
      i.originalName.toLowerCase().includes(q) ||
      (i.category ?? '').toLowerCase().includes(q)
    ))
  }, [search, items])

  async function fetchLists() {
    const res = await fetch('/api/listas?status=ACTIVE')
    const data = await res.json()
    setLists(data.map((l: any) => ({
      id: l.id,
      supplierName: l.supplier?.name ?? '?',
      listDate: l.listDate,
      itemCount: l._count?.items ?? 0,
    })))
  }

  async function fetchItems(listId: string) {
    setLoadingItems(true)
    setItems([])
    setSelectedIds(new Set())
    setResults([])
    const res = await fetch(`/api/listas/${listId}`)
    const data = await res.json()
    setItems(data.items ?? [])
    setLoadingItems(false)
  }

  function toggleItem(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)))
    }
  }

  function toggleMargin(m: number) {
    setMargins(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m].sort((a, b) => a - b))
  }

  async function calculate() {
    if (selectedIds.size === 0) { toast.error('Seleccioná al menos un producto'); return }
    if (margins.length === 0) { toast.error('Seleccioná al menos un margen'); return }
    setCalculating(true)
    const res = await fetch('/api/simulador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemIds: Array.from(selectedIds),
        margins,
        ivaOverride: ivaOverride || undefined,
        roundingMode,
      }),
    })
    const data = await res.json()
    setResults(data)
    setCalculating(false)
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Simulador de precios</h1>
        <p style={{ color: 'hsl(220 15% 50%)', fontSize: '0.875rem', marginTop: 2 }}>
          Seleccioná productos y calculá precios de venta con distintos márgenes
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left panel: config + product selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* List selector */}
          <div style={{ background: 'white', border: '1px solid hsl(220 15% 88%)', borderRadius: 12, padding: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'hsl(220 25% 25%)', marginBottom: 6 }}>
              Lista de precios
            </label>
            <select
              value={selectedList}
              onChange={e => { setSelectedList(e.target.value); fetchItems(e.target.value) }}
              style={{
                width: '100%', padding: '9px 12px',
                border: '1.5px solid hsl(220 15% 88%)', borderRadius: 8,
                fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
                background: 'white',
              }}
            >
              <option value="">Elegí una lista...</option>
              {lists.map(l => (
                <option key={l.id} value={l.id}>
                  {l.supplierName} — {new Date(l.listDate).toLocaleDateString('es-AR')} ({l.itemCount} productos)
                </option>
              ))}
            </select>
          </div>

          {/* Margins */}
          <div style={{ background: 'white', border: '1px solid hsl(220 15% 88%)', borderRadius: 12, padding: '1.25rem' }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'hsl(220 25% 25%)', marginBottom: 10 }}>
              Márgenes a comparar
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {MARGIN_PRESETS.map(m => (
                <button
                  key={m}
                  onClick={() => toggleMargin(m)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 999,
                    border: margins.includes(m) ? '1.5px solid hsl(221 89% 54%)' : '1.5px solid hsl(220 15% 85%)',
                    background: margins.includes(m) ? 'hsl(221 89% 96%)' : 'white',
                    color: margins.includes(m) ? 'hsl(221 89% 40%)' : 'hsl(220 15% 40%)',
                    fontSize: '0.82rem', fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {m}%
                </button>
              ))}
            </div>
          </div>

          {/* IVA + Rounding */}
          <div style={{ background: 'white', border: '1px solid hsl(220 15% 88%)', borderRadius: 12, padding: '1.25rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'hsl(220 25% 25%)', marginBottom: 6 }}>
                IVA (forzar para todos)
              </label>
              <select
                value={ivaOverride}
                onChange={e => setIvaOverride(e.target.value as IvaRate | '')}
                style={{
                  width: '100%', padding: '8px 10px',
                  border: '1.5px solid hsl(220 15% 88%)', borderRadius: 8,
                  fontSize: '0.875rem', fontFamily: 'inherit', background: 'white',
                }}
              >
                <option value="">Usar IVA de cada producto</option>
                {(Object.keys(IVA_LABELS) as IvaRate[]).map(k => (
                  <option key={k} value={k}>{IVA_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'hsl(220 25% 25%)', marginBottom: 6 }}>
                Redondeo
              </label>
              <select
                value={roundingMode}
                onChange={e => setRoundingMode(e.target.value as RoundingMode)}
                style={{
                  width: '100%', padding: '8px 10px',
                  border: '1.5px solid hsl(220 15% 88%)', borderRadius: 8,
                  fontSize: '0.875rem', fontFamily: 'inherit', background: 'white',
                }}
              >
                {(Object.keys(ROUNDING_LABELS) as RoundingMode[]).map(k => (
                  <option key={k} value={k}>{ROUNDING_LABELS[k]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product list */}
          {selectedList && (
            <div style={{ background: 'white', border: '1px solid hsl(220 15% 88%)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid hsl(220 15% 92%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'hsl(220 25% 25%)' }}>
                    Productos ({selectedIds.size} seleccionados)
                  </p>
                  <button
                    onClick={toggleAll}
                    style={{
                      fontSize: '0.75rem', color: 'hsl(221 89% 50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {selectedIds.size === filteredItems.length ? 'Ninguno' : 'Todos'}
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'hsl(220 10% 55%)' }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Filtrar productos..."
                    style={{
                      width: '100%', padding: '7px 10px 7px 28px',
                      border: '1px solid hsl(220 15% 88%)', borderRadius: 7,
                      fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {loadingItems ? (
                  <p style={{ padding: '1.5rem', textAlign: 'center', color: 'hsl(220 10% 55%)', fontSize: '0.82rem' }}>Cargando...</p>
                ) : filteredItems.map(item => (
                  <label
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 1.25rem', cursor: 'pointer',
                      borderBottom: '1px solid hsl(220 15% 95%)',
                      background: selectedIds.has(item.id) ? 'hsl(221 89% 97%)' : 'white',
                      transition: 'background 0.1s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                      style={{ width: 15, height: 15, accentColor: 'hsl(221 89% 54%)', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'hsl(220 25% 15%)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.originalName}
                      </p>
                      <p style={{ fontSize: '0.73rem', color: 'hsl(220 10% 55%)' }}>
                        {formatPrice(item.costPrice)} · {IVA_LABELS[item.ivaRate]}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Calculate button */}
          <button
            onClick={calculate}
            disabled={calculating || selectedIds.size === 0}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px',
              background: (calculating || selectedIds.size === 0) ? 'hsl(221 89% 70%)' : 'hsl(221 89% 54%)',
              color: 'white', border: 'none', borderRadius: 9,
              fontSize: '0.95rem', fontWeight: 500,
              cursor: (calculating || selectedIds.size === 0) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {calculating ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Calculando...</>
              : <><Calculator size={16} /> Calcular precios</>}
          </button>
        </div>

        {/* Results table */}
        <div>
          {results.length === 0 ? (
            <div style={{
              background: 'white', border: '1px solid hsl(220 15% 88%)',
              borderRadius: 12, padding: '4rem 2rem', textAlign: 'center',
            }}>
              <Calculator size={40} color="hsl(220 10% 75%)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: 'hsl(220 10% 55%)', fontSize: '0.9rem' }}>
                Elegí una lista, seleccioná productos y presioná <strong>Calcular precios</strong>
              </p>
            </div>
          ) : (
            <div style={{ background: 'white', border: '1px solid hsl(220 15% 88%)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid hsl(220 15% 92%)' }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  Simulación de precios — {results.length} producto{results.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="num">Costo</th>
                      <th className="num">IVA</th>
                      {margins.map(m => <th key={m} className="num">+{m}%</th>)}
                      <th className="num" style={{ background: 'hsl(221 89% 95%)' }}>Con IVA</th>
                      <th className="num" style={{ background: 'hsl(142 71% 95%)' }}>Redondeado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(row => (
                      <tr key={row.id}>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{row.internalName}</div>
                          {row.internalName !== row.originalName && (
                            <div style={{ fontSize: '0.75rem', color: 'hsl(220 10% 55%)' }}>{row.originalName}</div>
                          )}
                        </td>
                        <td className="num">{formatPrice(row.costPrice)}</td>
                        <td className="num" style={{ fontSize: '0.8rem', color: 'hsl(220 10% 50%)' }}>
                          {IVA_LABELS[row.ivaRate]}
                        </td>
                        {row.pricesByMargin.map(p => (
                          <td key={p.margin} className="num">
                            <span style={{
                              background: 'hsl(221 89% 96%)', color: 'hsl(221 89% 35%)',
                              borderRadius: 6, padding: '2px 8px', fontSize: '0.82rem', fontWeight: 500,
                            }}>
                              {formatPrice(p.withMargin)}
                            </span>
                          </td>
                        ))}
                        <td className="num" style={{ background: 'hsl(221 89% 97%)' }}>
                          <span style={{ fontWeight: 600, color: 'hsl(221 89% 35%)' }}>
                            {formatPrice(row.pricesByMargin[Math.floor(row.pricesByMargin.length / 2)]?.withIva ?? 0)}
                          </span>
                        </td>
                        <td className="num" style={{ background: 'hsl(142 71% 96%)' }}>
                          <span style={{ fontWeight: 700, color: 'hsl(142 71% 28%)', fontSize: '0.95rem' }}>
                            {formatPrice(row.pricesByMargin[Math.floor(row.pricesByMargin.length / 2)]?.rounded ?? 0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
