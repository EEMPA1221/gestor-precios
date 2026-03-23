'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Truck, Search, ChevronRight, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { Supplier } from '@/types'

export default function ProveedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', contact: '', phone: '', email: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchSuppliers() }, [])

  async function fetchSuppliers() {
    setLoading(true)
    const res = await fetch('/api/proveedores')
    const data = await res.json()
    setSuppliers(data)
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/proveedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Proveedor creado')
      setShowModal(false)
      setForm({ name: '', contact: '', phone: '', email: '', notes: '' })
      fetchSuppliers()
    } else {
      const err = await res.json()
      toast.error(err.error ?? 'Error al crear proveedor')
    }
  }

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Proveedores</h1>
          <p style={{ color: 'hsl(220 15% 50%)', fontSize: '0.875rem', marginTop: 2 }}>
            {suppliers.length} proveedor{suppliers.length !== 1 ? 'es' : ''} registrado{suppliers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px',
            background: 'hsl(221 89% 54%)',
            color: 'white', border: 'none', borderRadius: 9,
            fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <Plus size={16} /> Nuevo proveedor
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: 360 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(220 10% 55%)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar proveedor..."
          style={{
            width: '100%', padding: '9px 12px 9px 36px',
            border: '1.5px solid hsl(220 15% 88%)', borderRadius: 9,
            fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid hsl(220 15% 88%)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(220 10% 55%)' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Truck size={36} color="hsl(220 10% 70%)" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ color: 'hsl(220 10% 55%)', fontSize: '0.9rem' }}>
              {search ? 'Sin resultados para tu búsqueda' : 'No hay proveedores cargados aún'}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Listas</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(supplier => (
                <tr key={supplier.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'hsl(221 89% 95%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Truck size={15} color="hsl(221 89% 45%)" />
                      </div>
                      <span style={{ fontWeight: 500 }}>{supplier.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'hsl(220 15% 45%)' }}>{supplier.contact ?? '—'}</td>
                  <td style={{ color: 'hsl(220 15% 45%)' }}>{supplier.phone ?? '—'}</td>
                  <td>
                    <span style={{
                      background: 'hsl(220 15% 94%)',
                      borderRadius: 6, padding: '2px 8px',
                      fontSize: '0.8rem', fontWeight: 500,
                    }}>
                      {(supplier as any)._count?.priceLists ?? 0}
                    </span>
                  </td>
                  <td>
                    {supplier.active ? (
                      <span className="badge badge-success"><CheckCircle size={11} /> Activo</span>
                    ) : (
                      <span className="badge badge-neutral"><XCircle size={11} /> Inactivo</span>
                    )}
                  </td>
                  <td>
                    <Link href={`/proveedores/${supplier.id}`} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      color: 'hsl(221 89% 50%)', textDecoration: 'none',
                      fontSize: '0.82rem', fontWeight: 500,
                    }}>
                      Ver <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '1rem',
        }} onClick={() => setShowModal(false)}>
          <div
            style={{
              background: 'white', borderRadius: 14, padding: '1.75rem',
              width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Nuevo proveedor</h2>
            <form onSubmit={handleCreate}>
              {[
                { label: 'Nombre *', key: 'name', required: true, placeholder: 'Ej: Distribuidora del Norte' },
                { label: 'Contacto', key: 'contact', placeholder: 'Nombre de la persona' },
                { label: 'Teléfono', key: 'phone', placeholder: '011-xxxx-xxxx' },
                { label: 'Email', key: 'email', placeholder: 'ventas@proveedor.com' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'hsl(220 25% 25%)', marginBottom: 4 }}>
                    {field.label}
                  </label>
                  <input
                    value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    required={field.required}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%', padding: '9px 12px',
                      border: '1.5px solid hsl(220 15% 88%)', borderRadius: 8,
                      fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>
              ))}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'hsl(220 25% 25%)', marginBottom: 4 }}>
                  Observaciones
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: '1.5px solid hsl(220 15% 88%)', borderRadius: 8,
                    fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 16px', border: '1px solid hsl(220 15% 88%)',
                    borderRadius: 8, background: 'white', cursor: 'pointer',
                    fontSize: '0.875rem', fontFamily: 'inherit',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '8px 20px',
                    background: saving ? 'hsl(221 89% 65%)' : 'hsl(221 89% 54%)',
                    color: 'white', border: 'none', borderRadius: 8,
                    fontSize: '0.875rem', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {saving ? 'Guardando...' : 'Crear proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
