'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Shield, Eye, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
  READONLY: 'Solo lectura',
}
const ROLE_CLASS: Record<string, string> = {
  ADMIN: 'badge badge-info',
  OPERATOR: 'badge badge-success',
  READONLY: 'badge badge-neutral',
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'OPERATOR' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    const res = await fetch('/api/usuarios')
    if (res.ok) setUsers(await res.json())
    else toast.error('Sin permiso para ver usuarios')
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Usuario creado')
      setShowModal(false)
      setForm({ name: '', email: '', password: '', role: 'OPERATOR' })
      fetchUsers()
    } else {
      const err = await res.json()
      toast.error(err.error ?? 'Error al crear usuario')
    }
  }

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Usuarios y permisos</h1>
          <p style={{ color: 'hsl(220 15% 50%)', fontSize: '0.875rem', marginTop: 2 }}>
            Solo administradores pueden gestionar usuarios
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: 'hsl(221 89% 54%)',
            color: 'white', border: 'none', borderRadius: 9,
            fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      <div style={{ background: 'white', border: '1px solid hsl(220 15% 88%)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(220 10% 55%)' }}>Cargando...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'hsl(221 89% 93%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, fontSize: '0.85rem', color: 'hsl(221 89% 40%)',
                        flexShrink: 0,
                      }}>
                        {user.name[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500 }}>{user.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'hsl(220 15% 45%)' }}>{user.email}</td>
                  <td>
                    <span className={ROLE_CLASS[user.role] ?? 'badge badge-neutral'}>
                      {user.role === 'ADMIN' && <Shield size={11} />}
                      {user.role === 'READONLY' && <Eye size={11} />}
                      {user.role === 'OPERATOR' && <Edit size={11} />}
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td>
                    <span className={user.active ? 'badge badge-success' : 'badge badge-neutral'}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'hsl(220 15% 50%)' }}>
                    {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '1rem',
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: 'white', borderRadius: 14, padding: '1.75rem',
            width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Nuevo usuario</h2>
            <form onSubmit={handleCreate}>
              {[
                { label: 'Nombre completo *', key: 'name', type: 'text', required: true },
                { label: 'Email *', key: 'email', type: 'email', required: true },
                { label: 'Contraseña *', key: 'password', type: 'password', required: true },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, marginBottom: 4 }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    required={f.required}
                    style={{
                      width: '100%', padding: '9px 12px',
                      border: '1.5px solid hsl(220 15% 88%)', borderRadius: 8,
                      fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                </div>
              ))}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, marginBottom: 4 }}>Rol</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: '1.5px solid hsl(220 15% 88%)', borderRadius: 8,
                    fontSize: '0.9rem', fontFamily: 'inherit', background: 'white',
                  }}
                >
                  <option value="OPERATOR">Operador</option>
                  <option value="READONLY">Solo lectura</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  padding: '8px 16px', border: '1px solid hsl(220 15% 88%)',
                  borderRadius: 8, background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem',
                }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{
                  padding: '8px 20px',
                  background: saving ? 'hsl(221 89% 65%)' : 'hsl(221 89% 54%)',
                  color: 'white', border: 'none', borderRadius: 8,
                  fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', fontSize: '0.875rem',
                }}>
                  {saving ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
