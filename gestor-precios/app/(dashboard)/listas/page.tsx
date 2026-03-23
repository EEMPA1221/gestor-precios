'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Eye, FileSpreadsheet, CalendarDays } from 'lucide-react'
import Tabla, { Column } from '@/components/tablas/Tabla'

interface Lista {
  id: string
  listDate: string
  fileName: string | null
  status: string
  notes: string | null
  createdAt: string
  supplier: { name: string }
  uploadedBy: { name: string }
  _count: { items: number }
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  ACTIVE:    { label: 'Activa',    bg: 'hsl(142 71% 94%)', color: 'hsl(142 71% 28%)' },
  PENDING:   { label: 'Pendiente', bg: 'hsl(37 91% 93%)',  color: 'hsl(37 91% 28%)' },
  REVIEWING: { label: 'Revisión',  bg: 'hsl(221 89% 94%)', color: 'hsl(221 89% 35%)' },
  ARCHIVED:  { label: 'Archivada', bg: 'hsl(220 12% 92%)', color: 'hsl(220 10% 45%)' },
}

export default function ListasPage() {
  const [data, setData] = useState<Lista[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    const params = filterStatus ? `?status=${filterStatus}` : ''
    fetch(`/api/listas${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [filterStatus])

  const columns: Column<Lista>[] = [
    {
      key: 'supplier',
      label: 'Proveedor',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 500 }}>{row.supplier?.name}</span>
      ),
    },
    {
      key: 'listDate',
      label: 'Fecha lista',
      sortable: true,
      render: (row) => new Date(row.listDate).toLocaleDateString('es-AR'),
    },
    {
      key: 'fileName',
      label: 'Archivo',
      render: (row) => (
        <span style={{ fontSize: '0.82rem', color: 'hsl(220 10% 50%)' }}>
          {row.fileName || '—'}
        </span>
      ),
    },
    {
      key: '_count',
      label: 'Productos',
      numeric: true,
      sortable: true,
      render: (row) => row._count?.items ?? 0,
    },
    {
      key: 'status',
      label: 'Estado',
      render: (row) => {
        const s = STATUS_MAP[row.status] ?? STATUS_MAP.PENDING
        return (
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 999,
            fontSize: '0.75rem',
            fontWeight: 500,
            background: s.bg,
            color: s.color,
          }}>{s.label}</span>
        )
      },
    },
    {
      key: 'uploadedBy',
      label: 'Subida por',
      render: (row) => (
        <span style={{ fontSize: '0.85rem', color: 'hsl(220 10% 45%)' }}>
          {row.uploadedBy?.name}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Cargada',
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: '0.82rem', color: 'hsl(220 10% 55%)' }}>
          {new Date(row.createdAt).toLocaleDateString('es-AR')}
        </span>
      ),
    },
  ]

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Listas de precios</h1>
          <p style={{ color: 'hsl(220 15% 45%)', fontSize: '0.875rem', marginTop: 2 }}>
            Historial de listas por proveedor
          </p>
        </div>
        <Link href="/listas/nueva" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '9px 18px',
          background: 'hsl(221 89% 54%)',
          color: 'white',
          borderRadius: 9,
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}>
          <Plus size={16} />
          Nueva lista
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['', 'ACTIVE', 'PENDING', 'REVIEWING', 'ARCHIVED'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding: '5px 14px',
              borderRadius: 999,
              border: '1px solid',
              borderColor: filterStatus === s ? 'hsl(221 89% 54%)' : 'hsl(220 15% 85%)',
              background: filterStatus === s ? 'hsl(221 89% 94%)' : 'white',
              color: filterStatus === s ? 'hsl(221 89% 40%)' : 'hsl(220 15% 40%)',
              fontSize: '0.82rem',
              fontWeight: filterStatus === s ? 600 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.1s',
            }}
          >
            {s === '' ? 'Todas' : STATUS_MAP[s]?.label ?? s}
          </button>
        ))}
      </div>

      <Tabla
        data={data}
        columns={columns}
        loading={loading}
        searchKeys={['fileName'] as any}
        pageSize={20}
        emptyText="No hay listas cargadas"
        actions={(row) => (
          <Link
            href={`/listas/${row.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              border: '1px solid hsl(220 15% 85%)',
              borderRadius: 6,
              fontSize: '0.78rem',
              color: 'hsl(220 25% 30%)',
              textDecoration: 'none',
              background: 'white',
              whiteSpace: 'nowrap',
            }}
          >
            <Eye size={13} />
            Ver
          </Link>
        )}
      />
    </div>
  )
}
