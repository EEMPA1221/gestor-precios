'use client'

import { useState, useEffect } from 'react'
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Supplier { id: string; name: string }

export default function ImportarExcelPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [listDate, setListDate] = useState(new Date().toISOString().split('T')[0])
  const [archivo, setArchivo] = useState<File | null>(null)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/proveedores')
      .then(r => r.json())
      .then(data => setSuppliers(Array.isArray(data) ? data : []))
      .catch(() => setSuppliers([]))
  }, [])

  const descargarPlantilla = () => {
    window.open('/api/plantilla-excel', '_blank')
  }

  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setArchivo(file)
      setResultado(null)
      setError('')
    }
  }

  const handleProcesar = async () => {
    if (!archivo) { setError('Seleccioná un archivo'); return }
    if (!supplierId) { setError('Seleccioná un proveedor'); return }
    if (!listDate) { setError('Seleccioná una fecha'); return }

    setCargando(true)
    setError('')
    setResultado(null)

    try {
      const formData = new FormData()
      formData.append('file', archivo)
      formData.append('supplierId', supplierId)
      formData.append('listDate', listDate)

      const res = await fetch('/api/import-excel', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al procesar')
        return
      }

      setResultado(data)
    } catch (e: any) {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 640 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        Importar lista desde Excel
      </h1>
      <p style={{ color: 'rgba(0,0,0,0.5)', marginBottom: '2rem' }}>
        Descargá la plantilla, completala y subila para importar productos.
      </p>

      {/* Paso 1 — Plantilla */}
      <div style={{
        background: 'white', border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: 12, padding: '1.25rem', marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'hsl(221 89% 54%)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700,
          }}>1</div>
          <h2 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>Descargar plantilla</h2>
        </div>
        <button onClick={descargarPlantilla} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 18px', borderRadius: 8,
          background: 'hsl(221 89% 54%)', color: 'white',
          border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem',
        }}>
          <Download size={15} /> Descargar plantilla Excel
        </button>
      </div>

      {/* Paso 2 — Datos */}
      <div style={{
        background: 'white', border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: 12, padding: '1.25rem', marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'hsl(221 89% 54%)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700,
          }}>2</div>
          <h2 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>Completar datos y subir</h2>
        </div>

        {/* Proveedor */}
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', marginBottom: 4 }}>
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

        {/* Fecha */}
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', marginBottom: 4 }}>
            Fecha de vigencia
          </label>
          <input
            type='date'
            value={listDate}
            onChange={e => setListDate(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.2)', fontSize: '0.875rem',
            }}
          />
        </div>

        {/* Archivo */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', marginBottom: 4 }}>
            Archivo Excel
          </label>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            border: '2px dashed rgba(0,0,0,0.15)', borderRadius: 10,
            padding: '1.25rem', cursor: 'pointer',
            background: archivo ? 'rgba(34,197,94,0.05)' : 'rgba(0,0,0,0.02)',
          }}>
            <input type='file' accept='.xlsx,.xls' onChange={handleArchivo} style={{ display: 'none' }} />
            <FileSpreadsheet size={26} color={archivo ? 'hsl(142 71% 45%)' : 'rgba(0,0,0,0.3)'} />
            <span style={{ fontSize: '0.875rem', color: archivo ? 'hsl(142 71% 35%)' : 'rgba(0,0,0,0.4)', fontWeight: archivo ? 500 : 400 }}>
              {archivo ? archivo.name : 'Tocá para seleccionar un .xlsx'}
            </span>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', borderRadius: 8, marginBottom: '0.75rem',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: 'hsl(0 72% 45%)', fontSize: '0.875rem',
          }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Botón procesar */}
        <button
          onClick={handleProcesar}
          disabled={cargando}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 8,
            background: cargando ? 'hsl(0 0% 75%)' : 'hsl(142 71% 40%)',
            color: 'white', border: 'none',
            cursor: cargando ? 'not-allowed' : 'pointer',
            fontWeight: 500, fontSize: '0.875rem',
          }}>
          <Upload size={15} />
          {cargando ? 'Procesando...' : 'Procesar Excel'}
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div style={{
          background: 'white', border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 12, padding: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
            <CheckCircle size={20} color='hsl(142 71% 40%)' />
            <span style={{ fontWeight: 600, color: 'hsl(142 71% 35%)' }}>
              ¡Importación exitosa!
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.6)', marginBottom: '0.5rem' }}>
            <strong>{resultado.productosImportados}</strong> productos importados de <strong>{resultado.proveedor}</strong>
          </p>
          {resultado.duplicadosOmitidos > 0 && (
            <p style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.4)', marginBottom: '0.5rem' }}>
              {resultado.duplicadosOmitidos} duplicados omitidos
            </p>
          )}
          {resultado.errores?.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'hsl(0 72% 45%)', fontWeight: 500 }}>
                Filas con errores ({resultado.errores.length}):
              </p>
              {resultado.errores.map((e: string, i: number) => (
                <p key={i} style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.5)' }}>• {e}</p>
              ))}
            </div>
          )}
          <button
            onClick={() => router.push('/listas')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              background: 'hsl(221 89% 54%)', color: 'white',
              border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem',
            }}>
            Ver en Listas de precios <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
        }
