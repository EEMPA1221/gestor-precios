'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Calculator } from 'lucide-react'
import Link from 'next/link'
import Tabla, { Column } from '@/components/tablas/Tabla'
import PanelSimulador from '@/components/simulador/PanelSimulador'
import { formatPrice, IVA_LABELS } from '@/lib/calculos'
import type { ListItem } from '@/types'

interface ListaDetalle {
  id: string
  listDate: string
  fileName: string | null
  status: string
  notes: string | null
  supplier: { name: string }
  uploadedBy: { name: string }
  items: ListItem[]
}

export default function ListaDetallePage() {
  const { id } = useParams()
  const [lista, setLista] = useState<ListaDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<ListItem[]>([])

  useEffect(() => {
    fetch(`/api/listas/${id}`)
      .then(r => r.json())
      .then(d => { setLista(d); setLoading(false) })
  }, [id])

  function handleSelect(ids: string[]) {
    if (!lista) return
    setSelectedItems(lista.items.filter(i => ids.includes(i.id)))
  }

  const columns: Column<ListItem>[] = [
    {
      key: 'originalName',
      label: 'Nombre original',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 500 }}>{row.originalName}</span>
      ),
    },
    {
      key: 'internalName',
      label: 'Nombre interno',
      render: (row) => row.masterProduct
        ? <span style={{ color: 'hsl(142 71% 35%)', fontSize: '0.85rem' }}>{row.masterProduct.internalName}</span>
        : <span style={{ color: 'hsl(37 91% 45%)', fontSize: '0.8rem' }}>Sin asignar</span>,
    },
    {
      key: 'category',
      label: 'Rubro',
      render: (row) => (
        <span style={{ fontSize: '0.82rem', color: 'hsl(220 10% 45%)' }}>
          {row.masterProduct?.category ?? '—'}
        </span>
      ),
    },
    {
      key: 'presentation',
      label: 'Presentación',
      render: (row) => (
        <span style={{ fontSize: '0.82rem', color: 'hsl(220 10% 50%)' }}>
          {row.presentation ?? '—'}
        </span>
      ),
    },
    {
      key: 'costPrice',
      label: 'Precio costo',
      numeric: true,
      sortable: true,
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
          {formatPrice(Number(row.costPrice))}
        </span>
      ),
    },
    {
      key: 'ivaRate',
      label: 'IVA',
      render: (row) => (
        <span style={{ fontSize: '0.78rem', color: 'hsl(220 10% 50%)' }}>
          {IVA_LABELS[row.ivaRate]}
        </span>
      ),
    },
    {
      key: 'matched',
      label: 'Coincidencia',
      render: (row) => row.matched
        ? <span style={{ color: 'hsl(142 71% 35%)', fontSize: '0.8rem', fontWeight: 500 }}>✓ OK</span>
        : <span style={{ color: 'hsl(37 91% 38%)', fontSize: '0.8rem' }}>Pendiente</span>,
    },
  ]

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(220 10% 55%)' }}>Cargando...</div>
  if (!lista) return <div style={{ padding: '3rem', textAlign: 'center' }}>Lista no encontrada</div>

  const unmatched = lista.items.filter(i => !i.matched).length

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/listas" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'hsl(221 89% 54%)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          <ArrowLeft size={14} /> Volver a listas
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 600 }}>{lista.supplier.name}</h1>
            <p style={{ color: 'hsl(220 15% 45%)', fontSize: '0.875rem', marginTop: 2 }}>
              {new Date(lista.listDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {lista.fileName && ` · ${lista.fileName}`}
              {' · '}Subida por {lista.uploadedBy.name}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {unmatched > 0 && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                background: 'hsl(37 91% 93%)',
                color: 'hsl(37 91% 30%)',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 500,
              }}>
                {unmatched} sin coincidencia
              </span>
            )}
            {selectedItems.length > 0 && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: 'hsl(221 89% 94%)',
                color: 'hsl(221 89% 35%)',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 500,
              }}>
                <Calculator size={14} />
                {selectedItems.length} en simulador
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hint */}
      {lista.items.length > 0 && (
        <div style={{
          background: 'hsl(221 89% 97%)',
          border: '1px solid hsl(221 89% 88%)',
          borderRadius: 8,
          padding: '10px 16px',
          fontSize: '0.82rem',
          color: 'hsl(221 89% 35%)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Calculator size={14} />
          Seleccioná productos con el checkbox para simular precios de venta en el panel inferior.
        </div>
      )}

      <Tabla
        data={lista.items}
        columns={columns}
        selectable
        onSelect={handleSelect}
        searchKeys={['originalName'] as any}
        pageSize={30}
        emptyText="Esta lista no tiene productos"
      />

      <PanelSimulador
        items={selectedItems}
        onClear={() => setSelectedItems([])}
      />
    </div>
  )
}
