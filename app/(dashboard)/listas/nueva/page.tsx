'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Supplier } from '@/types'

interface ItemForm {
  id: string
  originalName: string
  costPrice: string
  ivaRate: string
  presentation: string
  notes: string
}

function emptyItem(): ItemForm {
  return { id: Math.random().toString(36).slice(2), originalName: '', costPrice: '', ivaRate: 'NONE', presentation: '', notes: '' }
}

export default function NuevaListaPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [listDate, setListDate] = useState(new Date().toISOString().split('T')[0])
  const [fileName, setFileName] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ItemForm[]>([emptyItem()])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/proveedores').then(r => r.json()).then(setSuppliers)
  }, [])

  function addItem() {
    setItems(prev => [...prev, emptyItem()])
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateItem(id: string, field: keyof ItemForm, value: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  async function handleSave() {
    if (!supplierId) { toast.error('Seleccioná un proveedor'); return }
    if (!listDate)   { toast.error('Ingresá la fecha de la lista'); return }

    const validItems = items.filter(i => i.originalName.trim() && i.costPrice)
    if (validItems.length === 0) { toast.error('Agregá al menos un producto'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/listas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          listDate,
          fileName: fileName || undefined,
          notes: notes || undefined,
          items: validItems.map(i => ({
            originalName: i.originalName.trim(),
            costPrice: parseFloat(i.costPrice),
            ivaRate: i.ivaRate,
            presentation: i.presentation || undefined,
            notes: i.notes || undefined,
          })),
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      toast.success('Lista guardada correctamente')
      router.push('/listas')
    } catch {
      toast.error('Error al guardar la lista')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-in" style={{ maxWidth: 900 }}>
      <Link href="/listas" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'hsl(221 89% 54%)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}>
        <ArrowLeft size={14} /> Volver
      </Link>

      <h1 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.25rem' }}>Nueva lista de precios</h1>
      <p style={{ color: 'hsl(220 15% 45%)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Cargá manualmente los datos de la lista</p>

      {/* Datos generales */}
      <div style={{
        background: 'white',
        border: '1px solid hsl(220 15% 88%)',
        borderRadius: 12,
        padding: '1.5rem',
        marginBottom: '1.25rem',
      }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Datos generales</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label style={labelStyle}>
            Proveedor *
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} style={inputStyle}>
              <option value="">Seleccionar...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Fecha de la lista *
            <input type="date" value={listDate} onChange={e => setListDate(e.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Nombre de archivo (opcional)
            <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} placeholder="lista_junio.xlsx" style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Observaciones
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: lista actualizada con descuentos" style={inputStyle} />
          </label>
        </div>
      </div>

      {/* Productos */}
      <div style={{
        background: 'white',
        border: '1px solid hsl(220 15% 88%)',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: '1.25rem',
      }}>
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid hsl(220 15% 92%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
            Productos ({items.filter(i => i.originalName.trim()).length})
          </h2>
          <button onClick={addItem} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', background: 'hsl(221 89% 54%)', color: 'white',
            border: 'none', borderRadius: 7, fontSize: '0.82rem', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Plus size={14} /> Agregar fila
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'hsl(220 15% 97%)' }}>
                <th style={thStyle}>Nombre del producto *</th>
                <th style={{ ...thStyle, width: 130 }}>Precio costo *</th>
                <th style={{ ...thStyle, width: 130 }}>IVA</th>
                <th style={{ ...thStyle, width: 140 }}>Presentación</th>
                <th style={{ ...thStyle, width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid hsl(220 15% 94%)' }}>
                  <td style={{ padding: '6px 12px' }}>
                    <input
                      value={item.originalName}
                      onChange={e => updateItem(item.id, 'originalName', e.target.value)}
                      placeholder={`Producto ${idx + 1}`}
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <input
                      type="number"
                      value={item.costPrice}
                      onChange={e => updateItem(item.id, 'costPrice', e.target.value)}
                      placeholder="0.00"
                      style={{ ...cellInputStyle, textAlign: 'right' }}
                    />
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <select value={item.ivaRate} onChange={e => updateItem(item.id, 'ivaRate', e.target.value)} style={cellInputStyle}>
                      <option value="NONE">Sin IVA</option>
                      <option value="TEN_FIVE">10.5%</option>
                      <option value="TWENTY_ONE">21%</option>
                    </select>
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <input
                      value={item.presentation}
                      onChange={e => updateItem(item.id, 'presentation', e.target.value)}
                      placeholder="Ej: 1L, 500g"
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      style={{
                        background: 'none', border: 'none', cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                        color: 'hsl(0 84% 60%)', opacity: items.length === 1 ? 0.3 : 1, padding: 4,
                        display: 'flex', alignItems: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Link href="/listas" style={{
          padding: '9px 20px', border: '1px solid hsl(220 15% 85%)',
          borderRadius: 9, fontSize: '0.875rem', color: 'hsl(220 25% 30%)',
          textDecoration: 'none', fontWeight: 500, background: 'white',
        }}>
          Cancelar
        </Link>
        <button onClick={handleSave} disabled={saving} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 20px', background: saving ? 'hsl(221 89% 65%)' : 'hsl(221 89% 54%)',
          color: 'white', border: 'none', borderRadius: 9, fontSize: '0.875rem',
          fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        }}>
          <Save size={15} />
          {saving ? 'Guardando...' : 'Guardar lista'}
        </button>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 5,
  fontSize: '0.82rem', fontWeight: 500, color: 'hsl(220 25% 25%)',
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid hsl(220 15% 88%)',
  borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit',
  outline: 'none', background: 'white', color: 'hsl(220 25% 10%)',
}

const thStyle: React.CSSProperties = {
  padding: '9px 12px', textAlign: 'left', fontWeight: 500,
  fontSize: '0.78rem', color: 'hsl(220 15% 40%)',
  borderBottom: '1px solid hsl(220 15% 90%)',
}

const cellInputStyle: React.CSSProperties = {
  width: '100%', padding: '5px 8px',
  border: '1px solid hsl(220 15% 88%)', borderRadius: 6,
  fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none',
  background: 'white',
}
