'use client'

import { useState } from 'react'
import { Download, Upload, FileSpreadsheet, CheckCircle } from 'lucide-react'

export default function ImportarExcelPage() {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)

  const descargarPlantilla = () => {
    window.open('/api/plantilla-excel', '_blank')
  }

  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setArchivo(file)
      setResultado(null)
    }
  }

  const handleSubir = async () => {
    if (!archivo) return
    setCargando(true)
    // TODO: implementar subida real al endpoint
    setTimeout(() => {
      setCargando(false)
      setResultado('Archivo recibido: ' + archivo.name)
    }, 1000)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 600 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Importar lista desde Excel
      </h1>
      <p style={{ color: 'rgba(0,0,0,0.5)', marginBottom: '2rem' }}>
        Descargá la plantilla, completala con tus productos y subila para importar.
      </p>

      {/* Paso 1 */}
      <div style={{
        background: 'white',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: 12,
        padding: '1.5rem',
        marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'hsl(221 89% 54%)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
          }}>1</div>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>
            Descargar plantilla
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.5)', marginBottom: '1rem' }}>
          Contiene las columnas correctas: Código, Producto, Presentación, Precio e IVA.
        </p>
        <button
          onClick={descargarPlantilla}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 8,
            background: 'hsl(221 89% 54%)', color: 'white',
            border: 'none', cursor: 'pointer', fontWeight: 500,
            fontSize: '0.875rem',
          }}>
          <Download size={16} />
          Descargar plantilla Excel
        </button>
      </div>

      {/* Paso 2 */}
      <div style={{
        background: 'white',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: 12,
        padding: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'hsl(221 89% 54%)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
          }}>2</div>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>
            Subir archivo completado
          </h2>
        </div>

        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 8,
          border: '2px dashed rgba(0,0,0,0.15)', borderRadius: 10,
          padding: '1.5rem', cursor: 'pointer', marginBottom: '1rem',
          background: archivo ? 'rgba(34,197,94,0.05)' : 'rgba(0,0,0,0.02)',
          transition: 'all 0.2s',
        }}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleArchivo}
            style={{ display: 'none' }}
          />
          <FileSpreadsheet size={28} color={archivo ? 'hsl(142 71% 45%)' : 'rgba(0,0,0,0.3)'} />
          {archivo ? (
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(142 71% 35%)' }}>
              {archivo.name}
            </span>
          ) : (
            <span style={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.4)' }}>
              Tocá para seleccionar un archivo .xlsx
            </span>
          )}
        </label>

        <button
          onClick={handleSubir}
          disabled={!archivo || cargando}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 8,
            background: archivo && !cargando ? 'hsl(142 71% 40%)' : 'hsl(0 0% 80%)',
            color: 'white', border: 'none',
            cursor: archivo && !cargando ? 'pointer' : 'not-allowed',
            fontWeight: 500, fontSize: '0.875rem',
            transition: 'all 0.2s',
          }}>
          <Upload size={16} />
          {cargando ? 'Procesando...' : 'Procesar Excel'}
        </button>

        {resultado && (
          <div style={{
            marginTop: '1rem', padding: '12px 16px', borderRadius: 8,
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
            display: 'flex', alignItems: 'center', gap: 8,
            color: 'hsl(142 71% 35%)', fontSize: '0.875rem', fontWeight: 500,
          }}>
            <CheckCircle size={16} />
            {resultado}
          </div>
        )}
      </div>
    </div>
  )
            }
