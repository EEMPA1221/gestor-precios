'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, TrendingUp, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError('Email o contraseña incorrectos')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #f5f0ff 100%)',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            background: 'hsl(221 89% 54%)',
            borderRadius: 14,
            marginBottom: '0.75rem',
          }}>
            <TrendingUp size={26} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'hsl(220 25% 10%)' }}>
            Gestor de Precios
          </h1>
          <p style={{ color: 'hsl(220 15% 45%)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Ingresá con tu cuenta
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: '2rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <form onSubmit={handleSubmit}>
            {/* Error */}
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'hsl(0 84% 96%)',
                color: 'hsl(0 84% 35%)',
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: '1.25rem',
                fontSize: '0.875rem',
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: 'hsl(220 25% 20%)',
                marginBottom: '0.5rem',
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1.5px solid hsl(220 15% 88%)',
                  borderRadius: 9,
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = 'hsl(221 89% 54%)'}
                onBlur={e => e.target.style.borderColor = 'hsl(220 15% 88%)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: 'hsl(220 25% 20%)',
                marginBottom: '0.5rem',
              }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 42px 10px 14px',
                    border: '1.5px solid hsl(220 15% 88%)',
                    borderRadius: 9,
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => e.target.style.borderColor = 'hsl(221 89% 54%)'}
                  onBlur={e => e.target.style.borderColor = 'hsl(220 15% 88%)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'hsl(220 10% 55%)',
                    display: 'flex',
                    padding: 0,
                  }}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px',
                background: loading ? 'hsl(221 89% 65%)' : 'hsl(221 89% 54%)',
                color: 'white',
                border: 'none',
                borderRadius: 9,
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                fontFamily: 'inherit',
                letterSpacing: '0.01em',
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        {/* Demo users hint */}
        <div style={{
          marginTop: '1.25rem',
          padding: '14px',
          background: 'white',
          borderRadius: 10,
          border: '1px solid hsl(220 15% 88%)',
          fontSize: '0.8rem',
          color: 'hsl(220 15% 45%)',
        }}>
          <p style={{ fontWeight: 500, marginBottom: '0.5rem', color: 'hsl(220 15% 30%)' }}>
            Usuarios de prueba:
          </p>
          <p>Admin: <code style={{ background: 'hsl(220 15% 94%)', padding: '1px 5px', borderRadius: 4 }}>admin@empresa.com</code> / admin123</p>
          <p style={{ marginTop: '0.25rem' }}>Operador: <code style={{ background: 'hsl(220 15% 94%)', padding: '1px 5px', borderRadius: 4 }}>maria@empresa.com</code> / op123</p>
        </div>
      </div>
    </div>
  )
}
