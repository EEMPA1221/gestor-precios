'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Truck, FileSpreadsheet, Eye, Package } from 'lucide-react'

interface Lista {
  id: string
  listDate: string
  fileName: string | null
  status: string
  _count: { items: number }
}

interface Supplier {
  id: string
  name: string
  contact: string | null
  phone: string | null
  email: string | null
  notes: string | null
  active: boolean
  createdAt: string
  priceLists: Lista[]
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  ACTIVE:    { label: 'Activa',    bg: 'hsl(142 71% 94%)', color: 'hsl(142 71% 28%)' },
  PENDING:   { label: 'Pendiente', bg: 'hsl(37 91% 93%)',  color: 'hsl(37 91% 28%)' },
  REVIEWING: { label: 'Revisión',  bg: 'hsl(221 89% 94%)', color: 'hsl(221 89% 35%)' },
  ARCHIVED:  { label: 'Archivada', bg: 'hsl(220 12% 92%)', color: 'hsl(220 10% 45%)' },
}

export default function ProveedorDetallePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/proveedores/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('No encontrado')
        return r.json()
      })
      .then(setSupplier)
      .catch(() => setError('No se pudo cargar el proveedor'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ padding: '2rem', color: 'hsl(220 10% 55%)' }}>Cargando...</div>
  )

  if (error || !supplier) return (
    <div style={{ padding: '2rem' }}>
      <Link href="/proveedores" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'hsl(221 89% 54%)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}>
        <ArrowLeft size={14} /> Proveedores
      </Link>
      <p style={{ color: 'hsl(0 72% 45%)' }}>{error || 'Proveedor no encontrado'}</p>
    </div>
  )

  const totalProductos = supplier.priceLists.reduce((sum, l) => sum + l._count.items, 0)

  return (
    <div className="animate-in" style={{ maxWidth: 720 }}>
      <Link href="/proveedores" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'hsl(221 89% 54%)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}>
        <ArrowLeft size={14} /> Proveedores
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.75rem' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'hsl(221 89% 95%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Truck size={22} color="hsl(221 89% 45%)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 2 }}>{supplier.name}</h1>
          <span style={{
            display: 'inline-block', padding: '2px 9px', borderRadius: 999,
            fontSize: '0.75rem', fontWeight: 500,
            background: supplier.active ? 'hsl(142 71% 94%)' : 'hsl(220 12% 92%)',
            color: supplier.active ? 'hsl(142 71% 28%)' : 'hsl(220 10% 45%)',
          }}>
            {supplier.active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Datos del proveedor */}
      <div style={{
        background: 'white', border: '1px solid hsl(220 15% 88%)',
        borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem',
      }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(220 20% 30%)' }}>
          Datos de contacto
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            { label: 'Contacto', value: supplier.contact },
            { label: 'Teléfono', value: supplier.phone },
            { label: 'Email', value: supplier.email },
            { label: 'Registrado', value: new Date(supplier.createdAt).toLocaleDateString('es-AR') },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: '0.75rem', color: 'hsl(220 10% 55%)', marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: '0.875rem', color: value ? 'hsl(220 20% 20%)' : 'hsl(220 10% 65%)' }}>
                {value || '—'}
              </p>
            </div>
          ))}
        </div>
        {supplier.notes && (
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid hsl(220 15% 92%)' }}>
            <p style={{ fontSize: '0.75rem', color: 'hsl(220 10% 55%)', marginBottom: 2 }}>Observaciones</p>
            <p style={{ fontSize: '0.875rem', color: 'hsl(220 20% 30%)' }}>{supplier.notes}</p>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{
          background: 'white', border: '1px solid hsl(220 15% 88%)',
          borderRadius: 10, padding: '0.875rem 1.25rem', flex: 1,
        }}>
          <p style={{ fontSize: '0.75rem', color: 'hsl(220 10% 55%)', marginBottom: 4 }}>Listas cargadas</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(221 89% 45%)' }}>
            {supplier.priceLists.length}
          </p>
        </div>
        <div style={{
          background: 'white', border: '1px solid hsl(220 15% 88%)',
          borderRadius: 10, padding: '0.875rem 1.25rem', flex: 1,
        }}>
          <p style={{ fontSize: '0.75rem', color: 'hsl(220 10% 55%)', marginBottom: 4 }}>Total productos</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(221 89% 45%)' }}>
            {totalProductos}
          </p>
        </div>
      </div>

      {/* Listas */}
      <div style={{
        background: 'white', border: '1px solid hsl(220 15% 88%)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid hsl(220 15% 92%)' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(220 20% 30%)' }}>
            Listas de precios
          </h2>
        </div>

        {supplier.priceLists.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <FileSpreadsheet size={32} color="hsl(220 10% 70%)" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ color: 'hsl(220 10% 55%)', fontSize: '0.875rem' }}>
              No hay listas cargadas para este proveedor
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Archivo</th>
                <th style={{ textAlign: 'right' }}>Productos</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {supplier.priceLists
                .sort((a, b) => new Date(b.listDate).getTime() - new Date(a.listDate).getTime())
                .map(lista => {
                  const s = STATUS_MAP[lista.status] ?? STATUS_MAP.PENDING
                  return (
                    <tr key={lista.id}>
                      <td style={{ fontWeight: 500 }}>
                        {new Date(lista.listDate).toLocaleDateString('es-AR')}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'hsl(220 10% 50%)' }}>
                        {lista.fileName || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.875rem' }}>
                          <Package size={13} color="hsl(220 10% 55%)" />
                          {lista._count.items}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 999,
                          fontSize: '0.75rem', fontWeight: 500,
                          background: s.bg, color: s.color,
                        }}>{s.label}</span>
                      </td>
                      <td>
                        <Link href={`/listas/${lista.id}`} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', border: '1px solid hsl(220 15% 85%)',
                          borderRadius: 6, fontSize: '0.78rem',
                          color: 'hsl(220 25% 30%)', textDecoration: 'none',
                          background: 'white',
                        }}>
                          <Eye size={13} /> Ver
                        </Link>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
    }
