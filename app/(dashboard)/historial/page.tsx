'use client'

import { useState, useEffect } from 'react'
import { History, User, Search } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const ACTION_LABELS: Record<string, { label: string; class: string }> = {
  CREATE:  { label: 'Creó',    class: 'badge badge-success' },
  UPDATE:  { label: 'Editó',   class: 'badge badge-info'    },
  DELETE:  { label: 'Eliminó', class: 'badge badge-danger'  },
  UPLOAD:  { label: 'Subió',   class: 'badge badge-info'    },
  MATCH:   { label: 'Asoció',  class: 'badge badge-neutral' },
}

export default function HistorialPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchLogs() }, [])

  async function fetchLogs() {
    setLoading(true)
    const res = await fetch('/api/historial')
    const data = await res.json()
    setLogs(data.logs ?? [])
    setLoading(false)
  }

  const filtered = logs.filter(l =>
    (l.user?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (l.detail ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (l.entity ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Historial de cambios</h1>
          <p style={{ color: 'hsl(220 15% 50%)', fontSize: '0.875rem', marginTop: 2 }}>
            Auditoría de todas las acciones del sistema
          </p>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: 360 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(220 10% 55%)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar en historial..."
          style={{
            width: '100%', padding: '9px 12px 9px 36px',
            border: '1.5px solid hsl(220 15% 88%)', borderRadius: 9,
            fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>

      <div style={{ background: 'white', border: '1px solid hsl(220 15% 88%)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(220 10% 55%)' }}>Cargando historial...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <History size={36} color="hsl(220 10% 70%)" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ color: 'hsl(220 10% 55%)', fontSize: '0.9rem' }}>Sin registros</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const action = ACTION_LABELS[log.action] ?? { label: log.action, class: 'badge badge-neutral' }
                return (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'hsl(220 15% 45%)' }}>
                      {format(new Date(log.createdAt), "dd/MM/yy HH:mm", { locale: es })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: 'hsl(221 89% 93%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <User size={13} color="hsl(221 89% 45%)" />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{log.user?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={action.class}>{action.label}</span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'hsl(220 15% 45%)' }}>{log.entity}</td>
                    <td style={{ fontSize: '0.85rem', maxWidth: 400 }}>{log.detail ?? '—'}</td>
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
