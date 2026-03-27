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
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'upload' | 'preview'>('upload')

  useEffect(() => {
    fetch('/api/proveedores')
      .then(r => r.json())
      .then(setSuppliers)
  }, [])

  async function handleProcess() {
    if (!file || !supplierId || !listDate) {
      setError('Completá todos los campos')
      return
    }
    setError('')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/import-pdf', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setItems(data.items.map((item: ParsedItem) => ({
        ...item,
        hasError: !item.originalName || item.costPrice <= 0
      })))
      setStep('preview')
    } catch (e: any) {
      setError(e.message || 'Error al procesar el PDF')
    } finally {
      setLoading(false)
    }
  }

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
        body: JSON.stringify({ supplierId, listDate, fileName: file?.name, items: valid })
      })
      if (!res.ok) throw new Error('Error al guardar')
      router.push('/listas')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const ivaLabels = { NONE: 'Sin IVA', TEN_FIVE: '10.5%', TWENTY_ONE: '21%' }

  if (step === 'preview') return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Vista previa — {items.length} productos detectados
      </h1>
      <p style={{ color: 'hsl(220 15% 45%)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        Revisá y editá antes de guardar. Las filas en rojo tienen errores.
      </p>
      {error && (
        <div style={{ background: 'hsl(0 84% 96%)', border: '1px solid hsl(0 84% 85%)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: 'hsl(0 84% 40%)', fontSize: '0.875rem', display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      <div style={{ overflowX: 'auto', background: 'white', border: '1px solid hsl(220 15% 88%)', borderRadius: 12, marginBottom: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: 'hsl(220 15% 96%)', borderBottom: '1px solid hsl(220 15% 88%)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Producto</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Código</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Presentación</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Precio</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>IVA</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>—</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid hsl(220 15% 92%)',
                background: item.hasError ? 'hsl(0 84% 98%)' : item.isDuplicate ? 'hsl(37 91% 96%)' : 'white'
              }}>
                <td style={{ padding: '6px 12px' }}>
                  <input value={item.originalName} onChange={e => updateItem(i, 'originalName', e.target.value)}
                    style={{ width: '100%', border: '1px solid hsl(220 15% 85%)', borderRadius: 6, padding: '4px 8px', fontSize: '0.82rem', fontFamily: 'inherit' }} />
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <input value={item.code || ''} onChange={e => updateItem(i, 'code', e.target.value)}
                    style={{ width: 80, border: '1px solid hsl(220 15% 85%)', borderRadius: 6, padding: '4px 8px', fontSize: '0.82rem', fontFamily: 'inherit' }} />
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <input value={item.presentation || ''} onChange={e => updateItem(i, 'presentation', e.target.value)}
                    style={{ width: 90, border: '1px solid hsl(220 15% 85%)', borderRadius: 6, padding: '4px 8px', fontSize: '0.82rem', fontFamily: 'inherit' }} />
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <input type="number" value={item.costPrice} onChange={e => updateItem(i, 'costPrice', parseFloat(e.target.value))}
                    style={{ width: 90, border: '1px solid hsl(220 15% 85%)', borderRadius: 6, padding: '4px 8px', fontSize: '0.82rem', fontFamily: 'inherit', textAlign: 'right' }} />
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <select value={item.ivaRate} onChange={e => updateItem(i, 'ivaRate', e.target.value as any)}
                    style={{ border: '1px solid hsl(220 15% 85%)', borderRadius: 6, padding: '4px 8px', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                    {Object.entries(ivaLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                  <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(0 84% 45%)', padding: 4 }}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1.5px dashed hsl(220 15% 75%)', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit', color: 'hsl(220 15% 40%)' }}>
          <Plus size={15} /> Agregar fila
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button onClick={() => setStep('upload')} style={{ padding: '8px 20px', border: '1.5px solid hsl(220 15% 80%)', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', background: saving ? 'hsl(220 10% 70%)' : 'hsl(221 89% 54%)', color: 'white', border: 'none', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 500, fontFamily: 'inherit' }}>
            {saving ? 'Guardando...' : `Confirmar (${items.filter(i => !i.hasError).length} items)`}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 560, padding: '1rem' }}>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.25rem' }}>Importar lista desde PDF</h1>
      <p style={{ color: 'hsl(220 15% 45%)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Subí un PDF con texto seleccionable y lo convertimos automáticamente.
      </p>
      {error && (
        <div style={{ background: 'hsl(0 84% 96%)', border: '1px solid hsl(0 84% 85%)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: 'hsl(0 84% 40%)', fontSize: '0.875rem', display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      <div style={{ background: 'white', border: '1px solid hsl(220 15% 88%)', borderRadius: 12, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Proveedor</label>
          <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', border: '1px solid hsl(220 15% 85%)', borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit' }}>
            <option value="">Seleccioná un proveedor...</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Fecha de vigencia</label>
          <input type="date" value={listDate} onChange={e => setListDate(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', border: '1px solid hsl(220 15% 85%)', borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit' }} />
        </div>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Archivo PDF</label>
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '1.5rem', border: '2px dashed hsl(220 15% 80%)', borderRadius: 10, cursor: 'pointer', background: 'hsl(220 15% 98%)' }}>
            {file ? (
              <>
                <FileText size={28} color="hsl(221 89% 54%)" />
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(221 89% 40%)' }}>{file.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'hsl(220 10% 55%)' }}>{(file.size / 1024).toFixed(0)} KB</span>
              </>
            ) : (
              <>
                <Upload size={28} color="hsl(220 10% 60%)" />
                <span style={{ fontSize: '0.875rem', color: 'hsl(220 10% 50%)' }}>Tocá para seleccionar un PDF</span>
              </>
            )}
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
          </label>
        </div>
        <button onClick={handleProcess} disabled={loading || !file || !supplierId || !listDate}
          style={{ padding: '10px 20px', background: loading || !file || !supplierId || !listDate ? 'hsl(220 10% 70%)' : 'hsl(221 89% 54%)', color: 'white', border: 'none', borderRadius: 9, fontSize: '0.875rem', fontWeight: 500, cursor: loading || !file || !supplierId || !listDate ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {loading ? 'Procesando PDF...' : 'Procesar'}
        </button>
      </div>
    </div>
  )
  }
