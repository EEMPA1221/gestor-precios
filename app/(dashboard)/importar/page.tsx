'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, AlertCircle, Trash2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Supplier { id: string; name: string }
interface ParsedItem {
  originalName: string
  costPrice: number
  code?: string
  presentation?: string
  ivaRate: 'NONE' | 'TEN_FIVE' | 'TWENTY_ONE'
  isDuplicate?: boolean
  hasError?: boolean
}

export default function ImportarPDFPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [listDate, setListDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [items, setItems] = useState<ParsedItem[]>([])
  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'upload' | 'rawtext' | 'preview'>('upload')

  useEffect(() => {
    fetch('/api/proveedores')
      .then(r => r.json())
      .then(setSuppliers)
  }, [])

  function updateItem(index: number, field: keyof ParsedItem, value: any) {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value, hasError: !item.originalName || Number(item.costPrice) <= 0 } : item
    ))
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function addItem() {
    setItems(prev => [...prev, { originalName: '', costPrice: 0, ivaRate: 'NONE', hasError: true }])
  }

  async function handleSave() {
    const valid = items.filter(i => !i.hasError && i.originalName && i.costPrice > 0)
    if (valid.length === 0) { setError('No hay items válidos para guardar'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/listas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          listDate,
          fileName: file?.name,
          items: valid,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      router.push('/listas')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload() {
    if (!file || !supplierId || !listDate) {
      setError('Completá todos los campos')
      return
    }
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('supplierId', supplierId)
      formData.append('listDate', listDate)
      const res = await fetch('/api/importar-pdf', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al procesar')
      if (data.items) {
        setItems(data.items)
        setStep('preview')
      } else if (data.rawText) {
        setRawText(data.rawText)
        setStep('rawtext')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{ padding: '2rem', maxWidth: 800 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        Importar lista desde PDF
      </h1>
      <p style={{ color: 'rgba(0,0,0,0.5)', marginBottom: '2rem' }}>
        Subí un PDF con texto seleccionable y lo convertimos automáticamente.
      </p>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', borderRadius: 8, marginBottom: '1rem',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: 'hsl(0 72% 50%)', fontSize: '0.875rem',
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {step === 'upload' && (
        <div style={{
          background: 'white', border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 12, padding: '1.5rem',
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, fontSize: '0.875rem' }}>
              Proveedor
            </label>
            <select
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.2)', fontSize: '0.875rem',
              }}>
              <option value=''>Seleccioná un proveedor</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, fontSize: '0.875rem' }}>
              Fecha de vigencia
            </label>
            <select
              value={listDate}
              onChange={e => setListDate(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.2)', fontSize: '0.875rem',
              }}>
              <option value=''>Seleccioná una fecha</option>
              <option value={today}>{today}</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, fontSize: '0.875rem' }}>
              Archivo PDF
            </label>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              border: '2px dashed rgba(0,0,0,0.15)', borderRadius: 10,
              padding: '1.5rem', cursor: 'pointer',
              background: file ? 'rgba(34,197,94,0.05)' : 'rgba(0,0,0,0.02)',
            }}>
              <input
                type='file'
                accept='.pdf'
                onChange={e => setFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
              />
              <FileText size={28} color={file ? 'hsl(142 71% 45%)' : 'rgba(0,0,0,0.3)'} />
              {file ? (
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(142 71% 35%)' }}>
                  {file.name}
                </span>
              ) : (
                <span style={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.4)' }}>
                  Tocá para seleccionar un PDF
                </span>
              )}
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 8,
              background: 'hsl(221 89% 54%)', color: 'white',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 500, fontSize: '0.875rem', opacity: loading ? 0.7 : 1,
            }}>
            <Upload size={16} />
            {loading ? 'Procesando...' : 'Procesar'}
          </button>
        </div>
      )}

      {step === 'preview' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ fontWeight: 500 }}>{items.length} productos encontrados</p>
            <button
              onClick={addItem}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8,
                background: 'rgba(0,0,0,0.06)', border: 'none',
                cursor: 'pointer', fontSize: '0.875rem',
              }}>
              <Plus size={14} /> Agregar fila
            </button>
          </div>

          <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.04)' }}>
                  {['Producto', 'Precio', 'IVA', ''].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: item.hasError ? 'rgba(239,68,68,0.04)' : 'white' }}>
                    <td style={{ padding: '6px 10px' }}>
                      <input
                        value={item.originalName}
                        onChange={e => updateItem(i, 'originalName', e.target.value)}
                        style={{ width: '100%', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 6, padding: '4px 8px' }}
                      />
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <input
                        type='number'
                        value={item.costPrice}
                        onChange={e => updateItem(i, 'costPrice', parseFloat(e.target.value))}
                        style={{ width: 90, border: '1px solid rgba(0,0,0,0.15)', borderRadius: 6, padding: '4px 8px' }}
                      />
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <select
                        value={item.ivaRate}
                        onChange={e => updateItem(i, 'ivaRate', e.target.value)}
                        style={{ border: '1px solid rgba(0,0,0,0.15)', borderRadius: 6, padding: '4px 8px' }}>
                        <option value='NONE'>Sin IVA</option>
                        <option value='TEN_FIVE'>10.5%</option>
                        <option value='TWENTY_ONE'>21%</option>
                      </select>
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(0 72% 50%)' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep('upload')}
              style={{
                padding: '10px 20px', borderRadius: 8,
                background: 'rgba(0,0,0,0.06)', border: 'none',
                cursor: 'pointer', fontWeight: 500,
              }}>
              Volver
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 20px', borderRadius: 8,
                background: 'hsl(142 71% 40%)', color: 'white',
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 500, opacity: saving ? 0.7 : 1,
              }}>
              {saving ? 'Guardando...' : 'Guardar lista'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
      }
