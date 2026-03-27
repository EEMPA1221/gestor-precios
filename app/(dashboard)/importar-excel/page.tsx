'use client'

import { useState } from 'react'
import { Download, Upload, FileSpreadsheet } from 'lucide-react'

export default function ImportarExcelPage() {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)

  const descargarPlantilla = () => {
    window.open('/api/plantilla-excel', '_blank')
  }

  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setArchivo(file)
  }

  const handleSubir = async () => {
  if (!archivo) return

  setCargando(true)
  setResultado(null)
  }
  try {
    const formData = new FormData()
    formData.append('file', archivo)

    const res = await fetch('/api/import-excel', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Error al procesar el Excel')
    }

    setResultado(`Se procesaron ${data.items?.length ?? 0} productos correctamente`)
    console.log('Productos importados:', data.items)

  } catch (error: any) {
    setResultado(`Error: ${error.message}`)
  } finally {
    setCargando(false)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 600 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Importar lista desde Excel
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        Descargá la plantilla, completala y subila para importar productos.
      </p>

      {/* Paso 1 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
          Paso 1 — Descargar plantilla
        </h2>
        <button
          onClick={descargarPlantilla}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 8,
            background: 'hsl(221 89% 54%)', color: 'white',
            border: 'none', cursor: 'pointer', fontWeight: 500,
          }}>
          <Download size={16} />
          Descargar plantilla Excel
        </button>
      </div>

      {/* Paso 2 */}
      <div>
        <h2 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
          Paso 2 — Subir archivo completado
        </h2>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleArchivo}
          style={{ marginBottom: '0.75rem', display: 'block' }}
        />
        {archivo && (
          <p style={{ marginBottom: '0.75rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
            <FileSpreadsheet size={14} style={{ display: 'inline', marginRight: 4 }} />
            {archivo.name}
          </p>
        )}
        <button
          onClick={handleSubir}
          disabled={!archivo || cargando}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 8,
            background: archivo ? 'hsl(142 71% 45%)' : 'hsl(0 0% 70%)',
            color: 'white', border: 'none',
            cursor: archivo ? 'pointer' : 'not-allowed', fontWeight: 500,
          }}>
          <Upload size={16} />
          {cargando ? 'Procesando...' : 'Procesar Excel'}
        </button>
        {resultado && (
          <p style={{ marginTop: '1rem', color: 'hsl(142 71% 45%)', fontWeight: 500 }}>
            ✓ {resultado}
          </p>
        )}
      </div>
    </div>
  )
}
