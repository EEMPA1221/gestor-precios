'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calculator, Trash2, CheckCircle, Archive, Pencil } from 'lucide-react'
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

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  ACTIVE:    { label: 'Activa',    bg: 'hsl(142 71% 94%)', color: 'hsl(142 71% 28%)' },
  PENDING:   { label: 'Pendiente', bg: 'hsl(37 91% 93%)',  color: 'hsl(37 91% 28%)' },
  REVIEWING: { label: 'Revisión',  bg: 'hsl(221 89% 94%)', color: 'hsl(221 89% 35%)' },
  ARCHIVED:  { label: 'Archivada', bg: 'hsl(220 12% 92%)', color: 'hsl(220 10% 45%)' },
}

export default function ListaDetallePage() {
  const { id } = useParams()
  const router = useRouter()
  const [lista, setLista] = useState<ListaDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<ListItem[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [editingItem, setEditingItem] = useState<ListItem | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/listas/${id}`)
      .then(r => r.json())
      .then(d => { setLista(d); setLoading(false) })
  }, [id])

  function handleSelect(ids: string[]) {
    if (!lista) return
    setSelectedItems(lista.items.filter(i => ids.includes(i.id)))
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/listas/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/listas')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al eliminar')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function handleStatusChange(status: string) {
    setUpdatingStatus(true)
    const res = await fetch(`/api/listas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setLista(prev => prev ? { ...prev, status: updated.status } : prev)
    }
    setUpdatingStatus(false)
  }

  async function handleEditPrice() {
    if (!editingItem) return
    const precio = parseFloat(editPrice)
    if (isNaN(precio) || precio <= 0) { setError('Precio inválido'); return }

    setSavingEdit(true)
    const res = await fetch(`/api/lista-items/${editingItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ costPrice: precio }),
    })
    if (res.ok) {
      setLista(prev => {
        if (!prev) return prev
        return {
          ...prev,
          items: prev.items.map(i =>
            i.id === editingItem.id ? { ...i, costPrice: precio as any } : i
          ),
        }
      })
      setEditingItem(null)
      setEditPrice('')
    } else {
      setError('No se pudo actualizar el precio')
    }
    setSavingEdit(false)
  }

  const columns: Column<ListItem>[] = [
    {
      key: 'originalName',
      label: 'Nombre original',
      sortable: true,
      render: (row) => <span style={{ fontWeight: 500 }}>{row.originalName}</span>,
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
      key: 'id',
      label: '',
      render: (row) => (
        <button
          onClick={() => { setEditingItem(row); setEditPrice(String(Number(row.costPrice))) }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', border: '1px solid hsl(220 15% 85%)',
            borderRadius: 6, fontSize: '0.78rem', cursor: 'pointer',
            color: 'hsl(220 25% 30%)', background: 'white',
          }}>
          <Pencil size={12} /> Editar precio
        </button>
      ),
    },
  ]

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(220 10% 55%)' }}>Cargando...</div>
  if (!lista) return <div style={{ padding: '3rem', textAlign: 'center' }}>Lista no encontrada</div>

  const statusInfo = STATUS_MAP[lista.status] ?? STATUS_MAP.PENDING

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/listas" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'hsl(221 89% 54%)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          <ArrowLeft size={14} /> Volver a listas
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 600 }}>{lista.supplier.name}</h1>
              <span style={{
                display: 'inline-block', padding: '2px 9px', borderRadius: 999,
                fontSize: '0.75rem', fontWeight: 500,
                background: statusInfo.bg, color: statusInfo.color,
              }}>{statusInfo.label}</span>
            </div>
            <p style={{ color: 'hsl(220 15% 45%)', fontSize: '0.875rem' }}>
              {new Date(lista.listDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {lista.fileName && ` · ${lista.fileName}`}
              {' · '}{lista.items.length} productos
            </p>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {lista.status !== 'ACTIVE' && (
              <button
                onClick={() => handleStatusChange('ACTIVE')}
                disabled={updatingStatus}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  background: 'hsl(142 71% 94%)', color: 'hsl(142 71% 28%)',
                  border: '1px solid hsl(142 71% 80%)',
                  cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
                  fontFamily: 'inherit',
                }}>
                <CheckCircle size={14} /> Marcar activa
              </button>
            )}
            {lista.status !== 'ARCHIVED' && (
              <button
                onClick={() => handleStatusChange('ARCHIVED')}
                disabled={updatingStatus}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  background: 'hsl(220 12% 94%)', color: 'hsl(220 10% 40%)',
                  border: '1px solid hsl(220 12% 82%)',
                  cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
                  fontFamily: 'inherit',
                }}>
                <Archive size={14} /> Archivar
              </button>
            )}
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                background: 'hsl(0 84% 96%)', color: 'hsl(0 84% 40%)',
                border: '1px solid hsl(0 84% 85%)',
                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
                fontFamily: 'inherit',
              }}>
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: '1rem',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          color: 'hsl(0 72% 45%)', fontSize: '0.875rem',
        }}>{error}</div>
      )}

      {selectedItems.length > 0 && (
        <div style={{
          background: 'hsl(221 89% 97%)', border: '1px solid hsl(221 89% 88%)',
          borderRadius: 8, padding: '10px 16px', fontSize: '0.82rem',
          color: 'hsl(221 89% 35%)', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Calculator size={14} />
          {selectedItems.length} producto{selectedItems.length !== 1 ? 's' : ''} seleccionado{selectedItems.length !== 1 ? 's' : ''} en el simulador
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

      <PanelSimulador items={selectedItems} onClear={() => setSelectedItems([])} />

      {/* Modal confirmar eliminar */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '1rem',
        }} onClick={() => setConfirmDelete(false)}>
          <div
            style={{
              background: 'white', borderRadius: 14, padding: '1.75rem',
              width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'hsl(0 84% 96%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={16} color="hsl(0 84% 45%)" />
              </div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Eliminar lista</h2>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'hsl(220 15% 40%)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              ¿Estás seguro que querés eliminar esta lista de <strong>{lista.supplier.name}</strong>?
              Se borrarán también los <strong>{lista.items.length} productos</strong> asociados. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  padding: '8px 16px', border: '1px solid hsl(220 15% 88%)',
                  borderRadius: 8, background: 'white', cursor: 'pointer',
                  fontSize: '0.875rem', fontFamily: 'inherit',
                }}>
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '8px 20px',
                  background: deleting ? 'hsl(0 84% 70%)' : 'hsl(0 84% 50%)',
                  color: 'white', border: 'none', borderRadius: 8,
                  fontSize: '0.875rem', fontWeight: 500,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}>
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar precio */}
      {editingItem && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '1rem',
        }} onClick={() => setEditingItem(null)}>
          <div
            style={{
              background: 'white', borderRadius: 14, padding: '1.75rem',
              width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Editar precio</h2>
            <p style={{ fontSize: '0.82rem', color: 'hsl(220 15% 45%)', marginBottom: '1.25rem' }}>
              {editingItem.originalName}
            </p>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, marginBottom: 6 }}>
                Nuevo precio de costo
              </label>
              <input
                type="number"
                value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
                autoFocus
                style={{
                  width: '100%', padding: '9px 12px',
                  border: '1.5px solid hsl(220 15% 88%)', borderRadius: 8,
                  fontSize: '1rem', outline: 'none', fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingItem(null)}
                style={{
                  padding: '8px 16px', border: '1px solid hsl(220 15% 88%)',
                  borderRadius: 8, background: 'white', cursor: 'pointer',
                  fontSize: '0.875rem', fontFamily: 'inherit',
                }}>
                Cancelar
              </button>
              <button
                onClick={handleEditPrice}
                disabled={savingEdit}
                style={{
                  padding: '8px 20px',
                  background: 'hsl(221 89% 54%)',
                  color: 'white', border: 'none', borderRadius: 8,
                  fontSize: '0.875rem', fontWeight: 500,
                  cursor: savingEdit ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}>
                {savingEdit ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
      }
