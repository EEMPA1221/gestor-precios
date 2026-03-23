'use client'

import { useState, useMemo } from 'react'
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Search, ChevronLeft, ChevronRight
} from 'lucide-react'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  numeric?: boolean
  render?: (row: T) => React.ReactNode
  width?: string
}

interface TablaProps<T extends { id: string }> {
  data: T[]
  columns: Column<T>[]
  selectable?: boolean
  onSelect?: (ids: string[]) => void
  searchKeys?: (keyof T)[]
  pageSize?: number
  emptyText?: string
  loading?: boolean
  actions?: (row: T) => React.ReactNode
}

type SortDir = 'asc' | 'desc' | null

export default function Tabla<T extends { id: string }>({
  data,
  columns,
  selectable = false,
  onSelect,
  searchKeys = [],
  pageSize = 25,
  emptyText = 'No hay datos',
  loading = false,
  actions,
}: TablaProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(row =>
      searchKeys.some(k => {
        const val = row[k]
        return val != null && String(val).toLowerCase().includes(q)
      })
    )
  }, [data, search, searchKeys])

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    return [...filtered].sort((a, b) => {
      const av = (a as any)[sortKey]
      const bv = (b as any)[sortKey]
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = typeof av === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'es-AR')
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

  function toggleSort(key: string) {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc') }
    else if (sortDir === 'asc') setSortDir('desc')
    else { setSortKey(null); setSortDir(null) }
  }

  function toggleRow(id: string) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
    onSelect?.(Array.from(next))
  }

  function toggleAll() {
    if (selected.size === paginated.length) {
      setSelected(new Set())
      onSelect?.([])
    } else {
      const ids = new Set(paginated.map(r => r.id))
      setSelected(ids)
      onSelect?.(Array.from(ids))
    }
  }

  function SortIcon({ col }: { col: Column<T> }) {
    if (!col.sortable) return null
    if (sortKey !== col.key) return <ChevronsUpDown size={13} style={{ opacity: 0.3, marginLeft: 4 }} />
    if (sortDir === 'asc') return <ChevronUp size={13} style={{ marginLeft: 4, color: 'hsl(221 89% 54%)' }} />
    return <ChevronDown size={13} style={{ marginLeft: 4, color: 'hsl(221 89% 54%)' }} />
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
      }}>
        {searchKeys.length > 0 && (
          <div style={{ position: 'relative', flex: '1', minWidth: 200, maxWidth: 360 }}>
            <Search size={15} style={{
              position: 'absolute', left: 10, top: '50%',
              transform: 'translateY(-50%)',
              color: 'hsl(220 10% 55%)',
              pointerEvents: 'none',
            }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar..."
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                border: '1px solid hsl(220 15% 88%)',
                borderRadius: 8,
                fontSize: '0.875rem',
                outline: 'none',
                background: 'white',
                fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = 'hsl(221 89% 54%)'}
              onBlur={e => e.target.style.borderColor = 'hsl(220 15% 88%)'}
            />
          </div>
        )}
        <span style={{ fontSize: '0.8rem', color: 'hsl(220 10% 55%)', marginLeft: 'auto' }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          {selected.size > 0 && ` · ${selected.size} seleccionado${selected.size !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Table */}
      <div style={{
        background: 'white',
        border: '1px solid hsl(220 15% 88%)',
        borderRadius: 10,
        overflow: 'auto',
      }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(220 10% 55%)' }}>
            Cargando...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {selectable && (
                  <th style={{ width: 40, padding: '10px 12px' }}>
                    <input
                      type="checkbox"
                      checked={selected.size === paginated.length && paginated.length > 0}
                      onChange={toggleAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                )}
                {columns.map(col => (
                  <th
                    key={col.key}
                    style={{ width: col.width, textAlign: col.numeric ? 'right' : 'left' }}
                    onClick={() => col.sortable && toggleSort(col.key)}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {col.label}
                      <SortIcon col={col} />
                    </span>
                  </th>
                ))}
                {actions && <th style={{ width: 80 }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                    style={{ padding: '3rem', textAlign: 'center', color: 'hsl(220 10% 55%)' }}
                  >
                    {emptyText}
                  </td>
                </tr>
              ) : (
                paginated.map(row => (
                  <tr
                    key={row.id}
                    style={{
                      background: selected.has(row.id) ? 'hsl(221 89% 98%)' : undefined,
                    }}
                  >
                    {selectable && (
                      <td style={{ width: 40, padding: '10px 12px' }}>
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          onChange={() => toggleRow(row.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                    )}
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={col.numeric ? 'num' : undefined}
                      >
                        {col.render
                          ? col.render(row)
                          : String((row as any)[col.key] ?? '—')}
                      </td>
                    ))}
                    {actions && (
                      <td>{actions(row)}</td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: '0.75rem',
          fontSize: '0.85rem',
          color: 'hsl(220 15% 40%)',
        }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            style={btnStyle(page === 1)}
          >
            <ChevronLeft size={14} />
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            style={btnStyle(page === totalPages)}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

function btnStyle(disabled: boolean) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    border: '1px solid hsl(220 15% 88%)',
    borderRadius: 6,
    background: 'white',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    color: 'hsl(220 25% 20%)',
  } as React.CSSProperties
}
