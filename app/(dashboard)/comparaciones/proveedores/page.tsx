'use client'

import { useEffect, useState, useMemo } from 'react'
import { ArrowLeft, Search, Download } from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/calculos'
import PanelSimulador from '@/components/simulador/PanelSimulador'
import type { ListItem } from '@/types'

interface Lista {
  id: string
  listDate: string
  fileName: string | null
  supplier: { id: string; name: string }
  _count: { items: number }
}

interface CompRow {
  masterProductId: string
  internalName: string
  category: string | null
  prices: Record<string, number | null>
  ivaRates: Record<string, string>
  bestListId: string | null
  bestPrice: number | null
  worstPrice: number | null
}

export default function CompararProveedoresPage() {
  const [allLists, setAllLists] = useState<Lista[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [rows, setRows] = useState<CompRow[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showOnlyDiff, setShowOnlyDiff] = useState(false)
  const [selectedItems, setSelectedItems] = useState<ListItem[]>([])
  const [checkedRows, setCheckedRows] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/listas?status=ACTIVE')
      .then(r => r.json())
      .then(setAllLists)
  }, [])

  async function runComparison() {
    if (selectedIds.length < 2) return
    setLoading(true)
    setRows([])

    try {
      const responses = await Promise.all(
        selectedIds.map(id => fetch(`/api/listas/${id}`).then(r => r.json()))
      )

      // Build map: masterProductId → { listId → price }
      const map = new Map<string, CompRow>()

      for (const list of responses) {
        for (const item of list.items) {
          if (!item.masterProductId) continue
          const key = item.masterProductId
          if (!map.has(key)) {
            map.set(key, {
              masterProductId: key,
              internalName: item.masterProduct?.internalName ?? item.originalName,
              category: item.masterProduct?.category ?? null,
              prices: {},
              ivaRates: {},
              bestListId: null,
              bestPrice: null,
              worstPrice: null,
            })
          }
          const row = map.get(key)!
          row.prices[list.id] = Number(item.costPrice)
          row.ivaRates[list.id] = item.ivaRate
        }
      }

      // Compute best/worst
      const result: CompRow[] = []
      for (const row of map.values()) {
        const validPrices = selectedIds
          .map(id => ({ id, price: row.prices[id] ?? null }))
          .filter(p => p.price !== null) as { id: string; price: number }[]

        if (validPrices.length === 0) continue

        const sorted = [...validPrices].sort((a, b) => a.price - b.price)
        row.bestListId = sorted[0].id
        row.bestPrice = sorted[0].price
        row.worstPrice = sorted[sorted.length - 1].price

        // Only include if present in at least 2 selected lists
        if (validPrices.length >= 2) result.push(row)
      }

      result.sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '') || a.internalName.localeCompare(b.internalName))
      setRows(result)
    } finally {
      setLoading(false)
    }
  }

  const categories = useMemo(() =>
    [...new Set(rows.map(r => r.category).filter(Boolean))].sort() as string[],
    [rows]
  )

  const filtered = useMemo(() => {
    let r = rows
    if (search) r = r.filter(row => row.internalName.toLowerCase().includes(search.toLowerCase()))
    if (filterCategory) r = r.filter(row => row.category === filterCategory)
    if (showOnlyDiff) r = r.filter(row => {
      const prices = selectedIds.map(id => row.prices[id]).filter(p => p != null) as number[]
      return prices.length >= 2 && Math.max(...prices) !== Math.min(...prices)
    })
    return r
  }, [rows, search, filterCategory, showOnlyDiff, selectedIds])

  const selectedLists = allLists.filter(l => selectedIds.includes(l.id))

  function toggleRow(row: CompRow) {
    const next = new Set(checkedRows)
    if (next.has(row.masterProductId)) {
      next.delete(row.masterProductId)
    } else {
      next.add(row.masterProductId)
    }
    setCheckedRows(next)

    // Build ListItem-like objects for the simulator
    const items: ListItem[] = []
    for (const r of rows) {
      if (!next.has(r.masterProductId)) continue
      const bestId = r.bestListId
      if (!bestId) continue
      items.push({
        id: r.masterProductId,
        listId: bestId,
        masterProductId: r.masterProductId,
        originalName: r.internalName,
        costPrice: r.bestPrice!,
        ivaRate: (r.ivaRates[bestId] as any) ?? 'NONE',
        matched: true,
        masterProduct: { id: r.masterProductId, internalName: r.internalName, category: r.category ?? undefined },
      } as any)
    }
    setSelectedItems(items)
  }

  function toggleAllRows() {
    if (checkedRows.size === filtered.length) {
      setCheckedRows(new Set())
      setSelectedItems([])
    } else {
      const ids = new Set(filtered.map(r => r.masterProductId))
      setCheckedRows(ids)
      const items: ListItem[] = filtered.map(r => ({
        id: r.masterProductId,
        listId: r.bestListId!,
        masterProductId: r.masterProductId,
        originalName: r.internalName,
        costPrice: r.bestPrice!,
        ivaRate: (r.ivaRates[r.bestListId!] as any) ?? 'NONE',
        matched: true,
        masterProduct: { id: r.masterProductId, internalName: r.internalName, category: r.category ?? undefined },
      } as any)).filter((i: any) => i.costPrice != null)
      setSelectedItems(items)
    }
  }

  function pctDiff(a: number | null, b: number | null) {
    if (!a || !b || a === b) return null
    return ((b - a) / a) * 100
  }

  return (
    <div className="animate-in">
      <Link href="/comparaciones" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'hsl(221 89% 54%)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}>
        <ArrowLeft size={14} /> Comparaciones
      </Link>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.25rem' }}>Comparar proveedores</h1>
      <p style={{ color: 'hsl(220 15% 45%)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Seleccioná 2 o 3 listas activas para comparar precios
      </p>

      {/* Selector de listas */}
      <div style={{ background: 'white', border: '1px solid hsl(220 15% 88%)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: 'hsl(220 20% 25%)' }}>
          Elegí las listas a comparar ({selectedIds.length}/3)
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {allLists.map(list => {
            const active = selectedIds.includes(list.id)
            const disabled = !active && selectedIds.length >= 3
            return (
              <button
                key={list.id}
                disabled={disabled}
                onClick={() => {
                  if (active) setSelectedIds(prev => prev.filter(i => i !== list.id))
                  else if (selectedIds.length < 3) setSelectedIds(prev => [...prev, list.id])
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1.5px solid',
                  borderColor: active ? 'hsl(221 89% 54%)' : 'hsl(220 15% 85%)',
                  background: active ? 'hsl(221 89% 96%)' : 'white',
                  color: active ? 'hsl(221 89% 35%)' : disabled ? 'hsl(220 10% 65%)' : 'hsl(220 20% 25%)',
                  fontSize: '0.82rem',
                  fontWeight: active ? 600 : 400,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1,
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 500 }}>{list.supplier.name}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.75, marginTop: 1 }}>
                  {new Date(list.listDate).toLocaleDateString('es-AR')} · {list._count.items} prod.
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={runComparison}
          disabled={selectedIds.length < 2 || loading}
          style={{
            marginTop: '1rem',
            padding: '9px 20px',
            background: selectedIds.length < 2 ? 'hsl(220 10% 70%)' : 'hsl(221 89% 54%)',
            color: 'white',
            border: 'none',
            borderRadius: 9,
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: selectedIds.length < 2 ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {loading ? 'Comparando...' : 'Comparar'}
        </button>
      </div>

      {/* Resultados */}
      {rows.length > 0 && (
        <>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: 10, marginBottom: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: 200, maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(220 10% 55%)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar producto..."
                style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid hsl(220 15% 88%)', borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid hsl(220 15% 88%)', borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none' }}>
              <option value="">Todos los rubros</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer', color: 'hsl(220 15% 35%)' }}>
              <input type="checkbox" checked={showOnlyDiff} onChange={e => setShowOnlyDiff(e.target.checked)} />
              Solo con diferencias
            </label>
            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'hsl(220 10% 55%)' }}>
              {filtered.length} productos
              {checkedRows.size > 0 && ` · ${checkedRows.size} en simulador`}
            </span>
          </div>

          {/* Tabla */}
          <div style={{ background: 'white', border: '1px solid hsl(220 15% 88%)', borderRadius: 12, overflow: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox"
                      checked={checkedRows.size === filtered.length && filtered.length > 0}
                      onChange={toggleAllRows}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th>Producto</th>
                  <th>Rubro</th>
                  {selectedLists.map(l => (
                    <th key={l.id} style={{ textAlign: 'right' }}>
                      <div>{l.supplier.name}</div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 400, opacity: 0.7 }}>
                        {new Date(l.listDate).toLocaleDateString('es-AR')}
                      </div>
                    </th>
                  ))}
                  <th style={{ textAlign: 'right' }}>Mejor precio</th>
                  <th style={{ textAlign: 'right' }}>Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const diff = pctDiff(row.bestPrice, row.worstPrice)
                  return (
                    <tr key={row.masterProductId} style={{
                      background: checkedRows.has(row.masterProductId) ? 'hsl(221 89% 98%)' : undefined,
                    }}>
                      <td style={{ width: 40 }}>
                        <input type="checkbox"
                          checked={checkedRows.has(row.masterProductId)}
                          onChange={() => toggleRow(row)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ fontWeight: 500 }}>{row.internalName}</td>
                      <td style={{ fontSize: '0.82rem', color: 'hsl(220 10% 50%)' }}>{row.category ?? '—'}</td>
                      {selectedLists.map(l => {
                        const price = row.prices[l.id]
                        const isBest = row.bestListId === l.id && selectedIds.length > 1
                        const isWorst = price === row.worstPrice && price !== row.bestPrice
                        return (
                          <td key={l.id} className="num" style={{
                            fontFamily: 'var(--font-mono)',
                            color: isBest ? 'hsl(142 71% 32%)' : isWorst ? 'hsl(0 84% 45%)' : 'hsl(220 20% 25%)',
                            fontWeight: isBest ? 600 : 400,
                            background: isBest ? 'hsl(142 71% 97%)' : isWorst ? 'hsl(0 84% 98%)' : undefined,
                          }}>
                            {price != null ? (
                              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                {isBest && <span style={{ fontSize: '0.7rem', color: 'hsl(142 71% 35%)', fontFamily: 'inherit' }}>✓</span>}
                                {formatPrice(price)}
                              </span>
                            ) : (
                              <span style={{ color: 'hsl(220 10% 65%)', fontFamily: 'inherit' }}>—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="num" style={{ fontWeight: 600, color: 'hsl(142 71% 32%)', fontFamily: 'var(--font-mono)' }}>
                        {row.bestPrice != null ? formatPrice(row.bestPrice) : '—'}
                      </td>
                      <td className="num">
                        {diff != null ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 7px',
                            borderRadius: 999,
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            background: diff > 15 ? 'hsl(0 84% 96%)' : diff > 5 ? 'hsl(37 91% 93%)' : 'hsl(220 12% 93%)',
                            color: diff > 15 ? 'hsl(0 84% 38%)' : diff > 5 ? 'hsl(37 91% 32%)' : 'hsl(220 10% 40%)',
                          }}>
                            {diff.toFixed(1)}%
                          </span>
                        ) : <span style={{ color: 'hsl(220 10% 60%)', fontSize: '0.8rem' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Resumen por proveedor */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            {selectedLists.map(l => {
              const wins = rows.filter(r => r.bestListId === l.id).length
              const pct = rows.length > 0 ? Math.round((wins / rows.length) * 100) : 0
              return (
                <div key={l.id} style={{
                  background: 'white',
                  border: '1px solid hsl(220 15% 88%)',
                  borderRadius: 10,
                  padding: '0.875rem 1.25rem',
                  flex: 1,
                  minWidth: 180,
                }}>
                  <p style={{ fontSize: '0.82rem', color: 'hsl(220 15% 45%)', marginBottom: 4 }}>{l.supplier.name}</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 600, color: 'hsl(221 89% 45%)' }}>{wins}</p>
                  <p style={{ fontSize: '0.8rem', color: 'hsl(220 10% 55%)' }}>mejor precio ({pct}% de productos)</p>
                </div>
              )
            })}
          </div>
        </>
      )}

      <PanelSimulador items={selectedItems} onClear={() => { setCheckedRows(new Set()); setSelectedItems([]) }} />
    </div>
  )
}
