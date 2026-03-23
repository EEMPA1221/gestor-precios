'use client'

import { useEffect, useState, useMemo } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { formatPrice, formatPct } from '@/lib/calculos'
import PanelSimulador from '@/components/simulador/PanelSimulador'
import type { ListItem } from '@/types'

interface Lista {
  id: string
  listDate: string
  fileName: string | null
  supplier: { id: string; name: string }
  _count: { items: number }
}

interface ChangeRow {
  masterProductId: string
  internalName: string
  category: string | null
  oldPrice: number
  newPrice: number
  diff: number
  pctChange: number
  status: 'up' | 'down' | 'same'
  ivaRate: string
}

type Filter = 'all' | 'up' | 'down' | 'same' | 'alert'

export default function CambiosPage() {
  const [allLists, setAllLists] = useState<Lista[]>([])
  const [oldId, setOldId] = useState('')
  const [newId, setNewId] = useState('')
  const [rows, setRows] = useState<ChangeRow[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [alertThreshold, setAlertThreshold] = useState(15)
  const [search, setSearch] = useState('')
  const [selectedItems, setSelectedItems] = useState<ListItem[]>([])
  const [checkedRows, setCheckedRows] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/listas?status=ACTIVE')
      .then(r => r.json())
      .then(setAllLists)
  }, [])

  async function compare() {
    if (!oldId || !newId || oldId === newId) return
    setLoading(true)
    try {
      const [oldList, newList] = await Promise.all([
        fetch(`/api/listas/${oldId}`).then(r => r.json()),
        fetch(`/api/listas/${newId}`).then(r => r.json()),
      ])

      const oldMap = new Map<string, any>()
      for (const item of oldList.items) {
        if (item.masterProductId) oldMap.set(item.masterProductId, item)
      }

      const result: ChangeRow[] = []
      for (const item of newList.items) {
        if (!item.masterProductId) continue
        const old = oldMap.get(item.masterProductId)
        if (!old) continue

        const oldPrice = Number(old.costPrice)
        const newPrice = Number(item.costPrice)
        const diff = newPrice - oldPrice
        const pctChange = oldPrice > 0 ? (diff / oldPrice) * 100 : 0
        const status: 'up' | 'down' | 'same' =
          Math.abs(pctChange) < 0.01 ? 'same' : diff > 0 ? 'up' : 'down'

        result.push({
          masterProductId: item.masterProductId,
          internalName: item.masterProduct?.internalName ?? item.originalName,
          category: item.masterProduct?.category ?? null,
          oldPrice,
          newPrice,
          diff,
          pctChange,
          status,
          ivaRate: item.ivaRate,
        })
      }

      result.sort((a, b) => b.pctChange - a.pctChange)
      setRows(result)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let r = rows
    if (filter === 'up')    r = r.filter(row => row.status === 'up')
    if (filter === 'down')  r = r.filter(row => row.status === 'down')
    if (filter === 'same')  r = r.filter(row => row.status === 'same')
    if (filter === 'alert') r = r.filter(row => row.pctChange >= alertThreshold)
    if (search) r = r.filter(row => row.internalName.toLowerCase().includes(search.toLowerCase()))
    return r
  }, [rows, filter, alertThreshold, search])

  const stats = useMemo(() => ({
    up:    rows.filter(r => r.status === 'up').length,
    down:  rows.filter(r => r.status === 'down').length,
    same:  rows.filter(r => r.status === 'same').length,
    alert: rows.filter(r => r.pctChange >= alertThreshold).length,
    avgUp: rows.filter(r => r.status === 'up').reduce((s, r) => s + r.pctChange, 0) /
           (rows.filter(r => r.status === 'up').length || 1),
  }), [rows, alertThreshold])

  function toggleRow(row: ChangeRow) {
    const next = new Set(checkedRows)
    next.has(row.masterProductId) ? next.delete(row.masterProductId) : next.add(row.masterProductId)
    setCheckedRows(next)
    rebuildItems(next)
  }

  function rebuildItems(ids: Set<string>) {
    const items: ListItem[] = rows
      .filter(r => ids.has(r.masterProductId))
      .map(r => ({
        id: r.masterProductId,
        listId: newId,
        masterProductId: r.masterProductId,
        originalName: r.internalName,
        costPrice: r.newPrice,
        ivaRate: r.ivaRate as any,
        matched: true,
        masterProduct: { id: r.masterProductId, internalName: r.internalName, category: r.category ?? undefined },
      } as any))
    setSelectedItems(items)
  }

  return (
    <div className="animate-in">
      <Link href="/comparaciones" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'hsl(221 89% 54%)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}>
        <ArrowLeft size={14} /> Comparaciones
      </Link>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.25rem' }}>Ver cambios de precios</h1>
      <p style={{ color: 'hsl(220 15% 45%)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Comparar lista anterior vs nueva del mismo proveedor
      </p>

      {/* Selector */}
      <div style={{ background: 'white', border: '1px solid hsl(220 15% 88%)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: '1rem', alignItems: 'end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.82rem', fontWeight: 500, color: 'hsl(220 20% 30%)' }}>
            Lista anterior
            <select value={oldId} onChange={e => setOldId(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid hsl(220 15% 88%)', borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none' }}>
              <option value="">Seleccionar...</option>
              {allLists.map(l => (
                <option key={l.id} value={l.id}>
                  {l.supplier.name} — {new Date(l.listDate).toLocaleDateString('es-AR')} ({l._count.items} prod.)
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 8 }}>
            <span style={{ fontSize: '1.25rem', color: 'hsl(220 10% 55%)' }}>→</span>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.82rem', fontWeight: 500, color: 'hsl(220 20% 30%)' }}>
            Lista nueva
            <select value={newId} onChange={e => setNewId(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid hsl(220 15% 88%)', borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none' }}>
              <option value="">Seleccionar...</option>
              {allLists.map(l => (
                <option key={l.id} value={l.id} disabled={l.id === oldId}>
                  {l.supplier.name} — {new Date(l.listDate).toLocaleDateString('es-AR')} ({l._count.items} prod.)
                </option>
              ))}
            </select>
          </label>

          <button onClick={compare} disabled={!oldId || !newId || oldId === newId || loading}
            style={{
              padding: '9px 20px', background: (!oldId || !newId) ? 'hsl(220 10% 70%)' : 'hsl(221 89% 54%)',
              color: 'white', border: 'none', borderRadius: 9, fontSize: '0.875rem',
              fontWeight: 500, cursor: (!oldId || !newId) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
            {loading ? 'Comparando...' : 'Comparar'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {rows.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem', marginBottom: '1.25rem' }}>
            {[
              { label: 'Aumentaron', value: stats.up, icon: <TrendingUp size={18} />, bg: 'hsl(0 84% 96%)', color: 'hsl(0 84% 40%)', filter: 'up' as Filter },
              { label: 'Bajaron', value: stats.down, icon: <TrendingDown size={18} />, bg: 'hsl(142 71% 95%)', color: 'hsl(142 71% 32%)', filter: 'down' as Filter },
              { label: 'Sin cambios', value: stats.same, icon: <Minus size={18} />, bg: 'hsl(220 12% 95%)', color: 'hsl(220 10% 40%)', filter: 'same' as Filter },
              { label: `Alertas +${alertThreshold}%`, value: stats.alert, icon: <AlertTriangle size={18} />, bg: 'hsl(37 91% 93%)', color: 'hsl(37 91% 32%)', filter: 'alert' as Filter },
            ].map(stat => (
              <div key={stat.label} onClick={() => setFilter(f => f === stat.filter ? 'all' : stat.filter)}
                style={{
                  background: 'white', border: `2px solid ${filter === stat.filter ? stat.color : 'hsl(220 15% 88%)'}`,
                  borderRadius: 10, padding: '0.875rem 1rem', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 700, color: stat.color }}>{stat.value}</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'hsl(220 10% 50%)' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Alerta promedio */}
          {stats.up > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'hsl(37 91% 95%)', border: '1px solid hsl(37 91% 80%)',
              borderRadius: 8, padding: '10px 14px', marginBottom: '1rem',
              fontSize: '0.85rem', color: 'hsl(37 91% 28%)',
            }}>
              <AlertTriangle size={15} />
              Promedio de aumento: <strong>{stats.avgUp.toFixed(1)}%</strong>
              {stats.alert > 0 && ` · ${stats.alert} producto${stats.alert !== 1 ? 's' : ''} con aumento ≥${alertThreshold}%`}
            </div>
          )}

          {/* Tabla */}
          <div style={{ display: 'flex', gap: 10, marginBottom: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              style={{ padding: '7px 12px', border: '1px solid hsl(220 15% 88%)', borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', width: 220 }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'hsl(220 15% 35%)' }}>
              Umbral alerta:
              <input type="number" value={alertThreshold} onChange={e => setAlertThreshold(Number(e.target.value))}
                style={{ width: 52, padding: '5px 8px', border: '1px solid hsl(220 15% 88%)', borderRadius: 6, fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', textAlign: 'center' }} />%
            </label>
            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'hsl(220 10% 55%)' }}>
              {filtered.length} productos
              {checkedRows.size > 0 && ` · ${checkedRows.size} en simulador`}
            </span>
          </div>

          <div style={{ background: 'white', border: '1px solid hsl(220 15% 88%)', borderRadius: 12, overflow: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Producto</th>
                  <th>Rubro</th>
                  <th style={{ textAlign: 'right' }}>Precio anterior</th>
                  <th style={{ textAlign: 'right' }}>Precio nuevo</th>
                  <th style={{ textAlign: 'right' }}>Diferencia $</th>
                  <th style={{ textAlign: 'right' }}>Variación</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const isAlert = row.pctChange >= alertThreshold
                  return (
                    <tr key={row.masterProductId}
                      style={{ background: checkedRows.has(row.masterProductId) ? 'hsl(221 89% 98%)' : isAlert ? 'hsl(37 91% 99%)' : undefined }}>
                      <td style={{ width: 40 }}>
                        <input type="checkbox" checked={checkedRows.has(row.masterProductId)}
                          onChange={() => toggleRow(row)} style={{ cursor: 'pointer' }} />
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {isAlert && <AlertTriangle size={12} style={{ color: 'hsl(37 91% 45%)', marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }} />}
                        {row.internalName}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'hsl(220 10% 50%)' }}>{row.category ?? '—'}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', color: 'hsl(220 10% 50%)' }}>{formatPrice(row.oldPrice)}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{formatPrice(row.newPrice)}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', color: row.diff > 0 ? 'hsl(0 84% 45%)' : row.diff < 0 ? 'hsl(142 71% 32%)' : 'hsl(220 10% 55%)' }}>
                        {row.diff > 0 ? '+' : ''}{formatPrice(row.diff)}
                      </td>
                      <td className="num">
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 999,
                          fontSize: '0.75rem', fontWeight: 600,
                          background: row.status === 'up' ? (isAlert ? 'hsl(0 84% 93%)' : 'hsl(37 91% 93%)') : row.status === 'down' ? 'hsl(142 71% 94%)' : 'hsl(220 12% 93%)',
                          color: row.status === 'up' ? (isAlert ? 'hsl(0 84% 38%)' : 'hsl(37 91% 32%)') : row.status === 'down' ? 'hsl(142 71% 28%)' : 'hsl(220 10% 40%)',
                        }}>
                          {formatPct(row.pctChange)}
                        </span>
                      </td>
                      <td>
                        {row.status === 'up'   && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: isAlert ? 'hsl(0 84% 45%)' : 'hsl(37 91% 38%)' }}><TrendingUp size={13} /> Subió</span>}
                        {row.status === 'down' && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'hsl(142 71% 32%)' }}><TrendingDown size={13} /> Bajó</span>}
                        {row.status === 'same' && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'hsl(220 10% 50%)' }}><Minus size={13} /> Igual</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <PanelSimulador items={selectedItems} onClear={() => { setCheckedRows(new Set()); setSelectedItems([]) }} />
    </div>
  )
}
